DOCKER_IMAGE=$1

BASE_URL="#BASE_URL#"
send_status() {
    wget --post-data "status=${1}&servingid=#MODELID#&status_message=${2}" $BASE_URL/api/servingmodel/updatestatus &> /dev/null
}

start_cpu_docker() {
  if sudo docker ps --filter "name=cldz_sc_#SERVINGMODEL_KEY#" --filter status=running | grep cldz_sc_#SERVINGMODEL_KEY#
  then 
    echo "This project is already running. Restarting it!"
    send_status "Starting" "Getting your project instance ready"
    sudo docker restart cldz_sc_#SERVINGMODEL_KEY#
  elif sudo docker ps --filter "name=cldz_sc_#SERVINGMODEL_KEY#" --filter status=exited | grep cldz_sc_#SERVINGMODEL_KEY#
  then
    send_status "Starting" "Getting your project instance ready"
    sudo docker start cldz_sc_#SERVINGMODEL_KEY#
  else
    
    if [ ! -x "$(which wget)" ];
    then
      echo 'wget not installed, for linux: apt-get install wget, for mac:brew install wget'
      exit 0
    fi
    
    send_status "Starting" "Downloading Docker image"
    mkdir -p ~/cldz/showcase/#MODELID#/
    #Download bash shell and jar files into this folder
    cd ~/cldz/showcase/#MODELID#/

    wget -q -NS --content-disposition $BASE_URL"/givemeshowcasejar" &> /dev/null
    wget -q -NS --content-disposition $BASE_URL"/givemeshowcasesh" &> /dev/null
    echo "$1"
    curl -X POST --data "servingid=#MODELID#" --data "status=Starting" --data "status_message=Pulling showcase docker image" "${BASE_URL}/api/servingmodel/updatestatus"
    

    type=$(curl -X POST --data "servingid=#MODELID#" "${BASE_URL}/api/servingmodel/getsubtype" | sed 's/"//g')

    # echo $type
    
    if [ "$1" != "" ]; then
      sudo docker run -v ~/cldz/showcase/#MODELID#/:/showcase_files/ -l SERVINGMODEL_KEY=#SERVINGMODEL_KEY# -i -d --restart=on-failure --shm-size 8G --name cldz_sc_#SERVINGMODEL_KEY# "$1" \
        bash /showcase_files/init.sh #MODELID# $BASE_URL #PROJECTID#
      
    else
      if [ "$type" = "pythonscore" ] || [ "$type" = "" ]; then
        sudo docker run -v ~/cldz/showcase/#MODELID#/:/showcase_files/ -l SERVINGMODEL_KEY=#SERVINGMODEL_KEY# -i -d --restart=on-failure --shm-size 8G --name cldz_sc_#SERVINGMODEL_KEY# clouderizer/cldz_serving:python3.8 \
          bash /showcase_files/init.sh #MODELID# $BASE_URL #PROJECTID# 
      else
        sudo docker run -v ~/cldz/showcase/#MODELID#/:/showcase_files/ -l SERVINGMODEL_KEY=#SERVINGMODEL_KEY# -i -d --restart=on-failure --shm-size 8G --name cldz_sc_#SERVINGMODEL_KEY# clouderizer/cldz_serving:automl \
          bash /showcase_files/init.sh #MODELID# $BASE_URL #PROJECTID# 
      fi
    fi
  fi
  
}

curl -X POST --data "servingid=#MODELID#" --data "status=Starting" --data "status_message=Setting up environment.." "${BASE_URL}/api/servingmodel/updatestatus"

start_cpu_docker "$DOCKER_IMAGE"

