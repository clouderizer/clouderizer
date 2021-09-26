import socket
import sys
import os
import json
from time import sleep
from preprocess import preprocess
from postprocess import postprocess
from pypredict import predict
import numpy as np
from numpyencoder import NumpyEncoder

server_address="/tmp/preprocessing_unix.sock"

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

print(sys.stderr, 'connecting to %s' % server_address)

log = open('/node_serve/preprocess.log','a')
sys.stdout=log

try:
    sock.connect(server_address)
except socket.error:
    print(sys.stderr)
    sys.exit(1)

while True:
    try:
        fromServer = sock.recv(65536)

        if(fromServer!=b''):
            print(fromServer)
            fromNode = fromServer.decode("utf-8")

            fromNode=json.loads(fromNode)
            if(fromNode["type"]=="preprocess"):
                preprocess_arr=[]
                for single_data_point in fromNode["data"]:
                    op=preprocess(single_data_point)
                    preprocess_arr.append(op)
                sock.send(json.dumps(preprocess_arr, cls=NumpyEncoder).encode("utf-8"))

            if(fromNode["type"]=="postprocess"):
                op=postprocess(fromNode)
                sock.send(json.dumps(op, cls=NumpyEncoder).encode("utf-8"))

            if(fromNode["type"]=="pythonscore"):
                op_arr=[]
                for single_data_point in fromNode["data"]:
                    print(fromNode)
                    if(single_data_point["success"]):
                        op=predict(single_data_point["data"])
                    else:
                        op=fromNode
                    op_arr.append(op)
                sock.send(json.dumps(op_arr, cls=NumpyEncoder).encode("utf-8"))

    except Exception as e:
        print(e)