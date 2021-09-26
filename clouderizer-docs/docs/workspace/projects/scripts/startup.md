Startup Script

Script specified under Startup is executed once project is almost setup and ready. This is after your code, data and output folders are fully downloaded and synced with your Google Drive. This section is useful for auto kickstarting our training or data regularisation activities. This script can accomodate long running tasks without any issues.

Startup Scripts are run in an independent tmux session, which means, it is possible to open and view this session anytime and evaluate its progress or troubleshoot any errors. Just open a remote terminal from the running project and type the following command to connect to startup tmux session
tmux a -t startup