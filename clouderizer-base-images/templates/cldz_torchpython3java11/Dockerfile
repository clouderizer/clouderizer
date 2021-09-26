FROM openfaas/of-watchdog:0.7.2 as watchdog
FROM python:3.8-slim-buster

USER root

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog && \
    mkdir -p /usr/share/man/man1 /usr/share/man/man2 && \
    groupadd app && useradd -r -g app app && \
    apt-get update && \
    apt-get install -y curl openjdk-11-jre ca-certificates && \
    apt-get install -y manpages-dev && \
    apt update && \
    apt install -y build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/

WORKDIR /home/app/

RUN chown -R app /home/app

USER app

# install and setup node
ENV NODE_VERSION=12.6.0 NVM_DIR=/home/app/.nvm
RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash  && \
    . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} && \
    . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION} && \ 
    . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION} 
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

USER root

# WORKDIR /home/app/

COPY java-service /home/app/java-service
COPY python-service /home/app/python-service
COPY node-service /home/app/node-service


WORKDIR /home/app/node-service/

RUN npm i

WORKDIR /home/app/

RUN chown -R app /home/app && \
    mkdir -p /home/app/python && \
    pip install http://download.pytorch.org/whl/cpu/torch-1.7.1%2Bcpu-cp38-cp38-linux_x86_64.whl && \
    pip install http://download.pytorch.org/whl/cpu/torchvision-0.8.2%2Bcpu-cp38-cp38-linux_x86_64.whl && \
    pip install fastai==1.0.61 && \
    pip install -r python-service/requirements.txt --target=/home/app/python

USER app
ENV PATH=$PATH:/home/app/.local/bin:/home/app/python/bin/
ENV PYTHONPATH=$PYTHONPATH:/home/app/python:/home/app/function

#RUN pip install -r python-service/requirements.txt --target=/home/app/python