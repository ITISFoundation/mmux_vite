import csv
import logging
import os
import time
from pathlib import Path
from typing import Any, NamedTuple

#
from flask import Blueprint, jsonify, make_response

#
from osparc_client.models.body_clone_study_v0_studies_study_id_clone_post import (
    BodyCloneStudyV0StudiesStudyIdClonePost,
)

#
from mmux_flaskapi.blueprints.osparc import _function_schema_vars, _get_function_job_from_uid
from mmux_flaskapi.blueprints.sampling_models import (
    CloneJobRequest,
    ErrorResponse,
    GridSamplingRequest,
    JobCollectionCsvUploadRequest,
    LHSSamplingRequest,
    TestJobRequest,
)
from mmux_flaskapi.utils.helpers import create_run_dir, dict_keys_snake_to_camel
from mmux_flaskapi.utils.json_serializer import parse_request_model
from mmux_flaskapi.utils.local_job_store import (
    create_local_function,
    create_local_job_collection,
)
from mmux_flaskapi.utils.webserver_config import get_osparc_api

#
_logger = logging.getLogger(__name__)
SAMPLING_RUNS_DIR = Path.cwd().parent.parent.parent / "runs_sampling"
SAMPLING_RUNS_DIR.mkdir(exist_ok=True)
_logger.info(f"Saving runs in {SAMPLING_RUNS_DIR}")
SAMPLING_RUNS_DIR.mkdir(exist_ok=True)
assert SAMPLING_RUNS_DIR.is_dir(), "Sampling Runs Dir does not exist!!"

sampling_bp = Blueprint("sampling", __name__)


class ParentInfo(NamedTuple):
    parent_node_id: str
    parent_project_id: str


def _get_parent_ids() -> ParentInfo:
    from mmux_flaskapi.blueprints.deployment import get_deployment_mode_value

    deployment_mode = get_deployment_mode_value()
    if deployment_mode == "LOCAL":
        parent_node_id = "null"
        parent_project_id = "null"
    elif deployment_mode == "OSPARC":
        parent_node_id = os.environ.get("OSPARC_NODE_ID", None)
        parent_project_id = os.environ.get("OSPARC_STUDY_ID", None)
        if not parent_node_id or not parent_project_id:
            _logger.error(
                "OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set. Cannot create a sampling campaign through map function."
            )
            raise ValueError("OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set.")
    else:
        _logger.error(
            f"Unknown value of DEPLOYMENT_MODE env variable ({deployment_mode}). Thus not able to fetch parent node and project IDs."
        )
        raise ValueError(
            f"DEPLOYMENT_MODE env variable could not be recognized ({deployment_mode}) - can not run new pipelines as there would be no billing information."
        )
    return ParentInfo(parent_node_id=parent_node_id, parent_project_id=parent_project_id)


def _get_functions_api():
    functions_api = get_osparc_api().get_functions_api()
    assert functions_api is not None, "functions_api is None"
    return functions_api


def _get_studies_api():
    studies_api = get_osparc_api().get_studies_api()
    assert studies_api is not None, "studies_api is None"
    return studies_api


def _run_sampling_map(function_uid, samples):
    _logger.debug(f"Running sampling map for function {function_uid} with {len(samples)} samples")

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


@sampling_bp.route("/lhs", methods=["POST"])
def flask_lhs():
    """
    Perform Latin Hypercube Sampling with validated request data.

    Returns:
        JSON response with sampling results or error message
    """
    _logger.debug("Starting flask function: flask/lhs_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(LHSSamplingRequest)

    try:
        config = validated_request.config
        k = len(config)  # number of variables i.e. dimensions
        seed = validated_request.seed
        n = validated_request.n
        function_uid = validated_request.fun_uid

        _logger.debug(f"Validated config: {[c.dict() for c in config]}")
        _logger.debug(f"n: {n}, k: {k}, seed: {seed}, function_uid: {function_uid}")

        from mmux_flaskapi.dakota.lhs import lhs

        H = lhs(n, k, seed=seed)
        _logger.debug(f"H: {H.shape}")

        samples = []
        for j in range(n):
            sample = {}
            for i in range(k):
                variable_config = config[i]
                scaled_value = float(
                    H[i, j] * (variable_config.end - variable_config.start) + variable_config.start
                )
                sample[variable_config.variable] = scaled_value
            samples.append(sample)

        _logger.debug(f"Generated {len(samples)} samples")

        # Run sampling map through OSPARC API
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)

    except Exception as e:
        error_msg = f"Error while performing LHS sampling: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)


