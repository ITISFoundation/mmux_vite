ARG MMUX_PYTHON_BRANCH="work/jgo/flask_mmux_nih"

FROM python:3.11-alpine

# Install git and curl
RUN apk update && apk add --no-cache git curl

WORKDIR /app

COPY flask_workflows.py /app/flask_workflows.py

# RUN apt install python3.11-venv
RUN git clone https://github.com/ITISFoundation/mmux_python
RUN cd ./mmux_python && git checkout $(MMUX_PYTHON_BRANCH)
RUN python3.11 -m venv .venv && \
  .venv/bin/python -m pip install flask python-dotenv && \
  .venv/bin/python -m pip install -r ./mmux_python/requirements.txt

## OSPARC API client generator
RUN uv venv .uv_env && \
  .uv_env/bin/python -m pip install openapi-generator-cli
RUN curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
RUN .uv_env/bin/openapi-generator-cli generate -i openapi.json -g python -o ./osparc-api-python-client --package-name osparc_client && \
  .venv/bin/python -m pip install ./osparc-api-python-client

CMD [".venv/bin/flask", "run", "--no-debugger"]