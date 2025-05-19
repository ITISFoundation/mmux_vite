# ProjectFunctionJob


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**function_uid** | **str** |  | 
**inputs** | **object** |  | 
**outputs** | **object** |  | 
**function_class** | **str** |  | [optional] [default to 'PROJECT']
**project_job_id** | **str** |  | 

## Example

```python
from osparc_client.models.project_function_job import ProjectFunctionJob

# TODO update the JSON string below
json = "{}"
# create an instance of ProjectFunctionJob from a JSON string
project_function_job_instance = ProjectFunctionJob.from_json(json)
# print the JSON string representation of the object
print(ProjectFunctionJob.to_json())

# convert the object into a dict
project_function_job_dict = project_function_job_instance.to_dict()
# create an instance of ProjectFunctionJob from a dict
project_function_job_from_dict = ProjectFunctionJob.from_dict(project_function_job_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


