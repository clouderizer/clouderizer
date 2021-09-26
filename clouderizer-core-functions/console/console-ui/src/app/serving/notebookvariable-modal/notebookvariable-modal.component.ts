import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MiscService } from '../../services/misc.service';
import { NotifyService } from '../../services/notify.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

declare var swal: any;

@Component({
  selector: 'notebookvariable',
  templateUrl: './notebookvariable-modal.component.html',
  styleUrls: ['./notebookvariable-modal.component.css']
})
export class NotebookVariableModalComponent implements OnInit {

  @Input() type;
  @Input() notebookKey;
  @Input() notebookValue;
  @Output() variableout = new EventEmitter();
  onlyread:boolean;
  user: any;
  closeModal(action) {
		this.activeModal.close(action);
  }

  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private miscService: MiscService,
    private notifyService: NotifyService
  ) {}

  ngOnInit() {
    this.user = this.authService.loggedInUser();
    if(this.type == 'edit') this.onlyread = true;
  }
  addVariable(type){
    this.authService.httpService('api/customer/nbvariables', {"customerId": this.user.company.id, "type": type, "key": this.notebookKey, "value": this.notebookValue}, 'post', (data) => {
      console.log(data);
      this.variableout.emit({"key": this.notebookKey, "value": this.notebookValue});
    }, (err) => {
    });
    this.closeModal(false);
  }
}

  