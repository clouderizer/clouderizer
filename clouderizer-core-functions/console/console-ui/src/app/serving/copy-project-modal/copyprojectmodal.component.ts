import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input} from '@angular/core';
import { Project } from '../../models/project';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { ProjectService } from '../../services/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'copy-project',
  templateUrl: './copyprojectmodal.component.html',
  styleUrls: ['./copyprojectmodal.component.css']
})
export class CopyProjectModalComponent implements OnInit {
  closeModal(action) {
		this.activeModal.close(action);
  }
  @Input() childProject;
  @Output() emitData = new EventEmitter();
  projectId:any;
  user: any;
  constructor( 
    public ngxSmartModalService: NgxSmartModalService,
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public router: Router ,
    public notifyService: NotifyService,
    public miscService: MiscService,
    private projectService: ProjectService
  ) { }

  projectname: string;
  
  ngOnInit() {
    //this.miscService.setCopyProjectNeedRefresh(false);
    this.user = this.authService.loggedInUser();
    var parent = this;
    setTimeout(() => {
      //parent.childProject = parent.project
      parent.projectname = parent.childProject.name + "-Copy";
      parent.childProject.key = parent.projectService.getRandomKey();
      this.projectId = parent.childProject.id
      delete(parent.childProject.id);
    }, 500);
  }

  copy() {
    this.childProject.name = this.projectname;
    this.childProject.company = this.user.company.id;
    this.childProject.ispublic = false;
    this.childProject.status = 'Not Running';
    this.closeModal(false);
    this.authService.httpService('api/servingproject', this.childProject, 'post', (data) => {
      this.authService.httpService('api/servingmodel?where={"servingproject":"'+this.projectId+'"}', null, 'get', (value) => {
        delete(value[0].id);
        value[0].servingproject = data.id;
        value[0].status = 'Not Running';
        value[0].status_message = '';
        console.log(value);
        this.authService.httpService('api/servingmodel', value[0], 'post', (data) => {
          console.log(data);
          this.notifyService.notify('Successfully copied project', "success");
          this.emitData.next("done");
        }, err=> {
          this.notifyService.notify('Could not copy model details', "danger");
          this.emitData.next("done");
        })
      }, err=> {
        this.notifyService.notify('Could not fetch model details', "danger");
        this.emitData.next("done");
      });
    }, (err) => {
      this.notifyService.notify('Error copying project', "danger");
      this.emitData.next("done");
    });
  }
}