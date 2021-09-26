Google Colab offers free, easy access to Tesla K80 GPUs to anyone with a Google account.

We can run our projects on Google Colab instances with couple of manual steps, allowing us to automate our dependency setup, source and datasets download and remote Terminal, Jupyter, Tensorboard, Serving access. Below are the steps for this

1. Login to your Clouderizer console and create new project or edit an existing project.  
    *You can also clone a new project from one of our many cool Community Templates like Fast.ai, Tensorflow Object Detection, Kaggle Competition, etc*
2. Give project a name and press Next and fill up details on Setup and Workspace tab as per your project requirements. Finish the wizard.
3. You will now see the project in your project list. Press **Start** button for this project.
4. Select Colab from the list of platforms.
  
5. Press Launch Now. This will open a Colab notebook with a single cell. This cell contains bootstrap code for your project.
6. Run the above cell.
   
This should trigger automated Clouderizer project deployment on this instance. You can now switch back to Clouderizer console and see the progress of your project startup from here.

Once project status changes to Running, all your project dependencies, source code, datasets and custom startup scripts will be setup and you can start working.