import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tofixeddecimal' })
export class FixedDecimal implements PipeTransform {
  transform(str: any): any {
    var a:any = parseFloat(str).toFixed(2)
    if(isNaN(a)){
        return ""
    }
    else{
        return a
    }

  }
}