import { Pipe, PipeTransform } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
@Pipe({
  name: 'filterFalse'
})
export class FilterFalsePipe implements PipeTransform {
  transform(items: any[]): any[] {
    if(!items) {
      console.log("no items");
      return [];
    }
    return items.filter(item => item.important == false);
}
}