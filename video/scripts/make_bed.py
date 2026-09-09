#!/usr/bin/env python3
"""Generate the ambient bed at video/audio/bed.wav — 100% procedural, zero
copyright risk (ffmpeg noise + sine sources only; nothing is downloaded).

Usage (from the video/ directory):
    python3 scripts/make_bed.py [--seconds 170] [--lufs -54]

The bed exists to remove digital silence, not to score the piece: the judge
noted the gaps read as dropouts (-inf noise floor) rather than as beats. It is
deliberately near-subliminal and non-rhythmic.

Construction — three slowly breathing layers, no transients, no pulse:
  * "air"   — brown noise band-limited to 280-1500 Hz, independent seeds per
              channel so the stereo image is wide and decorrelated
  * "deep"  — brown noise under 320 Hz, mono (bass stays centered)
  * "drone" — 55 Hz + 82.5 Hz sines (a fifth) under a 200 Hz lowpass
Each layer has its own very slow amplitude LFO with a mutually prime period
(29 s / 41 s / 53 s), so the layers drift in and out of phase and the timbre
keeps moving without ever establishing a rhythm the narration could fight.

Two passes: build at unity, measure the result with ebur128, then re-render
with the exact gain needed to land on the target loudness.
"""

import argparse
import subprocess
import sys
from pathlib import Path

VIDEO_DIR = Path(__file__).resolve().parent.parent
BED_WAV = VIDEO_DIR / "audio" / "bed.wav"

# ~-40 dB below the -14 LUFS narration: present, never noticed.
DEFAULT_LUFS = -54.0
DEFAULT_SECONDS = 170  # covers the ~150s render with head/tail slack
# 24 kHz matches the narration clips and is far above what the bed needs: no
# layer carries energy above 1.5 kHz, so 48 kHz would only double the file size.
SAMPLE_RATE = 24000
FADE = 4.0  # seconds, in and out


def build_filter(seconds: float, gain_db: float) -> str:
    lfo = "0.55+0.45*sin(2*PI*t/{period}{phase})"
    return (
        # air: band-limited brown noise, decorrelated per channel
        f"[0]highpass=f=280,lowpass=f=1500,"
        f"volume='{lfo.format(period=29, phase='')}':eval=frame[airL];"
        f"[1]highpass=f=280,lowpass=f=1500,"
        f"volume='{lfo.format(period=29, phase='+2.1')}':eval=frame[airR];"
        # deep: mono low rumble
        f"[2]lowpass=f=320,"
        f"volume='{lfo.format(period=41, phase='')}':eval=frame[deep];"
        # drone: two sines a fifth apart, heavily filtered
        f"[3][4]amix=inputs=2,lowpass=f=200,"
        f"volume='{lfo.format(period=53, phase='')}':eval=frame[drone];"
        # the low layer is shared by both channels, so it must be split
        # explicitly — a filter label can only be consumed once
        f"[deep][drone]amix=inputs=2:weights=1 0.6,asplit=2[lowL][lowR];"
        f"[airL][lowL]amix=inputs=2:weights=1 0.8[L];"
        f"[airR][lowR]amix=inputs=2:weights=1 0.8[R];"
        f"[L][R]join=inputs=2:channel_layout=stereo,"
        f"afade=t=in:st=0:d={FADE},"
        f"afade=t=out:st={seconds - FADE}:d={FADE},"
        f"volume={gain_db}dB[out]"
    )


def render(path: Path, seconds: float, gain_db: float) -> None:
    src = lambda spec: ["-f", "lavfi", "-i", spec]  # noqa: E731
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error"]
        + src(f"anoisesrc=color=brown:sample_rate={SAMPLE_RATE}:seed=1101:duration={seconds}")
        + src(f"anoisesrc=color=brown:sample_rate={SAMPLE_RATE}:seed=2202:duration={seconds}")
        + src(f"anoisesrc=color=brown:sample_rate={SAMPLE_RATE}:seed=3303:duration={seconds}")
        + src(f"sine=frequency=55:sample_rate={SAMPLE_RATE}:duration={seconds}")
        + src(f"sine=frequency=82.5:sample_rate={SAMPLE_RATE}:duration={seconds}")
        + [
            "-filter_complex", build_filter(seconds, gain_db),
            "-map", "[out]", "-c:a", "pcm_s16le", "-ar", str(SAMPLE_RATE),
            str(path),
        ],
        check=True,
    )


def measure(path: Path) -> tuple[float, float]:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path),
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    )
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
    ap.add_argument("--seconds", type=float, default=DEFAULT_SECONDS)
    ap.add_argument("--lufs", type=float, default=DEFAULT_LUFS,
                    help="target integrated loudness for the bed")
    args = ap.parse_args()

    BED_WAV.parent.mkdir(parents=True, exist_ok=True)
    print(f"pass 1: building {args.seconds:.0f}s bed at unity ...")
    render(BED_WAV, args.seconds, 0.0)
    unity_lufs, _ = measure(BED_WAV)
    gain = args.lufs - unity_lufs
    print(f"        unity = {unity_lufs} LUFS; applying {gain:+.2f} dB")

    print(f"pass 2: rendering at {args.lufs} LUFS ...")
    render(BED_WAV, args.seconds, gain)
    lufs, peak = measure(BED_WAV)
    print(f"bed: {BED_WAV}")
    print(f"     {args.seconds:.0f}s, {SAMPLE_RATE} Hz stereo, "
          f"{lufs} LUFS integrated, peak {peak} dBFS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
