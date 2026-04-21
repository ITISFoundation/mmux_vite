import csv
import io
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, NamedTuple

#
from flask import Blueprint, jsonify, make_response, request

#
from osparc_client.models.body_clone_study_v0_studies_study_id_clone_post import (
    BodyCloneStudyV0StudiesStudyIdClonePost,
)
from pydantic import ValidationError

#
from mmux_flaskapi.blueprints.osparc import _get_function_job_from_uid
from mmux_flaskapi.blueprints.sampling_models import (
    CloneJobRequest,
    ErrorResponse,
    GridSamplingRequest,
    JobCollectionCsvUploadRequest,
    LHSSamplingRequest,
    TestJobRequest,
    validate_request_json,
)
from mmux_flaskapi.utils.helpers import (
    create_run_dir,
    dict_keys_camel_to_snake,
    dict_keys_snake_to_camel,
)
from mmux_flaskapi.utils.local_job_store import (
    create_local_function,
    create_local_job_collection,
    get_local_function,
    is_local_function_uid,
)
from mmux_flaskapi.utils.webserver_config import get_osparc_api

#
_logger = logging.getLogger(__name__)
SAMPLING_RUNS_DIR = Path.cwd().parent.parent.parent / "runs_sampling"
SAMPLING_RUNS_DIR.mkdir(exist_ok=True)
_logger.info(f"Saving runs in {SAMPLING_RUNS_DIR}")

sampling_bp = Blueprint("sampling", __name__)


class ParentInfo(NamedTuple):
    parent_node_id: str
    parent_project_id: str


def _error_response(message: str, status_code: int):
    payload = ErrorResponse(error=message).model_dump()
    return make_response(jsonify(payload), status_code)


def _parse_request_data() -> dict[str, Any]:
    request_body = request.get_data(as_text=True)
    if not request_body:
        return {}
    parsed_request = json.loads(request_body)
    if not isinstance(parsed_request, dict):
        raise ValueError("Request payload must be a JSON object.")
    return parsed_request


def _validate_request(model_class):
    return validate_request_json(_parse_request_data(), model_class)


def _serialize_models(models: list[Any]) -> list[dict[str, Any]]:
    return [model.model_dump() for model in models]


def _get_deployment_mode_value() -> str:
    deployment_mode = os.environ.get("DEPLOYMENT_MODE")
    if not deployment_mode:
        _logger.error("DEPLOYMENT_MODE environment variable is not set.")
        raise ValueError("DEPLOYMENT_MODE environment variable is not set.")
    return deployment_mode


def _get_parent_ids() -> ParentInfo:
    deployment_mode = _get_deployment_mode_value()
    if deployment_mode == "LOCAL":
        return ParentInfo(parent_node_id="null", parent_project_id="null")

    if deployment_mode == "OSPARC":
        parent_node_id = os.environ.get("OSPARC_NODE_ID")
        parent_project_id = os.environ.get("OSPARC_STUDY_ID")
        if not parent_node_id or not parent_project_id:
            _logger.error(
                "OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set. "
                "Cannot create a sampling campaign through map function."
            )
            raise ValueError(
                "OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set."
            )
        return ParentInfo(
            parent_node_id=parent_node_id,
            parent_project_id=parent_project_id,
        )

    _logger.error(
        "Unknown value of DEPLOYMENT_MODE env variable (%s). "
        "Thus not able to fetch parent node and project IDs.",
        deployment_mode,
    )
    raise ValueError(
        f"DEPLOYMENT_MODE env variable could not be recognized ({deployment_mode}) "
        "- can not run new pipelines as there would be no billing information."
    )


def _get_functions_api():
    functions_api = get_osparc_api().get_functions_api()
    assert functions_api is not None, "functions_api is None"
    return functions_api


def _get_studies_api():
    studies_api = get_osparc_api().get_studies_api()
    assert studies_api is not None, "studies_api is None"
    return studies_api


def _run_sampling_map(function_uid, samples):
    _logger.debug(
        "Running sampling map for function %s with %s samples",
        function_uid,
        len(samples),
    )

    assert len(samples) > 0, "No samples provided for sampling map"

    parent_info = _get_parent_ids()
    functions_api = _get_functions_api()

    jc = functions_api.map_function(
        function_id=function_uid,
        request_body=samples,
        x_simcore_parent_node_id=parent_info.parent_node_id,
        x_simcore_parent_project_uuid=parent_info.parent_project_id,
    )

    return dict_keys_snake_to_camel(jc.to_dict())


