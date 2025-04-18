import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
import { Function } from '../models/Function';
import { FunctionJob } from '../models/FunctionJob';
import { FunctionJobCollection } from '../models/FunctionJobCollection';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { JobStatus } from '../models/JobStatus';
import { ValidationError } from '../models/ValidationError';
import { ValidationErrorLocInner } from '../models/ValidationErrorLocInner';

import { DefaultApiRequestFactory, DefaultApiResponseProcessor} from "../apis/DefaultApi";
export class ObservableDefaultApi {
    private requestFactory: DefaultApiRequestFactory;
    private responseProcessor: DefaultApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DefaultApiRequestFactory,
        responseProcessor?: DefaultApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DefaultApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DefaultApiResponseProcessor();
    }

    /**
     * Generate OpenAPI spec and save to file
     * Generate Openapi
     */
    public generateOpenapiGenerateOpenapiGetWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<any>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.generateOpenapiGenerateOpenapiGet(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.generateOpenapiGenerateOpenapiGetWithHttpInfo(rsp)));
            }));
    }

    /**
     * Generate OpenAPI spec and save to file
     * Generate Openapi
     */
    public generateOpenapiGenerateOpenapiGet(_options?: ConfigurationOptions): Observable<any> {
        return this.generateOpenapiGenerateOpenapiGetWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

}

