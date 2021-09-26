FROM openfaas/classic-watchdog:0.18.18 as watchdog

FROM alpine:3.12

RUN apk add py3-pip
RUN apk add --no-cache bash curl tar jq git git-lfs
RUN apk add --no-cache --update coreutils
RUN mkdir -p /home/app

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

RUN curl -sSL https://showcase.clouderizer.com/givemefaascli | sh

# Add non root user
RUN addgroup -S app && adduser app -S -G app
RUN chown app /home/app

WORKDIR /home/app

USER app

ADD run.sh /tmp/run.sh
ADD deploy.sh /tmp/deploy.sh
ADD deleteimage.sh /tmp/deleteimage.sh
ADD publish.sh /tmp/publish.sh
ADD getstatus.sh /tmp/getstatus.sh
ADD prometheus.sh /tmp/prometheus.sh
ADD prometheus_multer.sh /tmp/prometheus_multer.sh
ADD parsenotebook.sh /tmp/parsenotebook.sh
ADD stop.sh /tmp/stop.sh
ADD .gitlab-ci.yml /tmp/.gitlab-ci.yml
ADD .gitignore /tmp/.gitignore
ADD index.html /tmp/index.html
ADD stack.yml /tmp/stack.yml
ADD stack_hr.yml /tmp/stack_hr.yml
ADD env.yaml /tmp/env.yaml
ADD env_hr.yaml /tmp/env_hr.yaml
ADD updatestatus.sh /tmp/updatestatus.sh
ADD updatetime.sh /tmp/updatetime.sh

RUN pip install pipreqsnb

# Downloading gcloud package
RUN curl -sSL https://sdk.cloud.google.com | bash

ENV PATH $PATH:/home/app/google-cloud-sdk/bin

ENV PATH=$PATH:/home/app/.local/bin
# Populate example here - i.e. "cat", "sha512sum" or "node index.js"
ENV fprocess="xargs -s 100000 bash /tmp/run.sh"
# Set to true to see request in function logs
ENV write_debug="false"

EXPOSE 8080

HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]
