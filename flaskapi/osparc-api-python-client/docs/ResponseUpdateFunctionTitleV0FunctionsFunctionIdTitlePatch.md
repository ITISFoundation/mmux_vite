# ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**JSONFunctionInputSchema**](JSONFunctionInputSchema.md) |  | 
**output_schema** | [**JSONFunctionOutputSchema**](JSONFunctionOutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**uid** | **str** |  | 
**project_id** | **str** |  | 
**code_url** | **str** |  | 
**solver_key** | **str** |  | 
**solver_version** | **str** |  | 

## Example

```python
from osparc_client.models.response_update_function_title_v0_functions_function_id_title_patch import ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch from a JSON string
response_update_function_title_v0_functions_function_id_title_patch_instance = ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch.from_json(json)
# print the JSON string representation of the object
print(ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch.to_json())

# convert the object into a dict
response_update_function_title_v0_functions_function_id_title_patch_dict = response_update_function_title_v0_functions_function_id_title_patch_instance.to_dict()
# create an instance of ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch from a dict
response_update_function_title_v0_functions_function_id_title_patch_from_dict = ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch.from_dict(response_update_function_title_v0_functions_function_id_title_patch_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


