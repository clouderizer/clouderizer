#!/bin/bash

USER=$(whoami)
echo $USER  
i="default-jre"
if ! dpkg-query -W -f='${Status}' $i 2>/dev/null | grep -q "ok installed"; then
    echo "$i is not installed, installing...";
    sudo apt-get --assume-yes install "$i";
else
    echo "The $i package has already been installed.";
fi
wget -q -NS --content-disposition "#BASE_URL#/giveme_machineinitjar" &> /dev/null
IS_TEST=false BASE_URL=#BASE_URL# java -jar machineclient.jar #PROJECT_KEY# &> /tmp/machineclient.out