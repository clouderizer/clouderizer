function usage()
{

  echo "Requires project json string :"

}

if [ "$1" = "" ];then
    usage
    exit 1
fi

####### TOP LEVEL DESIGN ##############
# add gitlab yml, .gitignore file
# for each function
# if git repo was empty, download the skeleton folder from S3 based on type and extract else skip
# download the S3 files and merge into the skeleton
# if git repo was empty, append to stack.yml else update stack.yml (if needed)
# end for

# commit and push the changes to development branch --> git cli with auth

# return success
####### TOP LEVEL DESIGN ##############
input=$(echo "$1" | base64 -d)
server_url=$(echo $input | jq '.server_url' | sed 's/"//g')
nbvariables=$(echo $input | jq '.nbvariables')
project=$(echo $input | jq '.project')
functions=$(echo $input | jq '.functions')

name=$(echo $project | jq '.name' | sed 's/"//g')
#functions=$(echo $project | jq '.functions' | sed 's/"//g')
git_url=$(echo $project | jq '.giturl' | sed 's/"//g')
registryurl=$(echo $project | jq '.registryurl' | sed 's/"//g')
company=$(echo $project | jq '.company' | sed 's/"//g')
servingproject=$(echo $project | jq '.servingproject' | sed 's/"//g')
pproject=$(echo $project | jq '.id' | sed 's/"//g')
imagebuildtime=$(echo $project | jq '.imagebuildtime' | sed 's/"//g')
custtime=$(echo $project | jq '.custsavedon' | sed 's/"//g')
sptime=$(echo $project | jq '.spsavedon' | sed 's/"//g')
smtime=$(echo $project | jq '.smsavedon' | sed 's/"//g')

gcloud auth activate-service-account --key-file /var/openfaas/secrets/gcp-service-key

export git_username=$(cat /var/openfaas/secrets/gitlab | jq '.git_username' | sed 's/"//g')
export git_password=$(cat /var/openfaas/secrets/gitlab | jq '.git_password' | sed 's/"//g')

git config --global credential.helper '!f() { sleep 1; echo "username=${git_username}"; echo "password=${git_password}"; }; f'

mkdir -p ~/templates/$servingproject
cd ~/templates/$servingproject
git clone "https://gitlab.com/showcase-internal/function-templates.git"
mkdir -p ~/workspace/$servingproject
cd ~/workspace/$servingproject
project_dir="$HOME/workspace/$servingproject/$name"
mkdir -p $project_dir
cd $project_dir/

cp -f /tmp/.gitignore $project_dir
cp -f /tmp/.gitlab-ci.yml $project_dir
cp -f /tmp/stack.yml $project_dir
cp -f /tmp/stack_hr.yml $project_dir
cp -f /tmp/env.yaml $project_dir
cp -f /tmp/env_hr.yaml $project_dir
cp -f /tmp/updatestatus.sh $project_dir
cp -f /tmp/updatetime.sh $project_dir

server_url_sanitised=$(echo "$server_url" | sed 's/\//\\\//g')
registry_url_sanitised=$(echo "$registryurl" | sed 's/\//\\\//g')

sed -i -e 's/##pprojid##/'$pproject'/g' $project_dir/'.gitlab-ci.yml'
sed -i -e 's/##server_url##/'$server_url_sanitised'/g' $project_dir/'.gitlab-ci.yml'
sed -i -e 's/##pname##/'${name}'/g' $project_dir/'.gitlab-ci.yml'
sed -i -e 's/##tagname##/'${registry_url_sanitised}'/g' $project_dir/'.gitlab-ci.yml'


