You can configure to automatically download code zip archive from any URL on project start. Following are the steps

* Login to your Clouderizer console.
* Create a new project or modify an existing project and go to WORKSPACE tab.
* Enter full http URL of the code zip archive.  

In case http url is behind Basic Authentication, you can specify the credentials by pressing **Auth** button toward the right end of Code input box.

Once you have saved the Clouderizer project with required code zip url, you can start this project on any machine of your choice. On start, Clouderizer will automatically download the specified code zip archive and save it inside **code** folder of clouderizer project. Clouderizer will automatically extract the .zip or .tar archive.

These code files are backed up in Google Drive in real time. Any changes made to these files are also automatically saved to Google Drive (with a latency of upto 1 minute).