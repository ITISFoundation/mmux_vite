# .SolversApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createSolverJob**](SolversApi.md#createSolverJob) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs | Create Solver Job
[**deleteJob**](SolversApi.md#deleteJob) | **DELETE** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id} | Delete Job
[**getJob**](SolversApi.md#getJob) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id} | Get Job
[**getJobCustomMetadata**](SolversApi.md#getJobCustomMetadata) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/metadata | Get Job Custom Metadata
[**getJobOutputLogfile**](SolversApi.md#getJobOutputLogfile) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/outputs/logfile | Get Job Output Logfile
[**getJobOutputs**](SolversApi.md#getJobOutputs) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/outputs | Get Job Outputs
[**getJobPricingUnit**](SolversApi.md#getJobPricingUnit) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/pricing_unit | Get Job Pricing Unit
[**getJobWallet**](SolversApi.md#getJobWallet) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/wallet | Get Job Wallet
[**getJobsPage**](SolversApi.md#getJobsPage) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/page | Get Jobs Page
[**getLogStream**](SolversApi.md#getLogStream) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/logstream | Get Log Stream
[**getSolver**](SolversApi.md#getSolver) | **GET** /v0/solvers/{solver_key}/latest | Get Latest Release of a Solver
[**getSolverPricingPlan**](SolversApi.md#getSolverPricingPlan) | **GET** /v0/solvers/{solver_key}/releases/{version}/pricing_plan | Get Solver Pricing Plan
[**getSolverRelease**](SolversApi.md#getSolverRelease) | **GET** /v0/solvers/{solver_key}/releases/{version} | Get Solver Release
[**inspectJob**](SolversApi.md#inspectJob) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:inspect | Inspect Job
[**listJobs**](SolversApi.md#listJobs) | **GET** /v0/solvers/{solver_key}/releases/{version}/jobs | List Jobs
[**listSolverPorts**](SolversApi.md#listSolverPorts) | **GET** /v0/solvers/{solver_key}/releases/{version}/ports | List Solver Ports
[**listSolverReleases**](SolversApi.md#listSolverReleases) | **GET** /v0/solvers/{solver_key}/releases | List Solver Releases
[**listSolvers**](SolversApi.md#listSolvers) | **GET** /v0/solvers | List Solvers
[**listSolversReleases**](SolversApi.md#listSolversReleases) | **GET** /v0/solvers/releases | Lists All Releases
[**replaceJobCustomMetadata**](SolversApi.md#replaceJobCustomMetadata) | **PATCH** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}/metadata | Replace Job Custom Metadata
[**startJob**](SolversApi.md#startJob) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:start | Start Job
[**stopJob**](SolversApi.md#stopJob) | **POST** /v0/solvers/{solver_key}/releases/{version}/jobs/{job_id}:stop | Stop Job


# **createSolverJob**
> Job createSolverJob(jobInputs)

Creates a job in a specific release with given inputs.  NOTE: This operation does **not** start the job

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiCreateSolverJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiCreateSolverJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobInputs: {
    values: {
      "key": null,
    },
  },
  
  hidden: true,
  
  xSimcoreParentProjectUuid: "x-simcore-parent-project-uuid_example",
  
  xSimcoreParentNodeId: "x-simcore-parent-node-id_example",
};

const data = await apiInstance.createSolverJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobInputs** | **JobInputs**|  |
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **hidden** | [**boolean**] |  | (optional) defaults to true
 **xSimcoreParentProjectUuid** | [**string**] |  | (optional) defaults to undefined
 **xSimcoreParentNodeId** | [**string**] |  | (optional) defaults to undefined


### Return type

**Job**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteJob**
> void deleteJob()

Deletes an existing solver job  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiDeleteJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiDeleteJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.deleteJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJob**
> Job getJob()

Gets job of a given solver

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**Job**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobCustomMetadata**
> JobMetadata getJobCustomMetadata()

Gets custom metadata from a job  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobCustomMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobCustomMetadataRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJobCustomMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobMetadata**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Metadata not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobOutputLogfile**
> HttpFile getJobOutputLogfile()

Special extra output with persistent logs file for the solver run.  **NOTE**: this is not a log stream but a predefined output that is only available after the job is done.  New in *version 0.4.0*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobOutputLogfileRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobOutputLogfileRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJobOutputLogfile(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**HttpFile**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/zip, text/plain, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**307** | Successful Response |  -  |
**200** | Returns a log file |  -  |
**404** | Log not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobOutputs**
> JobOutputs getJobOutputs()


### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobOutputsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobOutputsRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJobOutputs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobOutputs**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobPricingUnit**
> PricingUnitGetLegacy getJobPricingUnit()

Get job pricing unit  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobPricingUnitRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobPricingUnitRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJobPricingUnit(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**PricingUnitGetLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Pricing unit not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobWallet**
> WalletGetWithAvailableCreditsLegacy getJobWallet()

Get job wallet  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobWalletRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobWalletRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getJobWallet(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**WalletGetWithAvailableCreditsLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getJobsPage**
> PageJob getJobsPage()

List of jobs on a specific released solver (includes pagination)  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetJobsPageRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetJobsPageRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
    // Page size limit (optional)
  limit: 20,
    // Page offset (optional)
  offset: 0,
};

const data = await apiInstance.getJobsPage(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **limit** | [**number**] | Page size limit | (optional) defaults to 20
 **offset** | [**number**] | Page offset | (optional) defaults to 0


### Return type

**PageJob**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getLogStream**
> Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet getLogStream()


### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetLogStreamRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetLogStreamRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.getLogStream(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**Response200GetLogStreamV0SolversSolverKeyReleasesVersionJobsJobIdLogstreamGet**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/x-ndjson, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Returns a JobLog or an ErrorGet |  -  |
**409** | Conflict: Logs are already being streamed |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSolver**
> Solver getSolver()

Gets latest release of a solver

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetSolverRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetSolverRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
};

const data = await apiInstance.getSolver(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined


### Return type

**Solver**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSolverPricingPlan**
> ServicePricingPlanGetLegacy getSolverPricingPlan()

Gets solver pricing plan  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetSolverPricingPlanRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetSolverPricingPlanRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
};

const data = await apiInstance.getSolverPricingPlan(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined


### Return type

**ServicePricingPlanGetLegacy**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSolverRelease**
> Solver getSolverRelease()

Gets a specific release of a solver

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiGetSolverReleaseRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiGetSolverReleaseRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
};

const data = await apiInstance.getSolverRelease(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined


### Return type

**Solver**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **inspectJob**
> JobStatus inspectJob()


### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiInspectJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiInspectJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.inspectJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listJobs**
> Array<Job> listJobs()

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /{solver_key}/releases/{version}/jobs/page` instead.    List of jobs in a specific released solver (limited to 20 jobs)  New in *version 0.5*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiListJobsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiListJobsRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
};

const data = await apiInstance.listJobs(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined


### Return type

**Array<Job>**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSolverPorts**
> OnePageSolverPort listSolverPorts()

Lists inputs and outputs of a given solver  New in *version 0.5.0*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiListSolverPortsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiListSolverPortsRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
};

const data = await apiInstance.listSolverPorts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined


### Return type

**OnePageSolverPort**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSolverReleases**
> Array<Solver> listSolverReleases()

Lists all releases of a given (one) solver  SEE get_solver_releases_page for a paginated version of this function

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiListSolverReleasesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiListSolverReleasesRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
};

const data = await apiInstance.listSolverReleases(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined


### Return type

**Array<Solver>**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSolvers**
> Array<Solver> listSolvers()

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/page` instead.    Lists all available solvers (latest version)  New in *version 0.5.0*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example


```typescript
import { createConfiguration, SolversApi } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request = {};

const data = await apiInstance.listSolvers(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<Solver>**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSolversReleases**
> Array<Solver> listSolversReleases()

🚨 **Deprecated**: This endpoint is deprecated and will be removed in a future release. Please use `GET /v0/solvers/{solver_key}/releases/page` instead.    Lists all released solvers (not just latest version)  New in *version 0.5.0*  Removed in *version 0.7*: This endpoint is deprecated and will be removed in a future version

### Example


```typescript
import { createConfiguration, SolversApi } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request = {};

const data = await apiInstance.listSolversReleases(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Array<Solver>**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **replaceJobCustomMetadata**
> JobMetadata replaceJobCustomMetadata(jobMetadataUpdate)

Updates custom metadata from a job  New in *version 0.7*

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiReplaceJobCustomMetadataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiReplaceJobCustomMetadataRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
  
  jobMetadataUpdate: {
    metadata: {
      "key": null,
    },
  },
};

const data = await apiInstance.replaceJobCustomMetadata(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobMetadataUpdate** | **JobMetadataUpdate**|  |
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobMetadata**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**404** | Metadata not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **startJob**
> JobStatus startJob()

Starts job job_id created with the solver solver_key:version  Added in *version 0.4.3*: query parameter `cluster_id` Added in *version 0.6*: responds with a 202 when successfully starting a computation Changed in *version 0.8*: query parameter `cluster_id` deprecated

### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiStartJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiStartJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
  
  clusterId: 0,
};

const data = await apiInstance.startJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined
 **clusterId** | [**number**] |  | (optional) defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**202** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**200** | Job already started |  -  |
**406** | Cluster not found |  -  |
**422** | Configuration error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **stopJob**
> JobStatus stopJob()


### Example


```typescript
import { createConfiguration, SolversApi } from '';
import type { SolversApiStopJobRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SolversApi(configuration);

const request: SolversApiStopJobRequest = {
  
  solverKey: "simcore/services/comp/8otgfww_r74cm.fyln9uyrj1gzi.i4v8m.oy3c3lv1-42d1z89qs7dlt2ggwxdm.u-j/x2lxgmsvd0b8j4ra3umkkogaqmyxcz.gh7x972hdi1rwy1dz1zlrqoa6cxag8esaiij7xep_iu01gk_5/4.44oo8eknpzwkvcjiy_je4uwcu2vp5f1qwcasmy.1j-m/8cy2p2mvpbh_8rt3k89i.ar_jx8zp-ijblab5eu.qsama3i.qu6nw2c5uhx16mm-xc/t_d3c7g1z8jjihw870..qmzk-8jiaj62_84ka_4ohhtc65cwqhsz3kwm10velwgrqut-um/zgt0p7xoj1l4vy4r8xh5azigdbkuougrjor.x-.8wlvcjncnvr4b68ccagxhh/whzdjbvr.ig668cjaz/53w8vc_x.mc8ifb4uko2no27m-af-qkyv8_e2jzvnf1-q08x60g93c36-vetxr84zb3ng0g/enf3e29ikdar0ofvw9byzq.ay9ehsja7hmk5ub7n8a5x9rz7o1w631jejzlwbk70et6gb6pu--lkwrg8u2sw7xsa51xun346t4./m7tffuzvkot.9ee3_2pm1_h0imdy6y-x_gypj47m-ahleosjco.hinlinxveky-k-jkvhmxfr00ucsmo84ux-qqk_iybg/1-3cbgh-53y1jjf98wksvndhtrcp.wx4k2skhrlxowc02l2gspbo6t7.a3o5qhi_2-l/ib3n-a8-we61irnsw1rtyqcbmlax.ce7d19ddoa-/oz8xcldft.ge9pbgxw-_p2hpy2k5bv3w1fxa7m8r4p9x2w6ep555-5hp6ke_iq_o7t.7hy41-0xf9rgjl0gtkyhmpbpzplbue_cc/xh5x_al-s6_zstb.7q3hjs6yo2_vd6cgl7c-d7sx1fink93rdakl6g.wne7x3sm88xtn0fthkj0x/n6p-q1nc93vamm4i_m10.ymt7qe.wltib886zn.5u4yyql75.lb95d1wombtrcitja2ptgcumad0q1pbni4hiqza81vpdqp2gnfo/ete01uk.hsjz2ek7f0dz9pj304h8g-1tnn4k56p_ms5viyrt_q5i/b-6bv1vogztii913wtc75mjcrqd4_ymj8bwcznsi_3yl9f09.g/zfqecufflukhsndm.vc4sdl5aiy7bm/1cmhfo04l5kkydv7s/ukulwp_58fegzw0e1ir-f_k590/rfpih_yfzg3yamsy1rww5_2wiemb-b8l58kn3kz60ii9psq9jimc-oys1v5g4x7-0jvywt_a-oxwa1l9wks0pp.skt2cno3g20y/5eqtgzs77ifr37g9zpbfh.2zeo.4dugv0vj_m.62_bbsjbfu52h71t59_nvsklvpf91ea-1yj-iwjs-29/e9unpef7hv0jk-rpjrhk5r--49ik5smjmy8rdfom-o17rzqlbrf_6zqfs9d5p8t4jra8vsfq-11v2llci",
  
  version: "9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI",
  
  jobId: "job_id_example",
};

const data = await apiInstance.stopJob(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **solverKey** | [**string**] |  | defaults to undefined
 **version** | [**string**] |  | defaults to undefined
 **jobId** | [**string**] |  | defaults to undefined


### Return type

**JobStatus**

### Authorization

[HTTPBasic](README.md#HTTPBasic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**402** | Payment required |  -  |
**404** | Job/wallet/pricing details not found |  -  |
**429** | Too many requests |  -  |
**500** | Internal server error |  -  |
**502** | Unexpected error when communicating with backend service |  -  |
**503** | Service unavailable |  -  |
**504** | Request to a backend service timed out. |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


