import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SailsSocketService } from '../../services/sailssocket.service';
import { MiscService } from '../../services/misc.service';
import { CliModalComponent } from '../../serving/cli-modal/climodal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare var $: any;
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public username : string;
  public listNotifications: any[];

  constructor(
    private router: Router,
    public modalService: NgbModal,
    private authService: AuthService,
    private sailsSocketService: SailsSocketService,
    private miscService: MiscService,
  ) { }

  ngOnInit() {
    var user = this.authService.loggedInUser();
    this.username = user.name;
    this.listNotifications = [];
    this.sailsSocketService.registerNotification(this.listNotifications);
    this.miscService.checkAndShowNotification(user, this.sailsSocketService);
    
  }

  openCLI() {
    var actionModel = this.modalService.open(CliModalComponent, { centered: true,  size:'md', backdrop: 'static',  windowClass: "cliPop" });
    actionModel.componentInstance.type = 'cli';
    actionModel.result.then((result) => {
    }, (reason) => {
    })
  }

  onLogoutClick() {
    if(this.authService.loggedIn())
    {
        window.location.reload();
        this.authService.httpService('api/logout', null, 'get', (data) => {
          console.log("before loggingout");
          this.authService.logout();
        }, (err) => {
        });
        this.authService.logout();
    }
    else
    {
      console.log("before routing to login");
      this.router.navigate(['/auth/login']);
    }
  }
}
