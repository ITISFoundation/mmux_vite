# GetCreditPriceLegacy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**product_name** | **str** |  | 
**usd_per_credit** | **float** |  | 
**min_payment_amount_usd** | **int** |  | 

## Example

```python
from osparc_client.models.get_credit_price_legacy import GetCreditPriceLegacy

# TODO update the JSON string below
json = "{}"
# create an instance of GetCreditPriceLegacy from a JSON string
get_credit_price_legacy_instance = GetCreditPriceLegacy.from_json(json)
# print the JSON string representation of the object
print(GetCreditPriceLegacy.to_json())

# convert the object into a dict
get_credit_price_legacy_dict = get_credit_price_legacy_instance.to_dict()
# create an instance of GetCreditPriceLegacy from a dict
get_credit_price_legacy_from_dict = GetCreditPriceLegacy.from_dict(get_credit_price_legacy_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


