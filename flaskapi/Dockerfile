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

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/flask/health || exit 1

WORKDIR /app

# clone mmux_python
ARG MMUX_PYTHON_BRANCH="work/jgo/flask_mmux_nih"
RUN git clone --single-branch \
  --branch ${MMUX_PYTHON_BRANCH} \
  https://github.com/ITISFoundation/mmux_python

# Install Python packages directly with system Python
RUN python3.11 -m pip install --upgrade pip \
  && sed 's/ota==1.5.9/itis-dakota==1.5.9/g' ./mmux_python/requirements.txt > ./modified_requirements.txt \
  && python3.11 -m pip install -r ./modified_requirements.txt \
  && python3.11 -m pip install osparc==0.8.3.post0.dev26

COPY . .
# TODO: add entrypoint script to use debug mode or something else
CMD ["python3.11", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000", "--debug", "--debugger", "--no-reload"]