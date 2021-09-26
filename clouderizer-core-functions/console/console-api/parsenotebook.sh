# input=$(python parserequirements.py $1) &> /dev/null
# echo $1
input=$(echo "$1" | base64 -d)
# input=$(echo "$1" | base64 -d | jq '.data')
# echo $input
echo $input > notebook.ipynb
# rm requirements.txt
pipreqsnb --no-pin ./notebook.ipynb &> /dev/null
a=$(cat requirements.txt)
rm requirements.txt
echo $a
