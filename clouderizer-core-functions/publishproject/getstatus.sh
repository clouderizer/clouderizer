function usage()
{

  echo "Requires project json string :"

}

if [ "$1" = "" ];then
    usage
    exit 1
fi

rm -rf ~/templates ~/workspace
cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin

input=$(echo "$1" | base64 -d)
#echo $input
project=$(echo $input | jq '.project')
functions=$(echo $input | jq '.functions')
server_url=$(echo $input | jq '.server_url' | sed 's/"//g')
cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin
name=$(echo $project | jq '.name' | sed 's/"//g')
pproject=$(echo $project | jq '.id' | sed 's/"//g')

for row in $(echo "${functions}" | jq -r '.[] | @base64'); do
  _jq() {
    echo ${row} | base64 -d | jq -r ${1}
  }
  fn_type=$(_jq '.fn_type')
  fn_name=$(_jq '.name')
  faas describe $fn_name > /tmp/status
  /bin/sh /tmp/updatestatus.sh ' ' "`cat /tmp/status`" $server_url $pproject
done


