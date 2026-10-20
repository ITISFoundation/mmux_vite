"""Guards the write-mode e2e launch-action quiescence contract (root SPEC §V47rv, §B31rv).

A Playwright actionability-checked click dispatched while the campaign panel is still
re-rendering (job-collection rows / sampling-points default / accordion collapse commits)
can land on a replaced DOM node: the handler never runs and NO request leaves the page
(CI ARIA snapshot evidence, B31rv). The read-only specs already wait for network
quiescence before driving flows; the write spec must not be the one spec that clicks a
still-settling panel — and its tests must budget for the serialized single-threaded
e2e backend instead of silently racing the default 120s test wall.
"""

import re
from pathlib import Path

import pytest

SPEC = Path(__file__).parents[2] / "tests" / "e2e" / "sumo-write.spec.ts"


@pytest.mark.unit
def test_launch_click_is_preceded_by_quiescence_wait():
    """`networkidle` must be awaited AFTER acquiring run-sampling-btn and BEFORE any launch action."""
    source = SPEC.read_text(encoding="utf-8")

    assert 'waitForLoadState("networkidle")' in source, (
        "sumo-write.spec.ts never awaits network quiescence before driving the launch "
        "flow (root V47rv / B31rv)"
    )
    acquired = source.index("run-sampling-btn")
    quiescent = source.index('waitForLoadState("networkidle")')
    first_action = min(
        idx
        for idx in (
            source.find("runButton.click()"),
            source.find("runButton.dblclick()"),
        )
        if idx != -1
    )

    assert acquired < quiescent < first_action, (
        "sumo-write.spec.ts clicks Run without awaiting panel quiescence after acquiring "
        "the button (root V47rv): visible heading != settled panel — clicks get swallowed "
        "mid-re-render (B31rv)"
    )


@pytest.mark.unit
def test_write_mode_tests_budget_serialized_backend_compute():
    """Every write-mode test opts into `test.slow()`: model compute on the serialized e2e
    backend must not consume the default 120s budget on a busy CI runner (root V47rv/B31rv)."""
    source = SPEC.read_text(encoding="utf-8")

    n_tests = len(re.findall(r'^test\("', source, flags=re.MULTILINE))
    n_slow = source.count("test.slow()")

    assert n_tests >= 3
    assert n_slow >= n_tests, (
        f"{n_tests} tests but only {n_slow} test.slow(): a serialized-backend launch test "
        "left on the default budget flakes under CI load (B31rv)"
    )
