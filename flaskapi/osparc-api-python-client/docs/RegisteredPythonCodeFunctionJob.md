# RegisteredPythonCodeFunctionJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'PYTHON_CODE']
**uid** | **str** |  | 

## Example

```python
from osparc_client.models.registered_python_code_function_job import RegisteredPythonCodeFunctionJob

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredPythonCodeFunctionJob from a JSON string
registered_python_code_function_job_instance = RegisteredPythonCodeFunctionJob.from_json(json)
# print the JSON string representation of the object
print(RegisteredPythonCodeFunctionJob.to_json())

# convert the object into a dict
registered_python_code_function_job_dict = registered_python_code_function_job_instance.to_dict()
# create an instance of RegisteredPythonCodeFunctionJob from a dict
registered_python_code_function_job_from_dict = RegisteredPythonCodeFunctionJob.from_dict(registered_python_code_function_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


