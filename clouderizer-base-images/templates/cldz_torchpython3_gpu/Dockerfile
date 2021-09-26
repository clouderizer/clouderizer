
FROM openfaas/of-watchdog:0.7.2 as watchdog
FROM continuumio/miniconda3
# FROM nvidia/cuda:10.1-cudnn7-devel-ubuntu18.04
# FROM nvidia/cuda:11.0-cudnn8-devel-ubuntu18.04
#FROM nvidia/cuda:11.0-cudnn8-runtime-ubuntu18.04

RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates curl git unzip && \
    apt-get install -y manpages-dev && \
    apt update && \
    apt install -y build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    # wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    # /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    # rm ~/miniconda.sh && \
    # /opt/conda/bin/conda clean -tipsy && \
    # ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc

ENV PATH=/opt/conda/bin:$PATH LD_LIBRARY_PATH=/usr/local/cuda-11.0/lib64:/usr/local/cuda-11.0/extras/CUPTI/lib64:/usr/local/cuda-11.0/targets/x86_64-linux/lib:/usr/local/nvidia/lib64:$LD_LIBRARY_PATH
# ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/targets/x86_64-linux/lib
# RUN ln -s /usr/local/cuda-10.1/targets/x86_64-linux/lib/libcusolver.so.11 /usr/local/cuda-10.1/targets/x86_64-linux/lib/libcusolver.so.10

USER root

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog

RUN chmod +x /usr/bin/fwatchdog && \
    mkdir -p /usr/share/man/man1 /usr/share/man/man2 && \
    groupadd app && useradd -r -g app app

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
    # conda config --satisfied-skip-solve && \
    # conda env update && \
    # conda install -c conda-forge --name base --file=python-service/requirements.txt || pip install -r python-service/requirements.txt
    #conda env update --name base --file python-service/req.yml && \
    pip install http://download.pytorch.org/whl/cu110/torch-1.7.1%2Bcu110-cp38-cp38-linux_x86_64.whl && \
    pip install http://download.pytorch.org/whl/cu110/torchvision-0.8.2%2Bcu110-cp38-cp38-linux_x86_64.whl && \
    pip install fastai==1.0.61 && \
    # conda install -c conda-forge -c fastai -c pytorch --name base pytorch torchvision fastai==1.0.61 cudatoolkit=11.0 && \
    pip install -r python-service/requirements.txt


USER app
RUN mkdir -p function && \
    touch ./function/__init__.py
       
ENV PATH=$PATH:/home/app/.local/bin:/home/app/python/bin/
ENV PYTHONPATH=$PYTHONPATH:/home/app/python:/home/app/function
#RUN echo "conda activate base" >> ~/.bashrc
#RUN pip install -r python-service/requirements.txt --target=/home/app/python