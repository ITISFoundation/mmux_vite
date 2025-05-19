# ResponseRegisterFunctionV0FunctionsPost


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
from osparc_client.models.response_register_function_v0_functions_post import ResponseRegisterFunctionV0FunctionsPost

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseRegisterFunctionV0FunctionsPost from a JSON string
response_register_function_v0_functions_post_instance = ResponseRegisterFunctionV0FunctionsPost.from_json(json)
# print the JSON string representation of the object
print(ResponseRegisterFunctionV0FunctionsPost.to_json())

# convert the object into a dict
response_register_function_v0_functions_post_dict = response_register_function_v0_functions_post_instance.to_dict()
# create an instance of ResponseRegisterFunctionV0FunctionsPost from a dict
response_register_function_v0_functions_post_from_dict = ResponseRegisterFunctionV0FunctionsPost.from_dict(response_register_function_v0_functions_post_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


