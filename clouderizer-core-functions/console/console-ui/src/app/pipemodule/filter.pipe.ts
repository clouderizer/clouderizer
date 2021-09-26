import { Pipe, PipeTransform } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if(!items) {
      console.log("no items");
      return [];
    }
    console.log(searchText);
    if(!searchText) {
      console.log("no searchtext");
      console.log(items);
      return items;
    }
    console.log(items);
    if(items instanceof MatTableDataSource){
      items = items.data;
    }
    console.log(items);
searchText = searchText.toLowerCase();
return items.filter( it => {
      return it["name"].toString().toLowerCase().includes(searchText);
    });
   }
}