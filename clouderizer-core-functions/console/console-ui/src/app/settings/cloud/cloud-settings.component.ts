import { Component, OnInit, Directive, Input} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { FileUploader } from 'ng2-file-upload';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotebookVariableModalComponent } from '../../serving/notebookvariable-modal/notebookvariable-modal.component';

declare var swal:any;

declare interface AWSSetting {
  id?: string;
  awsaccessid?: string;
  awssecret?: string;
}
declare interface AWSNetworkSetting {
  vpc_id?: string;
  internet_gateway_id?: string; //  
  subnet_id?: string; //  
  route_table_id?: string; //  
  security_group_id?: string; //  
  id?: string;
}

@Component({
  selector: 'app-cloud-settings',
  templateUrl: './cloud-settings.component.html',
  styleUrls: ['./cloud-settings.component.scss']
})
export class CloudSettingsComponent implements OnInit {
  public uploader: FileUploader = new FileUploader({ url: "api/customer/uploadserviceaccountcreds", autoUpload: false});
  public dai_uploader: FileUploader = new FileUploader({ url: "api/customer/uploaddaicreds", autoUpload: false});
  source:any;
  notebookvariables: any[]=[];
  msgHideAndShow: boolean = false;
  constructor(
    public modalService: NgbModal,
    private authService: AuthService,
    private notifyService: NotifyService,
    private miscService: MiscService,
    private route: ActivatedRoute,
  ) { }

