# UploadedPart


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**number** | **int** |  | 
**e_tag** | **str** |  | 

## Example

```python
from osparc_client.models.uploaded_part import UploadedPart

# TODO update the JSON string below
json = "{}"
# create an instance of UploadedPart from a JSON string
uploaded_part_instance = UploadedPart.from_json(json)
# print the JSON string representation of the object
print(UploadedPart.to_json())

# convert the object into a dict
uploaded_part_dict = uploaded_part_instance.to_dict()
# create an instance of UploadedPart from a dict
uploaded_part_from_dict = UploadedPart.from_dict(uploaded_part_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


