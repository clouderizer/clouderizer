function usage()
{

  echo "Requires project json string :"

}

if [ "$1" = "" ];then
    usage
    exit 1
fi

input=$(echo "$1" | base64 -d)
pprojectname=$(echo $input | jq '.pprojectname' | sed 's/"//g')
gcloud auth activate-service-account --key-file /var/openfaas/secrets/gcp-service-key
gcloud container images delete gcr.io/production-servers-228902/${pprojectname} --force-delete-tags
for digest in $(gcloud container images list-tags ${IMAGE} --limit=999999 --sort-by=TIMESTAMP \
    --filter="timestamp.datetime < '${DATE}'" --format='get(digest)'); do
    (
      set -x
      gcloud container images delete -q --force-delete-tags "${IMAGE}@${digest}"
    )
    let C=C+1
done