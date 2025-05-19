# ResponseGetFunctionV0FunctionsFunctionIdGet


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
from osparc_client.models.response_get_function_v0_functions_function_id_get import ResponseGetFunctionV0FunctionsFunctionIdGet

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseGetFunctionV0FunctionsFunctionIdGet from a JSON string
response_get_function_v0_functions_function_id_get_instance = ResponseGetFunctionV0FunctionsFunctionIdGet.from_json(json)
# print the JSON string representation of the object
print(ResponseGetFunctionV0FunctionsFunctionIdGet.to_json())

# convert the object into a dict
response_get_function_v0_functions_function_id_get_dict = response_get_function_v0_functions_function_id_get_instance.to_dict()
# create an instance of ResponseGetFunctionV0FunctionsFunctionIdGet from a dict
response_get_function_v0_functions_function_id_get_from_dict = ResponseGetFunctionV0FunctionsFunctionIdGet.from_dict(response_get_function_v0_functions_function_id_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


