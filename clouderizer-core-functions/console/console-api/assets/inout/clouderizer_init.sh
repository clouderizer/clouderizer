USER=$(whoami)
if [ -f /.dockerenv ]
then
    COLAB="True"
fi

DOCKER_IMAGE=$1

if [ "$COLAB" != "True" ]
then
  ALL_USERS=$(awk -F'[/:]' '{if ($3 >= 1000 && $3 != 65534) print $1}' /etc/passwd)
  #taking first user from the list of users capabile of logging in
  MY_USER=$(echo $ALL_USERS | awk '{print $1}')
  if [ "$MY_USER" == "" ]; then
      echo System not ready yet
      sudo apt-get --assume-yes install "at";
      at now + 1 minutes <<< "su -c './clouderizer_init.sh'"
      exit 0
  fi

  if [ "$USER" == "root" ]; then
    echo Running as root
    if id $MY_USER >/dev/null 2>&1; then
      echo "$MY_USER exists, launching again as $MY_USER"
      #move yourself to tmp
      mv clouderizer_init.sh /tmp/
      sudo chown $MY_USER:$MY_USER /tmp/clouderizer_init.sh
      #sudo chmod go-w /tmp/clouderizer_init.sh
      #sudo chmod go+rX /tmp/clouderizer_init.sh 
      su -c "bash /tmp/clouderizer_init.sh $DOCKER_IMAGE" -l $MY_USER
      exit 0
    else
      echo "$MY_USER does not exist :(, lets continue..."
    fi
  else 
    echo "Running as $MY_USER (not root), lets continue..."
  fi
fi

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
    echo "$1"
    if [ "$1" != "" ]; then
    sudo docker run -v /mnt/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# "$1" \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    else
    sudo docker run -v /mnt/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# clouderizer/ubuntu:cpu-august2019 \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    fi
  fi
}

start_gpu_docker() {
  if sudo docker ps --filter "name=cldz_#PROJECT_KEY#" --filter status=running | grep cldz_#PROJECT_KEY#
  then 
    echo "This project is already running."
  elif sudo docker ps --filter "name=cldz_#PROJECT_KEY#" --filter status=exited | grep cldz_#PROJECT_KEY#
  then
    send_status "Starting Docker container"
    sudo docker start cldz_#PROJECT_KEY#
  else
    send_status "Downloading Docker image"
    echo "$1"
    if [ "$1" != "" ]; then
    sudo nvidia-docker run -v /mnt/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# $1 \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    else
    sudo nvidia-docker run -v /mnt/#PROJECTID#/:/content/clouderizer/#PROJECT_NAME#/ -l project_key=#PROJECT_KEY# -i -d --shm-size 8G --name cldz_#PROJECT_KEY# rohanricky/cldz_baseimage:nov25 \
      bash -c "wget -NS --content-disposition $BASE_URL/givemedockerinitsh/#PROJECT_KEY# && bash ./docker_init.sh"
    #workaround as shutdown script is not working for GCP Ubuntu 16.04 GPU machines
    echo "if ( curl -silent 'http://metadata.google.internal/computeMetadata/v1/instance/preempted?wait_for_change=true' -H 'Metadata-Flavor: Google' | grep TRUE ) ; then wget --post-data 'projectkey=#PROJECT_KEY#&log=GCP Cloud instance got pre-empted! Project will now stop.' https://console.clouderizer.com/api/projectlog/log &> /dev/null; fi" | nohup bash &
    fi
  fi
}



if [ "$COLAB" == "True" ]
then
{
  wget -NS --content-disposition $BASE_URL'/givemecolabinitsh/#PROJECT_KEY#' 
} > /tmp/cldz1.out 2>/tmp/cldz1.err
bash ./colab_init.sh
  
else
  sudo apt-get update
  if ! which docker
  then
  #install docker if not installed
  send_status "Installing Docker"
  sudo apt-get -y install \
      apt-transport-https \
      ca-certificates \
      curl \
      software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"
  sudo apt-get update
  sudo apt-get install -y docker-ce
  fi

  #check to see if GPU is available
  if lspci | grep -i nvidia
  then
  #nvidia-docker is only supported for 14.04, 16.04, 18.04
  
  #first check if GPU drivers are installed or not
  if ! which nvidia-smi
  then
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    if [ "$distribution" == "ubuntu18.04" ]
    then
      echo ************************************************************
      echo Warning. No GPU driver detected on Ubuntu 18.04
      echo Warning. GPU setup support on Ubuntu 18.04 not available as of now.
      echo Starting CPU docker
      echo ************************************************************
      send_status "Ubuntu 18.04 - GPU not supported"
      start_cpu_docker "$DOCKER_IMAGE"
      exit 0
    fi
    send_status "Installing Nvidia drivers"
    curl -O https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1604/x86_64/cuda-repo-ubuntu1604-10-0-local-10.0.130-410.48_1.0-1_amd64.deb
    # sudo dpkg -i cuda-repo-ubuntu1604_8.0.61-1_amd64.deb
    # sudo apt-get update
    # sudo apt-get install -y cuda-8-0
    sudo dpkg -i cuda-repo-ubuntu1604-10-0-local-10.0.130-410.48_1.0-1_amd64.deb
    sudo apt-get update
    sudo apt-get install -y cuda
  fi

  #now check if nvidia-docker is installed or not
  if ! which nvidia-docker
  then
  # install nvidia-docker if not installed
  # Add the package repositories
  send_status "Installing Nvidia Docker"
  curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | \
    sudo apt-key add -
  distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
  
  #nvidia-docker is only supported for 14.04, 16.04, 18.04
  if [ "$distribution" != "ubuntu14.04" -a "$distribution" != "ubuntu16.04" -a "$distribution" != "ubuntu18.04" ]
  then
    distribution=ubuntu16.04
  fi

  curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list
  sudo apt-get update

  # Install nvidia-docker2 and reload the Docker daemon configuration
  sudo apt-get install -y nvidia-docker2
  sudo pkill -SIGHUP dockerd
  fi
    start_gpu_docker "$DOCKER_IMAGE"
  else
    start_cpu_docker "$DOCKER_IMAGE"
  fi

  # #Add code here to start NODE service
  # HOME_DIR=$(getent passwd "$USER" | cut -d: -f6)
  # send_status "Downloading node service setup"
  # wget -q -NS --content-disposition $BASE_URL"/givemeinitjar" &> /dev/null
  # wget -q -NS --content-disposition $BASE_URL"/givemeinstallservice" &> /dev/null
  # wget -q -NS --content-disposition $BASE_URL"/givemeserviceconf" &> /dev/null

  # #set this for all services as well
  # sudo systemctl set-environment BASE_URL=$BASE_URL

  # sudo service ssh restart
  # send_status "Starting clouderizer node service"
  # sudo sh ./install_clouderizer_service.sh #COMPANY_ID# $USER $HOME_DIR"/.clouderizer_path" NODE

fi