@sampling_bp.route("/grid", methods=["POST"])
def flask_grid_sampling():
    """
    Perform Grid Sampling with validated request data.

    Returns:
        JSON response with sampling results or error message
    """
    _logger.debug("Starting flask function: flask/grid_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(GridSamplingRequest)

    try:
        function_uid = validated_request.fun_uid
        config = validated_request.config
        input_vars = [var_config.variable for var_config in config]
        run_dir = create_run_dir(SAMPLING_RUNS_DIR, "grid_sampling")

        _logger.debug(f"Validated config: {[c.dict() for c in config]}")
        _logger.debug(f"Input variables: {input_vars}, function_uid: {function_uid}")

        from mmux_flaskapi.dakota.funs_data_processing import load_data
        from mmux_flaskapi.dakota.funs_evaluate import create_grid_samples

        # Convert config to the format expected by create_grid_samples
        config_dict = {var_config.variable: var_config.dict() for var_config in config}

        PROCESSED_GRIDPOINTS_INPUT_FILE = create_grid_samples(
            run_dir=run_dir,
            grid_vars=input_vars,
            input_vars=input_vars,
            mins=[config_dict[var]["start"] for var in input_vars],
            cut_values=[
                (config_dict[var]["end"] + config_dict[var]["start"]) / 2 for var in input_vars
            ],
            maxs=[config_dict[var]["end"] for var in input_vars],
            n_points_per_dimension=[config_dict[var]["steps"] for var in input_vars],
        )

        samples = []
        df = load_data(PROCESSED_GRIDPOINTS_INPUT_FILE)
        for i in df.index:
            sample = {var: float(df.loc[i, var]) for var in input_vars}  # type: ignore
            samples.append(sample)

        _logger.debug(f"Generated {len(samples)} grid samples")
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)

    except Exception as e:
        error_msg = f"Error while creating Grid Sampling: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)


@sampling_bp.route("/test_job", methods=["POST"])
def flask_test_job():
    """
    Test a job with validated request data.

    Returns:
        JSON response with job test results or error message
    """
    _logger.debug("Starting flask function: flask/test_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(TestJobRequest)

    try:
        config = validated_request.config
        function_uid = validated_request.fun_uid
        functions_api = _get_functions_api()

        _logger.debug(f"Function UID: {function_uid}")
        _logger.debug(f"Validated config: {[c.dict() for c in config]}")

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
        job = _get_function_job_from_uid(uid)
        while "JOB_TASK_" in job["status"] and "FAILURE" not in job["status"]:
            time.sleep(1)
            job = _get_function_job_from_uid(uid)
        _logger.debug(f"Created job: {job}")
        return jsonify(job)

    except ValueError as e:
        error_msg = str(e)
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)

    except Exception as e:
        error_msg = f"Error while testing job: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)


