# Import the OpenFaaS of-watchdog
FROM node:8.9.3 as api-builder

COPY ./console-api/package.json .
RUN npm i

FROM node:13.3.0 as ui-builder

RUN npm i -g "@angular/cli@8.3.23"

RUN mkdir -p /app/console-ui && \
    mkdir -p /app/scoring-ui

WORKDIR /app/console-ui/
COPY ./console-ui/ .
RUN npm i 
RUN ng build

WORKDIR /app/scoring-ui/
COPY ./scoring-ui/ .
RUN npm i 
RUN ng build

FROM node:8.9.3

RUN mkdir -p /app/console-api/node_modules && \
    mkdir -p /app/public
WORKDIR /app/console-api
COPY ./console-api/ .
WORKDIR /app/console-api/node_modules
COPY --from=api-builder node_modules/ .
WORKDIR /app/public
COPY --from=ui-builder /app/public .

# Let's say that the image listens on port 3000 and 
# that we can't change that easily
ENV http_port 3337
# Install the watchdog from the base image
COPY ./of-watchdog /usr/bin/fwatchdog
COPY ./launch.sh /app/launch.sh

RUN ln -s /var/openfaas/secrets/sails-config /app/console-api/config/env/development.js
# Now set the watchdog as the start-up process
# Along with the HTTP mode, and an upstream URL to 
# where your HTTP server will be running from the original
# image.
ENV mode="http"
ENV upstream_url="http://127.0.0.1:3337"

# Set fprocess to the value you have in your base image
ENV fprocess="bash /app/launch.sh"
CMD ["fwatchdog"]
#CMD ["node","/app/console-api/app.js"]