"""Unit tests for mmux_flaskapi.dakota.funs_data_processing (§V27)."""

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

    def test_well_formed_file_still_loads_correctly(self, tmp_path):
        good_file = tmp_path / "predictions.dat"
        good_file.write_text(
            "eval_id interface x1 x2 x3\n1 NO_ID 0.1 0.2 0.3\n2 NO_ID 0.4 0.5 0.6\n"
        )
        df = load_data(good_file)
        assert len(df) == 2
        assert list(df.columns) == ["eval_id", "interface", "x1", "x2", "x3"]
