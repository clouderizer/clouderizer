---
title: Introduction
description: Supported Models: "PMML, ONNX, Python, H2O.ai, Parameterized Jupyter Notebooks", Serverless Function Type: "GPU, High Memory"
---

Journey of a ML model from RnD stage (with a bunch of Data Scientists) to a fully managed production stage involves going through mulitple stages and touching multiple teams. Some of these stages are

1. Deploying the model
2. Testing the model (with new real life data, validation by other teams)
3. Integrating the model with existing business application
4. Monitoring and analysing the model performance with Ground Truth feedback
5. Re-Training the model (with new data), once performance drops
6. Re-deploying the new model version
7. Repeat from Step 4

Clouderizer Showcase helps teams through each of these stages and setup and deploy an automated pipeline for ML models. Showcase supports deploying and managing the following

### Parameterized Jupyter Notebooks

Clouderizer allows you to publish your local Jupyter Notebooks to cloud as Serverless Functions. Once deployed these serverless functions can be invoked using a simple curl command. Moreover, Clouderizer supports parameterized Notebooks using [Papermill](https://github.com/nteract/papermill). We can tag any cell in our notebook as *parameter* before deploying. Then while invoking the serverless function, we can pass any variable value in the http request as parameters.

As of now only Python kernel are supported in Jupyter Notebooks. R and Julia based kernel support is in works. In case you wish early access to this, please reach out to us at info@clouderizer.com

### H2O MOJO models

[H2O.ai](https://h2o.ai){.new-tab} helps businesses to create machine learning models to extract insights from their data, without having in-house expertise in designing and tuning such models. It is one of the most popular open source AutoML platforms helping Citizen Data scientists import their business data and easily create highly effective machine learning models from them. H2O.ai AutoML libraries can be used in Python or R. H2O also offers an advanced AutoML console called Driverless AI. 
H2O.ai models can be exported in a Java executable format called MOJO. 

You can upload these MOJO models into Clouderizer Showcase and deploy them. Clouderizer Showcase has deep integration with H2O MOJO scoring engine, such that, it can parse and score the models without requiring any custom code for pre-processing or prediction.

[Here](https://blog.clouderizer.com/?p=152) is an example illustrating MOJO model deployment. 

### PMML models

[PMML](http://dmg.org/pmml/v4-1/GeneralStructure.html)
PMML stands for "Predictive Model Markup Language". It is the de facto standard to represent predictive solutions. A PMML file may contain a myriad of data transformations (pre- and post-processing) as well as one or more predictive models.
Analytics platforms like Alteryx, RapidMiner, SaS, Dataiku have a direct way of exporting trained models in PMML. Models built using open source Python libs like sklearn, xgboost, lightGBM, etc, can also be exported to PMML using libraries like [nyoka](https://github.com/nyoka-pmml/nyoka).

You can upload these PMML models into Clouderizer Showcase and deploy them. Clouderizer Showcase has deep integration with PMML scoring engine, such that, it can parse and score the models without requiring any custom code for pre-processing or prediction.

[Here](https://youtu.be/52dec-IQLVQ) is an example illustrating PMML model deployment.

### Python Pickle objects

One of the most common way of saving a python model is using Python object serialization or pickling. These models are stored on disk as a pickle file. Pickle files can be loaded back from disk to recreate the python objects or the ML model. This python object serialization allows us to save models created using common python ML and DL frameworks like Tensorflow, PyTorch, Scikit-learn, etc.

You can upload these pickle file in Clouderizer Showcase and deploy them. While deploying python pickle models, we need to specify a [prediction](uploadmodels/prediction.md) code snippet, which loads the model and does the prediction. You might also need to specify a [pre-processing](uploadmodels/preprocessing.md) code snippet as well, depending upon your project.

[Here](https://youtu.be/52dec-IQLVQ) is an example illustrating python pickle model deployment.

### ONNX models (coming soon)

[ONNX](https://onnx.ai) is an open format built to represent machine learning models. While PMML standard tries to come up with a generic standard for Machine Learning models, ONNX aims to do the same for both Machine Learning as well as Deep Learning models as well.
