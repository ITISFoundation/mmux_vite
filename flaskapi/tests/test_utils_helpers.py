"""
Tests for the helpers utility module.

This module tests all utility functions including case conversion,
pagination helpers, variable sanitization, and other utility functions.
"""

import os
from unittest.mock import Mock, patch

import pandas as pd
import pytest

from mmux_flaskapi.utils.case_preserving import (
    FunctionVariablesDict,
    FunctionVariableStr,
    PreserveCaseTransform,
    has_preserve_case_metadata,
    wrap_function_variable_str,
    wrap_function_variables_dict,
)
from mmux_flaskapi.utils.helpers import (
    _get_all_items,
    _get_first_N_items,
    _get_last_N_items,
    camel_to_snake,
    create_run_dir,
    dict_keys_camel_to_snake,
    dict_keys_snake_to_camel,
    is_test_environment,
    recursive_dict_keys_camel_to_snake,
    recursive_dict_keys_snake_to_camel,
    sanitize_varname,
    sanitize_varnames,
    sanitize_varnames_df,
    sanitize_varnames_dict,
    snake_to_camel,
)


class TestEnvironmentDetection:
    """Test environment detection functionality."""

    def test_is_test_environment_true(self):
        """Test is_test_environment returns True when test is in OSPARC_API_BASE_URL."""
        with patch.dict(os.environ, {"OSPARC_API_BASE_URL": "https://test.example.com"}):
            assert is_test_environment() is True

    def test_is_test_environment_true_uppercase(self):
        """Test is_test_environment returns True when TEST is in OSPARC_API_BASE_URL."""
        with patch.dict(os.environ, {"OSPARC_API_BASE_URL": "https://TEST.example.com"}):
            assert is_test_environment() is True

    def test_is_test_environment_false(self):
        """Test is_test_environment returns False when test is not in URL."""
        with patch.dict(os.environ, {"OSPARC_API_BASE_URL": "https://prod.example.com"}):
            assert is_test_environment() is False

    def test_is_test_environment_no_env_var(self):
        """Test is_test_environment returns False when OSPARC_API_BASE_URL is not set."""
        with patch.dict(os.environ, {}, clear=True):
            assert is_test_environment() is False

    def test_is_test_environment_empty_string(self):
        """Test is_test_environment returns False when OSPARC_API_BASE_URL is empty."""
        with patch.dict(os.environ, {"OSPARC_API_BASE_URL": ""}):
            assert is_test_environment() is False


class TestRunDirectoryCreation:
    """Test run directory creation functionality."""

    def test_create_run_dir_default_name(self, tmp_path):
        """Test create_run_dir with default sampling directory name."""
        script_dir = tmp_path

        with (
            patch("mmux_flaskapi.utils.helpers.datetime") as mock_datetime,
            patch("mmux_flaskapi.utils.helpers.uuid") as mock_uuid,
        ):
            mock_datetime.datetime.now.return_value.strftime.return_value = "20231020.143000"
            mock_uuid.uuid4.return_value.hex = "test123456"

            result_dir = create_run_dir(script_dir)

            expected_name = "dakota_20231020.143000_test123456_sampling"
            expected_path = script_dir / "runs" / expected_name

            assert result_dir == expected_path
            assert result_dir.exists()

    def test_create_run_dir_custom_name(self, tmp_path):
        """Test create_run_dir with custom directory name."""
        script_dir = tmp_path
        custom_name = "evaluation"

        with (
            patch("mmux_flaskapi.utils.helpers.datetime") as mock_datetime,
            patch("mmux_flaskapi.utils.helpers.uuid") as mock_uuid,
        ):
            mock_datetime.datetime.now.return_value.strftime.return_value = "20231020.143000"
            mock_uuid.uuid4.return_value.hex = "test123456"

            result_dir = create_run_dir(script_dir, custom_name)

            expected_name = "dakota_20231020.143000_test123456_evaluation"
            expected_path = script_dir / "runs" / expected_name

            assert result_dir == expected_path
            assert result_dir.exists()

    def test_create_run_dir_existing_directory(self, tmp_path):
        """Test create_run_dir when directory already exists."""
        script_dir = tmp_path

        # Create the runs directory first
        runs_dir = script_dir / "runs"
        runs_dir.mkdir()

        with (
            patch("mmux_flaskapi.utils.helpers.datetime") as mock_datetime,
            patch("mmux_flaskapi.utils.helpers.uuid") as mock_uuid,
        ):
            mock_datetime.datetime.now.return_value.strftime.return_value = "20231020.143000"
            mock_uuid.uuid4.return_value.hex = "test123456"

            # Create the directory first
            expected_name = "dakota_20231020.143000_test123456_sampling"
            expected_path = script_dir / "runs" / expected_name
            expected_path.mkdir(parents=True)

            # Should not raise error when directory exists
            result_dir = create_run_dir(script_dir)

            assert result_dir == expected_path
            assert result_dir.exists()


