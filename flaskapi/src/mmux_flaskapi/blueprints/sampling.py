import csv
import io
import logging
import math
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
from mmux_flaskapi.blueprints.osparc import _get_function_job_from_uid
from mmux_flaskapi.blueprints.sampling_models import (
    CloneJobRequest,
    ErrorResponse,
    GridSamplingRequest,
    JobCollectionCsvUploadRequest,
    LHSSamplingRequest,
    TestJobRequest,
)
from mmux_flaskapi.utils.helpers import (
    create_run_dir,
    dict_keys_camel_to_snake,
    dict_keys_snake_to_camel,
)
from mmux_flaskapi.utils.json_serializer import parse_request_model
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

        from mmux_python.lhs import lhs

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

        from mmux_python.funs_data_processing import load_data
        from mmux_python.funs_evaluate import create_grid_samples

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
        while (
            "JOB_TASK_" in (job := _get_function_job_from_uid(uid))["status"]
            and "FAILURE" not in job
        ):
            time.sleep(1)
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
## CSV import helpers (T6)
#####################################################################################


def _parse_number(raw: str, *, row: int | None = None, col: str | None = None) -> float:
    """
    Parse a CSV cell to float.

    A truly-blank cell (empty/whitespace-only) parses to ``math.nan`` -- a sentinel
    for missing data. A non-blank cell that cannot be parsed as a float raises
    ``ValueError`` with row/column context instead of silently becoming ``0.0``,
    which would feed accidental zeros into Dakota (B4, V19).
    """
    stripped = raw.strip()
    if not stripped:
        return math.nan
    try:
        return float(stripped)
    except ValueError as exc:
        location = f" (row {row}, column {col!r})" if row is not None or col is not None else ""
        raise ValueError(f"Could not parse numeric CSV value {raw!r}{location}") from exc


def _split_csv_preamble_and_table(csv_content: str) -> tuple[dict[str, str], str]:
    """
    Split a CSV string into a metadata dict and the remaining table content.

    Parameters
    ----------
    csv_content:
        Raw CSV text, possibly with leading ``# key,value`` metadata lines.

    Returns
    -------
    tuple[dict[str, str], str]
        Metadata key→value mapping and the non-preamble portion of the CSV.
    """
    metadata: dict[str, str] = {}
    table_lines: list[str] = []

    for line in io.StringIO(csv_content):
        stripped = line.strip()
        if not table_lines and not stripped:
            continue
        if not table_lines and line.lstrip().startswith("#"):
            metadata_row = next(csv.reader([line.lstrip()[1:].strip()]), [])
            if metadata_row:
                key = metadata_row[0].strip()
                value = ",".join(metadata_row[1:]).strip() if len(metadata_row) > 1 else ""
                if key:
                    metadata[key] = value
            continue
        table_lines.append(line)

    return metadata, "".join(table_lines)


def _parse_uploaded_job_collection_csv(csv_content: str) -> dict[str, Any]:
    """
    Parse an uploaded job-collection CSV into a structured dict.

    Parameters
    ----------
    csv_content:
        Raw CSV text with optional ``# key,value`` preamble and
        ``input__*`` / ``output__*`` columns.

    Returns
    -------
    dict
        Keys: ``job_rows``, ``input_vars``, ``output_vars``,
        ``source_function_uid``, ``source_job_collection_uid``,
        ``source_job_collection_title``, ``source_function_title``,
        ``source_description``, ``metadata``.

    Raises
    ------
    ValueError
        If the CSV has no input or output columns, or no data rows.
    """
    metadata, table_content = _split_csv_preamble_and_table(csv_content)
    reader = csv.DictReader(io.StringIO(table_content))
    input_columns = [name for name in (reader.fieldnames or []) if name.startswith("input__")]
    output_columns = [name for name in (reader.fieldnames or []) if name.startswith("output__")]

    if not input_columns or not output_columns:
        raise ValueError("CSV must contain both input__* and output__* columns")

    source_function_uid = metadata.get("source_function_uid", "")
    source_collection_uid = metadata.get("source_job_collection_uid", "")
    source_collection_title = metadata.get("source_job_collection_title", "")
    source_function_title = metadata.get("source_function_title", "")
    source_description = metadata.get("source_description", "")

    job_rows: list[dict[str, Any]] = []
    for row_idx, row in enumerate(reader, start=1):
        inputs: dict[str, float] = {
            col.replace("input__", "", 1): _parse_number(
                str(row.get(col, "")), row=row_idx, col=col
            )
            for col in input_columns
        }
        outputs: dict[str, float] = {
            col.replace("output__", "", 1): _parse_number(
                str(row.get(col, "")), row=row_idx, col=col
            )
            for col in output_columns
        }
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
        "input_vars": {col.replace("input__", "", 1) for col in input_columns},
        "output_vars": {col.replace("output__", "", 1) for col in output_columns},
        "source_function_uid": source_function_uid,
        "source_job_collection_uid": source_collection_uid,
        "source_job_collection_title": source_collection_title,
        "source_function_title": source_function_title,
        "source_description": source_description,
        "metadata": metadata,
    }


