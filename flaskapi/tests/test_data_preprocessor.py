import pandas as pd

from mmux_flaskapi.data_preprocessor import DataPreprocessor
from mmux_flaskapi.utils.helpers import recursive_dict_keys_snake_to_camel


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

    def test_original_variable_case_preserved_through_round_trip(self):
        """V14: DataPreprocessor preserves original variable-name case (no lowercasing)."""
        # Mixed-case variable names must survive the x1..xn round-trip.
        input_vars = ["angleWidth", "peak_Averaged_Field", "TissueConduc"]
        output_vars = ["E_Field_Max"]
        dataframe = pd.DataFrame(
            {
                "angleWidth": [1.0, 2.0, 3.0],
                "peak_Averaged_Field": [10.0, 20.0, 30.0],
                "TissueConduc": [0.1, 0.2, 0.3],
                "E_Field_Max": [5.0, 6.0, 7.0],
            }
        )
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(input_vars, output_vars)
        transformed = preprocessor.fit_transform(dataframe)

        # Mapped names use x1..xn, y1..yn — not lowercased originals.
        assert list(transformed.columns) == ["x1", "x2", "x3", "y1"]

        restored = preprocessor.inverse_transform(transformed)
        # Original mixed-case names are restored exactly.
        assert "angleWidth" in restored
        assert "peak_Averaged_Field" in restored
        assert "TissueConduc" in restored
        assert "E_Field_Max" in restored

    def test_inverse_transform_output_survives_snake_to_camel_serialization(self):
        """V13+V14: inverse_transform keys placed under 'outputs' must not be case-converted."""
        input_vars = ["angleWidth"]
        output_vars = ["E_Field_Max"]
        dataframe = pd.DataFrame({"angleWidth": [1.0], "E_Field_Max": [5.0]})
        preprocessor = DataPreprocessor()
        preprocessor.setup_variables(input_vars, output_vars)
        preprocessor.fit(dataframe)

        result = preprocessor.inverse_transform({"x1": [1.0], "y1": [5.0]})
        # Wrap result as it would appear in an API response dict.
        response = {"outputs": result}
        serialized = recursive_dict_keys_snake_to_camel(response)
        # Keys inside 'outputs' must not be snake→camel converted.
        assert serialized["outputs"] == {"angleWidth": [1.0], "E_Field_Max": [5.0]}
