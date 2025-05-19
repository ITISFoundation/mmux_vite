# LicensedItemCheckoutGet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**licensed_item_checkout_id** | **str** |  | 
**licensed_item_id** | **str** |  | 
**key** | **str** |  | 
**version** | **str** |  | 
**wallet_id** | **int** |  | 
**user_id** | **int** |  | 
**product_name** | **str** |  | 
**started_at** | **datetime** |  | 
**stopped_at** | **datetime** |  | 
**num_of_seats** | **int** |  | 

## Example

```python
from osparc_client.models.licensed_item_checkout_get import LicensedItemCheckoutGet

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedItemCheckoutGet from a JSON string
licensed_item_checkout_get_instance = LicensedItemCheckoutGet.from_json(json)
# print the JSON string representation of the object
print(LicensedItemCheckoutGet.to_json())

# convert the object into a dict
licensed_item_checkout_get_dict = licensed_item_checkout_get_instance.to_dict()
# create an instance of LicensedItemCheckoutGet from a dict
licensed_item_checkout_get_from_dict = LicensedItemCheckoutGet.from_dict(licensed_item_checkout_get_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