class TestCaseConversion:
    """Test case conversion functions."""

    def test_camel_to_snake_basic(self):
        """Test basic camelCase to snake_case conversion."""
        assert camel_to_snake("camelCase") == "camel_case"
        assert camel_to_snake("myVariableName") == "my_variable_name"
        assert camel_to_snake("simpleTest") == "simple_test"

    def test_camel_to_snake_edge_cases(self):
        """Test edge cases for camelCase to snake_case conversion."""
        assert camel_to_snake("a") == "a"
        assert camel_to_snake("A") == "a"
        assert camel_to_snake("aB") == "a_b"
        assert camel_to_snake("ABC") == "abc"
        assert camel_to_snake("myHTMLParser") == "my_htmlparser"

    def test_snake_to_camel_basic(self):
        """Test basic snake_case to camelCase conversion."""
        assert snake_to_camel("snake_case") == "snakeCase"
        assert snake_to_camel("my_variable_name") == "myVariableName"
        assert snake_to_camel("simple_test") == "simpleTest"

    def test_snake_to_camel_edge_cases(self):
        """Test edge cases for snake_case to camelCase conversion."""
        assert snake_to_camel("a") == "a"
        assert snake_to_camel("a_b") == "aB"
        assert snake_to_camel("single") == "single"
        assert snake_to_camel("my_html_parser") == "myHtmlParser"

    def test_dict_keys_camel_to_snake(self):
        """Test dictionary key conversion from camelCase to snake_case."""
        input_dict = {"firstName": "John", "lastName": "Doe", "emailAddress": "john@example.com"}
        expected = {"first_name": "John", "last_name": "Doe", "email_address": "john@example.com"}
        assert dict_keys_camel_to_snake(input_dict) == expected

    def test_dict_keys_snake_to_camel(self):
        """Test dictionary key conversion from snake_case to camelCase."""
        input_dict = {"first_name": "John", "last_name": "Doe", "email_address": "john@example.com"}
        expected = {"firstName": "John", "lastName": "Doe", "emailAddress": "john@example.com"}
        assert dict_keys_snake_to_camel(input_dict) == expected


