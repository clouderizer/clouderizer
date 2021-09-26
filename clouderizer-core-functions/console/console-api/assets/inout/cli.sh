BASE_URL=#BASE_URL#
FILE_NAME=#FILE_NAME#

shopt -s expand_aliases

OS="`uname`"

cd $HOME

if [[ ! -d $HOME ]]
then
    HOME=~
fi

if [[ $OS =~ 'Linux' && ! -f $HOME/.bash_aliases ]];
then
    touch $HOME/.bash_aliases
fi

if [ -x "$(which python3)" ] ; then
    DEFAULT_PYTHON=python3
elif [ -x "$(which python)" ]; then
    DEFAULT_PYTHON=python
else
    echo "python not found"
    exit 0
fi

# if python --version | grep "python 2"
# then
#     echo "python 2.x not compatible"
#     exit 0
# fi

if [ -x "$(which pip3)" ] ; then
    DEFAULT_PIP=pip3
elif [ -x "$(which pip)" ] ; then
    DEFAULT_PIP=pip
else
    echo "ERROR: pip executable not found"
    exit 0
fi

packages=(requests fire coolname prettytable pipreqs requirements-parser PyJWT pyfiglet)

echo "Installing packages"
for i in "${packages[@]}"; do
    if ! $DEFAULT_PIP list | grep $i; then
        echo "$i is not installed, installing...";
        yes | $DEFAULT_PIP -q install "$i" ;
    else
        echo "The $i package has already been installed.";
    fi
done

[ ! -d $HOME/.clouderizer ] && mkdir .clouderizer 
FILE_PATH=$HOME/.clouderizer/$FILE_NAME
wget -O $FILE_PATH $BASE_URL/givemeclipy

if [[ -f $HOME/.bash_profile ]]
then
    cat $HOME/.bash_profile | grep "alias cldz" > /dev/null 2>&1 && echo "" || echo "alias cldz='${DEFAULT_PYTHON} ${FILE_PATH}'" >> $HOME/.bash_profile

elif [[ -f $HOME/.bashrc ]]
then
    cat $HOME/.bashrc | grep "alias cldz" > /dev/null 2>&1 && echo "" || echo "alias cldz='${DEFAULT_PYTHON} ${FILE_PATH}'" >> $HOME/.bashrc

elif [[ -f $HOME/.profile ]]
then
    cat $HOME/.profile | grep "alias cldz" > /dev/null 2>&1 && echo "" || echo "alias cldz='${DEFAULT_PYTHON} ${FILE_PATH}'" >> $HOME/.profile

fi

# #check for zshrc in $HOME
if [[ -f $HOME/.zshrc && $OS =~ 'Darwin' ]]
then
    cat $HOME/.zshrc | grep "alias cldz" > /dev/null 2>&1 && echo "" || echo "alias cldz='${DEFAULT_PYTHON} ${FILE_PATH}'" >> $HOME/.zshrc
fi

if [[ -f $HOME/.bash_aliases ]]
then
    alias cldz >/dev/null 2>&1 && echo "cli ready!" || echo "alias cldz='${DEFAULT_PYTHON} ${FILE_PATH}'" >> $HOME/.bash_aliases
fi

echo "Open a fresh terminal session to access cldz"