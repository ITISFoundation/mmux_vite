# osparc_client.CreditsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_credits_price**](CreditsApi.md#get_credits_price) | **GET** /v0/credits/price | Get Credits Price


# **get_credits_price**
> GetCreditPriceLegacy get_credits_price()

Get Credits Price

New in *version 0.6*

### Example

* Basic Authentication (HTTPBasic):

```python
import osparc_client
from osparc_client.models.get_credit_price_legacy import GetCreditPriceLegacy
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
    api_instance = osparc_client.CreditsApi(api_client)

    try:
        # Get Credits Price
        api_response = api_instance.get_credits_price()
        print("The response of CreditsApi->get_credits_price:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CreditsApi->get_credits_price: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**GetCreditPriceLegacy**](GetCreditPriceLegacy.md)

### Authorization

[HTTPBasic](../README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