echo "environment:" >> "$project_dir/env.yaml"
echo "environment:" >> "$project_dir/env_hr.yaml"
echo "nb, $nbvariables"
if [ "$nbvariables" != null ] && [ "$nbvariables" != "" ];
then
  #Iterate over nbvariables loops
  for row in $(echo "${nbvariables}" | jq -r '.[] | @base64'); do
    _jq() {
      echo ${row} | base64 -d | jq -r ${1}
    }
    key=$(_jq '.key')
    value=$(_jq '.value')
    echo "  $key: $value"
    echo "  $key: $value" >> "$project_dir/env.yaml"
    echo "  $key: $value" >> "$project_dir/env_hr.yaml"
  done
fi

#Iterate over functions loops
for row in $(echo "${functions}" | jq -r '.[] | @base64'); do
  _jq() {
    echo ${row} | base64 -d | jq -r ${1}
  }
  fn_type=$(_jq '.fn_type')
  fn_exec=$(_jq '.fn_exec')
  fn_name=$(_jq '.name')
  fn_infratype=$(_jq '.infratype')
  hr_server_url=$(_jq '.server_url')
  hr_servingproject=$(_jq '.servingproject')
  hr_model_path=$(_jq '.fn_model_path')
  hr_company=$(_jq '.company')
  fn_timeout=$(_jq '.timeout')
  fn_cpu_limit=$(_jq '.cpu_limit')
  fn_gpu_limit=$(_jq '.gpu_limit')
  fn_memory_limit=$(_jq '.memory_limit')
  fn_cpu_request=$(_jq '.cpu_request')
  fn_memory_request=$(_jq '.memory_request')
  fn_projectConfig=$(_jq '.projectConfig')
  fn_hotstart=$(_jq '.hotstart')
  fn_dockerimage=$(_jq '.dockerimage')

  mkdir -p $project_dir/$fn_name

  fn_reqs=$(_jq '.reqs')

  fn_userreqs=$(_jq '.userreqs')

  fn_preprocess_script_path=$(_jq '.preprocess_script_path')

  fn_postprocess_script_path=$(_jq '.postprocess_script_path')

  fn_predict_script_path=$(_jq '.predict_script_path')

  fn_model_path=$(_jq '.model_path')

  fn_s3_otherfiles_path=$(_jq '.s3_otherfiles_path')

  fn_otherfiles_path=$(_jq '.otherfiles_path')

  echo $fn_s3_otherfiles_path
  echo $fn_otherfiles_path
  IFS=',[]"' read -r -a s3_otherfiles_array <<< $fn_s3_otherfiles_path # delimiter is ,
  IFS=',[]"' read -r -a otherfiles_array <<< $fn_otherfiles_path # delimiter is ,

  echo "other files"
  echo $s3_otherfiles_array
  echo $otherfiles_array
  echo "other files"

  if [ $fn_exec == "gpu" ];
  then
    filename=function_gpu.yml
    filename1=function_hr_gpu.yml
  else
    filename=function.yml
    filename1=function_hr.yml
  fi

  if [[ -d ~/templates/$servingproject/function-templates/$fn_type ]] 
  then
    #copy the templates files
    cp -r ~/templates/$servingproject/function-templates/$fn_type/function/* $project_dir/$fn_name/
    #copy the yml file
    cp -rf ~/templates/$servingproject/function-templates/$fn_type/$filename $project_dir/
    
    # replace registry path and name in the yml file
    sed -i "s/#fname#/${fn_name}/g" $project_dir/$filename
    cat $project_dir/$filename
    sed -i "s|#registryname#|${registryurl}|g" $project_dir/$filename
    sed -i "s|#infratype#|${fn_infratype}|g" $project_dir/$filename
    sed -i "s|#timeout#|${fn_timeout}|g" $project_dir/$filename
    sed -i "s|#cpu_limit#|${fn_cpu_limit}|g" $project_dir/$filename
    sed -i "s|#gpu_limit#|${fn_gpu_limit}|g" $project_dir/$filename
    sed -i "s|#memory_limit#|${fn_memory_limit}|g" $project_dir/$filename
    sed -i "s|#cpu_request#|${fn_cpu_request}|g" $project_dir/$filename
    sed -i "s|#memory_request#|${fn_memory_request}|g" $project_dir/$filename
    sed -i "s|#dockerimage#|${fn_dockerimage}|g" $project_dir/$filename

    echo "  read_timeout: $fn_timeout" >> "$project_dir/env.yaml"
    echo "  write_timeout: $fn_timeout" >> "$project_dir/env.yaml"
    echo "  exec_timeout: $fn_timeout" >> "$project_dir/env.yaml"
    cat $project_dir/$filename >> $project_dir/stack.yml
    rm $project_dir/$filename

    if [ "$fn_userreqs" != null ] && [ "$fn_userreqs" != "" ] && [ "$fn_hotstart" == "false" ]
    then
      hotstart=false
    else
      cp -rf ~/templates/$servingproject/function-templates/$fn_type/$filename1 $project_dir/
      sed -i "s/#fname#/${fn_name}/g" $project_dir/$filename1
      cat $project_dir/$filename1
      sed -i "s|#fn_model_path#|${hr_model_path}|g" $project_dir/$filename1
      sed -i "s|#fn_s3_otherfiles_path#|${hr_otherfiles_path}|g" $project_dir/$filename1
      sed -i "s|#fn_preprocess_script_path#|${fn_preprocess_script_path}|g" $project_dir/$filename1
      sed -i "s|#fn_postprocess_script_path#|${fn_postprocess_script_path}|g" $project_dir/$filename1
      sed -i "s|#fn_predict_script_path#|${fn_predict_script_path}|g" $project_dir/$filename1
      sed -i "s|#server_url#|${hr_server_url}|g" $project_dir/$filename1
      sed -i "s|#company#|${hr_company}|g" $project_dir/$filename1
      sed -i "s|#servingproject#|${hr_servingproject}|g" $project_dir/$filename1
      sed -i "s|#infratype#|${fn_infratype}|g" $project_dir/$filename1
      sed -i "s|#timeout#|${fn_timeout}|g" $project_dir/$filename1
      sed -i "s|#cpu_limit#|${fn_cpu_limit}|g" $project_dir/$filename1
      sed -i "s|#gpu_limit#|${fn_gpu_limit}|g" $project_dir/$filename1
      sed -i "s|#memory_limit#|${fn_memory_limit}|g" $project_dir/$filename1
      sed -i "s|#cpu_request#|${fn_cpu_request}|g" $project_dir/$filename1
      sed -i "s|#memory_request#|${fn_memory_request}|g" $project_dir/$filename1
      sed -i "s|#dockerimage#|${fn_dockerimage}|g" $project_dir/$filename1

      echo "  read_timeout: $fn_timeout" >> "$project_dir/env_hr.yaml"
      echo "  write_timeout: $fn_timeout" >> "$project_dir/env_hr.yaml"
      echo "  exec_timeout: $fn_timeout" >> "$project_dir/env_hr.yaml"
      echo "  company: ${hr_company}" >> "$project_dir/env_hr.yaml"
      echo "  server_url: ${hr_server_url}" >> "$project_dir/env_hr.yaml"
      echo "  servingproject: ${hr_servingproject}" >> "$project_dir/env_hr.yaml"
      echo "  fn_model_path: ${hr_model_path}" >> "$project_dir/env_hr.yaml"
      echo "  fn_preprocess_script_path: ${fn_preprocess_script_path}" >> "$project_dir/env_hr.yaml"
      echo "  fn_postprocess_script_path: ${fn_postprocess_script_path}" >> "$project_dir/env_hr.yaml"
      echo "  fn_predict_script_path: ${fn_predict_script_path}" >> "$project_dir/env_hr.yaml"
      echo "  fn_s3_otherfiles_path: ${fn_s3_otherfiles_path}" >> "$project_dir/env_hr.yaml"
      echo "  fn_otherfiles_path: ${fn_otherfiles_path}" >> "$project_dir/env_hr.yaml"
      cat $project_dir/$filename1 >> $project_dir/stack_hr.yml
      rm $project_dir/$filename1
    fi
  fi

  mkdir -p "$project_dir/$fn_name/asset/otherfiles"
  if [ $fn_preprocess_script_path != null ] && [ $fn_preprocess_script_path != "" ]
  then
    echo ${server_url}
    PRESIGNED_URL_PUBLIC_PREPROCESS_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_preprocess_script_path}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    wget -O "$project_dir/$fn_name/preprocess.py" "${PRESIGNED_URL_PUBLIC_PREPROCESS_SCRIPT}"
  fi

  if [ $fn_postprocess_script_path != null ] && [ $fn_postprocess_script_path != "" ]
  then
    echo ${server_url}
    PRESIGNED_URL_PUBLIC_POSTPROCESS_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_postprocess_script_path}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    wget -O "$project_dir/$fn_name/postprocess.py" "${PRESIGNED_URL_PUBLIC_POSTPROCESS_SCRIPT}"
  fi

  if [ $fn_predict_script_path != null ] && [ $fn_predict_script_path != "" ]
  then
    echo ${server_url}
    echo $fn_projectConfig > "$project_dir/$fn_name/yespredict.json"
    PRESIGNED_URL_PUBLIC_PREDICT_SCRIPT=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_predict_script_path}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    wget -O "$project_dir/$fn_name/pypredict.py" "${PRESIGNED_URL_PUBLIC_PREDICT_SCRIPT}"
  else
    echo $fn_projectConfig > "$project_dir/$fn_name/nopredict.json"
  fi

  if [ $fn_model_path != null ] && [ $fn_model_path != "" ]
  then
    echo ${server_url}
    echo ${fn_model_path}
    PRESIGNED_URL_PUBLIC_MODEL=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${fn_model_path}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
    wget -O "$project_dir/$fn_name/asset/model.file" "${PRESIGNED_URL_PUBLIC_MODEL}"
  fi

  if [ "$s3_otherfiles_array" != null ] && [ "$s3_otherfiles_array" != "" ]
  then
    for i in "${!s3_otherfiles_array[@]}"
    do 
      echo "in for loop"
      echo "support files" > "$project_dir/$fn_name/asset/otherfiles/README.md"
      echo ${otherfiles_array[i]}
      echo ${s3_otherfiles_array[i]}
      PRESIGNED_URL_PUBLIC_MODEL=$(curl -X POST --data "company=${company}" --data "servingid=${servingproject}" --data 'type=get' --data "key=${s3_otherfiles_array[i]}" --data "id=${company}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
      wget -O "$project_dir/$fn_name/asset/otherfiles/${otherfiles_array[i]}" "${PRESIGNED_URL_PUBLIC_MODEL}"
    done
  else
    echo "support files" > "$project_dir/$fn_name/asset/otherfiles/README.md"
  fi

  if [ "$fn_reqs" != null ] && [ "$fn_reqs" != "" ]
  then
    echo $fn_reqs | tr "," "\n" > "$project_dir/$fn_name/requirements.txt"
  fi

  echo $fn_projectConfig > "$project_dir/$fn_name/projectConfig.json"
done

cp -f /tmp/index.html $project_dir/$fn_name
sed -i -e 's/##server_url##/'$server_url_sanitised'/g' $project_dir/$fn_name/'index.html'

if [ "$hotstart" = false ]
then
  rm $project_dir/stack_hr.yml
  rm $project_dir/env_hr.yaml
fi

cd $project_dir/

if [[ "$imagebuildtime" > "$sptime" ]] && [[ "$imagebuildtime" > "$smtime" ]] && [[ "$imagebuildtime" > "$custtime" ]] && [ $(gcloud container images describe gcr.io/production-servers-228902/$name:latest > /dev/null ; echo $?) == 0 ];
then
  echo "gcloud image"
  cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin
  faas template pull https://gitlab.com/showcase-public/custom-templates.git
  faas deploy -f stack.yml > /tmp/status
  if [ $? -eq 0 ]
  then
    sleep 5
    faas describe "${name}" > /tmp/status
    /bin/sh /tmp/updatestatus.sh 'Running' "Deployed successfully. `cat /tmp/status`" $server_url $pproject
  else 
    /bin/sh /tmp/updatestatus.sh ' ' "Some error occured. Deployment unsuccessful. `cat /tmp/status`" $server_url $pproject
  fi
else
  #pull templates
  /bin/sh /tmp/updatestatus.sh ' ' 'Collating all files ...' $server_url $pproject
  cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin
  faas template pull https://gitlab.com/showcase-public/custom-templates.git

  #prepare dockerfile
  if [ -f "./stack_hr.yml" ] ; then /bin/sh updatestatus.sh ' ' 'Preparing instance with your latest changes incorporated now...' $server_url $pproject ; faas deploy -f stack_hr.yml 2>$project_dir/hotstarterr ; if [ ! -s "$project_dir/hotstarterr" ] ; then sleep 5 ; /bin/sh updatestatus.sh 'Running' "Deployed successfully." $server_url $pproject ; fi ; fi
  faas build --shrinkwrap -f stack.yml 2>$project_dir/builderr
  if [ ! -f "./stack_hr.yml" ] ; then /bin/sh updatestatus.sh ' ' 'Preparing instance with your latest changes incorporated now...' $server_url $pproject ; fi

  #gcloud build
  gcloud config set project production-servers-228902
  echo "build starting"
  (cd build/$fn_name && gcloud builds submit --tag gcr.io/production-servers-228902/$fn_name:latest --verbosity=debug --timeout "1h" >$project_dir/builderror && touch $project_dir/buildsuccess) || echo "build failed"
  echo "build done"
  time=$(date +%s)
  /bin/sh $project_dir/updatetime.sh "$time" $server_url $servingproject
  # echo "return data: `cat $project_dir/buildsuccess`"
  #check for build and deployment success
  #if [ -e $project_dir/buildsuccess ] && [ -f "$project_dir/stack_hr.yml" ] ; then /bin/sh $project_dir/updatestatus.sh 'Running' "deployed successfully. image is ready" $server_url $pproject ; fi
  if [ -e $project_dir/buildsuccess ] && [ ! -f "$project_dir/stack_hr.yml" ] ; then cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin && faas template pull https://gitlab.com/showcase-public/custom-templates.git && (faas deploy -f $project_dir/stack.yml >> $project_dir/deployerror 2>&1 && touch $project_dir/deploysuccess && sleep 5 && faas describe $fn_name >$project_dir/deploystatus && /bin/sh updatestatus.sh 'Running' "Deployed successfully. `cat $project_dir/deploystatus`" $server_url $pproject) || echo "deploy failed" && sleep 5 && faas describe $fn_name >$project_dir/deploystatus && /bin/sh updatestatus.sh 'Running' "Deployed successfully. `cat $project_dir/deploystatus`" $server_url $pproject ; fi
  if [ ! -e $project_dir/buildsuccess ] && [ ! -f "$project_dir/stack_hr.yml" ] ; then /bin/sh $project_dir/updatestatus.sh ' ' "Error occured in building Docker image. `tail -n 32 builderror`" $server_url $pproject ; exit 0 ; fi
  if [ ! -e $project_dir/deploysuccess ] && [ ! -f "$project_dir/stack_hr.yml" ] ; then /bin/sh $project_dir/updatestatus.sh ' ' "Error occured in deploying Docker image. `cat deployerror`" $server_url $pproject ; exit 0 ; fi
  echo "status done"
fi

rm -rf ~/templates/$servingproject ~/workspace/$servingproject






