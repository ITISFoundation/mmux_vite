"""Unit tests for mmux_flaskapi.dakota.funs_data_processing (§V27)."""

from mmux_flaskapi.dakota.funs_data_processing import create_manual_uq_samples


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
