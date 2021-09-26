import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
    providedIn: 'root'
})
export class sharedService {

  private sub = new BehaviorSubject<any>('');
  private subProject = new BehaviorSubject<any>('');
  subj = this.sub.asObservable();
  projectParams = this.subProject.asObservable();
  send(value: any) {
    this.sub.next(value);
  }

  sendProjectDetails(value: any) {
    this.subProject.next(value);
  }
}