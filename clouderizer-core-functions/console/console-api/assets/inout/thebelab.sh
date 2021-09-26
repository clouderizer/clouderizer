
BASE_URL="#BASE_URL#"

send_status() {
    curl -X POST --data "userid=#USERID#" --data "jupyterStatus=${1}" "$BASE_URL/api/user/updatejupyterstatus"
}

start_cpu_docker() {
  if sudo docker ps --filter "name=cldz_sc_env_#USERID#" --filter status=running | grep cldz_sc_env_#USERID#
  then 
    echo "This project's already running. Restarting it!"
    sudo docker restart cldz_sc_env_#USERID#
  elif sudo docker ps --filter "name=cldz_sc_env_#USERID#" --filter status=exited | grep cldz_sc_env_#USERID#
  then
    send_status "Starting"
    echo "The container stopped. Starting it again!"
    sudo docker start cldz_sc_env_#USERID#
    sleep 5
    send_status "Running"
  else
    mkdir -p ~/cldz/showcase/#USERID#/
    #Download bash shell into this folder
    cd ~/cldz/showcase/#USERID#/
    rm -rf pythonscore_init.sh
    curl -s $BASE_URL"/givemepythonscoresh" >> pythonscore_init.sh
    if [ "$1" != "" ]; then
         send_status "Starting"
         sudo docker run -i -d -v ~/cldz/showcase/#USERID#/:/showcase_files/ --restart=on-failure -p #PORT#:#PORT# --shm-size 8G --name cldz_sc_env_#USERID# "$1" \
         bash /showcase_files/pythonscore_init.sh #USERID# $BASE_URL #PORT#
    else
        send_status "Starting"
        sudo docker run -i -d -v ~/cldz/showcase/#USERID#/:/showcase_files/ --restart=on-failure -p #PORT#:#PORT# --shm-size 8G --name cldz_sc_env_#USERID# clouderizer/cldz_serving_env:python_env \
        bash /showcase_files/pythonscore_init.sh #USERID# $BASE_URL #PORT#
    fi
  fi
}

start_cpu_docker
