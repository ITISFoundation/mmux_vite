# ResponseRunFunctionV0FunctionsFunctionIdRunPost


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
from osparc_client.models.response_run_function_v0_functions_function_id_run_post import ResponseRunFunctionV0FunctionsFunctionIdRunPost

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseRunFunctionV0FunctionsFunctionIdRunPost from a JSON string
response_run_function_v0_functions_function_id_run_post_instance = ResponseRunFunctionV0FunctionsFunctionIdRunPost.from_json(json)
# print the JSON string representation of the object
print(ResponseRunFunctionV0FunctionsFunctionIdRunPost.to_json())

# convert the object into a dict
response_run_function_v0_functions_function_id_run_post_dict = response_run_function_v0_functions_function_id_run_post_instance.to_dict()
# create an instance of ResponseRunFunctionV0FunctionsFunctionIdRunPost from a dict
response_run_function_v0_functions_function_id_run_post_from_dict = ResponseRunFunctionV0FunctionsFunctionIdRunPost.from_dict(response_run_function_v0_functions_function_id_run_post_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


