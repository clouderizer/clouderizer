import fire
import webbrowser
from six.moves.urllib import parse
import os
import pickle
import requests
from coolname import generate_slug
import json
import os
from time import sleep
import jwt
from prettytable import PrettyTable
import requirements

BASE_URL = "https://betaconsole.clouderizer.com"

upload_endpoint = BASE_URL + '/api/awsconfig/generatepresignedurl'

LOCAL_PATH=os.getenv("HOME") + "/.cldz"
display_table = PrettyTable()
display_table.field_names = ['Project Name','Created At', 'Status']

SCOPES=['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email' ,'openid']

def upload_to_showcase(file_name,file_loc,company,auth_token):
  print("Uploading model to Clouderizer.....")
  resp=requests.post(upload_endpoint,json={
      "type":"put",
      "key": file_name,
      "company": company
  },headers={"Content-Type":"application/json","Authorization": "Bearer "+auth_token})

  # print(resp.text)
  resp=json.loads(resp.text)

  if resp['success'] and "urls" in resp and len(resp["urls"])>0:
    print("Model upload in progress.......")
    # print(resp)
    f=open(file_loc,'rb')

    aws_response=requests.put(resp['urls'][0],data=f)
    if(aws_response.status_code==200):
      print("Upload successful.")
      return "Success"
    else:
      print("Some error occurred while uploading... try again")
      # status_response=requests.post(status_endpoint,json={
      #     "filename": file_name,
      #     "secret_key": secret_key
      # },headers={"Content-Type":"application/json"})
  return

def create_serving_project(companyid,auth_token,retry=0):
  name=generate_slug()
  print("Creating a project named "+name)

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

  auth_headers={"Authorization": "Bearer "+auth_token}
  project = {
    "name": name,
    "company": companyid,
    # "inputAttr": input_attr,
    # "outputAttr": output_attr
    # "inputAttr": [{"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""}], 
    # "outputAttr": [{"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "subtype":""}]
    # "company": "ad8b00cf-956f-4202-9bc8-7cf8c5eb5ff2"
  }

  resp=requests.post(BASE_URL+'/api/servingproject',data=project,headers=auth_headers)
  # print(resp.text)
  if(resp.status_code==200):
    return json.loads(resp.text)

  else:
    retry+=1
    if(retry>=1):
      return "Could not create model"
    sleep(5*retry)
    return create_serving_project(companyid,auth_token,retry)


def create_serving_model(file_name,s3Path,company,servingprojectid,pipPackages,auth_token,retry=0):
  auth_headers={"Authorization": "Bearer "+auth_token}

  model= {
    "model": file_name,
    "s3_zip_file": s3Path,
    "company": company,
    "servingproject": servingprojectid,
    "subtype": "pythonscore",
    "type": "regular",
    "training": "true",
    "pipPackages": pipPackages
    # "preprocessEnabled": False,
    # "postprocessEnabled":False
  }

  model_resp=requests.post(BASE_URL+'/api/servingmodel',data=model,headers=auth_headers)

  # print(model_resp.text)

  if(model_resp.status_code==200):
    return json.loads(model_resp.text)
  else:
    retry+=1
    if(retry>=5):
      return "Could not create model"
    sleep(5*retry)
    return create_serving_model(file_name,s3Path,company,servingprojectid,pipPackages,auth_token,retry)

#NOT IN USE
def get_serving_model(id,retry=0):
  model_resp=requests.get(BASE_URL+'/api/servingmodel/'+id)

  if model_resp.status_code==200:
    model= json.loads(model_resp.text)

    if model["status"]=="Running":
      print("Access url: "+BASE_URL+"/api/userserving/"+str(model["servingport"])+"-"+model["id"]+"-SH/train")
    else:
      sleep(5)
      if retry>=10:
        print("Model deployment failed!!")
      retry+=1
      get_serving_model(id,retry)


def invoke_publishproject(servingprojectid, auth_token):
  # print(servingprojectid)
  auth_headers={"Authorization": "Bearer "+auth_token}
  publishproject=requests.post(BASE_URL+'/api/servingproject/publishproject',headers=auth_headers,data={"projectId":servingprojectid})
  
  if publishproject.status_code==401:
    return "Authentication was unsuccessful! try cldz login"
  
  if publishproject.status_code==200:
    return json.loads(publishproject.text)
  else:
    return "Could not publish project"

