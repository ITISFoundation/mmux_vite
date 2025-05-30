FROM ubuntu:22.04

# Install git and curl
RUN apt update && apt install -y \
  git \
  curl \
  make \
  python3.11 \
  python3.11-venv \
  pip \
  default-jre

WORKDIR /app

COPY flask_workflows.py ./flask_workflows.py
COPY . .

# TODO: why is this not pinned from master?
# checkout mmux_python
ARG MMUX_PYTHON_BRANCH="work/jgo/flask_mmux_nih"
RUN git clone --single-branch \
  --branch ${MMUX_PYTHON_BRANCH} \
  https://github.com/ITISFoundation/mmux_python

# Install Python packages directly with system Python
RUN python3.11 -m pip install --upgrade pip &&\
  python3.11 -m pip install itis-dakota && \
  python3.11 -m pip install flask python-dotenv && \
  python3.11 -m pip install -r ./mmux_python/requirements.txt

## OSPARC API client generator
# Install openapi-generator-cli directly with system Python
RUN python3.11 -m pip install openapi-generator-cli
RUN curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
RUN openapi-generator-cli generate -i openapi.json -g python -o ./osparc-api-python-client --package-name osparc_client && \
  python3.11 -m pip install ./osparc-api-python-client

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/flask/health || exit 1

# TODO: pin requirements
# TODO: add entrypoint script to use debug mode or something else
CMD ["python3.11", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000", "--debug", "--debugger", "--no-reload"]