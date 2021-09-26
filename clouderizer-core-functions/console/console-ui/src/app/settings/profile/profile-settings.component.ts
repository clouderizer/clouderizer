import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';

declare var swal: any;
declare var $: any;

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  public name: string;
  public company: string;
  public email: string;
  public phone: string;
  public user:any;

  constructor(
    private authService: AuthService,
    private notifyService: NotifyService,
  ) { }

  ngOnInit() {
    this.user = this.authService.loggedInUser();
  }

  saveProfile() {
    console.log(this.user);
    var userdetails = {"id": this.user.id, "name": this.user.name, "email":this.user.email}
    var companydetails = {"id":this.user.company.id, "phone":this.user.company.phone}
    this.authService.httpService('/api/user/saveprofile', userdetails, 'put', (data) => {
      this.authService.httpService('/api/customer/saveprofile', companydetails, 'put', (data) => {
        this.authService.setLoggedInUser(this.user);
        this.notifyService.notify('Details saved successfully.', 'info');
      }, (err) => {
        this.notifyService.notify('update failed', 'info');
      })
    },
       (err) => {
      this.notifyService.notify('update failed', 'info');
    }, true, false);
  }

  changePassword() {
    var parent = this;
    
    swal({
        title: 'Change Password',
        html:  '<div class="form-horizontal">' + 
                  '<fieldset><div class="form-group">' +
                      '<div ><input id="input-opwd" type="password" class="form-control" placeholder="Old Password"/></div>' +
                  '</div></fieldset>' +
                  '<fieldset><div class="form-group">' +
                      '<div ><input id="input-pwd" type="password" class="form-control" placeholder="New Password"/></div>' +
                  '</div></fieldset>' +
                  '<fieldset><div class="form-group">' +
                      '<div ><input id="input-cpwd" type="password" class="form-control" placeholder="Confirm Password"/></div>' +              
                  '</div></fieldset>' +
                '</div>',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          return new Promise<void>((resolve, reject) => {
            var opwd = $('#input-opwd').val();
            var pwd = $('#input-pwd').val();
            var cpwd = $('#input-cpwd').val();

            if(opwd == '' || pwd == '' || cpwd == '') {
              swal.showValidationMessage('Please fill in all fields.')
              resolve();
            } else if(pwd != cpwd) {
              swal.showValidationMessage('Passwords don\'t match.')
              resolve();
            } else {
              swal.resetValidationError();
              var opwd = $('#input-opwd').val();
              var pwd = $('#input-pwd').val();
              var cpwd = $('#input-cpwd').val();
              
              parent.authService.httpService('api/setpassword', {opwd: opwd, newpwd: pwd}, 'post', (data) => {
                resolve();
                parent.notifyService.notify('Password updated successfully', 'success');
              }, (err) => {
                swal.showValidationError(
                  'Invalid old password.'
                )
                resolve();
              })
            }
          });
        },
    }).then(function(result) {
    }).catch(swal.noop)
  }
}
