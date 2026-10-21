"""Guards the write-mode e2e launch-action readiness contract (root SPEC §V47rv, §B31rv).

A Playwright actionability-checked click dispatched while the campaign panel is still
re-rendering (job-collection rows / sampling-points default / accordion collapse commits)
can land on a replaced DOM node: the handler never runs and NO request leaves the page
(CI ARIA snapshot evidence, B31rv). The readiness oracle has two halves — awaited
`networkidle` (late async arrivals) AND awaited `expectLaunchPanelSettled` (same-button-node
at the same rect across consecutive frames; network-invisible React/Collapse commits are
exactly what networkidle cannot see, GH-Copilot #752) — carried by the shared
`openLhsCampaign` flow, which every launch-action site must go through. Write-mode tests
must also budget for the serialized single-threaded e2e backend.

The guards match the AWAITED call forms, pair every action site with the readiness flow,
check the handoff inside that flow, and check each test individually for its budget — so
dropping an `await`, bypassing the helper with a fresh locator, commenting out a budget, or
moving one test's `test.slow()` into another test all redden this file
(GH-Copilot #752 + alexpargon #752 review).
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
ACTION_SITE = re.compile(r"runButton\.(?:dbl)?click\(\)")
READINESS_FLOW_CALL = "await openLhsCampaign("
OPEN_FLOW_DEF = re.compile(r"async function openLhsCampaign\(.*?\n\}", flags=re.DOTALL)


def _test_bodies(source: str) -> list[str]:
    starts = [m.start() for m in TEST_START.finditer(source)]
    return [
        source[start : starts[i + 1] if i + 1 < len(starts) else len(source)]
        for i, start in enumerate(starts)
    ]


@pytest.mark.unit
def test_readiness_flow_waits_between_button_handoff_and_return():
    """The shared openLhsCampaign flow must await BOTH readiness forms AFTER acquiring
    run-sampling-btn and BEFORE returning it (V47rv). Awaited forms only: dropping the
    `await` reddens (GH-Copilot #752)."""
    source = SPEC.read_text(encoding="utf-8")

    flow = OPEN_FLOW_DEF.search(source)
    assert flow, "spec must keep the shared openLhsCampaign flow that carries launch readiness"
    body = flow.group(0)

    acquired = body.index("run-sampling-btn")
    returned = body.index("return runButton")
    for pattern, label in (
        (AWAITED_NETWORKIDLE, 'await page.waitForLoadState("networkidle");'),
        (AWAITED_SETTLED, "await expectLaunchPanelSettled("),
    ):
        wait = pattern.search(body)
        assert wait, f"openLhsCampaign lacks the awaited form `{label}` (V47rv/B31rv)"
        assert acquired < wait.start() < returned, (
            f"awaited readiness wait `{label}` at {wait.start()} does not sit between button "
            f"acquisition ({acquired}) and `return runButton` ({returned}) (V47rv)"
        )


@pytest.mark.unit
def test_every_launch_action_site_goes_through_the_readiness_flow():
    """Per action site (∀, alexpargon #752): every test body that dispatches a launch click
    must reach it through `await openLhsCampaign(...)` BEFORE the action — a future test that
    grabs a fresh run-sampling-btn locator and clicks it sails nowhere past this guard."""
    source = SPEC.read_text(encoding="utf-8")

    action_sites = list(ACTION_SITE.finditer(source))
    assert action_sites, (
        "sumo-write.spec.ts contains no runButton click/dblclick sites — if the write flows were "
        "moved, this guard and V47rv must move with them (legibility over silent green)"
    )

    for body in _test_bodies(source):
        action = ACTION_SITE.search(body)
        if action is None:
            continue
        name = re.match(r"test\(\"([^\"]+)", body).group(1)
        flow_call = body.find(READINESS_FLOW_CALL)
        assert flow_call != -1 and flow_call < action.start(), (
            f"launch action at offset {action.start()} in test {name!r} is not preceded by "
            f"`{READINESS_FLOW_CALL}` — dispatching without the readiness flow reintroduces "
            "the swallowed-click class (V47rv/B31rv)"
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
        "settle oracle must demand an unchanged rect across frames"
    )
    assert "top === settle.top" in body, (
        "settle oracle must COMPARE the tracked top, not just assign it"
    )
    assert "left === settle.left" in body, (
        "settle oracle must COMPARE the tracked left, not just assign it (alexpargon #752)"
    )
    assert "el.disabled" in body, "settle oracle must require the Run button to be enabled"


@pytest.mark.unit
def test_every_write_mode_test_budgets_serialized_backend_compute():
    """Each test body individually must carry a real (non-commented) `test.slow()` statement:
    the serialized e2e backend's model compute must not consume the default 120s budget on a
    busy CI runner (root V47rv/B31rv). Counting occurrences file-wide would let one commented
    budget + one duplicate in another test pass — so this checks per-test bodies."""
    source = SPEC.read_text(encoding="utf-8")

    bodies = _test_bodies(source)
    assert len(bodies) >= 3
    unbudgeted = [
        re.match(r'test\("([^"]+)', body).group(1)
        for body in bodies
        if not SLOW_STATEMENT.search(body)
    ]
    assert not unbudgeted, f"tests without a real test.slow() statement: {unbudgeted} (V47rv/B31rv)"
