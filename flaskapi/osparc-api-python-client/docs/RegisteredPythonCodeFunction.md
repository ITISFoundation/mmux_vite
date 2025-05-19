# RegisteredPythonCodeFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'PYTHON_CODE']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**JSONFunctionInputSchema**](JSONFunctionInputSchema.md) |  | 
**output_schema** | [**JSONFunctionOutputSchema**](JSONFunctionOutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**uid** | **str** |  | 
**code_url** | **str** |  | 

## Example

```python
from osparc_client.models.registered_python_code_function import RegisteredPythonCodeFunction

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredPythonCodeFunction from a JSON string
registered_python_code_function_instance = RegisteredPythonCodeFunction.from_json(json)
# print the JSON string representation of the object
print(RegisteredPythonCodeFunction.to_json())

# convert the object into a dict
registered_python_code_function_dict = registered_python_code_function_instance.to_dict()
# create an instance of RegisteredPythonCodeFunction from a dict
registered_python_code_function_from_dict = RegisteredPythonCodeFunction.from_dict(registered_python_code_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


