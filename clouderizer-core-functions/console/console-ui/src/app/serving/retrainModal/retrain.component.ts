import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { fileService } from '../../services/s3fileupload.service';

@Component({
  selector: 'app-bannerImage',
  templateUrl: './retrain.component.html',
  styleUrls: ['./retrain.component.scss']
})
export class retrain implements OnInit {

  @Input() projectModel;

  retrainURL: string;

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private notifyService: NotifyService,
    private fileService: fileService
    ) {}


  ngOnInit() {
  }

  retrain(){
    this.projectModel.user_retrain_url = this.retrainURL;
    this.projectModel.enableRetrain = true;
    this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
      this.authService.httpService('api/servingmodel/retrain', {servingid: this.projectModel.id}, 'post', (data) => {
        this.notifyService.notify(`${data.msg}`, 'success');
      }, (err) => {
          this.notifyService.notify("Something went wrong, Couldn't initiate retraining", 'danger');
          console.log(err);   
      },true,false);
    },(err) => {
      this.notifyService.notify("Something went wrong, Couldn't initiate retraining", 'danger');
      console.log(err);
    }, true, false);
    this.closeModal(false);
  }
}