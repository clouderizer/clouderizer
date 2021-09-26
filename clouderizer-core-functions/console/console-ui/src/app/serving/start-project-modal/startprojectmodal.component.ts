import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

declare var swal: any;

@Component({
  selector: 'start-project',
  templateUrl: './startprojectmodal.component.html',
  styleUrls: ['./startprojectmodal.component.css']
})
export class StartProjectModalComponent implements OnInit {

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  @Input() modelId;
  @Input() model;
  @Input() subtype;
  @Input() training;
  @Input() project;
  clickdisabled:boolean=false;
  
  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public router: Router,
    public notifyService: NotifyService,
    public miscService: MiscService,
  ) { }

  startOption = 'None';
  platformOption: string;
  startTitle = 'Select platform to start your project on';
  baseURL = window.location.protocol + '//' + window.location.host;
  projectSetting: Project;
  user: any;
  public ec2config: boolean;
  clickEnable: boolean;

  ngOnInit() {
    this.projectSetting = this.project;
    this.user = this.authService.loggedInUser();
    console.log(this.user);
    if(this.subtype == 'dai'){
      if(this.user.daiconfig_sa){
        this.clickEnable = true;
      }
      else{
        this.clickEnable = false;
      }
    }
    else{
      this.clickEnable = true;
    }

    console.log(this.model);
    this.miscService.setStartProjectNeedRefresh(false);
    this.ec2config = this.user ? this.user.ec2config : false;
    console.log("EC2 config", this.ec2config);
  }
  onLambda() {
    var parent = this;
    swal({
      title: 'Deploy on AWS Lambda',
      text: "Lambda deployment is available only from Clouderizer CLI. Please refer to CLI documentation for more detail.",
      type: 'info',
      showCancelButton: true,
      confirmButtonColor: 'royalblue',
      confirmButtonText: 'Take me to documentation',
    }).then(function(result) {
      if(result.value) {
        parent.router.navigate([]).then(result => { window.open("https://docs.clouderizer.com", '_blank')})
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  onClouderizer(infratype) {
    var parent = this;
    if(infratype == 'gpu') {
      swal({
        title: 'Enterprise License Needed',
        text: "GPU functions are available in Enterprise License. Please contact sales@clouderizer.com for more information.",
        type: 'info',
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
    } else {
      if(this.model.modelSize > 100000000 && infratype == 'standard'){
        swal({
          title: 'Require a higher config machine',
          text: "You need a higher config machine as your model size is big and might result in insufficient memory or cpu issues.",
          type: 'info',
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
          title: 'Deploy project',
          text: "This will start a project on clouderizer infrastructure. Please confirm.",
          type: 'info',
          showCancelButton: true,
          confirmButtonColor: 'green',
          cancelButtonColor: 'red',
          confirmButtonText: 'Yes, let\'s do it now!'
        }).then(function(result) {
          if(result.value){
            parent.publish(infratype);
          }
          else if(result.dismiss === swal.DismissReason.cancel){
            console.log("closed");
          }
        });
      }
    }
    
  }

  publish(infratype){
    this.authService.httpService('api/servingproject/publishproject', {"projectId": this.project.id, "infratype": infratype}, 'post', (data) => {
      console.log("publish response");
      console.log(data);
      
    }, (err) => {
      console.log(err);
      this.notifyService.notify('Something went wrong while publishing project', 'danger');
    });
    this.closemodal();
  }

  gotoConfig() {
    this.router.navigate(['/settings/cloud']);
    this.closeModal(false);
  }

  closemodal(){
    this.closeModal(false);
  }
}