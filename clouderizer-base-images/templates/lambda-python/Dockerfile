
FROM openfaas/of-watchdog:0.7.2 as watchdog
FROM continuumio/miniconda3
# FROM ubuntu:20.04
# FROM node:12-buster as build-image
USER root

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

ENV DEBIAN_FRONTEND=noninteractive
RUN mkdir -p /usr/share/man/man1 /usr/share/man/man2
RUN apt-get update \
    && apt-get install -y curl ca-certificates unzip software-properties-common \
    && rm -rf /var/lib/apt/lists/

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

# RUN add-apt-repository ppa:deadsnakes/ppa && apt-get update && apt-get install -y python3.8 python3-pip
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
ENV NODE_VERSION=12.6.0
ENV NVM_DIR=/home/app/.nvm
RUN mkdir -p $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash  
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}   
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}  
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}    
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

USER root

WORKDIR /home/app/

COPY python-service python-service
COPY node-service node-service
# COPY cldz-lambda /home/app/
#COPY init.sh init.sh
COPY function function
COPY app.js /home/app

WORKDIR /home/app/node-service/
ARG FUNCTION_DIR="/home/app/node-service/"
RUN chown -R app /home/app && \
    mkdir -p /home/app/python 
USER app
RUN npm i

WORKDIR /home/app/
RUN npm install aws-lambda-ric
RUN npm install @vendia/serverless-express
# RUN chown -R app /home/app && \
#     mkdir -p /home/app/python 
    #&& chown -R app /home/app
# FROM continuumio/miniconda3
USER root
RUN conda env update --name base --file python-service/req.yml
# RUN pip install onnxruntime numpy pandas jupyterlab papermill nltk

ENV PATH=$PATH:/home/app/.local/bin:/home/app/python/bin/
ENV PYTHONPATH=$PYTHONPATH:/home/app/python:/home/app/function

# USER root

# WORKDIR /home/app/

# COPY python-service python-service
# COPY node-service node-service
# COPY cldz-lambda /home/app/
# COPY init.sh init.sh

# FROM node:12-buster-slim
# RUN nohup node /home/app/node-service/app.js &> node.log &

WORKDIR /home/app
# ENTRYPOINT ["node", "/home/app/node-service/app.js"]
ENTRYPOINT ["/home/app/.nvm/versions/node/v12.6.0/bin/npx", "aws-lambda-ric"]
CMD ["app.handler"]
# CMD ["bash", "/home/app/init.sh"]
#RUN echo "conda activate base" >> ~/.bashrc
#RUN pip install -r python-service/requirements.txt --target=/home/app/python
