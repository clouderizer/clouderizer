#!/bin/sh
  
# $1 ---> serving model id
# $2 ---> base_url
tesseract_path=/node_serve/savebucks.tunneluser.pem
tesseract_port=2222
server_url=$2
tunnelurl=tunneluser@${server_url}

servingmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
servingproject=$(curl -X GET "${server_url}/api/servingproject/find/${3}")

get_deploy_tokens=$(curl -X POST --data "servingid=${1}" "${server_url}/api/servingmodel/getdeploytoken")
echo $servingmodel

# echo $get_deploy_tokens

input=$(echo $servingproject | jq -r '.inputAttr')
output=$(echo $servingproject | jq -r '.outputAttr')
public=$(echo $servingproject | jq '.public' | sed 's/"//g')
projectName=$(echo $servingproject | jq '.name' | sed 's/"//g')
projectDescription=$(echo $servingproject | jq '.description' | sed 's/"//g')
bannerImage=$(echo $servingproject | jq '.bannerImage')

servingmodelid=$(echo $servingmodel | jq '.id' | sed 's/"//g')
timeSeries=$(echo $servingmodel | jq '.timeSeries' | sed 's/"//g')
s3_zip_file=$(echo $servingmodel | jq '.s3_zip_file' | sed 's/"//g')
company=$(echo $servingmodel | jq '.company' | sed 's/"//g')
servingport=$(echo $servingmodel | jq '.servingport' | sed 's/"//g')
type=$(echo $servingmodel | jq '.subtype' | sed 's/"//g')
servingprojectid=$(echo $servingmodel | jq '.servingproject' | sed 's/"//g')
modelstatus=$(echo $servingmodel | jq '.status' | sed 's/"//g')
s3_preprocess=$(echo $servingmodel | jq '.preprocessCodePath' | sed 's/"//g')
s3_predict=$(echo $servingmodel | jq '.predictCodePath' | sed 's/"//g')
s3_postprocess=$(echo $servingmodel | jq '.postprocessCodePath' | sed 's/"//g')
pipPackages=$(echo $servingmodel | jq '.pipPackages')
pipPack=($(echo $pipPackages | jq '.[]' | sed 's/"//g'))
preprocess_enabled=$(echo $servingmodel | jq '.preprocessEnabled')
postprocess_enabled=$(echo $servingmodel | jq '.postprocessEnabled')
training=$(echo $servingmodel | jq '.training')
pickleFile=$(echo $servingmodel | jq '.pickle_file' | sed 's/"//g')
predictCode=$(echo $servingmodel | jq '.predictCode')
machinetype=$(echo $servingmodel | jq '.machinetype' | sed 's/"//g')
get_deploy_token_username=$(echo $get_deploy_tokens | jq '.deploy_username' | sed 's/"//g')
get_deploy_token=$(echo $get_deploy_tokens | jq '.deploy_token' | sed 's/"//g')
secret_key=$(echo $servingmodel | jq '.secret_key' | sed 's/"//g')

# --arg input "$input" \ input: $input, 
contentJson=$( jq -n \
                  --arg input "$input" \
                  --arg output "$output" \
                  --arg public "$public" \
                  --arg subtype "$type" \
                  --arg projectId "$servingprojectid" \
                  --arg companyId "$company" \
                  --arg projectName "$projectName" \
                  --arg bannerImage "$bannerImage" \
                  --arg projectDescription "$projectDescription" \
                  --arg preprocess_enabled "$preprocess_enabled" \
                  --arg postprocess_enabled "$postprocess_enabled" \
                  --arg timeSeries "$timeSeries" \
                  '{input: $input, output: $output, bannerImage: $bannerImage, public: $public, subtype: $subtype, projectName: $projectName, projectDescription: $projectDescription, projectId: $projectId, companyId: $companyId, preprocess: $preprocess_enabled, postprocess: $postprocess_enabled, timeSeries: $timeSeries}' )

