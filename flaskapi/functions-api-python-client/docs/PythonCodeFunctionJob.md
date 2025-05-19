# PythonCodeFunctionJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'PYTHON_CODE']

## Example

```python
from osparc_client.models.python_code_function_job import PythonCodeFunctionJob

# TODO update the JSON string below
json = "{}"
# create an instance of PythonCodeFunctionJob from a JSON string
python_code_function_job_instance = PythonCodeFunctionJob.from_json(json)
# print the JSON string representation of the object
print(PythonCodeFunctionJob.to_json())

# convert the object into a dict
python_code_function_job_dict = python_code_function_job_instance.to_dict()
# create an instance of PythonCodeFunctionJob from a dict
python_code_function_job_from_dict = PythonCodeFunctionJob.from_dict(python_code_function_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


