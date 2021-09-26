import { Directive, Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { fileService } from '../../services/s3fileupload.service';
import { NotifyService } from '../../services/notify.service';
import { sharedService } from '../../services/shared.service';
import { v4 as uuid } from 'uuid';
import { MiscService } from '../../services/misc.service';
import * as CryptoJS from 'crypto-js';
import { NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-new-project-modal',
  templateUrl: './new-project-modal.component.html',
  styleUrls: ['./new-project-modal.component.scss']
})
export class NewProjectModalComponent implements OnInit {

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  @Input() projectName;
  @Input() subtype;
  @Input() training;
  @Input() projectModel;
  @Input() projectId;
  @Input() updateModel;
  @Output() emitModel = new EventEmitter();

  modelUpload: boolean=false;
  modelSelect: boolean=false;
  projectSave: any={};
  requirements: any;
  projectSelect: boolean=true;
  projectExists: boolean=false;
  projectDescription: string;
  percentLoaded:any=0;
  showdeps:boolean;
  showother:boolean;
  showtextarea:boolean;
  pipPackages: any;
  modelDetails: any = {"type": "automl", "otherfiles": [], "s3_other_files":[], "otherfilenames": [], "edited": false, "lbpercent": 100, "requests": 0, "feedback": 0, "responseTime": 0, "like": 0, "dislike": 0, "notResponded": 0};
  licenseDetails: any={};
  model: any;
  files:any[]=[];
  
