import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stripSpaces' })
export class StripSpaces implements PipeTransform {
  transform(str: string): any {
    return str.replace(/\s/g, '')
  }
}