class TestRecursiveDictConversion:
    """Test recursive dictionary conversion functions."""

    def test_recursive_dict_keys_camel_to_snake_basic(self):
        """Test basic recursive conversion from camelCase to snake_case."""
        input_dict = {
            "firstName": "John",
            "userInfo": {"emailAddress": "john@example.com", "phoneNumber": "123-456-7890"},
        }
        expected = {
            "first_name": "John",
            "user_info": {"email_address": "john@example.com", "phone_number": "123-456-7890"},
        }
        result = recursive_dict_keys_camel_to_snake(input_dict)
        assert result == expected

    def test_recursive_dict_keys_camel_to_snake_with_lists(self):
        """Test recursive conversion with lists containing dictionaries."""
        input_dict = {
            "userList": [
                {"firstName": "John", "lastName": "Doe"},
                {"firstName": "Jane", "lastName": "Smith"},
            ]
        }
        expected = {
            "user_list": [
                {"first_name": "John", "last_name": "Doe"},
                {"first_name": "Jane", "last_name": "Smith"},
            ]
        }
        result = recursive_dict_keys_camel_to_snake(input_dict)
        assert result == expected

    def test_recursive_dict_keys_camel_to_snake_max_depth(self):
        """Test recursive conversion with max depth limit."""
        input_dict = {"levelOne": {"levelTwo": {"levelThree": "should_not_convert"}}}
        expected = {
            "level_one": {
                "level_two": {
                    "levelThree": "should_not_convert"  # Not converted due to depth limit
                }
            }
        }
        result = recursive_dict_keys_camel_to_snake(input_dict, max_depth=1)
        assert result == expected

    def test_recursive_dict_keys_snake_to_camel_basic(self):
        """Test basic recursive conversion from snake_case to camelCase."""
        input_dict = {
            "first_name": "John",
            "user_info": {"email_address": "john@example.com", "phone_number": "123-456-7890"},
        }
        expected = {
            "firstName": "John",
            "userInfo": {"emailAddress": "john@example.com", "phoneNumber": "123-456-7890"},
        }
        result = recursive_dict_keys_snake_to_camel(input_dict)
        assert result == expected

    def test_recursive_dict_keys_snake_to_camel_with_lists(self):
        """Test recursive conversion with lists containing dictionaries."""
        input_dict = {
            "user_list": [
                {"first_name": "John", "last_name": "Doe"},
                {"first_name": "Jane", "last_name": "Smith"},
            ]
        }
        expected = {
            "userList": [
                {"firstName": "John", "lastName": "Doe"},
                {"firstName": "Jane", "lastName": "Smith"},
            ]
        }
        result = recursive_dict_keys_snake_to_camel(input_dict)
        assert result == expected

    def test_recursive_conversion_lists_with_non_dict_items(self):
        """Test recursive conversion with lists containing non-dictionary items."""
        input_dict = {"mixedList": [{"firstName": "John"}, "string_item", 123, {"lastName": "Doe"}]}
        expected = {
            "mixed_list": [{"first_name": "John"}, "string_item", 123, {"last_name": "Doe"}]
        }
        result = recursive_dict_keys_camel_to_snake(input_dict)
        assert result == expected


