!!! tip
    Borrow from https://towardsdatascience.com/kaggle-on-google-colab-easiest-way-to-transfer-datasets-and-remote-bash-e54c64054faa

Clouderizer has come up with an integration with official Kaggle CLI to address this issue. One just need to specify the names of Kaggle competitions or datasets at time of creating Clouderizer project. 
Clouderizer would then automatically download appropriate files and datasets, on any machine project is run, every time the project is run.

* Login to your [Kaggle](https://www.kaggle.com/) account and go to My Account -> API and Create New API Token. This will download your API token file, kaggle.json, on your machine.
* In case you don’t have one already, [sign up](https://console.clouderizer.com/auth/register) for a free Clouderizer account.
* Now login to your [Clouderizer](https://console.clouderizer.com) console and go to Settings -> Cloud Setting -> Kaggle Credentials. Choose kaggle.json file downloaded in step 1 and press Upload Kaggle Credentials.


This will link your Kaggle account with Clouderizer, allowing you to auto download Kaggle datasets in your projects.

