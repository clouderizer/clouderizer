input=$(echo "$1" | base64 -d)

project=$(echo $input | jq '.project')

# query_invocation_count=$(echo $input | jq '.query_invocation_count'| sed 's/"//g')
# query_time_sum=$(echo $input | jq '.query_time_sum'| sed 's/"//g')


cust_query_invocation_count=$(echo $input | jq '.cust_query_invocation_count'| sed 's/"//g')
cust_query_time_sum=$(echo $input | jq '.cust_query_time_sum'| sed 's/"//g')

server_url=$(echo $input | jq '.server_url' | sed 's/"//g')
month_first=$(echo $input | jq '.month_first' | sed 's/"//g')
period=$(echo $input | jq '.period' | sed 's/"//g')
companyname=$(echo $input | jq '.companyname' | sed 's/"//g')


pproject=$(echo $project | jq '.id' | sed 's/"//g')
servingproject=$(echo $project | jq '.servingproject' | sed 's/"//g')
companyid=$(echo $project | jq '.company' | sed 's/"//g')
pprojectname=$(echo $project | jq '.name' | sed 's/"//g')

# checkinvdatequery="gateway_functions_seconds_sum%7Bfunction_name%3D%22$pprojectname.openfaas-fn%22%7D%5B${period}s%5D"
# checkinvdateexec=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$checkinvdatequery)

# value=$(jq -r ".data.result[0]" <<< "$checkinvdateexec");
# number=$(jq -r '.values[0][0]' <<< "$value");
# ex=$(echo $number'>'$month_first | bc -l)

# if [ $ex -eq 0 ]; then 
#     a=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$query_invocation_count)
#     e=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$query_time_sum)
# else
#     query_invocation_count="gateway_function_invocation_total%7Bfunction_name%3D%22$pprojectname.openfaas-fn%22%7D"
#     a=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$query_invocation_count)
#     query_time_sum="gateway_functions_seconds_sum%7Bfunction_name%3D%22$pprojectname.openfaas-fn%22%7D"
#     e=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$query_time_sum) 
# fi

custdatequery="gateway_functions_seconds_sum%7Bfunction_name%3D~%22$pprojectname.*.openfaas-fn%22%7D%5B${period}s%5D"
custdateexec=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$custdatequery)

value=$(jq -r ".data.result[0]" <<< "$custdateexec");
number=$(jq -r '.values[0][0]' <<< "$value");
ex=$(echo $number'>'$month_first | bc -l)

if [ $ex -eq 0 ]; then 
    c=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$cust_query_invocation_count)
    f=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$cust_query_time_sum)
   
else
    cust_query_invocation_count="gateway_function_invocation_total%7Bfunction_name%3D~%22$companyname.*.openfaas-fn%22%7D"
    c=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$cust_query_invocation_count)
    cust_query_time_sum="gateway_functions_seconds_sum%7Bfunction_name%3D~%22$companyname.*.openfaas-fn%22%7D"
    f=$(curl -G http://prometheus.openfaas.svc.cluster.local:9090/api/v1/query?query=$cust_query_time_sum)
    
fi

# sum_standard=0
# sum_highmemory=0
# sum_gpu=0
# count=0
custsum_standard=0
custsum_highmemory=0
custsum_gpu=0
custcount=0

# for i in $(jq '.data.result | keys | .[]' <<< "$a");
# do
#     value=$(jq -r ".data.result[$i]" <<< "$a");
#     number=$(jq -r '.value[1]' <<< "$value");
#     count=$((count+number))
# done

for i in $(jq '.data.result | keys | .[]' <<< "$c");
do
    value=$(jq -r ".data.result[$i]" <<< "$c");
    number=$(jq -r '.value[1]' <<< "$value");
    custcount=$((count+number))
done

# for j in $(jq '.data.result | keys | .[]' <<< "$e");
# do
#     value=$(jq -r ".data.result[$j]" <<< "$e");
#     number=$(jq -r '.value[1]' <<< "$value");
#     infratemp=$(jq -r '.metric' <<< "$value");
#     infra=$(echo $infratemp | jq '.infra_type' | sed 's/"//g')
#     if [ $infra == "gpu" ]; then
#         sum_gpu=$(echo "$sum_gpu + $number" | bc)
#     elif [ $infra == "standard" ]; then
#         sum_standard=$(echo "$sum_standard + $number" | bc)
#     elif [ $infra == "highmemory" ]; then
#         sum_highmemory=$(echo "$sum_highmemory + $number" | bc)
#     else
#         sum_standard=$(echo "$sum_standard + $number" | bc)
#     fi
# done

for j in $(jq '.data.result | keys | .[]' <<< "$f");
do
    value=$(jq -r ".data.result[$j]" <<< "$f");
    number=$(jq -r '.value[1]' <<< "$value");
    infratemp=$(jq -r '.metric' <<< "$value");
    infra=$(echo $infratemp | jq '.infra_type' | sed 's/"//g')
    if [ $infra == "gpu" ]; then
        custsum_gpu=$(echo "$custsum_gpu + $number" | bc)
    elif [ $infra == "standard" ]; then
        custsum_standard=$(echo "$custsum_standard + $number" | bc)
    elif [ $infra == "highmemory" ]; then
        custsum_highmemory=$(echo "$custsum_highmemory + $number" | bc)
    else
        custsum_standard=$(echo "$custsum_standard + $number" | bc)
    fi
done

# payload='{"id": "'$servingproject'","function_invocation_count":"'$count'", "function_time_sum_standard":"'$sum_standard'", "function_time_sum_highmemory":"'$sum_highmemory'", "function_time_sum_gpu":"'$sum_gpu'"}'
# url="$server_url/api/servingproject/updateprometheus"
# curl -X POST -H "Content-Type: application/json" -d "$payload" "$url"

payload='{"id": "'$companyid'","inv_count":"'$custcount'", "time_sum_standard":"'$custsum_standard'", "time_sum_highmemory":"'$custsum_highmemory'", "time_sum_gpu":"'$custsum_gpu'"}'
url="$server_url/api/customer/updateprom"
curl -X POST -H "Content-Type: application/json" -d "$payload" "$url"
