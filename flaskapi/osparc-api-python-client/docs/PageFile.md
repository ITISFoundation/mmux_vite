# PageFile


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[File]**](File.md) |  | 
**total** | **int** |  | 
**limit** | **int** |  | 
**offset** | **int** |  | 
**links** | [**Links**](Links.md) |  | 

## Example

```python
from osparc_client.models.page_file import PageFile

# TODO update the JSON string below
json = "{}"
# create an instance of PageFile from a JSON string
page_file_instance = PageFile.from_json(json)
# print the JSON string representation of the object
print(PageFile.to_json())

# convert the object into a dict
page_file_dict = page_file_instance.to_dict()
# create an instance of PageFile from a dict
page_file_from_dict = PageFile.from_dict(page_file_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