  notebookfiles:any[]=[];
  otherfiles:any[]=[];
  requirementfiles:any[]=[];
  licensefiles:any[]=[];
  private user: any; 
  licenseFileName: string;
  hideBackButton: boolean=false;
  uploadFile: boolean=false;
  imagetype: string="standard";
  autoMLlists: string[] = ['h2o.ai', 'pmml', 'pythonscore', 'onnx'];
  timeSeries: boolean;
  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private router: Router,
    private fileService: fileService,
    private notifyService: NotifyService,
    private dataService: sharedService,
    private miscService: MiscService,
    public spinner: NgxSpinnerService,
    ) {}


  ngOnInit() {
    if(!this.training){
      this.training = false;
    }

    if(this.projectName){  
      console.log("update model")
      this.modelSelect = false;
      this.projectSelect = false;
      this.modelUpload = true;
      this.hideBackButton = true;
      this.projectExists = true;
      this.imagetype = this.projectModel.imagetype;
      if(this.projectModel.userreqs){
        this.requirements = this.projectModel.userreqs.join('\n');
      }
      if(this.projectModel.otherfilenames && this.projectModel.otherfilenames.length > 0){
        for(let i=0;i<this.projectModel.otherfilenames.length;i++){
          this.otherfiles.push(this.projectModel.otherfilenames[i])
        }
        this.modelDetails["s3_other_files"] = this.projectModel.s3_other_files;
        this.modelDetails["otherfilenames"] = this.projectModel.otherfilenames;
      }
    }
    this.user = this.authService.loggedInUser();
  }

  updateProject(){
    if(this.modelSelect && this.projectName){
      this.modelSelect = false;
      this.modelUpload = true;
      this.hideBackButton = false;
    }

    else if(!this.modelSelect && this.projectName){  
      if(this.training && !this.modelUpload){
        if(this.showdeps){
          this.showother = true;
          this.showdeps = false;
        }
        else{
          this.modelUpload = true;
        }
      }
      else if(this.training && this.modelUpload){
        console.log("update model showdeps")
        this.showdeps = true;
        this.modelUpload = false;
        this.showtextarea = true;
      }
      else if(!this.training && this.modelUpload){
        this.showother = true;
        this.modelUpload = false;
      } 
      else{
        if(!this.subtype){
          this.subtype = "h2o.ai";
        }
        this.modelSelect = true;
      }
      this.projectSelect = false;
      this.hideBackButton = false;
    }
  }

  deleteFile(file, num){
    this.otherfiles.splice(num,1)
    for(let i=0; i<this.modelDetails["otherfiles"].length; i++){
      if(this.modelDetails["otherfiles"][i].name.replace(/\s/g, '') == file){
        this.modelDetails["otherfiles"].splice(i,1)
      }
    }
    console.log(this.modelDetails["otherfiles"])
    this.modelDetails["otherfilenames"].splice(num,1)
    this.modelDetails["s3_other_files"].splice(num,1)
  }

  uploadNotebook(){
    this.showdeps = true;
    this.showtextarea = false;
    this.modelUpload = false;
    this.requirements = "";
    this.imagetype = "";
    this.spinner.show('nbupload');
    this.fileService.getpresignedurls(this.modelDetails["s3_zip_file"], "put", this.modelDetails["s3_zip_file"].type).subscribe(res =>{
      console.log(res); 
      if(res.success){
        const fileuploadurl = res.urls[0];
        this.fileService.uploadfileAWSS3(fileuploadurl, this.modelDetails["notebookfile"]).subscribe((data) => {
          console.log(data);
          if(data.headers){
            console.log(data.headers);
          }
        }, err => {
          this.spinner.hide('nbupload');
          this.notifyService.notify(`${err}`, 'danger');
          console.log(err);
        },
        () => {
          console.log(this.subtype);
          this.authService.httpService('api/servingproject/parsenotebook', {"company":this.user.company.id, "file_path": this.modelDetails["s3_zip_file"]} , 'post', (data) => {
            console.log(data)
            this.showtextarea = true;
            this.requirements = data.result.split(' ');
            
            this.requirements = this.requirements.map(item => item.split('==')[0].replace('_', '-'));

            if(this.requirements.includes('torch') || this.requirements.includes('torchvision') || this.requirements.includes('fastai')){
              this.imagetype = "torch"
            }
            else if(this.requirements.includes('tensorflow')){
              this.imagetype = "tensorflow"
            }
            else{
              this.imagetype = "standard"
            }
            console.log(this.imagetype)
            this.requirements = this.requirements.join('\n');
            this.spinner.hide('nbupload');
          }, (err) => {
            console.log(err)
            this.spinner.hide('nbupload');
          }, false)
        });
      }
      else {
        this.notifyService.notify(res.msg, 'danger');
        this.spinner.hide('nbupload');
      }
    }, err => {
      this.notifyService.notify(`${err}`, 'danger');
      this.spinner.hide('nbupload');
    });
  }

  otherfileUpload(event){
    console.log("event other files", event);
    var element = event[0];
    this.otherfiles.push(element.name.replace(/\s/g, ''));
    console.log("other files", this.otherfiles)
    var fileName = element.name.split('.')[0].replace(/\s/g, '')
    var fileExt = element.name.split('.')[1]
    fileName = fileName + '_' + uuid() + '.' + fileExt;
    this.modelDetails["otherfiles"].push(event[0]);
    this.modelDetails["otherfilenames"].push(element.name.replace(/\s/g, ''));
    this.modelDetails["s3_other_files"].push(fileName);
    console.log("other files", this.otherfiles)
  }

  fileUpload(event){
    var element = event[0];
    this.modelDetails['model'] = element.name;
    this.modelDetails['modelSize'] = element.size;
    console.log(element.size);
    var fileName = element.name.split('.')[0].replace(/\s/g, '')
    var fileExt = element.name.split('.')[1]
    if(this.subtype == 'pythonscore'){
      if(fileExt){
        fileName = fileName + '_' + uuid() + '_pickle_file' + '.' + fileExt;
      }
      else{
        fileName = fileName + '_' + uuid() + '_pickle_file';
      }
    }
    else{
      fileName = fileName + '_' + uuid() + '.' + fileExt;
    }
    this.modelDetails["s3_zip_file"] = fileName;

    if(this.training){
      this.modelDetails["notebookfile"] = event[0];
      this.notebookfiles.splice(0, 1)
      this.notebookfiles.push(element.name);
    }
    else if(!this.training){
      this.files.splice(0, 1)
      this.files.push(element.name)
      this.modelDetails["modelFile"] = event[0];
    }
   
    this.modelDetails["model_history"] = [fileName];
    this.modelDetails["status"] = "Not Running";
    this.modelDetails["status_message"] = "";
  }
  
  GoBack(){
    if(this.modelSelect){
      this.projectSelect = true;
      this.modelSelect = false;
    }

    if(this.modelUpload){
      if(this.training){
        this.projectSelect = true;
      }
      else{
        this.modelSelect = true;
      }
      this.modelUpload = false;
      
      if(this.projectExists) {
        this.hideBackButton = true;
      }
    }
    if(this.showdeps){
      this.showdeps = false;
      this.modelUpload = true;
    }
    if(this.showother && this.training){
      this.showother = false;
      this.showdeps = true;
    }
    if(this.showother && !this.training){
      this.showother = false;
      this.modelUpload = true;
    }
  }

  objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
      target[i] = obj[i];
    }
    return target;
  }
  
  finishProject(){
    this.closeModal(false);
    if (!this.projectExists){
      this.model = this.objectWithoutProperties(this.modelDetails, ["otherfiles", "modelFile", "notebookfile", "licenseFile"]);
      console.log(this.model);
      this.model.company = this.user.company.id;
      this.model.servingproject = this.projectId;
      this.model.preprocessEnabled = false;
      this.model.postprocessEnabled = false;
      this.model.training = this.training;
      if(this.model.training) {
        this.model.type = "regular";
        this.model.subtype = this.subtype = "pythonscore";
      }
      var pippackages =  this.training ? ['nbformat==5.1.2', 'ipywidgets', 'ipykernel'] : [];
      if(this.requirements) { this.requirements = this.requirements.split('\n') }
      else { this.requirements = []; }
      this.requirements = this.requirements.filter(function(str) {
        return /\S/.test(str);
      });
      this.model.userreqs = this.requirements;
      this.model.pipPackages = [...pippackages, ...this.requirements];
      this.model.pipPackages.splice(0, this.model.pipPackages.length, ...(new Set(this.model.pipPackages)))

      this.projectSave = {"name": this.projectName, "description": this.projectDescription, "status": "Not Running", "trained_time": "5 hrs", "inputAttr": [{"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""}], "outputAttr": [{"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "subtype":""}], "company": this.user.company.id};
      this.projectSave.savedon = (new Date().getTime() / 1000).toFixed()
      this.authService.httpService('api/servingproject', this.projectSave, 'post', (data) => {
        this.projectId = data.id;
        data.upload = true;
        this.model.servingproject = data.id;
        this.model.subtype = this.subtype;
        if(this.subtype == 'pythonscore'){
          this.model.type = "regular";
        }
        this.model.imagetype = this.imagetype;
        this.model.timeSeries = this.timeSeries;
        this.dataService.sendProjectDetails(data);
        
        this.model.savedon = (new Date().getTime() / 1000).toFixed()
        this.authService.httpService('api/servingmodel', this.model, 'post', (value) => {
          value.modelFile = this.modelDetails.modelFile;
          value.licenseFile = this.modelDetails.licenseFile;
          value.notebookfile = this.modelDetails.notebookfile;
          value.otherfiles = this.modelDetails.otherfiles;
          value.pippackages = this.model.pipPackages;
          value.training = this.training;
          this.dataService.send(value);
          this.router.navigate(['serving/new'], {queryParams: { name: this.projectName, description: this.projectDescription, id: this.projectId, type: 'view'}});
        },(err) => {
          this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
        }, true, false);
        
      }, (err) => {
        try{
          err = JSON.parse(err._body);
          console.log("error creating project", err);
          if(err.code == "E_UNIQUE"){
            this.notifyService.notify(`Project name ${this.projectName} already exists`, 'danger');
          }
          else{
            this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
          }
        }
        catch(e) {
          this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
        }
      }, true, false);
    }
    else{
      if(this.training){
        var pippackages =  this.training ? ['nbformat==5.1.2', 'ipywidgets', 'ipykernel'] : [];
        if(this.requirements) { this.requirements = this.requirements.split('\n') }
        else { this.requirements = []; }
        this.requirements = this.requirements.filter(function(str) {
            return /\S/.test(str);
        });
        this.projectModel.userreqs = this.requirements;
        pippackages = [...pippackages, ...this.requirements];
        pippackages.splice(0, pippackages.length, ...(new Set(pippackages))) 
        this.projectModel.pipPackages = pippackages;
        this.projectModel.imagetype = this.imagetype;
        this.projectModel.savedon = (new Date().getTime() / 1000).toFixed()
        this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
          console.log(value);
        },(err) => {
          this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
        }, false, false);
      }
      this.modelDetails.imagetype = this.imagetype;
      this.modelDetails.training = this.training;
      this.modelDetails.subtype = this.subtype;
      console.log(this.modelDetails);
      this.emitModel.emit(this.modelDetails);
    }
  }
}
