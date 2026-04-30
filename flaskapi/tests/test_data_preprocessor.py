import numpy as np
import pandas as pd
import pytest

from mmux_flaskapi.data_preprocessor import DataPreprocessor


class TestDataPreprocessor:
    def test_fit_transform_and_inverse_transform_round_trip(self):
        dataframe = pd.DataFrame(
            {
                "length": [1.0, 2.0, 3.0],
                "width": [10.0, 20.0, 30.0],
                "stress": [100.0, 200.0, 300.0],
            }
        )
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["length", "width"], ["stress"])
        preprocessor.setup_normalization(
            input_normalizations={"length": "z_score"},
            output_normalizations={"stress": "min_max"},
        )
        preprocessor.setup_sign_switching(output_sign_switches=["stress"])

        transformed = preprocessor.fit_transform(dataframe)
        restored = preprocessor.inverse_transform(transformed)

        assert list(transformed.columns) == ["x1", "x2", "y1"]
        assert restored == {
            "length": [1.0, 2.0, 3.0],
            "width": [10.0, 20.0, 30.0],
            "stress": [100.0, 200.0, 300.0],
        }

    def test_inverse_transform_accepts_dataframe_dict_and_array_inputs(self):
        dataframe = pd.DataFrame({"input": [1.0, 2.0], "output": [5.0, 7.0]})
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["input"], ["output"])
        preprocessor.fit(dataframe)

        transformed = preprocessor.transform(dataframe)
        restored_from_dataframe = preprocessor.inverse_transform(transformed)
        restored_from_dict = preprocessor.inverse_transform({"x1": [1.0, 2.0], "y1": [5.0, 7.0]})
        restored_from_array = preprocessor.inverse_transform(transformed.to_numpy())

        expected = {"input": [1.0, 2.0], "output": [5.0, 7.0]}
        assert restored_from_dataframe == expected
        assert restored_from_dict == expected
        assert restored_from_array == expected

    def test_filtering_remaps_variable_names_and_summary(self):
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["a", "b", "c"], ["out_1", "out_2"])
        preprocessor.setup_normalization(input_normalizations={"b": "z_score"})
        preprocessor.fit(pd.DataFrame({"a": [1], "b": [2], "c": [3], "out_1": [4], "out_2": [5]}))

        preprocessor.filter_variables(include_inputs=["b", "c"], include_outputs=["out_2"])
        summary = preprocessor.get_summary()

        assert preprocessor.get_variable_mapping() == {
            "b": "x1",
            "c": "x2",
            "out_2": "y1",
        }
        assert summary["n_input_variables"] == 2
        assert summary["n_output_variables"] == 1
        assert summary["input_variables"]["b"]["normalize"] is True

    def test_save_and_load_config_round_trip(self, tmp_path):
        config_path = tmp_path / "preprocessor.json"
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["alpha"], ["beta"])
        preprocessor.setup_normalization(output_normalizations={"beta": "z_score"})
        preprocessor.fit(pd.DataFrame({"alpha": [1.0, 2.0], "beta": [4.0, 6.0]}))
        preprocessor.save_config(config_path)

        loaded = DataPreprocessor().load_config(config_path)

        assert loaded.get_variable_mapping() == {"alpha": "x1", "beta": "y1"}
        assert loaded.output_variables["beta"].mean == 5.0

    def test_log_scale_input_round_trip(self):
        dataframe = pd.DataFrame(
            {
                "current": [1e-3, 1e-2, 1e-1, 1.0],
                "angle": [10.0, 20.0, 30.0, 40.0],
                "threshold": [0.1, 0.2, 0.3, 0.4],
            }
        )
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["current", "angle"], ["threshold"])
        preprocessor.setup_log_scaling(input_log_scales=["current"])

        transformed = preprocessor.fit_transform(dataframe)
        # current was log10-transformed: 1e-3 → -3, 1e-2 → -2, 1e-1 → -1, 1.0 → 0
        np.testing.assert_array_almost_equal(transformed["x1"].tolist(), [-3.0, -2.0, -1.0, 0.0])
        # angle untouched
        np.testing.assert_array_almost_equal(transformed["x2"].tolist(), [10.0, 20.0, 30.0, 40.0])

        restored = preprocessor.inverse_transform(transformed)
        np.testing.assert_array_almost_equal(restored["current"], [1e-3, 1e-2, 1e-1, 1.0])
        np.testing.assert_array_almost_equal(restored["angle"], [10.0, 20.0, 30.0, 40.0])
        np.testing.assert_array_almost_equal(restored["threshold"], [0.1, 0.2, 0.3, 0.4])

    def test_log_scale_combines_with_normalization_and_sign_switch(self):
        dataframe = pd.DataFrame(
            {
                "current": [1e-3, 1e-2, 1e-1, 1.0],
                "stress": [100.0, 200.0, 400.0, 800.0],
            }
        )
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["current"], ["stress"])
        preprocessor.setup_log_scaling(input_log_scales=["current"], output_log_scales=["stress"])
        preprocessor.setup_normalization(input_normalizations={"current": "z_score"})
        preprocessor.setup_sign_switching(output_sign_switches=["stress"])

        transformed = preprocessor.fit_transform(dataframe)
        restored = preprocessor.inverse_transform(transformed)

        np.testing.assert_array_almost_equal(restored["current"], [1e-3, 1e-2, 1e-1, 1.0])
        np.testing.assert_array_almost_equal(restored["stress"], [100.0, 200.0, 400.0, 800.0])

    def test_log_scale_rejects_non_positive_values(self):
        dataframe = pd.DataFrame({"x": [1.0, 0.0, 2.0], "y": [1.0, 2.0, 3.0]})
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["x"], ["y"])
        preprocessor.setup_log_scaling(input_log_scales=["x"])

        with pytest.raises(ValueError, match="non-positive"):
            preprocessor.fit_transform(dataframe)

    def test_log_scale_persists_through_save_load(self, tmp_path):
        config_path = tmp_path / "preprocessor.json"
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["current"], ["threshold"])
        preprocessor.setup_log_scaling(input_log_scales=["current"])
        preprocessor.fit(pd.DataFrame({"current": [1e-3, 1e-2, 1e-1], "threshold": [1, 2, 3]}))
        preprocessor.save_config(config_path)

        loaded = DataPreprocessor().load_config(config_path)
        assert loaded.input_variables["current"].log_transform is True

        # The reloaded preprocessor should still inverse-transform correctly.
        inverse = loaded.inverse_transform({"x1": [-3.0, 0.0]})
        np.testing.assert_array_almost_equal(inverse["current"], [1e-3, 1.0])

    def test_get_summary_includes_log_transform_flag(self):
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(["a"], ["b"])
        preprocessor.setup_log_scaling(input_log_scales=["a"])
        summary = preprocessor.get_summary()
        assert summary["input_variables"]["a"]["log_transform"] is True
        assert summary["output_variables"]["b"]["log_transform"] is False
