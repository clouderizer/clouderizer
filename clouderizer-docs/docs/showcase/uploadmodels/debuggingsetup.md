Clouderizer Showcase allows us to test our preprocessing, prediction and postprocessing code in the console itself. This testing requires a debugging env setup on your local machine. 

Pre-requisites

* Linux or Mac machines with Docker installed and running.
* Min. 4GB of RAM

Lets go over the steps needed for this setup.

1. Open your Showcase project and launch code editor for any of your pre-processing or prediction block.
![](../../img/prediction_codebutton.png)
*Figure 1 - Prediction code button*<br/>

2. First time, you see following message at the top of code editor window.
![](../../img/debuggingsetup_instruction.png)
*Figure 2 - Setup instructions*<br/>

3. Copy the curl command by pressing the copy button at the end of text box.
![](../../img/debugging_copycommand.png)
*Figure 3 - Copy command*<br/>

4. Open a terminal on your machine and paste the command copied above and press Enter.
![](../../img/debugging_terminal.png)
*Figure 4 - Run on terminal*<br/>

5. This should start the dev docker env on your machine. Once docker is up and running, switch back to Showcase console code editor view. It should detect the dev environment and show **Connected to Kernel**
![](../../img/debugging_connected.png)
*Figure 5 - Connected to kernel*<br/>

6. You can now test your code by pressing Run button. Output should appear on the right.

7. In case you have added some dependency pip package to your pre-process or prediction code, and want to install the same package in your debugging env as well, press the install button on the right of pip packages text list. You can see the progress of package installation from the output view.
![](../../img/debugging_installlibs.png)
*Figure 6 - Install dependencies*<br/>
