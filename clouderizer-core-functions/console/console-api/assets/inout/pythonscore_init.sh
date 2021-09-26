server_url=$2
port=$3
user=$(curl -X GET "${server_url}/api/user/findpipPackages/${1}")

echo $user

curl -X POST --data "userid=$1" --data "jupyterStatus=Installing" "$server_url/api/user/updatejupyterstatus"

pipPackages=$(echo $user | jq '.pipPackages')
pipPack=($(echo $pipPackages | jq '.[]' | sed 's/"//g'))

if [ ${#pipPack[@]} -ne 0 ];
then
    for i in "${pipPack[@]}";
    do
        pip3 install $i
    done
fi

curl -X POST --data "userid=$1" --data "jupyterStatus=Running" "$server_url/api/user/updatejupyterstatus"
jupyter notebook --allow-root --NotebookApp.token=test-secret --NotebookApp.ip=0.0.0.0  --NotebookApp.allow_origin='*' --NotebookApp.open_browser=False --NotebookApp.port=$port