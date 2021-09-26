## Clouderizer Drive
Clouderizer Drive is a cloud storage which is used to back up project data/code/output in cloud. Users can enable this by linking their Google Drive with Clouderizer. For every project we create, a code/data/out directory is created in Clouderizer Drive automatically.

## Sync Up
While a clouderizer project is running on a machine, its code, data and out folders are synced up to Clouderizer Drive every minute. This sync does not delete any files on Clouderizer Drive. It only copies new and modified files from local folders to Clouderizer.
This Sync Up helps us to backup our work, any local changes done on code files, datasets, model weights and checkpoints.

## Sync Down
While a project is running on a machine, its data folder is synced down from Clouderizer Drive every two minutes. This sync does not delete any files locally on the machine. It only copies new and modified files from Clouderizer Drive to local machine.
This Sync Down helps us to transfer datasets (or any other kind of data) to our machine running the project. At any point of time we just need to upload our datasets to the data folder of our project on Google Drive. Within two minutes this data will be downloaded in data folder of our project on the machine where project is running.

## Project First start

Whenever Clouderizer project is started for first time after creation, code and data folders are downloaded from sources specified in project settings (Git URL / Kaggle Dataset / URL Datasets). These downloaded files are then completely backed up to the project folder on Google Drive. Any changes made by user on these folders also get synced up to Google Drive.

## Project Subsequent starts

Every time Clouderizer projects are run subsequently, code, data and out folders are downloaded from Google Drive (instead of original source) with your latest changes. Any changes made by user on these folders get synced up to Google Drive for persistence.