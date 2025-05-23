# coding: utf-8

"""
    osparc.io public API

    osparc-simcore public API specifications

    The version of the OpenAPI document: 0.8.0.post0.dev0
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


import unittest

from osparc_client.api.function_jobs_api import FunctionJobsApi


class TestFunctionJobsApi(unittest.TestCase):
    """FunctionJobsApi unit test stubs"""

    def setUp(self) -> None:
        self.api = FunctionJobsApi()

    def tearDown(self) -> None:
        pass

    def test_delete_function_job(self) -> None:
        """Test case for delete_function_job

        Delete Function Job
        """
        pass

    def test_function_job_outputs(self) -> None:
        """Test case for function_job_outputs

        Function Job Outputs
        """
        pass

    def test_function_job_status(self) -> None:
        """Test case for function_job_status

        Function Job Status
        """
        pass

    def test_get_function_job(self) -> None:
        """Test case for get_function_job

        Get Function Job
        """
        pass

    def test_list_function_jobs(self) -> None:
        """Test case for list_function_jobs

        List Function Jobs
        """
        pass

    def test_register_function_job(self) -> None:
        """Test case for register_function_job

        Register Function Job
        """
        pass


if __name__ == '__main__':
    unittest.main()