echo $contentJson > /node_serve/projectDetails.json
# jq '. |= . + {input: $input}' /node_serve/projectDetails.json > tmp.json && mv tmp.json /node_serve/projectDetails.json
echo 'got content json'
# echo $get_deploy_tokens
echo 'export LC_ALL=C.UTF-8' >> /root/.bashrc
source /root/.bashrc

if [ "$modelstatus" != "Updating deployment" ]; then
    curl -X POST --data "servingid=${1}" --data "status=Starting" --data "status_message=Getting your project instance ready" "${server_url}/api/servingmodel/updatestatus"
fi

if [ ${#pipPack[@]} -ne 0 ];
then
    for i in "${pipPack[@]}";
    do
        yes | pip3 install $i
    done
fi

if [ "$type" = "jpmml" ] || [ "$type" = "pmml4s" ];
then
    echo 'pmml'
    file_path=/tmp/model.pmml
elif [ "$type" = "pythonscore" ];
then
    file_path=/tmp/model.pickle
elif [ "$type" = "h2o" ] || [ "$type" = "dai" ];
then
    file_path=/tmp/gotit.zip
fi

if [ $training == "true" ];
then
    file_path=/tmp/notebook.ipynb
    yes | pip3 install ipykernel
fi

# echo $get_deploy_token_username
# echo $get_deploy_token

#get files

if test -f "/node_serve/app.js"; then
    echo 'app.js exists'
else
    rm -rf node_modules
    rm -rf package.json
    rm -rf package-lock.json
    if [[ $2 == *"alpha"* ]];
    then
        git init
        git remote add origin "https://${get_deploy_token_username}:${get_deploy_token}@gitlab.com/guptaprakash/clouderizer-showcaseservices.git"
        # git fetch origin test
        # git reset --hard origin/test
        git pull origin test
    else
        git init
        git remote add origin "https://${get_deploy_token_username}:${get_deploy_token}@gitlab.com/guptaprakash/clouderizer-showcaseservices.git"
        # git fetch origin showcase_production
        # git reset --hard origin/showcase_production
        git pull origin showcase_production
    fi
fi

# servingproject=$(curl -X GET "${server_url}/api/servingproject/find/${servingprojectid}")

if [ "$type" = "dai" ]
then
    curl -X POST --data "servingmodel=${1}" "${server_url}/api/awsconfig/getlicensefile" --output /node_serve/license.sig
    #LICENSE_PRESIGNED_URL=$(curl -X POST --data "servingmodel=${1}" "${server_url}/api/awsconfig/getlicensefile" | jq '.url' | sed 's/"//g') 
    # license_file=$(echo $servingmodel | jq '.s3_license_file' | sed 's/"//g')
    # LICENSE_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${license_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    #echo $LICENSE_PRESIGNED_URL
    #wget -O /node_serve/license.sig "${LICENSE_PRESIGNED_URL}"
    export DRIVERLESS_AI_LICENSE_FILE=/node_serve/license.sig
    echo 'DRIVERLESS_AI_LICENSE_FILE=/node_serve/license.sig' >> /root/.bashrc
    source /root/.bashrc
    echo $DRIVERLESS_AI_LICENSE_FILE
fi

echo $s3_zip_file
echo $company
echo $servingport
echo $servingprojectid
# echo $type
echo $file_path
# echo $s3_preprocess

# get uds.py file
# wget -q -NS --content-disposition "${server_url}/givemepythonservingclient" &> /dev/null

if [ "$servingport" = null ] || [ "$servingport" = 0 ]
then 
    servingport=$(curl -X GET "${server_url}/api/servingmodel/generateport?servingid=${1}" | jq '.port')
    echo "Serving port genereated ${servingport}"
else
    echo "no port generated"
fi
    # curl -X POST --data "servingid=${1}" --data "servingport=${servingport}" "${server_url}/api/updateservingport"

# PYTHON_PICKLE_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data 'type=get' --data "key=${pickleFile}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')

# if [ -e /tmp/random.sock ]
# then
#     rm /tmp/random.sock
# fi

# if [ -e /tmp/preprocessing_unix.sock ]
# then
#     rm /tmp/preprocessing_unix.sock
# fi

# wget -O $file_path "${PRESIGNED_URL}"
# wget -O /node_serve/preprocess.py "${PREPROCESS_PRESIGNED_URL}"

# if [[ "$file_path" == *".zip" ]]
# then
#     if unzip -t "/tmp/gotit.zip"
#     then
#         unzip -o -q /tmp/gotit.zip -d /tmp/workdir
#     else
#         echo "ZIp not found in S3"
#         rm /tmp/gotit.zip
#         #make a database update & stop docker from restarting
#         curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model Zip file not found" "${server_url}/api/servingmodel/updatestatus"
#     fi
# fi

if [ $preprocess_enabled == "true" ];
then
    echo "PREPROCESSING ENABLED"
    PREPROCESS_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${s3_preprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    PREPROCESS_PRESIGNED_URL_HEAD=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=head' --data "key=${s3_preprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    # wget -O /node_serve/preprocess.py "${PREPROCESS_PRESIGNED_URL}"
    # preprocess=$(echo $preprocessCode | sed 's/"//g')
    # echo -e $''${preprocess}'' > /node_serve/preprocess.py
    # if test -f "/node_serve/preprocess.py"; then
    if [ -s '/node_serve/preprocess.py' ]; then
        etag=$(curl -I "${PREPROCESS_PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        if [ -z "$etag" ]
        then
            PREPROCESS_PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_preprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PREPROCESS_PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "Preprocess code file not found. Please upload and deploy again!"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Preprocess code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum /node_serve/preprocess.py | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then  
                    echo "no match"
                    killpython=true
                    PREPROCESS_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_preprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O /node_serve/preprocess.py.tmp "${PREPROCESS_PRESIGNED_URL_PUBLIC}" && mv /node_serve/preprocess.py{.tmp,}
                fi
            fi
        else
            md5=$(md5sum /node_serve/preprocess.py | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"
                killpython=true        
                wget -O /node_serve/preprocess.py.tmp "${PREPROCESS_PRESIGNED_URL}" && mv /node_serve/preprocess.py{.tmp,}
            fi
        fi
    else
        wget -O /node_serve/preprocess.py "${PREPROCESS_PRESIGNED_URL}"
        if [ -s '/node_serve/preprocess.py' ]; then
        # if test -f "/node_serve/preprocess.py"; then
            echo "file found"
        else
            PREPROCESS_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_preprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O /node_serve/preprocess.py "${PREPROCESS_PRESIGNED_URL_PUBLIC}"
            if [ -s '/node_serve/preprocess.py' ]; then
            # if test -f "/node_serve/preprocess.py"; then
                echo "file found"
            else
                echo "Preprocess code file not found. Please upload and deploy again!"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Preprocess code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
fi

if [ $postprocess_enabled == "true" ];
then
    echo "POSTPROCESSING ENABLED"
    POSTPROCESS_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${s3_postprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    POSTPROCESS_PRESIGNED_URL_HEAD=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=head' --data "key=${s3_postprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    # wget -O /node_serve/postprocess.py "${POSTPROCESS_PRESIGNED_URL}"
    if [ -s '/node_serve/postprocess.py' ]; then
    # if test -f "/node_serve/postprocess.py"; then
        etag=$(curl -I "${POSTPROCESS_PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        if [ -z "$etag" ]
        then
            POSTPROCESS_PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_postprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${POSTPROCESS_PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "Postprocess code file not found. Please upload and deploy again!"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Postprocess code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum /node_serve/postprocess.py | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then
                    echo "no match"
                    killpython=true
                    POSTPROCESS_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_postprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O /node_serve/postprocess.py.tmp "${POSTPROCESS_PRESIGNED_URL_PUBLIC}" && mv /node_serve/postprocess.py{.tmp,}
                fi
            fi
        else
            md5=$(md5sum /node_serve/postprocess.py | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"    
                killpython=true    
                wget -O /node_serve/postprocess.py.tmp "${POSTPROCESS_PRESIGNED_URL}" && mv /node_serve/postprocess.py{.tmp,}
            fi
        fi
    else
        wget -O /node_serve/postprocess.py "${POSTPROCESS_PRESIGNED_URL}"
        if [ -s '/node_serve/postprocess.py' ]; then
        # if test -f "/node_serve/postprocess.py"; then
            echo "file found"
        else
            POSTPROCESS_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_postprocess}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O /node_serve/postprocess.py "${POSTPROCESS_PRESIGNED_URL_PUBLIC}"
            if [ -s '/node_serve/postprocess.py' ]; then
            # if test -f "/node_serve/postprocess.py"; then
                echo "file found"
            else
                echo "Postprocess code file not found. Please upload and deploy again!"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Postprocess code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
fi

PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
PRESIGNED_URL_HEAD=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=head' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
echo $PRESIGNED_URL

if [ "$type" = "pythonscore" ] && [ $training != "true" ];
then
    PYPREDICT_PRESIGNED_URL_HEAD=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=head' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    PYTHON_PREDICT_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    if [ -s '/node_serve/pypredict.py' ]; then
    # if test -f "/node_serve/pypredict.py"; then
        etagfull=$(curl -I "${PYPREDICT_PRESIGNED_URL_HEAD}")
        echo $etagfull
        etag=$(curl -I "${PYPREDICT_PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        echo "got etag - pypredict file private"
        if [ -z "$etag" ]
        then
            PYPREDICT_PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PYPREDICT_PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo "got etag - pypredict file public"
            if [ -z "$etag" ]
            then
                echo "Prediction code file not found in S3 - when already there"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Prediction code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum /node_serve/pypredict.py | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then  
                    echo "no match"
                    killpython=true
                    PYTHON_PREDICT_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O /node_serve/pypredict.py.tmp "${PYTHON_PREDICT_PRESIGNED_URL_PUBLIC}" && mv /node_serve/pypredict.py{.tmp,}
                fi
            fi
        else
            md5=$(md5sum /node_serve/pypredict.py | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"    
                killpython=true    
                wget -O /node_serve/pypredict.py.tmp "${PYTHON_PREDICT_PRESIGNED_URL}" && mv /node_serve/pypredict.py{.tmp,}
            fi
        fi
    else
        wget -O /node_serve/pypredict.py "${PYTHON_PREDICT_PRESIGNED_URL}"
        if [ -s '/node_serve/pypredict.py' ]; then
        # if test -f "/node_serve/pypredict.py"; then
            echo " prediction file found private"
        else
            PYTHON_PREDICT_PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O /node_serve/pypredict.py "${PYTHON_PREDICT_PRESIGNED_URL_PUBLIC}"
            if [ -s '/node_serve/pypredict.py' ]; then
            # if test -f "/node_serve/pypredict.py"; then
                echo " prediction file found public"
            else
                echo "Prediction code file not found in S3 - when not there"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Prediction code file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi

    if [ -s "${file_path}" ]; then
    # if test -f "/tmp/model.pickle"; then
        etag=$(curl -I "${PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        echo "got etag - pypredict file private"
        if [ -z "$etag" ]
        then
            PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "If: Model file not found in S3"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum $file_path | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then  
                    echo "no match"
                    killpython=true
                    PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O $file_path.tmp "${PRESIGNED_URL_PUBLIC}" && mv $file_path{.tmp,}
                fi
            fi
        else
            md5=$(md5sum $file_path | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"
                killpython=true         
                wget -O $file_path.tmp "${PRESIGNED_URL}" && mv $file_path{.tmp,}
            fi
        fi
    else
        wget -O $file_path "${PRESIGNED_URL}"
        if [ -s "${file_path}" ]; then
        # if test -f "/tmp/model.pickle"; then
            echo "pickle file found private"
        else
            PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O $file_path "${PRESIGNED_URL_PUBLIC}"
            if [ -s "${file_path}" ]; then
            # if test -f "/tmp/model.pickle"; then
                echo "pickle file found public"
            else
                echo "Else: Model file not found in S3"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
fi

if [ $training == "true" ]; 
then
    if [ -s "${file_path}" ];
    then
    # if test -f "/tmp/model.pickle"; then
        etag=$(curl -I "${PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        if [ -z "$etag" ]
        then
            PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "If: Notebook not found in S3"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Notebook not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum $file_path | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then 
                    echo "no match"
                    killpython=true
                    PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O $file_path.tmp "${PRESIGNED_URL_PUBLIC}" && mv $file_path{.tmp,}
                fi
            fi
        else
            md5=$(md5sum $file_path | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"
                killpython=true         
                wget -O $file_path.tmp "${PRESIGNED_URL}" && mv $file_path{.tmp,}
            fi
        fi
        # wget -O /tmp/model.pickle "${PRESIGNED_URL}"
        # PYTHON_PREDICT_PRESIGNED_URL=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data 'type=get' --data "key=${s3_predict}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
        # wget -O /node_serve/pypredict.py "${PYTHON_PREDICT_PRESIGNED_URL}"
    else
        wget -O $file_path "${PRESIGNED_URL}"
        if [ -s "${file_path}" ]; then
        # if test -f "/tmp/model.pickle"; then
            echo "Notebook found private"
        else
            PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O $file_path "${PRESIGNED_URL_PUBLIC}"
            if [ -s "${file_path}" ]; then
            # if test -f "/tmp/model.pickle"; then
                echo "Notebook found public"
            else
                echo "Else: Notebook not found in S3"
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Notebook not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
fi

if [[ "$file_path" == *".zip" ]]
then
    if unzip -t "/tmp/gotit.zip"
    then
        etag=$(curl -I "${PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        if [ -z "$etag" ]
        then
            PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "h2o Model file not found in S3"
                rm /tmp/gotit.zip
                #make a database update & stop docker from restarting
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum /tmp/gotit.zip | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then
                    echo "no match"
                    killjava=true  
                    PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O /tmp/gotit.zip "${PRESIGNED_URL_PUBLIC}"
                    unzip -o -q /tmp/gotit.zip -d /tmp/workdir
                fi
            fi
        else
            md5=$(md5sum /tmp/gotit.zip | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"
                killjava=true  
                wget -O /tmp/gotit.zip "${PRESIGNED_URL}"
                unzip -o -q /tmp/gotit.zip -d /tmp/workdir
            fi
        fi
    else
        wget -O /tmp/gotit.zip "${PRESIGNED_URL}"
        if unzip -t "/tmp/gotit.zip"
        then
            unzip -o -q /tmp/gotit.zip -d /tmp/workdir
        else
            PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O /tmp/gotit.zip "${PRESIGNED_URL_PUBLIC}"
            if unzip -t "/tmp/gotit.zip"
            then
            unzip -o -q /tmp/gotit.zip -d /tmp/workdir
            else
                echo "Model file not found in S3"
                rm /tmp/gotit.zip
                #make a database update & stop docker from restarting
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
elif [[ "$file_path" == *".pmml" ]]
then
    echo $file_path
    if [ -s '/tmp/model.pmml' ]; then
    # if test -f "/tmp/model.pmml"; then
        etag=$(curl -I "${PRESIGNED_URL_HEAD}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
        echo $etag
        if [ -z "$etag" ]
        then
            PRESIGNED_URL_HEAD_PUBLIC=$(curl -X POST --data "company=${company}" --data "servingid=${1}" --data "modelPublic=true" --data 'type=head' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')   
            etag=$(curl -I "${PRESIGNED_URL_HEAD_PUBLIC}" | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p' | sed 's/"//g')
            echo $etag
            if [ -z "$etag" ]
            then
                echo "pmml Model file not found in S3"
                # rm /tmp/model.pmml
                #make a database update & stop docker from restarting
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            else
                md5=$(md5sum /tmp/model.pmml | awk '{ print $1 }')
                echo $md5
                if [ "$etag" != "$md5" ]; then
                    killjava=true  
                    echo "no match"
                    PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
                    wget -O /tmp/model.pmml "${PRESIGNED_URL_PUBLIC}"
                fi
            fi
        else
            md5=$(md5sum /tmp/model.pmml | awk '{ print $1 }')
            echo $md5
            if [ "$etag" != "$md5" ]; then
                echo "no match"
                killjava=true         
                wget -O /tmp/model.pmml "${PRESIGNED_URL}"
            fi
        fi
    else
        wget -O /tmp/model.pmml "${PRESIGNED_URL}"
        if [ -s '/tmp/model.pmml' ]; then
        # if test -f "/tmp/model.pmml"; then
            echo "file found"
        else
            PRESIGNED_URL_PUBLIC=$(curl -X POST --data "company=${company}" --data "modelPublic=true" --data "servingid=${1}" --data 'type=get' --data "key=${s3_zip_file}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
            wget -O /tmp/model.pmml "${PRESIGNED_URL_PUBLIC}"
            if [ -s '/tmp/model.pmml' ]; then
            # if test -f "/tmp/model.pmml"; then
                echo "file found"
            else
                echo "pmml Model file not found in S3"
                # rm /tmp/model.pmml
                #make a database update & stop docker from restarting
                curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Model file not found. Please upload and deploy again!" "${server_url}/api/servingmodel/updatestatus"
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0
            fi
        fi
    fi
fi

if [ -f $file_path ]; then
    echo "File exists"
    if timeout 5 bash -c "</dev/tcp/localhost/9090 &>/dev/null"
    then
        echo "Port is open"
    else
        echo "Port is closed"
        if [ "$type" = "" ]; then
            type="train"
        fi
        node app.js $file_path ${1} ${servingprojectid} ${2} ${type} ${preprocess_enabled} ${postprocess_enabled} ${secret_key} &> node.log &
    fi

    if [ "$modelstatus" = "Updating deployment" ]; then
        echo "updating deployment"
    else
    #wget -O $tesseract_path https://s3.amazonaws.com/savebucksinout/savebucks.tunneluser.pem
        wget -O $tesseract_path "${server_url}/gettesseract"
        chmod 400 $tesseract_path
        autossh -M 0 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -i $tesseract_path -N -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -R localhost:${servingport}:localhost:9090 -p $tesseract_port $tunnelurl &> reversessh.log &
    fi

    # curl -X POST --data "servingid=${1}" --data "status=Downloading Model" --data "status_message=Configuring Setup" "${server_url}/api/servingmodel/updatestatus"

    # if [ "$modelstatus" != "Updating deployment" ]; then
    #     if [ "$preprocess_enabled" = "true" ] || [ "$type" = "pythonscore" ] || [ "$postprocess_enabled" = "true" ];
    #     then
    #         python3 uds.py ${type} &> preprocess.log &
    #     fi
    # fi

    if [ "$preprocess_enabled" = "true" ] || [ "$type" = "pythonscore" ] || [ "$type" = "train" ] || [ "$type" = "" ] || [ "$postprocess_enabled" = "true" ];
    then
        if [ "$modelstatus" = "Updating deployment" ]; then
            curl -X POST "${server_url}/userserving/${servingport}-${servingmodelid}-SH/removemodules"
        else
            if [ "$type" = "" ]; then
                type="train"
            fi
            python3 uds.py ${type} &> preprocess.log &
        fi
    fi

    if [ "$type" != "pythonscore" -a "$training" != "true" ]; then
      if [ "$modelstatus" = "Updating deployment" ]; then  
        if [ "$killjava" = true ]; then
            curl -X POST --data "servingid=${1}" --data "status=Updating deployment" --data "status_message=Model is loading" "${server_url}/api/servingmodel/updatestatus" 
            echo "unixclient"
            processId=$(pgrep -f java)
            echo $processId
            cat /dev/null > /node_serve/OOM.sh
            echo "echo 'OOM error'" >> /node_serve/OOM.sh
            echo "curl -X POST --data 'servingid=${1}' --data 'status=Not Running' --data 'status_message=Insufficient memory. Please deploy it with more memory!' '${server_url}/api/servingmodel/updatestatus'" >> /node_serve/OOM.sh
            echo "kill \$(pgrep -f java)" >> /node_serve/OOM.sh 
            chmod +x /node_serve/OOM.sh
            nohup java -XX:OnOutOfMemoryError="bash /node_serve/OOM.sh" -jar /showcase_files/unixclient.jar ${type} ${server_url} ${1} ${processId} > java.log 2>javaerror.log &   
            while sleep 1
            do
            echo "service"
            if ! ps auxgww | grep -v grep | grep java
            then
                if [ -s "javaerror.log" ]; then
                    if grep -q 'OutOfMemoryError' '/node_serve/javaerror.log'; then
                        echo "out of memory"
                        curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                        exit 0
                    else
                        echo "java error"
                        exit 1
                    fi
                else 
                    echo "no java error" 
                    latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
                    latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
                    echo $latestmodelstatus
                    if [ "$latestmodelstatus" != "Not Running" ]; then
                        curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Issue with predictor, please check your dashboard for more details." "${server_url}/api/servingmodel/updatestatus"
                    fi
                    curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                    exit 0
                fi
            fi
            done
        else
            curl -X POST "${server_url}/userserving/${servingport}-${servingmodelid}-SH/updateversion" 
            curl -X POST --data "servingid=${1}" --data "status=Running" --data "status_message=Model is ready!" "${server_url}/api/servingmodel/updatestatus" 
        fi
      else
        curl -X POST --data "servingid=${1}" --data "status=Downloading Model" --data "status_message=Model is loading" "${server_url}/api/servingmodel/updatestatus"
        processId="%&@"
        cat /dev/null > /node_serve/OOM.sh
        echo "echo 'OOM error'" >> /node_serve/OOM.sh
        echo "curl -X POST --data 'servingid=${1}' --data 'status=Not Running' --data 'status_message=Insufficient memory. Please deploy it with more memory!' '${server_url}/api/servingmodel/updatestatus'" >> /node_serve/OOM.sh
        echo "kill \$(pgrep -f java)" >> /node_serve/OOM.sh 
        chmod +x /node_serve/OOM.sh
        nohup java -XX:OnOutOfMemoryError="bash /node_serve/OOM.sh" -jar /showcase_files/unixclient.jar ${type} ${server_url} ${1} ${processId} > java.log 2>javaerror.log &
        while sleep 5
        do
            if ! ps auxgww | grep -v grep | grep java
            then 
                latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
                latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
                if [ -s "javaerror.log" ]; then
                    if grep -q 'OutOfMemoryError' '/node_serve/javaerror.log'; then
                        echo "out of memory"
                        curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                        exit 0
                    elif [ $(grep -v -c -E 'INFO|DEBUG|TRACE|WARN' /node_serve/javaerror.log) -gt 0 ] ; then 
                        echo "java error"   
                        echo "1" >> /node_serve/restartcount.txt
                        a=$(sed -n '$=' /node_serve/restartcount.txt)
                        if [ $a -gt 3 ]; then
                            curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Issue with predictor, please check your dashboard for more details." "${server_url}/api/servingmodel/updatestatus"
                            cat /dev/null > /node_serve/restartcount.txt
                            curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                            exit 0
                        else   
                            echo "restart"       
                            exit 1
                        fi
                    else
                        echo "no java error, but error log"
                        echo $latestmodelstatus
                        echo $(ps -ef)
                        if [ "$latestmodelstatus" != "Not Running" ]; then
                            curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Issue with predictor, please check your dashboard for more details." "${server_url}/api/servingmodel/updatestatus"
                        fi
                        curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                        exit 0
                    fi
                else 
                    echo "no java error"
                    echo $(ps -ef)
                    echo $latestmodelstatus
                    ps -ef
                    if [ "$latestmodelstatus" != "Not Running" ]; then
                        curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Issue with predictor, please check your dashboard for more details." "${server_url}/api/servingmodel/updatestatus"
                    fi
                    curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                    exit 0
                fi
            fi
            if ! ps auxgww | grep -v grep | grep app.js
            then
                latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
                latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
                if [ "$latestmodelstatus" != "Not Running" ]; then
                    echo "1" >> /node_serve/restartcount.txt
                    a=$(sed -n '$=' /node_serve/restartcount.txt)
                    if [ $a -gt 3 ]; then
                        curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Server is not running. Please deploy again." "${server_url}/api/servingmodel/updatestatus"
                        cat /dev/null > /node_serve/restartcount.txt
                        curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                        exit 0
                    else   
                        echo "exit 1"      
                        exit 1
                    fi
                fi
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0   
            fi
            response=$(curl --write-out '%{http_code}' --silent --output /dev/null ${server_url}/userserving/${servingport}-${1}-SH)
            latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
            latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
            latestmodelstatusmessage=$(echo $latestmodel | jq '.status_message' | sed 's/"//g')
            if [ "$response" = 200 ]
            then
                if [ "$latestmodelstatus" == "Not Running" -a "$latestmodelstatusmessage" == "Project is offline" ]; then
                    curl -X POST --data "servingid=${1}" --data "status=Running" --data "status_message=Model is ready!" "${server_url}/api/servingmodel/updatestatus"
                fi
            else
                if ps auxgww | grep -v grep | grep java; then
                # if [ "$latestmodelstatus" == "Not Running" -a "$latestmodelstatusmessage" == "Project is offline" ]; then
                    echo "exit 1"
                    exit 1
                # fi
                fi
            fi
        done
      fi
    else 
        sleep 5
        curl -X POST --data "servingid=${1}" --data "status=Running" --data "status_message=Model is ready!" "${server_url}/api/servingmodel/updatestatus" 
        while sleep 5
        do
            if ! ps auxgww | grep -v grep | grep app.js
            then
                latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
                latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
                if [ "$latestmodelstatus" != "Not Running" ]; then
                    echo "1" >> /node_serve/restartcount.txt
                    a=$(sed -n '$=' /node_serve/restartcount.txt)
                    if [ $a -gt 3 ]; then
                        curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Server is not running. Please deploy again." "${server_url}/api/servingmodel/updatestatus"
                        cat /dev/null > /node_serve/restartcount.txt
                        curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                        exit 0
                    else 
                        echo "node exit 1"         
                        exit 1
                    fi
                fi
                curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                exit 0   
            fi  
            if ! ps auxgww | grep -v grep | grep 'python3 uds.py'
            then
                latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
                latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
                echo "1" >> /node_serve/restartcount.txt
                a=$(sed -n '$=' /node_serve/restartcount.txt)
                if [ $a -gt 3 ]; then
                    curl -X POST --data "servingid=${1}" --data "status=Not Running" --data "status_message=Issue with predictor, please check your dashboard for more details." "${server_url}/api/servingmodel/updatestatus"
                    cat /dev/null > /node_serve/restartcount.txt
                    curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
                    exit 0
                else  
                    echo "python exit 1"        
                    exit 1
                fi   
            fi
            response=$(curl --write-out '%{http_code}' --silent --output /dev/null ${server_url}/userserving/${servingport}-${1}-SH)
            latestmodel=$(curl -X GET "${server_url}/api/servingmodel/find/${1}")
            latestmodelstatus=$(echo $latestmodel | jq '.status' | sed 's/"//g')
            latestmodelstatusmessage=$(echo $latestmodel | jq '.status_message' | sed 's/"//g')
            if [ "$response" = 200 ]
            then
                if [ "$latestmodelstatus" == "Not Running" -a "$latestmodelstatusmessage" == "Project is offline" ]; then
                    curl -X POST --data "servingid=${1}" --data "status=Running" --data "status_message=Model is ready!" "${server_url}/api/servingmodel/updatestatus"
                fi
            else
                if ps auxgww | grep -v grep | grep app.js; then
                    echo "status code != 200, exit 1"
                    exit 1
                fi
            fi
        done  
    fi     
else
    echo "Docker should exit here!"
    curl -X POST --data "servingid=${1}" --data "company=${company}" --data "platform_type=${machinetype}" "${server_url}/api/stopinstance"
    exit 0
fi
