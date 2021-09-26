

# from clouderizer_beta.operator_this import AwsLambdaDeploymentOperator
# from clouderizer_beta.operator_this import create_aws_lambda_cloudformation_template_file,create_aws_codebuild_cloudformation_template_file,create_aws_codebuild_buildspec
# from clouderizer_beta.utils import call_sam_command,call_bash,cleanup_build_files,upload_to_showcase,get_creds,parse_json
import shutil
import os
from pathlib import Path
import json
import site
import requests
from time import sleep
import threading
import sys

dir_name = os.path.dirname(os.path.realpath(__file__)).split("/")[-1]
if dir_name == "clouderizer_beta" or "beta" in dir_name:
	from clouderizer_beta.operator_this import create_aws_lambda_cloudformation_template_file,create_aws_codebuild_cloudformation_template_file,create_aws_codebuild_buildspec
	from clouderizer_beta.utils import call_sam_command,call_bash,cleanup_build_files,upload_to_showcase,get_creds,parse_json
	from clouderizer_beta import globals
else:
	from clouderizer.operator_this import create_aws_lambda_cloudformation_template_file,create_aws_codebuild_cloudformation_template_file,create_aws_codebuild_buildspec
	from clouderizer.utils import call_sam_command,call_bash,cleanup_build_files,upload_to_showcase,get_creds,parse_json
	from clouderizer import globals

loadingDisplay=False
stop_loading_thread=False


def aws_region_set(project_dir):
	awsRegionCode, awsRegionStdout, awsRegionStderr = call_bash(
		["aws","configure","get","region"],
		project_dir
	)

	awsRegionStdout = awsRegionStdout.replace("\n","")
	if not awsRegionStdout:
		return False
	return True

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

def lambda_delete(project_name,project_dir):
		project_name=project_name.replace("-","")
		stackName = project_name + "-stack"
		stackName=stackName.replace("-","")

		return_code, stdout , stderr = call_bash(["aws","cloudformation","delete-stack","--stack-name",stackName],project_dir)

def wait_for_stack_update(stackName):

	# print("Waiting for stack update...")
	describeStackCode, describeStackStdout, describeStackStderr = call_bash(
		[
			"aws",
			"cloudformation",
			"describe-stacks"
		],
		os.getcwd()
	)
	accessUrl=None
	if describeStackCode == 0:
		describeStackStdout = json.loads(describeStackStdout)
		for stack in describeStackStdout["Stacks"]:
			if stack["StackName"] == stackName:
				stackStatus = stack["StackStatus"]
				if stackStatus != "CREATE_COMPLETE" and stackStatus != "ROLLBACK_COMPLETE":
					sleep(5)
					return wait_for_stack_update(stackName)
				else:
					if stackStatus == "ROLLBACK_COMPLETE":
						print("Some error occurred while deploying to lambda")
						exit(0)

					if stackStatus == "CREATE_COMPLETE":
						for output in stack["Outputs"]:
							# print(output)

							if "OutputKey" not in output:
								return wait_for_stack_update(stackName)

							if output["OutputKey"] == "EndpointUrl":
								accessUrl = output["OutputValue"]
								# print("Model access url:", accessUrl)
								return accessUrl

		sleep(5)
		return wait_for_stack_update(stackName)

	else:
		print(describeStackStderr)
		exit(0)

def update_aws_configure_settings(LOCAL_PATH):
	f = open(LOCAL_PATH,'r')
	user_data= f.read()
	f.close()

	user_data = parse_json(user_data)

	user_data['awsCodeBuildSetup'] = "true"

	f = open(LOCAL_PATH,'w')

	f.write(json.dumps(user_data))
	f.close()

