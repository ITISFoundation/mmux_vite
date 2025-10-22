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
ARG MMUX_PYTHON_TAG="v1.5.7-hotfix-uq-seed"
RUN git clone --single-branch \
--branch ${MMUX_PYTHON_TAG} \
https://github.com/ITISFoundation/mmux_python /mmux_python \
&& cp -R /mmux_python /app/mmux_python

COPY . .
  
# Install Python packages (for MMUX_Python and the Flask API -- externalize so also available for testing environment)
RUN ./install-deps.sh
  
ENTRYPOINT ["./entrypoint.sh"]
