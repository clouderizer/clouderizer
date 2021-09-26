import fire
import webbrowser
import os
import pickle
import requests
from coolname import generate_slug
import json
import os
from time import sleep,time
import jwt
from prettytable import PrettyTable
import requirements as reqMod
import sys
import signal
import threading
import termcolor
import random
import py_compile
from pathlib import Path
# from clouderizer_beta.cldz_aws_lambda import lambda_deploy, lambda_delete, aws_region_set,lambda_deploy_codebuild
# from clouderizer_beta.utils import check_aws_cli_exists, check_sam_cli_exists
from yaml import load, dump
import base64
# from clouderizer_beta.utils import prepend_line
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

LOCAL_PATH=os.getenv("HOME") + "/.clouderizer/creds"
LOCAL_DIR=os.getenv("HOME") + "/.clouderizer"
DOCKERFILES_LOC = LOCAL_DIR+"/dockerfiles/"
TEMPLATES_LOC = LOCAL_DIR+"/templates/"
LAMBDA_FUNCTION_DIR = LOCAL_DIR+ "/lambda-dir/function/"

Path(LOCAL_DIR).mkdir(parents=True, exist_ok=True)
dir_name = os.path.dirname(os.path.realpath(__file__)).split("/")[-1]
if dir_name == "clouderizer_beta" or "beta" in dir_name:
	from clouderizer_beta.cldz_aws_lambda import lambda_deploy, lambda_delete, aws_region_set,lambda_deploy_codebuild
	from clouderizer_beta.utils import check_aws_cli_exists, check_sam_cli_exists
	BASE_URL="https://showcase2.clouderizer.com"
	Path(LOCAL_DIR+"/beta").mkdir(parents=True,exist_ok=True)
	LOCAL_PATH = os.getenv("HOME") + "/.clouderizer/beta/creds"
else:
	from clouderizer.cldz_aws_lambda import lambda_deploy, lambda_delete, aws_region_set,lambda_deploy_codebuild
	from clouderizer.utils import check_aws_cli_exists, check_sam_cli_exists
	BASE_URL="https://showcase.clouderizer.com"

SYNC_URL="https://serverless.clouderizer.com/function/"

#upload_endpoint = BASE_URL + '/api/awsconfig/generatepresignedurl'
#get_user_bucket_endpoint = BASE_URL + '/api/awsconfig/getbucket'

# if "beta" in BASE_URL:
# 	Path(LOCAL_DIR+"/beta").mkdir(parents=True,exist_ok=True)
# 	LOCAL_PATH = os.getenv("HOME") + "/.clouderizer/beta/creds"

dockerfiles = ['AutomlDockerfile','PythonDockerfile']
for dockerfile in dockerfiles:
	if not os.path.exists(DOCKERFILES_LOC):
		Path(DOCKERFILES_LOC).mkdir(parents=True,exist_ok=True)

	if not os.path.exists(DOCKERFILES_LOC+dockerfile):
		resp=requests.post(BASE_URL+'/givemelambdadockerfile',json={
			"type": dockerfile
		},headers={"Content-Type":"application/json"})

		if resp.status_code==200:
			open(DOCKERFILES_LOC+dockerfile,"w").write(resp.text)

aws_templates = ['codebuild_buildspec.yaml','codebuild_cloudformation_template.yaml']
for template in aws_templates:
	if not os.path.exists(TEMPLATES_LOC):
		Path(TEMPLATES_LOC).mkdir(parents=True,exist_ok=True)

	if not os.path.exists(TEMPLATES_LOC+template):
		resp=requests.post(BASE_URL+'/givemeawstemplatescli',json={
			"name": template
		},headers={"Content-Type":"application/json"})

		if resp.status_code==200:
			open(TEMPLATES_LOC+template,"w").write(resp.text)

display_table = PrettyTable()
display_table.field_names = ['Project Name','Created At', 'Status', 'Status Message']

status_truncation=30
SUPPORTED_MODEL_EXECUTION_TYPES=['h2o','dai','pmml','python','onnx']
SUPPORTED_NOTEBOOK_EXECUTION_TYPES=['python']
SUPPORTED_INFRA_TYPES=['standard','highmemory','gpu']
LAMBDA_SUPPORTED_INFRA_TYPES=['standard','highmemory']
SUPPORTED_IMAGE_TYPES=['standard','torch','tensorflow']

SCOPES=['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email' ,'openid']

def signal_handler(sig, frame):
	global stop_loading_thread
	stop_loading_thread=True
	print()
	print('Keyboard interrupt stopped the execution')
	print('Get list of commands : cldz help')
	loadingDisplay=False
	sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
stop_loading_thread=False

def display_timer(msg, seconds):
	for i in range(seconds):
		sys.stdout.write("\r{} {} seconds ".format(msg, seconds-i))
		sleep(1)
		sys.stdout.flush()

def colorful(text,color=None):
	if color:
		return termcolor.colored(text,color=color,attrs=['bold'])
	else:
		return termcolor.colored(text,color="green",attrs=['bold'])

def parse_json(data):
	try:
		data=json.loads(data)
		return data
	except Exception as e:
		return "Some error occurred"

def loadingDisplayFunc(text):
	global loadingDisplay
	global stop_loading_thread
	while loadingDisplay:
		chars = "/—\|" 
		if stop_loading_thread:
			break
		for char in chars:
			if stop_loading_thread:
				break
			sys.stdout.write('\r'+ text +char)
			sleep(.2)
			sys.stdout.flush()

def checkPathExists(*args):
	for path in args:
		if path!=None and not os.path.exists(path):
			print("Given path does not exist: "+ path)
			exit(0)
	
	return

def checkFileSyntax(path):
	if path:
		try:
			resp = py_compile.compile(path)
			if "Error" in resp:
				print(resp)
				exit(0)
			else:
				return
		except Exception as e:
			print("Some error occurred while processing file "+path)
			exit(0)

def checkTextInFile(text,path):
	f=open(path)

	if text in f.read():
		return True
	else:
		return False

def checkFileType(filename,format):
	if filename and format: 
		if filename.endswith(format):
			return
	
	if not filename:
		return

	print("Incorrect format for "+filename + " expected extension "+format)
	exit(0)

def parse_yaml(schemaPath):

	if not os.path.isfile(schemaPath):
		print("schema file not found in specified location")
		exit(0)

	schemaFile = open(schemaPath).read()

	schemaJson = load(schemaFile,Loader=Loader)

	# if 'input' not in schemaJson or 'output' not in schemaJson:
	# 	print("schema format not according to specifications")
	# 	exit(0)

	inputList = []
	if 'input' in schemaJson:
		inputList = schemaJson['input']

		for input in inputList:
			if "allowedValues" not in input:
				input["allowedValues"] = [] 

	outputList = []
	if 'output' in schemaJson:
		outputList = schemaJson['output']

		for output in outputList:
			if "allowedValues" not in output:
				output["allowedValues"] = []

	inputAttrs =  [
		{
			"type" : "Input Columns",
			"image" : "Grid_Table_1",
			"format" : "csv",
			"formats" : [],
			"inputList" : inputList,
			"rawinputList" : inputList
		}
	]

	outputAttrs = [
		{
			"type" : "Output Columns",
			"image" : "Grid_Table_1",
			"format" : "csv",
			"formats" : [],
			"outputList" : outputList,
			"finaloutput" : outputList
		}
	]

	return inputAttrs,outputAttrs
################ pipreqsnb code ################
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import ast
import shutil
import json
import os

pipreqs_options_store = ['use-local', 'debug', 'print', 'force', 'no-pin']
pipreqs_options_args = ['pypi-server', 'proxy', 'ignore', 'encoding', 'savepath', 'diff', 'clean']


def clean_invalid_lines_from_list_of_lines(list_of_lines):
	invalid_starts = ['!', '%']
	valid_python_lines = []
	for line in list_of_lines:
		if not any([line.startswith(x) for x in invalid_starts]):
			valid_python_lines.append(line)
	return valid_python_lines


def get_import_string_from_source(source):
	imports = []
	splitted = source.splitlines()
	tree = ast.parse(source)
	for node in ast.walk(tree):
		if any([isinstance(node, ast.Import), isinstance(node, ast.ImportFrom)]):
			imports.append(splitted[node.lineno - 1])
	return imports


def generate_pipreqs_str(args):
	pipreqs_str = ''
	for arg, val in args.items():
		if arg in pipreqs_options_store and val:
			pipreqs_str += ' --{}'.format(arg)
		elif arg in pipreqs_options_args and val is not None:
			pipreqs_str += ' --{} {}'.format(arg, val)
	pipreqs_str += ' {}'.format(args["path"])
	return pipreqs_str


def run_pipreqs(args):
	# print('pipreqs {}'.format(args))
	os.system('pipreqs --no-pin {} 2> /dev/null'.format(args))


def get_ipynb_files(path, ignore_dirs=None):
	parsed_ignore = ['.ipynb_checkpoints']

	if ignore_dirs:
		parsed_ignore_dirs = ignore_dirs.split(',')
		parsed_ignore.extend(parsed_ignore_dirs)

	ipynb_files = []
	for root, dirs, files in os.walk(path):
		dirs[:] = [d for d in dirs if d not in parsed_ignore]
		for name in files:
			f_path = os.path.realpath(os.path.join(root, name))
			ext = os.path.splitext(f_path)[1]
			if ext == '.ipynb':
				ipynb_files.append(f_path)
	return ipynb_files


def path_is_file(path):
	if os.path.isdir(path):
		return False, None
	elif os.path.isfile(path):
		extension = os.path.splitext(path)[1]
		if extension == '.py':
			is_nb = False
		elif extension == '.ipynb':
			is_nb = True
		else:
			raise Exception('file {} has an invalid extension {}'.format(path, extension))
		return True, is_nb
	else:
		raise Exception('{} if an invalid path'.format(path))


def set_requirements_savepath(args):
	if args.savepath is None:
		return '{}/{}'.format(os.path.dirname(args.path), 'requirements.txt')
	return args.savepath