class TestPaginationHelpers:
    """Test pagination helper functions."""

    def test_get_all_items_basic(self):
        """Test _get_all_items with basic pagination."""
        # Mock API response
        mock_item1 = Mock()
        mock_item1.to_dict.return_value = {"firstName": "John", "id": 1}
        mock_item2 = Mock()
        mock_item2.to_dict.return_value = {"firstName": "Jane", "id": 2}

        mock_response1 = Mock()
        mock_response1.total = 2
        mock_response1.items = [mock_item1]

        mock_response2 = Mock()
        mock_response2.total = 2
        mock_response2.items = [mock_item2]

        # Mock API call
        mock_api_call = Mock()
        mock_api_call.side_effect = [
            Mock(total=2),  # First call with limit=1 to get total
            mock_response1,  # Second call with actual data
            mock_response2,  # Third call with remaining data
        ]

        result = _get_all_items(mock_api_call)

        expected = [{"first_name": "John", "id": 1}, {"first_name": "Jane", "id": 2}]
        assert result == expected

    def test_get_all_items_with_custom_limit(self):
        """Test _get_all_items with custom limit parameter."""
        mock_item = Mock()
        mock_item.to_dict.return_value = {"firstName": "John", "id": 1}

        mock_response = Mock()
        mock_response.total = 1
        mock_response.items = [mock_item]

        mock_api_call = Mock()
        mock_api_call.side_effect = [Mock(total=1), mock_response]

        result = _get_all_items(mock_api_call, some_arg="value")

        expected = [{"first_name": "John", "id": 1}]
        assert result == expected

    def test_get_first_n_items_basic(self):
        """Test _get_first_N_items with basic functionality."""
        mock_item1 = Mock()
        mock_item1.to_dict.return_value = {"firstName": "John", "id": 1}
        mock_item2 = Mock()
        mock_item2.to_dict.return_value = {"firstName": "Jane", "id": 2}

        mock_response = Mock()
        mock_response.total = 5
        mock_response.items = [mock_item1, mock_item2]

        mock_api_call = Mock()
        mock_api_call.side_effect = [
            Mock(total=5),  # First call to get total
            mock_response,  # Second call to get items
        ]

        result = _get_first_N_items(mock_api_call, 2)

        expected = [{"first_name": "John", "id": 1}, {"first_name": "Jane", "id": 2}]
        assert result == expected

    def test_get_first_n_items_n_greater_than_available(self):
        """Test _get_first_N_items when N is greater than available items."""
        mock_item = Mock()
        mock_item.to_dict.return_value = {"firstName": "John", "id": 1}

        mock_response = Mock()
        mock_response.total = 1
        mock_response.items = [mock_item]

        mock_api_call = Mock()
        mock_api_call.side_effect = [Mock(total=1), mock_response]

        # Request 5 items but only 1 available
        result = _get_first_N_items(mock_api_call, 5)

        expected = [{"first_name": "John", "id": 1}]
        assert result == expected

    def test_get_last_n_items_basic(self):
        """Test _get_last_N_items with basic functionality."""
        mock_item1 = Mock()
        mock_item1.to_dict.return_value = {"firstName": "John", "id": 4}
        mock_item2 = Mock()
        mock_item2.to_dict.return_value = {"firstName": "Jane", "id": 5}

        mock_response = Mock()
        mock_response.total = 5
        mock_response.items = [mock_item1, mock_item2]

        mock_api_call = Mock()
        mock_api_call.side_effect = [
            Mock(total=5),  # First call to get total
            mock_response,  # Second call to get items
        ]

        result = _get_last_N_items(mock_api_call, 2)

        expected = [{"first_name": "John", "id": 4}, {"first_name": "Jane", "id": 5}]
        assert result == expected

        # Verify offset calculation: total(5) - N(2) = 3
        mock_api_call.assert_called_with(offset=3, limit=2)

    def test_get_last_n_items_n_greater_than_available(self):
        """Test _get_last_N_items when N is greater than available items."""
        mock_item = Mock()
        mock_item.to_dict.return_value = {"firstName": "John", "id": 1}

        mock_response = Mock()
        mock_response.total = 1
        mock_response.items = [mock_item]

        mock_api_call = Mock()
        mock_api_call.side_effect = [Mock(total=1), mock_response]

        # Request 5 items but only 1 available
        result = _get_last_N_items(mock_api_call, 5)

        expected = [{"first_name": "John", "id": 1}]
        assert result == expected

        # Verify offset calculation: total(1) - N(1) = 0
        mock_api_call.assert_called_with(offset=0, limit=1)


