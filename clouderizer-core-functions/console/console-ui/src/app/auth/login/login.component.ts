import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MiscService } from '../../services/misc.service';
import {SailsSocketService} from '../../services/sailssocket.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as i18nIsoCountries from 'i18n-iso-countries';
import { SearchCountryField, TooltipLabel, CountryISO } from 'ngx-intl-tel-input';
import { CliModalComponent } from '../../serving/cli-modal/climodal.component';

declare var $:any;
declare var swal: any;

export interface Education {
  value: string;
  viewValue: string;
}
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  educations: Education[] = [
    {value: 'Enterprise', viewValue: 'Enterprise'},
    {value: 'Educational Institute', viewValue: 'Educational Institute'},
    {value: 'Not For Profit', viewValue: 'Not For Profit'}
  ];
  email: String;
  password: String;
  public mode:String;
  public redirectUrl: String;
  user:any;
  hide=true;
  noRegister: boolean;
  source: String;
  emailObj: any;
  public formSignup: FormGroup;
  cname: String;
  organisation_type: String;
  phone: String;
  countryCode: string;
  termsofuse: boolean;
  signup_success: boolean;
  SearchCountryField = SearchCountryField;
	TooltipLabel = TooltipLabel;
	CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [CountryISO.India, CountryISO.UnitedStates];
  separateDialCode = true;

  constructor(
    public modalService: NgbModal,
    private router: Router,
    private authService: AuthService,
    private notifyService: NotifyService,
    private miscService: MiscService,
    private sailsSocketService: SailsSocketService,
    private fb: FormBuilder,
  ) { 
    this.redirectUrl = "";
  }

  ngOnInit() {
    this.mode = 'Login';
    var message = this.router.routerState.snapshot.root.queryParams.message;
    var email = this.router.routerState.snapshot.root.queryParams.email;
    var id = this.router.routerState.snapshot.root.queryParams.id;
    var urlSource = this.router.routerState.snapshot.root.queryParams.source;

    console.log(email);
    this.emailObj = {"email": email, id: id};

    if(message){
      if (message == 'success'){
        this.authService.httpService('api/authenticateOauth', this.emailObj, 'post', (data) => {
          if (data.success && data.user.registered) {
            console.log(data.user)
            this.authService.login(data.user);
            console.log("login success");
            
            console.log(window.location.host);

            this.sailsSocketService.connectSocket(); 
            this.user = this.authService.loggedInUser();
            if (true || this.user.gcpconfig_sa || this.user.ec2config || this.user.ubuntuconfig_sa || this.user.azureconfig_sa || this.user.alibabaconfig_sa || this.user.digitaloceanconfig_sa){
              if(this.redirectUrl)
              {
                  var redirect = decodeURIComponent(this.redirectUrl.toString());
                  var params = this.sortParams(redirect);
                  var link = `${redirect.split('?')[0]}`;
                  this.router.navigate([link], { queryParams: params});
              }
              else
              {
                if(urlSource && urlSource=="cli") {
                  this.router.navigate(['settings/cloud'], { queryParams: {src: urlSource}});
                } else {
                  this.router.navigate(['serving']);
                }
              }
            }
            else{
              this.router.navigate(['dashboard/wizard']);
            }  
            
            //post notification for non-commercial license if needed
            this.miscService.checkAndShowNotification(this.user, this.sailsSocketService);
            
          } else {
            console.log("failed");
            if(data.user.registered){
              this.notifyService.notify(data.message, 'danger');
            }
            this.router.navigate(['auth/login']);
          }
        },  (err) =>{
          console.log(err);

        });   
      }
      else if(message == 'detailspending'){
        this.noRegister = true;

        if(urlSource && urlSource!="") this.source=urlSource;
      }
      else{
        this.notifyService.notify('Registration/login failed', 'danger');
        this.router.navigate(['auth/login']);
      }
    }
  }

  onOauthRegister(){

    if(this.formSignup && this.formSignup.value && this.formSignup.value.phone){
      this.phone = this.formSignup.value.phone.internationalNumber;
      this.countryCode = this.formSignup.value.phone.countryCode;
    }
    console.log(this.countryCode);

    const customer = {
      email: this.emailObj.email,
      id: this.emailObj.id,
      name: this.cname,
      organisation_type: this.organisation_type,
      phone: this.phone,
      countryCode: this.countryCode
    }

    if(!this.cname) {
      this.notifyService.notify('Please enter your company name', 'danger');
      return false;
    }

    if(!this.phone) {
      this.notifyService.notify('Please enter your contact', 'danger');
      return false;
    }

    if(!this.organisation_type) {
      this.notifyService.notify('Please enter your organisation type', 'danger');
      return false;
    }

    if(!this.termsofuse) {
      this.notifyService.notify('Please agree to Terms of Use', 'danger');
      return false;
    }

    if(!this.formSignup.valid){
      this.notifyService.notify('Please enter valid details', 'danger');
      return false;
    }

    this.authService.httpService('api/auth/registerOauth', customer, 'post', (data) => {
      if(data.success){
        this.authService.httpService('api/authenticateOauth', this.emailObj, 'post', (data) => {
          if (data.success) {
            console.log(data.user);
            this.authService.login(data.user);
            console.log("login success");
            
            console.log(window.location.host);
    
            this.sailsSocketService.connectSocket(); 
            this.user = this.authService.loggedInUser();
            if (true || this.user.gcpconfig_sa || this.user.ec2config || this.user.ubuntuconfig_sa || this.user.azureconfig_sa || this.user.alibabaconfig_sa || this.user.digitaloceanconfig_sa){
              if(this.redirectUrl)
              {
                  var redirect = decodeURIComponent(this.redirectUrl.toString());
                  var params = this.sortParams(redirect);
                  var link = `${redirect.split('?')[0]}`;
                  this.router.navigate([link], { queryParams: params});
              }
              else
              {
                if(this.source && this.source=="cli") this.router.navigate(['settings/cloud'], { queryParams: {src: this.source}}); 
                else this.router.navigate(['serving']);
              }
            }
            else{
              this.router.navigate(['dashboard/wizard']);
            }  
            
            //post notification for non-commercial license if needed
            this.miscService.checkAndShowNotification(this.user, this.sailsSocketService);
            
        } else {
          console.log("failed");
          this.notifyService.notify(data.message, 'danger');
          this.router.navigate(['auth/login']);
        }
        },  (err) =>{
          console.log(err)
          this.notifyService.notify('Something went wrong, please try logging in', 'danger');
          this.router.navigate(['/auth/login']);
        });
      } else {
        this.notifyService.notify('Something went wrong, please register again', 'danger');
        this.router.navigate(['/auth/register']);
      }
      }, (err) => {
          console.log(err);
          this.notifyService.notify('Something went wrong, please register again', 'danger');
          this.router.navigate(['/auth/register']);
      })
  }


  onLoginSubmit() {
    console.log("here in");

    if(this.mode == 'Login') {
        const user = {
            email: this.email,
            password: this.password
        }
        console.log("calling authenticate");
        this.authService.httpService('/api/authenticate', user, 'post', (data) => {
            if (data.success) {
                console.log(data.user);
                this.authService.login(data.user);
                console.log("login success");
                
                console.log("in between");
                console.log(window.location.host);
                
                this.sailsSocketService.connectSocket();   
                this.user = this.authService.loggedInUser();
                
                //Skipping wizard as of now - PG
                if (true || this.user.gcpconfig_sa || this.user.ec2config || this.user.ubuntuconfig_sa || this.user.azureconfig_sa || this.user.alibabaconfig_sa || this.user.digitaloceanconfig_sa){
                  if(this.redirectUrl)
                  {
                      var redirect = decodeURIComponent(this.redirectUrl.toString());
                      var params = this.sortParams(redirect);
                      var link = `${redirect.split('?')[0]}`;
                      this.router.navigate([link], { queryParams: params});
                  }
                  else
                  {
                    this.router.navigate(['serving']);
                  }
                }
                else{
                  this.router.navigate(['dashboard/wizard']);
                }  
                //post notification for non-commercial license if needed
                this.miscService.checkAndShowNotification(this.user, this.sailsSocketService);
                
            } else {
              console.log("failed");
                this.notifyService.notify(data.message, 'danger');
                this.router.navigate(['auth/login']);
            }
         },  (err) =>{
            var parent = this;
            var res = JSON.parse(err._body);
            if(res.err == "Account unverified. In case you did not receive verification email, please check your SPAM folder or contact support@clouderizer.com")
            {
              swal({
                text: res.err,
                type: 'warning',
                confirmButtonColor: 'green',
                confirmButtonText: "Resend link"
              }).then(function(result) {
                if(result.value){
                  parent.authService.httpService('/api/auth/resendlink', user, 'post', (data) => {
                    if(data.success){
                      parent.notifyService.notify('Please check your email inbox for account activation instructions. Check your spam folder as well as activation email sometimes lands there.', 'success');
                    }
                    }, (err) => {
                  });
                }
                else{
                  console.log("closed");
                }
              })
            }
        });
    } else if(this.mode == 'Forgot Password') {
        this.authService.httpService('/api/resetpassword', {email: this.email}, 'post', (data) => {
            this.notifyService.notify("An email has been sent with instructions to reset your password.", "success");
            this.mode = 'Login';
        }, (err) => {
            
        });
      }
    }

    sortParams(link) {
      let queryParams = link.split('?')[1];
      let params = queryParams.split('&');
      let pair = null;
      let data = {};
      params.forEach((d) => {
        pair = d.split('=');
        data[`${pair[0]}`] = pair[1];
      });
      return data;
    }

    onForgotPwdClick() {
      this.mode = 'Forgot Password';
    }

    onLoginClick() {
      this.mode = 'Login';
    }
}