# coding: utf-8

"""
    osparc.io public API

    osparc-simcore public API specifications

    The version of the OpenAPI document: 0.8.0.post0.dev0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from osparc_client.models.file_upload_completion_body import FileUploadCompletionBody

class TestFileUploadCompletionBody(unittest.TestCase):
    """FileUploadCompletionBody unit test stubs"""

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def make_instance(self, include_optional) -> FileUploadCompletionBody:
        """Test FileUploadCompletionBody
            include_optional is a boolean, when False only required
            params are included, when True both required and
            optional params are included """
        # uncomment below to create an instance of `FileUploadCompletionBody`
        """
        model = FileUploadCompletionBody()
        if include_optional:
            return FileUploadCompletionBody(
                parts = [
                    osparc_client.models.uploaded_part.UploadedPart(
                        number = 0, 
                        e_tag = '', )
                    ]
            )
        else:
            return FileUploadCompletionBody(
                parts = [
                    osparc_client.models.uploaded_part.UploadedPart(
                        number = 0, 
                        e_tag = '', )
                    ],
        )
        """

    def testFileUploadCompletionBody(self):
        """Test FileUploadCompletionBody"""
        # inst_req_only = self.make_instance(include_optional=False)
        # inst_req_and_optional = self.make_instance(include_optional=True)

if __name__ == '__main__':
    unittest.main()
