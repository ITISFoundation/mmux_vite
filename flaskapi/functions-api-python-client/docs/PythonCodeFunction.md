# PythonCodeFunction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'PYTHON_CODE']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**InputSchema**](InputSchema.md) |  | 
**output_schema** | [**OutputSchema**](OutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**code_url** | **str** |  | 

## Example

```python
from osparc_client.models.python_code_function import PythonCodeFunction

# TODO update the JSON string below
json = "{}"
# create an instance of PythonCodeFunction from a JSON string
python_code_function_instance = PythonCodeFunction.from_json(json)
# print the JSON string representation of the object
print(PythonCodeFunction.to_json())

# convert the object into a dict
python_code_function_dict = python_code_function_instance.to_dict()
# create an instance of PythonCodeFunction from a dict
python_code_function_from_dict = PythonCodeFunction.from_dict(python_code_function_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