def pipreqsnb_main(input_path):
	is_file, is_nb = path_is_file(input_path)

	temp_file_name = '_pipreqsnb_temp_file.py'
	temp_path_folder_name = '__temp_pipreqsnb_folder'
	args={"path":input_path}
	# ignore_dirs = args.ignore if 'ignore' in args else None
	if is_file:
		temp_path = '{}/{}/'.format('./', temp_path_folder_name)
		if is_nb:
			ipynb_files = [input_path]
		else:
			ipynb_files = []
			os.makedirs(temp_path, exist_ok=True)
			shutil.copyfile(input_path, '{}/{}'.format(temp_path, temp_file_name))
	else:
		ipynb_files = get_ipynb_files(input_path)
		temp_path = '{}/{}/'.format(input_path, temp_path_folder_name)
	temp_file = '{}/{}'.format(temp_path, temp_file_name)
	imports = []
	open_file_args = {}
	# if args.encoding is not None:
	# 	open_file_args['encoding'] = args.encoding
	for nb_file in ipynb_files:
		nb = json.load(open(nb_file, 'r', **open_file_args))
		try:
			for n_cell, cell in enumerate(nb['cells']):
				if cell['cell_type'] == 'code':
					valid_lines = clean_invalid_lines_from_list_of_lines(cell['source'])
					source = ''.join(valid_lines)
					imports += get_import_string_from_source(source)
		except Exception as e:
			pass
			# print("Couldn't fetch dependencies from notebook "+ input_path)
			# print("Exception occurred while working on file {}, cell {}/{}".format(nb_file, n_cell + 1, len(nb['cells'])))

	# hack to remove the indents if imports are inside functions
	imports = [i.lstrip() for i in imports]

	if is_file:
		args.savepath = set_requirements_savepath(args)
		args.path = temp_path
	try:
		os.makedirs(temp_path, exist_ok=True)
		with open(temp_file, 'a') as temp_file:
			for import_line in imports:
				temp_file.write('{}\n'.format(import_line))
		pipreqs_args = generate_pipreqs_str(args)
		run_pipreqs(pipreqs_args)
		shutil.rmtree(temp_path)
	except Exception as e:
		if os.path.isfile(temp_file):
			os.remove(temp_file)
		raise e

################################################

