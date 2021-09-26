---
title: Quick Start
description: Guide to quickly get started with Cloudierzer
---

### Clouderizer CLI

#### Pre-requisites

1. System running MacOS / Ubuntu / Windows (with WSL)
2. bash / sh / zsh terminal
3. Python 3+
4. Pip for python3

#### Steps
1. Install Clouderizer CLI by running the following command in the terminal
```
pip install clouderizer
```
2. Login into your Clouderizer account using following command and following on-screen instructions
```
cldz login
```
3. Now cd into the directory where your notebook (say awesome-notebook.ipynb) resides. In case your notebook needs some specific libraries, put them in requirements.txt. Run the following command to deploy it on Clouderizer as Serverless function. Use –infra flag to deploy it as a GPU function.
```
cldz deploy awesome-notebook.ipynb requirements.txt --infra GPU
```
4. This command should push your notebook to cloud as serverless function and give you an http endpoint for the notebook. Something like this

NOTEBOOK AYSNC URL: ```https://serverless.clouderizer.com/async-function/awesome-notebook-func```

5. Congratulations!! Your notebook is now transformed into a serverless function.
You can invoke your notebook using curl command
```
curl -i -X POST -F param=XYZ https://serverless.clouderizer.com/async-function/awesome-notebook-func 
```

### Web Console

#### Pre-requisites

1. System with a modern browser like Chrome / FireFox / Safari / Edge
2. curl / postman / or any other http client

#### Steps
1. Sign up for a Clouderizer account from here and login into the web console from here.

2. Click on New Project to create your project and give it a name. Select type as Notebook and press Next.

3. Browse your notebook file (awesome-notebook.ipynb). In case your notebook needs some specific libraries, upload your requirements.txt file as well. Press Finish.

4. This will upload your notebook and create the project.

5. Press Deploy from top right corner of the screen. Select GPU from the infra type to deploy your notebook as a GPU function.

6. This should deploy your notebook as a serverless GPU function and you should see an http endpoint for your function in the status box in bottom left.

7. Congratulations!! Your notebook is now transformed into a serverless function. You can invoke your notebook using curl command
```
curl -i -X POST -F param=XYZ https://serverless.clouderizer.com/function/async/awesome-notebook-func
```

