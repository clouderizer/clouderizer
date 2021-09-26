#!/bin/bash

# Installer should run as root in order to successfully install Clouderizer Service
if [ "$EUID" -ne 0 ]
  then echo "Permission denied. Please run as root."
  exit 126
fi

# ABSDIR is the absolute path where the installer is placed.
ABSDIR="$(dirname $(readlink -f $0))"

# Check if systemd is installed.
SYSTEMDBIN="$(type -p systemctl)"
if [ -z "$SYSTEMDBIN" ]; then
    echo This installer is not supported on this platform.
    exit 127
fi

# Check if Java is installed.
JAVABIN="\/usr\/bin\/java"
# if [ -z "$JAVABIN" ]; then
#     echo Java Not Found. Please Install JRE/JDK 1.7 or above and continue installation process
#     exit 127
# else
#     echo Found java executable in PATH $JAVABIN
# fi

# Check if systemd service is available
if [ ! -d "/lib/systemd/system" ]; then
    echo Cannot find /lib/systemd/system to install Service
    exit 1
fi

# Put Clouderizer releated files in an approprite directory
WORKDIR="/usr/share/java"
if [ -d "$WORKDIR" ]; then
    echo Clouderizer files will be installed to $WORKDIR/clouderizer
else
    # TODO: Add more dirs here, like /usr/local or /var/local
    echo $WORKDIR does not exist
    exit 1
fi

# Check if destination directory already exists
WORKDIR="$WORKDIR/clouderizer"
if [ -d "$WORKDIR" ]; then
    echo Destination directory already exists.
    # read -p "Do you wish to overwrite existing nix? (y/n) : " yn
    # case $yn in
    #     [Yy]* ) echo Overwriting existing Clouderizer installation;;
    #     [Nn]* ) exit 2;;
    #     * ) exit 2;;
    # esac
else
    mkdir $WORKDIR
fi

# Fix permissions and ownership of Clouderizer directory
if [ -d "$WORKDIR" ]; then
    chmod -R 0750 $WORKDIR
    chown $2:$2 $WORKDIR
else
    echo Cannot create directory $WORKDIR
    exit 1
fi

# Prepare the list of file to be copied
CLOUDERIZERJARFILE_S="$ABSDIR/clouderizer.jar"
CLOUDERIZERSERVICEFILE_S="$ABSDIR/clouderizer.service"

CLOUDERIZERJARFILE_D="$WORKDIR/clouderizer.jar"
CLOUDERIZERSERVICEFILE_D="/lib/systemd/system/clouderizer.service"

# Copy Files
cp -f $CLOUDERIZERJARFILE_S $CLOUDERIZERJARFILE_D
cp -f $CLOUDERIZERSERVICEFILE_S $CLOUDERIZERSERVICEFILE_D

rm -f $CLOUDERIZERJARFILE_S
rm -f $CLOUDERIZERSERVICEFILE_S

chmod 0640 $CLOUDERIZERJARFILE_D
chown $2:$2 $CLOUDERIZERJARFILE_D

chmod 0640 $CLOUDERIZERSERVICEFILE_D
chown $2:$2 $CLOUDERIZERSERVICEFILE_D

#Check Clouderizer Service
if [ $(systemctl -q is-active clouderizer) ]; then
    echo Clouderizer service is Active. Stopping Clouderizer service.
    service clouderizer stop
else
    echo Clouderizer service is not running.
fi

# Save details in config file
echo Updating configuration files
echo Project ID is $1

STARTCMD=$JAVABIN" -jar $CLOUDERIZERJARFILE_D $1"
STARTCMD=$(echo "$STARTCMD" | sed 's/\//\\\//g')
WORKDIRESC=$(echo "$WORKDIR" | sed 's/\//\\\//g')
ENVFILEESC=$(echo "$3" | sed 's/\//\\\//g')

echo start commnd is $STARTCMD
echo work dir is $WORKDIRESC

sed -i "s/\("WorkingDirectory" *= *\).*\$/\1"$WORKDIRESC"/" $CLOUDERIZERSERVICEFILE_D
#sed -i "s/\("ExecStart" *= *\).*\$/\1"$STARTCMD"/" $CLOUDERIZERSERVICEFILE_D
sed -i "s/#PROJECT_KEY#/"$1"/1" $CLOUDERIZERSERVICEFILE_D
sed -i "s/#USER#/"$2"/1" $CLOUDERIZERSERVICEFILE_D
sed -i "s/#ENV_FILE#/"$ENVFILEESC"/1" $CLOUDERIZERSERVICEFILE_D

systemctl daemon-reload
systemctl enable clouderizer.service
service clouderizer start
service clouderizer status