def lambda_deploy_codebuild(base_dir,namespace,project_name,stackName, projectConfig, model_path,infra,pipPackages,preprocess_path=None,postprocess_path=None,predict_path=None,timeout=30):
		
		# print(os.getcwd())
		# exit(0)

		global stop_loading_thread
		global loadingDisplay

		globals.init()
		dockerfiles = ['AutomlDockerfile','PythonDockerfile']
		LOCAL_DIR=os.getenv("HOME") + "/.clouderizer"
		DOCKERFILES_LOC = LOCAL_DIR+"/dockerfiles/"

		creds = get_creds()

		# for dockerfile in dockerfiles:
		# 	if not os.path.exists(DOCKERFILES_LOC):
		# 		Path(DOCKERFILES_LOC).mkdir(parents=True,exist_ok=True)

		# 	# if not os.path.exists(DOCKERFILES_LOC+dockerfile):
		# 	resp=requests.post(BASE_URL+'/givemelambdadockerfile',json={
		# 		"type": dockerfile
		# 	},headers={"Content-Type":"application/json"})

		# 	if resp.status_code==200:
		# 		open(DOCKERFILES_LOC+dockerfile,"w").write(resp.text)

		clouderizerProjectName = project_name
		project_name=project_name.replace("-","")
		stackName=stackName.replace("-","")
		# print("Subtype lambda_deploy type:", projectConfig["subtype"])

		project_dir = base_dir + "/lambda-dir"
		Path(project_dir).mkdir(parents=True, exist_ok=True)

		function_dir = project_dir + "/function"
		Path(function_dir).mkdir(parents=True, exist_ok=True)

		asset_dir = function_dir + "/asset"
		Path(asset_dir).mkdir(parents=True, exist_ok=True)

		if projectConfig["subtype"] in ["h2o","pmml","dai","pmml4s"]:
			shutil.copy(base_dir+'/dockerfiles/AutomlDockerfile',project_dir+"/Dockerfile")

			# s3Path=creds['cid']+"/"+clouderizerProjectName+"/Dockerfile"
			# dockerupload_resp = upload_to_showcase(globals.BASE_URL,s3Path,project_dir+"/Dockerfile",creds['cid'],creds['token'])
			# print("Docker upload status: ", dockerupload_resp)
			# print("Pulling automl docker image")

			# dockerpullCode, dockerpullStdout, dockerpullStderr = call_bash(
			# 	["sudo","docker","pull","clouderizer/cldz-lambda-java-baseimage:semifinal"],
			# 	project_dir
			# )
			# print("PROJECT DIR",project_dir)
			# shutil.copy(site.getusersitepackages()+'/clouderizer_beta/dockerfiles/AutomlDockerfile',project_dir+"/Dockerfile")

		if projectConfig["subtype"] in ["python","pythonscore","onnx","train"]:
			shutil.copy(base_dir+'/dockerfiles/PythonDockerfile',project_dir+"/Dockerfile")

			# s3Path=creds['cid']+"/"+clouderizerProjectName+"/Dockerfile"
			# dockerupload_resp = upload_to_showcase(globals.BASE_URL,s3Path,project_dir+"/Dockerfile",creds['cid'],creds['token'])
			# print("Docker upload status: ", dockerupload_resp)
			# shutil.copy(site.getusersitepackages()+'/clouderizer_beta/dockerfiles/PythonDockerfile',project_dir+"/Dockerfile")
			# os.mknod(function_dir+"/requirements.txt")
			# print("Pulling python docker image")
			# dockerpullCode, dockerpullStdout, dockerpullStderr = call_bash(
			# 	["sudo","docker","pull","clouderizer/cldz-lambda-python-baseimage:latest"],
			# 	project_dir
			# )
			
			Path(function_dir+"/requirements.txt").open(mode='w')

			pipPackagesFile = open(function_dir+"/requirements.txt",'w')
			# print("pipPackages here",pipPackages)
			if len(pipPackages)>0:
				for pipPackage in pipPackages:
					# pipPackagesFile.write("\n")
					pipPackagesFile.write(pipPackage+"\n")

			pipPackagesFile.close()

			if len(pipPackages)>0:
				s3Path=creds['cid']+"/"+clouderizerProjectName+"/requirements.txt"
				req_uploads = upload_to_showcase(globals.BASE_URL,s3Path,function_dir+"/requirements.txt",creds['cid'],creds['token'])
				# print("Req upload status: ", req_uploads)

		writeObj = open(function_dir+"/projectConfig.json","w")
		writeObj.write(json.dumps(projectConfig))
		writeObj.close()

		# s3Path=creds['cid']+"/"+clouderizerProjectName+"/projectConfig.json"
		# projectConfig_status = upload_to_showcase(globals.BASE_URL,s3Path,function_dir+"/projectConfig.json",creds['cid'],creds['token'])
		# print("Docker upload status: ", projectConfig_status)

		if preprocess_path:
			shutil.copy(preprocess_path,function_dir+"/preprocess.py")
		
		if postprocess_path:
			shutil.copy(postprocess_path,function_dir+"/postprocess.py")

		if predict_path:
			shutil.copy(predict_path,function_dir+"/pypredict.py")

		shutil.copy(model_path,asset_dir+"/model.file")

		apiNames = [project_name+"Api"]
		stack_name = stackName

		ecr_name = "clouderizer-lambda"

		print("Checking for default aws region configured in aws cli")

		awsRegionCode, awsRegionStdout, awsRegionStderr = call_bash(
			["aws","configure","get","region"],
			project_dir
		)

		awsRegionStdout = awsRegionStdout.replace("\n","")
		print("Configured region: ", awsRegionStdout)

		aws_region = awsRegionStdout
		if not awsRegionStdout:
			aws_region = "us-east-2"
			print("Choosing ",aws_region)

		return_code, stdout, stderr = call_bash(
			["aws", "ecr", "create-repository", "--repository-name" ,ecr_name,
			"--image-tag-mutability", "IMMUTABLE", "--image-scanning-configuration" ,"scanOnPush=true"],
			project_dir
		)

		# if not "RepositoryAlreadyExistsException" in stderr:
		return_code, stdout, stderr = call_bash(
			["aws", "sts", "get-caller-identity"],
			project_dir
		)

		# print(eval(stdout)["Account"])
		
		try:
			if not "Account" in eval(stdout):
				print("Could not retrieve aws credentials")
				exit(0)
		except Exception as e:
			print("Could not retrieve aws credentials")
			exit(0)

		registry_url = "{}.dkr.ecr.{}.amazonaws.com/{}".format(eval(stdout)["Account"],aws_region,ecr_name)

		if infra == "standard":
			memory = 2000

		if infra == "highmemory":
			memory = 8000

		create_aws_lambda_cloudformation_template_file(
			clouderizerProjectName,
			project_dir,
			namespace,
			project_name,
			apiNames,
			project_name,
			memory,
			timeout
		)

		shutil.copy(project_dir+'/template.yaml',os.getcwd()+'/template.yaml')

		# s3Path=creds['cid']+"/"+clouderizerProjectName+"/template.yaml"
		# template_status = upload_to_showcase(globals.BASE_URL,s3Path,os.getcwd()+'/template.yaml',creds['cid'],creds['token'])
		# print("template upload status: ", template_status)

		# print("Building docker image....")
		print("Initiating AWS Code build sequence")

		# print("awsCodeBuildSetup ",creds["awsCodeBuildSetup"])
		# if creds['awsCodeBuildSetup']=="false":
		create_aws_codebuild_cloudformation_template_file(
			project_name,
			project_dir,
			creds['cid'] + "/" + clouderizerProjectName + "/"
		)

		createStackCode, createStackOut, createStackErr = call_bash(["aws","cloudformation", "create-stack",
			"--stack-name", "cldz-codebuild-stack", "--template-body", "file://"+project_dir+"/codebuild.yaml", 
			"--capabilities","CAPABILITY_NAMED_IAM"],
			project_dir=os.getcwd())

		# print(createStackCode)
		# print(createStackOut)
		# print(createStackErr)

		# verify CREATE_COMPLETE status
		if createStackCode == 0:
			update_aws_configure_settings(globals.LOCAL_PATH)
		else:
			if not "AlreadyExistsException" in createStackErr:
				print("Error occurred while building the image")
				exit(0)


		modelName = model_path.split("/")[-1]
		# print(modelName)
		create_aws_codebuild_buildspec(
			stackName,
			aws_region,
			modelName,
			registry_url,
			project_dir,
			[predict_path,preprocess_path,postprocess_path]
		)

		from time import sleep
		sleep(30)

		# s3Path=creds['cid']+"/"+clouderizerProjectName+"/buildspec.yaml"
		# template_status = upload_to_showcase(globals.BASE_URL,s3Path,project_dir+"/buildspec.yaml",creds['cid'],creds['token'])
		# print("buildspec upload status: ", template_status)

		companyStarting = creds['cid'].split("-")[0]
		print("Creating S3 bucket named clouderizer-" + companyStarting)

		s3CreateCode, s3CreateStdout, s3CreateStderr = call_bash(
			["aws","s3","mb","s3://clouderizer-"+companyStarting],
			os.getcwd()
		)

		# print(s3CreateCode)
		# print(s3CreateStdout)
		# print(s3CreateStderr)

		if "BucketAlreadyOwnedByYou" in s3CreateStderr:
			print("Bucket already exists")

		s3CreateCode, s3CreateStdout, s3CreateStderr = call_bash(
			["aws","s3","sync",globals.LOCAL_DIR+"/lambda-dir","s3://clouderizer-{}/{}".format(companyStarting,clouderizerProjectName)],
			os.getcwd()
		)
		
		return_code, stdout, stderr = call_bash(
			["aws", "codebuild", "start-build", "--project-name", "cldz-codebuild", "--source-type-override", "S3", "--source-location-override", "clouderizer-{}/{}/".format(companyStarting,clouderizerProjectName)],
			# ["aws", "codebuild", "start-build", "--project-name", "cldz-codebuild", "--source-type-override", "S3", "--source-location-override", userS3Bucket+"/"+creds['cid'] + "/" + clouderizerProjectName + "/"],
			project_dir
		)

		# print(return_code)
		# print(stdout)
		# print(stderr)

		loadingDisplay=True
		loadingThreadObj=threading.Thread(target=loadingDisplayFunc, args=("Building project... ",))
		loadingThreadObj.start()

		url=wait_for_stack_update(stackName)

		if url.startswith("http"):
			loadingDisplay=False
			stop_loading_thread=True
			return url
		else:
			loadingDisplay=False
			stop_loading_thread=True
			print("Some error occurred while fetching the url")
			exit(0)

		# return wait_for_stack_update(stackName)
		

