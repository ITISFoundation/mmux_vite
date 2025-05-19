# osparc_client.LicensedItemsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_licensed_items**](LicensedItemsApi.md#get_licensed_items) | **GET** /v0/licensed-items | Get Licensed Items
[**release_licensed_item**](LicensedItemsApi.md#release_licensed_item) | **POST** /v0/licensed-items/{licensed_item_id}/checked-out-items/{licensed_item_checkout_id}/release | Release Licensed Item


# **get_licensed_items**
> PageLicensedItemGet get_licensed_items(limit=limit, offset=offset)

Get Licensed Items

Get all licensed items

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
    api_instance = osparc_client.LicensedItemsApi(api_client)
    limit = 20 # int | Page size limit (optional) (default to 20)
    offset = 0 # int | Page offset (optional) (default to 0)

    try:
        # Get Licensed Items
        api_response = api_instance.get_licensed_items(limit=limit, offset=offset)
        print("The response of LicensedItemsApi->get_licensed_items:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling LicensedItemsApi->get_licensed_items: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
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
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **release_licensed_item**
> LicensedItemCheckoutGet release_licensed_item(licensed_item_id, licensed_item_checkout_id)

Release Licensed Item

Release previously checked out licensed item

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
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
    api_instance = osparc_client.LicensedItemsApi(api_client)
    licensed_item_id = 'licensed_item_id_example' # str | 
    licensed_item_checkout_id = 'licensed_item_checkout_id_example' # str | 

    try:
        # Release Licensed Item
        api_response = api_instance.release_licensed_item(licensed_item_id, licensed_item_checkout_id)
        print("The response of LicensedItemsApi->release_licensed_item:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling LicensedItemsApi->release_licensed_item: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **licensed_item_id** | **str**|  | 
 **licensed_item_checkout_id** | **str**|  | 

### Return type

[**LicensedItemCheckoutGet**](LicensedItemCheckoutGet.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

