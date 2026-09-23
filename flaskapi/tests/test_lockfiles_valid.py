"""
Regression test for SPEC.md B20lt/V34lt: dependency lockfiles must be valid
and tool-generated. Commit 2df63a1 resolved `flaskapi/uv.lock` `requires-dist`
by hand-editing a cherry-pick/merge instead of re-running `uv lock`, leaving
raw git conflict markers (`<<<<<<< HEAD`) → the lockfile was invalid TOML
(`missing comma between array elements`), so `uv lock --check` failed and the
flaskapi CI broke.
"""

import json
import tomllib
from pathlib import Path

import pytest

pytestmark = pytest.mark.unit

REPO_ROOT = Path(__file__).resolve().parents[2]

CONFLICT_MARKERS = ("<<<<<<<", "=======", ">>>>>>>")

LOCKFILES = [
    Path("flaskapi/uv.lock"),
    Path("node/package-lock.json"),
]


@pytest.mark.parametrize("relative", LOCKFILES, ids=lambda p: str(p))
def test_lockfile_has_no_conflict_markers(relative):
    content = (REPO_ROOT / relative).read_text()
    for marker in CONFLICT_MARKERS:
        assert marker not in content, (
            f"{relative}: must not contain git conflict marker `{marker}` — "
            "lockfiles are tool-generated (uv lock / npm install), never "
            "hand-edited to resolve a merge (V34lt/B20lt)"
        )


def test_uv_lock_parses_as_toml():
    path = REPO_ROOT / "flaskapi" / "uv.lock"
    # Raises tomllib.TOMLDecodeError on invalid content.
    tomllib.loads(path.read_text())


def test_package_lock_parses_as_json():
    path = REPO_ROOT / "node" / "package-lock.json"
    # Raises json.JSONDecodeError on invalid content.
    json.loads(path.read_text())
