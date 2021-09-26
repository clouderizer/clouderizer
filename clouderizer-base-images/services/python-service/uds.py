import socket
import sys
import os
import json
from time import sleep
# from preprocess import preprocess
# from postprocess import postprocess
import numpy as np
from numpyencoder import NumpyEncoder
from logger import log
import importlib
import base64
#import papermill as pm

server_address="/tmp/preprocessing_unix.sock"

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

log(sys.stderr, 'connecting to %s' % server_address)

# sys.stderr = sys.stdout = open('preprocess.log','a')

model_type=sys.argv[1]
model_path=sys.argv[2]
log(model_type)
log("Model path",model_path)

python_error="Some exception occurred"

repeat = True
count = 0

def tobase64(text):
    out_bytes = text.encode('utf-8')
    output_bytes = base64.b64encode(out_bytes)
    output_message = output_bytes.decode('utf-8')
    return output_message

while repeat:
    try:
        sock.connect(server_address)
        repeat = False
    except OSError as error:
        log(error)
        sleep(1)
        if count > 10:
            sys.exit(1)
        count+=1
    except socket.error:
        log(socket.error)
        log(sys.stderr)
        repeat = False
        sys.exit(1)


while True:
    try:
        fromServer = sock.recv(65536)

        if(fromServer!=b''):
            print(fromServer)
            fromNode = fromServer.decode("utf-8")

            fromNode=json.loads(fromNode)

            if(fromNode["type"]=="updatedeployment"):
                try:
                    if(sys.modules['pypredict']):
                        del sys.modules['pypredict']
                    if(sys.modules['preprocess']):
                        del sys.modules['preprocess']
                    if(sys.modules['postprocess']):
                        del sys.modules['postprocess']
                    a = len(str({"msg": "removed modules"}))
                    log(a)
                    b = str(a) + '||||' + str({"msg": "removed modules"})
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                except:
                    a = len(str({"msg": "error occured while removing modules"}))
                    log(a)
                    b = str(a) + '||||' + str({"msg": "error occured while removing modules"})
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                
            if(fromNode["type"]=="preprocess"):
                preprocess_arr=[]
                try:
                    for single_data_point in fromNode["data"]:
                        op=python_error
                        sendData={}
                        if(single_data_point["success"]):
                            try:
                                try:
                                    from preprocess import *
                                except Exception as e:
                                    raise Exception(e)
                                op=preprocess(single_data_point["data"])
                                sendData["success"]="true"
                                sendData["data"]=tobase64(str(op))
                            except Exception as e:
                                log("Preprocess Exception",e)
                                final_message = tobase64(str(e))
                                sendData["success"]="false"
                                sendData["message"]=final_message
                        else:
                            sendData=single_data_point
                        preprocess_arr.append(sendData)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(preprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                except Exception as f:
                    sendData={}
                    final_message = tobase64(str(f))
                    sendData["success"]="false"
                    sendData["message"]=final_message
                    preprocess_arr.append(sendData)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(preprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))

            if(fromNode["type"]=="train"):
                try:
                    log("fromNode",fromNode["data"])
                    module = importlib.import_module("train")
                    err,op=module.predict(fromNode["data"])
                    
                    if err:
                        error_message = tobase64(str(err))
                        output={"err":error_message}
                    else:
                        outputToSend=""
                        outputnb=[]

                        output_type="output"
                        # log("Looking for this",op.cells)
                        try:
                            for cell in op.cells:
                                # log(cell)
                                if cell["cell_type"]=="code" and "metadata" in cell and  "tags" in cell["metadata"] and "output" in cell["metadata"]["tags"]:
                                    if not "outputs" in cell:
                                        continue
                                    for output in cell["outputs"]:
                                        if "text" in output:
                                            log("tagged output",output)
                                            outputToSend=output["text"]
                                        log("Maybe output cell was empty?")

                            if outputToSend=="" or not outputToSend:
                                for cell in op.cells:
                                    if cell["cell_type"]=="code" and "metadata" in cell and "papermill" in cell["metadata"]:
                                        if cell["metadata"]["papermill"]["exception"]==True or cell["metadata"]["papermill"]["status"]=="failed":
                                            for output in cell["outputs"]:
                                                if "text" in output:
                                                    outputToSend=output["text"]
                                                    output_type="err"
                                            
                                            if outputToSend=="":
                                                outputToSend="Some error occurred"
                                                output_type="err"
                                
                                if output_type!="err":
                                    for cell in op.cells:
                                        if cell["cell_type"]=="code" and "outputs" in cell:
                                            for output in cell["outputs"]:
                                                if "text" in output:
                                                    outputToSend=output["text"]
                                log("without tag output",outputToSend)
                            output_message = tobase64(outputToSend)
                            output={output_type:output_message}
                        except Exception as e:
                            log("Looking for this",e)
                            message = "Couldnt parse output - "+str(e)
                            final_message = tobase64(message)
                            output={"err":final_message}
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(output) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                except Exception as f:
                    message="Error occurred - "+str(f)
                    final_message = tobase64(message)
                    output={"err":final_message}
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(output) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                
                        
            if(fromNode["type"]=="pythonscore"):
                op_arr=[]
                try:
                    dataLen=len(fromNode["data"])
                    log("fromNode",fromNode["data"])
                    for single_data_point in fromNode["data"]:
                        log("fromNode",single_data_point)
                        op=python_error
                        sendData={}
                        if(single_data_point["success"]):
                            log(single_data_point)
                            sendData={}
                            try:
                                #module = importlib.import_module("pypredict")
                                #op=module.predict(single_data_point["data"])
                                try:
                                    from pypredict import *
                                except Exception as e:
                                    raise Exception(e)

                                op=predict(single_data_point["data"],model_path)
                                sendData["success"]="true"
                                sendData["data"]=tobase64(str(op))
                                # log("UDS",op)
                            except Exception as e:
                                log("Exception",op,e)
                                final_message = tobase64(str(e))
                                sendData["success"]="false"
                                sendData["message"]=final_message
                        else:
                            sendData=single_data_point
                        op_arr.append(sendData)
                    log("Op arr", op_arr)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(op_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                except Exception as f:
                    sendData={}
                    final_message = tobase64(str(f))
                    sendData["success"]="false"
                    sendData["message"]=final_message
                    op_arr.append(sendData)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(op_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))


            if(fromNode["type"]=="postprocess"):
                if(model_type=="pythonscore"):
                    postprocess_arr=[]
                    log("Inside Postprocess function")
                    log(fromNode["data"])
                    for single_data_point in fromNode["data"]:
                        sendData={}
                        if(single_data_point["success"]):
                            op=python_error
                            try:
                                try:
                                    from postprocess import *
                                except Exception as e:
                                    raise Exception(e)
                                op=postprocess(single_data_point["data"])
                                sendData["success"]="true"
                                sendData["data"]=tobase64(str(op))
                            except Exception as e:
                                log("Postprocess Exception",e)
                                final_message = tobase64(str(e))
                                sendData["success"]="false"
                                sendData["message"]=final_message
                        else:
                            sendData=single_data_point
                        postprocess_arr.append(sendData)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(postprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))

                if(model_type=="h2o" or model_type=="dai" or model_type=="pmml4s"):
                    postprocess_arr=[]
                    try:
                        log(fromNode["data"])
                        if(type(fromNode["data"])==dict):
                            print("dict")
                            op=python_error
                            sendData={}
                            try:
                                try:
                                    from postprocess import *
                                except Exception as e:
                                    raise Exception(e)
                                op=postprocess(fromNode["data"])
                                sendData["success"]="true"
                                sendData["data"]=tobase64(str(op))
                            except Exception as e:
                                log("Preprocess Exception",e)
                                final_message = tobase64(str(e))
                                sendData["success"]="false"
                                sendData["message"]=final_message
                            postprocess_arr.append(sendData)
                            b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(postprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                            sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                        if(type(fromNode["data"])==list):
                            print("list")
                            for single_data_point in fromNode["data"]:
                                op=python_error
                                sendData={}
                                if(single_data_point["success"]):
                                    try:
                                        try:
                                            from postprocess import *
                                        except Exception as e:
                                            raise Exception(e)
                                        op=postprocess(single_data_point["data"])
                                        sendData["success"]="true"
                                        sendData["data"]=tobase64(str(op))
                                    except Exception as e:
                                        log("Preprocess Exception",e)
                                        final_message = tobase64(str(e))
                                        sendData["success"]="false"
                                        sendData["message"]=final_message
                                else:
                                    sendData=single_data_point
                                postprocess_arr.append(sendData)
                            b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(postprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                            sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                    except Exception as f:
                        sendData={}
                        final_message = tobase64(str(f))
                        sendData["success"]="false"
                        sendData["message"]=final_message
                        postprocess_arr.append(sendData)
                        b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(postprocess_arr) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                        sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))

            if fromNode["type"]=="onnx":
                user_fn_output=None
                try:
                    for single_data_point in fromNode["data"]:
                        module = importlib.import_module("pypredict")
                        user_fn_output=module.predict(single_data_point)

                    a = len(str(user_fn_output))
                    log(a)
                    b = str(a) + '||||' + str(user_fn_output)
                    b = '4ebd0208-8328-5d69-8c44-ec50939c0967' + str(user_fn_output) + '4ebd0208-8328-5d69-8c44-ec50939c0967'
                    sock.sendall(json.dumps(b, cls=NumpyEncoder).encode("utf-8"))
                except Exception as e:
                    print(e)              

    except Exception as e:
        log(e)