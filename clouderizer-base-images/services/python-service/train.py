import pickle
import papermill as pm
from papermill import PapermillExecutionError
from logger import log
import json

filePath="/home/app/function/asset/model.file"

def predict(data):
    try:
        log(data)
        with open(filePath, "r", encoding='utf-8') as f:
            nb = json.load(f)
        if "kernelspec" not in nb["metadata"]:
            nb["metadata"]["kernelspec"] = {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            }

        if "metadata" in nb and "kernelspec" in nb["metadata"]:
            if not "language" in nb["metadata"]["kernelspec"]:
                if "python" in nb["metadata"]["kernelspec"]["name"]:
                    nb["metadata"]["kernelspec"]["language"] = "python"

        with open(filePath, "w", encoding='utf-8') as f1:
            json.dump(nb, f1)

        outputnbpath = dict(data)["outputFilePath"] + 'output.ipynb'
        nb=pm.execute_notebook(
        filePath,
        outputnbpath,
        parameters=dict(data),
        execution_timeout=3600
        )
        return None,nb
    except PapermillExecutionError as e:
        log("paep",e)
        if(str(e) == 'language'):
            e = 'language key is missing in your kernelspec metadata, you can edit your notebook to have language key by directly opening it in a text editor and put language as key and value as the langugage your notebook is coded in (python/R etc..) in metadata["kernelspec"]'
        return e,None
    except Exception as f:
        log("normal exp",f)
        if(str(f) == 'language'):
            f = 'language key is missing in your kernelspec metadata, you can edit your notebook to have language key by directly opening it in a text editor and put language as key and value as the langugage your notebook is coded in (python/R etc..) in metadata["kernelspec"]'
        return f,None
