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