def invoke_deployproject(servingprojectid, auth_token):
  auth_headers={"Authorization": "Bearer "+auth_token}
  deployproject=requests.post(BASE_URL+'/api/servingproject/deployproject',headers=auth_headers,data={"projectId":servingprojectid})

  if deployproject.status_code==401:
    return "Authentication was unsuccessful! try cldz login"

  if deployproject.status_code==200:
    return json.loads(deployproject.text)
  else:
    return "Could not deploy project"

def wait_for_saved_successfully(servingprojectid,auth_token):
  headers = {"Authorization":"Bearer "+auth_token}
  published_serving_projects=requests.get(BASE_URL+'/api/publishedservingproject?where={"servingproject":"%s"}' % servingprojectid,headers=headers)

  published_serving_projects=json.loads(published_serving_projects.text)

  # if len(published_serving_projects)==0:

  status_message=published_serving_projects[0]["status_message"]
  if "Saved" in status_message:
    return True
  elif "Error" in status_message:
    return False
  else:
    sleep(5)
    return wait_for_saved_successfully(servingprojectid,auth_token)

def parse_requirements(requirements_path):
  packages=[]
  with open(requirements_path) as fd:
    for req in requirements.parse(fd):
      if req.specs is not [] and len(req.specs)>0 and len(req.specs[0])>=2:
        packages.append(req.name+req.specs[0][0]+req.specs[0][1])
      else:
        packages.append(req.name)

  print("Packages in your requirements.txt "+str(packages))
  return packages


    