def _extract_schema_props(function_dict: dict[str, Any], schema_key: str) -> set[str]:
    """Return the property names from an input/output schema dict."""
    props = function_dict.get(schema_key, {}).get("schema_content", {}).get("properties", {})
    return set(props.keys())


def _function_schema_vars(function_uid: str) -> tuple[set[str], set[str]]:
    """
    Return (input_vars, output_vars) sets for a function uid.

    Works for both local and oSPARC functions.
    """
    if is_local_function_uid(function_uid):
        local_fn = get_local_function(function_uid)
        if local_fn is None:
            raise ValueError(f"Local function not found: {function_uid}")
        return (
            _extract_schema_props(local_fn, "input_schema"),
            _extract_schema_props(local_fn, "output_schema"),
        )
    function_model = _get_functions_api().get_function(function_uid)
    function_dict = dict_keys_camel_to_snake(function_model.to_dict())  # type: ignore[arg-type]
    return (
        _extract_schema_props(function_dict, "input_schema"),
        _extract_schema_props(function_dict, "output_schema"),
    )


def _create_local_function_from_source(
    source_function_uid: str | None,
    new_title: str | None,
    incoming_input_vars: set[str],
    incoming_output_vars: set[str],
    source_collection_title: str | None = None,
    source_description: str | None = None,
) -> str:
    """
    Create a local function matching the schema of an optional source function.

    Parameters
    ----------
    source_function_uid:
        Optional uid of the oSPARC or local function this data came from.
        When ``None`` a brand-new local function is created.
    new_title:
        Optional override title for the created function.
    incoming_input_vars:
        Set of input variable names parsed from the CSV.
    incoming_output_vars:
        Set of output variable names parsed from the CSV.
    source_collection_title:
        Used as fallback title when no title is specified.
    source_description:
        Optional description.

    Returns
    -------
    str
        uid of the newly created local function.

    Raises
    ------
    ValueError
        If the CSV schema is incompatible with the source function.
    """
    if not source_function_uid:
        created = create_local_function(
            title=new_title or source_collection_title or "Uploaded local function",
            description=source_description
            or (
                "Local function created from uploaded CSV data"
                + (f" ({source_collection_title})" if source_collection_title else "")
            ),
            input_vars=incoming_input_vars,
            output_vars=incoming_output_vars,
            source_function_uid=None,
        )
        return str(created["uid"])

    # Validate schema compatibility
    if is_local_function_uid(source_function_uid):
        source_fn = get_local_function(source_function_uid)
        if source_fn is None:
            raise ValueError(f"Local source function not found: {source_function_uid}")
        source_input_vars = _extract_schema_props(source_fn, "input_schema")
        source_output_vars = _extract_schema_props(source_fn, "output_schema")
        src_description = str(source_fn.get("description", ""))
    else:
        function_model = _get_functions_api().get_function(source_function_uid)
        source_fn = dict_keys_camel_to_snake(function_model.to_dict())  # type: ignore[arg-type]
        source_input_vars = _extract_schema_props(source_fn, "input_schema")
        source_output_vars = _extract_schema_props(source_fn, "output_schema")
        src_description = str(source_fn.get("description", ""))

    if source_description:
        src_description = source_description

    if source_input_vars != incoming_input_vars or source_output_vars != incoming_output_vars:
        raise ValueError(
            "CSV schema is incompatible with the selected source function. "
            f"Expected inputs={sorted(source_input_vars)} outputs={sorted(source_output_vars)}, "
            f"received inputs={sorted(incoming_input_vars)} outputs={sorted(incoming_output_vars)}"
        )

    created = create_local_function(
        title=new_title or f"Uploaded data - {source_function_uid}",
        description=src_description,
        input_vars=incoming_input_vars,
        output_vars=incoming_output_vars,
        source_function_uid=source_function_uid,
    )
    return str(created["uid"])


