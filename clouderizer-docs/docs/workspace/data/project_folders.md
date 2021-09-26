Clouderizer, by default, creates a folder named clouderizer under the user home directory on any machine it is run. This folder contains sub-folders for each individual project that is run on this machine. Inside each project folder are 3 important folders, data, code and output


We shall now go through each of these folders one by one.

## Data
Data is the directory which expects to house data involved in a project. This can be training/test/validation data or any other kind of static file that our project might need. By default, this path follows this schema
``~/clouderizer/<ProjectName>/data/``

Datasets specified in URL Datasets and Kaggle Datasets get downloaded to data folder on the machine where the project is run for first time. After first run, data folder is backed and synced to your Google Drive, so that any changes you make while your project is running is persisted and ready for next run.

## Code
Code is the directory which houses our project files. These can be source code, scripts, practically all kinds of files that you have created/assembled to make our project work. By default, this path follows this schema
~/clouderizer/<ProjectName>/code/

CODE field allows us to specify any Git URL to initialise code folder whenever project runs on a machine. In case URL Git authentication, we can press Auth button inside the input box to provide those credentials. Code is downloaded from Git on first run. After first run, this folder is backed and synced to your Google Drive, so that any changes you make while your project is running is persisted and ready for next run.

## Out
Out is the directory where output of our project should be saved. Output like model weights, intermediate check points should be saved in this directory. This directory also gets synced to Google Drive, allowing you to save your models during your experiments.
