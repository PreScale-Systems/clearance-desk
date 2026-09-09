#!/usr/bin/env python3
"""Generate voiceover clips for every scene in script/narration.json.

Usage (from the video/ directory):
    .tts-venv/bin/python scripts/make_vo.py [--voice VOICE] [--force]
    .tts-venv/bin/python scripts/make_vo.py --remeasure   # re-derive the gain

Reads  : video/script/narration.json    — array of {id, narration, ...}
Writes : video/audio/raw/scene-<id>.wav — untouched TTS output (synthesis cache)
         video/audio/scene-<id>.wav     — loudness-normalized delivery clips,
                                          24 kHz mono 16-bit PCM (what Remotion uses)
         video/audio/durations.json     — {"<id>": seconds} measured with ffprobe

Two stages:
  1. Synthesis (cached) — a raw scene wav is only re-synthesized when it is
     missing or when the narration/voice changed (a .txt sidecar caches the
     input). Synthesis is NOT deterministic, so raw clips are never rebuilt
     unnecessarily: a re-run must not silently change audio the editor approved.
  2. Loudness normalization (always, deterministic) — every raw clip gets the
     SAME uniform gain plus a shared true-peak ceiling, so scene-to-scene
     relative levels and the natural dynamics are preserved. This never changes
     a clip's duration; durations.json is re-measured from the delivery wavs.

Use --force to re-synthesize everything.
"""

import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

VIDEO_DIR = Path(__file__).resolve().parent.parent
NARRATION_JSON = VIDEO_DIR / "script" / "narration.json"
AUDIO_DIR = VIDEO_DIR / "audio"
RAW_DIR = AUDIO_DIR / "raw"
DURATIONS_JSON = AUDIO_DIR / "durations.json"

DEFAULT_VOICE = "alba"  # chosen narrator voice, see SOUND-NOTES.md

# --- Loudness normalization -------------------------------------------------
# Measured across the concatenation of all raw scenes, then applied per scene as
# ONE uniform gain (never per-file normalization, which would flatten the
# intentional scene-to-scene dynamics) plus a shared true-peak ceiling.
# Raw VO measures -19.7 LUFS / -1.3 dBTP; +8.0 dB into a -2.5 dBFS limiter
# lands on -14.0 LUFS / -1.2 dBTP. Re-derive with --remeasure after re-synthesis.
TARGET_LUFS = -14.0
NORMALIZE_GAIN_DB = 8.0
LIMITER_CEILING_DB = -2.5  # sample-peak ceiling; keeps true peak at -1.2 dBTP
NORMALIZE_FILTER = (
    f"volume={NORMALIZE_GAIN_DB}dB,"
    f"alimiter=limit={LIMITER_CEILING_DB}dB:attack=5:release=60:level=disabled"
)

# Pronunciation fixes applied to the TTS input ONLY — narration.json is never
# edited. Keys are matched verbatim (case-sensitive). See SOUND-NOTES.md.
TTS_SUBSTITUTIONS: dict[str, str] = {}

# Scene-internal beats requested via "tts_note" in narration.json: the scene is
# synthesized in two takes split after the marker substring, joined with the
# given seconds of silence. (Distinct from "hold_seconds", which is a silent
# hold AFTER the VO and belongs to the Remotion comp, not these wavs.)
SCENE_SPLITS: dict[str, tuple[str, float]] = {
    "10": ("until now.", 0.5),
}


def tts_segments(sid: str, text: str) -> tuple[list[str], float]:
    """Return (segments, pause_seconds) for a scene's TTS input."""
    for old, new in TTS_SUBSTITUTIONS.items():
        text = text.replace(old, new)
    if sid in SCENE_SPLITS:
        marker, pause = SCENE_SPLITS[sid]
        idx = text.find(marker)
        if idx != -1:
            cut = idx + len(marker)
            return [text[:cut].strip(), text[cut:].strip()], pause
    return [text], 0.0


def cache_key(voice: str, sid: str, text: str) -> str:
    segs, pause = tts_segments(sid, text)
    return f"{voice}|pause={pause}\n" + "\n---\n".join(segs)


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    return round(float(out), 3)


def save_wav(path: Path, audio, sample_rate: int) -> None:
    """audio: torch.Tensor [channels, samples], float in [-1, 1]."""
    import torch

    pcm = (audio.clamp(-1, 1) * 32767).to(torch.int16)
    if pcm.dim() == 2:  # take/mix down first channel (model output is mono anyway)
        pcm = pcm[0]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.numpy().tobytes())


