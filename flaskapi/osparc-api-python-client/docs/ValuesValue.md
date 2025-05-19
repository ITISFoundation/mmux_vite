# ValuesValue


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | Resource identifier | 
**filename** | **str** | Name of the file with extension | 
**content_type** | **str** |  | [optional] 
**checksum** | **str** |  | [optional] 
**e_tag** | **str** |  | [optional] 

## Example

```python
from osparc_client.models.values_value import ValuesValue

# TODO update the JSON string below
json = "{}"
# create an instance of ValuesValue from a JSON string
values_value_instance = ValuesValue.from_json(json)
# print the JSON string representation of the object
print(ValuesValue.to_json())

# convert the object into a dict
values_value_dict = values_value_instance.to_dict()
# create an instance of ValuesValue from a dict
values_value_from_dict = ValuesValue.from_dict(values_value_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


