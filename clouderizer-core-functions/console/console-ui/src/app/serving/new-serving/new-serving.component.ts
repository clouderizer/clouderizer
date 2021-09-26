
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NotifyService } from '../../services/notify.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalPopupBrowseComponent } from '../modal-popup-browse/modal-popup-browse.component';
import { NewProjectModalComponent } from '../new-project-modal/new-project-modal.component';
import { AuthService } from '../../services/auth.service';
import { GetServerlessUrl } from '../../services/getServerlessUrl.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ServingProject } from '../../models/ServingProject';
import { NgxSpinnerService } from 'ngx-spinner';
import { fileService } from '../../services/s3fileupload.service';
import { sharedService } from '../../services/shared.service';
import { Subscription }   from 'rxjs/Subscription';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { SailsSocketService } from '../../services/sailssocket.service';
import { StartProjectModalComponent } from '../start-project-modal/startprojectmodal.component';
import { CopyProjectModalComponent } from '../copy-project-modal/copyprojectmodal.component';
import { MiscService } from '../../services/misc.service';
import { sdkComponent} from '../sdk/sdk.component';
import { codeEditor} from '../codeEditor/codeEditor.component';
import { bannerImage } from '../bannerImageModal/bannerImage.component';
import { errorModal } from '../errorModal/errorModal.component';
import { retrain } from '../retrainModal/retrain.component';
import { getMatIconFailedToSanitizeUrlError, TOOLTIP_PANEL_CLASS } from '@angular/material';
import { errorMetricsComponent } from '../errorMetrics/errorMetrics.component';
import { CliModalComponent } from '../../serving/cli-modal/climodal.component';
import { SailsService } from "angular2-sails";



declare interface file {
  s3_zip_file: string;
  lbpercent: number;
  edited: boolean;
  servingproject: string;
  type: string;
  requests: number;
  feedback: number;
  responseTime: number;
  like: number;
  dislike: number;
  notResponded: number;
}

declare var swal: any;
declare var $: any;

@Component({
  selector: 'app-new-serving',
  templateUrl: './new-serving.component.html',
  styleUrls: ['./new-serving.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(1000)),
    ])
  ]
})

export class NewServingComponent implements OnInit {
  subscription: Subscription;
  projectSubscription: Subscription;
  deploySubscription: Subscription;

