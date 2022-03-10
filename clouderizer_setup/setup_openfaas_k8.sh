#Create gke cluster and authenticate to the cluster

export ZONE=$1 && \
export MACHINETYPE=$2 && \
export CLUSTERNAME=$3 && \
export NODES=$4

gcloud container clusters create $CLUSTERNAME --zone $ZONE --num-nodes $NODES -m $MACHINETYPE

gcloud container clusters get-credentials $CLUSTERNAME --zone $ZONE

#Install Nginx Ingress Controller in the Kubernetes Cluster
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginxingress ingress-nginx/ingress-nginx

#Create Openfaas and Openfaas-fn namespaces
kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml

#Install Openfaas in the Kubernetes Cluster
helm upgrade openfaas --install openfaas/openfaas \
    --namespace openfaas  \
    --version v6.2.0 \
    --set functionNamespace=openfaas-fn \
    --set generateBasicAuth=false \
    --set faasnetes.imagePullPolicy=IfNotPresent \
    --set faasIdler.dryRun=false

#Generate a random password and create a secret with username as admin and password as the random generated password. These will be openfaas admin credentials.
export PASSWORD=$(head -c 12 /dev/urandom | shasum| cut -d' ' -f1)
kubectl -n openfaas create secret generic basic-auth \
--from-literal=basic-auth-user=admin \
--from-literal=basic-auth-password="$PASSWORD"

#Check for LoadBalancer IP and map domain name to the ip address
kubectl get svc

echo "Time to configure the DNS. Use the above IP address to set the DNS."
echo "Make sure you configure the DNS to same value you have in your tls.yml and openfaas.yml"
echo "Once done, press any key to continue..."

read continue

#Apply the CustomResourceDefinition resources separately for cert manager installation
kubectl apply --validate=false -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.11/deploy/manifests/00-crds.yaml

# Create the namespace for cert-manager
kubectl create namespace cert-manager

# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

# Update your local Helm chart repository cache
helm repo update

# Install the cert-manager Helm chart
helm install cert-manager \
  --namespace cert-manager \
  --version v0.11.0 \
  jetstack/cert-manager

#Add a delay here
echo "Waiting for 1m for TLS certificate service to come up..."
sleep 1m

#Install certificate issuer
kubectl apply -f letsencrypt-issuer.yaml

#Check if cert is created
kubectl describe certificate -n openfaas openfaas-crt

#Create Kubernetes secret for private Docker registry
export DOCKER_SERVER=$5 && \
export DOCKER_USERNAME=$6 && \
export DOCKER_PASSWORD=$7 && \
export DOCKER_EMAIL=$8
export OPENFAAS_URL=$9

faas login -u admin --password $PASSWORD

#Create Secrets
faas-cli secret create gcp-service-key --from-file="./gcloud-service-key.json"
faas-cli secret create sails-config --from-file="./console-config.js"
faas-cli secret create faas-secret-key --from-literal=$PASSWORD
kubectl create secret docker-registry dockerhub \
    -n openfaas-fn \
    --docker-server=$DOCKER_SERVER \
    --docker-username=$DOCKER_USERNAME \
    --docker-password=$DOCKER_PASSWORD \
    --docker-email=$DOCKER_EMAIL

#Create ingress operator which can be used to create Ingress records
kubectl apply -R -f ./artifacts/
#Create Console Ingress
kubectl apply -f ./console-ingress.yaml

#Helm upgrade with new values
helm upgrade openfaas ./openfaas -f ./openfaas/values.yaml --namespace openfaas --version v6.2.0
