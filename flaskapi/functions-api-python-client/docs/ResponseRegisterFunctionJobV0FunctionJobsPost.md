# ResponseRegisterFunctionJobV0FunctionJobsPost


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
from osparc_client.models.response_register_function_job_v0_function_jobs_post import ResponseRegisterFunctionJobV0FunctionJobsPost

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseRegisterFunctionJobV0FunctionJobsPost from a JSON string
response_register_function_job_v0_function_jobs_post_instance = ResponseRegisterFunctionJobV0FunctionJobsPost.from_json(json)
# print the JSON string representation of the object
print(ResponseRegisterFunctionJobV0FunctionJobsPost.to_json())

# convert the object into a dict
response_register_function_job_v0_function_jobs_post_dict = response_register_function_job_v0_function_jobs_post_instance.to_dict()
# create an instance of ResponseRegisterFunctionJobV0FunctionJobsPost from a dict
response_register_function_job_v0_function_jobs_post_from_dict = ResponseRegisterFunctionJobV0FunctionJobsPost.from_dict(response_register_function_job_v0_function_jobs_post_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


