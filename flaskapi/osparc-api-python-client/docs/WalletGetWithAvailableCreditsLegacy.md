# WalletGetWithAvailableCreditsLegacy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**wallet_id** | **int** |  | 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**owner** | **int** |  | 
**thumbnail** | **str** |  | [optional] 
**status** | [**WalletStatus**](WalletStatus.md) |  | 
**created** | **datetime** |  | 
**modified** | **datetime** |  | 
**available_credits** | **float** |  | 

## Example

```python
from osparc_client.models.wallet_get_with_available_credits_legacy import WalletGetWithAvailableCreditsLegacy

# TODO update the JSON string below
json = "{}"
# create an instance of WalletGetWithAvailableCreditsLegacy from a JSON string
wallet_get_with_available_credits_legacy_instance = WalletGetWithAvailableCreditsLegacy.from_json(json)
# print the JSON string representation of the object
print(WalletGetWithAvailableCreditsLegacy.to_json())

# convert the object into a dict
wallet_get_with_available_credits_legacy_dict = wallet_get_with_available_credits_legacy_instance.to_dict()
# create an instance of WalletGetWithAvailableCreditsLegacy from a dict
wallet_get_with_available_credits_legacy_from_dict = WalletGetWithAvailableCreditsLegacy.from_dict(wallet_get_with_available_credits_legacy_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