class TestVariableSanitization:
    """Test variable name sanitization functions."""

    def test_sanitize_varnames_string(self):
        """Test sanitize_varnames with string input."""
        assert sanitize_varnames("my variable") == "my_variable"
        assert sanitize_varnames("test@email.com") == "test_email_com"
        assert sanitize_varnames("var-with-hyphens") == "var_with_hyphens"  # Hyphens replaced
        assert sanitize_varnames("var*with*asterisks") == "var*with*asterisks"  # Asterisks allowed
        assert sanitize_varnames("var+with+plus") == "var+with+plus"  # Plus allowed
        assert sanitize_varnames("var/with/slash") == "var/with/slash"  # Slash allowed

    def test_sanitize_varnames_list(self):
        """Test sanitize_varnames with list input."""
        input_list = ["my variable", "test@email", "normal_var"]
        expected = ["my_variable", "test_email", "normal_var"]
        assert sanitize_varnames(input_list) == expected

    def test_sanitize_varnames_dict_simple(self):
        """Test sanitize_varnames with simple dictionary input."""
        input_dict = {"my variable": "value1", "test@email": "value2", "normal_var": "value3"}
        expected = {"my_variable": "value1", "test_email": "value2", "normal_var": "value3"}
        assert sanitize_varnames(input_dict) == expected

    def test_sanitize_varnames_dict_nested(self):
        """Test sanitize_varnames with nested dictionary input."""
        input_dict = {
            "my variable": {"nested@key": "value1", "normal_key": "value2"},
            "outer key": "value3",
        }
        expected = {
            "my_variable": {"nested_key": "value1", "normal_key": "value2"},
            "outer_key": "value3",
        }
        assert sanitize_varnames(input_dict) == expected

    def test_sanitize_varnames_dataframe(self):
        """Test sanitize_varnames with DataFrame input."""
        df = pd.DataFrame(
            {"my variable": [1, 2, 3], "test@email": [4, 5, 6], "normal_var": [7, 8, 9]}
        )

        result = sanitize_varnames(df)
        expected_columns = ["my_variable", "test_email", "normal_var"]

        assert list(result.columns) == expected_columns
        assert result.equals(
            pd.DataFrame(
                {"my_variable": [1, 2, 3], "test_email": [4, 5, 6], "normal_var": [7, 8, 9]}
            )
        )

    def test_sanitize_varnames_unsupported_type(self):
        """Test sanitize_varnames with unsupported input type."""
        with pytest.raises(TypeError, match="Unsupported input type"):
            sanitize_varnames(123)  # type: ignore

    def test_sanitize_varnames_special_characters(self):
        """Test sanitize_varnames with various special characters."""
        test_cases = [
            ("var with spaces", "var_with_spaces"),
            ("var!with!exclamation", "var_with_exclamation"),
            ("var#with#hash", "var_with_hash"),
            ("var$with$dollar", "var_with_dollar"),
            ("var%with%percent", "var_with_percent"),
            ("var&with&ampersand", "var_with_ampersand"),
            ("var(with)parentheses", "var_with_parentheses"),
            ("var[with]brackets", "var_with_brackets"),
            ("var{with}braces", "var_with_braces"),
            ("var=with=equals", "var_with_equals"),
            ("var?with?question", "var_with_question"),
            ("var:with:colon", "var_with_colon"),
            ("var;with;semicolon", "var_with_semicolon"),
            ("var,with,comma", "var_with_comma"),
            ("var.with.dot", "var_with_dot"),
            ("var<with>angles", "var_with_angles"),
            ('var"with"quotes', "var_with_quotes"),
            ("var'with'apostrophe", "var_with_apostrophe"),
            ("var|with|pipe", "var_with_pipe"),
            ("var\\with\\backslash", "var_with_backslash"),
            ("var~with~tilde", "var_with_tilde"),
            ("var`with`backtick", "var_with_backtick"),
        ]

        for input_var, expected in test_cases:
            assert sanitize_varnames(input_var) == expected

    def test_sanitize_varnames_preserve_allowed_chars(self):
        """Test that sanitize_varnames preserves allowed special characters."""
        test_cases = [
            ("var_with_underscore", "var_with_underscore"),
            ("var*with*asterisk", "var*with*asterisk"),
            ("var-with-hyphen", "var_with_hyphen"),  # Hyphens get replaced
            ("var+with+plus", "var+with+plus"),
            ("var/with/slash", "var/with/slash"),
            ("123numeric456", "123numeric456"),
            ("mixedCASE", "mixedCASE"),
        ]

        for input_var, expected in test_cases:
            assert sanitize_varnames(input_var) == expected

    def test_sanitize_varname_alias(self):
        """Test that sanitize_varname is an alias for sanitize_varnames."""
        test_string = "my variable"
        assert sanitize_varname(test_string) == sanitize_varnames(test_string)

    def test_sanitize_varnames_dict_alias(self):
        """Test that sanitize_varnames_dict is an alias for sanitize_varnames."""
        test_dict = {"my variable": "value"}
        assert sanitize_varnames_dict(test_dict) == sanitize_varnames(test_dict)

    def test_sanitize_varnames_df_alias(self):
        """Test that sanitize_varnames_df is an alias for sanitize_varnames."""
        test_df = pd.DataFrame({"my variable": [1, 2, 3]})
        result1 = sanitize_varnames_df(test_df)
        result2 = sanitize_varnames(test_df)
        assert result1.equals(result2)

    def test_sanitize_varnames_empty_inputs(self):
        """Test sanitize_varnames with empty inputs."""
        # Empty string
        assert sanitize_varnames("") == ""

        # Empty list
        assert sanitize_varnames([]) == []

        # Empty dict
        assert sanitize_varnames({}) == {}

        # Empty DataFrame
        empty_df = pd.DataFrame()
        result = sanitize_varnames(empty_df)
        assert result.empty

    def test_sanitize_varnames_iterable_non_string(self):
        """Test sanitize_varnames with iterable containing non-strings."""
        # This should test the hasattr check for __iter__
        # The function expects strings, so we pass string representations
        input_data = ["1", "2", "3"]  # String numbers that can be sanitized
        result = sanitize_varnames(input_data)  # type: ignore
        expected = ["1", "2", "3"]
        assert result == expected