class Clouderizer(object):

  def login(self):
    print("Follow this url and get an api key: "+ BASE_URL +"/api/auth/google")

    webbrowser.open(BASE_URL+'/api/auth/google', new=1, autoraise=True)
    apiKey= input("Paste your api key:")

    try:
      payload=jwt.decode(apiKey,'oursecret', algorithms=['HS256'])
    except Exception as e:
      print("Could not verify token. Is it correct?")
      return

    payload["token"]=apiKey
    # print(payload)

    with open(LOCAL_PATH,'w') as f:
      f.write(json.dumps(payload))

    print("You are logged in!")
    print("Here's some commands you can try:")
    print("Get list of your projects on Clouderizer : cldz ls")
    print("Deploy a project : cldz deploy --model_path={PROJECT_PATH} --requirements")

  def ls(self):
    # get list of projects in published serving project
    creds = self.loggedin()

    if creds is None or "cid" not in creds or "uid" not in creds or "token" not in creds:
      print("Are you logged in? try: cldz login")
      return

    published_serving_projects=requests.post(BASE_URL+'/api/servingproject/getprojects',data={"company":creds["cid"]})
    try:
      published_serving_projects=json.loads(published_serving_projects.text)
    except Exception as e:
      print("Could not load projects!")
    # print(published_serving_projects)
    # creds["cid"]["id"])
    for project in published_serving_projects:
      # servingproject=requests.get(BASE_URL+'/api/servingproject/'+project['servingproject'])
      # print(servingproject.text)
      # try:
      #   servingproject=json.loads(servin)
      # except Exception as e:
      #   print("Could not load projects!")      
      # if 'key' not in servingproject:
      #   servingproject['key']=None
      url="-"
      if "Deployed successfully" in project['status_message']:
        project['status_message']="Deployed successfully"
        url = BASE_URL + "/api/async-function/"+project['name']+"/train"

      if project['servingproject'] and project['servingproject']['name']:
        display_table.add_row([project['servingproject']['name'], project['createdAt'],project['status_message']])
      # else:
      #   print(project['servingproject'])
      # display_table.add_row([project['name'].replace("clouderizer-","").replace("clouderizer123-",""), project['createdAt'],project['status_message']])

    print(display_table)

  def describe(self, name):
    if not name:
      print("Choose a specific project!")
      return

    creds=self.loggedin()
    if creds is None or "cid" not in creds or "uid" not in creds or "token" not in creds:
      print("Are you logged in? try: cldz login")
      return

    headers = {"Authorization":"Bearer "+creds["token"]}

    customer_dets=requests.get(BASE_URL+'/api/customer/'+creds['cid'],headers=headers)

    try:
      customer_dets = json.loads(customer_dets.text)
    except Exception as e:
      print("Could not fetch your details")
      return

    published_serving_projects=requests.get(BASE_URL+'/api/publishedservingproject?where={"name":"%s"}' % (customer_dets["name"]+"-"+name),headers=headers)
    
    try:
      published_serving_project = json.loads(published_serving_projects.text)
    except Exception as e:
      print("Could not fetch your project")
      return

    status_message=None
    if "Deployed successfully" in published_serving_project[0]["status_message"]:
      status_message="Deployed successfully"
    if len(published_serving_project)>0:
      print("Project status : ", status_message)

      if "Deployed successfully"==status_message:
        print("Training url : "+ BASE_URL + "/api/async-function/"+published_serving_project[0]["name"]+"/train")
      else:
        print("Training URL will be accessible here after project gets deployed!")
    
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
    #       print("Training url : "+ BASE_URL + "/api/async-function/"+published_serving_project[0]["name"]+"/train")
    #     else:
    #       print("Training URL will be accessible here after project gets deployed!")

  def loggedin(self):
    # have a .cldzrc file which stores api key
    creds=None
    if os.path.exists(LOCAL_PATH):
      with open(LOCAL_PATH, 'r') as token:
        data=token.read()
        if os.stat(LOCAL_PATH).st_size != 0:
          try:
            creds = json.loads(data)
          except Exception as e:
            print(e)
            print("Couldn't verify your credentials, please login again")
          return creds
        else:
          print("You are1 not logged in, try: cldz login")
          return None
      return creds
    else:
      print("You are not logged in, try: cldz login")
      return None

  
  def logout(self):
    if os.path.exists(LOCAL_PATH):
      os.remove(LOCAL_PATH)

    print("You have been successfully logged out")

  def deploy(self, model_path, requirements_path=None):
    creds=self.loggedin()

    if creds is None or "cid" not in creds or "uid" not in creds or "token" not in creds:
      print("Are you logged in? try: cldz login")
      return

    if not os.path.exists(model_path):
      print("Model path does not exist "+ model_path)
      return

    if (requirements_path!=None and not os.path.exists(requirements_path)):
      print("Model path does not exist "+ model_path)
      return

    pipPackages=None
    if requirements_path!=None:
      pipPackages=parse_requirements(requirements_path)

    auth_token=creds["token"]
    servingproject=create_serving_project(creds['cid'],auth_token)
    # print(type(servingproject))
    if type(servingproject)==dict and "id" in servingproject:
      # we will take filename from path
      file_name=model_path.split("/")[-1]
      s3Path=servingproject["company"]+"/"+servingproject["name"]+"/"+file_name
      uploadmodel_resp=upload_to_showcase(s3Path,model_path,servingproject["company"],auth_token)
      if uploadmodel_resp=="Success":
        servingmodel=create_serving_model(file_name,s3Path,servingproject["company"],servingproject["id"],pipPackages,auth_token)
        if type(servingmodel)==dict and "id" in servingmodel:    
          print("Project created!")
          publishproject=invoke_publishproject(servingproject["id"],auth_token)
          # print(publishproject)
          print("Publishing the project")
          if type(publishproject)==dict and "success" in publishproject and publishproject["success"]==True:
            if(wait_for_saved_successfully(servingproject["id"],auth_token)):
              deployproject=invoke_deployproject(servingproject["id"],auth_token)
              # print(deployproject)
              if type(deployproject)==dict and "success" in deployproject and deployproject["success"]==True:
                print("Project deployed!")
              else:
                print(deployproject)
            else:
              print("Error saving your project")
          else:
            print(publishproject)
        else:
          print(servingmodel)
    else:
      print(servingproject)


def main():
  fire.Fire(Clouderizer(), name='clouderizer')


if __name__ == '__main__':
  main()