import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
import { BodyAbortMultipartUploadV0FilesFileIdAbortPost } from '../models/BodyAbortMultipartUploadV0FilesFileIdAbortPost';
import { BodyCompleteMultipartUploadV0FilesFileIdCompletePost } from '../models/BodyCompleteMultipartUploadV0FilesFileIdCompletePost';
import { BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost } from '../models/BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost';
import { ClientFile } from '../models/ClientFile';
import { ClientFileUploadData } from '../models/ClientFileUploadData';
import { ErrorGet } from '../models/ErrorGet';
import { FileUploadCompletionBody } from '../models/FileUploadCompletionBody';
import { FileUploadData } from '../models/FileUploadData';
import { Function } from '../models/Function';
import { FunctionJob } from '../models/FunctionJob';
import { FunctionJobCollection } from '../models/FunctionJobCollection';
import { FunctionJobCollectionListFunctionJobs200ResponseInner } from '../models/FunctionJobCollectionListFunctionJobs200ResponseInner';
import { FunctionJobCollectionStatus } from '../models/FunctionJobCollectionStatus';
import { FunctionJobStatus } from '../models/FunctionJobStatus';
import { GetCreditPriceLegacy } from '../models/GetCreditPriceLegacy';
import { Groups } from '../models/Groups';
import { HTTPValidationError } from '../models/HTTPValidationError';
import { InputSchema } from '../models/InputSchema';
import { JSONFunctionInputSchema } from '../models/JSONFunctionInputSchema';
import { JSONFunctionOutputSchema } from '../models/JSONFunctionOutputSchema';
import { Job } from '../models/Job';
import { JobInputs } from '../models/JobInputs';
import { JobLog } from '../models/JobLog';
import { JobLogsMap } from '../models/JobLogsMap';
import { JobMetadata } from '../models/JobMetadata';
import { JobMetadataUpdate } from '../models/JobMetadataUpdate';
import { JobOutputs } from '../models/JobOutputs';
import { JobStatus } from '../models/JobStatus';
import { LicensedItemCheckoutData } from '../models/LicensedItemCheckoutData';
import { LicensedItemCheckoutGet } from '../models/LicensedItemCheckoutGet';
import { LicensedItemGet } from '../models/LicensedItemGet';
import { LicensedResource } from '../models/LicensedResource';
import { LicensedResourceSource } from '../models/LicensedResourceSource';
import { LicensedResourceSourceFeaturesDict } from '../models/LicensedResourceSourceFeaturesDict';
import { LicensedResourceType } from '../models/LicensedResourceType';
import { Links } from '../models/Links';
import { LogLink } from '../models/LogLink';
import { Meta } from '../models/Meta';
import { MetadataValue } from '../models/MetadataValue';
import { ModelFile } from '../models/ModelFile';
import { OnePageSolverPort } from '../models/OnePageSolverPort';
import { OnePageStudyPort } from '../models/OnePageStudyPort';
import { OutputSchema } from '../models/OutputSchema';
import { PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass } from '../models/PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass';
import { PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass } from '../models/PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass';
import { PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClassItemsInner } from '../models/PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClassItemsInner';
import { PageFile } from '../models/PageFile';
import { PageJob } from '../models/PageJob';
import { PageLicensedItemGet } from '../models/PageLicensedItemGet';
import { PageRegisteredFunctionJobCollection } from '../models/PageRegisteredFunctionJobCollection';
import { PageStudy } from '../models/PageStudy';
import { PricingPlanClassification } from '../models/PricingPlanClassification';
import { PricingUnitGetLegacy } from '../models/PricingUnitGetLegacy';
import { Profile } from '../models/Profile';
import { ProfileUpdate } from '../models/ProfileUpdate';
import { Program } from '../models/Program';
import { ProjectFunction } from '../models/ProjectFunction';
import { ProjectFunctionJob } from '../models/ProjectFunctionJob';
import { PythonCodeFunction } from '../models/PythonCodeFunction';
import { PythonCodeFunctionJob } from '../models/PythonCodeFunctionJob';
import { RegisteredFunctionJobCollection } from '../models/RegisteredFunctionJobCollection';
import { RegisteredProjectFunction } from '../models/RegisteredProjectFunction';
import { RegisteredProjectFunctionJob } from '../models/RegisteredProjectFunctionJob';
import { RegisteredPythonCodeFunction } from '../models/RegisteredPythonCodeFunction';
import { RegisteredPythonCodeFunctionJob } from '../models/RegisteredPythonCodeFunctionJob';
import { RegisteredSolverFunction } from '../models/RegisteredSolverFunction';
import { RegisteredSolverFunctionJob } from '../models/RegisteredSolverFunctionJob';
import { Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet } from '../models/Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet';
import { ResponseGetFunctionInputschemaV0FunctionsFunctionIdInputSchemaGet } from '../models/ResponseGetFunctionInputschemaV0FunctionsFunctionIdInputSchemaGet';
import { ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet } from '../models/ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet';
import { ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet } from '../models/ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet';
import { ResponseGetFunctionV0FunctionsFunctionIdGet } from '../models/ResponseGetFunctionV0FunctionsFunctionIdGet';
import { ResponseRegisterFunctionJobV0FunctionJobsPost } from '../models/ResponseRegisterFunctionJobV0FunctionJobsPost';
import { ResponseRegisterFunctionV0FunctionsPost } from '../models/ResponseRegisterFunctionV0FunctionsPost';
import { ResponseRunFunctionV0FunctionsFunctionIdRunPost } from '../models/ResponseRunFunctionV0FunctionsFunctionIdRunPost';
import { ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch } from '../models/ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch';
import { ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch } from '../models/ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch';
import { RunningState } from '../models/RunningState';
import { ServicePricingPlanGetLegacy } from '../models/ServicePricingPlanGetLegacy';
import { Solver } from '../models/Solver';
import { SolverFunction } from '../models/SolverFunction';
import { SolverFunctionJob } from '../models/SolverFunctionJob';
import { SolverPort } from '../models/SolverPort';
import { Study } from '../models/Study';
import { StudyPort } from '../models/StudyPort';
import { UnitExtraInfoTier } from '../models/UnitExtraInfoTier';
import { UploadLinks } from '../models/UploadLinks';
import { UploadedPart } from '../models/UploadedPart';
import { UserFile } from '../models/UserFile';
import { UserFileToProgramJob } from '../models/UserFileToProgramJob';
import { UserRoleEnum } from '../models/UserRoleEnum';
import { UsersGroup } from '../models/UsersGroup';
import { ValidationError } from '../models/ValidationError';
import { ValidationErrorLocInner } from '../models/ValidationErrorLocInner';
import { ValuesValue } from '../models/ValuesValue';
import { WalletGetWithAvailableCreditsLegacy } from '../models/WalletGetWithAvailableCreditsLegacy';
import { WalletStatus } from '../models/WalletStatus';

