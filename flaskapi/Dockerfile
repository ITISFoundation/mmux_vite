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

RUN git clone https://github.com/ITISFoundation/mmux_python
RUN echo $(ls -l)
WORKDIR /app/mmux_python
RUN echo $(ls -l)
RUN git checkout work/jgo/flask_mmux_nih

WORKDIR /app
RUN python3.11 -m venv .venv
RUN .venv/bin/python -m pip install --upgrade pip &&\
  .venv/bin/python -m pip install itis-dakota && \
  .venv/bin/python -m pip install flask python-dotenv && \
  .venv/bin/python -m pip install -r ./mmux_python/requirements.txt

RUN cd /app

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

# Add healthcheck to verify API is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/flask/hello || exit 1

CMD [".venv/bin/flask", "run", "--host=0.0.0.0", "--port=5000", "--no-debugger" ]