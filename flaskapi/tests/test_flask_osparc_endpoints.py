"""
These tests cover the /flask/osparc/*** endpoints in the Flask app.

Different patches for osparc_client.api.functions_api.***Api.*** are provided, to ensure that they are handled correctly.
"""


#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################


class TestOsparcListFunctions:
    def test_list_functions_without_osparc_credentials_returns_empty_list(self, test_client):
        osparc_api = test_client.application.osparc_api
        osparc_api._configuration.host = ""
        osparc_api._configuration.username = ""
        osparc_api._configuration.password = ""

        response = test_client.get("/flask/osparc/list_functions")

        assert response.status_code == 200
        assert response.get_json() == []

    def test_list_functions_random_error(self, test_client, patch_list_functions_random_error):
        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_functions_success(self, test_client, patch_list_functions_success):
        """Test /flask/osparc/list_functions with a successful response."""
        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 3
        ## NB: this endpoint is reverting the list order to show the user newest first
        assert data[-1]["uid"] == "func1"
        assert data[-2]["name"] == "Function Two"

    def test_list_functions_empty(self, test_client, patch_list_functions_empty):
        """Test /osparc/list_functions with an empty result set."""
        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_functions_422(self, test_client, patch_list_functions_422):
        """Test /osparc/list_functions with a 422 Validation Error."""
        response = test_client.get("/flask/osparc/list_functions")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]


class TestOsparcListJobs:
    def test_list_jobs_random_error(self, test_client, patch_list_function_jobs_random_error):
        response = test_client.get("/flask/osparc/list_jobs")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_jobs_success(self, test_client, patch_list_function_jobs_success):
        """Test /osparc/list_jobs with a successful response."""
        response = test_client.get("/flask/osparc/list_jobs")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "job-1"
        assert data[1]["status"] == "PENDING"

    def test_list_jobs_empty(self, test_client, patch_list_function_jobs_empty):
        """Test /osparc/list_jobs with an empty response."""
        response = test_client.get("/flask/osparc/list_jobs")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_jobs_422(self, test_client, patch_list_function_jobs_422):
        """Test /osparc/list_jobs with a 422 error from the API client."""
        response = test_client.get("/flask/osparc/list_jobs")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]


class TestOsparcListFunctionJobCollections:
    def test_list_function_job_collections_random_error(
        self, test_client, patch_list_function_job_collections_random_error
    ):
        response = test_client.get("/flask/osparc/list_function_job_collections")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_function_job_collections_success(
        self, test_client, patch_list_function_job_collections_success
    ):
        response = test_client.get("/flask/osparc/list_function_job_collections")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "jc-1"
        assert data[1]["uid"] == "jc-2"

    def test_list_function_job_collections_empty(
        self, test_client, patch_list_function_job_collections_empty
    ):
        response = test_client.get("/flask/osparc/list_function_job_collections")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_job_collections_422(
        self, test_client, patch_list_function_job_collections_422
    ):
        response = test_client.get("/flask/osparc/list_function_job_collections")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################


# --- Tests for /osparc/list_function_jobs_for_functionid ---
class TestOsparcListFunctionJobsForFunctionId:
    def test_list_function_jobs_for_functionid_random_error(
        self, test_client, patch_list_function_jobs_for_functionid_random_error
    ):
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?functionUid=func1"
        )
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_function_jobs_for_functionid_success(
        self, test_client, patch_list_function_jobs_for_functionid_success
    ):
        """Test /osparc/list_function_jobs_for_functionid with a successful response."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?functionUid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert all(job["functionUid"] == "func1" for job in data)

    def test_list_function_jobs_for_functionid_accepts_snake_case_query_param(
        self, test_client, patch_list_function_jobs_for_functionid_success
    ):
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?function_uid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_list_function_jobs_for_functionid_empty(
        self, test_client, patch_list_function_jobs_for_functionid_empty
    ):
        """Test /osparc/list_function_jobs_for_functionid with an empty result set."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?functionUid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_jobs_for_functionid_422(
        self, test_client, patch_list_function_jobs_for_functionid_422
    ):
        """Test /osparc/list_function_jobs_for_functionid with a 422 Validation Error."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?functionUid=func1"
        )
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_list_function_jobs_for_functionid_404(
        self, test_client, patch_list_function_jobs_for_functionid_404
    ):
        """Test /osparc/list_function_jobs_for_functionid with a 404 Not Found error."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_functionid?functionUid=notfound"
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]


