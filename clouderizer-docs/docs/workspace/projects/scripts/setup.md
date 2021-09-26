Very often ML projects require pre-define custom setup. Clouderizer offers a way to specify these custom setups as bash script in your project properties itself, so that these steps need not be repeated every time you start your project.

Under WORKSPACE tab, we can find Setup and Startup scripts.


Setup Script

Script specified under Setup is executed very early in your project startup. This is before your code and data is downloaded in the docker container. This section is useful for scripting setups like installing complex dependencies (like Anaconda, which cannot be specified as simple PIP or APT package).

