import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'decodefrombase64' })
export class Decodebase64 implements PipeTransform {
  transform(str: any): any {
    try{
      var decodedstr:any;
      decodedstr = atob(str);
      return decodedstr
    }
    catch(err){
      return str
    }
  }
}