class TestOsparcListFunctionJobsForJobCollectionId:
    def test_list_function_jobs_for_jobcollectionid_random_error(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_random_error
    ):
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=jc-1"
        )
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_function_jobs_for_jobcollectionid_success(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_success
    ):
        """Test /osparc/list_function_jobs_for_jobcollectionid with a successful response."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=jc-1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "job-1"
        assert data[1]["uid"] == "job-2"

    def test_list_function_jobs_for_jobcollectionid_accepts_snake_case_query_param(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_success
    ):
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?job_collection_uid=jc-1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_list_function_jobs_for_jobcollectionid_empty(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_empty
    ):
        """Test /osparc/list_function_jobs_for_jobcollectionid with an empty job collection."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=jc-1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_jobs_for_jobcollectionid_422(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_422
    ):
        """Test /osparc/list_function_jobs_for_jobcollectionid with a 422 Validation Error."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=jc-1"
        )
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_list_function_jobs_for_jobcollectionid_404(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_404
    ):
        """Test /osparc/list_function_jobs_for_jobcollectionid with a 404 Not Found error (collection)."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=notfound"
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]

    def test_list_function_jobs_for_jobcollectionid_job_404(
        self, test_client, patch_list_function_jobs_for_jobcollectionid_job_404
    ):
        """Test /osparc/list_function_jobs_for_jobcollectionid with a 404 Not Found error (job)."""
        response = test_client.get(
            "/flask/osparc/list_function_jobs_for_jobcollectionid?JobCollectionUid=jc-1"
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]


# --- Tests for /osparc/list_function_job_collections_for_functionid ---
### NB using same fixtures as list_function_job_collections (without passing function_id param) ---
### because it uses the same osparc_client endpoint
class TestOsparcListFunctionJobCollectionsForFunctionId:
    def test_list_function_job_collections_for_functionid_random_error(
        self, test_client, patch_list_function_job_collections_for_functionid_random_error
    ):
        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?functionUid=func1"
        )
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_list_function_job_collections_for_functionid_success(
        self, test_client, patch_list_function_job_collections_success
    ):
        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?functionUid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "jc-1"
        assert data[1]["uid"] == "jc-2"
        assert data[0]["jobIds"] == ["job-1", "job-2"]

    def test_list_function_job_collections_for_functionid_accepts_snake_case_query_param(
        self, test_client, patch_list_function_job_collections_success
    ):
        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?function_uid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_list_function_job_collections_for_functionid_empty(
        self, test_client, patch_list_function_job_collections_empty
    ):
        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?functionUid=func1"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_job_collections_for_functionid_422(
        self, test_client, patch_list_function_job_collections_422
    ):
        response = test_client.get(
            "/flask/osparc/list_function_job_collections_for_functionid?functionUid=func1"
        )
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]


###########################################################################################
## Endpoints to get a single Job information (general info, status, outputs) from its UID
###########################################################################################


# --- Tests for /osparc/get_function_job ---
class TestOsparcGetFunctionJob:
    def test_get_function_job_random_error(self, test_client, patch_get_function_job_random_error):
        response = test_client.get("/flask/osparc/get_function_job?jobUid=job-1")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_get_function_job_success(self, test_client, patch_get_function_job_success):
        response = test_client.get("/flask/osparc/get_function_job?jobUid=job-1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["uid"] == "job-1"
        assert data["status"] == "SUCCESS"
        assert data["outputs"]["result"] == 3

    def test_get_function_job_422(self, test_client, patch_get_function_job_422):
        response = test_client.get("/flask/osparc/get_function_job?jobUid=job-1")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_get_function_job_404(self, test_client, patch_get_function_job_404):
        response = test_client.get("/flask/osparc/get_function_job?jobUid=notfound")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]


# --- Tests for /osparc/get_function_job_status ---
class TestOsparcGetFunctionJobStatus:
    def test_get_function_job_status_random_error(
        self, test_client, patch_get_function_job_status_random_error
    ):
        response = test_client.get("/flask/osparc/get_function_job_status?jobUid=job-1")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_get_function_job_status_success(
        self, test_client, patch_get_function_job_status_success
    ):
        response = test_client.get("/flask/osparc/get_function_job_status?jobUid=job-1")
        assert response.status_code == 200
        assert response.get_json()["status"] == "SUCCESS"

    def test_get_function_job_status_422(self, test_client, patch_get_function_job_status_422):
        response = test_client.get("/flask/osparc/get_function_job_status?jobUid=job-1")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_get_function_job_status_404(self, test_client, patch_get_function_job_status_404):
        response = test_client.get("/flask/osparc/get_function_job_status?jobUid=notfound")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]


# --- Tests for /osparc/get_function_job_outputs ---
class TestOsparcGetFunctionJobOutputs:
    def test_get_function_job_outputs_random_error(
        self, test_client, patch_get_function_job_outputs_random_error
    ):
        response = test_client.get("/flask/osparc/get_function_job_outputs?jobUid=job-1")
        assert response.status_code in {418, 429, 431, 499}
        data = response.get_json()
        assert "error" in data
        assert "random error" in data["error"].lower()

    def test_get_function_job_outputs_success(
        self, test_client, patch_get_function_job_outputs_success
    ):
        response = test_client.get("/flask/osparc/get_function_job_outputs?jobUid=job-1")
        assert response.status_code == 200
        data = response.get_json()
        assert data["result"] == 3

    def test_get_function_job_outputs_422(self, test_client, patch_get_function_job_outputs_422):
        response = test_client.get("/flask/osparc/get_function_job_outputs?jobUid=job-1")
        assert response.status_code == 422
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_get_function_job_outputs_404(self, test_client, patch_get_function_job_outputs_404):
        response = test_client.get("/flask/osparc/get_function_job_outputs?jobUid=notfound")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]
