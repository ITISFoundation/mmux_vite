# coding: utf-8

"""
    osparc.io public API

    osparc-simcore public API specifications

    The version of the OpenAPI document: 0.8.0.post0.dev0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from osparc_client.models.meta import Meta

class TestMeta(unittest.TestCase):
    """Meta unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> Meta:
        """Test Meta
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `Meta`
        """
        model = Meta()
        if include_optional:
            return Meta(
                name = '',
                version = '9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI',
                released = {
                    'key' : '9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI'
                    },
                docs_url = '0',
                docs_dev_url = '0'
            )
        else:
            return Meta(
                name = '',
                version = '9072888001528021798096225500850762068629339333975650685139102691291.0.0+RjsmInY9s-EmMH6kw8gsnXv2Z7jRPK542XGp8ZohR8p.ziKqEde8fXg9wdpfxa2-zRi2iAxU4NCUavTrirUe4ba7JnjrgEdBCJE-ArE6U3CZ-Vnrj9RmauFxv71lRsCjOv6MeuvKG.DRGKUIQ8yNXhXoEdbZpGptfI4pvLXGuLk-kwwO2jcMEEkIa.W5ApNaDi5ackLaR2kw9-zmvqRnM-dar09VaHCQz0TlT4b42Jml4PJXMbVMO8G0e5q9Z4WMWovY63Gk6ixTd5NxR.25mQYd6VBLRGkQ5H9-FH2v5iUaMQ6iIJ-7auxDSR-lIIfhhw9bP3XhsKpT6YkX2ymMVY.YsFBx8OyxaBZ75cAidDZ6lvrLQxekRdyiJFjhCbEZunVXTqV3VP-DPQpzY-c9WhD1h649MeAEDz67NG9dihNlL1.PO1GvRUDnbsR0-SswaNzc7s9ONPZw-HNPtVfykpnotMPK4.qhv7VjToBNn1oLFWRpSx-dyd2clYhZAGiUmDTPB5iVX1lhmY7Gh2I3pT2S.uv6.tyxEBpX6RQusWUzrY2Ial.FJfz8Zwx6YGCNhQCndVdQ8Zqh8o9Fu3-luW1PzrlptgIbB7lMjnQXJdim087U4e00bXYP.263P2Qk0LGzQ-Q5b8qpf900OPrJ7NsXeu0SeHiC.or8kJwu9CQe1tTxWk3GoxqObZMXxUrU.PuO24.6xCEEGYs5NZ9BhURG1p1vKPKEsa.a3pD3hXM15Q-LQUOofFYT6wb4OCgvTgDaAqbKuYurrDjTDCxu.ecKtov6lMCwqpGvF10AyNzlABWKNXeFooO85mDfPdkPvuMP4UItRxglXsbfmNlQ5dxg25oBYSAJH9pP2AsvJ1ScQkpdOFo.b48VqkgYNMd7LrDcYKGedFO0HBfI81yv9G-D76SNMcY0UPPPdI22mRwN8gXBGGp92k53.1KEc7ag0ak9ETa6LnPl34V.5Jc4YC3r.ILhaa6Jcc4hzAqllACM9319wGio4p44OFkGlPpgNlbtJZS0AaW9X3CHj-n2hyQAB8SPpfju.1nTBPTJPb-Hj0L.cV6H860Rpwn8zGLfibFlAiPGyvhU8Ye52iQcNh1XhyIjU5N0a56m2ONPCsy2yJE2MQH9Vtj3dWmBLqET.auRy5wUhGt7xNZoWfe9JGrar3ZeHRc4dSsd0RIlQ1YUo31fGOwi1Xfgv.he4JPG5EYj9qSsH3icZps5aXdx--TYsRRGn8p-Q2t9ufMVk0G3LCRAkC2MHGjLeFDChVzm1sl-Bu5nHUPV3JcSLLtzHgWd203hy.cgItmozD9jSoTmmDlQzmeuMjs4cmyHkc7OcK.a5ZkmXKIhuWWL1PB8JQFInAlUihvIRKWmd74vVNVouUUq7lr13izMpQeXTwCX7eZR4diuBp12rqic.-pO1cprK6eZP-b1SuInOS2bPzpLsEcDg9JOefS2IKCBgZkZN1VM5iisCMqqvZJfQbTm0l8TqUvVVYQzBM3pTF3YFunJjn79r.X76dFbUfrQdC.CsMXdVXhXKWhK7aKxfLZMGV1t5ZLSwBhCBeSp3g1WqnxFKTMlmqL5kYD0D-.lZnDQWB6CfFrfdWw.lB5yxG2ZsNwUTxPepPDck0MHjx1bWWkthueuyZwIYJFC-DP.pDz0q9BcSZ9lSO3Fm1Aw-wm4asDrqk8Aqw1gHodBjUGpKTy8xuN4TvW3wydnv61CL6-Ma55v-.ci4bPbKvnn4ON1zDx0RE5Nx-CnGmqNNhQQuMJYkjplO3Qdqu9Y32Xmk.ws1aTVFSrXW-Cc3Zlfh6YwbO-wd61ok6dkgj3fNOb.daoZA1F02Pi3WxdBRfK7kZq-foRRQUAGEMz-biz--psyEvzi6C8Y89wwxrOADQYuRsYgAFe.Oz26sXflDj3ZKPbb.5LwwjHM1Zfj0bJ3cHAnEwK3LXdBrD99XSqFR6aV9uyoVGq.EJe-wvWZmWi.Ihctr-seZcIsU78A-6.6uPNyWu.as5q7-lfce9-8Do101kYW1tCLjm3EPHhKxm.hBJAlXkoQZqOkDB7wcPWkqotc6fQJs52.QKpgtkhgJP2pCWDIqetgTZsY7xlN3E7zxLDrXBGblu1s7At6U2M5I0H33HhkJRPicrz91Mnqr4yUQy3nOCQv4yqY.M8d7UUXqQdz8ORLX7PhYoA5ITVLr1rCs1.daEl0tG5if.npOOAVHva9i7wKGIOmsYkpwPB08qBqbgiKD8h-jhgoAD6oEaEIg9hqdBk87piJu2fHTHWNw1WGbDvKMClEM0pWG7gx2yb.AuT6q1dUrLCN6NPK0brTSwMFavOBDfYh6SWUkJ7XO32vfW9YRga.03cIqVgnG7dDviEQYeYsVp6bNv9XqJoDDSwcwkJvnEdiYdDcVLlRMsgGfQl-tGvdMnDqnxRe7EAipxSvUxD6lhGX0wQGc87.OhmM3dQkRuht7pIqysrRPSNqVg2qV7yPxS6zN1jFxe9RVYcK-J.hbgms67HfNYbVp9oaT6x-W9PX5eTeltcxj.VBajOnyD0pkOF1WFBnF.mcWC6Ggb7ozlleM8QgTjBaA9mfSMCxZLogapWzy373M4zkkTNr-J5dkUMXZbHzFcOhyLEEaimeL.3YKjuAetlS3KzQ3re5yyNydVmSrcU07T2IefMatN.9EwBjoSdfp0qUZT9ZEikdceGh-PrN5eZiRnbnxhaAGJdNWy8YuT1nhbdHhnszeIEGYoiOAz3w8t8JeOqP.8wcdt3n9Q18SKzea-IlLBLRzcEhoqVuUCEMQ93-aK7kTUKwGpNFs6oxf4rK2c2cqKr6NdT0mVcCzXpEYgd4j2pfz2OhgwjH.7.TeTNn-kC1tWGTwvSe04Vuj8uQ5FMrHjWbBFGHMprQcHDQ9X.R45mJyb0kvP09gLqmLT2ZBctrFe4rKz49D.bgU2rmVhxKQwKj2CvvcelO-a4qXa3zFRMnF0L.Tb2XXgfhZnLhogeg-lX38MmIJ9H8.woZJXltyMySvaJ2YVjDcbdQ3VQQRHJW1zsoJEJN7qLewjxfK3R3vVJYDnMtqbnX0dYax2JyQF6TkCgEBc.KhM4sm4rjZsdx7lu4l53pRPPb8XS149u1VRYFMhW1wn.rzgV53Dpcj0YE965xb8tPZiBI',
                docs_url = '0',
                docs_dev_url = '0',
        )
        """

    def testMeta(self):
        """Test Meta"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