def _sample_from_lhs_matrix(config, lhs_matrix, sample_count):
    samples = []
    for sample_index in range(sample_count):
        sample = {}
        for variable_index, variable_config in enumerate(config):
            scaled_value = float(
                lhs_matrix[variable_index, sample_index]
                * (variable_config.end - variable_config.start)
                + variable_config.start
            )
            sample[variable_config.variable] = scaled_value
        samples.append(sample)
    return samples


def _build_grid_samples(config, run_dir):
    from mmux_python.funs_data_processing import load_data
    from mmux_python.funs_evaluate import create_grid_samples

    input_vars = [var_config.variable for var_config in config]
    config_by_variable = {
        var_config.variable: var_config.model_dump() for var_config in config
    }
    processed_gridpoints_input_file = create_grid_samples(
        run_dir=run_dir,
        grid_vars=input_vars,
        input_vars=input_vars,
        mins=[config_by_variable[var]["start"] for var in input_vars],
        cut_values=[
            (config_by_variable[var]["end"] + config_by_variable[var]["start"]) / 2
            for var in input_vars
        ],
        maxs=[config_by_variable[var]["end"] for var in input_vars],
        n_points_per_dimension=[config_by_variable[var]["steps"] for var in input_vars],
    )

    data_frame = load_data(processed_gridpoints_input_file)
    return [
        {var: float(data_frame.loc[index, var]) for var in input_vars}
        for index in data_frame.index
    ]


def _parse_number(value: str) -> float | int:
    if value.strip() == "":
        raise ValueError("Empty value found in numeric CSV column")
    if value.isdigit() or (value.startswith("-") and value[1:].isdigit()):
        return int(value)
    return float(value)


def _extract_schema_props(function_dict: dict[str, Any], schema_key: str) -> set[str]:
    schema = function_dict.get(schema_key) or {}
    if not isinstance(schema, dict):
        return set()
    schema_content = schema.get("schema_content") or schema.get("schemaContent") or {}
    if not isinstance(schema_content, dict):
        return set()
    properties = schema_content.get("properties") or {}
    if not isinstance(properties, dict):
        return set()
    return set(properties.keys())


def _function_schema_vars(function_uid: str) -> tuple[set[str], set[str]]:
    if is_local_function_uid(function_uid):
        local_function = get_local_function(function_uid)
        if local_function is None:
            raise ValueError(f"Local function not found: {function_uid}")
        input_vars = _extract_schema_props(local_function, "input_schema")
        output_vars = _extract_schema_props(local_function, "output_schema")
        return input_vars, output_vars

    function_model = _get_functions_api().get_function(function_uid)
    function_dict = dict_keys_camel_to_snake(function_model.to_dict())  # type: ignore[arg-type]
    input_vars = _extract_schema_props(function_dict, "input_schema")
    output_vars = _extract_schema_props(function_dict, "output_schema")
    return input_vars, output_vars


def _create_local_function_from_source(
    source_function_uid: str,
    new_title: str | None,
    incoming_input_vars: set[str],
    incoming_output_vars: set[str],
) -> str:
    if is_local_function_uid(source_function_uid):
        source_function = get_local_function(source_function_uid)
        if source_function is None:
            raise ValueError(f"Local source function not found: {source_function_uid}")
        source_input_vars = _extract_schema_props(source_function, "input_schema")
        source_output_vars = _extract_schema_props(source_function, "output_schema")
        source_description = str(source_function.get("description", ""))
    else:
        function_model = _get_functions_api().get_function(source_function_uid)
        source_function = dict_keys_camel_to_snake(function_model.to_dict())  # type: ignore[arg-type]
        source_input_vars = _extract_schema_props(source_function, "input_schema")
        source_output_vars = _extract_schema_props(source_function, "output_schema")
        source_description = str(source_function.get("description", ""))

    if (
        source_input_vars != incoming_input_vars
        or source_output_vars != incoming_output_vars
    ):
        raise ValueError(
            "CSV schema is incompatible with the selected source function. "
            "Expected "
            f"inputs={sorted(source_input_vars)} "
            f"outputs={sorted(source_output_vars)}, "
            "received "
            f"inputs={sorted(incoming_input_vars)} "
            f"outputs={sorted(incoming_output_vars)}"
        )

    created_function = create_local_function(
        title=new_title or f"Uploaded data - {source_function_uid}",
        description=source_description,
        input_vars=incoming_input_vars,
        output_vars=incoming_output_vars,
        source_function_uid=source_function_uid,
    )
    return str(created_function["uid"])


