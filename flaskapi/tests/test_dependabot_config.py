"""Regression test for SPEC.md V35rx: Dependabot policy stays predictable.

Each ecosystem must produce one grouped weekly update on Monday at 03:00 in
the repository's explicit timezone, rather than relying on Dependabot's
unspecified default schedule or emitting one PR per dependency.
"""

import re
from pathlib import Path

import pytest

pytestmark = pytest.mark.unit

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG = REPO_ROOT / ".github" / "dependabot.yml"


def _update_blocks() -> list[str]:
    content = CONFIG.read_text()
    return re.findall(r"(?ms)^  - package-ecosystem:.*?(?=^  - package-ecosystem:|\Z)", content)


def test_v35rx_dependabot_updates_are_grouped_and_scheduled():
    blocks = _update_blocks()

    # Exact (ecosystem, directory) coverage: npm+uv for the two package trees,
    # github-actions for the pinned workflow actions, docker for each
    # production Dockerfile (the e2e Playwright container pin in ci.yml is
    # hand-managed in lock-step with @playwright/test and stays out of scope).
    assert {
        (
            re.search(r"package-ecosystem: (\S+)", block).group(1),
            re.search(r"directory: (\S+)", block).group(1),
        )
        for block in blocks
    } == {
        ("npm", "/node"),
        ("uv", "/flaskapi"),
        ("github-actions", "/"),
        ("docker", "/flaskapi"),
        ("docker", "/node"),
        ("docker", "/proxy"),
    }
    assert len(blocks) == 6

    for block in blocks:
        assert "target-branch: develop" in block
        assert "interval: weekly" in block
        assert "day: monday" in block
        assert 'time: "03:00"' in block
        assert "timezone: Europe/Zurich" in block
        assert re.search(
            r"(?m)^    groups:\n      \S+-dependencies:\n        patterns:\n          - \"\*\"",
            block,
        )