def upload_to_showcase(file_name,file_loc,company,auth_token):
	print("Uploading to Clouderizer.....")
	upload_endpoint = BASE_URL + '/api/awsconfig/generatepresignedurl'
	resp=requests.post(upload_endpoint,json={
			"type":"put",
			"key": file_name,
			"company": company
	},headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

	# print(resp.text)
	resp=parse_json(resp.text)
	# resp=json.loads(resp.text)

	if resp['success'] and "urls" in resp and len(resp["urls"])>0:
		print("Upload in progress.......")
		# print(resp)
		f=open(file_loc,'rb')

		aws_response=requests.put(resp['urls'][0],data=f)
		if(aws_response.status_code==200):
			print("Upload successful.")
			return "Success"
		else:
			return "Some error occurred while uploading... try again"
			# status_response=requests.post(status_endpoint,json={
			#     "filename": file_name,
			#     "secret_key": secret_key
			# },headers={"Content-Type":"application/json"})
	return "Some error occurred while uploading... try again"

def get_user_s3_bucket(company,auth_token):
	get_user_bucket_endpoint = BASE_URL + '/api/awsconfig/getbucket'
	resp=requests.post(get_user_bucket_endpoint,json={
			"company": company
	},headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

	# print(resp.text)
	resp=parse_json(resp.text)

	if "success" in resp:
		if resp["success"] == True:
			return resp["bucket"]
	print("Some error occurred while fetching s3 bucket")
	exit(0)


def update_serving_model(servingmodel,data,auth_token):
	# print(servingmodel,data)
	try:

		auth_headers={"Authorization": "Bearer "+auth_token}
		resp = requests.patch(BASE_URL+'/api/servingmodel/'+servingmodel,data=data,headers=auth_headers)
		# print(resp)
		# print(resp.text)
		return
	except Exception as e:
		pass
# def call_api(url, call_type, headers=None, data=None):
#   try: 
#     if(call_type=='get'):
#       requests.get(url,headers=headers)

#     if call_type=='post':
#       requests.get(url)

#   except Exception as e:
#     print(e)

def createEvent(action,company,auth_token,projectId=None,projectName=None):

	try:
		auth_headers={"Authorization": "Bearer "+auth_token}

		data = {
			"action": action,
			"company": company,
			"projectId": projectId,
			"projectName": projectName
		}
		requests.post(BASE_URL+"/api/createevent",headers=auth_headers,data=data)
		return

	except Exception as e:
		pass

def create_serving_project(filename,companyid,auth_token,projectName=None,inputAttrs=None,outputAttrs=None,retry=0):
	if not projectName:
		name=unique_project_name(filename)
	else:
		name=projectName
	print("\nCreating a project named "+name)

	if not inputAttrs:
		input_attr = [ 
			{
				"type" : "Input Columns",
				"image" : "Grid_Table_1",
				"format" : "csv",
				"formats" : [],
				"inputList" : [],
				"rawinputList" : [],
				"subtype" : ""
			}
		]
	else:
		input_attr = inputAttrs
	
	if not outputAttrs:
		output_attr = [
			{
				"type" : "Output Columns",
				"image" : "Grid_Table_1",
				"format" : "csv",
				"formats" : [],
				"outputList" : [],
				"subtype" : ""
			}
		]
	else:
		output_attr = outputAttrs

	auth_headers={"Authorization": "Bearer "+auth_token}
	project = {
		"name": name,
		"company": companyid,
		"inputAttr": json.dumps(input_attr),
		"outputAttr": json.dumps(output_attr)
		# "inputAttr": [{"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""}], 
		# "outputAttr": [{"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "subtype":""}]
		# "company": "ad8b00cf-956f-4202-9bc8-7cf8c5eb5ff2"
	}

	resp=requests.post(BASE_URL+'/api/servingproject',data=project,headers=auth_headers)
	# print(resp.text)
	if(resp.status_code==200):
		return parse_json(resp.text)

	else:
		retry+=1
		if(retry>=1):
			return "Could not create project"
		sleep(5*retry)
		return create_serving_project(filename,companyid,auth_token,retry)


def create_serving_model(file_name,s3Path,servingproject,servingprojectid,pipPackages,auth_token,training,model_type,subtype,image_type,preprocess=None,postprocess=None,predict=None,retry=0,is_lambda_deploy="false"):
	# print("Inside")
	company=servingproject["company"]
	auth_headers={"Authorization": "Bearer "+auth_token}

	preprocessS3Path=None
	preprocessCode=None
	postprocessS3Path=None
	postprocessCode=None
	predictCode=None
	predictS3Path=None
	# if model_type=="regular" and subtype=="python":
	# 	predictCodePath = 

	if preprocess:
		preprocessS3Path=company+"/"+servingproject["name"]+"/"+preprocess.split("/")[-1]
		preprocessEnabled="true"
		preprocessCode=open(preprocess).read()
	else:
		preprocessEnabled="false"

	if postprocess:
		postprocessS3Path=company+"/"+servingproject["name"]+"/"+postprocess.split("/")[-1]
		postprocessEnabled="true"
		postprocessCode=open(postprocess).read()
	else:
		postprocessEnabled="false"

	if predict:
		predictS3Path=company+"/"+servingproject["name"]+"/"+predict.split("/")[-1]
		predictCode=open(predict).read()

	model= {
		"model": file_name,
		"s3_zip_file": s3Path,
		"company": company,
		"servingproject": servingprojectid,
		"subtype": subtype,
		"type": model_type,
		"training": training,
		"userreqs": pipPackages,
		"pipPackages": pipPackages,
		"preprocessEnabled": preprocessEnabled,
		"postprocessEnabled":postprocessEnabled,
		"preprocessCodePath":preprocessS3Path,
		"postprocessCodePath": postprocessS3Path,
		"preprocessCode": preprocessCode,
		"postprocessCode": postprocessCode,
		"predictCode": predictCode,
		"predictCodePath": predictS3Path,
		"imagetype" : image_type,
		"lambda": is_lambda_deploy
	}

	model_resp=requests.post(BASE_URL+'/api/servingmodel',data=model,headers=auth_headers)

	# print(model_resp.text)

	if(model_resp.status_code==200):
		return parse_json(model_resp.text)
	else:
		retry+=1
		if(retry>=5):
			return "Could not create project"
		
		sleep(5*retry)
		return create_serving_model(file_name,s3Path,servingproject,servingprojectid,pipPackages,auth_token,training,model_type,subtype,image_type,preprocess,postprocess,predict,retry)

def fetchprojectconfig(servingproject):
	# print("Serving project", servingproject)
	response = requests.post(BASE_URL+'/api/servingproject/fetchprojectconfig',data={"servingproject":servingproject})

	if response.status_code==200:
		return parse_json(response.text)

def parser(model_path,servingproject,servingmodelid,subtype,auth_token):
	file_name=model_path.split("/")[-1]
	s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name

	parser_path=None
	if "h2o" in subtype:
		parser_path="/api/h2oparse"

	if "pmml" in subtype:
		parser_path="/api/pmmlparse"

	url = get_presigned_url(s3Path,model_path,servingproject["company"],auth_token)
	if url and parser_path:
		response=requests.post(BASE_URL + parser_path, json={
			"path": url,
			"servingid": servingmodelid
		},headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

		if response.status_code==401:
			print("Authentication was unsuccessful! try cldz login")
			exit(0)

		if wait_for_parser_finish(servingproject["id"]):
			return True

		else:
			return False
	else:
		return False

	


def wait_for_parser_finish(servingprojectid,retry=0):
	servingmodel = get_serving_model(servingprojectid)

	if len(servingmodel)>0:
		servingmodel=servingmodel[0]
	else:
		# print("Some error occurred")
		return False

	if type(servingmodel)==dict:
		parserOutput = servingmodel["parserOutput"]

		if parserOutput=="Parsing in progress":
			sleep(5)
			if retry>=5:
				return "Error Occurred"
			return wait_for_parser_finish(servingprojectid,retry+1)

		if "success" in parserOutput:
			if bool(parserOutput["success"]):
				print("Successfully fetched model attributes")
				return True
			else:
				return False

		# for some reason we are not passing success bool in h2o/dai parser outputs
		if "parse_model" in parserOutput:
			print("Successfully fetched model attributes")
			return True

		if parserOutput == "Parser error":
			return False
	else:
		# print("Some error occurred")
		return False

def get_serving_model(servingprojectid,retry=0):
	model_resp=requests.get(BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingprojectid))

	if model_resp.status_code==200:
		return parse_json(model_resp.text)
	else:
		retry+=1
		if retry>5:
			return "Could not fetch project"
	return get_serving_model(id,retry)

def get_presigned_url(file_name,file_loc,company,auth_token,retry=0):
	upload_endpoint = BASE_URL + '/api/awsconfig/generatepresignedurl'
	resp=requests.post(upload_endpoint,json={
		"type":"get",
		"key": file_name,
		"company": company
	},headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

	resp=parse_json(resp.text)

	if resp['success'] and "urls" in resp and len(resp["urls"])>0:
		return resp["urls"][0]
	else:
		sleep(5*retry)
		if(retry>5):
			return None
		return get_presigned_url(file_name,file_loc,company,auth_token,retry+1)

def update_local_project_list(name,addOrDelete):
	if not os.path.exists(LOCAL_PATH):
		print("Could not find your credentials, login again!")
		return
	
	f = open(LOCAL_PATH,'r')
	user_data= f.read()
	f.close()

	user_data = parse_json(user_data)

	if not "projects" in user_data or addOrDelete=="clean":
		user_data['projects']=[]

	if addOrDelete == "add" and name not in user_data['projects']:
		user_data['projects'].append(name)

	else:
		try:
			user_data['projects'].remove(name)
		except ValueError:
			pass

	f = open(LOCAL_PATH,'w')

	f.write(json.dumps(user_data))
	f.close()

def get_local_project_list():
	f = open(LOCAL_PATH,'r')
	user_data= f.read()
	f.close()

	user_data = parse_json(user_data)

	if not "projects" in user_data:
		return []

	return user_data["projects"]
	
def get_from_pipreqs(notebook_path,pyFile=False):
	if not os.path.exists(LOCAL_DIR+"/req"):
		os.system("mkdir {LOCAL_DIR}/req".format(LOCAL_DIR=LOCAL_DIR))
	else:
		os.system("rm {LOCAL_DIR}/req/* >/dev/null 2>&1".format(LOCAL_DIR=LOCAL_DIR))

	if not pyFile:
		os.system("jupyter nbconvert --Application.log_level=50 {NOTEBOOK_PATH} --to script --output-dir={LOCAL_DIR}/req".format(NOTEBOOK_PATH=notebook_path,LOCAL_DIR=LOCAL_DIR))
	else:
		os.system("cp ${NOTEBOOK_PATH} {LOCAL_DIR}/req/")
	os.system("pipreqs --no-pin {LOCAL_DIR}/req &> /dev/null".format(LOCAL_DIR=LOCAL_DIR))

	if os.path.exists(LOCAL_DIR+"/req/requirements.txt"):
		return parse_requirements(LOCAL_DIR+"/req/requirements.txt")
	else:
		return []

def get_from_pipreqsnb(notebook_path):
	if not os.path.exists(LOCAL_DIR+"/req"):
		os.system("mkdir {LOCAL_DIR}/req".format(LOCAL_DIR=LOCAL_DIR))
	else:
		os.system("rm {LOCAL_DIR}/req/* >/dev/null 2>&1".format(LOCAL_DIR=LOCAL_DIR))

	os.system("cp {NOTEBOOK_PATH} {LOCAL_DIR}/req/".format(NOTEBOOK_PATH=notebook_path,LOCAL_DIR=LOCAL_DIR))
	
	pipreqsnb_main("{LOCAL_DIR}/req/".format(LOCAL_DIR=LOCAL_DIR))
	# print(get_from_pipreqs(notebook_path))
	sleep(3)
	# try:
	# 	os.system("pipreqsnb --no-pin {LOCAL_DIR}/req &> /dev/null".format(LOCAL_DIR=LOCAL_DIR))
	# except Exception as e:
	# 	print("Exception occurred while trying to parse requirements from notebook "+notebook_path)
	if os.path.exists(LOCAL_DIR+"/req/requirements.txt"):
		return parse_requirements(LOCAL_DIR+"/req/requirements.txt")
	else:
		return []

def unique_project_name(filename):
	project_list=get_local_project_list()

	big_name=generate_slug().split("-")
	filteredName = big_name[random.randint(0,len(big_name)-1)]

	if len(filteredName)<4:
		return unique_project_name(filename)

	name=filename.split(".")[0].replace("_","-").replace("_", " ").lower()+ "-" + filteredName

	if name in project_list:
		return unique_project_name(filename)
	else:
		return name

def clear_local_project_list():
	if not os.path.exists(LOCAL_PATH):
		print("Could not find your credentials, login again!")
		return
	
	f = open(LOCAL_PATH,'r')
	user_data= f.read()
	f.close()

	user_data = parse_json(user_data)
	user_data['projects']=[]

	f = open(LOCAL_PATH,'w')

	f.write(json.dumps(user_data))
	f.close()

def find_full_project_name(name):
	f=open(LOCAL_PATH,'r')
	
	user_data=f.read()
	f.close()
	user_data = parse_json(user_data)

	if 'projects' not in user_data:
		print("Some error occurred, check your projects using cldz ls")
		exit(0)
	for project_name in user_data['projects']:
		if project_name == name:
			return name

	fullProjectName=None
	count=0
	matchingProjectsArr=[]
	for project_name in user_data['projects']:
		if name in project_name:
			matchingProjectsArr.append(project_name)
			fullProjectName=project_name
			count+=1

	if len(matchingProjectsArr) == 0:
		print("No project name found!")
		exit(0)

	if len(matchingProjectsArr)==1:
		return fullProjectName

	if len(matchingProjectsArr)>=2:
		print("Projects matching given name:")
		for match in matchingProjectsArr:
			print(match)
		print("Not performing any action, be more specific!")
		exit(0)
	
	return name

def invoke_publishproject(servingprojectid, infra, auth_token, invokepublishproject=True):
	# print(servingprojectid)
	invoke_url = BASE_URL+'/api/servingproject/publishproject'
	if not invokepublishproject:
		invoke_url = BASE_URL+'/api/servingproject/publishprojectlambda'

	auth_headers={"Authorization": "Bearer "+auth_token}
	publishproject=requests.post(invoke_url,headers=auth_headers,data={"projectId":servingprojectid,"infratype":infra})
	
	if publishproject.status_code==401:
		return "Authentication was unsuccessful! try cldz login"
	
	if publishproject.status_code==200:
		return parse_json(publishproject.text)
	else:
		if publishproject.status_code==500:
			text = parse_json(publishproject.text)
			if "success" in text:
				print(text['message'])
				exit(0)
				# return text['message']
			else:
				print("Some error occurred")
				exit(0)
				# return text
		return "Could not publish project"

def invoke_deployproject(servingprojectid, auth_token):
	auth_headers={"Authorization": "Bearer "+auth_token}
	deployproject=requests.post(BASE_URL+'/api/servingproject/deployproject',headers=auth_headers,data={"projectId":servingprojectid})

	if deployproject.status_code==401:
		return "Authentication was unsuccessful! try cldz login"

	if deployproject.status_code==200:
		return parse_json(deployproject.text)
	else:
		return "Could not deploy project"

def wait_for_saved_successfully(servingprojectid,auth_token,retry=0):
	global loadingDisplay
	global stop_loading_thread
	headers = {"Authorization":"Bearer "+auth_token}
	published_serving_projects=requests.get(BASE_URL+'/api/publishedservingproject?where={"servingproject":"%s"}' % servingprojectid,headers=headers)

	# print(published_serving_projects.text)
	published_serving_projects=parse_json(published_serving_projects.text)

	if len(published_serving_projects)==0:
		print("Some error occurred, try again")
		return False
	
	if type(published_serving_projects)==str:
		# print("Some error occurred while deploying, you can get the status using cldz ls")
		return wait_for_saved_successfully(servingprojectid,auth_token,retry+1)

	status_message=published_serving_projects[0]["status_message"]
	# print(status_message)
	if "Saved" in status_message or "Deploy" in status_message or "success" in status_message:
		loadingDisplay=False
		stop_loading_thread=True
		return True
	elif "Error" in status_message:
		loadingDisplay=False
		stop_loading_thread=True
		return False
	else:
		sleep(5)
		if(retry>=500):
		  print("\nProject request timed out")
		  return False

		return wait_for_saved_successfully(servingprojectid,auth_token,retry+1)

def parse_requirements(requirements_path):
	try:
		packages=[]
		with open(requirements_path) as fd:
			for req in reqMod.parse(fd):			
			# for req in requirements.parse(fd):
				if "_" in req.name:
					req.name = req.name.replace("_","-")
				if req.specs is not [] and len(req.specs)>0 and len(req.specs[0])>=2:
					packages.append(req.name+req.specs[0][0]+req.specs[0][1])
				else:
					packages.append(req.name)

		print("Package requirements "+str(packages))
		return packages
	except Exception as e:
		print("Could not parse requirements file")
		exit(0)
		

class Clouderizer(object):

	def __init__(self):
		pass

	def login(self,token=None):
		if not token:
			print("@@@@@@@Follow this url and get an authentication token: "+ BASE_URL +"/api/auth/google?source=cli")
			webbrowser.open(BASE_URL+'/api/auth/google?source=cli', new=1, autoraise=True)
			apiKey= input("Paste your authentication token:")

			# try:
			# 	payload=jwt.decode(apiKey,'oursecret', algorithms=['HS256'])
			# except Exception as e:
			# 	print("Could not verify token. Is it correct?")
			# 	return

			# payload["token"]=apiKey
			try:
				apiKey_json_str = base64.b64decode(apiKey)
				payload = parse_json(apiKey_json_str)
				print(payload)

			except Exception as e:
				print("Could not verify token. Is it correct?")
				return
			headers = {"Authorization":"Bearer "+payload["token"]}

		else:
			# try:
			# 	payload=jwt.decode(token,'oursecret', algorithms=['HS256'])
			# except Exception as e:
			# 	print("token verification failed. Is it correct?")
			# 	return

			# payload["token"]=token
			try:
				apiKey_json_str = base64.b64decode(token)
				payload = parse_json(apiKey_json_str)

			except Exception as e:
				print("Could not verify token. Is it correct?")
				return
			headers = {"Authorization":"Bearer "+payload["token"]}


		try:
			jwt_payload=jwt.decode(payload['token'],'oursecret', algorithms=['HS256'])
		except Exception as e:
			print("Some error occurred")
			return

		payload['cid'] = jwt_payload['cid']
		payload['uid'] = jwt_payload['uid']
		# # get company dets		
		# customer_dets=requests.get(BASE_URL+'/api/customer/'+payload['cid'],headers=headers)
		# customer_dets=parse_json(customer_dets.text)

		# # get user dets
		# user_dets=requests.get(BASE_URL+'/api/user/'+payload['uid'],headers=headers)
		# user_dets=parse_json(user_dets.text)

		# if "name" in customer_dets:
		# 	payload["Company"]=customer_dets["name"]
		
		# if "name" in user_dets:
		# 	payload["User"]=user_dets["name"]

		payload['projects']=[]

		payload['awsCodeBuildSetup']="false"

		with open(LOCAL_PATH,'w') as f:
			f.write(json.dumps(payload))

		try:
			import pyfiglet
			result = pyfiglet.figlet_format("Welcome to Clouderizer")
			print(result)
		except Exception as e:
			pass

		print("You are logged in!")
		print("Here's some commands you can try:")
		print("Get list of your projects on Clouderizer : cldz ls")
		print("Deploy a project : cldz deploy {PROJECT_PATH} {REQUIREMENTS_PATH}")

		createEvent("login success",payload['cid'],payload['token'])

	def ls(self):
		# get list of projects in published serving project
		creds = self.loggedin()

		published_serving_projects=requests.post(BASE_URL+'/api/servingproject/getprojects',data={"company":creds["cid"]})

		# print(published_serving_projects.text)
		published_serving_projects=parse_json(published_serving_projects.text)
		clear_local_project_list()
		# except Exception as e:
		#   print("Could not load projects!")
		# print(published_serving_projects)
		# creds["cid"]["id"])
		if type(published_serving_projects)==str:
			print("Couldn't fetch your projects, is your network down?")
			return

		for project in published_serving_projects:
			url="-"
			if "deployed successfully" in project['status_message']:
				project['status_message']="Deployed successfully"
				url = BASE_URL + "/api/async-function/"+project['name']+"/notebook"
				
			if "Error" in project['status_message']:
				project['status_message']="Error occurred" 

			if project['status'] == "":
				project['status'] = "Not Running"

			if len(project['status'])>status_truncation:
				project['status']=project['status'][:status_truncation]

			if len(project['status_message'])>status_truncation:
				project['status_message']=project['status_message'][:status_truncation]

			if project['servingproject'] and project['servingproject']['name']:
				update_local_project_list(project['servingproject']['name'],"add")
				
				formattedCreatedAt=project['createdAt']
				if project['createdAt']:
					formattedCreatedAt = project['createdAt'].split(".")[0]
					formattedCreatedAt = formattedCreatedAt.replace("T", " ")
				display_table.add_row([project['servingproject']['name'], formattedCreatedAt,project['status'],project['status_message']])
			# else:
			#   print(project['servingproject'])
			# display_table.add_row([project['name'].replace("clouderizer-","").replace("clouderizer123-",""), project['createdAt'],project['status_message']])

		print(display_table)

	def delete(self,name):
		creds=self.loggedin()

		if not name or name=="":
			print("Choose a specific project!")
			return

		headers={"Authorization":"Bearer "+creds["token"]}

		name=find_full_project_name(name)

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		serving_project=requests.get(servingprojectsurl,headers=headers)

		# print(serving_project.text)
		# try:
		serving_project = parse_json(serving_project.text)
		# except Exception as e:
			# print(e)
			# print("Could not delete project, try again!")
			# return

		if len(serving_project)==0 or type(serving_project)==str:
			print("Project not found")
			return


		deleteproject_url=BASE_URL+"/api/servingproject/deleteproject"
		deleteproject=requests.post(deleteproject_url,headers=headers,data={"servingprojectid":serving_project[0]["id"],"company":creds['cid']})
		
		if deleteproject.status_code==200:
			print("Project "+name+ " deleted successfully")
			createEvent("delete",creds['cid'],creds['token'],None,name)

		update_local_project_list(name,"delete")
		if deleteproject.status_code==401:
			print("Could not authenticate you, try cldz login")
		return  

	def stop(self,name):
		creds=self.loggedin()

		if not name or name=="":
			print("Choose a specific project!")
			return

		headers={"Authorization":"Bearer "+creds["token"]}

		name=find_full_project_name(name)

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		serving_project=requests.get(servingprojectsurl,headers=headers)

		serving_project = parse_json(serving_project.text)

		if len(serving_project)==0 or type(serving_project)==str:
			print("Project not found")
			return

		servingproject=serving_project[0]

		servingmodelsurl=BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingproject["id"])
		servingmodel=requests.get(servingmodelsurl,headers=headers)
		
		servingmodel=parse_json(servingmodel.text)

		if len(servingmodel)==0:
			print("Some error occurred")
			return

		servingmodel = servingmodel[0]

		# print(servingmodel["lambda"],type(servingmodel["lambda"]))
		if servingmodel["lambda"]=="true" or(type(servingmodel["lambda"])==bool and servingmodel["lambda"]):
			lambda_delete(name,LOCAL_DIR)
		else:
			stopproject_url=BASE_URL+"/api/servingproject/stopproject"
			stopproject=requests.post(stopproject_url,headers=headers,data={"projectId":serving_project[0]["id"]})

			if stopproject.status_code==200:
				print("Project "+name+ " stopped successfully")
				createEvent("stop",creds['cid'],creds['token'],serving_project[0]["id"],name)

			if stopproject.status_code==401:
				print("Could not authenticate you, try cldz login")
			return

	def env(self,command,key=None,value=None):

		if command not in ["add","update","delete","get"]:
			print("Not supported "+ command)
			print("Available commands: add, update, delete")
			return

		if command!="get" and not key:
			print("cldz env add KEY=VALUE")
			return

		if command in ["add","update"] and not value:
			print("cldz env add KEY=VALUE")
			return

		creds=self.loggedin()
		auth_token= creds['token']

		ep = "nbvariables"
		if command == "get":
			ep="getnbvariables"

		result = requests.post(BASE_URL+'/api/customer/'+ep,json={
			"customerId": creds['cid'],
			"type": command,
			"key": key,
			"value": value
		},headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

		# print(result.text)
		result=parse_json(result.text)
		# print(result)
		if "success" in result:
			if command=="get":
				if result["success"]:
					for d in result["data"]:
						print("{}={}".format(d["key"],d["value"]))
				else:
					print(result["msg"])
			else:
				print(result["msg"])
		else:
			print("Some error occurred")


	def start(self, name,infra="standard",image="standard"):
		global loadingDisplay
		if not name:
			print("Choose a specific project!")
			return

		creds=self.loggedin()
		headers = {"Authorization":"Bearer "+creds["token"]}

		if infra not in SUPPORTED_INFRA_TYPES:
			print("--infra is not an accepted value")
			print("Available infra types : standard, highmemory, gpu")
			return

		if image not in SUPPORTED_IMAGE_TYPES:
			print("--image is not an accepted value")
			print("Available image types : standard, torch, tensorflow")
			return

		name=find_full_project_name(name)

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		serving_project=requests.get(servingprojectsurl,headers=headers)

		serving_project = parse_json(serving_project.text)

		if len(serving_project)==0 or type(serving_project)==str:
			print("Could not find project, try again")
			return

		publishproject=invoke_publishproject(serving_project[0]["id"],infra,creds["token"])
		print("Publishing the project...this might take a while")

		if type(publishproject)==dict and "success" in publishproject and publishproject["success"]==True:
			signal.signal(signal.SIGINT, signal_handler)
		#   print("You can press Ctrl+C and check project status using cldz ls or wait till deployed")
			loadingDisplay=True
			loadingThreadObj=threading.Thread(target=loadingDisplayFunc, args=("You can press Ctrl+C and check project status using cldz ls or wait till deployed ",))
			loadingThreadObj.start()
			if(wait_for_saved_successfully(serving_project[0]["id"],creds["token"])):
				print("\nProject deployed!")
				createEvent("start",creds['cid'],creds['token'],serving_project[0]["id"],name)
				self.describe(serving_project[0]["name"])
			else:
				print("Some error occurred while starting the project")
				return
		else:
			print(publishproject)
			createEvent("start failed",creds['cid'],creds['token'],serving_project[0]["id"],name)
			return			
		

	def help(self):
		print("NAME")
		print("    cldz")
		print(" ")
		print("Options in {} are optional")
		print(" ")
		print("SYNOPSIS")
		print("    cldz COMMAND")
		print(" ")
		print("COMMANDS")
		print("    COMMAND is one of the following:")
		print("    ")
		print("        delete $PROJECT_NAME : delete an existing project")
		print("    ")
		print("        deploy $NOTEBOOK_PATH {REQUIREMENTS_PATH} : create a new project, upload notebook/model and deploy")
		print("    ")
		print("        describe $PROJECT_NAME : get details of the existing project")
		print("    ")
		print("        loggedin : to check whether logged in with cldz or not")
		print("    ")
		print("        login")
		print("    ")
		print("        logout")
		print("    ")
		print("        ls : list all the projects")
		print("    ")
		print("        start $PROJECT_NAME : start an existing project")
		print("    ")
		print("        stop $PROJECT_NAME : stop an existing project")
		print("    ")

	def describe(self, name):
		if not name:
			print("Choose a specific project!")
			return

		creds=self.loggedin()
		# if creds is None or "cid" not in creds or "uid" not in creds or "token" not in creds:
			# print("Are you logged in? try: cldz login")
			# return

		headers = {"Authorization":"Bearer "+creds["token"]}

		customer_dets=requests.get(BASE_URL+'/api/customer/'+creds['cid'],headers=headers)

		project_name=find_full_project_name(name)

		# try:
		customer_dets = parse_json(customer_dets.text)
		# print(customer_dets)
		# except Exception as e:
		#   print("Could not fetch your details")
		#   return

		if "name" not in customer_dets:
			print("Could not fetch project details")
			return

		published_serving_projects=requests.get(BASE_URL+'/api/publishedservingproject?where={"name":"%s"}' % (customer_dets["name"].lower().replace(" ","")+"-"+project_name.lower().replace("_","-")),headers=headers)
		# try:
		published_serving_project = parse_json(published_serving_projects.text)
		# except Exception as e:
		#   print("Could not fetch your project")
		#   return

		if len(published_serving_project)==0:
			print("Could not fetch the requested project")
			return

		serving_model=requests.get(BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (published_serving_project[0]["servingproject"]),headers=headers)
		serving_model=parse_json(serving_model.text)

		project_type=None
		if len(serving_model)>0:
			serving_model=serving_model[0]
			if serving_model['training']:
				project_type="NOTEBOOK"
			else:
				project_type="MODEL"

		status_message=None
		if "Deployed successfully" in published_serving_project[0]["status_message"]:
			status_message="Deployed successfully"

		if "Error" in published_serving_project[0]["status_message"]:
			status_message="Error Occurred"

		if not status_message:
			status_message=published_serving_project[0]["status_message"]

		if len(published_serving_project)>0:
			print("PROJECT NAME : " + project_name)

			if status_message=="Deployed successfully":
				print("\nPROJECT STATUS : ",colorful(status_message))
			else:
				print("\nPROJECT STATUS : ", status_message)

			if project_type:
				print("\nPROJECT TYPE:", project_type)

			if status_message=="Error Occurred":
				print("Log dump")
				print(published_serving_project[0]["status_message"])

			if "otherfilenames" in serving_model and len(serving_model['otherfilenames'])>0:
				print("\n")
				print("SUPPORT FILES : ")
				print(*serving_model['otherfilenames'],sep=', ')


			if "Deployed successfully"==status_message:
				if project_type=="NOTEBOOK" or not project_type:
					if "accessUrl" in serving_model:
						url = serving_model['accessUrl']
						print("\nNOTEBOOK URL : "+ url)
						print("\nSAMPLE ASYNC CURL COMMAND : "+ 'curl -i -X POST '+url + ' -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>" -H "x-callback-url: https://<callback-url-here>"')
						print("\nSAMPLE CURL COMMAND : "+ 'curl -i -X POST '+url + ' -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>"')
					else:
						url=BASE_URL + "/api/async-function/"+published_serving_project[0]["name"]+"/notebook"
						surl=SYNC_URL + published_serving_project[0]["name"]+"/notebook"
						print("\nNOTEBOOK ASYNC URL : "+ url)
						print("\nNOTEBOOK SYNC URL : "+ surl)
						print("\nSAMPLE ASYNC CURL COMMAND : "+ 'curl -i -X POST '+url + ' -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>" -H "X-Callback-Url: https://<callback-url-here>"')
						print("\nSAMPLE SYNC CURL COMMAND : "+ 'curl -i -X POST '+surl + ' -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>"')
				else:
					if "accessUrl" in serving_model:
						surl = serving_model["accessUrl"] + '/predict'
					else:
						surl=SYNC_URL + published_serving_project[0]["name"]+"/predict"
					print("\nMODEL URL : "+ surl)
					print("\nWEB APP URL : " + SYNC_URL+published_serving_project[0]["name"])
					
			else:
				if project_type=="NOTEBOOK":
					print("Training URL will be accessible here after project gets deployed!")
				else:
					print("Scoring URL will be accessible here after project gets deployed!")

		else:
			print("Some error occurred, Could not find your project")
		# serving_project=requests.get(BASE_URL+'/api/servingproject?where={"name":"'+ name +'"}',headers=headers)

		# print(serving_project)
		# try:
		#   serving_project=json.loads(serving_project.text)
		# except Exception as e:
		#   print("Could not1 fetch status of the project "+name)
		#   return

		# if len(serving_project)>0:
		#   servingprojectid = serving_project[0]["id"]
		#   published_serving_project=requests.get(BASE_URL+'/api/publishedservingproject?where={"servingproject":"%s"}' % servingprojectid,headers=headers)

		#   try:
		#     published_serving_project=json.loads(published_serving_project.text)
		#   except Exception as e:
		#     print("Could not fetch status for the project "+name)
		#     return
			
		#   if len(published_serving_project)>0:
		#     print("Project status : ", published_serving_project[0]["status_message"])

		#     if "Deployed successfully" in published_serving_project[0]["status_message"]:
		#       print("Training url : "+ BASE_URL + "/api/async-function/"+published_serving_project[0]["name"]+"/notebook")
		#     else:
		#       print("Training URL will be accessible here after project gets deployed!")

	def loggedin(self):
		global BASE_URL
		global SYNC_URL
		# have a .cldzrc file which stores api key
		creds=None
		if os.path.exists(LOCAL_PATH):
			with open(LOCAL_PATH, 'r') as token:
				data=token.read()
				if os.stat(LOCAL_PATH).st_size != 0:
					# try:
					creds = parse_json(data)
					# except Exception as e:
					#   print(e)
					#   print("Couldn't verify your credentials, please login again")
					#   return

					#update BASE_URL from creds
					BASE_URL=creds["url"]
					SYNC_URL=creds["surl"]
					return creds
				else:
					print("You are not logged in, try: cldz login.")
					exit(0)
			return creds
		else:
			print("You are not logged in, try: cldz login")
			exit(0)

	
	def logout(self):
		if os.path.exists(LOCAL_PATH):
			os.remove(LOCAL_PATH)

		print("You have been successfully logged out")

	def update(self,name,model=None,notebook=None,requirements=None,preprocess=None,postprocess=None,predict=None,disable=None,schema=None):
	# def update(self,name,*args):
		creds=self.loggedin()
		auth_token=creds['token']
		headers={"Authorization":"Bearer "+creds["token"]}

		execution_type="notebook"
		subtype="pythonscore"

		name=find_full_project_name(name)

		inputAttrs=[{"inputList":[], "rawinputList":[]}] 
		outputAttrs=[{"outputList": [],"finaloutput":[]}]
		if schema:
			inputAttrs, outputAttrs = parse_yaml(schema)
		# if not model and not notebook:
		# 	print("Currently only model and notebook updates are supported")
		# 	return

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		servingproject=requests.get(servingprojectsurl,headers=headers)
		
		servingproject=parse_json(servingproject.text)

		if len(servingproject)==0:
			print("Could not find project")
			return

		servingproject=servingproject[0]

		servingmodelsurl=BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingproject["id"])
		servingmodel=requests.get(servingmodelsurl,headers=headers)
		
		servingmodel=parse_json(servingmodel.text)

		if len(servingmodel)==0:
			print("Some error occurred")
			return

		servingmodel = servingmodel[0]
		pipPackages=None

		if not servingmodel["training"]:
			execution_type="model"
			subtype=servingmodel["subtype"]

		if execution_type=="notebook":
			notebook_path=notebook
			requirements_path=requirements
			# if notebook_path!=None and not os.path.exists(notebook_path):
			# 	print("Notebook path does not exist "+ notebook_path)
			# 	return

			checkPathExists(notebook_path,requirements_path)
			checkFileType(notebook_path,".ipynb")
			# if notebook_path!=None and not notebook_path.endswith(".ipynb"):
			# 	print("File path does not point to a jupyter notebook" + notebook_path)
			# 	return

			# checkPathExists(requirements_path)
			# if (requirements_path!=None and not os.path.exists(requirements_path)):
			# 	print("Notebook path does not exist "+ requirements_path)
			# 	return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)

			if notebook_path:
				file_name=notebook_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				print("Preparing notebook for upload")
				uploadmodel_resp=upload_to_showcase(s3Path,notebook_path,servingproject["company"],auth_token)
				if uploadmodel_resp=="Success":
					print("Updating notebook")

					if not servingmodel:
						servingmodel = get_serving_model(servingproject["id"])
						servingmodel = servingmodel[0]
					
					servingmodel["model"] = file_name
					servingmodel["s3_zip_file"] = s3Path
					servingmodel["enableRetrain"] = "false"
					servingmodel["preprocessEnabled"] = "false"
					servingmodel["postprocessEnabled"] = "false"
				else:
					print(uploadmodel_resp)

			if pipPackages:
				print("Updating requirements file")
				servingmodel["pipPackages"]=pipPackages

			servingmodel["savedon"]=int(time())
			updated_model=requests.put(BASE_URL+"/api/servingmodel/"+servingmodel["id"],headers=headers,data=servingmodel)
				# print(updated_model.text)
			print("Model updated successfully!")

		if execution_type=="model":
			model_path=model
			preprocess_path=preprocess
			postprocess_path=postprocess
			predict_path=predict
			requirements_path=requirements

			checkPathExists(model_path,preprocess_path,postprocess_path)
			checkFileSyntax(preprocess_path)
			checkFileSyntax(postprocess_path)
			# if model_path!=None and not os.path.exists(model_path):
			# 	print("Model path does not exist "+ model_path)
			# 	return

			# if preprocess_path!=None and not os.path.exists(preprocess_path):
			# 	print("Given preprocess path does not exist "+ preprocess_path)
			# 	return

			# if postprocess_path!=None and not os.path.exists(postprocess_path):
			# 	print("Given postprocess path does not exist "+ postprocess_path)
			# 	return
			
			if not subtype or subtype=="":
				print("Some error occurred, could not classify your model")
				return

			if not model_path and not preprocess_path and not postprocess_path and not predict_path and not requirements_path and not disable:
				print("No parameters provided to update model")
				return
			
			model_s3_path=None
			if model_path:
				file_name=model_path.split("/")[-1]
				model_s3_path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				print("Preparing model file for upload")
				uploadmodel_resp=upload_to_showcase(model_s3_path,model_path,servingproject["company"],auth_token)
				if not uploadmodel_resp=="Success":
					print(uploadmodel_resp)
					return

				if subtype not in ["python","pythonscore","onnx"]:
					print("Fetching I/O attributes from the project")
					if not parser(model_path,servingproject,servingmodel["id"],subtype,auth_token):
						print("Some error occurred while fetching attributes")
						return

			preprocess_s3_path=None
			if preprocess_path:
				print("Updating preprocess code")
				file_name=preprocess_path.split("/")[-1]
				preprocess_s3_path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(preprocess_s3_path,preprocess_path,servingproject["company"],auth_token)
				if not uploadmodel_resp=="Success":
					print(uploadmodel_resp)
					return

			postprocess_s3_path=None
			if postprocess_path:
				print("Updating postprocess code")
				postprocess_file_name=postprocess_path.split("/")[-1]
				postprocess_s3_path=servingproject["company"]+"/"+servingproject["name"]+"/"+postprocess_file_name
				uploadmodel_resp=upload_to_showcase(postprocess_s3_path,postprocess_path,servingproject["company"],auth_token)
				if not uploadmodel_resp=="Success":
					print(uploadmodel_resp)
					return

			predict_s3_path=None
			if predict_path and "python" in subtype:
				print("Updating predict code")
				predict_file_name=predict_path.split("/")[-1]
				predict_s3_path=servingproject["company"]+"/"+servingproject["name"]+"/"+predict_file_name
				uploadmodel_resp=upload_to_showcase(predict_s3_path,predict_path,servingproject["company"],auth_token)
				if not uploadmodel_resp=="Success":
					print(uploadmodel_resp)
					return

			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)

			print("Updating model...")

			if not servingmodel:
				servingmodel = get_serving_model(servingproject["id"])
				servingmodel = servingmodel[0]
			
			if model_path:
				servingmodel["model"] = file_name
				servingmodel["s3_zip_file"] = model_s3_path

			if servingmodel["preprocessEnabled"]:
				servingmodel["preprocessEnabled"]="true"
			
			if servingmodel["postprocessEnabled"]:
				servingmodel["postprocessEnabled"]="true"

			if disable=="preprocess":
				print("Disabling preprocess function")
				servingmodel["preprocessEnabled"]="false"

			if disable=="postprocess":
				print("Disabling postprocess function")
				servingmodel["postprocessEnabled"]="false"

			if preprocess_path:
				servingmodel["preprocessEnabled"]="true"
				servingmodel["preprocessCodePath"]=preprocess_s3_path
			if postprocess_path:
				servingmodel["postprocessEnabled"]="true"
				servingmodel["postprocessCodePath"]=postprocess_s3_path

			if predict_path and "python" in subtype:
				servingmodel["predictCodePath"]=predict_s3_path
			
			if pipPackages:
				print("Updating requirements file")
				servingmodel["pipPackages"]=pipPackages

			servingmodel["savedon"] = int(time())
			updated_model=requests.put(BASE_URL+"/api/servingmodel/"+servingmodel["id"],headers=headers,data=servingmodel)
				# print(updated_model.text)
			print("Model updated successfully!")

	def create(self,project_name,file_path=None,model_type=None,notebook_type=None,requirements=None):

		execution_type="notebook"
		subtype="pythonscore"
		requirements_path = requirements
		name = project_name

		creds=self.loggedin()
		auth_token=creds['token']

		inputAttrs=[{"inputList":[], "rawinputList":[]}] 
		outputAttrs=[{"outputList": [],"finaloutput":[]}]

		if model_type and notebook_type:
			print("Parameters unclear, both notebook and model types selected")
			return

		if model_type:
			if model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
				execution_type="model"
				if model_type=="python":
					subtype="pythonscore"
				else:
					subtype=model_type
			else:
				print("Specified model type is not currently supported "+model_type)
				print("Supported model types:")
				for supported_model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
					print(supported_model_type)
				return

		if notebook_type:
			if notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
				if notebook_type=="python":
					subtype="pythonscore"
				else:
					subtype=notebook_type
			else:
				print("Specified notebook type is not currently supported")
				for supported_notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
					print(supported_notebook_type)
				return

		if not file_path:
			self.help()
			return

		pipPackages=None
		if execution_type=="notebook":
			notebook_path=file_path

			checkPathExists(notebook_path)
			# if not os.path.exists(notebook_path):
			# 	print("Notebook path does not exist "+ notebook_path)
			# 	return

			if not notebook_path.endswith(".ipynb"):
				print("File path does not point to a jupyter notebook" + notebook_path)
				return

			checkPathExists(requirements_path)
			# if (requirements_path!=None and not os.path.exists(requirements_path)):
			# 	print("Notebook path does not exist "+ requirements_path)
			# 	return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)
			else:
				pipPackages=get_from_pipreqsnb(notebook_path)

			print("TYPE : NOTEBOOK")
			print("NOTEBOOK FILE PATH : " + notebook_path)
			print("FETCHED PIP PACKAGES : ", pipPackages)		

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Project creation will continue in ",10)	

			servingproject=create_serving_project(notebook_path.split("/")[-1],creds['cid'],auth_token,projectName=name)
			# print(type(servingproject))
			if type(servingproject)==dict and "id" in servingproject:
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=notebook_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,notebook_path,servingproject["company"],auth_token)
				if uploadmodel_resp=="Success":
					try:
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"true","regular",subtype,"standard")
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your notebook, please try again!")
						return

					if type(servingmodel)==dict and "id" in servingmodel:    
						print("Project created!")

					publishproject=invoke_publishproject(servingproject["id"],"standard",auth_token,False)
					# if "success" in publishproject:
					# 	print(publishproject)					

		if execution_type=="model":
			model_path=file_path

			if not model_path:
				print("Model not provided, exiting")
				return

			checkPathExists(model_path)
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)

			print("TYPE : MODEL")
			print("MODEL PATH : " + model_path)
			print("FETCHED PIP PACKAGES : ", pipPackages)

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Deployment will continue in ",10)

			servingproject=create_serving_project(model_path.split("/")[-1],creds['cid'],auth_token,inputAttrs=inputAttrs,outputAttrs=outputAttrs,projectName=name)
			# print(type(servingproject))
			if type(servingproject)==dict and "id" in servingproject:
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=model_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,model_path,servingproject["company"],auth_token)

				if uploadmodel_resp=="Success":					
					try:
						deployment_model_type="automl"
						if subtype in ["python","onnx","pythonscore"]:
							deployment_model_type="regular"
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"false",deployment_model_type,subtype,"standard")
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your model, please try again!")						
						return

					if type(servingmodel)==dict and "id" in servingmodel:    
						# print("Project created!")
						if subtype not in ["python","pythonscore","onnx"]:
							print("Fetching I/O attributes from the project")
							if not parser(model_path,servingproject,servingmodel["id"],subtype,auth_token):
								print("Some error occurred while fetching attributes")
								self.delete(servingproject["name"])
								return

					print("Project created!")

					publishproject=invoke_publishproject(servingproject["id"],"standard",auth_token,False)
					# print(publishproject)

	def quickdeploy(self,file_path=None,requirements=None,predict=None,preprocess=None,postprocess=None,model_type=None,notebook_type=None,infra="standard",image="standard",schema=None):
	# def deploy(self,first_path=None,second_path=None,third_path=None,model_type=None,notebook_type=None,enable_gpu=None):
		global loadingDisplay
		creds=self.loggedin()
		auth_token=creds["token"]
		requirements_path=requirements

		if infra not in SUPPORTED_INFRA_TYPES:
			print("--infra is not an accepted value")
			print("Available infra types : standard, highmemory, gpu")
			return

		if image not in SUPPORTED_IMAGE_TYPES:
			print("--image is not an accepted value")
			print("Available image types : standard, torch, tensorflow")
			return

		execution_type="notebook"
		subtype="pythonscore"


		inputAttrs=[{"inputList":[], "rawinputList":[]}] 
		outputAttrs=[{"outputList": [],"finaloutput":[]}]
		if schema:
			inputAttrs, outputAttrs = parse_yaml(schema)

		if model_type and notebook_type:
			print("Parameters unclear, both notebook and model types selected")
			return

		if model_type:
			if model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
				execution_type="model"
				if model_type=="python":
					subtype="pythonscore"
				else:
					subtype=model_type
			else:
				print("Specified model type is not currently supported "+model_type)
				print("Supported model types:")
				for supported_model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
					print(supported_model_type)
				return

		if notebook_type:
			if notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
				if notebook_type=="python":
					subtype="pythonscore"
				else:
					subtype=notebook_type
			else:
				print("Specified notebook type is not currently supported")
				for supported_notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
					print(supported_notebook_type)
				return

		if not file_path:
			self.help()
			return
		
		pipPackages=None
		if execution_type=="notebook":
			notebook_path=file_path

			checkPathExists(notebook_path)
			# if not os.path.exists(notebook_path):
			# 	print("Notebook path does not exist "+ notebook_path)
			# 	return

			if not notebook_path.endswith(".ipynb"):
				print("File path does not point to a jupyter notebook" + notebook_path)
				return

			checkPathExists(requirements_path)
			# if (requirements_path!=None and not os.path.exists(requirements_path)):
			# 	print("Notebook path does not exist "+ requirements_path)
			# 	return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)
			else:
				pipPackages=get_from_pipreqsnb(notebook_path)

			print("TYPE : NOTEBOOK")
			print("NOTEBOOK FILE PATH : " + notebook_path)
			print("FETCHED PIP PACKAGES : ", pipPackages)		

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Deployment will continue in ",10)	

			servingproject=create_serving_project(notebook_path.split("/")[-1],creds['cid'],auth_token)
			# print(type(servingproject))
			if type(servingproject)==dict and "id" in servingproject:
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=notebook_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,notebook_path,servingproject["company"],auth_token)
				if uploadmodel_resp=="Success":
					try:
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"true","regular",subtype,image)
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your notebook, please try again!")
						return

					if type(servingmodel)==dict and "id" in servingmodel:    
						print("Project created!")
						publishproject=invoke_publishproject(servingproject["id"],infra,auth_token)
						# print(publishproject)
						print("Publishing the project...this might take a while")
						if type(publishproject)==dict and "success" in publishproject and publishproject["success"]==True:
							signal.signal(signal.SIGINT, signal_handler)

							loadingDisplay=True
							loadingThreadObj=threading.Thread(target=loadingDisplayFunc, args=("You can press Ctrl+C and check project status using cldz ls or wait till deployed ",))
							loadingThreadObj.start()
							# print("You can press Ctrl+C and check project status using cldz ls or wait till deployed")
							if(wait_for_saved_successfully(servingproject["id"],auth_token)):
								print("Project deployed!")
								createEvent("deploy",creds['cid'],auth_token,servingproject["id"],servingproject["name"])			
								# update_local_project_list(servingproject["name"],"add")
								self.describe(servingproject["name"])
							else:
								print("Error deploying your project, deploy again")
								createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
								# self.delete(servingproject["name"])
								return
						else:
							self.delete(servingproject["name"])
							createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
							print(publishproject)
							return
					else:
						self.delete(servingproject["name"])
						createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
						print(servingmodel)
						return
			else:
				print(servingproject)

		if execution_type=="model":
			model_path=file_path

			if subtype in ["python","onnx","pythonscore"]:
				predict_path=predict
			else:
				predict_path=None
			preprocess_path=preprocess
			postprocess_path=postprocess

			if subtype in ["python","onnx","pythonscore"] and not predict_path:
				print("Predict function path not found")
				return

			if not model_path:
				print("Model not provided, exiting")
				return

			checkPathExists(model_path)
			# if not os.path.exists(model_path):
			# 	print("Model path does not exist "+ model_path)
			# 	return

			if preprocess_path:
				checkPathExists(preprocess_path)
				checkFileSyntax(preprocess_path)
				# if not os.path.exists(preprocess_path):
				# 	print("Preprocess path does not exist " + preprocess_path)
				# 	return
				
				checkFileType(preprocess_path,".py")
				# if not preprocess_path.endswith(".py"):
				# 	print("Preprocess path not a python file "+preprocess_path)
				# 	return

			if postprocess_path: 
				checkPathExists(postprocess_path)
				checkFileSyntax(postprocess_path)
				# if not os.path.exists(postprocess_path):
				# 	print("Preprocess path does not exist " + postprocess_path)
				# 	return
				checkFileType(postprocess_path,".py")
				# if not postprocess_path.endswith(".py"):
				# 	print("Postprocess path not a python file "+postprocess_path)
				# 	return

			if predict_path:
				checkPathExists(predict_path)
				checkFileSyntax(predict_path)

				# prepend_line(predict_path,"modelPath='/home/app/function/asset/model.file'")
				# if not os.path.exists(predict_path):
				# 	print("Preprocess path does not exist " + predict_path)
				# 	return	
				checkFileType(predict_path,".py")
				if not predict_path.endswith(".py"):
					print("Postprocess path not a python file "+predict_path)
					return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)
			else:
				if subtype in ["python","onnx","pythonscore"] and predict_path:
					pipPackages=get_from_pipreqsnb(predict_path)
			print("TYPE : MODEL")
			print("MODEL PATH : " + model_path)
			if subtype in ["python","onnx","pythonscore"]:
				print("PREDICT PATH : " ,predict_path)
			print("PREPROCESS PATH : " , preprocess_path)
			print("POSTPROCESS PATH : " ,postprocess_path)
			print("FETCHED PIP PACKAGES : ", pipPackages)

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Deployment will continue in ",10)

			servingproject=create_serving_project(model_path.split("/")[-1],creds['cid'],auth_token,inputAttrs=inputAttrs,outputAttrs=outputAttrs)
			# print(type(servingproject))
			if type(servingproject)==dict and "id" in servingproject:
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=model_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,model_path,servingproject["company"],auth_token)
				preprocessS3Path=None
				postprocessS3Path=None
				predictS3Path=None
				if uploadmodel_resp=="Success":
					if preprocess_path:
						print("Preparing preprocess file for upload")
						preprocessS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+preprocess_path.split("/")[-1]
						uploadpreprocess_resp=upload_to_showcase(preprocessS3Path,preprocess_path,servingproject["company"],auth_token)

						if not uploadpreprocess_resp=="Success":
							print("Preprocess file upload failed, try again")
							self.delete(servingproject["name"])
							return

					if predict_path:
						print("Preparing predict file for upload")
						predictS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+predict_path.split("/")[-1]
						uploadpredict_resp=upload_to_showcase(predictS3Path,predict_path,servingproject["company"],auth_token)

						if not uploadpredict_resp=="Success":
							print("Predict file upload failed, try again")
							self.delete(servingproject["name"])
							return

					if postprocess_path:
						print("Preparing postprocess file for upload")
						postprocessS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+postprocess_path.split("/")[-1]
						uploadpostprocess_resp=upload_to_showcase(postprocessS3Path,postprocess_path,servingproject["company"],auth_token)

						if not uploadpostprocess_resp=="Success":
							print("postprocess file upload failed, try again")
							self.delete(servingproject["name"])
							return
					
					try:
						deployment_model_type="automl"
						if subtype in ["python","onnx","pythonscore"]:
							deployment_model_type="regular"
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"false",deployment_model_type,subtype,image,preprocess=preprocess_path,postprocess=postprocess_path,predict=predict_path)
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your model, please try again!")						
						return

					if type(servingmodel)==dict and "id" in servingmodel:    
						print("Project created!")
						if subtype not in ["python","pythonscore","onnx"]:
							print("Fetching I/O attributes from the project")
							if not parser(model_path,servingproject,servingmodel["id"],subtype,auth_token):
								print("Some error occurred while fetching attributes")
								self.delete(servingproject["name"])
								return
						publishproject=invoke_publishproject(servingproject["id"],infra,auth_token)
						# print(publishproject)
						print("Publishing the project...this might take a while")
						if type(publishproject)==dict and "success" in publishproject and publishproject["success"]==True:
							signal.signal(signal.SIGINT, signal_handler)

							loadingDisplay=True
							loadingThreadObj=threading.Thread(target=loadingDisplayFunc, args=("You can press Ctrl+C and check project status using cldz ls or wait till deployed ",))
							loadingThreadObj.start()
							# print("You can press Ctrl+C and check project status using cldz ls or wait till deployed")
							if(wait_for_saved_successfully(servingproject["id"],auth_token)):
								createEvent("deploy",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
								print("\nModel deployed!")
								# update_local_project_list(servingproject["name"],"add")
								self.describe(servingproject["name"])
							else:
								print("Error deploying your project, deploy again")
								createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
								# self.delete(servingproject["name"])
								return
						else:
							self.delete(servingproject["name"])
							createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
							print(publishproject)
							return
					else:
						self.delete(servingproject["name"])
						createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
						print(servingmodel)
						return
				else:
					createEvent("deploy failed",creds['cid'],auth_token,servingproject["id"],servingproject["name"])
					self.delete(servingproject["name"])
					print(uploadmodel_resp)		
					return	
			else:
				print(servingproject)

	def addfiles(self, name, *args):

		if not name or name=="":
			print("Choose a specific project!")
			return

		if len(args)==0:
			print("no files given")
			return

		creds=self.loggedin()		
		auth_token=creds['token']

		headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token}

		name=find_full_project_name(name)

		print("Fetching project "+name)

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		serving_project=requests.get(servingprojectsurl,headers=headers)

		serving_project = parse_json(serving_project.text)

		if len(serving_project)==0 or type(serving_project)==str:
			print("Project not found")
			return

		servingproject=serving_project[0]

		servingmodelsurl=BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingproject["id"])
		servingmodel=requests.get(servingmodelsurl,headers=headers)
		
		servingmodel=parse_json(servingmodel.text)

		if len(servingmodel)==0:
			print("Some error occurred")
			return

		servingmodel = servingmodel[0]

		for filePath in args:
			if not os.path.isfile(filePath):
				print("Path not found "+filePath)
				exit(0)

		s3OtherFiles=[]
		otherfilenames=[]

		for filePath in args:
			file_name=filePath.split("/")[-1]
			print("Attempting {} upload".format(file_name))
			s3Path=creds["cid"]+"/"+name+"/"+file_name
			uploadmodel_resp=upload_to_showcase(s3Path,filePath,creds['cid'],auth_token)

			s3OtherFiles.append(s3Path)
			otherfilenames.append(file_name)
			# if uploadmodel_resp=="Success":
			print(file_name, uploadmodel_resp)

		update_serving_model(servingmodel['id'],{"s3_other_files":s3OtherFiles,"otherfilenames":otherfilenames},auth_token)
		
	def removefiles(self,name,*args):

		if not name or name=="":
			print("Choose a specific project!")
			return

		if len(args)==0:
			print("no files given")
			return

		creds=self.loggedin()		
		auth_token=creds['token']

		headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token}

		name=find_full_project_name(name)

		print("Fetching project "+name)

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		serving_project=requests.get(servingprojectsurl,headers=headers)

		serving_project = parse_json(serving_project.text)

		if len(serving_project)==0 or type(serving_project)==str:
			print("Project not found")
			return

		servingproject=serving_project[0]

		servingmodelsurl=BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingproject["id"])
		servingmodel=requests.get(servingmodelsurl,headers=headers)
		
		servingmodel=parse_json(servingmodel.text)

		if len(servingmodel)==0:
			print("Some error occurred")
			return

		servingmodel = servingmodel[0]

		if "otherfilenames" in servingmodel and len(servingmodel['otherfilenames'])>0:
			for filePath in args:
				file_name=filePath.split("/")[-1]
				if file_name in servingmodel['otherfilenames']:
					servingmodel['otherfilenames'].remove(file_name)

				for s3Path in servingmodel['s3_other_files']:
					if file_name in s3Path:
						servingmodel['s3_other_files'].remove(s3Path)


		update_serving_model(servingmodel['id'],{"otherfilenames":servingmodel['otherfilenames'],"s3_other_files":servingmodel['s3_other_files']},auth_token)


	def ldeploy(self,file_path,model_type=None,notebook_type=None,requirements=None,predict=None,preprocess=None,postprocess=None,infra="standard",schema=None):

		try:
			shutil.rmtree(LAMBDA_FUNCTION_DIR)
		except Exception as e:
			pass
		check_aws_cli_exists()

		if not aws_region_set(LOCAL_DIR):
			print("aws default region not set : aws configure set default.region {AWS_REGION}")
			return

		if infra not in LAMBDA_SUPPORTED_INFRA_TYPES:
			print("Given infra type is not supported, options : ", end=" ")
			for i in LAMBDA_SUPPORTED_INFRA_TYPES:
				print(i,end=" ")

		requirements_path = requirements

		creds=self.loggedin()
		auth_token=creds["token"]

		# userS3Bucket = get_user_s3_bucket(creds['cid'],creds['token'])

		execution_type="notebook"
		subtype="pythonscore"

		if model_type and notebook_type:
			print("Parameters unclear, both notebook and model types selected")
			return

		if model_type:
			if model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
				execution_type="model"
				if model_type=="python":
					subtype="pythonscore"
				else:
					subtype=model_type
			else:
				print("Specified model type is not currently supported "+model_type)
				print("Supported model types:")
				for supported_model_type in SUPPORTED_MODEL_EXECUTION_TYPES:
					print(supported_model_type)
				return

		if notebook_type:
			if notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
				if notebook_type=="python":
					subtype="pythonscore"
				else:
					subtype=notebook_type
			else:
				print("Specified notebook type is not currently supported")
				for supported_notebook_type in SUPPORTED_NOTEBOOK_EXECUTION_TYPES:
					print(supported_notebook_type)
				return

		if not file_path:
			self.help()
			return

		if not os.path.isfile(file_path):
			print("Model path not given")
			return

		# if model_type not in SUPPORTED_MODEL_EXECUTION_TYPES:
		# 	print("Model type not currently supported")
		# 	exit(0)

		filename = file_path.split("/")[-1]
		projectName = unique_project_name(filename)
		# subtype=model_type
		pipPackages=[]

		if execution_type=="notebook":
			notebook_path=file_path

			checkPathExists(notebook_path)
			# if not os.path.exists(notebook_path):
			# 	print("Notebook path does not exist "+ notebook_path)
			# 	return

			if not notebook_path.endswith(".ipynb"):
				print("File path does not point to a jupyter notebook" + notebook_path)
				return

			checkPathExists(requirements_path)
			# if (requirements_path!=None and not os.path.exists(requirements_path)):
			# 	print("Notebook path does not exist "+ requirements_path)
			# 	return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)
			else:
				pipPackages=get_from_pipreqsnb(notebook_path)

			print("TYPE : NOTEBOOK")
			print("NOTEBOOK FILE PATH : " + notebook_path)
			print("FETCHED PIP PACKAGES : ", pipPackages)

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Deployment will continue in ",10)

			servingproject=create_serving_project(notebook_path.split("/")[-1],creds['cid'],auth_token, projectName=projectName)			
			if type(servingproject)==dict and "id" in servingproject:
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=notebook_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,notebook_path,servingproject["company"],auth_token)
				if uploadmodel_resp=="Success":
					try:
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"true","regular",subtype,"standard",is_lambda_deploy="true")
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your notebook, please try again!")
						return

					publishproject=invoke_publishproject(servingproject["id"],infra,auth_token,False)

					if type(servingmodel)==dict and "id" in servingmodel:
						print("Project created!")

						projectConfig = fetchprojectconfig(servingproject["id"])
						projectConfig['lambda']="true"

						notebookAccessUrl = lambda_deploy_codebuild(LOCAL_DIR,"nb", projectName, projectName+"-stack", projectConfig, notebook_path,infra,pipPackages,timeout=15*60)
						print("NOTEBOOK ACCESS URL : ",notebookAccessUrl)					
						update_serving_model(servingmodel['id'],{"status":"Running","status_message":"Deployed successfully","accessUrl":notebookAccessUrl},auth_token)
					else:
						print("Notebook upload failed, could not deploy project")
						return

		
		if execution_type=="model":
			model_path=file_path

			if subtype in ["python","onnx","pythonscore"]:
				predict_path=predict
			else:
				predict_path=None
			preprocess_path=preprocess
			postprocess_path=postprocess

			inputAttrs=[{"inputList":[], "rawinputList":[]}] 
			outputAttrs=[{"outputlist": [],"finaloutput":[]}]
			if schema:
				inputAttrs, outputAttrs = parse_yaml(schema)

			if subtype in ["python","onnx","pythonscore"] and not predict_path:
				print("Predict function path not found")
				return

			if not model_path:
				print("Model not provided, exiting")
				return

			checkPathExists(model_path)
			# if not os.path.exists(model_path):
			# 	print("Model path does not exist "+ model_path)
			# 	return

			if preprocess_path:
				checkPathExists(preprocess_path)
				checkFileSyntax(preprocess_path)
				# if not os.path.exists(preprocess_path):
				# 	print("Preprocess path does not exist " + preprocess_path)
				# 	return
				
				checkFileType(preprocess_path,".py")
				# if not preprocess_path.endswith(".py"):
				# 	print("Preprocess path not a python file "+preprocess_path)
				# 	return

			if postprocess_path: 
				checkPathExists(postprocess_path)
				checkFileSyntax(postprocess_path)
				# if not os.path.exists(postprocess_path):
				# 	print("Preprocess path does not exist " + postprocess_path)
				# 	return
				checkFileType(postprocess_path,".py")
				# if not postprocess_path.endswith(".py"):
				# 	print("Postprocess path not a python file "+postprocess_path)
				# 	return

			if predict_path:
				checkPathExists(predict_path)
				checkFileSyntax(predict_path)

				# if "modelPath=" not in open(predict_path,'r').read():
				# 	prepend_line(predict_path,"modelPath='/home/app/function/model.file'")
				# if not os.path.exists(predict_path):
				# 	print("Preprocess path does not exist " + predict_path)
				# 	return	
				checkFileType(predict_path,".py")
				if not predict_path.endswith(".py"):
					print("Postprocess path not a python file "+predict_path)
					return
			
			if requirements_path!=None:
				pipPackages=parse_requirements(requirements_path)
			else:
				if subtype in ["python","onnx","pythonscore"] and predict_path:
					pipPackages=get_from_pipreqsnb(predict_path)
			print("TYPE : MODEL")
			print("MODEL PATH : " + model_path)
			if subtype in ["python","onnx","pythonscore"]:
				print("PREDICT PATH : " ,predict_path)
			print("SUBTYPE:" ,subtype)
			print("PREPROCESS PATH : " , preprocess_path)
			print("POSTPROCESS PATH : " ,postprocess_path)
			if subtype in ["python","onnx","pythonscore"]:
				print("FETCHED PIP PACKAGES : ", pipPackages)

			print("Please check the above project attributes.")
			display_timer("In case something looks wrong, press Ctrl + C and try again with correct values. Deployment will continue in ",10)
		
			servingproject=create_serving_project(file_path.split("/")[-1],creds['cid'],auth_token,projectName=projectName,inputAttrs=inputAttrs,outputAttrs=outputAttrs)
			# print(type(servingproject))
			model_path=file_path
			# preprocess_path=postprocess_path=predict_path=None
			if type(servingproject)==dict and "id" in servingproject:		
				update_local_project_list(servingproject["name"],"add")
				# we will take filename from path
				file_name=model_path.split("/")[-1]
				s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
				uploadmodel_resp=upload_to_showcase(s3Path,model_path,servingproject["company"],auth_token)
				preprocessS3Path=None
				postprocessS3Path=None
				predictS3Path=None
				if uploadmodel_resp=="Success":
					if preprocess_path:
						print("Preparing preprocess file for upload")
						preprocessS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+preprocess_path.split("/")[-1]
						uploadpreprocess_resp=upload_to_showcase(preprocessS3Path,preprocess_path,servingproject["company"],auth_token)

						if not uploadpreprocess_resp=="Success":
							print("Preprocess file upload failed, try again")
							self.delete(servingproject["name"])
							return

					if predict_path:
						print("Preparing predict file for upload")
						predictS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+predict_path.split("/")[-1]
						uploadpredict_resp=upload_to_showcase(predictS3Path,predict_path,servingproject["company"],auth_token)

						if not uploadpredict_resp=="Success":
							print("Predict file upload failed, try again")
							self.delete(servingproject["name"])
							return

					if postprocess_path:
						print("Preparing postprocess file for upload")
						postprocessS3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+postprocess_path.split("/")[-1]
						uploadpostprocess_resp=upload_to_showcase(postprocessS3Path,postprocess_path,servingproject["company"],auth_token)

						if not uploadpostprocess_resp=="Success":
							print("postprocess file upload failed, try again")
							self.delete(servingproject["name"])
							return

					try:
						deployment_model_type="automl"
						if subtype in ["python","onnx","pythonscore"]:
							deployment_model_type="regular"
						servingmodel=create_serving_model(file_name,s3Path,servingproject,servingproject["id"],pipPackages,auth_token,"false",deployment_model_type,subtype,"standard",preprocess=preprocess_path,postprocess=postprocess_path,predict=predict_path,is_lambda_deploy="true")
					except Exception as e:
						print(e)
						print("Some exception occurred while preparing your model, please try again!")						
						return

					publishproject=invoke_publishproject(servingproject["id"],infra,auth_token,False)					

					if type(servingmodel)==dict and "id" in servingmodel:    
						print("Project created!")
						if subtype not in ["python","pythonscore"]:
							print("Fetching I/O attributes from the project")
							if not parser(model_path,servingproject,servingmodel["id"],subtype,auth_token):
								print("Some error occurred while fetching attributes")
								self.delete(servingproject["name"])
								return
					else:
						print("Some error occurred while creating model")
						return

					projectConfig = fetchprojectconfig(servingproject["id"])
					projectConfig['lambda']="true"

					modelAccessUrl = lambda_deploy_codebuild(LOCAL_DIR,"model", projectName, projectName+"-stack", projectConfig, model_path,infra,pipPackages,preprocess_path,postprocess_path,predict_path)
					print("\nWEB APP URL : ",modelAccessUrl)
					update_serving_model(servingmodel['id'],{"status":"Running","status_message":"Deployed successfully","accessUrl":modelAccessUrl},auth_token)
				else:
					print("Model upload failed, could not deploy project")
					return
	
	def ldelete(self,name):
		print("Deleting project in AWS Lambda")

		creds = self.loggedin()
		auth_token=creds['token']
		headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token}
		
		name = find_full_project_name(name)

		print("PROJECT:",name)

		lambda_delete(name,LOCAL_DIR)	

		servingprojectsurl=BASE_URL+'/api/servingproject?where={"name":"%s","company":"%s"}' % (name,creds['cid'])
		servingproject=requests.get(servingprojectsurl,headers=headers)
		
		servingproject=parse_json(servingproject.text)

		if len(servingproject)==0:
			print("Could not find project")
			return

		servingproject=servingproject[0]

		servingmodelsurl=BASE_URL+'/api/servingmodel?where={"servingproject":"%s"}' % (servingproject["id"])
		servingmodel=requests.get(servingmodelsurl,headers=headers)
		
		servingmodel=parse_json(servingmodel.text)

		if len(servingmodel)==0:
			print("Some error occurred")
			return

		servingmodel = servingmodel[0]

		update_serving_model(servingmodel['id'],{"status":"Not Running","status_message":"","accessUrl":"","lambda":"false"},auth_token)
		# self.delete(name)	

