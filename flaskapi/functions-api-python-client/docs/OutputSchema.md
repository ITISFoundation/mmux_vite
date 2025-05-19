# OutputSchema


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**schema_content** | **object** | JSON Schema | [optional] 
**schema_class** | **str** |  | [optional] [default to 'application/schema+json']

## Example

```python
from osparc_client.models.output_schema import OutputSchema

# TODO update the JSON string below
json = "{}"
# create an instance of OutputSchema from a JSON string
output_schema_instance = OutputSchema.from_json(json)
# print the JSON string representation of the object
print(OutputSchema.to_json())

# convert the object into a dict
output_schema_dict = output_schema_instance.to_dict()
# create an instance of OutputSchema from a dict
output_schema_from_dict = OutputSchema.from_dict(output_schema_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


