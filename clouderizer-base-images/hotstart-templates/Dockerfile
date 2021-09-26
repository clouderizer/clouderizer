ARG TAG
FROM clouderizer/cldz_baseimage:$TAG

USER root
RUN apt-get update -y && apt-get install -y bash curl jq

COPY index.html /home/app/node-service/index.html
RUN sed -i -e 's/##server_url##/https:\/\/opensource.clouderizer.com/g' /home/app/node-service/index.html

WORKDIR /home/app/function/
RUN mkdir -p asset
COPY ./entry.sh /home/app/entry.sh

WORKDIR /home/app/

USER root

RUN chown -R app:app ./  \
	&& chmod -R 777 /home/app/python  \
	&& chmod -R 777 /home/app/entry.sh

USER app

ENV cgi_headers="true" fprocess="node /home/app/node-service/app.js" mode="http" upstream_url="http://127.0.0.1:9090"

HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

CMD /home/app/entry.sh && fwatchdog