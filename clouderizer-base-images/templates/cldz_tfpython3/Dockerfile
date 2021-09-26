
FROM openfaas/of-watchdog:0.7.2 as watchdog
FROM continuumio/miniconda3

USER root

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog

RUN chmod +x /usr/bin/fwatchdog && \
    mkdir -p /usr/share/man/man1 /usr/share/man/man2 && \
    groupadd app && useradd -r -g app app && \
    apt-get update \
    && apt-get install -y curl ca-certificates unzip \
    && rm -rf /var/lib/apt/lists/

WORKDIR /home/app/

RUN chown -R app /home/app

USER app
ENV NODE_VERSION=12.6.0 NVM_DIR=/home/app/.nvm
RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash  && \
    . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} && \
    . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION} && \ 
    . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION} 
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

USER root

WORKDIR /home/app/
COPY python-service python-service
COPY node-service node-service

WORKDIR /home/app/node-service/

RUN npm i

WORKDIR /home/app/

RUN chown -R app /home/app && \
    mkdir -p /home/app/python && \

    #&& chown -R app /home/app
    conda env update --name base --file python-service/req.yml && \
    pip install -r python-service/requirements.txt


USER app
RUN mkdir -p function && \
    touch ./function/__init__.py
       
ENV PATH=$PATH:/home/app/.local/bin:/home/app/python/bin/
ENV PYTHONPATH=$PYTHONPATH:/home/app/python:/home/app/function
#RUN echo "conda activate base" >> ~/.bashrc
#RUN pip install -r python-service/requirements.txt --target=/home/app/python