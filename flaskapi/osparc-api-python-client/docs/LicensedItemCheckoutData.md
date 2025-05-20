# LicensedItemCheckoutData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**number_of_seats** | **int** |  | 
**service_run_id** | **str** |  | 

## Example

```python
from osparc_client.models.licensed_item_checkout_data import LicensedItemCheckoutData

# TODO update the JSON string below
json = "{}"
# create an instance of LicensedItemCheckoutData from a JSON string
licensed_item_checkout_data_instance = LicensedItemCheckoutData.from_json(json)
# print the JSON string representation of the object
print(LicensedItemCheckoutData.to_json())

# convert the object into a dict
licensed_item_checkout_data_dict = licensed_item_checkout_data_instance.to_dict()
# create an instance of LicensedItemCheckoutData from a dict
licensed_item_checkout_data_from_dict = LicensedItemCheckoutData.from_dict(licensed_item_checkout_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


