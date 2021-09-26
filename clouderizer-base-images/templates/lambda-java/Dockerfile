FROM openfaas/of-watchdog:0.7.2 as watchdog
# FROM python:3.8-slim-buster
FROM continuumio/miniconda3

USER root

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

ENV DEBIAN_FRONTEND=noninteractive
RUN mkdir -p /usr/share/man/man1 /usr/share/man/man2
RUN apt-get update \
    && apt-get install -y curl openjdk-11-jre ca-certificates \
    && rm -rf /var/lib/apt/lists/
    # && apt-get install -y python2.7

RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    autoconf \
    automake \
    libtool \
    libcurl4-openssl-dev

# RUN apt-get update \
  # && apt-get install -y python3-pip python3.8 python2.7 \
#   && cd /usr/local/bin \
    # && ln -s /usr/bin/python2.7 /usr/bin/python \
#   && ln -s /usr/bin/python3 python \
  # && pip3 --no-cache-dir install --upgrade pip \
  # && rm -rf /var/lib/apt/lists/*

# Add non root user
RUN groupadd app && useradd -r -g app app

WORKDIR /home/app/

RUN chown -R app /home/app

USER app

# install and setup node
ENV NVM_DIR=/home/app/.nvm
ENV NODE_VERSION=12.6.0
RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash  
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}   
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}  
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}    
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

USER root

WORKDIR /home/app/

COPY java-service /home/app/java-service
COPY python-service /home/app/python-service
COPY node-service /home/app/node-service
COPY app.js /home/app/
# COPY function /home/app/function

WORKDIR /home/app/node-service/
ARG FUNCTION_DIR="/home/app/node-service/"
RUN chown -R app /home/app && \
    mkdir -p /home/app/python 
RUN npm i

USER app
WORKDIR /home/app/

RUN npm install aws-lambda-ric
RUN npm install @vendia/serverless-express

USER root
RUN chown -R app /home/app && \
    mkdir -p /home/app/python && chown -R app /home/app
    
USER app
ENV PATH=$PATH:/home/app/.local/bin:/home/app/python/bin/
ENV PYTHONPATH=$PYTHONPATH:/home/app/python:/home/app/function

RUN pip install -r python-service/requirements.txt --target=/home/app/python

ENTRYPOINT ["/home/app/.nvm/versions/node/v12.6.0/bin/npx", "aws-lambda-ric"]
CMD ["app.handler"]