def _parse_uploaded_job_collection_csv(csv_content: str) -> dict[str, Any]:
    reader = csv.DictReader(io.StringIO(csv_content))
    input_columns = [
        name for name in (reader.fieldnames or []) if name.startswith("input__")
    ]
    output_columns = [
        name for name in (reader.fieldnames or []) if name.startswith("output__")
    ]

    if not input_columns or not output_columns:
        raise ValueError("CSV must contain both input__* and output__* columns")

    job_rows: list[dict[str, Any]] = []
    source_function_uid = ""
    source_collection_uid = ""
    source_collection_title = ""
    for row in reader:
        if not source_function_uid:
            source_function_uid = row.get("source_function_uid", "")
        if not source_collection_uid:
            source_collection_uid = row.get("source_job_collection_uid", "")
        if not source_collection_title:
            source_collection_title = row.get("source_job_collection_title", "")

        inputs: dict[str, float | int] = {}
        outputs: dict[str, float | int] = {}
        for column in input_columns:
            var_name = column.replace("input__", "", 1)
            inputs[var_name] = _parse_number(str(row.get(column, "")))
        for column in output_columns:
            var_name = column.replace("output__", "", 1)
            outputs[var_name] = _parse_number(str(row.get(column, "")))
        status = str(row.get("status", "SUCCESS") or "SUCCESS")
        job_rows.append(
            {
                "inputs": inputs,
                "outputs": outputs,
                "status": status,
                "source_job_uid": row.get("source_job_uid"),
            }
        )

    if not job_rows:
        raise ValueError("CSV contains no data rows")

    return {
        "job_rows": job_rows,
        "input_vars": {column.replace("input__", "", 1) for column in input_columns},
        "output_vars": {column.replace("output__", "", 1) for column in output_columns},
        "source_function_uid": source_function_uid,
        "source_job_collection_uid": source_collection_uid,
        "source_job_collection_title": source_collection_title,
    }


@sampling_bp.route("/lhs", methods=["POST"])
def flask_lhs():
    """
    Perform Latin Hypercube Sampling with validated request data.

    Returns:
        JSON response with sampling results or error message
    """
    _logger.debug("Starting flask function: flask/lhs_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        validated_request = _validate_request(LHSSamplingRequest)

        config = validated_request.config
        k = len(config)  # number of variables i.e. dimensions
        seed = validated_request.seed
        n = validated_request.N
        function_uid = validated_request.funUid

        _logger.debug(f"Validated config: {_serialize_models(config)}")
        _logger.debug(f"n: {n}, k: {k}, seed: {seed}, function_uid: {function_uid}")

        from mmux_python.lhs import lhs

        lhs_matrix = lhs(n, k, seed=seed)
        _logger.debug(f"H: {lhs_matrix.shape}")

        samples = _sample_from_lhs_matrix(config, lhs_matrix, n)

        _logger.debug(f"Generated {len(samples)} samples")

        # Run sampling map through OSPARC API
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)

    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except Exception as e:
        error_msg = f"Error while performing LHS sampling: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 500)


@sampling_bp.route("/grid", methods=["POST"])
def flask_grid_sampling():
    """
    Perform Grid Sampling with validated request data.

    Returns:
        JSON response with sampling results or error message
    """
    _logger.debug("Starting flask function: flask/grid_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        validated_request = _validate_request(GridSamplingRequest)

        function_uid = validated_request.funUid
        config = validated_request.config
        run_dir = create_run_dir(SAMPLING_RUNS_DIR, "grid_sampling")

        _logger.debug(f"Validated config: {_serialize_models(config)}")
        _logger.debug(
            "Input variables: %s, function_uid: %s",
            [var_config.variable for var_config in config],
            function_uid,
        )

        samples = _build_grid_samples(config, run_dir)

        _logger.debug(f"Generated {len(samples)} grid samples")
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)

    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except Exception as e:
        error_msg = f"Error while creating Grid Sampling: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 500)