class TestCasePreservingModule:
    """Unit tests for utils/case_preserving.py."""

    def test_has_preserve_case_metadata_true(self):
        """has_preserve_case_metadata returns True when PreserveCaseTransform is present."""
        assert has_preserve_case_metadata([PreserveCaseTransform()]) is True

    def test_has_preserve_case_metadata_false_empty(self):
        """has_preserve_case_metadata returns False for empty metadata."""
        assert has_preserve_case_metadata([]) is False

    def test_has_preserve_case_metadata_false_other_items(self):
        """has_preserve_case_metadata returns False when no PreserveCaseTransform present."""
        assert has_preserve_case_metadata(["string", 42, object()]) is False

    def test_wrap_function_variables_dict_new(self):
        """wrap_function_variables_dict wraps a plain dict."""
        d = {"k": 1}
        result = wrap_function_variables_dict(d)
        assert isinstance(result, FunctionVariablesDict)
        assert result == {"k": 1}

    def test_wrap_function_variables_dict_idempotent(self):
        """wrap_function_variables_dict is a no-op on an already-wrapped dict."""
        d = FunctionVariablesDict({"k": 1})
        assert wrap_function_variables_dict(d) is d

    def test_wrap_function_variable_str_new(self):
        """wrap_function_variable_str wraps a plain string."""
        result = wrap_function_variable_str("angleWidth")
        assert isinstance(result, FunctionVariableStr)
        assert result == "angleWidth"

    def test_wrap_function_variable_str_idempotent(self):
        """wrap_function_variable_str is a no-op on an already-wrapped string."""
        s = FunctionVariableStr("angleWidth")
        assert wrap_function_variable_str(s) is s

    def test_function_variables_dict_is_dict_subclass(self):
        """FunctionVariablesDict must be a dict subclass for normal dict usage."""
        d = FunctionVariablesDict(a=1, b=2)
        assert isinstance(d, dict)
        assert d["a"] == 1

    def test_function_variable_str_is_str_subclass(self):
        """FunctionVariableStr must be a str subclass for normal str usage."""
        s = FunctionVariableStr("hello")
        assert isinstance(s, str)
        assert s.upper() == "HELLO"