import { FunctionApiRequestFactory, FunctionApiResponseProcessor} from "../apis/FunctionApi";
export class ObservableFunctionApi {
    private requestFactory: FunctionApiRequestFactory;
    private responseProcessor: FunctionApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionApiRequestFactory,
        responseProcessor?: FunctionApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionApiResponseProcessor();
    }

    /**
     * Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs
     * Batch Run Function
     * @param functionId
     * @param collectionName
     * @param requestBody
     * @param [maxWorkers]
     */
    public batchRunFunctionWithHttpInfo(functionId: number, collectionName: string, requestBody: Array<string>, maxWorkers?: number, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJobCollection>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.batchRunFunction(functionId, collectionName, requestBody, maxWorkers, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.batchRunFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Run a function with multiple inputs and create a job collection.  Parameters:     function_id: ID of the function to run     collection_name: Name for the job collection     request_body: List of JSON strings containing input parameters     max_workers: Optional maximum number of parallel workers  Returns:     Created function job collection containing all job IDs
     * Batch Run Function
     * @param functionId
     * @param collectionName
     * @param requestBody
     * @param [maxWorkers]
     */
    public batchRunFunction(functionId: number, collectionName: string, requestBody: Array<string>, maxWorkers?: number, _options?: ConfigurationOptions): Observable<FunctionJobCollection> {
        return this.batchRunFunctionWithHttpInfo(functionId, collectionName, requestBody, maxWorkers, _options).pipe(map((apiResponse: HttpInfo<FunctionJobCollection>) => apiResponse.data));
    }

    /**
     * Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.
     * Create Function
     * @param _function
     */
    public createFunctionWithHttpInfo(_function: Function, _options?: ConfigurationOptions): Observable<HttpInfo<Function>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.createFunction(_function, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a new function with optional JSON Schema definitions for input and output. Validates that provided schemas are valid JSON Schema. Supports tags for better organization and searchability.
     * Create Function
     * @param _function
     */
    public createFunction(_function: Function, _options?: ConfigurationOptions): Observable<Function> {
        return this.createFunctionWithHttpInfo(_function, _options).pipe(map((apiResponse: HttpInfo<Function>) => apiResponse.data));
    }

    /**
     * Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions
     * Delete All Functions
     */
    public deleteAllFunctionsWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<any>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.deleteAllFunctions(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteAllFunctionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete all functions from the store.  Returns:     Message confirming deletion with count of deleted functions
     * Delete All Functions
     */
    public deleteAllFunctions(_options?: ConfigurationOptions): Observable<any> {
        return this.deleteAllFunctionsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * List all functions in the store.  Returns:     List of all registered functions
     * List Functions
     */
    public listFunctionsWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Array<Function>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.listFunctions(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listFunctionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * List all functions in the store.  Returns:     List of all registered functions
     * List Functions
     */
    public listFunctions(_options?: ConfigurationOptions): Observable<Array<Function>> {
        return this.listFunctionsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<Function>>) => apiResponse.data));
    }

    /**
     * Start asynchronous processing of multiple inputs with schema validation.
     * Map Function
     * @param functionId
     * @param requestBody
     * @param [maxWorkers]
     */
    public mapFunctionWithHttpInfo(functionId: number, requestBody: Array<string>, maxWorkers?: number, _options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJob>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.mapFunction(functionId, requestBody, maxWorkers, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.mapFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Start asynchronous processing of multiple inputs with schema validation.
     * Map Function
     * @param functionId
     * @param requestBody
     * @param [maxWorkers]
     */
    public mapFunction(functionId: number, requestBody: Array<string>, maxWorkers?: number, _options?: ConfigurationOptions): Observable<Array<FunctionJob>> {
        return this.mapFunctionWithHttpInfo(functionId, requestBody, maxWorkers, _options).pipe(map((apiResponse: HttpInfo<Array<FunctionJob>>) => apiResponse.data));
    }

    /**
     * Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.
     * Run Function
     * @param functionId
     * @param inputs
     */
    public runFunctionWithHttpInfo(functionId: number, inputs: string, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJob>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.runFunction(functionId, inputs, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.runFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Run a function with the given inputs. Validates inputs and outputs against JSON Schema if defined.
     * Run Function
     * @param functionId
     * @param inputs
     */
    public runFunction(functionId: number, inputs: string, _options?: ConfigurationOptions): Observable<FunctionJob> {
        return this.runFunctionWithHttpInfo(functionId, inputs, _options).pipe(map((apiResponse: HttpInfo<FunctionJob>) => apiResponse.data));
    }

    /**
     * Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string
     * Search Functions By Name
     * @param name
     */
    public searchFunctionsByNameWithHttpInfo(name: string, _options?: ConfigurationOptions): Observable<HttpInfo<Array<Function>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.searchFunctionsByName(name, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchFunctionsByNameWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search for functions by name.  Parameters:     name: String to search for in function names (case-sensitive partial match)  Returns:     List of functions whose names contain the search string
     * Search Functions By Name
     * @param name
     */
    public searchFunctionsByName(name: string, _options?: ConfigurationOptions): Observable<Array<Function>> {
        return this.searchFunctionsByNameWithHttpInfo(name, _options).pipe(map((apiResponse: HttpInfo<Array<Function>>) => apiResponse.data));
    }

    /**
     * Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria
     * Search Functions By Tags
     * @param tags Tags to search for
     * @param [matchAll] If True, functions must have all tags. If False, functions must have any of the tags.
     */
    public searchFunctionsByTagsWithHttpInfo(tags: Array<string>, matchAll?: boolean, _options?: ConfigurationOptions): Observable<HttpInfo<Array<Function>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.searchFunctionsByTags(tags, matchAll, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchFunctionsByTagsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search for functions by tags.  Parameters:     tags: List of tags to search for     match_all: If True, functions must have all specified tags. If False, functions must have any of the specified tags.  Returns:     List of functions that match the tag criteria
     * Search Functions By Tags
     * @param tags Tags to search for
     * @param [matchAll] If True, functions must have all tags. If False, functions must have any of the tags.
     */
    public searchFunctionsByTags(tags: Array<string>, matchAll?: boolean, _options?: ConfigurationOptions): Observable<Array<Function>> {
        return this.searchFunctionsByTagsWithHttpInfo(tags, matchAll, _options).pipe(map((apiResponse: HttpInfo<Array<Function>>) => apiResponse.data));
    }

    /**
     * Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings
     * Update Function Config
     * @param [maxParallelJobs]
     */
    public updateFunctionConfigFunctionConfigPostWithHttpInfo(maxParallelJobs?: number, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.updateFunctionConfigFunctionConfigPost(maxParallelJobs, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateFunctionConfigFunctionConfigPostWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update function execution configuration settings.  Parameters:     max_parallel_jobs: Maximum number of parallel jobs allowed (default: 10)  Returns:     Updated configuration settings
     * Update Function Config
     * @param [maxParallelJobs]
     */
    public updateFunctionConfigFunctionConfigPost(maxParallelJobs?: number, _options?: ConfigurationOptions): Observable<any> {
        return this.updateFunctionConfigFunctionConfigPostWithHttpInfo(maxParallelJobs, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

}

import { FunctionJobApiRequestFactory, FunctionJobApiResponseProcessor} from "../apis/FunctionJobApi";
export class ObservableFunctionJobApi {
    private requestFactory: FunctionJobApiRequestFactory;
    private responseProcessor: FunctionJobApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobApiRequestFactory,
        responseProcessor?: FunctionJobApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionJobApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionJobApiResponseProcessor();
    }

    /**
     * Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJobWithHttpInfo(functionJobId: number, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJob>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.getFunctionJob(functionJobId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get the details of a specific function job.  Parameters:     function_job_id: ID of the function job to retrieve  Returns:     Function job details including status, inputs, and outputs  Raises:     HTTPException: If job is not found (404)
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJob(functionJobId: number, _options?: ConfigurationOptions): Observable<FunctionJob> {
        return this.getFunctionJobWithHttpInfo(functionJobId, _options).pipe(map((apiResponse: HttpInfo<FunctionJob>) => apiResponse.data));
    }

    /**
     * Get all jobs for a specific function with optional filtering and pagination.
     * Get Function Jobs
     * @param functionId ID of the function to get jobs for
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public getFunctionJobsWithHttpInfo(functionId: number, limit?: number, offset?: number, status?: JobStatus, startDate?: Date, endDate?: Date, _options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJob>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.getFunctionJobs(functionId, limit, offset, status, startDate, endDate, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionJobsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get all jobs for a specific function with optional filtering and pagination.
     * Get Function Jobs
     * @param functionId ID of the function to get jobs for
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public getFunctionJobs(functionId: number, limit?: number, offset?: number, status?: JobStatus, startDate?: Date, endDate?: Date, _options?: ConfigurationOptions): Observable<Array<FunctionJob>> {
        return this.getFunctionJobsWithHttpInfo(functionId, limit, offset, status, startDate, endDate, _options).pipe(map((apiResponse: HttpInfo<Array<FunctionJob>>) => apiResponse.data));
    }

    /**
     * Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses
     * Get Jobs Status
     * @param jobIds
     */
    public getJobsStatusWithHttpInfo(jobIds: Array<number>, _options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJob>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.getJobsStatus(jobIds, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobsStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get status of multiple jobs.  Parameters:     job_ids: List of job IDs to check  Returns:     List of job statuses
     * Get Jobs Status
     * @param jobIds
     */
    public getJobsStatus(jobIds: Array<number>, _options?: ConfigurationOptions): Observable<Array<FunctionJob>> {
        return this.getJobsStatusWithHttpInfo(jobIds, _options).pipe(map((apiResponse: HttpInfo<Array<FunctionJob>>) => apiResponse.data));
    }

    /**
     * List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs
     * List all function jobs with optional filtering
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [functionId] Filter by function ID
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public listFunctionJobsWithHttpInfo(limit?: number, offset?: number, status?: JobStatus, functionId?: number, startDate?: Date, endDate?: Date, _options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJob>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.listFunctionJobs(limit, offset, status, functionId, startDate, endDate, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listFunctionJobsWithHttpInfo(rsp)));
            }));
    }

    /**
     * List all function jobs with optional filtering and pagination.  Parameters:     limit: Maximum number of jobs to return (default: all)     offset: Number of jobs to skip for pagination (default: 0)     status: Filter by job status (e.g., PENDING, RUNNING, COMPLETED, FAILED)     function_id: Filter jobs for a specific function     start_date: Include jobs created after this date     end_date: Include jobs created before this date  Returns:     List[FunctionJob]: A filtered list of function jobs
     * List all function jobs with optional filtering
     * @param [limit] Maximum number of jobs to return
     * @param [offset] Number of jobs to skip
     * @param [status] Filter by job status
     * @param [functionId] Filter by function ID
     * @param [startDate] Filter jobs after this date
     * @param [endDate] Filter jobs before this date
     */
    public listFunctionJobs(limit?: number, offset?: number, status?: JobStatus, functionId?: number, startDate?: Date, endDate?: Date, _options?: ConfigurationOptions): Observable<Array<FunctionJob>> {
        return this.listFunctionJobsWithHttpInfo(limit, offset, status, functionId, startDate, endDate, _options).pipe(map((apiResponse: HttpInfo<Array<FunctionJob>>) => apiResponse.data));
    }

}

import { FunctionJobCollectionApiRequestFactory, FunctionJobCollectionApiResponseProcessor} from "../apis/FunctionJobCollectionApi";
export class ObservableFunctionJobCollectionApi {
    private requestFactory: FunctionJobCollectionApiRequestFactory;
    private responseProcessor: FunctionJobCollectionApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobCollectionApiRequestFactory,
        responseProcessor?: FunctionJobCollectionApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionJobCollectionApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionJobCollectionApiResponseProcessor();
    }

    /**
     * Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection
     * Create Function Job Collection
     * @param functionJobCollection
     */
    public createFunctionJobCollectionWithHttpInfo(functionJobCollection: FunctionJobCollection, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJobCollection>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.createFunctionJobCollection(functionJobCollection, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createFunctionJobCollectionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a new function job collection.  Parameters:     collection: Collection details including name and optional description  Returns:     Created function job collection
     * Create Function Job Collection
     * @param functionJobCollection
     */
    public createFunctionJobCollection(functionJobCollection: FunctionJobCollection, _options?: ConfigurationOptions): Observable<FunctionJobCollection> {
        return this.createFunctionJobCollectionWithHttpInfo(functionJobCollection, _options).pipe(map((apiResponse: HttpInfo<FunctionJobCollection>) => apiResponse.data));
    }

    /**
     * Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs
     * Get Collection Status
     * @param collectionId
     */
    public getCollectionStatusWithHttpInfo(collectionId: number, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJobCollection>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.getCollectionStatus(collectionId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCollectionStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get status of a function job collection.  Parameters:     collection_id: ID of the collection to check  Returns:     Collection details including current status of all jobs
     * Get Collection Status
     * @param collectionId
     */
    public getCollectionStatus(collectionId: number, _options?: ConfigurationOptions): Observable<FunctionJobCollection> {
        return this.getCollectionStatusWithHttpInfo(collectionId, _options).pipe(map((apiResponse: HttpInfo<FunctionJobCollection>) => apiResponse.data));
    }

    /**
     * List all function job collections.  Returns:     List of all function job collections
     * List Function Job Collections
     */
    public listFunctionJobCollectionsWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJobCollection>>> {
    let _config = this.configuration;
    let allMiddleware: Middleware[] = [];
    if (_options && _options.middleware){
      const middlewareMergeStrategy = _options.middlewareMergeStrategy || 'replace' // default to replace behavior
      // call-time middleware provided
      const calltimeMiddleware: Middleware[] = _options.middleware;

      switch(middlewareMergeStrategy){
      case 'append':
        allMiddleware = this.configuration.middleware.concat(calltimeMiddleware);
        break;
      case 'prepend':
        allMiddleware = calltimeMiddleware.concat(this.configuration.middleware)
        break;
      case 'replace':
        allMiddleware = calltimeMiddleware
        break;
      default: 
        throw new Error(`unrecognized middleware merge strategy '${middlewareMergeStrategy}'`)
      }
	}
	if (_options){
    _config = {
      baseServer: _options.baseServer || this.configuration.baseServer,
      httpApi: _options.httpApi || this.configuration.httpApi,
      authMethods: _options.authMethods || this.configuration.authMethods,
      middleware: allMiddleware || this.configuration.middleware
		};
	}

        const requestContextPromise = this.requestFactory.listFunctionJobCollections(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of allMiddleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of allMiddleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listFunctionJobCollectionsWithHttpInfo(rsp)));
            }));
    }

    /**
     * List all function job collections.  Returns:     List of all function job collections
     * List Function Job Collections
     */
    public listFunctionJobCollections(_options?: ConfigurationOptions): Observable<Array<FunctionJobCollection>> {
        return this.listFunctionJobCollectionsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<FunctionJobCollection>>) => apiResponse.data));
    }

}
