import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewProjectModalComponent } from '../new-project-modal/new-project-modal.component';
import { QuotaModalComponent } from '../quota-modal/quota-modal.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { fileService } from '../../services/s3fileupload.service';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { sharedService } from '../../services/shared.service';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { SailsSocketService } from '../../services/sailssocket.service';
import {CopyProjectModalComponent} from '../copy-project-modal/copyprojectmodal.component';
import { CliModalComponent } from '../../serving/cli-modal/climodal.component';
import { GetServerlessUrl } from '../../services/getServerlessUrl.service';

declare var swal: any;

@Component({
  selector: 'app-serving-model',
  templateUrl: './serving-model.component.html',
  styleUrls: ['./serving-model.component.scss']
})
export class ServingModelComponent implements OnInit {
  @ViewChild( MatPaginator, {static:false}) paginator: MatPaginator; 

  displayedColumns = ['projectname', 'status', 'requests', 'requesttime', 'thumbsup', 'thumbsdown', 'buttons'];
  public projectList: any[]=[];
  uploadFile: boolean=false;
  public outputItems:any[]=[];
  public iItems:any[]=[];
  fileurl: string;
  public projectsLength: number;
  public searchProject: string;
  fetchParams = false;
  user: any;
  publicList: boolean;
  pageSize:any=10;
  dataSource:any;
  publicProjects: any[]=[];
  canmakePublic: boolean;
  time_sum:number=0;
  time_sum_standard:number=0;
  time_sum_highmemory:number=0;
  time_sum_gpu:number=0;
  inv_count:number=0;
  allocinvs:number;
  allocexec:number;
  allocprojects:number;
  serverlessurl:string;
  hostName: string;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public modalService: NgbModal,
    public authService: AuthService,
    private router: Router,
    private fileService: fileService,
    private notifyService: NotifyService,
    private spinner: NgxSpinnerService,
    private sailsSocketService: SailsSocketService,
    private miscService: MiscService,
    public serverlessService: GetServerlessUrl,
  ) { }

  ngOnInit() {
    this.changeDetectorRef.detectChanges();
    this.allocinvs = 1000000000;
    this.allocexec = 600000000000;
    this.allocprojects = 50;
    this.user = this.authService.loggedInUser();
    this.loadprojects();
  }

  

  loadprojects() {
    this.authService.httpService('api/servingprojects?company='+this.user.company.id, null, 'get', (data) => {
      this.projectList = this.dataSource = data;
      console.log(data);
      this.dataSource = new MatTableDataSource(this.dataSource);
      this.dataSource.paginator = this.paginator;
      this.projectsLength = this.projectList.length;
      this.sailsSocketService.registerDashboardOverall(this.updateStatus, this);
      this.sailsSocketService.registerDashboardCustomer(this.updateStatusCustomer, this);
      this.authService.httpService('api/customer/getquota', {id:this.user.company.id}, 'post', (item) => {
        if(item.time_sum_standard && parseFloat(item.time_sum_standard)) this.time_sum_standard = parseFloat(item.time_sum_standard);
        if(item.time_sum_highmemory && parseFloat(item.time_sum_highmemory)) this.time_sum_highmemory = parseFloat(item.time_sum_highmemory);
        if(item.time_sum_gpu && parseFloat(item.time_sum_gpu)) this.time_sum_gpu = parseFloat(item.time_sum_gpu);
        this.time_sum = this.time_sum_standard + 3*(this.time_sum_highmemory) + 10*(this.time_sum_gpu);
        if(item.inv_count) this.inv_count = parseFloat(item.inv_count);
      }, (err) => {
        console.log(err);
      }, false);
    },
    (err) => {
      this.notifyService.notify('Projects could not be loaded', 'danger');
      console.log(err);
    });

    this.authService.httpService('api/servingprojects?public=true', null, 'get', (data) => {
      this.publicProjects = data
      console.log(this.publicProjects);
    },
    (err) => {
      this.notifyService.notify('Projects could not be loaded', 'danger');
      console.log(err);
    });

    this.authService.httpService('api/user?id='+this.user.id, null, 'get', (data) => {
      this.canmakePublic = data[0].canmakePublic;
      console.log(data);
    },
    (err) => {
      console.log(err);
    });
  }

  updateStatus(project, my_this) {
    if(project) {
        if(project.id) {
          if(my_this.publicList){
            my_this.authService.httpService('api/servingprojects?public=true', null, 'get', (data) => {
              my_this.publicProjects = data
              console.log(my_this.publicProjects);
            },
            (err) => {
              console.log(err);
            }, false);
            my_this.publicList = false;
          }
          var i = my_this.getProjectIndex(project.id, my_this);
          if(i >= 0) {
            my_this.projectList[i] = project;
          }
          console.log(my_this.dataSource.data);
          my_this.dataSource.data = my_this.projectList;
        }
    }
  }

  updateStatusCustomer(customer, my_this) {
    if(customer) {
        if(customer.id) {
          if(customer.time_sum_standard && parseFloat(customer.time_sum_standard)) my_this.time_sum_standard = parseFloat(customer.time_sum_standard);
          if(customer.time_sum_highmemory && parseFloat(customer.time_sum_highmemory)) my_this.time_sum_highmemory = parseFloat(customer.time_sum_highmemory);
          if(customer.time_sum_gpu && parseFloat(customer.time_sum_gpu)) my_this.time_sum_gpu = parseFloat(customer.time_sum_gpu);
          my_this.time_sum = my_this.time_sum_standard + 3*(my_this.time_sum_highmemory) + 10*(my_this.time_sum_gpu);
          if(customer.inv_count && parseFloat(customer.inv_count)) my_this.inv_count = parseFloat(customer.inv_count);
        }
    }
  }

  openquota(){
    console.log("hmopen", this.time_sum_highmemory)
    console.log((this.time_sum_highmemory/60).toFixed(2))
    var actionModel = this.modalService.open(QuotaModalComponent, { centered: true, backdrop: 'static',  windowClass: "quotaPop" })
    actionModel.componentInstance.timeSum = (this.time_sum/60).toFixed(2);
    actionModel.componentInstance.invCount = this.inv_count;
    actionModel.componentInstance.timeSumStandard = (this.time_sum_standard/60).toFixed(2);
    actionModel.componentInstance.timeSumHighMemory = (this.time_sum_highmemory/60).toFixed(2);
    actionModel.componentInstance.timeSumGPU = (this.time_sum_gpu/60).toFixed(2);
    actionModel.componentInstance.projectsLength = this.projectsLength;
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  onResize(event) {
    console.log(event.target.innerHeight);  
    if (event.target.innerHeight < 800) {
      this.pageSize = 10;
    }
    else if (event.target.innerHeight > 800 && event.target.innerHeight < 1000) {
      this.pageSize = 15;
    } else {
      this.pageSize = 25;
    }

  }



  openPublicProject(project){
    this.router.navigate(['serving/new'], { queryParams: { name: project.name, id: project.id, type:'public'}});
  }

  openServingUrl(project){
    this.authService.httpService('api/servingmodel?where={"servingproject":"'+project.id+'"}', null, 'get', (data) => {
      if(data[0].lambda){
        if(data[0].accessUrl)
          this.router.navigate([]).then(result => { window.open(data[0].accessUrl, '_blank')})
        else{
          this.notifyService.notify("Couldn't get the lambda url, please redeploy!", 'danger');
        }
      }
      else{
        this.authService.httpService('api/publishedservingproject?where={"servingproject":"'+project.id+'"}', null, 'get', (ppdata) => {
          if(ppdata && ppdata.length > 0){
            if(data[0].training){
              this.hostName = document.location.protocol +'//'+ document.location.hostname;
              var actionModel = this.modalService.open(CliModalComponent, { centered: true,  size:'md', backdrop: 'static',  windowClass: "cliPop" });
              actionModel.componentInstance.type = 'api';
              actionModel.componentInstance.apiurl = `${this.hostName}/api/async-function/${ppdata[0].name}/notebook`;
              actionModel.result.then((result) => {
              }, (reason) => {
              })
            }
            else{
              this.serverlessService.getServerlessUrl().subscribe(res =>{
                  this.serverlessurl = res.url;
                  var url = `${this.serverlessurl}/function/${ppdata[0].name}`
                  this.router.navigate([]).then(result => { window.open(url, '_blank')})
              }, err => {
                this.notifyService.notify('Something went wrong, try refreshing', 'danger');
              });
            }
          }
          else{
            this.notifyService.notify('Looks like project is not deployed or stopped', 'danger');
          }
        }, (err) => {
          console.log("Error getting project details.");
        })
      }
      },
    (err) => {
      this.notifyService.notify('Project model details could not be loaded', 'danger');
      console.log(err);
    });
  }

  onCopyProject(project){
    var actionModel = this.modalService.open(CopyProjectModalComponent, { centered: true, backdrop: 'static',  windowClass: "aboutPop" })
    actionModel.componentInstance.childProject = project;
    actionModel.componentInstance.emitData.subscribe(($e => { 
        console.log("emitData");
        this.loadprojects() 
    }));
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  onRefreshProject(element){
    this.authService.httpService('api/servingproject', element.id, 'get', (data) => {
      console.log(data);
      var i = this.getProjectIndex(element.id, this);
      console.log(i);
      this.projectList[i] = data;
      console.log(this.projectList[i]);
      console.log(this.projectList);
      this.dataSource.data = this.projectList;
    }, (err) => { 
        console.log(err);
    })
  }

  onDeleteProject(element) {
    console.log('on delete clicked');
    var parent = this;
    console.log(element);
    console.log(element.id);
    swal({
        title: 'Confirm delete?',
        text: "Are you sure you want to delete project : "+element.name+"?",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
        confirmButtonText: 'Yes, delete it!'
    }).then(function(result) {
        if(result.value) {
          console.log("confirmed");

          //apicall6
          parent.authService.httpService('api/servingproject/deleteproject', {servingprojectid: element.id, company: element.company}, 'post', (data) => {
              parent.loadprojects();
              parent.notifyService.notify(data.msg, 'success');
              
          }, (err) => {
          });
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
    });
  }

  onEditProject(element) 
  {
      var custom_settings = "edit";
      this.router.navigate(['serving/new'], { queryParams: { name: element.name, id: element.id, type:custom_settings}});
  }

  getProjectIndex(id, my_this) {
    for(var i=0;i<my_this.projectList.length;i++) {
        if(my_this.projectList[i].id == id)
            return i;
    }
    return -1;
  }

  openPop() {
    var actionModel = this.modalService.open(NewProjectModalComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" });
      actionModel.componentInstance.updateModel = false;
      actionModel.componentInstance.emitModel.subscribe(modelData => {
        this.fileUpload(modelData);
      })
      actionModel.result.then((result) => {
      }, (reason) => {
      });
  }

  makeProjectPublic(project) {
    var parent = this;
    swal({
      title: `Make ${project.name} public!`,
      text: `Are you sure you want to make ${project.name} public?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Proceed'
    }).then(function(result) {
      if(result.value) {
        console.log("confirmed");
        project.ispublic = true;
        parent.publicList = true;
        parent.authService.httpService('api/servingproject', project, 'put', (data) => {
          console.log(data);
          parent.authService.httpService('api/awsconfig/getImage', {company: project.company, Key: project.bannerImage.name}, 'post', (data) => {
            console.log(data);
            parent.notifyService.notify(`${project.name} is made public`, 'success');
          },
          (err) => {
            console.log(err);
          });
        },
        (err) => {
          console.log(err);
        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  removeProject(project){
    var parent = this;
    swal({
      title: `Make ${project.name} private!`,
      text: `Are you sure you want to remove ${project.name} from public projects list?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Proceed'
    }).then(function(result) {
      if(result.value) {
        console.log("confirmed");
        project.ispublic = false;
        parent.publicList = true;
        parent.authService.httpService('api/servingproject', project, 'put', (data) => {
          console.log(data);
        },
        (err) => {
          console.log(err);
        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  fileUpload(modelData){
    this.uploadFile = true;
    this.spinner.show();
    
    console.log(modelData['modelFileName']);
    this.fileService.getpresignedurls(modelData['modelFileName'], "put", modelData['modelFile'].type).subscribe(res =>{
      console.log(res); 
      
      if(res.success){
        const fileuploadurl = res.urls[0];
        
        this.fileService.uploadfileAWSS3(fileuploadurl, modelData['modelFile']).subscribe(data => {
          console.log(data);
        }, err => {
          this.notifyService.notify('File(s) upload failed: ${err}', 'danger');
          console.log(err);
        },
        () => {
          if("licenseFile" in modelData){
            console.log(modelData['licenseFileName']);
            this.fileService.getpresignedurls(modelData['licenseFileName'], "put", modelData['licenseFile'].type).subscribe(res =>{
              console.log(res); 
              
              if(res.success){
                const fileuploadurl = res.urls[0];
                this.fileService.uploadfileAWSS3(fileuploadurl, modelData['licenseFile']).subscribe(data => {
                  console.log(data);
                },
                err => {
                  this.notifyService.notify('File(s) upload failed: ${err}', 'danger');
                  console.log(err);
                },
                () => {
                  this.notifyService.notify('File(s) uploaded successfully', 'success');
                  this.uploadFile = false;
                  this.fetchParams = true;
                  this.spinner.hide();
                  this.iItems = [{"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc"]},
                  {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
                  {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
                  {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
                  {"type":"Table", "image": "Grid_Table_1", "format": "", "formats": []},
                  {"type":"URL", "image": "URL_1", "format": "", "formats": []}
                  ];
                  this.outputItems = [{"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc"]},
                  {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
                  {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
                  {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
                  {"type":"Table", "image": "Grid_Table_1", "format": "", "formats": []},
                  {"type":"URL", "image": "URL_1", "format": "", "formats": []}
                  ];
                  
                  this.router.navigate(['serving/new'], { queryParams: { name: modelData["projectName"], type: 'edit'}});
                });
              }
            });
          }
          else{
            this.uploadFile = false;
            this.fetchParams = true;
            this.spinner.hide();
            this.iItems = [{"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc"]},
            {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
            {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
            {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
            {"type":"Table", "image": "Grid_Table_1", "format": "", "formats": []},
            {"type":"URL", "image": "URL_1", "format": "", "formats": []}
            ];
            this.outputItems = [{"type":"Text", "image": "Text_Icon","format": "txt", "formats": ["txt", "doc"]},
            {"type":"Video", "image": "Video_1", "format": "", "formats": ["MP4", "AVI"]},
            {"type":"Audio", "image": "Audio_1", "format": "MP3", "formats": ["MP4", "AVI"]},
            {"type":"Image", "image": "Image_1", "format": "PNG", "formats": ["JPEG", "JPG"]},
            {"type":"Table", "image": "Grid_Table_1", "format": "", "formats": []},
            {"type":"URL", "image": "URL_1", "format": "", "formats": []}
            ];
            this.router.navigate(['serving/new'], { queryParams: { name: modelData["projectName"], type: 'edit'}});
          }
      });
      }
      else {
        this.notifyService.notify(res.msg, 'danger');
      }
      });
  }

}

