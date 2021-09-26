import { NgModule } from '@angular/core';
import {CommonModule} from "@angular/common";

import { FilterPipe } from './filter.pipe';
import {FilterFalsePipe} from './filterFalse.pipe'

@NgModule({
  declarations:[FilterPipe, FilterFalsePipe], 
  imports:[CommonModule],
  exports:[FilterPipe, FilterFalsePipe] 
})

export class MainPipe{}