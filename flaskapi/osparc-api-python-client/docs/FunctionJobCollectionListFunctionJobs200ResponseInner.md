# FunctionJobCollectionListFunctionJobs200ResponseInner


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
from osparc_client.models.function_job_collection_list_function_jobs200_response_inner import FunctionJobCollectionListFunctionJobs200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of FunctionJobCollectionListFunctionJobs200ResponseInner from a JSON string
function_job_collection_list_function_jobs200_response_inner_instance = FunctionJobCollectionListFunctionJobs200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(FunctionJobCollectionListFunctionJobs200ResponseInner.to_json())

# convert the object into a dict
function_job_collection_list_function_jobs200_response_inner_dict = function_job_collection_list_function_jobs200_response_inner_instance.to_dict()
# create an instance of FunctionJobCollectionListFunctionJobs200ResponseInner from a dict
function_job_collection_list_function_jobs200_response_inner_from_dict = FunctionJobCollectionListFunctionJobs200ResponseInner.from_dict(function_job_collection_list_function_jobs200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


