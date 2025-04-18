# SwaggerFunctionsStoreOpenApi30.DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**generateOpenapiGenerateOpenapiGet**](DefaultApi.md#generateOpenapiGenerateOpenapiGet) | **GET** /generate-openapi | Generate Openapi



## generateOpenapiGenerateOpenapiGet

> Object generateOpenapiGenerateOpenapiGet()

Generate Openapi

Generate OpenAPI spec and save to file

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.DefaultApi();
apiInstance.generateOpenapiGenerateOpenapiGet((error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters

This endpoint does not need any parameter.

### Return type

**Object**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

