#!/bin/bash

IFS=',[]"' read -r -a s3_otherfiles_array <<< $fn_s3_otherfiles_path
IFS=',[]"' read -r -a otherfiles_array <<< $fn_otherfiles_path

MODEL_FILE_URL=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data "type=get" --data "key=${fn_model_path}" "${server_url}/api/awsconfig/generatepresignedurl" | jq ".urls[0]" | sed 's/"//g') 
curl -o "/home/app/function/asset/model.file" "${MODEL_FILE_URL}" 
curl -X POST --data "servingproject=${servingproject}" "${server_url}/api/servingproject/fetchprojectconfig" -o "/home/app/function/projectConfig.json" 
echo "model"
if [ "${fn_preprocess_script_path}" != null ] && [ "${fn_preprocess_script_path}" != "" ]
then
PRESIGNED_URL_PUBLIC_PREPROCESS_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_preprocess_script_path}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
curl -o "/home/app/function/preprocess.py" "${PRESIGNED_URL_PUBLIC_PREPROCESS_SCRIPT}"
fi
echo "preprocess"

if [ "${fn_postprocess_script_path}" != null ] && [ "${fn_postprocess_script_path}" != "" ]
then
echo ${server_url}
PRESIGNED_URL_PUBLIC_POSTPROCESS_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_postprocess_script_path}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
curl -o "/home/app/function/postprocess.py" "${PRESIGNED_URL_PUBLIC_POSTPROCESS_SCRIPT}"
fi
echo "postprocess"

if [ "${fn_predict_script_path}" != null ] && [ "${fn_predict_script_path}" != "" ]
then
echo ${server_url}
PRESIGNED_URL_PUBLIC_PREDICT_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_predict_script_path}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
curl -o "/home/app/function/pypredict.py" "${PRESIGNED_URL_PUBLIC_PREDICT_SCRIPT}"
fi

if [ "$s3_otherfiles_array" != null ] && [ "$s3_otherfiles_array" != "" ]
then
    for i in "${!s3_otherfiles_array[@]}"
    do 
      echo "in for loop"
      echo "support files" > "$project_dir/$fn_name/asset/otherfiles/README.md"
      PRESIGNED_URL_PUBLIC_MODEL=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${s3_otherfiles_array[i]}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
      curl -o "/home/app/${otherfiles_array[i]}" "${PRESIGNED_URL_PUBLIC_MODEL}"
    done  
fi
sleep 5
payload='{"status": "Running", "status_message": "deployed successfully. image is ready"}'
url="$server_url/api/publishedservingproject?where={\"servingproject\": $servingproject}"
curl -X POST -H "Content-Type: application/json" -d "$payload" "$url"