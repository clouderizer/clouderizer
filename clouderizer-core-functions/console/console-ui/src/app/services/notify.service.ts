import { Injectable } from '@angular/core';

declare var $:any;

@Injectable()
export class NotifyService {

  constructor() { }

  notify(message, type) {
    var icon = "";
    var timeout = 1000;

    $.notify({
      icon: icon,
      message: message
    },
    {
      type: type,
      timer: timeout,
      placement: {
        from: 'top',
        align: 'center'
      }
    });
  }
}