import { CreditsApiRequestFactory, CreditsApiResponseProcessor} from "../apis/CreditsApi";
export class ObservableCreditsApi {
    private requestFactory: CreditsApiRequestFactory;
    private responseProcessor: CreditsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CreditsApiRequestFactory,
        responseProcessor?: CreditsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CreditsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CreditsApiResponseProcessor();
    }

    /**
     * New in *version 0.6.0*
     * Get Credits Price
     */
    public getCreditsPriceWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<GetCreditPriceLegacy>> {
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

        const requestContextPromise = this.requestFactory.getCreditsPrice(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCreditsPriceWithHttpInfo(rsp)));
            }));
    }

    /**
     * New in *version 0.6.0*
     * Get Credits Price
     */
    public getCreditsPrice(_options?: ConfigurationOptions): Observable<GetCreditPriceLegacy> {
        return this.getCreditsPriceWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<GetCreditPriceLegacy>) => apiResponse.data));
    }

}

import { FilesApiRequestFactory, FilesApiResponseProcessor} from "../apis/FilesApi";
export class ObservableFilesApi {
    private requestFactory: FilesApiRequestFactory;
    private responseProcessor: FilesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FilesApiRequestFactory,
        responseProcessor?: FilesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FilesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FilesApiResponseProcessor();
    }

    /**
     * Abort Multipart Upload
     * @param fileId
     * @param bodyAbortMultipartUploadV0FilesFileIdAbortPost
     */
    public abortMultipartUploadWithHttpInfo(fileId: string, bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.abortMultipartUpload(fileId, bodyAbortMultipartUploadV0FilesFileIdAbortPost, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.abortMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Abort Multipart Upload
     * @param fileId
     * @param bodyAbortMultipartUploadV0FilesFileIdAbortPost
     */
    public abortMultipartUpload(fileId: string, bodyAbortMultipartUploadV0FilesFileIdAbortPost: BodyAbortMultipartUploadV0FilesFileIdAbortPost, _options?: ConfigurationOptions): Observable<any> {
        return this.abortMultipartUploadWithHttpInfo(fileId, bodyAbortMultipartUploadV0FilesFileIdAbortPost, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Complete Multipart Upload
     * @param fileId
     * @param bodyCompleteMultipartUploadV0FilesFileIdCompletePost
     */
    public completeMultipartUploadWithHttpInfo(fileId: string, bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.completeMultipartUpload(fileId, bodyCompleteMultipartUploadV0FilesFileIdCompletePost, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.completeMultipartUploadWithHttpInfo(rsp)));
            }));
    }

    /**
     * Complete Multipart Upload
     * @param fileId
     * @param bodyCompleteMultipartUploadV0FilesFileIdCompletePost
     */
    public completeMultipartUpload(fileId: string, bodyCompleteMultipartUploadV0FilesFileIdCompletePost: BodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options?: ConfigurationOptions): Observable<any> {
        return this.completeMultipartUploadWithHttpInfo(fileId, bodyCompleteMultipartUploadV0FilesFileIdCompletePost, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Delete File
     * @param fileId
     */
    public deleteFileWithHttpInfo(fileId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.deleteFile(fileId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteFileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete File
     * @param fileId
     */
    public deleteFile(fileId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.deleteFileWithHttpInfo(fileId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Download File
     * @param fileId
     */
    public downloadFileWithHttpInfo(fileId: string, _options?: ConfigurationOptions): Observable<HttpInfo<HttpFile>> {
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

        const requestContextPromise = this.requestFactory.downloadFile(fileId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.downloadFileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Download File
     * @param fileId
     */
    public downloadFile(fileId: string, _options?: ConfigurationOptions): Observable<HttpFile> {
        return this.downloadFileWithHttpInfo(fileId, _options).pipe(map((apiResponse: HttpInfo<HttpFile>) => apiResponse.data));
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param fileId
     */
    public getFileWithHttpInfo(fileId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.getFile(fileId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets metadata for a given file resource
     * Get File
     * @param fileId
     */
    public getFile(fileId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.getFileWithHttpInfo(fileId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Get Files Page
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getFilesPageWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
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

        const requestContextPromise = this.requestFactory.getFilesPage(limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFilesPageWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get Files Page
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getFilesPage(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<void> {
        return this.getFilesPageWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param clientFile
     */
    public getUploadLinksWithHttpInfo(clientFile: ClientFile, _options?: ConfigurationOptions): Observable<HttpInfo<ClientFileUploadData>> {
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

        const requestContextPromise = this.requestFactory.getUploadLinks(clientFile, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getUploadLinksWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get upload links for uploading a file to storage
     * Get Upload Links
     * @param clientFile
     */
    public getUploadLinks(clientFile: ClientFile, _options?: ConfigurationOptions): Observable<ClientFileUploadData> {
        return this.getUploadLinksWithHttpInfo(clientFile, _options).pipe(map((apiResponse: HttpInfo<ClientFileUploadData>) => apiResponse.data));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     */
    public listFilesWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Array<any>>> {
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

        const requestContextPromise = this.requestFactory.listFiles(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listFilesWithHttpInfo(rsp)));
            }));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/files/page` instead.    Lists all files stored in the system  Added in *version 0.5*:   Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Files
     */
    public listFiles(_options?: ConfigurationOptions): Observable<Array<any>> {
        return this.listFilesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<any>>) => apiResponse.data));
    }

    /**
     * Search files
     * Search Files Page
     * @param [sha256Checksum]
     * @param [fileId]
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public searchFilesPageWithHttpInfo(sha256Checksum?: string, fileId?: string, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageFile>> {
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

        const requestContextPromise = this.requestFactory.searchFilesPage(sha256Checksum, fileId, limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.searchFilesPageWithHttpInfo(rsp)));
            }));
    }

    /**
     * Search files
     * Search Files Page
     * @param [sha256Checksum]
     * @param [fileId]
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public searchFilesPage(sha256Checksum?: string, fileId?: string, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageFile> {
        return this.searchFilesPageWithHttpInfo(sha256Checksum, fileId, limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageFile>) => apiResponse.data));
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param file
     * @param [contentLength]
     */
    public uploadFileWithHttpInfo(file: HttpFile, contentLength?: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.uploadFile(file, contentLength, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.uploadFileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Uploads a single file to the system
     * Upload File
     * @param file
     * @param [contentLength]
     */
    public uploadFile(file: HttpFile, contentLength?: string, _options?: ConfigurationOptions): Observable<any> {
        return this.uploadFileWithHttpInfo(file, contentLength, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

}

import { FunctionJobCollectionsApiRequestFactory, FunctionJobCollectionsApiResponseProcessor} from "../apis/FunctionJobCollectionsApi";
export class ObservableFunctionJobCollectionsApi {
    private requestFactory: FunctionJobCollectionsApiRequestFactory;
    private responseProcessor: FunctionJobCollectionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobCollectionsApiRequestFactory,
        responseProcessor?: FunctionJobCollectionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionJobCollectionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionJobCollectionsApiResponseProcessor();
    }

    /**
     * Delete function job collection
     * Delete Function Job Collection
     * @param functionJobCollectionId
     */
    public deleteFunctionJobCollectionWithHttpInfo(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.deleteFunctionJobCollection(functionJobCollectionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteFunctionJobCollectionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete function job collection
     * Delete Function Job Collection
     * @param functionJobCollectionId
     */
    public deleteFunctionJobCollection(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.deleteFunctionJobCollectionWithHttpInfo(functionJobCollectionId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Get the function jobs in function job collection
     * Function Job Collection List Function Jobs
     * @param functionJobCollectionId
     */
    public functionJobCollectionListFunctionJobsWithHttpInfo(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>>> {
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

        const requestContextPromise = this.requestFactory.functionJobCollectionListFunctionJobs(functionJobCollectionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.functionJobCollectionListFunctionJobsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get the function jobs in function job collection
     * Function Job Collection List Function Jobs
     * @param functionJobCollectionId
     */
    public functionJobCollectionListFunctionJobs(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>> {
        return this.functionJobCollectionListFunctionJobsWithHttpInfo(functionJobCollectionId, _options).pipe(map((apiResponse: HttpInfo<Array<FunctionJobCollectionListFunctionJobs200ResponseInner>>) => apiResponse.data));
    }

    /**
     * Get function job collection status
     * Function Job Collection Status
     * @param functionJobCollectionId
     */
    public functionJobCollectionStatusWithHttpInfo(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJobCollectionStatus>> {
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

        const requestContextPromise = this.requestFactory.functionJobCollectionStatus(functionJobCollectionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.functionJobCollectionStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function job collection status
     * Function Job Collection Status
     * @param functionJobCollectionId
     */
    public functionJobCollectionStatus(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<FunctionJobCollectionStatus> {
        return this.functionJobCollectionStatusWithHttpInfo(functionJobCollectionId, _options).pipe(map((apiResponse: HttpInfo<FunctionJobCollectionStatus>) => apiResponse.data));
    }

    /**
     * Get function job collection
     * Get Function Job Collection
     * @param functionJobCollectionId
     */
    public getFunctionJobCollectionWithHttpInfo(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<RegisteredFunctionJobCollection>> {
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

        const requestContextPromise = this.requestFactory.getFunctionJobCollection(functionJobCollectionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionJobCollectionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function job collection
     * Get Function Job Collection
     * @param functionJobCollectionId
     */
    public getFunctionJobCollection(functionJobCollectionId: string, _options?: ConfigurationOptions): Observable<RegisteredFunctionJobCollection> {
        return this.getFunctionJobCollectionWithHttpInfo(functionJobCollectionId, _options).pipe(map((apiResponse: HttpInfo<RegisteredFunctionJobCollection>) => apiResponse.data));
    }

    /**
     * List function job collections
     * List Function Job Collections
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobCollectionsWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageRegisteredFunctionJobCollection>> {
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

        const requestContextPromise = this.requestFactory.listFunctionJobCollections(limit, offset, _config);
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
     * List function job collections
     * List Function Job Collections
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobCollections(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageRegisteredFunctionJobCollection> {
        return this.listFunctionJobCollectionsWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageRegisteredFunctionJobCollection>) => apiResponse.data));
    }

    /**
     * Register function job collection
     * Register Function Job Collection
     * @param functionJobCollection
     */
    public registerFunctionJobCollectionWithHttpInfo(functionJobCollection: FunctionJobCollection, _options?: ConfigurationOptions): Observable<HttpInfo<RegisteredFunctionJobCollection>> {
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

        const requestContextPromise = this.requestFactory.registerFunctionJobCollection(functionJobCollection, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.registerFunctionJobCollectionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Register function job collection
     * Register Function Job Collection
     * @param functionJobCollection
     */
    public registerFunctionJobCollection(functionJobCollection: FunctionJobCollection, _options?: ConfigurationOptions): Observable<RegisteredFunctionJobCollection> {
        return this.registerFunctionJobCollectionWithHttpInfo(functionJobCollection, _options).pipe(map((apiResponse: HttpInfo<RegisteredFunctionJobCollection>) => apiResponse.data));
    }

}

import { FunctionJobsApiRequestFactory, FunctionJobsApiResponseProcessor} from "../apis/FunctionJobsApi";
export class ObservableFunctionJobsApi {
    private requestFactory: FunctionJobsApiRequestFactory;
    private responseProcessor: FunctionJobsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionJobsApiRequestFactory,
        responseProcessor?: FunctionJobsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionJobsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionJobsApiResponseProcessor();
    }

    /**
     * Delete function job
     * Delete Function Job
     * @param functionJobId
     */
    public deleteFunctionJobWithHttpInfo(functionJobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.deleteFunctionJob(functionJobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteFunctionJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete function job
     * Delete Function Job
     * @param functionJobId
     */
    public deleteFunctionJob(functionJobId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.deleteFunctionJobWithHttpInfo(functionJobId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Get function job outputs
     * Function Job Outputs
     * @param functionJobId
     */
    public functionJobOutputsWithHttpInfo(functionJobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.functionJobOutputs(functionJobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.functionJobOutputsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function job outputs
     * Function Job Outputs
     * @param functionJobId
     */
    public functionJobOutputs(functionJobId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.functionJobOutputsWithHttpInfo(functionJobId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Get function job status
     * Function Job Status
     * @param functionJobId
     */
    public functionJobStatusWithHttpInfo(functionJobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<FunctionJobStatus>> {
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

        const requestContextPromise = this.requestFactory.functionJobStatus(functionJobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.functionJobStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function job status
     * Function Job Status
     * @param functionJobId
     */
    public functionJobStatus(functionJobId: string, _options?: ConfigurationOptions): Observable<FunctionJobStatus> {
        return this.functionJobStatusWithHttpInfo(functionJobId, _options).pipe(map((apiResponse: HttpInfo<FunctionJobStatus>) => apiResponse.data));
    }

    /**
     * Get function job
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJobWithHttpInfo(functionJobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet>> {
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
     * Get function job
     * Get Function Job
     * @param functionJobId
     */
    public getFunctionJob(functionJobId: string, _options?: ConfigurationOptions): Observable<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet> {
        return this.getFunctionJobWithHttpInfo(functionJobId, _options).pipe(map((apiResponse: HttpInfo<ResponseGetFunctionJobV0FunctionJobsFunctionJobIdGet>) => apiResponse.data));
    }

    /**
     * List function jobs
     * List Function Jobs
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobsWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
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

        const requestContextPromise = this.requestFactory.listFunctionJobs(limit, offset, _config);
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
     * List function jobs
     * List Function Jobs
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionJobs(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        return this.listFunctionJobsWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionJobRegisteredPythonCodeFunctionJobRegisteredSolverFunctionJobFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>) => apiResponse.data));
    }

    /**
     * Create function job
     * Register Function Job
     * @param functionJob
     */
    public registerFunctionJobWithHttpInfo(functionJob: FunctionJob, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseRegisterFunctionJobV0FunctionJobsPost>> {
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

        const requestContextPromise = this.requestFactory.registerFunctionJob(functionJob, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.registerFunctionJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create function job
     * Register Function Job
     * @param functionJob
     */
    public registerFunctionJob(functionJob: FunctionJob, _options?: ConfigurationOptions): Observable<ResponseRegisterFunctionJobV0FunctionJobsPost> {
        return this.registerFunctionJobWithHttpInfo(functionJob, _options).pipe(map((apiResponse: HttpInfo<ResponseRegisterFunctionJobV0FunctionJobsPost>) => apiResponse.data));
    }

}

import { FunctionsApiRequestFactory, FunctionsApiResponseProcessor} from "../apis/FunctionsApi";
export class ObservableFunctionsApi {
    private requestFactory: FunctionsApiRequestFactory;
    private responseProcessor: FunctionsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: FunctionsApiRequestFactory,
        responseProcessor?: FunctionsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new FunctionsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new FunctionsApiResponseProcessor();
    }

    /**
     * Delete function
     * Delete Function
     * @param functionId
     */
    public deleteFunctionWithHttpInfo(functionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<any>> {
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

        const requestContextPromise = this.requestFactory.deleteFunction(functionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Delete function
     * Delete Function
     * @param functionId
     */
    public deleteFunction(functionId: string, _options?: ConfigurationOptions): Observable<any> {
        return this.deleteFunctionWithHttpInfo(functionId, _options).pipe(map((apiResponse: HttpInfo<any>) => apiResponse.data));
    }

    /**
     * Get function
     * Get Function
     * @param functionId
     */
    public getFunctionWithHttpInfo(functionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseGetFunctionV0FunctionsFunctionIdGet>> {
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

        const requestContextPromise = this.requestFactory.getFunction(functionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function
     * Get Function
     * @param functionId
     */
    public getFunction(functionId: string, _options?: ConfigurationOptions): Observable<ResponseGetFunctionV0FunctionsFunctionIdGet> {
        return this.getFunctionWithHttpInfo(functionId, _options).pipe(map((apiResponse: HttpInfo<ResponseGetFunctionV0FunctionsFunctionIdGet>) => apiResponse.data));
    }

    /**
     * Get function input schema
     * Get Function Inputschema
     * @param functionId
     */
    public getFunctionInputschemaWithHttpInfo(functionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseGetFunctionInputschemaV0FunctionsFunctionIdInputSchemaGet>> {
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

        const requestContextPromise = this.requestFactory.getFunctionInputschema(functionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionInputschemaWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function input schema
     * Get Function Inputschema
     * @param functionId
     */
    public getFunctionInputschema(functionId: string, _options?: ConfigurationOptions): Observable<ResponseGetFunctionInputschemaV0FunctionsFunctionIdInputSchemaGet> {
        return this.getFunctionInputschemaWithHttpInfo(functionId, _options).pipe(map((apiResponse: HttpInfo<ResponseGetFunctionInputschemaV0FunctionsFunctionIdInputSchemaGet>) => apiResponse.data));
    }

    /**
     * Get function input schema
     * Get Function Outputschema
     * @param functionId
     */
    public getFunctionOutputschemaWithHttpInfo(functionId: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet>> {
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

        const requestContextPromise = this.requestFactory.getFunctionOutputschema(functionId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getFunctionOutputschemaWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get function input schema
     * Get Function Outputschema
     * @param functionId
     */
    public getFunctionOutputschema(functionId: string, _options?: ConfigurationOptions): Observable<ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet> {
        return this.getFunctionOutputschemaWithHttpInfo(functionId, _options).pipe(map((apiResponse: HttpInfo<ResponseGetFunctionOutputschemaV0FunctionsFunctionIdOutputSchemaGet>) => apiResponse.data));
    }

    /**
     * List functions
     * List Functions
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctionsWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>> {
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

        const requestContextPromise = this.requestFactory.listFunctions(limit, offset, _config);
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
     * List functions
     * List Functions
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listFunctions(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass> {
        return this.listFunctionsWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageAnnotatedUnionRegisteredProjectFunctionRegisteredPythonCodeFunctionRegisteredSolverFunctionFieldInfoAnnotationNoneTypeRequiredTrueDiscriminatorFunctionClass>) => apiResponse.data));
    }

    /**
     * Map function over input parameters
     * Map Function
     * @param functionId
     * @param requestBody
     */
    public mapFunctionWithHttpInfo(functionId: string, requestBody: Array<any | null>, _options?: ConfigurationOptions): Observable<HttpInfo<RegisteredFunctionJobCollection>> {
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

        const requestContextPromise = this.requestFactory.mapFunction(functionId, requestBody, _config);
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
     * Map function over input parameters
     * Map Function
     * @param functionId
     * @param requestBody
     */
    public mapFunction(functionId: string, requestBody: Array<any | null>, _options?: ConfigurationOptions): Observable<RegisteredFunctionJobCollection> {
        return this.mapFunctionWithHttpInfo(functionId, requestBody, _options).pipe(map((apiResponse: HttpInfo<RegisteredFunctionJobCollection>) => apiResponse.data));
    }

    /**
     * Create function
     * Register Function
     * @param _function
     */
    public registerFunctionWithHttpInfo(_function: Function, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseRegisterFunctionV0FunctionsPost>> {
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

        const requestContextPromise = this.requestFactory.registerFunction(_function, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.registerFunctionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create function
     * Register Function
     * @param _function
     */
    public registerFunction(_function: Function, _options?: ConfigurationOptions): Observable<ResponseRegisterFunctionV0FunctionsPost> {
        return this.registerFunctionWithHttpInfo(_function, _options).pipe(map((apiResponse: HttpInfo<ResponseRegisterFunctionV0FunctionsPost>) => apiResponse.data));
    }

    /**
     * Run function
     * Run Function
     * @param functionId
     * @param body
     */
    public runFunctionWithHttpInfo(functionId: string, body: any, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseRunFunctionV0FunctionsFunctionIdRunPost>> {
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

        const requestContextPromise = this.requestFactory.runFunction(functionId, body, _config);
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
     * Run function
     * Run Function
     * @param functionId
     * @param body
     */
    public runFunction(functionId: string, body: any, _options?: ConfigurationOptions): Observable<ResponseRunFunctionV0FunctionsFunctionIdRunPost> {
        return this.runFunctionWithHttpInfo(functionId, body, _options).pipe(map((apiResponse: HttpInfo<ResponseRunFunctionV0FunctionsFunctionIdRunPost>) => apiResponse.data));
    }

    /**
     * Update function
     * Update Function Description
     * @param functionId
     * @param description
     */
    public updateFunctionDescriptionWithHttpInfo(functionId: string, description: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch>> {
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

        const requestContextPromise = this.requestFactory.updateFunctionDescription(functionId, description, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateFunctionDescriptionWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update function
     * Update Function Description
     * @param functionId
     * @param description
     */
    public updateFunctionDescription(functionId: string, description: string, _options?: ConfigurationOptions): Observable<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch> {
        return this.updateFunctionDescriptionWithHttpInfo(functionId, description, _options).pipe(map((apiResponse: HttpInfo<ResponseUpdateFunctionDescriptionV0FunctionsFunctionIdDescriptionPatch>) => apiResponse.data));
    }

    /**
     * Update function
     * Update Function Title
     * @param functionId
     * @param title
     */
    public updateFunctionTitleWithHttpInfo(functionId: string, title: string, _options?: ConfigurationOptions): Observable<HttpInfo<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch>> {
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

        const requestContextPromise = this.requestFactory.updateFunctionTitle(functionId, title, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateFunctionTitleWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update function
     * Update Function Title
     * @param functionId
     * @param title
     */
    public updateFunctionTitle(functionId: string, title: string, _options?: ConfigurationOptions): Observable<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch> {
        return this.updateFunctionTitleWithHttpInfo(functionId, title, _options).pipe(map((apiResponse: HttpInfo<ResponseUpdateFunctionTitleV0FunctionsFunctionIdTitlePatch>) => apiResponse.data));
    }

    /**
     * Validate inputs against the function\'s input schema
     * Validate Function Inputs
     * @param functionId
     * @param body
     */
    public validateFunctionInputsWithHttpInfo(functionId: string, body: any, _options?: ConfigurationOptions): Observable<HttpInfo<Array<any>>> {
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

        const requestContextPromise = this.requestFactory.validateFunctionInputs(functionId, body, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.validateFunctionInputsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Validate inputs against the function\'s input schema
     * Validate Function Inputs
     * @param functionId
     * @param body
     */
    public validateFunctionInputs(functionId: string, body: any, _options?: ConfigurationOptions): Observable<Array<any>> {
        return this.validateFunctionInputsWithHttpInfo(functionId, body, _options).pipe(map((apiResponse: HttpInfo<Array<any>>) => apiResponse.data));
    }

}

import { LicensedItemsApiRequestFactory, LicensedItemsApiResponseProcessor} from "../apis/LicensedItemsApi";
export class ObservableLicensedItemsApi {
    private requestFactory: LicensedItemsApiRequestFactory;
    private responseProcessor: LicensedItemsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: LicensedItemsApiRequestFactory,
        responseProcessor?: LicensedItemsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new LicensedItemsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new LicensedItemsApiResponseProcessor();
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getLicensedItemsWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageLicensedItemGet>> {
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

        const requestContextPromise = this.requestFactory.getLicensedItems(limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getLicensedItemsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get all licensed items
     * Get Licensed Items
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getLicensedItems(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageLicensedItemGet> {
        return this.getLicensedItemsWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageLicensedItemGet>) => apiResponse.data));
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param licensedItemId
     * @param licensedItemCheckoutId
     */
    public releaseLicensedItemWithHttpInfo(licensedItemId: string, licensedItemCheckoutId: string, _options?: ConfigurationOptions): Observable<HttpInfo<LicensedItemCheckoutGet>> {
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

        const requestContextPromise = this.requestFactory.releaseLicensedItem(licensedItemId, licensedItemCheckoutId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.releaseLicensedItemWithHttpInfo(rsp)));
            }));
    }

    /**
     * Release previously checked out licensed item
     * Release Licensed Item
     * @param licensedItemId
     * @param licensedItemCheckoutId
     */
    public releaseLicensedItem(licensedItemId: string, licensedItemCheckoutId: string, _options?: ConfigurationOptions): Observable<LicensedItemCheckoutGet> {
        return this.releaseLicensedItemWithHttpInfo(licensedItemId, licensedItemCheckoutId, _options).pipe(map((apiResponse: HttpInfo<LicensedItemCheckoutGet>) => apiResponse.data));
    }

}

import { MetaApiRequestFactory, MetaApiResponseProcessor} from "../apis/MetaApi";
export class ObservableMetaApi {
    private requestFactory: MetaApiRequestFactory;
    private responseProcessor: MetaApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: MetaApiRequestFactory,
        responseProcessor?: MetaApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new MetaApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new MetaApiResponseProcessor();
    }

    /**
     * Get Service Metadata
     */
    public getServiceMetadataWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Meta>> {
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

        const requestContextPromise = this.requestFactory.getServiceMetadata(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getServiceMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get Service Metadata
     */
    public getServiceMetadata(_options?: ConfigurationOptions): Observable<Meta> {
        return this.getServiceMetadataWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Meta>) => apiResponse.data));
    }

}

import { ProgramsApiRequestFactory, ProgramsApiResponseProcessor} from "../apis/ProgramsApi";
export class ObservableProgramsApi {
    private requestFactory: ProgramsApiRequestFactory;
    private responseProcessor: ProgramsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ProgramsApiRequestFactory,
        responseProcessor?: ProgramsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ProgramsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ProgramsApiResponseProcessor();
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param programKey
     * @param version
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     * @param [bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost]
     */
    public createProgramJobWithHttpInfo(programKey: string, version: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options?: ConfigurationOptions): Observable<HttpInfo<Job>> {
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

        const requestContextPromise = this.requestFactory.createProgramJob(programKey, version, xSimcoreParentProjectUuid, xSimcoreParentNodeId, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createProgramJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Creates a program job
     * Create Program Job
     * @param programKey
     * @param version
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     * @param [bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost]
     */
    public createProgramJob(programKey: string, version: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost?: BodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options?: ConfigurationOptions): Observable<Job> {
        return this.createProgramJobWithHttpInfo(programKey, version, xSimcoreParentProjectUuid, xSimcoreParentNodeId, bodyCreateProgramJobV0ProgramsProgramKeyReleasesVersionJobsPost, _options).pipe(map((apiResponse: HttpInfo<Job>) => apiResponse.data));
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param programKey
     * @param version
     */
    public getProgramReleaseWithHttpInfo(programKey: string, version: string, _options?: ConfigurationOptions): Observable<HttpInfo<Program>> {
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

        const requestContextPromise = this.requestFactory.getProgramRelease(programKey, version, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProgramReleaseWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets a specific release of a solver
     * Get Program Release
     * @param programKey
     * @param version
     */
    public getProgramRelease(programKey: string, version: string, _options?: ConfigurationOptions): Observable<Program> {
        return this.getProgramReleaseWithHttpInfo(programKey, version, _options).pipe(map((apiResponse: HttpInfo<Program>) => apiResponse.data));
    }

}

import { SolversApiRequestFactory, SolversApiResponseProcessor} from "../apis/SolversApi";
export class ObservableSolversApi {
    private requestFactory: SolversApiRequestFactory;
    private responseProcessor: SolversApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: SolversApiRequestFactory,
        responseProcessor?: SolversApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new SolversApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new SolversApiResponseProcessor();
    }

    /**
     * Creates a job in a specific release with given inputs.  NOTE: This operation does **not** start the job
     * Create Solver Job
     * @param solverKey
     * @param version
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createSolverJobWithHttpInfo(solverKey: string, version: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Job>> {
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

        const requestContextPromise = this.requestFactory.createSolverJob(solverKey, version, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createSolverJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Creates a job in a specific release with given inputs.  NOTE: This operation does **not** start the job
     * Create Solver Job
     * @param solverKey
     * @param version
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createSolverJob(solverKey: string, version: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<Job> {
        return this.createSolverJobWithHttpInfo(solverKey, version, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _options).pipe(map((apiResponse: HttpInfo<Job>) => apiResponse.data));
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public deleteJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
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

        const requestContextPromise = this.requestFactory.deleteJob(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Deletes an existing solver job  New in *version 0.7*
     * Delete Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public deleteJob(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<void> {
        return this.deleteJobWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<Job>> {
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

        const requestContextPromise = this.requestFactory.getJob(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets job of a given solver
     * Get Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJob(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<Job> {
        return this.getJobWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<Job>) => apiResponse.data));
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobCustomMetadataWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobMetadata>> {
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

        const requestContextPromise = this.requestFactory.getJobCustomMetadata(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobCustomMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets custom metadata from a job  New in *version 0.7*
     * Get Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobCustomMetadata(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<JobMetadata> {
        return this.getJobCustomMetadataWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<JobMetadata>) => apiResponse.data));
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done.  New in *version 0.4.0*
     * Get Job Output Logfile
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputLogfileWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<HttpFile>> {
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

        const requestContextPromise = this.requestFactory.getJobOutputLogfile(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobOutputLogfileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done.  New in *version 0.4.0*
     * Get Job Output Logfile
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputLogfile(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpFile> {
        return this.getJobOutputLogfileWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<HttpFile>) => apiResponse.data));
    }

    /**
     * Get Job Outputs
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputsWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobOutputs>> {
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

        const requestContextPromise = this.requestFactory.getJobOutputs(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobOutputsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get Job Outputs
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobOutputs(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<JobOutputs> {
        return this.getJobOutputsWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<JobOutputs>) => apiResponse.data));
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobPricingUnitWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<PricingUnitGetLegacy>> {
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

        const requestContextPromise = this.requestFactory.getJobPricingUnit(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobPricingUnitWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get job pricing unit  New in *version 0.7*
     * Get Job Pricing Unit
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobPricingUnit(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<PricingUnitGetLegacy> {
        return this.getJobPricingUnitWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<PricingUnitGetLegacy>) => apiResponse.data));
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWalletWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
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

        const requestContextPromise = this.requestFactory.getJobWallet(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobWalletWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get job wallet  New in *version 0.7*
     * Get Job Wallet
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getJobWallet(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<WalletGetWithAvailableCreditsLegacy> {
        return this.getJobWalletWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<WalletGetWithAvailableCreditsLegacy>) => apiResponse.data));
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * Get Jobs Page
     * @param solverKey
     * @param version
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getJobsPageWithHttpInfo(solverKey: string, version: string, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageJob>> {
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

        const requestContextPromise = this.requestFactory.getJobsPage(solverKey, version, limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getJobsPageWithHttpInfo(rsp)));
            }));
    }

    /**
     * List of jobs on a specific released solver (includes pagination)  New in *version 0.7*
     * Get Jobs Page
     * @param solverKey
     * @param version
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getJobsPage(solverKey: string, version: string, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageJob> {
        return this.getJobsPageWithHttpInfo(solverKey, version, limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageJob>) => apiResponse.data));
    }

    /**
     * Get Log Stream
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getLogStreamWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet>> {
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

        const requestContextPromise = this.requestFactory.getLogStream(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getLogStreamWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get Log Stream
     * @param solverKey
     * @param version
     * @param jobId
     */
    public getLogStream(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet> {
        return this.getLogStreamWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet>) => apiResponse.data));
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param solverKey
     */
    public getSolverWithHttpInfo(solverKey: string, _options?: ConfigurationOptions): Observable<HttpInfo<Solver>> {
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

        const requestContextPromise = this.requestFactory.getSolver(solverKey, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSolverWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets latest release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver
     * @param solverKey
     */
    public getSolver(solverKey: string, _options?: ConfigurationOptions): Observable<Solver> {
        return this.getSolverWithHttpInfo(solverKey, _options).pipe(map((apiResponse: HttpInfo<Solver>) => apiResponse.data));
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param solverKey
     * @param version
     */
    public getSolverPricingPlanWithHttpInfo(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<HttpInfo<ServicePricingPlanGetLegacy>> {
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

        const requestContextPromise = this.requestFactory.getSolverPricingPlan(solverKey, version, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSolverPricingPlanWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets solver pricing plan  New in *version 0.7*  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Pricing Plan
     * @param solverKey
     * @param version
     */
    public getSolverPricingPlan(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<ServicePricingPlanGetLegacy> {
        return this.getSolverPricingPlanWithHttpInfo(solverKey, version, _options).pipe(map((apiResponse: HttpInfo<ServicePricingPlanGetLegacy>) => apiResponse.data));
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param solverKey
     * @param version
     */
    public getSolverReleaseWithHttpInfo(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<HttpInfo<Solver>> {
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

        const requestContextPromise = this.requestFactory.getSolverRelease(solverKey, version, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSolverReleaseWithHttpInfo(rsp)));
            }));
    }

    /**
     * Gets a specific release of a solver  Added in *version 0.7.1*: `version_display` field in the response
     * Get Solver Release
     * @param solverKey
     * @param version
     */
    public getSolverRelease(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<Solver> {
        return this.getSolverReleaseWithHttpInfo(solverKey, version, _options).pipe(map((apiResponse: HttpInfo<Solver>) => apiResponse.data));
    }

    /**
     * Inspect Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public inspectJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.inspectJob(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.inspectJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Inspect Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public inspectJob(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.inspectJobWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param solverKey
     * @param version
     */
    public listJobsWithHttpInfo(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<HttpInfo<Array<Job>>> {
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

        const requestContextPromise = this.requestFactory.listJobs(solverKey, version, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listJobsWithHttpInfo(rsp)));
            }));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version
     * List Jobs
     * @param solverKey
     * @param version
     */
    public listJobs(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<Array<Job>> {
        return this.listJobsWithHttpInfo(solverKey, version, _options).pipe(map((apiResponse: HttpInfo<Array<Job>>) => apiResponse.data));
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5.0*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param solverKey
     * @param version
     */
    public listSolverPortsWithHttpInfo(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<HttpInfo<OnePageSolverPort>> {
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

        const requestContextPromise = this.requestFactory.listSolverPorts(solverKey, version, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSolverPortsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Lists inputs and outputs of a given solver  New in *version 0.5.0*  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Ports
     * @param solverKey
     * @param version
     */
    public listSolverPorts(solverKey: string, version: string, _options?: ConfigurationOptions): Observable<OnePageSolverPort> {
        return this.listSolverPortsWithHttpInfo(solverKey, version, _options).pipe(map((apiResponse: HttpInfo<OnePageSolverPort>) => apiResponse.data));
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param solverKey
     */
    public listSolverReleasesWithHttpInfo(solverKey: string, _options?: ConfigurationOptions): Observable<HttpInfo<Array<Solver>>> {
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

        const requestContextPromise = this.requestFactory.listSolverReleases(solverKey, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSolverReleasesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Lists all releases of a given (one) solver  Added in *version 0.7.1*: `version_display` field in the response
     * List Solver Releases
     * @param solverKey
     */
    public listSolverReleases(solverKey: string, _options?: ConfigurationOptions): Observable<Array<Solver>> {
        return this.listSolverReleasesWithHttpInfo(solverKey, _options).pipe(map((apiResponse: HttpInfo<Array<Solver>>) => apiResponse.data));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5.0*
     * List Solvers
     */
    public listSolversWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Array<Solver>>> {
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

        const requestContextPromise = this.requestFactory.listSolvers(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSolversWithHttpInfo(rsp)));
            }));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5.0*
     * List Solvers
     */
    public listSolvers(_options?: ConfigurationOptions): Observable<Array<Solver>> {
        return this.listSolversWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<Solver>>) => apiResponse.data));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists all released solvers (not just latest version)  New in *version 0.5.0*
     * Lists All Releases
     */
    public listSolversReleasesWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Array<Solver>>> {
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

        const requestContextPromise = this.requestFactory.listSolversReleases(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSolversReleasesWithHttpInfo(rsp)));
            }));
    }

    /**
     * 🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists all released solvers (not just latest version)  New in *version 0.5.0*
     * Lists All Releases
     */
    public listSolversReleases(_options?: ConfigurationOptions): Observable<Array<Solver>> {
        return this.listSolversReleasesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Array<Solver>>) => apiResponse.data));
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceJobCustomMetadataWithHttpInfo(solverKey: string, version: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: ConfigurationOptions): Observable<HttpInfo<JobMetadata>> {
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

        const requestContextPromise = this.requestFactory.replaceJobCustomMetadata(solverKey, version, jobId, jobMetadataUpdate, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.replaceJobCustomMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Updates custom metadata from a job  New in *version 0.7*
     * Replace Job Custom Metadata
     * @param solverKey
     * @param version
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceJobCustomMetadata(solverKey: string, version: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: ConfigurationOptions): Observable<JobMetadata> {
        return this.replaceJobCustomMetadataWithHttpInfo(solverKey, version, jobId, jobMetadataUpdate, _options).pipe(map((apiResponse: HttpInfo<JobMetadata>) => apiResponse.data));
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id` Added in *version 0.6*: responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated
     * Start Job
     * @param solverKey
     * @param version
     * @param jobId
     * @param [clusterId]
     */
    public startJobWithHttpInfo(solverKey: string, version: string, jobId: string, clusterId?: number, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.startJob(solverKey, version, jobId, clusterId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.startJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id` Added in *version 0.6*: responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated
     * Start Job
     * @param solverKey
     * @param version
     * @param jobId
     * @param [clusterId]
     */
    public startJob(solverKey: string, version: string, jobId: string, clusterId?: number, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.startJobWithHttpInfo(solverKey, version, jobId, clusterId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

    /**
     * Stop Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public stopJobWithHttpInfo(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.stopJob(solverKey, version, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.stopJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Stop Job
     * @param solverKey
     * @param version
     * @param jobId
     */
    public stopJob(solverKey: string, version: string, jobId: string, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.stopJobWithHttpInfo(solverKey, version, jobId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

}

import { StudiesApiRequestFactory, StudiesApiResponseProcessor} from "../apis/StudiesApi";
export class ObservableStudiesApi {
    private requestFactory: StudiesApiRequestFactory;
    private responseProcessor: StudiesApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: StudiesApiRequestFactory,
        responseProcessor?: StudiesApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new StudiesApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new StudiesApiResponseProcessor();
    }

    /**
     * Clone Study
     * @param studyId
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public cloneStudyWithHttpInfo(studyId: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Study>> {
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

        const requestContextPromise = this.requestFactory.cloneStudy(studyId, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.cloneStudyWithHttpInfo(rsp)));
            }));
    }

    /**
     * Clone Study
     * @param studyId
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public cloneStudy(studyId: string, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<Study> {
        return this.cloneStudyWithHttpInfo(studyId, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _options).pipe(map((apiResponse: HttpInfo<Study>) => apiResponse.data));
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param studyId
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createStudyJobWithHttpInfo(studyId: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Job>> {
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

        const requestContextPromise = this.requestFactory.createStudyJob(studyId, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createStudyJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * hidden -- if True (default) hides project from UI
     * Create Study Job
     * @param studyId
     * @param jobInputs
     * @param [hidden]
     * @param [xSimcoreParentProjectUuid]
     * @param [xSimcoreParentNodeId]
     */
    public createStudyJob(studyId: string, jobInputs: JobInputs, hidden?: boolean, xSimcoreParentProjectUuid?: string, xSimcoreParentNodeId?: string, _options?: ConfigurationOptions): Observable<Job> {
        return this.createStudyJobWithHttpInfo(studyId, jobInputs, hidden, xSimcoreParentProjectUuid, xSimcoreParentNodeId, _options).pipe(map((apiResponse: HttpInfo<Job>) => apiResponse.data));
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param studyId
     * @param jobId
     */
    public deleteStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
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

        const requestContextPromise = this.requestFactory.deleteStudyJob(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteStudyJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Deletes an existing study job
     * Delete Study Job
     * @param studyId
     * @param jobId
     */
    public deleteStudyJob(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<void> {
        return this.deleteStudyJobWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * New in *version 0.5.0*
     * Get Study
     * @param studyId
     */
    public getStudyWithHttpInfo(studyId: string, _options?: ConfigurationOptions): Observable<HttpInfo<Study>> {
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

        const requestContextPromise = this.requestFactory.getStudy(studyId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getStudyWithHttpInfo(rsp)));
            }));
    }

    /**
     * New in *version 0.5.0*
     * Get Study
     * @param studyId
     */
    public getStudy(studyId: string, _options?: ConfigurationOptions): Observable<Study> {
        return this.getStudyWithHttpInfo(studyId, _options).pipe(map((apiResponse: HttpInfo<Study>) => apiResponse.data));
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param studyId
     * @param jobId
     */
    public getStudyJobCustomMetadataWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobMetadata>> {
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

        const requestContextPromise = this.requestFactory.getStudyJobCustomMetadata(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getStudyJobCustomMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get custom metadata from a study\'s job  New in *version 0.7*
     * Get Study Job Custom Metadata
     * @param studyId
     * @param jobId
     */
    public getStudyJobCustomMetadata(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<JobMetadata> {
        return this.getStudyJobCustomMetadataWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<JobMetadata>) => apiResponse.data));
    }

    /**
     * Get download links for study job log files
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputLogfileWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobLogsMap>> {
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

        const requestContextPromise = this.requestFactory.getStudyJobOutputLogfile(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getStudyJobOutputLogfileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get download links for study job log files
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputLogfile(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<JobLogsMap> {
        return this.getStudyJobOutputLogfileWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<JobLogsMap>) => apiResponse.data));
    }

    /**
     * Get Study Job Outputs
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputsWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobOutputs>> {
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

        const requestContextPromise = this.requestFactory.getStudyJobOutputs(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getStudyJobOutputsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get Study Job Outputs
     * @param studyId
     * @param jobId
     */
    public getStudyJobOutputs(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<JobOutputs> {
        return this.getStudyJobOutputsWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<JobOutputs>) => apiResponse.data));
    }

    /**
     * Inspect Study Job
     * @param studyId
     * @param jobId
     */
    public inspectStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.inspectStudyJob(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.inspectStudyJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Inspect Study Job
     * @param studyId
     * @param jobId
     */
    public inspectStudyJob(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.inspectStudyJobWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

    /**
     * New in *version 0.5.0*
     * List Studies
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listStudiesWithHttpInfo(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageStudy>> {
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

        const requestContextPromise = this.requestFactory.listStudies(limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listStudiesWithHttpInfo(rsp)));
            }));
    }

    /**
     * New in *version 0.5.0*
     * List Studies
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public listStudies(limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageStudy> {
        return this.listStudiesWithHttpInfo(limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageStudy>) => apiResponse.data));
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5.0*
     * List Study Ports
     * @param studyId
     */
    public listStudyPortsWithHttpInfo(studyId: string, _options?: ConfigurationOptions): Observable<HttpInfo<OnePageStudyPort>> {
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

        const requestContextPromise = this.requestFactory.listStudyPorts(studyId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listStudyPortsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Lists metadata on ports of a given study  New in *version 0.5.0*
     * List Study Ports
     * @param studyId
     */
    public listStudyPorts(studyId: string, _options?: ConfigurationOptions): Observable<OnePageStudyPort> {
        return this.listStudyPortsWithHttpInfo(studyId, _options).pipe(map((apiResponse: HttpInfo<OnePageStudyPort>) => apiResponse.data));
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param studyId
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceStudyJobCustomMetadataWithHttpInfo(studyId: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: ConfigurationOptions): Observable<HttpInfo<JobMetadata>> {
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

        const requestContextPromise = this.requestFactory.replaceStudyJobCustomMetadata(studyId, jobId, jobMetadataUpdate, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.replaceStudyJobCustomMetadataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Changes custom metadata of a study\'s job  New in *version 0.7*
     * Replace Study Job Custom Metadata
     * @param studyId
     * @param jobId
     * @param jobMetadataUpdate
     */
    public replaceStudyJobCustomMetadata(studyId: string, jobId: string, jobMetadataUpdate: JobMetadataUpdate, _options?: ConfigurationOptions): Observable<JobMetadata> {
        return this.replaceStudyJobCustomMetadataWithHttpInfo(studyId, jobId, jobMetadataUpdate, _options).pipe(map((apiResponse: HttpInfo<JobMetadata>) => apiResponse.data));
    }

    /**
     * Changed in *version 0.6.0*: Now responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated
     * Start Study Job
     * @param studyId
     * @param jobId
     * @param [clusterId]
     */
    public startStudyJobWithHttpInfo(studyId: string, jobId: string, clusterId?: number, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.startStudyJob(studyId, jobId, clusterId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.startStudyJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Changed in *version 0.6.0*: Now responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated
     * Start Study Job
     * @param studyId
     * @param jobId
     * @param [clusterId]
     */
    public startStudyJob(studyId: string, jobId: string, clusterId?: number, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.startStudyJobWithHttpInfo(studyId, jobId, clusterId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

    /**
     * Stop Study Job
     * @param studyId
     * @param jobId
     */
    public stopStudyJobWithHttpInfo(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<HttpInfo<JobStatus>> {
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

        const requestContextPromise = this.requestFactory.stopStudyJob(studyId, jobId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.stopStudyJobWithHttpInfo(rsp)));
            }));
    }

    /**
     * Stop Study Job
     * @param studyId
     * @param jobId
     */
    public stopStudyJob(studyId: string, jobId: string, _options?: ConfigurationOptions): Observable<JobStatus> {
        return this.stopStudyJobWithHttpInfo(studyId, jobId, _options).pipe(map((apiResponse: HttpInfo<JobStatus>) => apiResponse.data));
    }

}

import { UsersApiRequestFactory, UsersApiResponseProcessor} from "../apis/UsersApi";
export class ObservableUsersApi {
    private requestFactory: UsersApiRequestFactory;
    private responseProcessor: UsersApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: UsersApiRequestFactory,
        responseProcessor?: UsersApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new UsersApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new UsersApiResponseProcessor();
    }

    /**
     * Get My Profile
     */
    public getMyProfileWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Profile>> {
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

        const requestContextPromise = this.requestFactory.getMyProfile(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMyProfileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get My Profile
     */
    public getMyProfile(_options?: ConfigurationOptions): Observable<Profile> {
        return this.getMyProfileWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Profile>) => apiResponse.data));
    }

    /**
     * Update My Profile
     * @param profileUpdate
     */
    public updateMyProfileWithHttpInfo(profileUpdate: ProfileUpdate, _options?: ConfigurationOptions): Observable<HttpInfo<Profile>> {
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

        const requestContextPromise = this.requestFactory.updateMyProfile(profileUpdate, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateMyProfileWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update My Profile
     * @param profileUpdate
     */
    public updateMyProfile(profileUpdate: ProfileUpdate, _options?: ConfigurationOptions): Observable<Profile> {
        return this.updateMyProfileWithHttpInfo(profileUpdate, _options).pipe(map((apiResponse: HttpInfo<Profile>) => apiResponse.data));
    }

}

import { WalletsApiRequestFactory, WalletsApiResponseProcessor} from "../apis/WalletsApi";
export class ObservableWalletsApi {
    private requestFactory: WalletsApiRequestFactory;
    private responseProcessor: WalletsApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: WalletsApiRequestFactory,
        responseProcessor?: WalletsApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new WalletsApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new WalletsApiResponseProcessor();
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param walletId
     * @param licensedItemId
     * @param licensedItemCheckoutData
     */
    public checkoutLicensedItemWithHttpInfo(walletId: number, licensedItemId: string, licensedItemCheckoutData: LicensedItemCheckoutData, _options?: ConfigurationOptions): Observable<HttpInfo<LicensedItemCheckoutGet>> {
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

        const requestContextPromise = this.requestFactory.checkoutLicensedItem(walletId, licensedItemId, licensedItemCheckoutData, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.checkoutLicensedItemWithHttpInfo(rsp)));
            }));
    }

    /**
     * Checkout licensed item
     * Checkout Licensed Item
     * @param walletId
     * @param licensedItemId
     * @param licensedItemCheckoutData
     */
    public checkoutLicensedItem(walletId: number, licensedItemId: string, licensedItemCheckoutData: LicensedItemCheckoutData, _options?: ConfigurationOptions): Observable<LicensedItemCheckoutGet> {
        return this.checkoutLicensedItemWithHttpInfo(walletId, licensedItemId, licensedItemCheckoutData, _options).pipe(map((apiResponse: HttpInfo<LicensedItemCheckoutGet>) => apiResponse.data));
    }

    /**
     * Get all available licensed items for a given wallet
     * Get Available Licensed Items For Wallet
     * @param walletId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getAvailableLicensedItemsForWalletWithHttpInfo(walletId: number, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<HttpInfo<PageLicensedItemGet>> {
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

        const requestContextPromise = this.requestFactory.getAvailableLicensedItemsForWallet(walletId, limit, offset, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAvailableLicensedItemsForWalletWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get all available licensed items for a given wallet
     * Get Available Licensed Items For Wallet
     * @param walletId
     * @param [limit] Page size limit
     * @param [offset] Page offset
     */
    public getAvailableLicensedItemsForWallet(walletId: number, limit?: number, offset?: number, _options?: ConfigurationOptions): Observable<PageLicensedItemGet> {
        return this.getAvailableLicensedItemsForWalletWithHttpInfo(walletId, limit, offset, _options).pipe(map((apiResponse: HttpInfo<PageLicensedItemGet>) => apiResponse.data));
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     */
    public getDefaultWalletWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
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

        const requestContextPromise = this.requestFactory.getDefaultWallet(_config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDefaultWalletWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get default wallet  New in *version 0.7*
     * Get Default Wallet
     */
    public getDefaultWallet(_options?: ConfigurationOptions): Observable<WalletGetWithAvailableCreditsLegacy> {
        return this.getDefaultWalletWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<WalletGetWithAvailableCreditsLegacy>) => apiResponse.data));
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param walletId
     */
    public getWalletWithHttpInfo(walletId: number, _options?: ConfigurationOptions): Observable<HttpInfo<WalletGetWithAvailableCreditsLegacy>> {
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

        const requestContextPromise = this.requestFactory.getWallet(walletId, _config);
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
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWalletWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get wallet  New in *version 0.7*
     * Get Wallet
     * @param walletId
     */
    public getWallet(walletId: number, _options?: ConfigurationOptions): Observable<WalletGetWithAvailableCreditsLegacy> {
        return this.getWalletWithHttpInfo(walletId, _options).pipe(map((apiResponse: HttpInfo<WalletGetWithAvailableCreditsLegacy>) => apiResponse.data));
    }

}
