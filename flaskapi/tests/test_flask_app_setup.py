import pytest
from mmux_flaskapi.app import create_flask_app
from mmux_flaskapi.webserver_config import OsparcConfig
from mmux_flaskapi.helpers import is_test_environment


@pytest.fixture
def app():
    """Fixture to initialize the Flask app in test mode."""
    app = create_flask_app()
    app.config['TESTING'] = True
    return app


@pytest.fixture
def mock_config(monkeypatch):
    """Fixture to mock configuration values."""
    monkeypatch.setenv('CONFIG_TYPE', 'config.TestingConfig')
    return OsparcConfig()


def test_app_initialization(app):
    """Test that the Flask app initializes correctly."""
    assert app is not None
    assert app.config['TESTING'] is True
    assert 'flask/health' in [rule.rule for rule in app.url_map.iter_rules()]


def test_is_test_environment(app):
    """Test the is_test_environment function."""
    assert is_test_environment() is True


def test_configuration_loading(mock_config):
    """Test that configuration values are loaded properly."""
    assert mock_config is not None
    assert mock_config.SOME_DEFAULT_VALUE == 'expected_default'
    assert mock_config.SOME_ENV_VARIABLE == 'expected_override'


def test_missing_configuration(mock_config, monkeypatch):
    """Test behavior when required config values are missing."""
    monkeypatch.delenv('SOME_REQUIRED_ENV_VAR', raising=False)
    with pytest.raises(KeyError):
        _ = mock_config.SOME_REQUIRED_ENV_VAR