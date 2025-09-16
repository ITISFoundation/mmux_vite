from unittest.mock import patch

@patch("mmux_flaskapi.blueprints.osparc.flask_list_functions")
def test_list_functions_endpoint(test_client):
    """Test the /osparc/list_functions endpoint."""

    response = test_client.get("/osparc/list_functions")
    assert response.status_code == 200, "Expected status code 200"
    assert response.is_json, "Response should be in JSON format"
    data = response.get_json()
    assert isinstance(data, list), "Response should be a list"
    assert len(data) > 0, "Response list should not be empty"
    first_function = data[0]
    assert "uid" in first_function, "Each function should have 'uid'"
    assert "name" in first_function, "Each function should have 'name'"
    assert "description" in first_function, "Each function should have 'description'"

class TestOsparcApiResponses:
    def test_list_functions_success(self, test_client, patch_list_functions_success):
        """Test /osparc/list_functions with a successful response."""
        response = test_client.get("/osparc/list_functions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["uid"] == "func-1"
        assert data[1]["name"] == "Function Two"

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
