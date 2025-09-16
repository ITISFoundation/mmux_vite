"""
These tests cover the /osparc/*** endpoints in the Flask app.

Different patches for osparc_client.api.functions_api.***Api.*** are provided, to ensure that they are handled correctly.
"""

class TestOsparcListFunctions:
    def test_list_functions_success(self, test_client, patch_list_functions_success):
        """Test /osparc/list_functions with a successful response."""
        response = test_client.get("/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 3
        ## NB: this endpoint is reverting the list order to show the user newest first
        assert data[-1]["uid"] == "func-1"
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

