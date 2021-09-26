DOCKER_IMAGE=$1

BASE_URL="#BASE_URL#"
send_status() {
    wget --post-data "projectkey=#PROJECT_KEY#&status=\"$1\"" $BASE_URL/api/project/updatestatus &> /dev/null
}

start_cpu_docker() {
  if sudo docker ps --filter "name=cldz_#PROJECT_KEY#" --filter status=running | grep cldz_#PROJECT_KEY#
  then 
    echo "This project is already running."
  elif sudo docker ps --filter "name=cldz_#PROJECT_KEY#" --filter status=exited | grep cldz_#PROJECT_KEY#
  then
    send_status "Starting Docker container"
    sudo docker start cldz_#PROJECT_KEY#
  else
    send_status "Downloading Docker image"
    mkdir -p ~/cldz/#PROJECTID#/
    echo "$1"
    if [ "$1" != "" ]; then
    sudo docker run -v ~/cldz/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# "$1" \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    else
    sudo docker run -v ~/cldz/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# clouderizer/ubuntu:cpu-august2019 \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    fi
  fi
  
}

start_cpu_docker "$DOCKER_IMAGE"