class TestPreserveCaseConversion:
    """Test that preserve-case wrappers and subtree keys survive snake↔camel conversion."""

    def test_function_variables_dict_not_converted_snake_to_camel(self):
        """FunctionVariablesDict values are returned as-is."""
        var_dict = FunctionVariablesDict({"angleWidth": 1.0, "peak_Averaged_Field": 2.0})
        result = recursive_dict_keys_snake_to_camel({"inputs": var_dict})
        assert result["inputs"] is var_dict

    def test_function_variables_dict_not_converted_camel_to_snake(self):
        """FunctionVariablesDict values are returned as-is during camel→snake."""
        var_dict = FunctionVariablesDict({"angleWidth": 1.0, "peakField": 2.0})
        result = recursive_dict_keys_camel_to_snake({"inputs": var_dict})
        assert result["inputs"] is var_dict

    def test_preserve_subtree_keys_inputs(self):
        """Keys under 'inputs' subtree are NOT snake↔camel converted (V13)."""
        payload = {"some_field": 1, "inputs": {"angleWidth": 1.0, "peak_Averaged_Field": 2.0}}
        result = recursive_dict_keys_snake_to_camel(payload)
        assert result["someField"] == 1
        assert result["inputs"] == {"angleWidth": 1.0, "peak_Averaged_Field": 2.0}

    def test_preserve_subtree_keys_outputs(self):
        """Keys under 'outputs' subtree are NOT converted."""
        payload = {"outputs": {"dragForce": 42.0, "lift_coefficient": 3.14}}
        result = recursive_dict_keys_snake_to_camel(payload)
        assert result["outputs"] == {"dragForce": 42.0, "lift_coefficient": 3.14}

    def test_preserve_subtree_keys_properties(self):
        """Keys under 'properties' subtree are NOT converted."""
        payload = {"properties": {"myVar": 1, "another_var": 2}}
        result = recursive_dict_keys_snake_to_camel(payload)
        assert result["properties"] == {"myVar": 1, "another_var": 2}

    def test_preserve_current_level_keys_predictions(self):
        """Predictions: variable-name keys preserved, nested values still converted."""
        payload = {
            "predictions": {
                "angleWidth": {"some_field": [1.0, 2.0]},
                "peakField": {"other_value": [3.0]},
            }
        }
        result = recursive_dict_keys_snake_to_camel(payload)
        preds = result["predictions"]
        # Variable-name keys preserved
        assert "angleWidth" in preds
        assert "peakField" in preds
        # Nested field keys still converted
        assert "someField" in preds["angleWidth"]
        assert "otherValue" in preds["peakField"]

    def test_dict_keys_camel_to_snake_skips_function_variables_dict(self):
        """dict_keys_camel_to_snake returns FunctionVariablesDict unchanged."""
        var_dict = FunctionVariablesDict({"camelKey": 1})
        assert dict_keys_camel_to_snake(var_dict) is var_dict

    def test_dict_keys_snake_to_camel_skips_function_variables_dict(self):
        """dict_keys_snake_to_camel returns FunctionVariablesDict unchanged."""
        var_dict = FunctionVariablesDict({"snake_key": 1})
        assert dict_keys_snake_to_camel(var_dict) is var_dict

    def test_function_variable_str_passthrough(self):
        """FunctionVariableStr values survive round-trip conversion unchanged."""
        var_str = FunctionVariableStr("angleWidth")
        payload = {"some_key": var_str}
        result = recursive_dict_keys_snake_to_camel(payload)
        assert result["someKey"] is var_str

    def test_non_preserve_fields_still_converted(self):
        """Regular fields outside preserve-subtree keys are still converted."""
        payload = {
            "input_vars": ["x", "y"],
            "num_samples": 100,
            "inputs": {"myVar": 1.0},
        }
        result = recursive_dict_keys_snake_to_camel(payload)
        assert "inputVars" in result
        assert "numSamples" in result
        assert result["inputs"] == {"myVar": 1.0}
