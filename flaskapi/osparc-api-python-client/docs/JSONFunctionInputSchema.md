# JSONFunctionInputSchema


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**schema_content** | **object** | JSON Schema | [optional] 
**schema_class** | **str** |  | [optional] [default to 'application/schema+json']

## Example

```python
from osparc_client.models.json_function_input_schema import JSONFunctionInputSchema

# TODO update the JSON string below
json = "{}"
# create an instance of JSONFunctionInputSchema from a JSON string
json_function_input_schema_instance = JSONFunctionInputSchema.from_json(json)
# print the JSON string representation of the object
print(JSONFunctionInputSchema.to_json())

# convert the object into a dict
json_function_input_schema_dict = json_function_input_schema_instance.to_dict()
# create an instance of JSONFunctionInputSchema from a dict
json_function_input_schema_from_dict = JSONFunctionInputSchema.from_dict(json_function_input_schema_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


