payload='{"imagebuildtime":"'$1'"}'
url="$2/api/servingproject/$3"
echo $payload
echo $url
curl -X PUT -H "Content-Type: application/json" -d "$payload" "$url"