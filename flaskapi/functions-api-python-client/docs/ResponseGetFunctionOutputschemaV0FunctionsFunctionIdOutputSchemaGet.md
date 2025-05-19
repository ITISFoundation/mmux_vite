# ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**schema_content** | **object** | JSON Schema | [optional] 
**schema_class** | **str** |  | [optional] [default to 'application/schema+json']

## Example

```python
from osparc_client.models.response_get_function_outputschema_v0_functions_function_id_output_schema_get import ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet

# TODO update the JSON string below
json = "{}"
# create an instance of ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet from a JSON string
response_get_function_outputschema_v0_functions_function_id_output_schema_get_instance = ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet.from_json(json)
# print the JSON string representation of the object
print(ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet.to_json())

# convert the object into a dict
response_get_function_outputschema_v0_functions_function_id_output_schema_get_dict = response_get_function_outputschema_v0_functions_function_id_output_schema_get_instance.to_dict()
# create an instance of ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet from a dict
response_get_function_outputschema_v0_functions_function_id_output_schema_get_from_dict = ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet.from_dict(response_get_function_outputschema_v0_functions_function_id_output_schema_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


