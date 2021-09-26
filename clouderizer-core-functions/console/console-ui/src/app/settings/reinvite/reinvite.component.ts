import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

declare interface Table_With_Checkboxes {
  id?: number;
  name: string;
  email: string;
  type: string;
  active?: boolean;
}
@Component({
  selector: 'app-reinvite',
  templateUrl: './reinvite.component.html',
  styleUrls: ['./reinvite.component.scss']
})
export class ReinviteComponent implements OnInit {

  closeModal(action) {
		this.activeModal.close(action);
  }

  public reInvite: Table_With_Checkboxes[];
  public headerRow: string[];
  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public notifyService: NotifyService) { }

  ngOnInit() 
  {
    this.loaduser();
  }

   loaduser()
   {
    this.reInvite = null;
    this.headerRow = [ 'S.No', 'Name', 'Email', 'Type', 'Enabled' ];
    this.authService.httpService('api/user/listunverified', null, 'get', (data) => {
      this.reInvite = [];
      if(data && data.length > 0) {
          for(var i=0;i<data.length;i++) {
              var row = data[i];
              var drow = {
                  id: row.id,
                  name: row.name,
                  email: row.email,
                  type: row.type,
              };
              this.reInvite.push(drow);
          }
      }
  }, (err) => {

  });
   }

   reInviteAll()
   {
    this.reInvite;
    for(var a=0;a<this.reInvite.length;a++)
    {
        var email=this.reInvite[a].email;
        var name = this.reInvite[a].name;
        this.authService.httpService('api/user/reinviteall', {name: name, email: email}, 'post', (data) => {
        }, (err) => {
   
        });
    }
    this.notifyService.notify('Invitation sent for all the users ', 'success');
    this.closeModal(false);
   }
}
