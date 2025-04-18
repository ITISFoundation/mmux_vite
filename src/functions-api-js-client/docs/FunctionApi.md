# SwaggerFunctionsStoreOpenApi30.FunctionApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**batchRunFunction**](FunctionApi.md#batchRunFunction) | **POST** /function/{function_id}/batch | Batch Run Function
[**createFunction**](FunctionApi.md#createFunction) | **POST** /function | Create Function
[**deleteAllFunctions**](FunctionApi.md#deleteAllFunctions) | **DELETE** /function/all | Delete All Functions
[**listFunctions**](FunctionApi.md#listFunctions) | **GET** /function/list | List Functions
[**mapFunction**](FunctionApi.md#mapFunction) | **POST** /function/{function_id}/map | Map Function
[**runFunction**](FunctionApi.md#runFunction) | **POST** /function/{function_id}/run | Run Function
[**searchFunctionsByName**](FunctionApi.md#searchFunctionsByName) | **GET** /function/searchByName | Search Functions By Name
[**searchFunctionsByTags**](FunctionApi.md#searchFunctionsByTags) | **GET** /function/searchByTags | Search Functions By Tags
[**updateFunctionConfigFunctionConfigPost**](FunctionApi.md#updateFunctionConfigFunctionConfigPost) | **POST** /function/config | Update Function Config



## batchRunFunction

> FunctionJobCollection batchRunFunction(functionId, collectionName, requestBody, opts)

Batch Run Function

Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let functionId = 56; // Number | 
let collectionName = "collectionName_example"; // String | 
let requestBody = ["null"]; // [String] | 
let opts = {
  'maxWorkers': 56 // Number | 
};
apiInstance.batchRunFunction(functionId, collectionName, requestBody, opts, (error, data, response) => {
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
 **functionId** | **Number**|  | 
 **collectionName** | **String**|  | 
 **requestBody** | [**[String]**](String.md)|  | 
 **maxWorkers** | **Number**|  | [optional] 

### Return type

[**FunctionJobCollection**](FunctionJobCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## createFunction

> Function createFunction(_function)

Create Function

Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let _function = new SwaggerFunctionsStoreOpenApi30.Function(); // Function | 
apiInstance.createFunction(_function, (error, data, response) => {
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
 **_function** | [**Function**](Function.md)|  | 

### Return type

[**Function**](Function.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## deleteAllFunctions

> Object deleteAllFunctions()

Delete All Functions

Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
apiInstance.deleteAllFunctions((error, data, response) => {
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


## listFunctions

> [Function] listFunctions()

List Functions

List all functions in the store.  Returns:     List of all registered functions

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
apiInstance.listFunctions((error, data, response) => {
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

[**[Function]**](Function.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## mapFunction

> [FunctionJob] mapFunction(functionId, requestBody, opts)

Map Function

Start asynchronous processing of multiple inputs with schema validation.

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let functionId = 56; // Number | 
let requestBody = ["null"]; // [String] | 
let opts = {
  'maxWorkers': 56 // Number | 
};
apiInstance.mapFunction(functionId, requestBody, opts, (error, data, response) => {
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
 **functionId** | **Number**|  | 
 **requestBody** | [**[String]**](String.md)|  | 
 **maxWorkers** | **Number**|  | [optional] 

### Return type

[**[FunctionJob]**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## runFunction

> FunctionJob runFunction(functionId, inputs)

Run Function

Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let functionId = 56; // Number | 
let inputs = "inputs_example"; // String | 
apiInstance.runFunction(functionId, inputs, (error, data, response) => {
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
 **functionId** | **Number**|  | 
 **inputs** | **String**|  | 

### Return type

[**FunctionJob**](FunctionJob.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## searchFunctionsByName

> [Function] searchFunctionsByName(name)

Search Functions By Name

Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let name = "name_example"; // String | 
apiInstance.searchFunctionsByName(name, (error, data, response) => {
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
 **name** | **String**|  | 

### Return type

[**[Function]**](Function.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## searchFunctionsByTags

> [Function] searchFunctionsByTags(tags, opts)

Search Functions By Tags

Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let tags = ["null"]; // [String] | Tags to search for
let opts = {
  'matchAll': false // Boolean | If True, functions must have all tags. If False, functions must have any of the tags.
};
apiInstance.searchFunctionsByTags(tags, opts, (error, data, response) => {
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
 **tags** | [**[String]**](String.md)| Tags to search for | 
 **matchAll** | **Boolean**| If True, functions must have all tags. If False, functions must have any of the tags. | [optional] [default to false]

### Return type

[**[Function]**](Function.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## updateFunctionConfigFunctionConfigPost

> Object updateFunctionConfigFunctionConfigPost(opts)

Update Function Config

Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings

### Example

```javascript
import SwaggerFunctionsStoreOpenApi30 from 'swagger_functions_store_open_api_3_0';

let apiInstance = new SwaggerFunctionsStoreOpenApi30.FunctionApi();
let opts = {
  'maxParallelJobs': 10 // Number | 
};
apiInstance.updateFunctionConfigFunctionConfigPost(opts, (error, data, response) => {
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
 **maxParallelJobs** | **Number**|  | [optional] [default to 10]

### Return type

**Object**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

