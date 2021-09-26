if [ "$1" = " " ]
then
payload='{"status_message":"base64#'`echo $2 | base64 -w 0`'"}'
else
payload='{"status":"'$1'","status_message":"base64#'`echo $2 | base64 -w 0`'"}'
fi
url="$3/api/publishedservingproject/$4"
echo $payload
echo $url
curl -X PUT -H "Content-Type: application/json" -d "$payload" "$url"