def main():
	if len(sys.argv)==1:
		print("NAME")
		print("    cldz")
		print(" ")
		print("Options in {} are optional")
		print(" ")
		print("SYNOPSIS")
		print("    cldz COMMAND")
		print(" ")
		print("COMMANDS")
		print("    COMMAND is one of the following:")
		print("    ")
		print("        delete $PROJECT_NAME : delete an existing project")
		print("    ")
		print("        deploy $NOTEBOOK_PATH {REQUIREMENTS_PATH} : create a new project, upload notebook/model and deploy")
		print("    ")
		print("        describe $PROJECT_NAME : get details of the existing project")
		print("    ")
		print("        loggedin : to check whether logged in with cldz or not")
		print("    ")
		print("        login")
		print("    ")
		print("        logout")
		print("    ")
		print("        ls : list all the projects")
		print("    ")
		print("        start $PROJECT_NAME : start an existing project")
		print("    ")
		print("        stop $PROJECT_NAME : stop an existing project")
		print("    ")
	else:
		fire.Fire(Clouderizer(), name='cldz')


if __name__ == '__main__':
	# if len(sys.argv)==1:
	# 	print("NAME")
	# 	print("    cldz")
	# 	print(" ")
	# 	print("Options in {} are optional")
	# 	print(" ")
	# 	print("SYNOPSIS")
	# 	print("    cldz COMMAND")
	# 	print(" ")
	# 	print("COMMANDS")
	# 	print("    COMMAND is one of the following:")
	# 	print("    ")
	# 	print("        delete $PROJECT_NAME : delete an existing project")
	# 	print("    ")
	# 	print("        deploy $NOTEBOOK_PATH {REQUIREMENTS_PATH} : create a new project, upload notebook/model and deploy")
	# 	print("    ")
	# 	print("        describe $PROJECT_NAME : get details of the existing project")
	# 	print("    ")
	# 	print("        loggedin : to check whether logged in with cldz or not")
	# 	print("    ")
	# 	print("        login")
	# 	print("    ")
	# 	print("        logout")
	# 	print("    ")
	# 	print("        ls : list all the projects")
	# 	print("    ")
	# 	print("        start $PROJECT_NAME : start an existing project")
	# 	print("    ")
	# 	print("        stop $PROJECT_NAME : stop an existing project")
	# 	print("    ")
	# else:
	main()
