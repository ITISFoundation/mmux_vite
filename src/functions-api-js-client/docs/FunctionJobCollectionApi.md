# SwaggerFunctionsStoreOpenApi30.FunctionJobCollectionApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createFunctionJobCollection**](FunctionJobCollectionApi.md#createFunctionJobCollection) | **POST** /functionJobCollection | Create Function Job Collection
[**getCollectionStatus**](FunctionJobCollectionApi.md#getCollectionStatus) | **GET** /functionJobCollection/{collection_id}/status | Get Collection Status
[**listFunctionJobCollections**](FunctionJobCollectionApi.md#listFunctionJobCollections) | **GET** /functionJobCollection/list | List Function Job Collections



## createFunctionJobCollection

> FunctionJobCollection createFunctionJobCollection(functionJobCollection)

Create Function Job Collection

Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobCollectionApi();
let functionJobCollection = new SwaggerFunctionsStoreOpenApi30.FunctionJobCollection(); // FunctionJobCollection | 
apiInstance.createFunctionJobCollection(functionJobCollection, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionJobCollection** | [**FunctionJobCollection**](FunctionJobCollection.md)|  | 

### Return type

[**FunctionJobCollection**](FunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## getCollectionStatus

> FunctionJobCollection getCollectionStatus(collectionId)

Get Collection Status

Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobCollectionApi();
let collectionId = 56; // Number | 
apiInstance.getCollectionStatus(collectionId, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **collectionId** | **Number**|  | 

### Return type

[**FunctionJobCollection**](FunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## listFunctionJobCollections

> [FunctionJobCollection] listFunctionJobCollections()

List Function Job Collections

List all function job collections.  Returns:     List of all function job collections

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionJobCollectionApi();
apiInstance.listFunctionJobCollections((error, data, response) => {
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

[**[FunctionJobCollection]**](FunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

