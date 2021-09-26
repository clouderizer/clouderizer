**Q1. My project was working fine so far. Today I am not able to access Jupyter Notebook or Terminal. I get Bad Gateway error.**

Google Colab notebooks have an idle timeout of 90 minutes and absolute timeout of 12 hours. This means, if user does not interact with his Google Colab notebook for more than 90 minutes, its instance is automatically terminated. Also, maximum lifetime of a Colab instance is 12 hours. Once instance dies abruptly, sometimes your Clouderizer console might not be able to auto update the status of your project and it can continue to show as running. When you try to access Jupyter or Terminal for this project, it errors out. Reloading the Clouderizer page or refreshing project data, should update project status correctly to Not Running. The project needs to be run again, using startup command, on Colab notebook, to allocate a fresh instance.

**Q2. When I run fast.ai project on Google Colab, check for cuda and cudnn is coming false.**

On your Colab notebook go to Runtime -> Change Runtime Type and verify if Hardware Accelerator is GPU.

**Q3. I used community template for fast.ai course and it works perfectly for dogsandcats dataset. How do I automatically download other datasets from fast.ai course to my project?**

You can add Kaggle dataset or direct URLs for downloading addtional datasets.
See this article for Kaggle dataset.
For URLs, go to your project settings -> WORKSPACE -> Load Data from, paste the new URLs here and press enter to add to list. Save this project. 
Now when this project is launched, all the Kaggle and URL datasets specified will be auto downloaded.

**Q3. Running Clouderizer command on Google Colab gives syntax error.**

Clouderizer command is a bash script. In order to execute this script on Colab notebook, we need to pre-pend ! before the script e.g.
!wget -NS --content-disposition "https://console.clouderizer.com/givemeinitsh/XXXXXX" && bash ./clouderizer_init.sh

