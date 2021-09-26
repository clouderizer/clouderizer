import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare interface Table_With_Checkboxes {
  id?: number,
  name: string;
  email: string;
  type: string;
  active?: boolean;
}

declare var $:any;
declare var swal:any;

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {
  public userList: Table_With_Checkboxes[];
  displayedColumns: string[];

  constructor(
    public modalService: NgbModal,
    public authService: AuthService,
    public notifyService: NotifyService
  ) { }

  ngOnInit() {
    this.userList = null;
    this.displayedColumns = ['slno','name', 'email', 'type', 'delete' , 'enable'];
    this.loadUsers();
  }

  loadUsers() {
    this.authService.httpService('api/user/listusers', null, 'get', (data) => {
        this.userList = [];
        if(data && data.length > 0) {
            for(var i=0;i<data.length;i++) {
                var row = data[i];
                var drow = {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    type: row.type,
                    active: (row.status == 'Active')
                };
                this.userList.push(drow);
            }
        }
    }, (err) => {

    });
  }

  onDelete(row) {
    var parent = this;
    swal({
        title: 'Confirm delete?',
        text: "Are you sure you want to delete user : "+row.name+"?",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
        confirmButtonText: 'Yes, delete it!'
    }).then(function(result) {
      if(result.value){
        parent.authService.httpService('api/user', row, 'delete', (data) => {
            parent.loadUsers();
        }, (err) => {

        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  onActiveClick(row) {
    var parent = this;
    var status = row.active ? 'enable' : 'disable';
    swal({
        title: 'Confirm '+status+'?',
        text: "Are you sure you want to "+status+" user : "+row.name+"?",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
        confirmButtonText: 'Yes'
    }).then(function(result) {
      if(result.value){
        parent.authService.httpService('api/user/disable', {userid: row.id, active: row.active}, 'post', (data) => {
            parent.loadUsers();
        }, (err) => {
            parent.loadUsers();
        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        if(status == 'enable'){
          row.active = false;
        }
        else if(status == 'disable'){
          row.active = true;
        }
        console.log("closed");
      }
    });
  }

  onInviteUser() {
    var parent = this;
    swal({
        title: 'Invite user',
        html:  '<div class="form-horizontal">' + 
                '<fieldset><div class="form-group">' +
                    //'<label class="col-sm-2 control-label">Name</label>' +
                    '<div ><input id="input-name" type="text" class="form-control" placeholder="Name"/></div>' +
                '</div></fieldset>' +
                '<fieldset><div class="form-group">' +
                    //'<label class="col-sm-2 control-label">Email</label>' +
                    '<div ><input id="input-email" type="text" class="form-control" placeholder="Email"/></div>' +
                '</div></fieldset>' +
              '</div>',
        showCancelButton: true,
        confirmButtonColor: 'green',
        cancelButtonColor: 'red',
    }).then(function(result) {
      if(result.value){
        var name = $('#input-name').val();
        var email = $('#input-email').val();
        parent.authService.httpService('api/user/invite', {name: name, email: email}, 'post', (data) => {
            parent.notifyService.notify('Invitation sent for user ' + name, 'success');
            parent.loadUsers();
        }, (err) => {

        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    }).catch(swal.noop)
}
}