  public iItems:any[]=[{"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""}];
  private tempiItems:any[]=[];
  private tempoutputItems:any[]=[];
  public projectName: string="";
  public projectDescription: string="";
  public projectId: string="";
  public project: any;
  public models:any;
  key:any = Object.keys;
  value:any = Object.values;
  public loading:boolean=false;
  public servingport: number;
  public generated: boolean=false;
  public hostName:string;
  public platformType: string;
  deployPercent: any=0;
  updateModel: boolean = false;
  parserProgress: any;
  harddata:any;
  h2odata:any;
  curldata: string="";
  notebookoutput: any;
  user:any;
  public model:any;
  public port:string="2003";
  public modelId: string="qwerty";
  public modelSize: any;
  public projectType:string;
  private upload:boolean=false;
  public autoMLlength: number;
  public inputItems:any[]=[];
  public outputItems:any[]=[{"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "finaloutput":[], "subtype":""}];
  public projectModels:any[]=[{"status":""}];
  public file:file;
  public sumEdited: any;
  public showSizeMessage: boolean;
  public parseUrl: string;
  modelData:any;
  otherfileName: string;
  timeSeriesList: any[]=[];
  percentLoaded:any=0;
  uploadFile: boolean=false;
  uploadotherFile: boolean=false;
  uploadLicenseFile: boolean=false;
  update: boolean;
  protype: string;
  close: boolean;
  refreshing: boolean=false;
  inputList:any[]=[];
  outputList:any[]=[];
  subtype: string;
  training: string;
  pippackages: any[]=[];
  projectStatusMessage: string;
  public nonEditedPercent: any;
  public nonEditedLength: any;
  public modelDetails: any;
  public inputType: any={"text": {"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc", "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t"]},
                         "video": {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
                         "audio": {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
                         "image": {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
                         "table_input": {"type":"Input Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "inputList":[], "rawinputList":[], "subtype":""},
                         "table_output": {"type":"Output Columns", "image": "Grid_Table_1", "format": "csv", "formats": [], "outputList":[], "finaloutput":[], "subtype":""},
                         "url": {"type":"URL", "image": "URL_1", "format": "", "formats": []}
                        }

  math = Math;
  public projectStatus: string;
  public projectModelId: string;
  public projectServingPort: string;        
  airlinePath: string;
  titanicPath:string;
  housepricePath:string;
  diabeticPath:string;     
  preprocessEnabled: boolean; 
  postprocessEnabled: boolean;
  timeSeries: boolean;
  retrain: boolean;
  inv_count:number=0;
  time_sum:number=0;
  time_sum_standard:number=0;
  time_sum_highmemory:number=0;
  time_sum_gpu:number=0;
  function_time_sum:number=0;
  function_time_sum_standard:number = 0;
  function_time_sum_highmemory:number = 0;
  function_time_sum_gpu:number = 0;
  lambdadeployment: boolean;

  modelURL: string;
  modelStatusMessage: string="";
  modelStatus: string="";
  ppname: string="";
  infratype: string="";
  allocinvs: number;
  allocexec: number;
  serverlessurl: string;
  accessUrl: string;

  constructor(public modalService: NgbModal,
    private notifyService: NotifyService,
    public spinner: NgxSpinnerService,
    public authService: AuthService,
    public serverlessService: GetServerlessUrl,
    private router: Router,
    private route: ActivatedRoute,
    private fileService: fileService,
    private dataService : sharedService,
    private sailsSocketService: SailsSocketService,
    private directSailsSocket: SailsService,
    private miscService: MiscService,
    //private mixpanelService: MixpanelService
    ) {
  }

  ngOnInit() {
    this.allocinvs = 1000000000;
    this.allocexec = 600000000000;
    this.serverlessService.getServerlessUrl().subscribe(res =>{
        this.serverlessurl = res.url;
    }, err => {
      this.notifyService.notify('Something went wrong, try refreshing', 'danger');
    });
    $(document).ready(function(){
      $('[data-toggle="tooltip"]').tooltip();   
    });

    this.hostName = document.location.protocol +'//'+ document.location.hostname
    this.user = this.authService.loggedInUser();
    this.route.queryParams.subscribe(params => 
      { 
        this.projectName = params.name;
        this.projectDescription = params.description;
        if ("upload" in params){
          this.upload = params.upload;
        }
        this.projectId = params.id;
        this.projectType = params.type;
    });
    if(this.deploySubscription){
      this.deploySubscription.unsubscribe();
    }

    this.sailsSocketService.registerDashboardServing(this.updateStatus, this);

    this.authService.httpService('api/customer/getquota', {id:this.user.company.id}, 'post', (item) => {
      if(item.time_sum_standard && parseFloat(item.time_sum_standard)) this.time_sum_standard = parseFloat(item.time_sum_standard);
      if(item.time_sum_highmemory && parseFloat(item.time_sum_highmemory)) this.time_sum_highmemory = parseFloat(item.time_highmemory);
      if(item.time_sum_gpu && parseFloat(item.time_sum_gpu)) this.time_sum_gpu = parseFloat(item.time_sum_gpu);
      this.time_sum = this.time_sum_standard + 3*(this.time_sum_highmemory) + 10*(this.time_sum_gpu);
      if(item.inv_count) this.inv_count = parseFloat(item.inv_count);
      console.log("time sum", this.time_sum);
    }, (err) => {
      console.log(err);
    }, false);

    //Get Model details
    this.authService.httpService('api/servingmodel?where={"servingproject":"'+this.projectId+'"}', null, 'get', (data) => {
      console.log(data);
      if(data && data.length>0){
        this.projectModels = data;
        this.modelSize = this.projectModels[0].modelSize;
        console.log(this.modelSize);
        if(this.modelSize && this.modelSize > 200000000){
          this.showSizeMessage = true;
        }
        this.retrain = this.projectModels[0].enableRetrain;
        this.training  = this.projectModels[0].training;
        this.accessUrl  = this.projectModels[0].accessUrl;
        this.protype = this.training ? 'training' : 'prediction';
        this.parserProgress = this.projectModels[0].parserOutput;
        this.preprocessEnabled = this.projectModels[0].preprocessEnabled;
        this.postprocessEnabled = this.projectModels[0].postprocessEnabled;
        this.projectStatus = this.projectModels[0].status;
        this.lambdadeployment = this.projectModels[0].lambda;
        this.projectStatusMessage = this.projectModels[0].status_message;
        this.projectModelId = this.projectModels[0].id;
        this.platformType = this.projectModels[0].machinetype;
        this.projectServingPort = this.projectModels[0].servingport;
        this.subtype = this.projectModels[0].subtype;
        this.timeSeries = this.projectModels[0].timeSeries;
        if(this.projectModels[0].timeSeriesList){
          this.timeSeriesList = this.projectModels[0].timeSeriesList;
        }
        if(this.projectModels[0].status != 'Starting'){
          this.spinner.hide('generateurl');
        }
        else if(this.projectModels[0].status == 'Starting'){
          this.loading=true;
        }
        if(this.training){
          this.curldata = `-H "x-callback-url: <callback url>" -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>"`
        }
        console.log(this.projectModels);
        this.sailsSocketService.registerDashboardServing(this.updateStatus, this);
        this.sailsSocketService.registerPProjStatus(this.updatePProjStatus, this);
        this.sailsSocketService.registerDashboardOverall(this.updateStatusProject, this);
        this.authService.httpService('api/publishedservingproject?where={"servingproject":"'+this.projectId+'"}', null, 'get', (data) => {
          if(data && data.length > 0) {
            this.ppname = data[0].name;
            this.infratype = data[0].infratype;
            this.modelStatus = data[0].status;
            this.modelStatusMessage = data[0].status_message;
          }
          
        }, (err) => {
          console.log("Error getting project details.");
        })
      }

      console.log("projectmodel data", this.projectModels);

      //Get project details
      if(this.projectType === 'edit' || this.projectType === 'view' || this.projectType === 'public'){
        console.log(this.projectId);
        
        this.authService.httpService('api/servingproject', this.projectId, 'get', (data) => {
          this.project = data;
          if(this.project.function_time_sum_standard && parseFloat(this.project.function_time_sum_standard)) {
            this.function_time_sum_standard = parseFloat(this.project.function_time_sum_standard);
          }
          if(this.project.function_time_sum_highmemory && parseFloat(this.project.function_time_sum_highmemory)) {
            this.function_time_sum_highmemory = parseFloat(this.project.function_time_highmemory);
          } 
          if(this.project.function_time_sum_gpu && parseFloat(this.project.function_time_sum_gpu)) {
            this.function_time_sum_gpu = parseFloat(this.project.function_time_sum_gpu);
          }
          console.log("gpu time sum", this.function_time_sum_gpu)
          this.function_time_sum = this.function_time_sum_standard + this.function_time_sum_highmemory + this.function_time_sum_gpu;
          console.log("function time sum", this.function_time_sum)
          console.log("getting serving project details");
          console.log(data);
          if(data.ispublic){
            this.projectType === 'public';
          }
          this.projectDescription = data.description;
          this.iItems  = data.inputAttr;
          if(!this.training && !this.preprocessEnabled){
            this.iItems[0]['inputList'].forEach(item => {
              if(item.type != 'Image'){
                this.curldata += `-F "${item.name}=<${item.name}_value>" `
              }
              else{
                this.curldata += `-F "${item.name}=@<filepath>" `
              }
            })
          }
          else{
            if(!this.training && this.preprocessEnabled){
              this.iItems[0]['rawinputList'].forEach(item => {
                if(item.type != 'Image'){
                  this.curldata += `-F "${item.name}=<${item.name}_value>" `
                }
                else{
                  this.curldata += `-F "${item.name}=@<filepath>" `
                }
              })
            }
          }
          if(!this.curldata) this.curldata = `-F "yourparam1=x" -F "yourparam2=y" -F "yourfile1=@<filepath1>" -F "yourfile2=@<filepath2>"`
          this.pippackages = data.pipPackages;
          this.outputItems = data.outputAttr;
          if(this.timeSeries){
            this.addTimeSeriesFields();
          }
          if(this.projectType === 'view'){
            this.projectSubscription = this.dataService.projectParams.subscribe(val=>{
              console.log(val);
              if(val.upload){
                val.upload = false;
                this.dataService.sendProjectDetails(val);
                this.subscription = this.dataService.subj.subscribe(val=>{
                  console.log(val);
                  this.modelData = val;
                  this.fileUpload(false);
                }, err=>{
                  console.log(err);
                },
                ()=>{
                  console.log("no value");
                });
                if(this.subscription){
                  this.subscription.unsubscribe();
                }
              }
            }, err=>{
              this.notifyService.notify('Error fetching project details', 'danger');
            },
            ()=>{
              console.log("no value");
            });
            if(this.projectSubscription){
              this.projectSubscription.unsubscribe();
            }
          }
        }, err => {
          this.notifyService.notify('Error fetching project details', 'danger');
        });
      }
   },
   (err) => {
    this.notifyService.notify('Error fetching model details', 'danger');
    console.log(err);
   });
  }

  updatePProjStatus(pproject_model, my_this) {
    console.log('Message :' + pproject_model)
    if(pproject_model.servingproject == my_this.projectId) {
      my_this.ppname = pproject_model.name;
      my_this.infratype = pproject_model.infratype;
      my_this.modelStatus = pproject_model.status;
      my_this.modelStatusMessage = pproject_model.status_message;
    }
  }

  openError(message) {
    var actionModel = this.modalService.open(errorModal, { centered: true,  size:'md', backdrop: 'static',  windowClass: "startPop" });
    actionModel.componentInstance.message = message;
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }
  
  startClouderizerAlert() {
    var parent = this;
    if((parent.inv_count > this.allocinvs || parent.time_sum > this.allocexec) && (this.user.company.id != '4b721e09-a27e-48ad-9147-dc42acc268e6') && (this.user.company.id != 'bb839974-414c-4219-a17a-04053d3e67e8') && (this.user.company.id != '7c29d6cf-b496-459b-80ae-85ff36941b47')){
      swal({
        title: `Allocated quota limit`,
        text: `Cannot deploy project as the allocated quota limit has exceeded. Contact sales@clouderizer.com for more info.`,
        type: 'warning',
        showCancelButton: false,
        confirmButtonColor: 'royalblue',
        confirmButtonText: 'Close'
      }).then(function(result) {
        if(result.value) {
          console.log("closed");
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
      });
    }
    else{
      console.log("opened start modal")
      var actionModel = this.modalService.open(StartProjectModalComponent, { centered: true,  size:'md', backdrop: 'static',  windowClass: "startPop" });
      actionModel.componentInstance.modelId = this.projectModelId;
      actionModel.componentInstance.project = this.project;
      actionModel.componentInstance.subtype = this.subtype;
      console.log(this.projectModels[0]);
      actionModel.componentInstance.model = this.projectModels[0];
      actionModel.result.then((result) => {
      }, (reason) => {
      });
    }
  }

  updateClouderizerAlert() {
    var parent = this;
    if((parent.inv_count > this.allocinvs || parent.time_sum > this.allocexec) && (this.user.company.id != '4b721e09-a27e-48ad-9147-dc42acc268e6') && (this.user.company.id != 'bb839974-414c-4219-a17a-04053d3e67e8') && (this.user.company.id != '7c29d6cf-b496-459b-80ae-85ff36941b47')){
      swal({
        title: `Allocated quota limit`,
        text: `Cannot deploy project as the allocated quota limit has exceeded. Contact sales@clouderizer.com for more info.`,
        type: 'warning',
        showCancelButton: false,
        confirmButtonColor: 'royalblue',
        confirmButtonText: 'Close'
      }).then(function(result) {
        if(result.value) {
          console.log("closed");
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
      });
    }
    else{
      swal({
        title: 'Update the deployment',
        text: "This will update your existing deployment on Clouderizer infrastructure.",
        type: 'info',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
        confirmButtonText: 'Yes, let\'s do it now!'
      }).then(function(result) {
        if(result.value){
          parent.publishProject();
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
      });
    }
  }

  refreshmetrics(){
    this.refreshing = true;
    this.spinner.show('refreshmetrics');
    this.authService.httpService('api/servingproject/refreshmetrics', {"projectId": this.project.id}, 'post', (data) => {
      if(data.data){
        this.project.function_invocation_count = data.data.function_invocation_count;
        this.project.function_time_sum_standard = data.data.function_time_sum_standard;
        this.project.function_time_sum_highmemory = data.data.function_time_sum_highmemory;
        this.project.function_time_sum_gpu = data.data.function_time_sum_gpu;

        if(this.project.function_time_sum_standard && parseFloat(this.project.function_time_sum_standard)) {
          this.function_time_sum_standard = parseFloat(this.project.function_time_sum_standard);
        }
        if(this.project.function_time_sum_highmemory && parseFloat(this.project.function_time_sum_highmemory)) {
          this.function_time_sum_highmemory = parseFloat(this.project.function_time_highmemory);
        } 
        if(this.project.function_time_sum_gpu && parseFloat(this.project.function_time_sum_gpu)) {
          this.function_time_sum_gpu = parseFloat(this.project.function_time_sum_gpu);
        }
        this.function_time_sum = this.function_time_sum_standard + this.function_time_sum_highmemory + this.function_time_sum_gpu;
      }
      this.refreshing = false;
      this.spinner.hide('refreshmetrics');
    }, (err) => {
      console.log(err);
      this.refreshing = false;
      this.spinner.hide('refreshmetrics');
    },false);
  }

  updateStatusProject(project, my_this){
    if(project && project.id) {
      my_this.project = project;
      if(my_this.project.function_time_sum_standard && parseFloat(my_this.project.function_time_sum_standard)) my_this.function_time_sum_standard = parseFloat(my_this.project.function_time_sum_standard);
      if(my_this.project.function_time_sum_highmemory && parseFloat(my_this.project.function_time_sum_highmemory)) my_this.function_time_sum_highmemory = parseFloat(my_this.project.function_time_highmemory);
      if(my_this.project.function_time_sum_gpu && parseFloat(my_this.project.function_time_sum_gpu)) my_this.function_time_sum_gpu = parseFloat(my_this.project.function_time_sum_gpu);
      my_this.function_time_sum = my_this.function_time_sum_standard + my_this.function_time_sum_highmemory + my_this.function_time_sum_gpu;
      console.log("my function time sum", my_this.function_time_sum)
    }
  }

  updateStatus(projectModel, my_this) {
    console.log(this.update)
    if(projectModel && !this.update) {
        console.log(projectModel);
        var projectModel_id = projectModel.id;
        if(projectModel_id) {
            console.log(projectModel_id);
            var i = my_this.getProjectIndex(projectModel_id, my_this);
            if(i >= 0) {
                if(projectModel.parserOutput && projectModel.parserOutput != 'Parsing in progress' && projectModel.parserOutput != 'Parser error'){
                  if(!my_this.parserProgress || my_this.parserProgress == 'Parsing in progress' || my_this.parserProgress == 'Parser error'){
                    if(my_this.modelData.subtype == 'h2o.ai' || my_this.modelData.subtype == 'dai' || my_this.modelData.subtype == 'h2o'){
                      my_this.parsedOutput(projectModel.parserOutput);
                    }
                    else if(my_this.modelData.subtype == 'pmml' || my_this.modelData.subtype == 'jpmml' || my_this.modelData.subtype == 'pmml4s'){
                      my_this.parsedOutputPmml(projectModel.parserOutput);
                    }
                  }
                }
                else if(projectModel.parserOutput == 'Parser error'){
                  if(my_this.parserProgress != 'Parser error'){
                    my_this.parsedError();
                  }
                }
                
                if(projectModel.status === 'Running'){
                  if(my_this.projectStatus != 'Running'){
                    if((window.location.host == 'showcase.clouderizer.com' || true)
                        && !my_this.miscService.isTestAccount(my_this.authService.loggedInUser().company)) {
                        var metadata = {"project": my_this.projectName, time: new Date()};
                        //this.mixpanelService.track(`Project deployed successfully on ${projectModel.machinetype} machine`, metadata);
                    }
                    my_this.loading = false;
                    my_this.spinner.hide('generateurl');
                    my_this.authService.httpService('api/servingproject', my_this.project.id, 'get', (data) => {
                      if(data.status != 'Running'){
                        my_this.project.status = projectModel.status;
                        my_this.authService.httpService('api/servingproject', my_this.project, 'patch', (data) => {
                        }, (err) => {
                          
                        }, false);
                      }
                    }, (err) => {
                      
                    }, false);
                  }
                  
                }

                console.log(projectModel.status);
                my_this.projectStatus = projectModel.status;     
                my_this.lambdadeployment = projectModel.lambda;          
                my_this.projectModelId = projectModel.id;
                my_this.projectServingPort = projectModel.servingport;
                my_this.subtype = projectModel.subtype;
                my_this.projectModels[i].key = projectModel.key;
                my_this.projectModels[i] = projectModel;
                my_this.projectStatusMessage = projectModel.status_message; 
                my_this.parserProgress = projectModel.parserOutput;
                my_this.accessUrl = projectModel.accessUrl;
            }
        }
    }
    else{
      my_this.update = false;
    }
    console.log("after if");
  }

  copyProject(){
    var actionModel = this.modalService.open(CopyProjectModalComponent, { centered: true, backdrop: 'static',  windowClass: "aboutPop" })
    console.log(this.project);
    actionModel.componentInstance.childProject = this.project;
    actionModel.componentInstance.emitData.subscribe(($e => { 
        console.log("emitData done");
    }));
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  getProjectIndex(id, my_this) {
    for(var i=0;i<my_this.projectModels.length;i++) {
        if(my_this.projectModels[i].id == id)
            return i;
    }
    return -1;
  }

  fileProcess(existing){
    this.fileUpload(existing);
  }

  errorMetrics(){
    console.log("error metrics");
    var actionModel = this.modalService.open(errorMetricsComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "moreDetailsPopup" })
    actionModel.componentInstance.modelfile = this.projectModels[0].model;
    actionModel.result.then((result) => { 
    }, (reason) => {
    });
  }

  async fileUpload(existing){
    console.log(this.iItems);
    this.subtype = this.modelData["subtype"];
    this.training = this.modelData["training"];
    this.protype = this.training ? 'training' : 'prediction';
    this.pippackages= this.modelData["pippackages"];
    console.log("python pippackages " + this.pippackages);
    this.percentLoaded = 0;
    console.log(this.modelData);

    if(this.modelData['modelFile'] &&  !this.modelData['notebookfile']){
      this.uploadFile = true;
      this.spinner.show('s3upload');
      this.fileService.getpresignedurls(this.modelData['s3_zip_file'], "put", this.modelData['modelFile'].type).subscribe(res =>{
        console.log(res); 
        
        if(res.success){
          const fileuploadurl = res.urls[0];
          var s3file = !this.training ? this.modelData['modelFile'] : (this.training ? this.modelData['notebookfile']: undefined);
          this.fileService.uploadfileAWSS3(fileuploadurl, s3file).subscribe((data) => {
            console.log(data);
            if(data.headers){
              console.log(data.headers);
            }
            if(data.loaded){
              this.percentLoaded = (data.loaded/data.total)*100;
              this.percentLoaded = parseInt(this.percentLoaded);
            }
          }, err => {
            this.uploadFile = false;
            this.notifyService.notify(`${err}`, 'danger');
            if(!existing) this.deleteProject();
            console.log(err);
          },
          () => {
            this.uploadFile = false;
            console.log(this.subtype);
            if(this.subtype != 'pythonscore' && !this.training){
              this.fileService.getpresignedurls(this.modelData['s3_zip_file'], "get").subscribe(res =>{
                console.log(res);
                this.parseUrl = res.urls[0];
                if(this.modelData.subtype == 'h2o.ai' || this.modelData.subtype == 'dai' || this.modelData.subtype == 'h2o'){
                  this.parseio();
                }
                else if(this.modelData.subtype == 'pmml' || this.modelData.subtype == 'jpmml' || this.modelData.subtype == 'pmml4s'){
                  this.parseiopmml();
                } 
              }, err => {
                this.uploadFile = false;
                this.notifyService.notify(`${err}`, 'danger');
                if(!existing) this.deleteProject();
                console.log(err);
              });
            }
            else{
              this.spinner.hide('s3upload');
              this.projectModels[0].model = this.modelData.model;
              this.projectModels[0].s3_zip_file = this.modelData.s3_zip_file;  
              if(this.training && this.modelData.reqfilename){
                this.projectModels[0].reqfilename = this.modelData.reqfilename;
              }
              this.update = true;
              this.projectModels[0].savedon = (new Date().getTime() / 1000).toFixed()
              this.authService.httpService('api/servingmodel', this.projectModels[0], 'put', (value) => {
                console.log(value);
                this.notifyService.notify('File updated successfully', 'success');
                if(!this.training){
                  setTimeout(() => {this.configinModal(this.iItems[0], false)}, 1000);
                }
              },(err) => {
                this.update = false;
                this.notifyService.notify('Could not update model file', 'danger');
                console.log(err);
              }, false);
            }
          });
        }
        else {
          this.uploadFile = false;
          this.notifyService.notify(res.msg, 'danger');
          if(!existing){
            this.deleteProject();
          }
        }
      }, err => {
        this.uploadFile = false;
        this.notifyService.notify(`${err}`, 'danger');
        if(!existing){
          this.deleteProject();
        }
      });
    }
    else {
      if(this.modelData["otherfiles"] && this.modelData["otherfiles"].length > 0){
        this.spinner.show('s3upload');
        this.uploadotherFile = true;
        for(let i=0; i<this.modelData['s3_other_files'].length; i++){
          this.otherfileName = this.modelData['s3_other_files'][i];
          console.log("filename", this.otherfileName);
          var res:any = await this.fileService.getpresignedurls(this.modelData['s3_other_files'][i], "put", this.modelData['otherfiles'][i].type).toPromise();
            console.log(res)
            if(res.success){
              const fileuploadurl = res.urls[0];
              var s3file = this.modelData["otherfiles"][i];
              var data:any = await this.fileService.uploadfileAWSS3(fileuploadurl, s3file).toPromise();
            }
            else {
              this.uploadotherFile = false;
              this.notifyService.notify(res.msg, 'danger');
              if(!existing){
                this.deleteProject();
              }
            }
          console.log("end of await")
        }
        console.log("for loop done")
        this.uploadotherFile = false;
        this.spinner.hide('s3upload');
      }
      console.log("if completed")
      if(this.modelData.otherfilenames) this.projectModels[0].otherfilenames = this.modelData.otherfilenames;
      if(this.modelData.s3_other_files) this.projectModels[0].s3_other_files = this.modelData.s3_other_files; 
      this.projectModels[0].model = this.modelData.model;
      this.projectModels[0].s3_zip_file = this.modelData.s3_zip_file;
      this.update = true;
      this.projectModels[0].savedon = (new Date().getTime() / 1000).toFixed()
      this.authService.httpService('api/servingmodel', this.projectModels[0], 'put', (value) => {
        console.log(value);
        this.notifyService.notify('Updated successfully', 'success');
      },(err) => {
        this.update = false;
        this.notifyService.notify('Could not update model file', 'danger');
        console.log(err);
      }, false);
    }
  }

  deleteProject(){
    this.authService.httpService('api/servingproject/deleteproject', {servingprojectid: this.projectId, company: this.user.company.id}, 'post', (data) => {
      this.spinner.hide('s3upload');
      this.router.navigate(['serving/model']);
    }, (err) => {
        this.spinner.hide('s3upload');
        this.router.navigate(['serving/model']);
        this.notifyService.notify('Something went wrong, please refresh', 'danger');
        console.log(err);   
    }, false);
  }

  dashBoard(){
    console.log(this.project.id);
    this.router.navigate(['serving/dashboard'], { queryParams: { id: this.project.id, name: this.projectName, type:this.projectType}});
  }

  changelb(file, content) {
    file.lbpercent = content;
    file.edited = true;
    this.sumEdited = this.projectModels.filter(fileObj => fileObj.edited == true).reduce((acc, current) => acc + (+current.lbpercent), 0);
    this.nonEditedLength = (this.projectModels.filter(fileObj => fileObj.edited == false).length);
    this.nonEditedPercent = (100 - this.sumEdited) / this.nonEditedLength;
    this.projectModels.filter(fileObj => fileObj.edited == false).map(e => e.lbpercent = this.nonEditedPercent);
  }

  openPop() {
    this.updateModel = true;
    var actionModel = this.modalService.open(NewProjectModalComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" }); 
    actionModel.componentInstance.projectName = this.projectName;
    actionModel.componentInstance.projectId = this.projectId;
    actionModel.componentInstance.projectModel = this.projectModels[0];
    actionModel.componentInstance.subtype = this.subtype;
    actionModel.componentInstance.training = this.training;
    actionModel.componentInstance.updateModel = this.updateModel;
    actionModel.componentInstance.emitModel.subscribe(modeldata => {
      this.modelData = modeldata;
      this.fileProcess(true);
    });
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  retrainModel(){
    this.close = false;
    this.projectStatusMessage = "Retraining initiated";
    this.authService.httpService('api/servingmodel/retrain', {servingid: this.projectModels[0].id}, 'post', (data) => {
    }, (err) => { 
    },false,false);
  }

  stoplambdaproject(){
    var actionModel = this.modalService.open(CliModalComponent, { centered: true,  size:'md', backdrop: 'static',  windowClass: "cliPop" });
    actionModel.componentInstance.type = 'stoplambda';
    actionModel.componentInstance.stoplambdacommand = `cldz ldelete ${this.projectName}`;
    actionModel.result.then((result) => {
    }, (reason) => {
    })
  } 

  opensdk(language){
    var sdkObject = {'language': language, 'port': this.projectServingPort, 'modelId': this.projectModelId}
    var actionModel = this.modalService.open(sdkComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "aboutPop" }); 
    actionModel.componentInstance.sdkObject = sdkObject;
    actionModel.componentInstance.training = this.training;
    actionModel.componentInstance.projectName = this.projectName
    actionModel.componentInstance.ppname = this.ppname;
    if(this.iItems.length > 0){
      actionModel.componentInstance.input = this.iItems[0];
    }
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  uploadModel(){
    this.openPop();
  }

  parseiopmml(){
    var endpoint = "api/pmmlparse";
    console.log("pmml parse project model",this.projectModels);
    this.fileService.parses3File(endpoint, this.parseUrl, this.projectModels[0].id).subscribe(data => {
      this.spinner.hide('s3upload');
    }, err => {
      if(!this.updateModel){
        this.projectModels = [];
        this.authService.httpService('api/servingproject/deleteproject', {servingprojectid: this.projectId, company: this.user.company.id}, 'post', (data) => {
          this.spinner.hide('s3upload');
          this.router.navigate(['serving/model']);
          this.notifyService.notify('Unable to parse this model file', 'danger');
        }, (err) => {
            this.spinner.hide('s3upload');
            this.router.navigate(['serving/model']);
            this.notifyService.notify('Something went wrong, please refresh', 'danger');
            console.log(err);   
        }, false);
      }
      else{
        this.spinner.hide('s3upload');
        this.notifyService.notify('Could not parse the model, Please check your model file.', 'danger');
      }
    });
  }

  parseio() {
    console.log(this.parseUrl);
    var endpoint = "api/h2oparse";
    this.fileService.parses3File(endpoint, this.parseUrl, this.projectModels[0].id).subscribe(value => {
      this.spinner.hide('s3upload'); 
    }, (err) => {
      if(!this.updateModel){
        this.projectModels = [];
        this.authService.httpService('api/servingproject/deleteproject', {servingprojectid: this.projectId, company: this.user.company.id}, 'post', (data) => {
          this.spinner.hide('s3upload'); 
          this.router.navigate(['serving/model']);
          this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
        }, (err) => {
            this.spinner.hide('s3upload');
            this.router.navigate(['serving/model']);
            this.notifyService.notify('Something went wrong, please refresh', 'danger');
            console.log(err);   
        }, false);
      }
      else{
        this.spinner.hide('s3upload');
        this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
      }
    });
  }

  parsedError(){
    if((window.location.host == 'showcase.clouderizer.com' || true)
      && !this.miscService.isTestAccount(this.authService.loggedInUser().company)) {
      var metadata = {project: this.projectName, time: new Date()};
      //this.mixpanelService.track("Parsing failed", metadata);
    }
    this.authService.httpService('api/servingproject/deleteproject', {servingprojectid: this.projectId, company: this.user.company.id}, 'post', (data) => {
      this.router.navigate(['serving/model']);
      this.notifyService.notify('Unable to parse this model file', 'danger');
    }, (err) => {
        this.router.navigate(['serving/model']);
        this.notifyService.notify('Something went wrong, please try again after some time', 'danger');
        console.log(err);   
    }, false);
    
  }

  parsedOutputPmml(data){
    this.notifyService.notify('Parsed and fetched the attributes successfully!', 'success');
    if((window.location.host == 'showcase.clouderizer.com' || true)
      && !this.miscService.isTestAccount(this.authService.loggedInUser().company)) {
      var metadata = {project: this.projectName, modeltype: data.platform, time: new Date()};
      //this.mixpanelService.track("Project is created and parsing is successful", metadata);
    }
    this.checkModelAttributesNew()
  }

  parsedOutput(data){
      data = data.parse_model;
      if(data){
      this.notifyService.notify('Parsed and fetched the attributes successfully!', 'success');
      if((window.location.host == 'showcase.clouderizer.com' || true)
        && !this.miscService.isTestAccount(this.authService.loggedInUser().company)) {
        var metadata = {project: this.projectName, modeltype: data.subtype, time: new Date()};
        //this.mixpanelService.track("Project is created and parsing is successful", metadata);
      }
      this.checkModelAttributesNew()
    }
    else{
      this.authService.httpService('api/servingproject/deleteproject', {servingprojectid: this.projectId, company: this.user.company.id}, 'post', (data) => {
        this.router.navigate(['serving/model']);
        this.notifyService.notify('Unable to parse this model file', 'danger');
      }, (err) => {
          this.router.navigate(['serving/model']);
          this.notifyService.notify('Something went wrong, please try again after some time', 'danger');
          console.log(err);   
      }, false);
    }
  }

  checkModelAttributesNew(){
    this.authService.httpService('api/servingproject', this.project.id, 'get', (data) => {
        this.tempiItems = data.inputAttr;
        this.tempoutputItems = data.outputAttr;
        this.inputType = data.inputAttr[0];
        console.log("tempiItems");
        console.log(this.tempiItems);

        for (let i = 0; i < this.tempiItems.length; i++) {
          this.iItems[i] = {}; 
          this.project.inputAttr[i] = {};
          for (var prop in this.tempiItems[i]) {
            this.iItems[i][prop] = this.tempiItems[i][prop];
            this.project.inputAttr[i][prop] = this.tempiItems[i][prop];
          }
        }
        for (let i = 0; i < this.tempoutputItems.length; i++) {
          this.outputItems[i] = {}; 
          this.project.outputAttr[i] = {};
          for (var prop in this.tempoutputItems[i]) {
            this.outputItems[i][prop] = this.tempoutputItems[i][prop];
            this.project.outputAttr[i][prop] = this.tempoutputItems[i][prop];
          }
        }
        this.project.savedon = (new Date().getTime() / 1000).toFixed()
        this.authService.httpService('api/servingproject', this.project, 'patch', (data) => {
          this.projectModels = [this.modelData];
          this.projectModels[0].subtype = this.subtype;
          setTimeout(() => {this.configinModal(this.iItems[0], false)}, 1000);
        }, (err) => {
          this.notifyService.notify('Something went wrong while saving the input/output details', 'danger');
        }, false);
    }, (err) => {
    }, false);
  }

  savedetails(){
    var projectdetails = {};
    projectdetails["id"] = this.project.id;
    projectdetails["name"] = this.projectName;
    projectdetails["description"] = this.projectDescription;
    projectdetails["savedon"] = (new Date().getTime() / 1000).toFixed()
    this.authService.httpService('api/servingproject', projectdetails, 'patch', (data) => {
      console.log("name details saved");
    }, (err) => {
      this.notifyService.notify('Something went wrong while saving the details', 'danger');
    });
  }

  publishProject(){
    this.authService.httpService('api/servingproject/publishproject', {"projectId": this.projectId, "infratype": this.infratype}, 'post', (data) => {
      console.log("publish response");
      console.log(data);
    }, (err) => {
      console.log(err);
    });
  }

  getStatus(){
    this.authService.httpService('api/servingproject/getstatus', {"projectId": this.projectId}, 'post', (data) => {
      console.log("publish response");
      console.log(data);
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while publishing project', 'danger');
    });
  }

  deployProject1(){
    this.authService.httpService('api/servingproject/deployproject', {"projectId": this.projectId}, 'post', (data) => {
      console.log("publish response");
      console.log(data);
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while publishing project', 'danger');
    });
  }

  stopProject1() {
    this.authService.httpService('api/servingproject/stopproject', {"projectId": this.projectId}, 'post', (data) => {
      console.log("publish response");
      console.log(data);
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while stopping project', 'danger');
    });
  }

  refreshStatus() {
    this.authService.httpService('api/servingproject/refreshproject', {"projectId": this.projectId}, 'post', (data) => {
      console.log("refresh response");
      console.log(data);
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while refreshing project', 'danger');
    });
  }

  openEditor(type){
    var actionModel = this.modalService.open(codeEditor, { centered: true, size: 'lg', backdrop: 'static',  windowClass: "codeEditor" });
    actionModel.componentInstance.projectModel = this.projectModels[0];
    actionModel.componentInstance.type= type;
    actionModel.componentInstance.projectType = this.projectType;
    if(type=='Preprocess'){
      actionModel.componentInstance.inputList= this.iItems[0].rawinputList;
      actionModel.componentInstance.outputList= this.iItems[0].inputList;
    }
    else if(type=='Predict'){
      actionModel.componentInstance.inputList= this.iItems[0].inputList;
      actionModel.componentInstance.outputList= this.outputItems[0].outputList;
    }
    else if(type=='Postprocess'){
      actionModel.componentInstance.inputList= this.outputItems[0].outputList;
      actionModel.componentInstance.outputList= this.outputItems[0].finaloutput;
    }
    actionModel.componentInstance.user= this.user;
    actionModel.componentInstance.output.subscribe(data => {
      this.projectModels[0] = data.projectdetails;
      this.sailsSocketService.registerDashboardServing(this.updateStatus, this);
    });
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  otherSettings(){
    var actionModel = this.modalService.open(bannerImage, { centered: true, size: 'lg', backdrop: 'static',  windowClass: "configPop" });
    actionModel.componentInstance.projectModel = this.projectModels[0];
    actionModel.componentInstance.projectType = this.projectType;
    actionModel.componentInstance.projectStatus = this.projectStatus;
    actionModel.componentInstance.timeSeries = this.timeSeries;
    actionModel.componentInstance.subtype = this.subtype;

    actionModel.componentInstance.settingsOutput.subscribe(settingData => {
      this.preprocessEnabled = settingData.preprocess;
      this.postprocessEnabled = settingData.postprocess;
      this.retrain = settingData.retrainModel;
      this.timeSeries = settingData.timeSeries;
      this.project.bannerImage = settingData.bannerImage;
      if(this.timeSeries){
        this.addTimeSeriesFields();
      }
      else{
        this.removeTimeSeries();
      }
      console.log(this.timeSeries);
    });

    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  removeTimeSeries(){
    for(let i=0; i<this.outputItems.length;i++){
      var timeIndex = this.outputItems[i]["outputList"].findIndex(x => x.name ==="xaxis(timestamp)");
      if(timeIndex != -1){
        var timeseriesPresent = true;
        this.timeSeriesList=[];
        this.timeSeriesList.push(this.outputItems[i]["outputList"][timeIndex])
        this.outputItems[i]["outputList"].splice(timeIndex, 1);
      }

      timeIndex = this.outputItems[i]["outputList"].findIndex(x => x.name ==="yaxis(output)");
      if(timeIndex != -1){
        this.timeSeriesList.push(this.outputItems[i]["outputList"][timeIndex])
        this.outputItems[i]["outputList"].splice(timeIndex, 1);
      }

      timeIndex = this.outputItems[i]["outputList"].findIndex(x => x.name ==="lower bound");
      if(timeIndex != -1){
        this.timeSeriesList.push(this.outputItems[i]["outputList"][timeIndex])
        this.outputItems[i]["outputList"].splice(timeIndex, 1);
      }

      timeIndex = this.outputItems[i]["outputList"].findIndex(x => x.name ==="upper bound");
      if(timeIndex != -1){
        this.timeSeriesList.push(this.outputItems[i]["outputList"][timeIndex])
        this.outputItems[i]["outputList"].splice(timeIndex, 1);
      }
    }
    console.log(this.timeSeriesList);
    if(timeseriesPresent){
      this.projectModels[0].timeSeriesList = this.timeSeriesList;
      this.projectModels[0].savedon = (new Date().getTime() / 1000).toFixed()
      this.authService.httpService('api/servingmodel', this.projectModels[0], 'put', (value) => {
        console.log(value);
      },(err) => {
        console.log(err);
      }, false);
     
      this.project.outputAttr = this.outputItems;
      this.project.savedon = (new Date().getTime() / 1000).toFixed()
      this.authService.httpService('api/servingproject', this.project, 'patch', (value) => {
        console.log(value);
      },(err) => {
        console.log(err);
      }, false);
    }
  }

  addTimeSeriesFields(){
    console.log(this.timeSeriesList);
    var timeIndex = this.outputItems[0]["outputList"].findIndex(x => x.name ==="xaxis(timestamp)");
    if(timeIndex != -1){
      console.log("present")
      var timeseriesPresent = true;
    }
    if(timeseriesPresent){
      console.log("timeseries present in output")
    }
    else if(this.timeSeriesList && this.timeSeriesList.length == 0){
      this.timeSeriesList.push({"name": 'xaxis(timestamp)', "userfriendlyName": 'timestamp', "description": 'None', "include": true})
      this.timeSeriesList.push({"name": 'yaxis(output)', "userfriendlyName": 'output', "description": 'None', "include": true})
      this.timeSeriesList.push({"name": 'lower bound', "userfriendlyName": 'lower bound', "description": 'None', "include": true})
      this.timeSeriesList.push({"name": 'upper bound', "userfriendlyName": 'upper bound', "description": 'None', "include": true})
      for(let i=0; i<this.outputItems.length;i++){
        this.outputItems[i].outputList = this.outputItems[i].outputList.concat(this.timeSeriesList)
      }
      console.log(this.outputItems);
    }
    else if(!timeseriesPresent){
      for(let i=0; i<this.outputItems.length;i++){
        console.log(this.timeSeriesList);
        console.log("time series not present");
        this.outputItems[i].outputList = this.outputItems[i].outputList.concat(this.timeSeriesList)
      }
      console.log(this.outputItems);
    }

    this.project.outputAttr = this.outputItems;
    this.project.savedon = (new Date().getTime() / 1000).toFixed()
    console.log(this.project.company);
    this.authService.httpService('api/servingproject', this.project, 'patch', (value) => {
      console.log(value);
    },(err) => {
      console.log(err);
    }, false);
  }

  stopProjectInstance(){
    console.log("stopping");
    var parent = this;
    swal({
      title: 'Stop Project',
      text: "This will stop your model from running on Clouderizer Cloud. Please confirm.",
      type: 'info',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Yes, Stop!'
    }).then(function(result) {
      if(result.value){
        parent.stopProject1();
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  updateDeployment(){
    console.log("updating deployment");
    var parent = this;
    swal({
      title: 'Update Deployment',
      text: "This will update the existing deployment on your machine. Please confirm.",
      type: 'info',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Yes, Update!'
    }).then(function(result) {
      if(result.value){
        parent.projectModels[0].status = 'Updating deployment';
        parent.projectModels[0].status_message = 'Updating the instance';
        parent.project.status = 'Updating deployment';
        parent.authService.httpService('api/servingmodel', parent.projectModels[0], 'put', (value) => {
          console.log(value);
          parent.authService.httpService(`userserving/${parent.projectServingPort}-${parent.projectModelId}-SH/updatedeployment`, null , 'post', (data) => { 
          }, 
          (err) => {
          }, false);
        },(err) => {
          console.log(err);
        }, false);
        parent.authService.httpService('api/servingproject', parent.project, 'patch', (value) => {
          console.log(value);
        },(err) => {
        }, false);
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  closeMessage(){
    this.close = true;
  }

  stopProject(model){
    this.authService.httpService('api/stopinstance', {"company": this.user.company.id, "platform_type": this.platformType, "servingid": model.id}, 'post', (data) => {
      console.log("stop response");
      this.authService.httpService(`userserving/${this.projectServingPort}-${this.projectModelId}-SH/stop`, null , 'post', (data) => {
      }, (err) => {
      }, false);
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while stopping the instance', 'danger');
    });
  }

  configinModal(item, preprocess){
    var actionModel = this.modalService.open(ModalPopupBrowseComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "configPop" });
    console.log(item["inputList"]);
    if(!item["rawinputList"]){
      item["rawinputList"] = [...item["inputList"]]
    }
    if(this.preprocessEnabled && preprocess){
      actionModel.componentInstance.columnList = item["rawinputList"];
      actionModel.componentInstance.preprocessEnabled = true;
    }
    else{
      actionModel.componentInstance.columnList = item["inputList"];
      actionModel.componentInstance.preprocessEnabled = false;
    }
    actionModel.componentInstance.projectType = this.projectType;
    actionModel.componentInstance.iotype = 'Input';
    actionModel.componentInstance.projectStatus = this.projectStatus;
    actionModel.componentInstance.subtype = this.subtype; //item["subtype"]
    actionModel.componentInstance.ioconfigEvent.subscribe(ioData => {
      if(this.preprocessEnabled && preprocess){
        item["rawinputList"] = ioData.data; 
      }
      else{
        item["inputList"] = ioData.data;
      }
      if(ioData.event == 'save'){
        this.iItems[this.iItems.indexOf(item)] = item;
        this.project.inputAttr = this.iItems;
        this.project.savedon = (new Date().getTime() / 1000).toFixed()
        this.authService.httpService('api/servingproject', this.project, 'patch', (data) => {
        }, (err) => {
          this.notifyService.notify('Something went wrong while saving the details', 'danger');
        });
      }  
    })

    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  configoutModal(item, postprocess){
    var actionModel = this.modalService.open(ModalPopupBrowseComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "configPop" });

    if(!item["finaloutput"]){
      item["finaloutput"] = [...item["outputList"]]
    }
    if(this.postprocessEnabled && postprocess){
      actionModel.componentInstance.columnList = item["finaloutput"];
      actionModel.componentInstance.postprocessEnabled = true;
    }
    else{
      actionModel.componentInstance.columnList = item["outputList"];
      actionModel.componentInstance.postprocessEnabled = false;
    }
    actionModel.componentInstance.timeSeries = this.timeSeries;
    actionModel.componentInstance.projectType = this.projectType;
    actionModel.componentInstance.iotype = 'Output';
    actionModel.componentInstance.subtype = this.subtype;
    actionModel.componentInstance.projectStatus = this.projectStatus;
    actionModel.componentInstance.ioconfigEvent.subscribe(ioData => {
      if(this.postprocessEnabled && postprocess){
        item["finaloutput"] = ioData.data; 
      }
      else{
        item["outputList"] = ioData.data;
      }
      if(ioData.event == 'save'){
        this.outputItems[this.outputItems.indexOf(item)] = item;
        this.project.outputAttr = this.outputItems;
        this.project.savedon = (new Date().getTime() / 1000).toFixed()
        this.authService.httpService('api/servingproject', this.project, 'patch', (data) => {
        }, (err) => {
          this.notifyService.notify('Something went wrong while saving the details', 'danger');
        });
      }
    });
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  drop(ev) {
    this.autoMLlength = this.projectModels.filter(fileObj => fileObj.type == 'automl').length;
    if(this.projectModels.length > 0 && this.autoMLlength === 0){
      ev.preventDefault();
      var data = ev.dataTransfer.getData("text");
      console.log("data");
      console.log(data);
      console.log(this.inputType[data]);
      this.iItems.push(this.inputType[data]);
    }
    else {
      this.notifyService.notify('Drag and drop is not permitted', 'danger');
    }
  }

  dropOutput(ev) {
    this.autoMLlength = this.projectModels.filter(fileObj => fileObj.type == 'automl').length;
    if(this.projectModels && this.projectModels.length > 0 && this.autoMLlength === 0){
      ev.preventDefault();
      var data = ev.dataTransfer.getData("text");
      console.log("data");
      console.log(data);
      console.log(this.inputType[data]);
      this.outputItems.push(this.inputType[data]);
    }
    else {
      this.notifyService.notify('Drag and drop is not permitted', 'danger');
    }
  }

  allowDrop(ev) {
    ev.preventDefault();
  }

  deleteInputItem(item){
    console.log("deleting input");
    var index = this.iItems.indexOf(item)
    this.iItems.splice(index,1);
  }

  deleteOutputItem(item){
    console.log("deleting output");
    var index = this.outputItems.indexOf(item)
    this.outputItems.splice(index,1);
  }

  drag(ev) { 
    console.log(ev.target.id);
    ev.dataTransfer.setData("text", ev.target.id);
  }

}
function updateStatus(projectModel: any, my_this: any) {
  throw new Error('Function not implemented.');
}

