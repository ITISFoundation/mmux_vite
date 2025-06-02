FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

RUN apt update && apt install -y \
  curl \  
  git 

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/flask/health || exit 1

WORKDIR /app

# clone mmux_python
ARG MMUX_PYTHON_BRANCH="work/jgo/flask_mmux_nih"
RUN git clone --single-branch \
  --branch ${MMUX_PYTHON_BRANCH} \
  https://github.com/ITISFoundation/mmux_python /mmux_python 

# Install Python packages directly with system Python
RUN uv pip install --system -r /mmux_python/requirements.txt \
  && uv pip install --system --prerelease=allow osparc==0.8.3.post0.dev26 \
  && uv pip install --system \
  gunicorn==23.0.0 \
  gevent
# TODO: add python dependecy mnagement with fetch form other repo before update in makefile
# TODO: pin gevent

COPY . .

ENTRYPOINT ["./entrypoint.sh"]