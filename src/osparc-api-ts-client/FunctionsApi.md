# .FunctionsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteFunction**](FunctionsApi.md#deleteFunction) | **DELETE** /v0/functions/{function_id} | Delete Function
[**getFunction**](FunctionsApi.md#getFunction) | **GET** /v0/functions/{function_id} | Get Function
[**getFunctionInputschema**](FunctionsApi.md#getFunctionInputschema) | **GET** /v0/functions/{function_id}/input_schema | Get Function Inputschema
[**getFunctionOutputschema**](FunctionsApi.md#getFunctionOutputschema) | **GET** /v0/functions/{function_id}/output_schema | Get Function Outputschema
[**listFunctions**](FunctionsApi.md#listFunctions) | **GET** /v0/functions | List Functions
[**mapFunction**](FunctionsApi.md#mapFunction) | **POST** /v0/functions/{function_id}:map | Map Function
[**registerFunction**](FunctionsApi.md#registerFunction) | **POST** /v0/functions | Register Function
[**runFunction**](FunctionsApi.md#runFunction) | **POST** /v0/functions/{function_id}:run | Run Function
[**updateFunctionDescription**](FunctionsApi.md#updateFunctionDescription) | **PATCH** /v0/functions/{function_id}/description | Update Function Description
[**updateFunctionTitle**](FunctionsApi.md#updateFunctionTitle) | **PATCH** /v0/functions/{function_id}/title | Update Function Title
[**validateFunctionInputs**](FunctionsApi.md#validateFunctionInputs) | **POST** /v0/functions/{function_id}:validate_inputs | Validate Function Inputs


# **deleteFunction**
> any deleteFunction()

Delete function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiDeleteFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiDeleteFunctionRequest = {
  
  functionId: "function_id_example",
};

const data = await apiInstance.deleteFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFunction**
> ResponseGetFunctionV0FunctionsFunctionIdGet getFunction()

Get function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiGetFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiGetFunctionRequest = {
  
  functionId: "function_id_example",
};

const data = await apiInstance.getFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**ResponseGetFunctionV0FunctionsFunctionIdGet**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFunctionInputschema**
> JSONFunctionInputSchema getFunctionInputschema()

Get function input schema

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiGetFunctionInputschemaRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiGetFunctionInputschemaRequest = {
  
  functionId: "function_id_example",
};

const data = await apiInstance.getFunctionInputschema(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**JSONFunctionInputSchema**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getFunctionOutputschema**
> JSONFunctionInputSchema getFunctionOutputschema()

Get function input schema

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiGetFunctionOutputschemaRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiGetFunctionOutputschemaRequest = {
  
  functionId: "function_id_example",
};

const data = await apiInstance.getFunctionOutputschema(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**JSONFunctionInputSchema**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listFunctions**
> PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass listFunctions()

List functions

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiListFunctionsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiListFunctionsRequest = {
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.listFunctions(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **mapFunction**
> RegisteredFunctionJobCollection mapFunction(requestBody)

Map function over input parameters

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiMapFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiMapFunctionRequest = {
  
  functionId: "function_id_example",
  
  requestBody: [
    {},
  ],
};

const data = await apiInstance.mapFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **requestBody** | **Array<any | null>**|  |
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**RegisteredFunctionJobCollection**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **registerFunction**
> ResponseRegisterFunctionV0FunctionsPost registerFunction(_function)

Create function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiRegisterFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiRegisterFunctionRequest = {
  
  _function: null,
};

const data = await apiInstance.registerFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **_function** | **Function**|  |


### Return type

**ResponseRegisterFunctionV0FunctionsPost**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **runFunction**
> ResponseRunFunctionV0FunctionsFunctionIdRunPost runFunction(body)

Run function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiRunFunctionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiRunFunctionRequest = {
  
  functionId: "function_id_example",
  
  body: {},
};

const data = await apiInstance.runFunction(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **any**|  |
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**ResponseRunFunctionV0FunctionsFunctionIdRunPost**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateFunctionDescription**
> ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch updateFunctionDescription()

Update function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiUpdateFunctionDescriptionRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiUpdateFunctionDescriptionRequest = {
  
  functionId: "function_id_example",
  
  description: "description_example",
};

const data = await apiInstance.updateFunctionDescription(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined
 **description** | [**string**] |  | defaults to undefined


### Return type

**ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateFunctionTitle**
> ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch updateFunctionTitle()

Update function

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiUpdateFunctionTitleRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiUpdateFunctionTitleRequest = {
  
  functionId: "function_id_example",
  
  title: "title_example",
};

const data = await apiInstance.updateFunctionTitle(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **functionId** | [**string**] |  | defaults to undefined
 **title** | [**string**] |  | defaults to undefined


### Return type

**ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **validateFunctionInputs**
> Array<any> validateFunctionInputs(body)

Validate inputs against the function\'s input schema

### Example


```typescript
import { createConfiguration, FunctionsApi } from '';
import type { FunctionsApiValidateFunctionInputsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new FunctionsApi(configuration);

const request: FunctionsApiValidateFunctionInputsRequest = {
  
  functionId: "function_id_example",
  
  body: {},
};

const data = await apiInstance.validateFunctionInputs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **any**|  |
 **functionId** | [**string**] |  | defaults to undefined


### Return type

**Array<any>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**400** | Invalid inputs |  -  |
**404** | Function not found |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


