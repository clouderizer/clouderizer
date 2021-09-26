import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { Router } from '@angular/router';

declare var $:any;
declare var swal:any;
@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  constructor(
    private projectService: ProjectService,
    public router: Router,
    private authService: AuthService,
    private notifyService: NotifyService,
    private miscService: MiscService 
  ) { }
  user: any
  ngOnInit() {
    this.user = this.authService.loggedInUser();
  }

  

  iamInterested() {
    this.authService.httpService('api/customer/iaminterested', null, 'post', (data) => {
      this.notifyService.notify('Thank you for your interest. Someone from our team will reach out to you.', 'success');
    }, (err) => {
      this.notifyService.notify('Sorry. Something went wrong. Please try again after some time.', 'danger');
    });
  }

  openlicense() {
    this.router.navigate([]).then(result => { window.open("https://github.com/clouderizer", '_blank')})
  }

  onSignupClick() {
    this.router.navigate([]).then(result => { window.open("https://showcase.clouderizer.com/auth/signup", '_blank')})
  }

}
