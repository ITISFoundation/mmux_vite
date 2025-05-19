# ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**uid** | **str** |  | 
**project_job_id** | **str** |  | 
**solver_job_id** | **str** |  | 

## Example

```python
from osparc_client.models.response_get_function_job_v0_function_jobs_function_job_id_get import ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet from a JSON string
response_get_function_job_v0_function_jobs_function_job_id_get_instance = ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet.from_json(json)
# print the JSON string representation of the object
print(ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet.to_json())

# convert the object into a dict
response_get_function_job_v0_function_jobs_function_job_id_get_dict = response_get_function_job_v0_function_jobs_function_job_id_get_instance.to_dict()
# create an instance of ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet from a dict
response_get_function_job_v0_function_jobs_function_job_id_get_from_dict = ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet.from_dict(response_get_function_job_v0_function_jobs_function_job_id_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


