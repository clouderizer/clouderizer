
Clouderizer cli gives the flexibility to update all the existing project components. 

However converting a project from model --> notebook or notebook --> model is not possible.

```cldz update``` updates project components.

#### --> update preprocess function

```cldz update PROJECT_NAME --preprocess preprocess.py```

If a preprocess function already exists in your project, it will be replaced by the function in this file preprocess.py. Else, new preprocess function will be created and enabled. 

#### --> add dependencies to your project

```cldz update PROJECT_NAME --requirements requirements.txt```

#### --> update model

```cldz  update PROJECT_NAME --model NEW_MODEL_PATH```

#### --> notebook update

```cldz  update PROJECT_NAME --notebook NEW_NOTEBOOK_PATH```

Once enabled preprocess & postprocess functions can also be disabled.

#### --> disable postprocess function

```cldz  update PROJECT_NAME --disable postprocess```