@sampling_bp.route("/test_job", methods=["POST"])
def flask_test_job():
    """
    Test a job with validated request data.

    Returns:
        JSON response with job test results or error message
    """
    _logger.debug("Starting flask function: flask/test_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        validated_request = _validate_request(TestJobRequest)

        config = validated_request.config
        function_uid = validated_request.funUid
        functions_api = _get_functions_api()

        _logger.debug(f"Function UID: {function_uid}")
        _logger.debug(f"Validated config: {_serialize_models(config)}")

        # Convert config to sample format
        sample = {var_config.variable: var_config.value for var_config in config}

        _logger.debug(f"Sample for validation: {sample}")
        val = functions_api.validate_function_inputs(function_uid, sample)
        _logger.debug(f"Validated function inputs: {val}")

        parent_info = _get_parent_ids()
        response = functions_api.run_function(
            function_uid,
            body=sample,
            x_simcore_parent_node_id=parent_info.parent_node_id,
            x_simcore_parent_project_uuid=parent_info.parent_project_id,
        )
        _logger.debug(f"Response from run_function: {response}")

        if not hasattr(response, "actual_instance") or response.actual_instance is None:
            raise ValueError(f"Job creation failed for function {function_uid}")

        uid = response.actual_instance.uid
        _logger.debug(f"Job UID: {uid}")
        while (
            "JOB_TASK_" in (job := _get_function_job_from_uid(uid))["status"]
            and "FAILURE" not in job
        ):
            time.sleep(1)
        _logger.debug(f"Created job: {job}")
        return jsonify(job)

    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except Exception as e:
        error_msg = f"Error while testing job: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 500)


@sampling_bp.route("/clone_job", methods=["POST"])
def flask_clone_job():
    """
    Clone a job with validated request data.

    Returns:
        JSON response with cloned job details or error message
    """
    _logger.debug("Starting flask function: flask/clone_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        validated_request = _validate_request(CloneJobRequest)

        project_job_id = validated_request.projectJobId
        function_name = validated_request.functionName
        inputs = validated_request.projectInputs
        studies_api = _get_studies_api()

        _logger.debug(f"Cloning job {project_job_id} for function {function_name}")

        def format_inputs_for_description(inputs: dict) -> str:
            """Format inputs into a human-readable Markdown description."""
            formatted_inputs = "\n- ".join(
                [""] + [f"*{key}*: {float(value):.4g}" for key, value in inputs.items()]
            )
            return f"#### Inputs:\n\n{formatted_inputs}"

        formatted_inputs = format_inputs_for_description(inputs)
        study_data = BodyCloneStudyV0StudiesStudyIdClonePost(
            title="Job " + function_name,
            description=(
                f"Clone of job *{project_job_id}* from function *{function_name}*.\n\n"
                f"{formatted_inputs}"
            ),
        )
        _logger.debug(f"Study data: {study_data}")
        study = studies_api.clone_study(
            project_job_id,
            hidden=False,
            body_clone_study_v0_studies_study_id_clone_post=study_data,
        )
        _logger.debug(f"Cloned study: {study.to_dict()}")
        return jsonify(study.to_dict())

    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except Exception as e:
        error_msg = f"Error while cloning job: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 500)


@sampling_bp.route("/upload_job_collection_csv", methods=["POST"])
def flask_upload_job_collection_csv():
    """Upload JobCollection CSV to a local function/job-collection store."""
    _logger.debug("Starting flask function: flask/upload_job_collection_csv")
    try:
        payload = _validate_request(JobCollectionCsvUploadRequest)
        parsed = _parse_uploaded_job_collection_csv(payload.csvContent)

        source_function_uid = payload.sourceFunctionUid or parsed["source_function_uid"]
        if payload.targetMode == "existing":
            target_function_uid = payload.targetFunctionUid or ""
        else:
            if not source_function_uid:
                raise ValueError(
                    "sourceFunctionUid is required for targetMode='new' "
                    "when CSV has no source_function_uid"
                )
            target_function_uid = _create_local_function_from_source(
                source_function_uid,
                payload.newFunctionTitle,
                parsed["input_vars"],
                parsed["output_vars"],
            )

        if not target_function_uid:
            raise ValueError("Could not determine target function UID")

        target_inputs, target_outputs = _function_schema_vars(target_function_uid)
        incoming_inputs = parsed["input_vars"]
        incoming_outputs = parsed["output_vars"]

        if target_inputs != incoming_inputs or target_outputs != incoming_outputs:
            return _error_response(
                "Incompatible function schema. "
                "Expected "
                f"inputs={sorted(target_inputs)} "
                f"outputs={sorted(target_outputs)}, "
                "received "
                f"inputs={sorted(incoming_inputs)} "
                f"outputs={sorted(incoming_outputs)}",
                422,
            )

        collection_title = (
            parsed["source_job_collection_title"] or "Uploaded JobCollection"
        )
        collection_description = (
            "Uploaded CSV data from collection "
            f"{parsed['source_job_collection_uid'] or 'unknown'}"
        )
        local_collection = create_local_job_collection(
            function_uid=target_function_uid,
            job_rows=parsed["job_rows"],
            title=collection_title,
            description=collection_description,
        )

        return jsonify(
            {
                "targetMode": payload.targetMode,
                "targetFunctionUid": target_function_uid,
                "sourceFunctionUid": source_function_uid,
                "importedSamples": len(parsed["job_rows"]),
                "jobCollection": local_collection,
            }
        )

    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 400)
    except Exception as e:
        error_msg = f"Error while uploading job collection CSV: {e}"
        _logger.error(error_msg)
        return _error_response(error_msg, 500)
