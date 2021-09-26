import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable({
    providedIn: 'root'
})
export class sharedService {

  private sub = new BehaviorSubject<any>('');
  subj = this.sub.asObservable();

  send(value: any) {
    this.sub.next(value);
  }

}