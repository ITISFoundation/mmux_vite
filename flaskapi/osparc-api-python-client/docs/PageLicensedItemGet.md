# PageLicensedItemGet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**items** | [**List[LicensedItemGet]**](LicensedItemGet.md) |  | 
**total** | **int** |  | 
**limit** | **int** |  | 
**offset** | **int** |  | 
**links** | [**Links**](Links.md) |  | 

## Example

```python
from osparc_client.models.page_licensed_item_get import PageLicensedItemGet

# TODO update the JSON string below
json = "{}"
# create an instance of PageLicensedItemGet from a JSON string
page_licensed_item_get_instance = PageLicensedItemGet.from_json(json)
# print the JSON string representation of the object
print(PageLicensedItemGet.to_json())

# convert the object into a dict
page_licensed_item_get_dict = page_licensed_item_get_instance.to_dict()
# create an instance of PageLicensedItemGet from a dict
page_licensed_item_get_from_dict = PageLicensedItemGet.from_dict(page_licensed_item_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


