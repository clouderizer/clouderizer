Clouderizer, out of box, runs all its projects in a ML optimised docker container, pre-built with commonly used ML frameworks like pytorch, tensorflow, lua torch, etc. (except in case of Google Colab, which runs in a pre-built docker container by Google).

In case our pre-cooked docker image does not contain some dependency framework needed by your project, you can easily specify those packages in your project properties.

SETUP tab in Clouderizer project allows us to specify packages that we would like to get installed before our project runs on a machine. We can specify 2 kinds of packages here

* **Debian APT (Linux)**
* **Python PIP packages**  

To specify a package in any of these categories, we just need to bring respective input box in focus and type the name of the package and press enter to add it to list. We can specify multiple packages. Here is an example


Whenever Clouderizer project starts on a machine, it checks if the respective packages is already installed or not. If not, it will try to silently install it.

This is a very useful feature to automate your project setup, irrespective of where you run them. Environments like Google Colab or AWS Spot instance or GCP Pre-emptible VMs where we generally have to setup new machines very often, such automation can save lots of manual effort.

