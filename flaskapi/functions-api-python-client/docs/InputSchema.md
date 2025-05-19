# InputSchema


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**schema_content** | **object** | JSON Schema | [optional] 
**schema_class** | **str** |  | [optional] [default to 'application/schema+json']

## Example

```python
from osparc_client.models.input_schema import InputSchema

# TODO update the JSON string below
json = "{}"
# create an instance of InputSchema from a JSON string
input_schema_instance = InputSchema.from_json(json)
# print the JSON string representation of the object
print(InputSchema.to_json())

# convert the object into a dict
input_schema_dict = input_schema_instance.to_dict()
# create an instance of InputSchema from a dict
input_schema_from_dict = InputSchema.from_dict(input_schema_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


