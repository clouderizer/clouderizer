import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

declare var swal: any;

@Component({
  selector: 'cli',
  templateUrl: './climodal.component.html',
  styleUrls: ['./climodal.component.css']
})
export class CliModalComponent implements OnInit {

  @Input() type;
  @Input() apiurl;
  @Input() stoplambdacommand;

  closeModal(action) {
		this.activeModal.close(action);
  }
  msgHideAndShow: boolean = false;
  hostName: string;
  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public router: Router,
    public notifyService: NotifyService,
    public miscService: MiscService
  ) { }



  ngOnInit() {
    this.hostName = document.location.protocol +'//'+ document.location.hostname;
  }

  copyCommand(){
    var input = <HTMLInputElement>document.getElementById('myInput');
    input.select(); 
    document.execCommand('copy'); 
    input.setSelectionRange(0, 0);
    input.blur(); 
    this.textMessageFunc('Text');
  }

  textMessageFunc(msgText){  
    this.msgHideAndShow=true;  
    setTimeout(() => {    
      this.msgHideAndShow=false;  
    }, 3000);    
  }
}

  