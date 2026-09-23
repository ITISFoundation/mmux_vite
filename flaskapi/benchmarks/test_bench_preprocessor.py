"""Benchmarks for the DataPreprocessor.

Every surrogate build, cross-validation, UQ propagation and MOGA run funnels
its training data and its sample matrices through fit / transform, and every
response goes back through inverse_transform.
"""

import numpy as np
import pytest

from mmux_flaskapi.data_preprocessor.data_preprocessor import DataPreprocessor


@pytest.fixture
def preprocessor(input_vars, output_vars, study_dataframe) -> DataPreprocessor:
    prep = DataPreprocessor()
    prep.setup_variables(input_vars, output_vars)
    prep.setup_normalization(
        input_normalizations={var: "z_score" for var in input_vars},
        output_normalizations={var: "min_max" for var in output_vars},
    )
    prep.setup_sign_switching(output_sign_switches=[output_vars[0]])
    prep.fit(study_dataframe)
    return prep


def test_setup_and_fit(benchmark, input_vars, output_vars, study_dataframe):
    def setup_and_fit():
        prep = DataPreprocessor()
        prep.setup_variables(input_vars, output_vars)
        prep.setup_normalization(
            input_normalizations={var: "z_score" for var in input_vars},
            output_normalizations={var: "min_max" for var in output_vars},
        )
        prep.setup_sign_switching(output_sign_switches=[output_vars[0]])
        return prep.fit(study_dataframe)

    assert benchmark(setup_and_fit) is not None


def test_transform_dataframe(benchmark, preprocessor, study_dataframe):
    transformed = benchmark(preprocessor.transform, study_dataframe)
    assert len(transformed) == len(study_dataframe)


def test_transform_records(benchmark, preprocessor, study_dataframe):
    # The Flask endpoints receive job payloads as a list of dicts.
    records = study_dataframe.to_dict(orient="records")
    transformed = benchmark(preprocessor.transform, records)
    assert len(transformed) == len(records)


def test_inverse_transform(benchmark, preprocessor, study_dataframe):
    transformed = preprocessor.transform(study_dataframe)
    restored = benchmark(preprocessor.inverse_transform, transformed)
    assert len(restored) > 0


def test_inverse_transform_ndarray(benchmark, preprocessor, study_dataframe):
    transformed = preprocessor.transform(study_dataframe)
    array = np.asarray(transformed.values, dtype=float)
    restored = benchmark(preprocessor.inverse_transform, array)
    assert len(restored) > 0
