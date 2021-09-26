
import { Injectable } from '@angular/core';

@Injectable()
export class ProjectService {
  icons = ["rocket", "snowflake-o", "superpowers", "ravelry", "diamond", "tachometer",
  "hand-spock-o", "space-shuttle", "heartbeat", "magnet"];
  icolors = ["icon-info", "icon-warning", "icon-danger"];
  template = null;
  gpu1bidprice = 0;
  getRandomStyle() {
    var i = this.icons[Math.floor(Math.random() * this.icons.length)];
    var c = this.icolors[Math.floor(Math.random() * this.icolors.length)];
    return "fa fa-" + i + " " + c;
  }

  getRandomIconStyle() {
    return this.icolors[Math.floor(Math.random() * this.icolors.length)];
  }

  getRandomKey() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 8; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

  setSelectedTemplate(template) {
    this.template = template;
  }

  getSelectedTemplate() {
    return this.template;
  }

  setGPU1BidPrice(price) {
    this.gpu1bidprice = price;
  }

  getGPU1BidPrice() {
    return this.gpu1bidprice;
  }
}

