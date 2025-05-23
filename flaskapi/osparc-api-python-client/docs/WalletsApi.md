# osparc_client.WalletsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**checkout_licensed_item**](WalletsApi.md#checkout_licensed_item) | **POST** /v0/wallets/{wallet_id}/licensed-items/{licensed_item_id}/checkout | Checkout Licensed Item
[**get_available_licensed_items_for_wallet**](WalletsApi.md#get_available_licensed_items_for_wallet) | **GET** /v0/wallets/{wallet_id}/licensed-items | Get Available Licensed Items For Wallet
[**get_default_wallet**](WalletsApi.md#get_default_wallet) | **GET** /v0/wallets/default | Get Default Wallet
[**get_wallet**](WalletsApi.md#get_wallet) | **GET** /v0/wallets/{wallet_id} | Get Wallet


# **checkout_licensed_item**
> LicensedItemCheckoutGet checkout_licensed_item(wallet_id, licensed_item_id, licensed_item_checkout_data)

Checkout Licensed Item

Checkout licensed item

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.licensed_item_checkout_data import LicensedItemCheckoutData
from osparc_client.models.licensed_item_checkout_get import LicensedItemCheckoutGet
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.WalletsApi(api_client)
    wallet_id = 56 # int | 
    licensed_item_id = 'licensed_item_id_example' # str | 
    licensed_item_checkout_data = osparc_client.LicensedItemCheckoutData() # LicensedItemCheckoutData | 

    try:
        # Checkout Licensed Item
        api_response = api_instance.checkout_licensed_item(wallet_id, licensed_item_id, licensed_item_checkout_data)
        print("The response of WalletsApi->checkout_licensed_item:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WalletsApi->checkout_licensed_item: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wallet_id** | **int**|  | 
 **licensed_item_id** | **str**|  | 
 **licensed_item_checkout_data** | [**LicensedItemCheckoutData**](LicensedItemCheckoutData.md)|  | 

### Return type

[**LicensedItemCheckoutGet**](LicensedItemCheckoutGet.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_available_licensed_items_for_wallet**
> PageLicensedItemGet get_available_licensed_items_for_wallet(wallet_id, limit=limit, offset=offset)

Get Available Licensed Items For Wallet

Get all available licensed items for a given wallet

New in *version 0.6*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.page_licensed_item_get import PageLicensedItemGet
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.WalletsApi(api_client)
    wallet_id = 56 # int | 
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # Get Available Licensed Items For Wallet
        api_response = api_instance.get_available_licensed_items_for_wallet(wallet_id, limit=limit, offset=offset)
        print("The response of WalletsApi->get_available_licensed_items_for_wallet:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WalletsApi->get_available_licensed_items_for_wallet: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wallet_id** | **int**|  | 
 **limit** | **int**| Page size limit | [optional] [default to 20]
 **offset** | **int**| Page offset | [optional] [default to 0]

### Return type

[**PageLicensedItemGet**](PageLicensedItemGet.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_default_wallet**
> WalletGetWithAvailableCreditsLegacy get_default_wallet()

Get Default Wallet

Get default wallet

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.wallet_get_with_available_credits_legacy import WalletGetWithAvailableCreditsLegacy
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.WalletsApi(api_client)

    try:
        # Get Default Wallet
        api_response = api_instance.get_default_wallet()
        print("The response of WalletsApi->get_default_wallet:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WalletsApi->get_default_wallet: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**WalletGetWithAvailableCreditsLegacy**](WalletGetWithAvailableCreditsLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_wallet**
> WalletGetWithAvailableCreditsLegacy get_wallet(wallet_id)

Get Wallet

Get wallet

New in *version 0.7*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.wallet_get_with_available_credits_legacy import WalletGetWithAvailableCreditsLegacy
from osparc_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = osparc_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure HTTP basic authorization: HTTPBasic
configuration = osparc_client.Configuration(
    username = os.environ["USERNAME"],
    password = os.environ["PASSWORD"]
)

# Enter a context with an instance of the API client
with osparc_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = osparc_client.WalletsApi(api_client)
    wallet_id = 56 # int | 

    try:
        # Get Wallet
        api_response = api_instance.get_wallet(wallet_id)
        print("The response of WalletsApi->get_wallet:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WalletsApi->get_wallet: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wallet_id** | **int**|  | 

### Return type

[**WalletGetWithAvailableCreditsLegacy**](WalletGetWithAvailableCreditsLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Wallet not found |  -  |
**403** | Access to wallet is not allowed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

