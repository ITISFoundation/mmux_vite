"""Unit tests for mmux_flaskapi.dakota.funs_data_processing (§V27)."""

import re

import pytest

from mmux_flaskapi.dakota.funs_data_processing import create_manual_uq_samples, load_data


class TestCreateManualUqSamplesSeedReproducibility:
    """B12/V27: `seed` must actually control reproducibility of generated samples."""

    def test_same_seed_produces_identical_samples_normal(self):
        distributions = {"x1": {"distribution": "normal", "mean": 0.0, "std": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=123)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=123)
        assert samples_a["x1"] == samples_b["x1"]

    def test_same_seed_produces_identical_samples_uniform(self):
        distributions = {"x1": {"distribution": "uniform", "min": -1.0, "max": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=7)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=7)
        assert samples_a["x1"] == samples_b["x1"]

    def test_different_seeds_produce_different_samples(self):
        distributions = {"x1": {"distribution": "normal", "mean": 0.0, "std": 1.0}}
        samples_a = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=1)
        samples_b = create_manual_uq_samples(["x1"], distributions, num_samples=50, seed=2)
        assert samples_a["x1"] != samples_b["x1"]

    def test_same_seed_produces_identical_samples_mixed_distributions(self):
        """T17 (PR #487 review): a single seeded call spanning both distribution
        types must reproduce identically, not just each type in isolation."""
        distributions = {
            "x1": {"distribution": "normal", "mean": 0.0, "std": 1.0},
            "x2": {"distribution": "uniform", "min": -1.0, "max": 1.0},
        }
        samples_a = create_manual_uq_samples(["x1", "x2"], distributions, num_samples=50, seed=42)
        samples_b = create_manual_uq_samples(["x1", "x2"], distributions, num_samples=50, seed=42)
        assert samples_a["x1"] == samples_b["x1"]
        assert samples_a["x2"] == samples_b["x2"]


class TestLoadDataMalformedFile:
    """B20/V38: a `.dat`/`.txt` file whose header column count doesn't match a data
    row's column count must raise a diagnostic ValueError naming the file, line
    number, and both column counts - not pandas' bare "X columns passed, passed
    data had Y columns" (which carries no file/line context)."""

    def test_row_with_fewer_columns_than_header_raises_with_context(self, tmp_path):
        malformed_file = tmp_path / "predictions.dat"
        malformed_file.write_text(
            "eval_id interface x1 x2 x3\n1 NO_ID 0.1 0.2 0.3\n2 NO_ID 0.4 0.5\n"
        )
        with pytest.raises(ValueError, match=r"header \(line 1\) has 5 columns"):
            load_data(malformed_file)

    def test_error_message_identifies_offending_line_number(self, tmp_path):
        malformed_file = tmp_path / "predictions.dat"
        malformed_file.write_text(
            "eval_id interface x1 x2 x3\n1 NO_ID 0.1 0.2 0.3\n2 NO_ID 0.4 0.5\n"
        )
        with pytest.raises(ValueError, match="line 3 has 4 columns"):
            load_data(malformed_file)

    def test_error_message_includes_raw_context_lines(self, tmp_path):
        """B21: the raw (untokenized) previous/offending/next lines must be included
        so a future occurrence can confirm/refute a Dakota tabular line-wrapping
        cause without needing filesystem access to the (possibly already-cleaned-up)
        run directory."""
        malformed_file = tmp_path / "predictions.dat"
        malformed_file.write_text(
            "eval_id interface x1 x2 x3\n1 NO_ID 0.1 0.2 0.3\n2 NO_ID 0.4 0.5\n3 NO_ID 0.7 0.8 0.9\n"
        )
        with pytest.raises(ValueError, match=r"Raw context \(total 4 lines\)"):
            load_data(malformed_file)
        with pytest.raises(ValueError, match=re.escape("line 3 (offending): '2 NO_ID 0.4 0.5'")):
            load_data(malformed_file)

    def test_well_formed_file_still_loads_correctly(self, tmp_path):
        good_file = tmp_path / "predictions.dat"
        good_file.write_text(
            "eval_id interface x1 x2 x3\n1 NO_ID 0.1 0.2 0.3\n2 NO_ID 0.4 0.5 0.6\n"
        )
        df = load_data(good_file)
        assert len(df) == 2
        assert list(df.columns) == ["eval_id", "interface", "x1", "x2", "x3"]


class TestLoadDataHealOrDropMalformedRow:
    """B22 (2026-07-15): confirmed real Dakota tabular-writer defect - some rows
    duplicate the interface/leading-variable prefix before finishing the row, and
    never repeat `_eval_id`. `on_malformed_row="heal_or_drop"` recovers what it can
    (inferring `_eval_id` as the row's own sequential position) and drops+warns on
    anything it can't reconstruct, instead of raising and failing the whole caller."""

    HEADER = "%eval_id interface x1 x2 x3 x4 x5 x6 x7 x8 x9 x10 x11 y1\n"

    def test_heals_real_captured_corrupted_row(self, tmp_path):
        # Byte-for-byte the row captured from a real production predictions.dat
        # (B22): the interface+x1..x9 prefix written twice (last x9 digit noisy),
        # then x10/x11/y1 written once, `_eval_id` never repeated.
        corrupted_line = (
            "1        APPROX_INTERFACE_1 0.564657       0.0685889      0.163073       "
            "0.347383       0.127338       0.000826683    0.565321       0.210969       "
            "0.554521        APPROX_INTERFACE_1 0.564657       0.0685889      0.163073       "
            "0.347383       0.127338       0.000826683    0.565321       0.210969       "
            "0.554525       0.174912       488.687        0.3218000105   \n"
        )
        f = tmp_path / "predictions.dat"
        f.write_text(self.HEADER + corrupted_line)
        warnings: list[str] = []
        df = load_data(f, on_malformed_row="heal_or_drop", warnings=warnings)
        assert len(df) == 1
        assert df.iloc[0]["_eval_id"] == "1"
        assert df.iloc[0]["interface"] == "APPROX_INTERFACE_1"
        assert float(df.iloc[0]["x9"]) == pytest.approx(0.554525)  # 2nd (final) write wins
        assert float(df.iloc[0]["x10"]) == pytest.approx(0.174912)
        assert float(df.iloc[0]["x11"]) == pytest.approx(488.687)
        assert float(df.iloc[0]["y1"]) == pytest.approx(0.3218000105)
        assert any("Recovered corrupted row" in w for w in warnings)

    def test_drops_unhealable_row_and_warns_instead_of_raising(self, tmp_path):
        f = tmp_path / "predictions.dat"
        f.write_text(self.HEADER + "1 APPROX_INTERFACE_1 0.1 0.2 0.3\n")  # too short to heal
        warnings: list[str] = []
        df = load_data(f, on_malformed_row="heal_or_drop", warnings=warnings)
        assert len(df) == 0
        assert any("Dropped unrecoverable malformed row" in w for w in warnings)

    def test_default_still_raises_for_the_same_unhealable_row(self, tmp_path):
        f = tmp_path / "predictions.dat"
        f.write_text(self.HEADER + "1 APPROX_INTERFACE_1 0.1 0.2 0.3\n")
        with pytest.raises(ValueError, match="Malformed data file"):
            load_data(f)  # on_malformed_row defaults to "raise"

    def test_well_formed_rows_unaffected_by_heal_or_drop_mode(self, tmp_path):
        f = tmp_path / "predictions.dat"
        f.write_text(
            self.HEADER + "1 APPROX_INTERFACE_1 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2\n"
        )
        df = load_data(f, on_malformed_row="heal_or_drop")
        assert len(df) == 1
