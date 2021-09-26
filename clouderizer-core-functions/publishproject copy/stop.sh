function usage()
{

  echo "Requires project json string :"

}

if [ "$1" = "" ];then
    usage
    exit 1
fi

####### TOP LEVEL DESIGN ##############
# if production branch present, merge. If merge caused not committ, do faas-cli deploy on your own
# if not present create that branch and push master code there.
# post merge, poll to check github CI/CD build status
# post successful build, poll to check faas-cli function status
# once fucntion is in ready state call back the server
# in case of any errors report back the error to server
####### TOP LEVEL DESIGN ##############
rm -rf ~/templates ~/workspace
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
  faas remove $fn_name > /tmp/status
  if [ $? -eq 0 ]
  then
    /bin/sh /tmp/updatestatus.sh 'Not Running' 'Stopped successfully.' $server_url $pproject
  else
    /bin/sh /tmp/updatestatus.sh ' ' 'Some error occured. Stop unsuccessful.' $server_url $pproject
  fi
done