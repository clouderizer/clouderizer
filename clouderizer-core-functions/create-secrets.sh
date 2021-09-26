export OPENFAAS_URL=<your-openfaas-server-url> && \
export PASSWORD=<your-openfaas-admin-password> && \
export DOCKER_SERVER=<your-docker-registry-url> && \
export DOCKER_USERNAME=<your-docker-registry-username> && \
export DOCKER_PASSWORD=<your-docker-registry-password> && \
export DOCKER_EMAIL=<your-docker-registry-email>

kubectl create secret docker-registry dockerhub \
    -n openfaas-fn \
    --docker-server=$DOCKER_SERVER \
    --docker-username=$DOCKER_USERNAME \
    --docker-password=$DOCKER_PASSWORD \
    --docker-email=$DOCKER_EMAIL

faas login -u admin --password $PASSWORD

echo '{
  "git_username" : "<git-username>",
  "git_password" : "<git-password>"
}' > gitlab.txt

faas-cli secret create gitlab --from-file="./gitlab.txt"
faas-cli secret create faas-secret-key --from-literal=$PASSWORD

#create secret for GCP config.json
faas-cli secret create gcp-service-key --from-file="./gcloud-service-key.json"
#create secret for sailsjs config
faas-cli secret create sails-config --from-file="./console-config.js"

#Docker build command
#sudo docker build . -t registry.gitlab.com/showcase-internal/internalfunctions/console:latest