"""Guards the write-mode e2e launch-action readiness contract (root SPEC §V47rv, §B31rv).

A Playwright actionability-checked click dispatched while the campaign panel is still
re-rendering (job-collection rows / sampling-points default / accordion collapse commits)
can land on a replaced DOM node: the handler never runs and NO request leaves the page
(CI ARIA snapshot evidence, B31rv). The readiness oracle has two halves — awaited
`networkidle` (late async arrivals) AND awaited `expectLaunchPanelSettled` (same-button-node
at same position across consecutive frames; network-invisible React/Collapse commits are
exactly what networkidle cannot see, GH-Copilot #752) — and write-mode tests must budget
for the serialized single-threaded e2e backend.

The guards match the AWAITED call forms and check each test individually, so dropping an
`await`, commenting out a budget, or moving one test's `test.slow()` into another test
still redden this file (GH-Copilot #752 review).
"""

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[2]
SPEC = ROOT / "tests" / "e2e" / "sumo-write.spec.ts"
HELPERS = ROOT / "tests" / "e2e" / "helpers.ts"

# Awaited statements (a bare expression without `await` does not wait — reject it).
AWAITED_NETWORKIDLE = re.compile(
    r"^\s*await page\.waitForLoadState\(\"networkidle\"\);", flags=re.MULTILINE
)
AWAITED_SETTLED = re.compile(r"^\s*await expectLaunchPanelSettled\(", flags=re.MULTILINE)
# A real statement line: a commented-out `// test.slow();` does not match; a trailing
# end-of-line comment is allowed.
SLOW_STATEMENT = re.compile(r"^\s+test\.slow\(\);(\s*//.*)?$", flags=re.MULTILINE)
TEST_START = re.compile(r"^test\(\"", flags=re.MULTILINE)


@pytest.mark.unit
def test_launch_click_is_preceded_by_awaited_readiness_waits():
    """Both awaited readiness waits must appear AFTER acquiring run-sampling-btn and BEFORE any launch action."""
    source = SPEC.read_text(encoding="utf-8")

    assert AWAITED_NETWORKIDLE.search(source), (
        'spec lacks `await page.waitForLoadState("networkidle")` (V47rv)'
    )
    assert AWAITED_SETTLED.search(source), (
        "spec lacks `await expectLaunchPanelSettled(...)` (V47rv)"
    )

    acquired = source.index("run-sampling-btn")
    first_action = min(
        idx
        for idx in (
            source.find("runButton.click()"),
            source.find("runButton.dblclick()"),
        )
        if idx != -1
    )
    for pattern in (AWAITED_NETWORKIDLE, AWAITED_SETTLED):
        pos = pattern.search(source).start()
        assert acquired < pos < first_action, (
            f"awaited readiness wait at {pos} does not sit between button acquisition "
            f"({acquired}) and the first launch action ({first_action}) (V47rv/B31rv)"
        )


@pytest.mark.unit
def test_settle_helper_pins_node_identity_mechanism():
    """expectLaunchPanelSettled must be the node-identity/frame-stability oracle, not a sleep
    or a re-enabled check — networkidle alone resolves instantly on an idle page (B31rv, #752)."""
    source = HELPERS.read_text(encoding="utf-8")

    match = re.search(r"export async function expectLaunchPanelSettled\(", source)
    assert match, "helpers.ts must export expectLaunchPanelSettled (V47rv)"
    body = source[match.start() :]
    assert "waitForFunction" in body, (
        "settle oracle must poll via page.waitForFunction (rAF frame checks)"
    )
    assert "el === settle.node" in body, "settle oracle must demand the SAME DOM node across frames"
    assert "getBoundingClientRect" in body, (
        "settle oracle must demand an unchanged position across frames"
    )
    assert "el.disabled" in body, "settle oracle must require the Run button to be enabled"


@pytest.mark.unit
def test_every_write_mode_test_budgets_serialized_backend_compute():
    """Each test body individually must carry a real (non-commented) `test.slow()` statement:
    the serialized e2e backend's model compute must not consume the default 120s budget on a
    busy CI runner (root V47rv/B31rv). Counting occurrences file-wide would let one commented
    budget + one duplicate in another test pass — so this checks per-test bodies."""
    source = SPEC.read_text(encoding="utf-8")

    starts = [m.start() for m in TEST_START.finditer(source)]
    assert len(starts) >= 3
    bodies = [
        source[start : starts[i + 1] if i + 1 < len(starts) else len(source)]
        for i, start in enumerate(starts)
    ]
    unbudgeted = [
        re.match(r'test\("([^"]+)', body).group(1)
        for body in bodies
        if not SLOW_STATEMENT.search(body)
    ]
    assert not unbudgeted, f"tests without a real test.slow() statement: {unbudgeted} (V47rv/B31rv)"
