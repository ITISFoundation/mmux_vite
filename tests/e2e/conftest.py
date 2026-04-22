"""Pytest configuration for local e2e tests."""

import pytest


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--app-url",
        default="http://localhost:8888",
        help="Base URL for the running mmux-vite app",
    )


@pytest.fixture
def app_url(request: pytest.FixtureRequest) -> str:
    return request.config.getoption("--app-url")
