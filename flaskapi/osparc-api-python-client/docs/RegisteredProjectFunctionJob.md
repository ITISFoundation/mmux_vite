# RegisteredProjectFunctionJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'PROJECT']
**uid** | **str** |  | 
**project_job_id** | **str** |  | 

## Example

```python
from osparc_client.models.registered_project_function_job import RegisteredProjectFunctionJob

# TODO update the JSON string below
json = "{}"
# create an instance of RegisteredProjectFunctionJob from a JSON string
registered_project_function_job_instance = RegisteredProjectFunctionJob.from_json(json)
# print the JSON string representation of the object
print(RegisteredProjectFunctionJob.to_json())

# convert the object into a dict
registered_project_function_job_dict = registered_project_function_job_instance.to_dict()
# create an instance of RegisteredProjectFunctionJob from a dict
registered_project_function_job_from_dict = RegisteredProjectFunctionJob.from_dict(registered_project_function_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


