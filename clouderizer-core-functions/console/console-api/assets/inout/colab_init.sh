echo "Great! Your Clouderizer project is initializing...it might take few minutes before it is ready."
echo ""
echo "**************************************************************************************"
echo "YOU SHOULD NOW SWITCH BACK TO CLOUDERIZER WEB PAGE TO START WORKING ON YOUR PROJECT"
echo "**************************************************************************************"
{
USER=$(whoami)

if [ -f /.dockerenv ]
then
    COLAB="True"
    CLDZ_LOCALE="C.UTF-8"
    echo Running inside Docker!
    if [ ! -d /content/ ]
    then
        mkdir /content/
    fi
    export HOME=/content
fi

if cat /proc/version | grep chrome-bot
then
    COLAB="True"
fi

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
    su -c "bash /tmp/clouderizer_init.sh" -l $MY_USER
    exit 0
  else
    echo "$MY_USER does not exist :(, lets continue..."
  fi
else 
  echo "Running as $MY_USER (not root), lets continue..."
fi

fi #COLAB == True

send_status() {
    wget --post-data "projectkey=#PROJECT_KEY#&status=\"$1\"" $BASE_URL/api/project/updatestatus &> /dev/null
}

SECONDS=0
start_time=$(date +"%D %T")
echo "$start_time Starting Clouderizer..."
echo "If you are running clouderizer for first time on this machine, it might take some time (~10 mins) to install all pre-requisite frameworks."

BASE_URL="#BASE_URL#"
#BASE_URL="http://192.168.1.5:1337"
#USER="$(whoami)"
#wget -NS --content-disposition 'https://9b87bff7.ngrok.io/givemeinitjar'
HOME_DIR=$(getent passwd "$USER" | cut -d: -f6)

if [ "$COLAB" == "True" ]
then
HOME_DIR="/content"
fi

cd $HOME_DIR

send_status "Downloading setup"
wget -q -NS --content-disposition $BASE_URL"/givemeinitjar" &> /dev/null
wget -q -NS --content-disposition $BASE_URL"/givemeinstallservice" &> /dev/null
wget -q -NS --content-disposition $BASE_URL"/givemeserviceconf" &> /dev/null

#CUDASETUP#
if [ "$CLOUDERIZER_CUDA" == "True" ]
then
    send_status "Installing CUDA"
    cd ~
    apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1704/x86_64/7fa2af80.pub | apt-key add - && \
    echo "deb http://developer.download.nvidia.com/compute/cuda/repos/ubuntu1704/x86_64 /" > /etc/apt/sources.list.d/cuda.list && \
    apt-get purge -y curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*


    CUDA_VERSION=9.0.176 && \
    CUDA_PKG_VERSION=9-0=$CUDA_VERSION-1

    apt-get update && apt-get install -y --no-install-recommends \
            cuda-cudart-$CUDA_PKG_VERSION && \
        ln -s cuda-9.0 /usr/local/cuda && \
        rm -rf /var/lib/apt/lists/*

    echo "/usr/local/nvidia/lib" >> /etc/ld.so.conf.d/nvidia.conf && \
    echo "/usr/local/nvidia/lib64" >> /etc/ld.so.conf.d/nvidia.conf


    PATH=/usr/local/nvidia/bin:/usr/local/cuda-9.0/bin:${PATH} && \
    LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64

    NVIDIA_VISIBLE_DEVICES=all && \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility && \
    NVIDIA_REQUIRE_CUDA="cuda>=9.0"

    apt-get update && apt-get install -y --no-install-recommends \
            cuda-libraries-dev-$CUDA_PKG_VERSION \
            cuda-nvml-dev-$CUDA_PKG_VERSION \
            cuda-minimal-build-$CUDA_PKG_VERSION \
            cuda-command-line-tools-$CUDA_PKG_VERSION && \
        rm -rf /var/lib/apt/lists/*


    LIBRARY_PATH=/usr/local/cuda/lib64/stubs:${LIBRARY_PATH}

    wget http://developer.download.nvidia.com/compute/redist/cudnn/v7.0.5/cudnn-8.0-linux-x64-v7.tgz
    tar -xzvf cudnn-8.0-linux-x64-v7.tgz
    cp cuda/include/cudnn.h /usr/local/cuda/include
    cp cuda/lib64/libcudnn* /usr/local/cuda/lib64
    chmod a+r /usr/local/cuda/include/cudnn.h
    # if [ "$COLAB" != "True" ]
    # then
    #     if ! dpkg-query -W cuda-8-0; then
    #     wget https://developer.nvidia.com/compute/cuda/8.0/Prod2/local_installers/cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64-deb
    #     sudo dpkg -i cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64-deb
    #     sudo apt-key add /var/cuda-repo-8-0-local-ga2/7fa2af80.pub
    #     sudo apt update
    #     sudo apt install cuda-8-0 -y
    #     fi
    #     nvidia-smi -pm 1
    #     export PATH=$PATH:/usr/local/cuda/bin
    #     echo 'PATH=$PATH:/usr/local/cuda/bin' >> ~/.profile
    #     sudo ln -s /usr/bin/gcc-5 /usr/local/cuda/bin/gcc 
    #     sudo ln -s /usr/bin/g++-5 /usr/local/cuda/bin/g++
    #     send_status "Installing CUDNN"
    #     wget http://developer.download.nvidia.com/compute/redist/cudnn/v7.0.5/cudnn-8.0-linux-x64-v7.tgz
    #     tar -xzvf cudnn-8.0-linux-x64-v7.tgz
    #     sudo cp cuda/include/cudnn.h /usr/local/cuda/include
    #     sudo cp cuda/lib64/libcudnn* /usr/local/cuda/lib64
    #     chmod a+r /usr/local/cuda/include/cudnn.h
    # else
    #     if ! dpkg-query -W cuda-8-0; then
    #     wget https://developer.nvidia.com/compute/cuda/8.0/Prod2/local_installers/cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64-deb
    #     dpkg -i cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64-deb
    #     apt-key add /var/cuda-repo-8-0-local-ga2/7fa2af80.pub
    #     apt update
    #     apt install cuda-8-0 -y
    #     fi
    #     nvidia-smi -pm 1
    #     export PATH=$PATH:/usr/local/cuda/bin
    #     echo 'PATH=$PATH:/usr/local/cuda/bin' >> ~/.profile
    #     echo 'PATH=$PATH:/usr/local/cuda-8.0/bin' >> ~/.profile
    #     echo 'export LD_PRELOAD=/usr/lib64-nvidia/libnvidia-ml.so' >> ~/.profile
    #     ln -s /usr/bin/gcc-5 /usr/local/cuda/bin/gcc 
    #     ln -s /usr/bin/g++-5 /usr/local/cuda/bin/g++
    #     send_status "Installing CUDNN"
    #     wget http://developer.download.nvidia.com/compute/redist/cudnn/v7.0.5/cudnn-8.0-linux-x64-v7.tgz
    #     tar -xzvf cudnn-8.0-linux-x64-v7.tgz
    #     cp cuda/include/cudnn.h /usr/local/cuda/include
    #     cp cuda/lib64/libcudnn* /usr/local/cuda/lib64
    #     chmod a+r /usr/local/cuda/include/cudnn.h
    # fi
fi

send_status "Installing apt packages"
declare -a aptpackages=("default-jre" "openssh-server" "tmux" "autossh" "locales" "zip" #APT_PACKAGES#);
if [ "$COLAB" != "True" ]
then
sudo apt-get --assume-yes update
else
apt-get --assume-yes update
fi

sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
update-locale LANG=en_US.UTF-8
for i in "${aptpackages[@]}"; do
     if ! dpkg-query -W -f='${Status}' $i 2>/dev/null | grep -q "ok installed"; then
        echo "$i is not installed, installing...";
        if [ "$COLAB" != "True" ]
        then
            sudo apt-get --assume-yes install "$i";
        else
            apt-get --assume-yes install "$i";
        fi  
    else
        echo "The $i package has already been installed.";
    fi
done

#install rclone
if [ "$COLAB" != "True" ]
then
    curl https://rclone.org/install.sh | sudo bash
else
    curl https://rclone.org/install.sh | bash
fi 
rm ./.config/rclone/rclone.conf
wget -q -NS --content-disposition $BASE_URL"/givemedrivemagic/#PROJECT_KEY#" &> /dev/null
mkdir -p ./.config/rclone
mv rclone.conf ./.config/rclone/

## put code to download metadata here
# mkdir  -p ~/clouderizer/#PROJECT_NAME#/.metadata
# touch ~/clouderizer/#PROJECT_NAME#/.metadata/.code
# touch ~/clouderizer/#PROJECT_NAME#/.metadata/.data
# rclone copy clouderizer:/#PROJECT_NAME#/.metadata ~/clouderizer/#PROJECT_NAME#/.metadata
#done rclone setup

#TORCHSETUP#
if [ "$CLOUDERIZER_TORCH" == "True" ]
then
    send_status "Installing Torch"
    cd ~
    APT_INSTALL="apt-get install -y --no-install-recommends" && \
    PIP_INSTALL="python -m pip --no-cache-dir install --upgrade" && \
    GIT_CLONE="git clone --depth 10" && \

    rm -rf /var/lib/apt/lists/* \
           /etc/apt/sources.list.d/cuda.list \
           /etc/apt/sources.list.d/nvidia-ml.list && \

    apt-get update && \
    DEBIAN_FRONTEND=noninteractive $APT_INSTALL \
        build-essential \
        ca-certificates \
        cmake \
        wget \
        git \
        vim \
        && \
    export TORCH_NVCC_FLAGS="-D__CUDA_NO_HALF_OPERATORS__" && \
    $GIT_CLONE https://github.com/torch/distro.git ~/torch --recursive && \
    cd ~/torch/exe/luajit-rocks && \
    mkdir build && cd build && \
    cmake -D CMAKE_BUILD_TYPE=RELEASE \
          -D CMAKE_INSTALL_PREFIX=/usr/local \
          -D WITH_LUAJIT21=ON \
          .. && \
    make -j"$(nproc)" install && \
    DEBIAN_FRONTEND=noninteractive $APT_INSTALL \
        libjpeg-dev \
        libpng-dev \
        libreadline-dev \
        && \

    $GIT_CLONE https://github.com/Yonaba/Moses ~/moses && \
    cd ~/moses && \
    luarocks install rockspec/moses-1.6.1-1.rockspec && \

    cd ~/torch && \
    sed -i 's/extra\/cudnn/extra\/cudnn \&\& git checkout R7/' install.sh && \
    sed -i 's/$PREFIX\/bin\/luarocks/luarocks/' install.sh && \
    sed -i '/qt/d' install.sh && \
    sed -i '/Installing Lua/,/^cd \.\.$/d' install.sh && \
    sed -i '/path_to_nvidiasmi/,/^fi$/d' install.sh && \
    sed -i '/Restore anaconda/,/^Not updating$/d' install.sh && \
    sed -i '/You might want to/,/^fi$/d' install.sh && \
    yes no | ./install.sh && \
    ldconfig && \
    apt-get clean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/* /tmp/* ~/*

    cd ~
    GIT_SSL_NO_VERIFY=true git clone https://github.com/soumith/cudnn.torch.git -b R7 
    cd cudnn.torch
    CC=gcc-5 CXX=g++-5 luarocks make cudnn-scm-1.rockspec
    export CUDNN_PATH="/usr/local/cuda/lib64/libcudnn.so.7"
    echo 'CUDNN_PATH="/usr/local/cuda/lib64/libcudnn.so.7"' >> ~/.profile
    echo *****************Installing CUTORCH*****************
    CC=gcc-5 CXX=g++-5 luarocks install cunn

    # if [ "$COLAB" != "True" ]
    # then
    #     curl -s https://raw.githubusercontent.com/torch/ezinstall/master/install-deps | bash
    #     git clone https://github.com/torch/distro.git ~/torch --recursive
    #     cd ~/torch
    #     yes | ./install.sh
    #     echo . ~/torch/install/bin/torch-activate >> ~/.profile
    #     source ~/.profile
        
    # else
    #     curl -s https://raw.githubusercontent.com/torch/ezinstall/master/install-deps | sed —expression='s/sudo//g' | bash
    #     git clone https://github.com/torch/distro.git ~/torch --recursive
    #     cd ~/torch
    #     yes | ./install.sh
    #     echo . ~/torch/install/bin/torch-activate >> ~/.profile
    #     source ~/.profile
        
    # fi
    # if [ "$CLOUDERIZER_CUDA" == "True" ]
    # then
    #     send_status "Installing CuTorch"
    #     cd ~
    #     git clone https://github.com/soumith/cudnn.torch.git -b R7 
    #     cd cudnn.torch
    #     CC=gcc-5 CXX=g++-5 luarocks make cudnn-scm-1.rockspec
    #     export CUDNN_PATH="/usr/local/cuda/lib64/libcudnn.so.7"
    #     echo 'CUDNN_PATH="/usr/local/cuda/lib64/libcudnn.so.7"' >> ~/.profile
    #     echo *****************Installing CUTORCH*****************
    #     CUDA_BIN_PATH=/usr/local/cuda-8.0 CC=gcc-5 CXX=g++-5 luarocks install cutorch
    #     CUDA_BIN_PATH=/usr/local/cuda-8.0 CC=gcc-5 CXX=g++-5 luarocks install cunn
    # fi
    send_status "Installing Torch packages"
    declare -a torchpackages=(#TORCH_PACKAGES#);
    for i in "${torchpackages[@]}"; do
        if ! luarocks list | grep $i; then
            echo "$i is not installed, installing...";
            yes | luarocks install "$i" ;
        else
            echo "The $i package has already been installed.";
        fi
    done
fi

#ANACONDASETUP#

if [ "$CLOUDERIZER_ANACONDA" == "True" ]
then

ANCONDA_PACKAGE="Anaconda3-5.0.1-Linux-x86_64.sh"
#install Anaconda Python if not already installed
if ! which conda | grep conda
then
send_status "Downloading Anaconda"
wget -nc "https://repo.continuum.io/archive/"$ANCONDA_PACKAGE -O $ANCONDA_PACKAGE
bash $ANCONDA_PACKAGE -b

#no su as conda has not propagated to ubuntu user yet
#conda upgrade -y --all 
fi

export PATH=~/anaconda3/bin:$PATH
send_status "Creating Anaconda environment"
conda create -y -n #CONDA_ENV_NAME# pip python=3.6
CONDA_ENV_NAME=#CONDA_ENV_NAME#
#source activate #CONDA_ENV_NAME#

if ! cat ~/.bash_profile | grep CONDA_ENV_NAME
then
echo 'PATH=$PATH:~/anaconda3/bin' >> ~/.bash_profile
echo 'source activate #CONDA_ENV_NAME#' >> ~/.bash_profile
echo 'CONDA_ENV_NAME=#CONDA_ENV_NAME#' >> ~/.bash_profile
fi

source ~/.bash_profile

send_status "Installing conda packages"
#install pre-requisite conda packages
declare -a condapackages=(#CONDA_PACKAGES#);
for i in "${condapackages[@]}"; do
     if ! conda list | grep "$i"; then
        echo "$i is not installed, installing...";
        conda install -y "$i"
    else
        echo "The $i package has already been installed.";
    fi
done

fi #CLOUDERIZER_ANACONDA == True

send_status "Installing PIP packages"
declare -a pippackages=("jupyterlab" #PIP_PACKAGES#);
pip2 install --upgrade pip
for i in "${pippackages[@]}"; do
     if ! pip2 list | grep $i; then
        echo "$i is not installed, installing...";
        yes | pip2 install "$i" ;
    else
        echo "The $i package has already been installed.";
    fi
done

jupyter serverextension enable --py jupyterlab --sys-prefix

# if [ "$CLOUDERIZER_TORCH" == "True" ]
# then

# curl -s https://raw.githubusercontent.com/torch/ezinstall/master/install-deps | sed —expression=’s/sudo//g’ | bash
# git clone https://github.com/torch/distro.git ~/torch --recursive
# cd ~/torch
# yes | ./install.sh
# echo . ~/torch/install/bin/torch-activate >> ~/.profile
# source ~/.profile


# fi

#KAGGLESETUP#
if [ "$KAGGLE" == "True" ]
then
send_status "Installing Kaggle API"
yes | pip install kaggle
cd ~
wget -q -NS --content-disposition $BASE_URL"/givemekagglecookie/#PROJECT_KEY#"
mkdir ~/.kaggle
mv kaggle.json ~/.kaggle
chmod 600 ~/.kaggle/kaggle.json
kaggle config set -n path -v #DATADIR#
# send_status "Downloading Kaggle datasets"
# declare -a kaggledatasets=(#KAGGLEDATASETS#)
# for i in "${kaggledatasets[@]}"; do
#     if kaggle competitions list -s "$i" | grep "$i"
#     then
#         kaggle competitions download -c "$i" --force
#     else 
#         kaggle datasets download -d "$i" --force
#     fi
# done

fi

#SERVESETUP#
if [ "$SERVESETUP" == "True" ]
then
    send_status "Setting up Clouderizer Serve"
    mkdir -p #PROJECTDIR#serve
    cd #PROJECTDIR#serve
    wget -q -NS --content-disposition https://s3.amazonaws.com/savebucksinout/clouderizer_serve.zip &> /dev/null
    unzip -o clouderizer_serve.zip
    sed -i "s/\/#PROJECT_ID_PLACEHOLDER#/\./1" ./static/index.html
    #sed -i "s/#PROJECT_ID_PLACEHOLDER#/#SERVE_ID#-MS/1" ./static/index.html
    sed -i "s/My Clouderizer Project/#PROJECT_NAME#/1" ./config.json
    
    # tmux new -d -s serve_clouderizer
    # tmux send -t serve_clouderizer.0 "cd #PROJECTDIR#serve; FLASK_APP=app.py FLASK_DEBUG=1 flask run;"
    # tmux send -t serve_clouderizer.0 ENTER
fi

send_status "Performing startup tasks"
echo STARTING PRE-STARTUP TASK
#INIT_STARTUP_CMD#
#echo \"PATH=\"$PATH > ~/.clouderizer_path
echo ENDING PRE-STARTUP TASK
cd ~
echo "PATH="$PATH > ~/.clouderizer_path
echo 'CONDA_ENV_NAME=#CONDA_ENV_NAME#' >> ~/.clouderizer_path
echo "BASE_URL="$BASE_URL >> ~/.clouderizer_path

if [ "$COLAB" == "True" ]
then
sed -i 's/PermitRootLogin/#PermitRootLogin/g' /etc/ssh/sshd_config
sed '$ a PermitRootLogin yes' -i /etc/ssh/sshd_config
sed '$ a Banner /etc/issue.net' -i /etc/ssh/sshd_config
echo "root:clouderizer" | chpasswd
#put up the default password on login screen
if ! cat /etc/issue.net | grep clouderizer
then
echo "Default ssh password for this instance is clouderizer" >> /etc/issue.net
fi

if ! cat /root/.profile | grep content
then
mkdir -p #PROJECTDIR#code && ln -s #PROJECTDIR#code /
mkdir -p #PROJECTDIR#data && ln -s #PROJECTDIR#data /
mkdir -p #PROJECTDIR#out && ln -s #PROJECTDIR#out /
echo "HOME=/content" >> /root/.profile
echo "cd #PROJECTDIR#code" >> /root/.profile
#echo "source /content/.profile" >> /root/.profile
#echo "source /content/.bashrc" >> /root/.profile
#CUDAPATH#
#TODO:cuda versions will change, update path
export PATH=$PATH:/usr/local/cuda-10.0/bin
echo 'PATH=$PATH:/usr/local/cuda-10.0/bin' >> /root/.profile
fi

# find if kaggle environment
if conda env list | grep -q "base"; then
CLDZ_PLAT="KAGGLE"
export LC_ALL=C.UTF-8
echo "export LC_ALL=C.UTF-8" >> /root/.bashrc
else
CLDZ_PLAT="COLAB"
fi


service ssh restart
send_status "Starting clouderizer service"
setup_end_time=$(date +"%D %T")
duration=$SECONDS
echo "$setup_end_time All setup done. Total Setup Time : $(($duration / 60)) minutes"
cd $HOME_DIR
if cat /proc/version | grep chrome-bot
then
BASE_URL=$BASE_URL CLDZ_HOME=$HOME_DIR CLDZ_LOCALE=$CLDZ_LOCALE CLDZ_PLAT=$CLDZ_PLAT java -jar clouderizer.jar #PROJECT_KEY# &
else
BASE_URL=$BASE_URL CLDZ_HOME=$HOME_DIR CLDZ_LOCALE=$CLDZ_LOCALE CLDZ_PLAT=$CLDZ_PLAT java -jar clouderizer.jar #PROJECT_KEY#
fi
sleep 10
echo "Starting Clouderizer service now..."
echo "******You can now login to Clouderizer console to remotely access this project.*******"
#check for WSL
elif ! cat /proc/version | grep Microsoft
then
#set this for all services as well
sudo systemctl set-environment PATH=$PATH
sudo systemctl set-environment BASE_URL=$BASE_URL

sudo service ssh restart
#this is for Theano error...need better place to put this later
sudo systemctl set-environment MKL_THREADING_LAYER=GNU
#(crontab -l 2>/dev/null; echo "* * * * * java -jar clouderizer.jar iterate #PROJECT_KEY# >> cron.out") | crontab -

send_status "Starting clouderizer service"
echo "All setup done. Starting Clouderizer service now..."
echo "******You can now login to Clouderizer console to remotely access this project.*******"
sudo sh ./install_clouderizer_service.sh #PROJECT_KEY# $USER $HOME_DIR"/.clouderizer_path"
else 
send_status "Starting clouderizer service"
sudo service ssh restart
echo "All setup done. Starting Clouderizer service now..."
echo "******You can now login to Clouderizer console to remotely access this project.*******"
BASE_URL=$BASE_URL nohup java -jar clouderizer.jar #PROJECT_KEY# &> /tmp/cldz.out &
fi
} > /tmp/cldz.out 2>/tmp/cldz.err