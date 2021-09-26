import { Component, OnInit, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

declare var $:any;
declare var swal:any;

@Component({
    selector: 'resetpwd-cmp',
    templateUrl: './resetpwd.component.html'
})

export class ResetPwdComponent implements OnInit {
    test: Date = new Date();
    private toggleButton;
    private sidebarVisible: boolean;
    private nativeElement: Node;

    message: String;

    constructor(
        private element: ElementRef,
        private authService: AuthService,
        private notifyService: NotifyService,
        private router: Router

    ) {
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
    }
    checkFullPageBackgroundImage() {
        var $page = $('.full-page');
        var image_src = $page.data('image');

        if (image_src !== undefined) {
            var image_container = '<div class="full-page-background" style="background-image: url(' + image_src + ') "/>'
            $page.append(image_container);
        }
    };

    ngOnInit() {
        this.checkFullPageBackgroundImage();

        var navbar: HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];

        setTimeout(function () {
            // after 1000 ms we add the class animated to the login/register card
            $('.card').removeClass('card-hidden');
        }, 700)

        if(this.authService.loggedIn()) {
            this.router.navigate(['dashboard']);
        } else {
          var guid = this.router.routerState.snapshot.root.queryParams.u;
          if(guid!=undefined) {
              console.log("reset password");
              this.resetPassword(guid);
          } else {
            this.router.navigate(['login']);
          }
        }
    }

    resetPassword(guid) {
      var parent = this;
      swal({
        title: 'Reset Password',
        html:  '<div class="form-horizontal">' + 
                  '<fieldset><div class="form-group">' +
                      '<div ><input id="input-pwd" type="password" class="form-control" placeholder="New Password"/></div>' +
                  '</div></fieldset>' +
                  '<fieldset><div class="form-group">' +
                      '<div ><input id="input-cpwd" type="password" class="form-control" placeholder="Confirm Password"/></div>' +
                      
                  '</div></fieldset>' +
              '</div>',
        showCancelButton: true,
        confirmButtonColor: 'green',
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        cancelButtonColor: 'red',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          return new Promise((resolve) => {
            var pwd = $('#input-pwd').val();
            var cpwd = $('#input-cpwd').val();

            if(pwd == '' || cpwd == '') {
              swal.showValidationMessage(
                'Please fill in all fields.'
              )
              resolve();
            } else if(pwd != cpwd) {
              swal.showValidationMessage(
                'Passwords dont match.'
              )
              resolve();
            } else {
              resolve();
            }
          });
        },
      }).then(function(result) {
        if(result.value){
          var pwd = $('#input-pwd').val();
          var cpwd = $('#input-cpwd').val();
          
          parent.authService.httpService('api/setpassword', {verification_guid: guid, newpwd: pwd}, 'post', (data) => {
            parent.message = 'Password reset successful. Taking you to login page...';
            parent.notifyService.notify("Password reset successful. Please login now to access Clouderizer console.", 'success')
            setTimeout(() => {
                parent.router.navigate(['auth/login']);
            }, 2000);    
          }, (err) => {
            setTimeout(() => {
              parent.router.navigate(['auth/login']);
          }, 2000);  
          })
        }
        else if(result.dismiss === swal.DismissReason.cancel){
          console.log("closed");
        }
      }).catch(swal.noop);
      return;
    }

    sidebarToggle() {
        var toggleButton = this.toggleButton;
        var body = document.getElementsByTagName('body')[0];
        var sidebar = document.getElementsByClassName('navbar-collapse')[0];
        if (this.sidebarVisible == false) {
            setTimeout(function () {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');
            this.sidebarVisible = true;
        } else {
            this.toggleButton.classList.remove('toggled');
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    }
}