  public user:any;
  fileUpload = "";
  public region: string;
  public awsSettings: AWSSetting;
  public regionArray = [
    { id: 'us-east-2', Description: "US East (Ohio)" },
    { id: 'us-west-1', Description: "US West (N. California)" }
  ];
  public awsNetworkSettings: AWSNetworkSetting;
  busy = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => 
      { 
        this.source = params.src;
    });

    this.awsSettings = {
      awsaccessid: '',
      awssecret: ''
    };

    this.user = this.authService.loggedInUser();

    this.authService.httpService('api/awsconfig', null, 'get', (data) => {
      console.log(data);
      if (data[0]) {
          this.awsSettings.awsaccessid = data[0].awsaccessid;
          this.awsSettings.awssecret = data[0].awssecret;
          this.awsSettings.id = data[0].id;
          console.log(this.awsSettings.id);
      } 
    }, (err) => {
    });

    this.authService.httpService('api/customer/getnbvariables', {"customerId": this.user.company.id}, 'post', (data) => {
      console.log("nbvariables", data);
      if (data && data.data && data.data.length > 0) {
          this.notebookvariables = data.data;
      } 
    }, (err) => {
          console.log(err);
    });

    this.authService.httpService('api/awsnetworksetting', null, 'get', (data) => {
      console.log(data);
      console.log("awsconfig");
      if (data[0]) {
        this.region = data[data.length-1].region;
      } 
      else{
        this.region = 'us-east-2';
      }
      }, (err) => {
          console.log(err);
    });
  }

  uploadGCPServiceAccountJSON() {
    this.uploader.uploadAll();
    this.user.gcpconfig_sa = true;
    this.authService.setLoggedInUser(this.user);
    this.notifyService.notify('Account updated successfully', 'success');
  }

  uploadDAILicense() {
    this.dai_uploader.uploadAll();
    this.user.daiconfig_sa = true;
    this.authService.setLoggedInUser(this.user);
    this.notifyService.notify('DAI license uploaded successfully', 'success');
  }

  clearGCPServiceAccountJSON() {
    if(this.user.gcpconfig_sa) {
        this.authService.httpService('api/customer/clearserviceaccountcreds', null, 'post', (data) => {
            this.notifyService.notify('GCP Service Account credentials cleared successfully', 'success');
            this.user.gcpconfig_sa = false;
            this.authService.setLoggedInUser(this.user);
        }, (err) => {
            this.notifyService.notify('Error clearing GCP credentials', 'danger');
        });
    } else {
    }
  }

  updateVariable(type, key, value){
    console.log(key)
    console.log(value)
    var actionModel = this.modalService.open(NotebookVariableModalComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" });
    actionModel.componentInstance.type= type;
    actionModel.componentInstance.notebookKey = key;
    actionModel.componentInstance.notebookValue = value;
    actionModel.componentInstance.variableout.subscribe((data => {
      console.log(data);
      if(data) {
        if(type == 'edit'){
          for(let i=0; i<this.notebookvariables.length; i++){
            if(this.notebookvariables[i].key == data.key) this.notebookvariables[i].value = data.value;
          }
        }
        else{
          this.notebookvariables.push(data);
        }
      }
    }));
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  deleteVariable(key){
    var parent = this;
    swal({
      title: 'Confirm delete?',
      text: "Are you sure you want to delete variable : "+key+"?",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Yes, delete it!'
    }).then(function(result) {
        if(result.value) {
          console.log("confirmed");
          parent.authService.httpService('api/customer/nbvariables', {"customerId": parent.user.company.id, "type": "delete", "key": key}, 'post', (data) => {
          }, (err) => {
            console.log(err);
            parent.notifyService.notify('Something went wrong!', 'danger');
          });
          for(let i=0; i<parent.notebookvariables.length; i++){
            if(parent.notebookvariables[i].key == key) parent.notebookvariables.splice(i,1);
          }
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
    });
  }

  clearDAILicense() {
    if(this.user.daiconfig_sa) {
        this.authService.httpService('api/customer/cleardaicreds', null, 'post', (data) => {
            this.notifyService.notify('DAI license cleared successfully', 'success');
            this.user.daiconfig_sa = false;
            this.authService.setLoggedInUser(this.user);
        }, (err) => {
            this.notifyService.notify('Error clearing DAI license', 'danger');
        });
    }
  }

  isNetworkInitialized() {
    return (this.awsNetworkSettings.vpc_id != undefined && this.awsNetworkSettings.vpc_id != '');
  }

  isBusy() {
      return this.busy;
  }

  copyCommand(){
    var input = <HTMLInputElement>document.getElementById('myInput');
    input.select(); 
    document.execCommand('copy'); 
    input.setSelectionRange(0, 0);
    input.blur(); 
    this.textMessageFunc('Text');
  }

  textMessageFunc(msgText){  
    this.msgHideAndShow=true;  
    setTimeout(() => {    
      this.msgHideAndShow=false;  
    }, 3000);    
  }

  reloadNetworkSettings() {
    this.awsNetworkSettings = {
        vpc_id: '',
        internet_gateway_id: '',
        subnet_id: '',
        route_table_id: '',
        security_group_id: ''
  };

    this.authService.httpService('api/awsnetworksetting/getfromregion', { region: this.region }, 'post', (data) => {
        if (data && data.setting) {
            var setting = data.setting;
            this.awsNetworkSettings.vpc_id = setting.vpc_id;
            this.awsNetworkSettings.internet_gateway_id = setting.internet_gateway_id;
            this.awsNetworkSettings.subnet_id = setting.subnet_id;
            this.awsNetworkSettings.route_table_id = setting.route_table_id;
            this.awsNetworkSettings.security_group_id = setting.security_group_id;
            this.awsNetworkSettings.id = setting.id;
        } 
    }, (err) => {
    });
  }

  updateAwsConfig() {
    console.log("aws config submitted");
    if(this.awsSettings.id) {
        this.authService.httpService('api/awsconfig', this.awsSettings, 'put', (data) => {
            if (data) {               
                this.notifyService.notify('AWS config updated!!', 'success');
                this.user.ec2config = true;
                this.authService.setLoggedInUser(this.user);
                console.log(this.user);
            }
        }, (err) => {
            console.log(err);
        });
    } else {
        this.authService.httpService('api/awsconfig', this.awsSettings, 'post', (data) => {
            if (data) {

                this.notifyService.notify('AWS config updated!!', 'success');   
                this.user.ec2config = true;
                this.authService.setLoggedInUser(this.user);
                console.log(this.user);
                if((window.location.host == 'showcase.clouderizer.com' || window.location.host == 'console.clouderizer.com')
                && !this.miscService.isTestAccount(this.authService.loggedInUser().company)) {

                    (<any>window).fcWidget.track("aws_cloud_config", {

                    })
                }
            }
        }, (err) => {
        });
    }
  }

  authorizeGoogleDrive() {
    this.authService.httpService('api/gdrive/getdriveoauthurl', null, 'get', (data) => {
        if(data && data.authurl) {
          console.log(data.authurl);
            window.location.href = data.authurl;
        }
    }, (err) => {
    });
  }

  revokeConfirmation()
  {
        var parent = this;
        swal({
            title: 'Revoke Access Confirmation',
            html: "<p>Are you sure you want to revoke the access?<p><br />Note: if you press 'Ok' all the data you stored in the google drive will be deleted.",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'green',
            cancelButtonColor: 'red',
            confirmButtonText: 'Yes'
        }).then(function(result) {
          if(result.value){
            parent.revokeGoogleOauth();
          }
          else if(result.dismiss === swal.DismissReason.cancel){
            console.log("closed");
          }
        });
  }

  revokeGoogleOauth() {
    this.authService.httpService('api/gdrive/revokegoauthaccess', null, 'post', (data) => {
        this.notifyService.notify('Google Account access revoked successfully.', 'success');
        this.user.gdriveconfig = false;
        this.authService.setLoggedInUser(this.user);
    }, (err) => {
    });
  }

  updateAwsNetworkSettings() {
    this.busy = true;
    this.authService.httpService('api/awsnetworksetting', { region: this.region }, 'post', (data) => {
        this.busy = false;
        if (data) {
            this.awsNetworkSettings.vpc_id = data.setting.vpc_id;
            this.awsNetworkSettings.internet_gateway_id = data.setting.internet_gateway_id;
            this.awsNetworkSettings.subnet_id = data.setting.subnet_id;
            this.awsNetworkSettings.route_table_id = data.setting.route_table_id;
            this.awsNetworkSettings.security_group_id = data.setting.security_group_id;
            this.awsNetworkSettings.id = data.setting.id;
            this.notifyService.notify('AWS network initialized!!', 'success');
        }
    }, (err) => {
        this.busy = false;
    });
  }

  deleteNetworkSettings() {
    this.busy = true;
    this.authService.httpService('api/awsnetworksetting', this.awsNetworkSettings, 'delete', (data) => {
        this.busy = false;
        if (data) {
            this.awsNetworkSettings = {
                vpc_id: '',
                internet_gateway_id: '',
                subnet_id: '',
                route_table_id: '',
                security_group_id: ''
            };
            this.notifyService.notify('AWS config deleted!!', 'success');
        }
    }, (err) => {
        this.busy = false;
    });
}

}
