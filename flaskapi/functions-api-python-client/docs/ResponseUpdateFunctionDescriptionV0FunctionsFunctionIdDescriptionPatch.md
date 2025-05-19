# ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**function_class** | **str** |  | [optional] [default to 'SOLVER']
**title** | **str** |  | [optional] [default to '']
**description** | **str** |  | [optional] [default to '']
**input_schema** | [**InputSchema**](InputSchema.md) |  | 
**output_schema** | [**OutputSchema**](OutputSchema.md) |  | 
**default_inputs** | **object** |  | 
**uid** | **str** |  | 
**project_id** | **str** |  | 
**code_url** | **str** |  | 
**solver_key** | **str** |  | 
**solver_version** | **str** |  | 

## Example

```python
from osparc_client.models.response_update_function_description_v0_functions_function_id_description_patch import ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch from a JSON string
response_update_function_description_v0_functions_function_id_description_patch_instance = ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch.from_json(json)
# print the JSON string representation of the object
print(ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch.to_json())

# convert the object into a dict
response_update_function_description_v0_functions_function_id_description_patch_dict = response_update_function_description_v0_functions_function_id_description_patch_instance.to_dict()
# create an instance of ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch from a dict
response_update_function_description_v0_functions_function_id_description_patch_from_dict = ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch.from_dict(response_update_function_description_v0_functions_function_id_description_patch_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