def lambda_deploy(base_dir,namespace,project_name,stackName, projectConfig, model_path,infra,pipPackages,preprocess_path=None,postprocess_path=None,predict_path=None,timeout=30):

		globals.init()
		dockerfiles = ['AutomlDockerfile','PythonDockerfile']
		LOCAL_DIR=os.getenv("HOME") + "/.clouderizer"
		DOCKERFILES_LOC = LOCAL_DIR+"/dockerfiles/"

		print(globals.BASE_URL)
		# for dockerfile in dockerfiles:
		# 	if not os.path.exists(DOCKERFILES_LOC):
		# 		Path(DOCKERFILES_LOC).mkdir(parents=True,exist_ok=True)

		# 	# if not os.path.exists(DOCKERFILES_LOC+dockerfile):
		# 	resp=requests.post(BASE_URL+'/givemelambdadockerfile',json={
		# 		"type": dockerfile
		# 	},headers={"Content-Type":"application/json"})

		# 	if resp.status_code==200:
		# 		open(DOCKERFILES_LOC+dockerfile,"w").write(resp.text)

		clouderizerProjectName = project_name
		project_name=project_name.replace("-","")
		stackName=stackName.replace("-","")
		# print("Subtype lambda_deploy type:", projectConfig["subtype"])

		project_dir = base_dir + "/lambda-dir"
		Path(project_dir).mkdir(parents=True, exist_ok=True)

		function_dir = project_dir + "/function"
		Path(function_dir).mkdir(parents=True, exist_ok=True)

		asset_dir = function_dir + "/asset"
		Path(asset_dir).mkdir(parents=True, exist_ok=True)

		if projectConfig["subtype"] in ["h2o","pmml","dai","pmml4s"]:
			shutil.copy(base_dir+'/dockerfiles/AutomlDockerfile',project_dir+"/Dockerfile")

			print("Pulling automl docker image")

			dockerpullCode, dockerpullStdout, dockerpullStderr = call_bash(
				["sudo","docker","pull","clouderizer/cldz-lambda-java-baseimage:semifinal"],
				project_dir
			)
			# print("PROJECT DIR",project_dir)
			# shutil.copy(site.getusersitepackages()+'/clouderizer_beta/dockerfiles/AutomlDockerfile',project_dir+"/Dockerfile")

		if projectConfig["subtype"] in ["python","pythonscore","onnx","train"]:
			shutil.copy(base_dir+'/dockerfiles/PythonDockerfile',project_dir+"/Dockerfile")
			# shutil.copy(site.getusersitepackages()+'/clouderizer_beta/dockerfiles/PythonDockerfile',project_dir+"/Dockerfile")
			# os.mknod(function_dir+"/requirements.txt")
			print("Pulling python docker image")
			dockerpullCode, dockerpullStdout, dockerpullStderr = call_bash(
				["sudo","docker","pull","clouderizer/cldz-lambda-python-baseimage:latest"],
				project_dir
			)
			
			Path(function_dir+"/requirements.txt").open(mode='w')

			pipPackagesFile = open(function_dir+"/requirements.txt",'w')
			# print("pipPackages here",pipPackages)
			if len(pipPackages)>0:
				for pipPackage in pipPackages:
					# pipPackagesFile.write("\n")
					pipPackagesFile.write(pipPackage+"\n")

			pipPackagesFile.close()

		writeObj = open(function_dir+"/projectConfig.json","w")
		writeObj.write(json.dumps(projectConfig))
		writeObj.close()

		if preprocess_path:
			shutil.copy(preprocess_path,function_dir+"/preprocess.py")
		
		if postprocess_path:
			shutil.copy(postprocess_path,function_dir+"/postprocess.py")

		if predict_path:
			shutil.copy(predict_path,function_dir+"/pypredict.py")

		shutil.copy(model_path,asset_dir+"/model.file")

		apiNames = [project_name+"Api"]
		stack_name = stackName

		ecr_name = "clouderizer-lambda"

		print("Checking for default aws region configured in aws cli")

		awsRegionCode, awsRegionStdout, awsRegionStderr = call_bash(
			["aws","configure","get","region"],
			project_dir
		)

		awsRegionStdout = awsRegionStdout.replace("\n","")
		print("Configured region: ", awsRegionStdout)

		aws_region = awsRegionStdout
		if not awsRegionStdout:
			aws_region = "us-east-2"
			print("Choosing ",aws_region)

		return_code, stdout, stderr = call_bash(
			["aws", "ecr", "create-repository", "--repository-name" ,ecr_name,
			"--image-tag-mutability", "IMMUTABLE", "--image-scanning-configuration" ,"scanOnPush=true"],
			project_dir
		)

		# if not "RepositoryAlreadyExistsException" in stderr:
		return_code, stdout, stderr = call_bash(
			["aws", "sts", "get-caller-identity"],
			project_dir
		)

		# print(eval(stdout)["Account"])

		try:
			if not "Account" in eval(stdout):
				print("Could not fetch aws account")
				exit(0)

		except Exception as e:
			print("Could not fetch aws account")
			exit(0)

		registry_url = "{}.dkr.ecr.{}.amazonaws.com/{}".format(eval(stdout)["Account"],aws_region,ecr_name)

		if infra == "standard":
			memory = 2000

		if infra == "highmemory":
			memory = 8000

		create_aws_lambda_cloudformation_template_file(
			clouderizerProjectName,
			project_dir,
			namespace,
			project_name,
			apiNames,
			project_name,
			memory,
			timeout
		)

		shutil.copy(project_dir+'/template.yaml',os.getcwd()+'/template.yaml')

		print("Building docker image....")

		return_code, stdout, stderr = call_sam_command(
			["build", "--use-container", "--region", aws_region],
			project_dir=os.getcwd(),
			region=aws_region,
		)
		if return_code != 0:
			error_message = stderr

			if error_message:
				print(error_message)
				exit(0)

			# print(stderr)
			# print(stdout)
			# raise BentoMLException(
			#     "Failed to build lambda function. {}".format(error_message)
			# )
		# logger.debug("Removing unnecessary files to free up space")
		template_file = os.path.join(os.getcwd(), ".aws-sam", "build", "template.yaml")

		print("Deploying project to AWS lambda")

		return_code, stdout, stderr = call_sam_command(
			[
				"deploy",
				"--stack-name",
				stack_name,
				"--capabilities",
				"CAPABILITY_IAM",
				"--template-file",
				template_file,
				"--region",
				aws_region,
				"--image-repositories",
				"{}={}".format(apiNames[0],registry_url)
			],
			project_dir=project_dir,
			region=aws_region,
		)
		if return_code != 0:
			error_message = stderr
			if error_message:
				print(error_message)
				exit(0)

		print(stdout)
		print("Project deployed!")
		print("Fetching project access urls")

		describeStackCode, describeStackStdout, describeStackStderr = call_bash(
			[
				"aws",
				"cloudformation",
				"describe-stacks"
			],
			project_dir
		)

		accessUrl=None
		if describeStackCode == 0:
			describeStackStdout = json.loads(describeStackStdout)
			for stack in describeStackStdout["Stacks"]:
				if stack["StackName"] == stackName:
					for output in stack["Outputs"]:
						if output["OutputKey"] == "EndpointUrl":
							accessUrl = output["OutputValue"]
			# print("WEB APP URL:", accessUrl)
			return accessUrl
		else:
			print(describeStackStderr)
			exit(0)

		cleanup_build_files(project_dir,apiNames[0])
		shutil.rmtree(function_dir)
		return accessUrl

		
