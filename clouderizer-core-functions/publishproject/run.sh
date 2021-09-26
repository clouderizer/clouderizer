function usage()
{
  echo "Valid commands are publish and deploy"
}
cd /tmp
if [ "$1" = "publish" ];then
    bash publish.sh $2
    exit 0
fi

if [ "$1" = "deploy" ];then
    bash deploy.sh $2
    exit 0
fi

if [ "$1" = "getstatus" ];then
    bash getstatus.sh $2
    exit 0
fi

if [ "$1" = "prometheus" ];then
    bash prometheus.sh $2
    sleep 3
    exit 0
fi

if [ "$1" = "prometheus_multer" ];then
    bash prometheus_multer.sh $2
    sleep 3
    exit 0
fi

if [ "$1" = "parsenotebook" ];then
    bash parsenotebook.sh $2
    sleep 3
    exit 0
fi

if [ "$1" = "stop" ];then
    bash stop.sh $2
    exit 0
fi

if [ "$1" = "delete" ];then
    bash delete.sh $2
    exit 0
fi

if [ "$1" = "deleteimage" ];then
    bash deleteimage.sh $2
    exit 0
fi

usage
