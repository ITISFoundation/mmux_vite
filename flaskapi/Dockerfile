FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

RUN apt update && apt install -y \
  curl \
  git

EXPOSE 5000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD curl -f http://localhost:5000/flask/health || exit 1

WORKDIR /app

COPY osparc-0.8.3.post0.dev31-py3-none-any.whl /app/
COPY osparc_client-0.8.3.post0.dev31-py3-none-any.whl /app/


# clone mmux_python
ARG MMUX_PYTHON_BRANCH="main"
RUN git clone --single-branch \
  --branch ${MMUX_PYTHON_BRANCH} \
  https://github.com/ITISFoundation/mmux_python /mmux_python \
  && cd /mmux_python && git checkout 0f8aa72a2c78bced1e5e7a3131bedc371d8cda8c \
  && cp -R /mmux_python /app/mmux_python

# Install Python packages directly with system Python
RUN uv pip install --system -r ./mmux_python/requirements.txt \
  #&& uv pip install --system --prerelease=allow osparc==0.8.3.post0.dev30 \
  && uv pip install --system --prerelease=allow ./osparc_client-0.8.3.post0.dev31-py3-none-any.whl \
  && uv pip install --system --prerelease=allow ./osparc-0.8.3.post0.dev31-py3-none-any.whl \
  && uv pip install --system \
  # depnendcies usd by production wsgi server
  gunicorn==23.0.0 \
  gevent==25.5.1

COPY . .

ENTRYPOINT ["./entrypoint.sh"]