def normalize_scene(raw: Path, out: Path) -> None:
    """Apply the shared uniform gain + true-peak ceiling. Duration-preserving."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error", "-i", str(raw),
            "-af", NORMALIZE_FILTER,
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            str(out),
        ],
        check=True,
    )


def measure_loudness(paths: list[Path], filt: str | None = None) -> tuple[float, float]:
    """Integrated LUFS and true peak (dBTP) across the concatenation of paths."""
    concat = AUDIO_DIR / ".concat-measure.txt"
    concat.write_text("".join(f"file '{p.resolve()}'\n" for p in paths))
    af = f"{filt}," if filt else ""
    proc = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-f", "concat", "-safe", "0",
            "-i", str(concat), "-af", f"{af}ebur128=peak=true", "-f", "null", "-",
        ],
        capture_output=True, text=True,
    )
    concat.unlink(missing_ok=True)
    lufs = peak = float("nan")
    for line in proc.stderr.splitlines():
        s = line.strip()
        if s.startswith("I:") and "LUFS" in s:
            lufs = float(s.split()[1])
        elif s.startswith("Peak:") and "dBFS" in s:
            peak = float(s.split()[1])
    return lufs, peak


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=DEFAULT_VOICE,
                    help="pocket-tts predefined voice name or audio file/url")
    ap.add_argument("--force", action="store_true",
                    help="re-synthesize every scene even if up to date")
    ap.add_argument("--remeasure", action="store_true",
                    help="measure the raw VO and print the gain needed for the "
                         "target LUFS, then exit (update NORMALIZE_GAIN_DB by hand)")
    args = ap.parse_args()

    if args.remeasure:
        raws = sorted(RAW_DIR.glob("scene-*.wav"))
        if not raws:
            print(f"ERROR: no raw scenes in {RAW_DIR}")
            return 1
        lufs, peak = measure_loudness(raws)
        print(f"raw VO: {lufs} LUFS integrated, true peak {peak} dBTP")
        print(f"gain for {TARGET_LUFS} LUFS (before limiting): "
              f"{TARGET_LUFS - lufs:+.1f} dB")
        print("The limiter gives back some loudness, so sweep NORMALIZE_GAIN_DB "
              "upward from there until the normalized measurement hits the target "
              "with true peak <= -1 dBTP.")
        return 0

    if not NARRATION_JSON.exists():
        print(f"ERROR: {NARRATION_JSON} not found — script writer hasn't delivered yet.")
        return 1

    scenes = json.loads(NARRATION_JSON.read_text())
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Work out which scenes actually need synthesis before paying model-load cost.
    todo = []
    for scene in scenes:
        sid, text = str(scene["id"]), scene["narration"].strip()
        wav = RAW_DIR / f"scene-{sid}.wav"
        sidecar = RAW_DIR / f"scene-{sid}.txt"
        stale = (
            args.force
            or not wav.exists()
            or not sidecar.exists()
            or sidecar.read_text() != cache_key(args.voice, sid, text)
        )
        if stale:
            todo.append((sid, text, wav, sidecar))

    if todo:
        from pocket_tts import TTSModel  # deferred: import is slow

        print(f"Loading pocket-tts model (voice={args.voice}) ...")
        model = TTSModel.load_model()  # default English model
        voice_state = model.get_state_for_audio_prompt(args.voice)
        import torch

        for sid, text, wav, sidecar in todo:
            segs, pause = tts_segments(sid, text)
            note = f", {len(segs)} takes + {pause}s beat" if len(segs) > 1 else ""
            print(f"  synthesizing scene {sid} ({len(text.split())} words{note})")
            takes = [model.generate_audio(voice_state, s, copy_state=True) for s in segs]
            # normalize to 1-D [samples] (generate_audio returns 1-D; be tolerant)
            takes = [t if t.dim() == 1 else t[0] for t in takes]
            if len(takes) > 1:
                silence = torch.zeros(int(pause * model.sample_rate))
                pieces = []
                for i, t in enumerate(takes):
                    pieces.append(t)
                    if i < len(takes) - 1:
                        pieces.append(silence)
                audio = torch.cat(pieces, dim=0)
            else:
                audio = takes[0]
            save_wav(wav, audio, model.sample_rate)
            sidecar.write_text(cache_key(args.voice, sid, text))
    else:
        print("All raw scene wavs up to date; nothing to synthesize.")

    # --- Loudness normalization: same gain for every scene, always rerun ------
    print(f"Normalizing to {TARGET_LUFS} LUFS "
          f"({NORMALIZE_GAIN_DB:+} dB into a {LIMITER_CEILING_DB} dBFS ceiling) ...")
    previous = json.loads(DURATIONS_JSON.read_text()) if DURATIONS_JSON.exists() else {}
    durations, moved = {}, []
    for scene in scenes:
        sid = str(scene["id"])
        raw, out = RAW_DIR / f"scene-{sid}.wav", AUDIO_DIR / f"scene-{sid}.wav"
        normalize_scene(raw, out)
        raw_dur, durations[sid] = ffprobe_duration(raw), ffprobe_duration(out)
        flag = ""
        if abs(raw_dur - durations[sid]) > 0.0005:
            flag = f"  !! duration changed from raw {raw_dur:.3f}s"
            moved.append(sid)
        if sid in previous and abs(previous[sid] - durations[sid]) > 0.0005:
            flag += f"  !! was {previous[sid]:.3f}s in durations.json"
            moved.append(sid)
        print(f"  scene-{sid}.wav  {durations[sid]:6.2f}s{flag}")

    DURATIONS_JSON.write_text(json.dumps(durations, indent=2) + "\n")
    total = sum(durations.values())
    print(f"Total narration: {total:.1f}s  -> {DURATIONS_JSON}")
    if total > 170:
        print("WARNING: narration exceeds the 170s budget from BRIEF.md")

    lufs, peak = measure_loudness(
        [AUDIO_DIR / f"scene-{s['id']}.wav" for s in scenes]
    )
    print(f"Delivered loudness: {lufs} LUFS integrated, true peak {peak} dBTP")
    if peak > -1.0:
        print("WARNING: true peak exceeds -1 dBTP — lower LIMITER_CEILING_DB")
    if moved:
        print(f"WARNING: durations changed for scenes {sorted(set(moved))} — "
              "timeline.ts derives scene lengths from durations.json, tell the "
              "Remotion developer")
    else:
        print("Durations unchanged (normalization is duration-preserving).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