#####################################################################################
## CSV upload endpoint (T6)
#####################################################################################


@sampling_bp.route("/upload_job_collection_csv", methods=["POST"])
def flask_upload_job_collection_csv():
    """
    Import a job-collection CSV into the local store (T6).

    Parses the ``# key,value`` preamble, validates column schema against the
    target function, and persists a new local job collection.

    Returns
    -------
    JSON
        Summary with ``target_function_uid``, ``imported_samples``, and the
        newly created ``job_collection`` record.
    """
    _logger.debug("Starting flask function: flask/upload_job_collection_csv")
    # parse_request_model raises RequestParsingError (→ 400) on validation failure;
    # it must be called OUTSIDE the except-Exception block.
    payload = parse_request_model(JobCollectionCsvUploadRequest)
    try:
        parsed = _parse_uploaded_job_collection_csv(payload.csv_content)

        source_function_uid = payload.source_function_uid or parsed["source_function_uid"]
        if payload.target_mode == "existing":
            target_function_uid = payload.target_function_uid or ""
        else:
            target_function_uid = _create_local_function_from_source(
                source_function_uid,
                payload.new_function_title,
                parsed["input_vars"],
                parsed["output_vars"],
                source_collection_title=(
                    parsed["source_job_collection_title"] or parsed["source_function_title"]
                ),
                source_description=parsed["source_description"],
            )

        if not target_function_uid:
            raise ValueError("Could not determine target function UID")

        target_inputs, target_outputs = _function_schema_vars(target_function_uid)
        incoming_inputs: set[str] = parsed["input_vars"]
        incoming_outputs: set[str] = parsed["output_vars"]

        if target_inputs != incoming_inputs or target_outputs != incoming_outputs:
            return make_response(
                jsonify(
                    {
                        "error": (
                            "Incompatible function schema. "
                            f"Expected inputs={sorted(target_inputs)} "
                            f"outputs={sorted(target_outputs)}, "
                            f"received inputs={sorted(incoming_inputs)} "
                            f"outputs={sorted(incoming_outputs)}"
                        )
                    }
                ),
                422,
            )

        collection_title = parsed["source_job_collection_title"] or "Uploaded JobCollection"
        collection_description = (
            f"Uploaded CSV data from collection {parsed['source_job_collection_uid'] or 'unknown'}"
        )
        local_collection = create_local_job_collection(
            function_uid=target_function_uid,
            job_rows=parsed["job_rows"],
            title=collection_title,
            description=collection_description,
        )

        return jsonify(
            {
                "target_mode": payload.target_mode,
                "target_function_uid": target_function_uid,
                "source_function_uid": source_function_uid,
                "imported_samples": len(parsed["job_rows"]),
                "job_collection": local_collection,
            }
        )

    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return make_response(jsonify({"error": error_msg}), 400)
    except Exception as e:
        error_msg = f"Error while uploading job collection CSV: {e}"
        _logger.error(error_msg)
        return make_response(jsonify({"error": error_msg}), 500)