@sampling_bp.route("/clone_job", methods=["POST"])
def flask_clone_job():
    """
    Clone a job with validated request data.

    Returns:
        JSON response with cloned job details or error message
    """
    _logger.debug("Starting flask function: flask/clone_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    validated_request = parse_request_model(CloneJobRequest)

    try:
        project_job_id = validated_request.project_job_id
        function_name = validated_request.function_name
        inputs = validated_request.project_inputs
        studies_api = _get_studies_api()

        _logger.debug(f"Cloning job {project_job_id} for function {function_name}")

        def format_inputs_for_description(inputs: dict) -> str:
            """Formats a dictionary of inputs into a human-readable string for description."""
            formatted_inputs = "\n- ".join(
                [""] + [f"*{key}*: {float(value):.4g}" for key, value in inputs.items()]
            )
            return f"#### Inputs:\n\n{formatted_inputs}"

        formatted_inputs = format_inputs_for_description(inputs)
        study_data = BodyCloneStudyV0StudiesStudyIdClonePost(
            title="Job " + function_name,
            description=f"Clone of job *{project_job_id}* from function *{function_name}*.\n\n{formatted_inputs}",
        )
        _logger.debug(f"Study data: {study_data}")
        study = studies_api.clone_study(
            project_job_id,
            hidden=False,
            body_clone_study_v0_studies_study_id_clone_post=study_data,
        )
        _logger.debug(f"Cloned study: {study.to_dict()}")
        return jsonify(study.to_dict())

    except Exception as e:
        error_msg = f"Error while cloning job: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)


#####################################################################################
# Job-collection CSV import (flaskapi/SPEC.md §T6, node/SPEC.md V13)
#####################################################################################

INPUT_COLUMN_PREFIX = "input__"
OUTPUT_COLUMN_PREFIX = "output__"


def _parse_csv_row(line: str) -> list[str]:
    return next(csv.reader([line]))


def _split_csv_preamble_and_table(csv_content: str) -> tuple[dict[str, str], list[str]]:
    """Split `# key,value` metadata preamble lines from the data table.

    Uses the CSV row parser (not a raw comma-index split) for the preamble lines
    too, so a quoted value containing a comma (e.g. a title) round-trips
    correctly -- see the equivalent fix in node/SPEC.md's `jobCollectionCsv.ts`.
    """
    preamble: dict[str, str] = {}
    table_lines: list[str] = []
    for line in csv_content.splitlines():
        stripped = line.strip()
        if not table_lines and stripped.startswith("#"):
            without_hash = stripped[1:].strip()
            if without_hash:
                cells = _parse_csv_row(without_hash)
                if len(cells) >= 2:
                    preamble[cells[0].strip()] = cells[1]
            continue
        if not table_lines and not stripped:
            continue  # skip blank lines before the table starts
        table_lines.append(line)
    return preamble, table_lines


def _parse_number(raw: str | None, *, row_index: int, column: str) -> float | None:
    """Parse a single CSV cell into a float.

    Blank/whitespace-only cells are treated as "missing" (returns None), never
    silently coerced to 0. A genuinely unparseable non-blank cell raises
    ValueError with row/column context (flaskapi/SPEC.md §B4/§V19 fix).
    """
    if raw is None or raw.strip() == "":
        return None
    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError(
            f"Could not parse numeric value {raw!r} in column '{column}' (row {row_index})"
        ) from exc


def _parse_uploaded_job_collection_csv(csv_content: str) -> dict[str, Any]:
    preamble, table_lines = _split_csv_preamble_and_table(csv_content)
    if not table_lines:
        raise ValueError("CSV content has no header/table rows")

    header = _parse_csv_row(table_lines[0])
    input_columns = [c for c in header if c.startswith(INPUT_COLUMN_PREFIX)]
    output_columns = [c for c in header if c.startswith(OUTPUT_COLUMN_PREFIX)]
    input_vars = [c[len(INPUT_COLUMN_PREFIX) :] for c in input_columns]
    output_vars = [c[len(OUTPUT_COLUMN_PREFIX) :] for c in output_columns]
    if not input_vars or not output_vars:
        raise ValueError(
            f"CSV must contain at least one '{INPUT_COLUMN_PREFIX}*' and one "
            f"'{OUTPUT_COLUMN_PREFIX}*' column"
        )

    rows: list[dict[str, dict[str, float]]] = []
    for row_index, line in enumerate(table_lines[1:], start=2):  # 1-based, +1 for header row
        if not line.strip():
            continue
        cells = _parse_csv_row(line)
        if len(cells) != len(header):
            raise ValueError(
                f"Row {row_index} has {len(cells)} column(s), expected {len(header)} "
                "(matching the header row)"
            )
        row_values = dict(zip(header, cells))

        inputs = {}
        for column, var in zip(input_columns, input_vars):
            value = _parse_number(row_values.get(column), row_index=row_index, column=column)
            if value is not None:
                inputs[var] = value

        outputs = {}
        for column, var in zip(output_columns, output_vars):
            value = _parse_number(row_values.get(column), row_index=row_index, column=column)
            if value is not None:
                outputs[var] = value

        rows.append({"inputs": inputs, "outputs": outputs})

    if not rows:
        raise ValueError("CSV contains no data rows")

    return {
        "preamble": preamble,
        "input_vars": input_vars,
        "output_vars": output_vars,
        "rows": rows,
    }


@sampling_bp.route("/upload_job_collection_csv", methods=["POST"])
def flask_upload_job_collection_csv():
    """
    Import a job-collection CSV and attach the samples to either a new local
    function or an existing function (local or real oSPARC).

    Always creates a LOCAL job collection for the imported rows: there is no oSPARC
    API to inject fabricated historical job results into a real function's job
    history, so "existing" mode still stores the jobs locally, merely tagged with
    the real target function's UID (flaskapi/SPEC.md §T6/§T7 architecture note).
    """
    # Let parse_request_model raise; the registered RequestParsingError handler will
    # normalize the response and ensure consistency with other sampling endpoints
    # (flaskapi/SPEC.md V22, B10 fix).
    validated_request = parse_request_model(JobCollectionCsvUploadRequest)

    try:
        parsed = _parse_uploaded_job_collection_csv(validated_request.csv_content)
        input_vars = parsed["input_vars"]
        output_vars = parsed["output_vars"]

        if validated_request.target_mode == "existing":
            target_function_uid = validated_request.target_function_uid
            # Explicit check instead of assert; asserts can be optimized away with python -O
            # (flaskapi/SPEC.md V23, B11 fix).
            if not target_function_uid:
                raise ValueError("target_function_uid is required when target_mode is 'existing'")
            existing_input_vars, existing_output_vars = _function_schema_vars(target_function_uid)
            if set(existing_input_vars) != set(input_vars) or set(existing_output_vars) != set(
                output_vars
            ):
                raise ValueError(
                    "CSV schema does not match the target function's schema: "
                    f"expected inputs {sorted(existing_input_vars)} / "
                    f"outputs {sorted(existing_output_vars)}, got inputs {sorted(input_vars)} / "
                    f"outputs {sorted(output_vars)}"
                )
        else:
            title = validated_request.new_function_title or (
                parsed["preamble"].get("source_job_collection_title") or "Imported function"
            )
            new_function = create_local_function(
                title=title, input_vars=input_vars, output_vars=output_vars
            )
            target_function_uid = new_function["uid"]

        job_collection_title = (
            parsed["preamble"].get("source_job_collection_title") or "Imported job collection"
        )
        job_collection = create_local_job_collection(
            function_uid=target_function_uid,
            title=job_collection_title,
            rows=parsed["rows"],
        )

        response_data = {
            "target_function_uid": target_function_uid,
            "imported_samples": len(parsed["rows"]),
            "job_collection": job_collection,
        }
        return jsonify(response_data), 200

    except ValueError as e:
        error_msg = str(e)
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 422)

    except Exception as e:
        error_msg = f"Error while uploading job collection CSV: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)
