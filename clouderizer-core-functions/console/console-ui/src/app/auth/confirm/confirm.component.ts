import { Component, OnInit, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

declare var $:any;
declare var swal:any;

@Component({
    selector: 'confirm-cmp',
    templateUrl: './confirm.component.html',
    styleUrls: ['./confirm.component.scss']
})

export class ConfirmComponent implements OnInit {
    test: Date = new Date();
    private toggleButton;
    private sidebarVisible: boolean;
    private nativeElement: Node;

    message: String;
    verifying: boolean;

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
              this.verifyAccount(guid, null);
          }
        }
    }

    verifyAccount(guid, obj) {
        this.verifying = true;
        this.message = 'Hold on while we verify your account...';
        this.authService.httpService('/api/confirm?u='+guid, obj, 'post', (data) => {
            console.log('successful verification');
            if (data.success) {
                console.log("in success")
                this.message = 'Email verification successful. Taking you to login page...';
                this.notifyService.notify("Email verification successful. Please login now to access Clouderizer console.", 'success')
                setTimeout(() => {
                    this.verifying = false;
                    console.log("in timeout");
                    this.router.navigate(['auth/login']);
                }, 2000);
            
            } else {
                this.message = data.message;
                this.verifying = false;
            }
        }, (err) => {
            this.verifying = false;
            if (err.status == 401) {
                this.message = 'Email verification failed';
                this.notifyService.notify("Email verification failed.", 'danger');
            } else {
                if(err._body) {
                    var res = JSON.parse(err._body);
                    if(res.needpassword) {
                        //capture
                        var parent = this;
                        swal({
                            title: 'Set Password',
                            html: '<div class="form-horizontal">' +
                                '<fieldset><div class="form-group">' +
                                '<div ><input id="input-pwd" type="password" class="form-control" placeholder="Password"/></div>' +
                                '</div></fieldset>' +
                                '<fieldset><div class="form-group">' +
                                '<div ><input id="input-cpwd" type="password" class="form-control" placeholder="Confirm Password"/></div>' +

                                '</div></fieldset>' +
                                '</div>',
                            showCancelButton: true,
                            confirmButtonColor: 'green',
                            cancelButtonColor: 'red',
                            preConfirm: () => {
                                return new Promise((resolve) => {
                                    var pwd = $('#input-pwd').val();
                                    var cpwd = $('#input-cpwd').val();

                                    if (pwd == '' || cpwd == '') {
                                        swal.showValidationError(
                                            'Please fill in all fields.'
                                        )
                                    } else if (pwd != cpwd) {
                                        swal.showValidationError(
                                            'Passwords dont match.'
                                        )
                                    } else {
                                        resolve();
                                    }
                                });
                            },
                        }).then(function (result) {
                            if(result.value){
                                var pwd = $('#input-pwd').val();
                                //var cpwd = $('#input-cpwd').val();
                                parent.authService.httpService('/api/confirm?u='+guid, {password: pwd}, 'post', (data) => {
                                    parent.message = 'Email verification successful. Taking you to login page...';
                                    parent.notifyService.notify("Email verification successful. Please login now to access Clouderizer console.", 'success')
                                    setTimeout(() => {
                                        parent.verifying = false;
                                        parent.router.navigate(['auth/login']);
                                    }, 2000);                                           
                                }, (err) => {

                                });
                            }
                            else if(result.dismiss === swal.DismissReason.cancel){
                                console.log("closed");
                            }
                        }).catch(swal.noop);
                        return;
                    }
                }

                this.message = 'Email verification failed.';
            }
        });
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
