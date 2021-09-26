FROM ubuntu:18.04

WORKDIR /automl
COPY . /automl

ADD jdk-8u231-linux-x64.tar.gz /opt
RUN apt-get update -y
RUN apt-get install -y --no-install-recommends curl wget tar git python zip unzip build-essential software-properties-common

# Java
#RUN add-apt-repository ppa:webupd8team/java -y
RUN apt-get update -y


RUN \
  ls /opt \
  #&& tar -zxvf /opt/jdk-8u231-linux-x64.tar.gz -C /opt \
  #&& rm /opt/jdk-8u231-linux-x64.tar.gz \
  && ln -s /opt/jdk1.8.0_231 /opt/jdk
  ENV PATH $PATH:/opt/jdk/bin
  ENV JAVA_HOME /opt/jdk
  ENV DRIVERLESS_AI_LICENSE_FILE /automl/license.sig
  #ENV _JAVA_OPTIONS -D java.net.preferIPv4Stack=true

ENV USER=root

