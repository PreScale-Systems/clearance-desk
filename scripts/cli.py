"""Run the clearance pipeline from the command line and print the markdown report.

    python scripts/cli.py data/scripts/the_ledger_v1.fountain > report.md
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.jobs import Job, render_report_markdown, run_job  # noqa: E402


async def main(path: str):
    text = Path(path).read_text()
    job = Job(id="cli", script_name=Path(path).name, script_text=text)
    await run_job(job)
    if job.error:
        print(job.error, file=sys.stderr)
        sys.exit(1)
    print(render_report_markdown(job))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
