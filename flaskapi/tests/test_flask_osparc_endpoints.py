"""
These tests cover the /osparc/*** endpoints in the Flask app.

Different patches for osparc_client.api.functions_api.***Api.*** are provided, to ensure that they are handled correctly.
"""


#####################################################################################
## Listing endpoints for Functions, Jobs, Job Collections
#####################################################################################

class TestOsparcListFunctions:
    def test_list_functions_success(self, test_client, patch_list_functions_success):
        """Test /osparc/list_functions with a successful response."""
        response = test_client.get("/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 3
        ## NB: this endpoint is reverting the list order to show the user newest first
        assert data[-1]["uid"] == "func1"
        assert data[-2]["name"] == "Function Two"

    def test_list_functions_empty(self, test_client, patch_list_functions_empty):
        """Test /osparc/list_functions with an empty result set."""
        response = test_client.get("/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_functions_422(self, test_client, patch_list_functions_422):
        """Test /osparc/list_functions with a 422 Validation Error."""
        response = test_client.get("/osparc/list_functions")
        # the osparc call raises a 422, but our endpoint raises a generic 500 error - TODO improve??
        assert response.status_code == 500
        assert "error" in response.get_json()

class TestOsparcListJobs:
    def test_list_jobs_success(self, test_client, patch_list_function_jobs_success):
        """Test /osparc/list_jobs with a successful response."""
        response = test_client.get("/osparc/list_jobs")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "job-1"
        assert data[1]["status"] == "PENDING"

    def test_list_jobs_empty(self, test_client, patch_list_function_jobs_empty):
        """Test /osparc/list_jobs with an empty response."""
        response = test_client.get("/osparc/list_jobs")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_jobs_422(self, test_client, patch_list_function_jobs_422):
        """Test /osparc/list_jobs with a 422 error from the API client."""
        response = test_client.get("/osparc/list_jobs")
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

class TestOsparcListFunctionJobCollections:
    def test_list_function_job_collections_success(self, test_client, patch_list_function_job_collections_success):
        response = test_client.get("/osparc/list_function_job_collections")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "jc-1"
        assert data[1]["uid"] == "jc-2"

    def test_list_function_job_collections_empty(self, test_client, patch_list_function_job_collections_empty):
        response = test_client.get("/osparc/list_function_job_collections")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_job_collections_422(self, test_client, patch_list_function_job_collections_422):
        response = test_client.get("/osparc/list_function_job_collections")
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]


#################################################################################
## Listing endpoints based on ID (function or job collection)
#################################################################################

# --- Tests for /osparc/list_function_jobs_for_functionid ---
class TestOsparcListFunctionJobsForFunctionId:
    def test_list_function_jobs_for_functionid_success(self, test_client, patch_list_function_jobs_for_functionid_success):
        """Test /osparc/list_function_jobs_for_functionid with a successful response."""
        response = test_client.get("/osparc/list_function_jobs_for_functionid?functionUid=func1")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert all(job["function_uid"] == "func1" for job in data)

    def test_list_function_jobs_for_functionid_empty(self, test_client, patch_list_function_jobs_for_functionid_empty):
        """Test /osparc/list_function_jobs_for_functionid with an empty result set."""
        response = test_client.get("/osparc/list_function_jobs_for_functionid?functionUid=func1")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_function_jobs_for_functionid_422(self, test_client, patch_list_function_jobs_for_functionid_422):
        """Test /osparc/list_function_jobs_for_functionid with a 422 Validation Error."""
        response = test_client.get("/osparc/list_function_jobs_for_functionid?functionUid=func1")
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "422" in data["error"]

    def test_list_function_jobs_for_functionid_404(self, test_client, patch_list_function_jobs_for_functionid_404):
        """Test /osparc/list_function_jobs_for_functionid with a 404 Not Found error."""
        response = test_client.get("/osparc/list_function_jobs_for_functionid?functionUid=notfound")
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data
        assert "404" in data["error"]
