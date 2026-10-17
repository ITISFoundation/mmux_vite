"""Central logging configuration for the MMUX Flask backend.

Single init point (flaskapi/SPEC.md §C "log via utils/logger.py") — call
`configure_logging()` once from `main.py`. The module itself has NO import-time
side effects: the previous module-level `basicConfig` + package-dir file handler
was dead code (nothing imported it) and, if imported, created
`utils/logs/flask_*.log` inside the package/image directory at construction
time — a read-only-filesystem startup hazard (B59tl).

Container contract (upstream #112 — terminal logs are what the platform log
collector, e.g. graylog, ingests):
  - app logs terminate in ONE stdout StreamHandler (plain text, timestamped);
  - level comes from `LOG_LEVEL` env (default DEBUG locally; `entrypoint.sh`
    defaults INFO inside containers);
  - a file handler exists ONLY when `LOG_FILE` is set, at an
    operator-chosen path (e.g. a mounted dir) — never the package dir;
  - `force=True` replaces a pre-existing root configuration, so the settings
    stay effective under gunicorn, whose root console handler would otherwise
    make a plain `basicConfig()` a no-op (B59tl). gunicorn's own
    `gunicorn.error`/`gunicorn.access` loggers keep their own handlers.
"""

import logging
import os
import sys

# Same format as before the B59tl fix (pinned by test_utils_logger.py).
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def configure_logging() -> logging.Logger:
    """(Re)configure the root logger from the environment and return the app logger.

    Idempotent: `force=True` replaces previous handlers instead of stacking
    duplicates on repeated calls.
    """
    # Normalize once: gunicorn accepts lowercase --log-level, but Python's logging accepts ONLY the
    # exact uppercase names — LOG_LEVEL=debug booted gunicorn yet crashed the app at import
    # (ValueError in basicConfig). upper() keeps both consumers on one env value.
    level = os.environ.get("LOG_LEVEL", "DEBUG").upper()

    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    log_file = os.environ.get("LOG_FILE")
    if log_file:
        # Opt-in, operator-chosen path. No mkdir: the path must be a real,
        # writable location (a mounted dir); a bad path fails loudly at boot.
        handlers.append(logging.FileHandler(log_file))

    # Handlers default to NOTSET: a child logger with an EXPLICIT level (e.g. INFO under a
    # root at ERROR) propagates its records and the handler lets anything through — LOG_LEVEL
    # would only gate the root logger, not the sinks. Pin every handler's threshold (Copilot #738).
    for handler in handlers:
        handler.setLevel(level)

    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        handlers=handlers,
        force=True,
    )

    # Make Flask propagate its logs to the root logger
    logging.getLogger("flask").propagate = True

    # Same for Werkzeug (Flask's underlying WSGI library)
    logging.getLogger("werkzeug").propagate = True

    return logging.getLogger("mmux_flaskapi")
