import os
from pathlib import Path
import json
import logging
from typing import NamedTuple
#
from flask import request, abort, jsonify, make_response, Blueprint, current_app
from pydantic import ValidationError
#
from osparc_client.models.body_clone_study_v0_studies_study_id_clone_post import BodyCloneStudyV0StudiesStudyIdClonePost
#
from mmux_flaskapi.blueprints.osparc import _get_function_job_from_uid
from mmux_flaskapi.blueprints.sampling_models import (
    LHSSamplingRequest, GridSamplingRequest, TestJobRequest, CloneJobRequest,
    SamplingResponse, ErrorResponse, validate_request_json
)
from mmux_flaskapi.utils.helpers import dict_keys_snake_to_camel, create_run_dir
from mmux_flaskapi.utils.webserver_config import get_osparc_api
#

_logger = logging.getLogger(__name__)
sampling_bp = Blueprint('sampling', __name__, url_prefix='/sampling')

class ParentInfo(NamedTuple):
    parent_node_id : str
    parent_project_id: str
    
def _get_parent_ids() -> ParentInfo:
    from mmux_flaskapi.blueprints.deployment import deployment_mode
    deployment_mode = deployment_mode()
    if deployment_mode == "LOCAL":
        parent_node_id = "null"
        parent_project_id = "null"
    elif deployment_mode == "OSPARC":
        parent_node_id = os.environ.get("OSPARC_NODE_ID", None)
        parent_project_id = os.environ.get("OSPARC_STUDY_ID", None)
        if not parent_node_id or not parent_project_id:
            _logger.error("OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set. Cannot create a sampling campaign through map function.")
            raise ValueError("OSPARC_NODE_ID or OSPARC_STUDY_ID environment variables are not set.")
    else:
        _logger.error(f"Unknown value of DEPLOYMENT_MODE env variable ({deployment_mode}). Thus not able to fetch parent node and project IDs.")
        raise ValueError(f"DEPLOYMENT_MODE env variable could not be recognized ({deployment_mode}) - can not run new pipelines as there would be no billing information.")
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
    
    jc = functions_api.map_function(function_id=function_uid, request_body=samples,
                                    x_simcore_parent_node_id=parent_info.parent_node_id, 
                                    x_simcore_parent_project_uuid=parent_info.parent_project_id) 
    
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
    
    try:
        # Parse and validate request data
        request_data: dict = json.loads(request.data.decode("utf-8"))
        validated_request = validate_request_json(request_data, LHSSamplingRequest)
        
        config = validated_request.config
        k = len(config)  # number of variables i.e. dimensions
        seed = validated_request.seed
        n = validated_request.N
        function_uid = validated_request.funUid
        
        _logger.debug(f"Validated config: {[c.dict() for c in config]}")
        _logger.debug(f"n: {n}, k: {k}, seed: {seed}, function_uid: {function_uid}")
        
        from flaskapi.mmux_python.utils.lhs import lhs
        H = lhs(n, k, seed=seed)
        _logger.debug(f"H: {H.shape}")

        samples = []
        for j in range(n):
            sample = {}
            for i in range(k):
                variable_config = config[i]
                scaled_value = float(H[i, j] * (variable_config.end - variable_config.start) + variable_config.start)
                sample[variable_config.variable] = scaled_value
            samples.append(sample)
        
        _logger.debug(f"Generated {len(samples)} samples")

        # Run sampling map through OSPARC API
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
        
    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
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

    try:
        # Parse and validate request data
        request_data: dict = json.loads(request.data.decode("utf-8"))
        validated_request = validate_request_json(request_data, GridSamplingRequest)
        
        function_uid = validated_request.funUid
        config = validated_request.config
        input_vars = [var_config.variable for var_config in config]
        run_dir = create_run_dir(Path("."), "grid_sampling")

        _logger.debug(f"Validated config: {[c.dict() for c in config]}")
        _logger.debug(f"Input variables: {input_vars}, function_uid: {function_uid}")

        from flaskapi.mmux_python.utils.funs_evaluate import create_grid_samples
        from flaskapi.mmux_python.utils.funs_data_processing import load_data
        
        # Convert config to the format expected by create_grid_samples
        config_dict = {var_config.variable: var_config.dict() for var_config in config}
        
        PROCESSED_GRIDPOINTS_INPUT_FILE = create_grid_samples(
            run_dir=run_dir,
            grid_vars=input_vars,
            input_vars=input_vars,
            mins=[config_dict[var]["start"] for var in input_vars],
            cut_values=[(config_dict[var]["end"] + config_dict[var]["start"]) / 2 for var in input_vars],
            maxs=[config_dict[var]["end"] for var in input_vars],
            n_points_per_dimension=[config_dict[var]["steps"] for var in input_vars],
        )

        samples = []
        df = load_data(PROCESSED_GRIDPOINTS_INPUT_FILE)
        for i in df.index:
            sample = {var: float(df.loc[i, var]) for var in input_vars} # type: ignore
            samples.append(sample)

        _logger.debug(f"Generated {len(samples)} grid samples")
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
        
    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
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
    
    try:
        # Parse and validate request data
        request_data: dict = json.loads(request.data.decode("utf-8"))
        validated_request = validate_request_json(request_data, TestJobRequest)
        
        config = validated_request.config
        function_uid = validated_request.funUid
        functions_api = _get_functions_api()

        _logger.debug(f"Function UID: {function_uid}")
        _logger.debug(f"Validated config: {[c.dict() for c in config]}")
        
        # Convert config to sample format
        sample = {var_config.variable: var_config.value for var_config in config}

        _logger.debug(f"Sample for validation: {sample}")
        val = functions_api.validate_function_inputs(function_uid, sample)
        _logger.debug(f"Validated function inputs: {val}")
        
        parent_info = _get_parent_ids()
        response = functions_api.run_function(function_uid, body=sample,
                                             x_simcore_parent_node_id=parent_info.parent_node_id,
                                             x_simcore_parent_project_uuid=parent_info.parent_project_id)
        _logger.debug(f"Response from run_function: {response}")
        
        if not hasattr(response, "actual_instance") or response.actual_instance is None:
            raise ValueError(f"Job creation failed for function {function_uid}")
            
        uid = response.actual_instance.uid 
        _logger.debug(f"Job UID: {uid}")
        job = _get_function_job_from_uid(uid)
        _logger.debug(f"Created job: {job}")
        return jsonify(job)
        
    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
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

    try:
        # Parse and validate request data
        request_data: dict = json.loads(request.data.decode("utf-8"))
        validated_request = validate_request_json(request_data, CloneJobRequest)
        
        project_job_id = validated_request.projectJobId
        function_name = validated_request.functionName
        inputs = validated_request.projectInputs
        studies_api = _get_studies_api()
        
        _logger.debug(f"Cloning job {project_job_id} for function {function_name}")
        
        def format_inputs_for_description(inputs: dict) -> str:
            """Formats a dictionary of inputs into a human-readable string for description."""
            formatted_inputs = "\n- ".join([""]+[f"*{key}*: {float(value):.4g}" for key, value in inputs.items()])
            return f"#### Inputs:\n\n{formatted_inputs}"

        formatted_inputs = format_inputs_for_description(inputs)
        study_data = BodyCloneStudyV0StudiesStudyIdClonePost(
            title="Job " + function_name, 
            description=f"Clone of job *{project_job_id}* from function *{function_name}*.\n\n{formatted_inputs}"
        )
        _logger.debug(f"Study data: {study_data}")
        study = studies_api.clone_study(
            project_job_id, 
            hidden=False,
            body_clone_study_v0_studies_study_id_clone_post=study_data
        )
        _logger.debug(f"Cloned study: {study.to_dict()}")
        return jsonify(study.to_dict())
        
    except ValidationError as e:
        error_msg = f"Request validation failed: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
    except ValueError as e:
        error_msg = f"Invalid request data: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 400)
    except Exception as e:
        error_msg = f"Error while cloning job: {e}"
        _logger.error(error_msg)
        return make_response(jsonify(ErrorResponse(error=error_msg).dict()), 500)
