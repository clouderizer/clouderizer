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
server_url=$(echo $input | jq '.server_url' | sed 's/"//g')
project=$(echo $input | jq '.project')

name=$(echo $project | jq '.name' | sed 's/"//g')
#functions=$(echo $project | jq '.functions' | sed 's/"//g')
git_url=$(echo $project | jq '.giturl' | sed 's/"//g')
registryurl=$(echo $project | jq '.registryurl' | sed 's/"//g')
company=$(echo $project | jq '.company' | sed 's/"//g')
servingproject=$(echo $project | jq '.servingproject' | sed 's/"//g')
pproject=$(echo $project | jq '.id' | sed 's/"//g')

export git_username=$(cat /var/openfaas/secrets/gitlab | jq '.git_username' | sed 's/"//g')
export git_password=$(cat /var/openfaas/secrets/gitlab | jq '.git_password' | sed 's/"//g')

git config --global credential.helper '!f() { sleep 1; echo "username=${git_username}"; echo "password=${git_password}"; }; f'

git_url="https://${git_url}"
mkdir ~/workspace
cd ~/workspace

if ! git ls-remote --heads $git_url production | grep production
then
  # no production branch exists
  # git clone the master
  { 
    git clone $git_url
    cd ~/workspace/*                                                                    
    project_dir=$(pwd)  
    git checkout -b production
    git push -u $git_url production 
  } > /tmp/merge.txt
else
  # merge into production
  { 
    git clone $git_url
    cd ~/workspace/*                                                                    
    project_dir=$(pwd)  
    git checkout production
    git merge master
    git push -u $git_url production 
  } > /tmp/merge.txt
fi

echo "merge.txt : `cat /tmp/merge.txt`"

echo "Server URL : ${server_url}"
echo "PProjectID : ${pproject}"

if cat /tmp/merge.txt | grep -q "Already up to date"
then
  faas template pull https://gitlab.com/showcase-public/custom-templates.git
  cat /var/openfaas/secrets/faas-secret-key | faas login -u admin --password-stdin
  faas deploy -f ./stack.yml > /tmp/status
  if [ $? -eq 0 ]
  then
    sleep 5
    faas describe "${name}" > /tmp/status
    /bin/sh /tmp/updatestatus.sh 'Running' "Deployed successfully. `cat /tmp/status`" $server_url $pproject
  else 
    /bin/sh /tmp/updatestatus.sh ' ' "Some error occured. Deployment unsuccessful. `cat /tmp/status`" $server_url $pproject
  fi
fi

