import { NgModule } from '@angular/core';
import {CommonModule} from "@angular/common";

import { FilterPipe } from './filter.pipe';
import { StripSpaces } from './stripspaces.pipe';
import { FixedDecimal } from './tofixeddecimal.pipe';
import { TotalMetric } from './toTotal.pipe';
import { Decodebase64 } from './decodebase64.pipe';


@NgModule({
  declarations:[FilterPipe, TotalMetric, StripSpaces, FixedDecimal, Decodebase64], 
  imports:[CommonModule],
  exports:[FilterPipe, TotalMetric, StripSpaces, FixedDecimal, Decodebase64] 
})

export class MainPipe{}