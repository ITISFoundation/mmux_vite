import os
from pathlib import Path
import json
import logging
from typing import NamedTuple
#
from flask import request, abort, jsonify, make_response, Blueprint, current_app
#
from osparc_client.models.body_clone_study_v0_studies_study_id_clone_post import BodyCloneStudyV0StudiesStudyIdClonePost
#
from mmux_flaskapi.blueprints.osparc import _get_function_job_from_uid
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
    _logger.debug("Starting flask function: flask/lhs_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))
    function_uid = None

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        config = request_data["config"]
        k = len(config) # number of variables i.e. dimensions
        seed = request_data["seed"]
        n = request_data["N"]
        function_uid = request_data["funUid"]
        
        from flaskapi.mmux_python.utils.lhs import lhs
        _logger.debug(f"config: {config} \n n: {n}, k: {k}, seed: {seed}")
        H = lhs(n, k, seed=seed)
        _logger.debug(f"H: {H.shape}")

        samples = []
        for j in range(n):
            samples.append(
                {config[i]["variable"] : float(H[i, j] * (config[i]["end"] - config[i]["start"]) + config[i]["start"]) for i in range(k)}
            )
        _logger.debug(f"Samples: {samples}")

        # Now, the running of jobs through the OSPARC API has been moved to the Python backend
        ## NB there are "registerJob(Collection)" endpoints, I could maybe use them 
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
    except Exception as e:
        _logger.error(f"Error while performing LHS sampling on function {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))  # return an error response if the function mapping fails

@sampling_bp.route("/grid", methods=["POST"])
def flask_grid_sampling():
    _logger.debug("Starting flask function: flask/grid_sampling")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        function_uid = request_data["funUid"]
        config = request_data["config"]
        input_vars = [config[i]["variable"] for i in range(len(config))] # this is the list of input variables
        run_dir = create_run_dir(Path("."), "grid_sampling") # create a run directory for the grid sampling

        from flaskapi.mmux_python.utils.funs_evaluate import create_grid_samples
        from flaskapi.mmux_python.utils.funs_data_processing import load_data
        PROCESSED_GRIDPOINTS_INPUT_FILE = create_grid_samples(
            run_dir = run_dir,
            grid_vars = input_vars,
            input_vars = input_vars,
            mins = [config[var]["start"] for var in input_vars],
            cut_values = [(config[var]["end"] + config[var]["start"]) / 2 for var in input_vars], # this is the mean of the grid points
            maxs = [config[var]["end"] for var in input_vars],
            n_points_per_dimension=[config[var]["points"] for var in input_vars], # this is the number of points per dimension
        )

        samples = []
        df = load_data(PROCESSED_GRIDPOINTS_INPUT_FILE)
        for i in df.index:
            sample = {var: float(df.loc[i, var]) for var in input_vars} # type: ignore
            samples.append(sample)

        # Now, the running of jobs through the OSPARC API has been moved to the Python backend
        ## NB there are "registerJob(Collection)" endpoints, I could maybe use them 
        _logger.debug(f"Samples: {samples}")
        _logger.debug("Grid sampling not yet tested!! TODO Double check!")
        jc = _run_sampling_map(function_uid, samples)
        return jsonify(jc)
    except Exception as e:
        _logger.error(f"Error while creating Grid Sampling of {function_uid}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))



@sampling_bp.route("/test_job", methods=["POST"])
def flask_test_job():
    _logger.debug("Starting flask function: flask/test_job")
    _logger.debug("Cwd: " + str(Path.cwd()))
    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        config = request_data["config"]
        function_uid = request_data["funUid"]
        functions_api = _get_functions_api()

        _logger.debug(f"Function UID: {function_uid}")
        _logger.debug(f"Config: {config}")
        sample = {config[i]["variable"]: config[i]["value"] for i in range(len(config))} 

        _logger.debug("Input to validate_function_inputs: %s" , sample)
        val = functions_api.validate_function_inputs(function_uid, sample)  # this is working - changing the name of the variable does return a validation error
        _logger.debug(f"Validated function inputs for function {function_uid} with sample {sample}: {val}")
        parent_info = _get_parent_ids()
        response = functions_api.run_function(function_uid, body=sample,
                                                       x_simcore_parent_node_id=parent_info.parent_node_id,
                                                       x_simcore_parent_project_uuid=parent_info.parent_project_id)
        _logger.debug(f"Response from run_function with sample {sample}: {response}")
        assert hasattr(response, "actual_instance"), f"Job is None for function {function_uid} with sample {sample}. Response: {response}"
        assert response.actual_instance is not None, f"Job is None for function {function_uid} with sample {sample}. Response: {response}"
        uid = response.actual_instance.uid 
        _logger.debug(f"Job UID: {uid}")
        job = _get_function_job_from_uid(uid)
        _logger.debug(f"Created job: {job}")
        return jsonify(job)  # return the job details as a dictionary
    except Exception as e:
        _logger.error(f"Error while testing job for function {function_uid} with config {config}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))


@sampling_bp.route("/clone_job", methods=["POST"])
def flask_clone_job():
    _logger.debug("Starting flask function: flask/clone_job")
    _logger.debug("Cwd: " + str(Path.cwd()))

    try:
        # Convert request data into a Python dictionary
        request_data: dict = json.loads(request.data.decode("utf-8"))
        project_job_id = request_data["projectJobId"]
        function_name = request_data["functionName"]
        inputs: dict = request_data["projectInputs"]
        studies_api = _get_studies_api()
        
        # Clone the job using the job_id
        def format_inputs_for_description(inputs: dict) -> str:
            """Formats a dictionary of inputs into a human-readable string for description."""
            formatted_inputs = "\n- ".join([""]+[f"*{key}*: {float(value):.4g}" for key, value in inputs.items()])
            return f"#### Inputs:\n\n{formatted_inputs}"

        formatted_inputs = format_inputs_for_description(inputs)
        study_data = BodyCloneStudyV0StudiesStudyIdClonePost(title="Job " + function_name, 
                                     description=f"Clone of job *{project_job_id}* from function *{function_name}*.\n\n{formatted_inputs}",)
        _logger.debug("Study data: ", study_data)
        study = studies_api.clone_study(project_job_id, hidden=False,
                                        body_clone_study_v0_studies_study_id_clone_post=study_data,)
        _logger.debug(f"Cloned study: {study.to_dict()}")
        _logger.debug("Done!!")
        return jsonify(study.to_dict())
    except Exception as e:
        _logger.error(f"Error while cloning job {project_job_id}: {e}")
        abort(make_response(jsonify({"error": str(e)}), 500))  # return an error response if the function mapping fails
