import { Component, OnInit } from '@angular/core';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription }   from 'rxjs/Subscription';
import { sharedService } from '../services/shared.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navheader',
  templateUrl: './navheader.component.html',
  styleUrls: ['./navheader.component.scss']
})
export class NavheaderComponent implements OnInit {
  projectSubscription: Subscription;
  projectName: string;
  projectId: string;
  hostName: string;
  type: string;

  constructor(public modalService: NgbModal,
    private dataService : sharedService,
    private router: Router,
    public authService: AuthService,) {}

  ngOnInit() {
    this.hostName = document.location.protocol +'//'+ document.location.hostname;
    this.projectSubscription = this.dataService.subj.subscribe(val=>{
      this.projectName = val.projectName;
      this.projectId = val.projectId;
      if(val.public){
        this.type = 'public';
      }
      else{
        this.type = 'edit';
      }
    }, err=>{
      console.log(err);
    },
    ()=>{
      console.log("no value");
    });
  }

  // openPop() {
  //   var actionModel = this.modalService.open(ConfirmationModalComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" })
  //   actionModel.result.then((result) => {
  //   }, (reason) => {
  //   });
  // }

}
