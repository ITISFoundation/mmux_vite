ARG MMUX_PYTHON_BRANCH="work/jgo/flask_mmux_nih"

FROM ubuntu:22.04

# Install git and curl
RUN apt update && apt install -y \
  git \
  curl \
  python3.11 \
  python3.11-venv \
  pip \
  default-jre

WORKDIR /app

COPY flask_workflows.py /app/flask_workflows.py

RUN git clone https://github.com/ITISFoundation/mmux_python &&\
  cd ./mmux_python && git checkout $(MMUX_PYTHON_BRANCH)
RUN python3.11 -m venv .venv &&\
  .venv/bin/python -m pip install --upgrade pip &&\
  .venv/bin/python -m pip install itis-dakota && \
  .venv/bin/python -m pip install flask python-dotenv && \
  .venv/bin/python -m pip install -r ./mmux_python/requirements.txt

## OSPARC API client generator; uses UV (I dont know why it doesnt work with the .venv python)
RUN echo 1
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
RUN . /root/.local/bin/env && uv venv .uv_env --python 3.11
## . = source in Ubuntu
RUN .uv_env/bin/python -m ensurepip && .uv_env/bin/python -m pip install openapi-generator-cli
RUN curl https://api.osparc-master.speag.com/api/v0/openapi.json -o openapi.json
RUN .uv_env/bin/openapi-generator-cli generate -i openapi.json -g python -o ./osparc-api-python-client --package-name osparc_client && \
  .venv/bin/python -m pip install ./osparc-api-python-client

EXPOSE 5000
CMD [".venv/bin/flask", "run", "--no-debugger"]