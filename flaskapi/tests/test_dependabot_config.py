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

    assert len(blocks) == 2
    assert {re.search(r"package-ecosystem: (\S+)", block).group(1) for block in blocks} == {
        "npm",
        "uv",
    }

    for block in blocks:
        assert "interval: weekly" in block
        assert "day: monday" in block
        assert 'time: "03:00"' in block
        assert "timezone: Europe/Zurich" in block
        assert re.search(
            r"(?m)^    groups:\n      \S+-dependencies:\n        patterns:\n          - \"\*\"",
            block,
        )
