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

# clone mmux_python
ARG MMUX_PYTHON_BRANCH="main"
RUN git clone --single-branch \
  --branch ${MMUX_PYTHON_BRANCH} \
  https://github.com/ITISFoundation/mmux_python /mmux_python \
  && cp -R /mmux_python /app/mmux_python

# Install Python packages (for MMUX_Python and the Flask API)
RUN install-deps.sh

COPY . .

ENTRYPOINT ["./entrypoint.sh"]