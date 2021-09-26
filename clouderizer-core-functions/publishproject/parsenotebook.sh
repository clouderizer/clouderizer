input=$(echo "$1" | base64 -d)
server_url=$(echo $input | jq '.server_url' | sed 's/"//g')
#echo $server_url
company=$(echo $input | jq '.company' | sed 's/"//g')
file_path=$(echo $input | jq '.file_path' | sed 's/"//g')

PRESIGNED_URL_MODEL=$(curl -s -X POST --data "company=${company}" --data "type=get" --data "key=${file_path}" "${server_url}/api/awsconfig/generatepresignedurl" | jq '.urls[0]' | sed 's/"//g')
#echo $PRESIGNED_URL_MODEL
wget -O "notebook.ipynb" "${PRESIGNED_URL_MODEL}" &> /dev/null
# input=$(echo "$1" | base64 -d)
# input=$(echo "$1" | base64 -d | jq '.data')
# echo $input
# echo $input > notebook.ipynb
# rm requirements.txt
pipreqsnb --no-pin ./notebook.ipynb &> /dev/null
if [ -s "requirements.txt" ]; then
    a=$(cat requirements.txt)
    rm requirements.txt
else
    a=""
fi
echo $a