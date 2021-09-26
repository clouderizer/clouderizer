import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'toTotal' })
export class TotalMetric implements PipeTransform {
  transform(item: any): any {
    
    var function_time_sum_standard = 0;
    var function_time_sum_highmemory = 0;
    var function_time_sum_gpu = 0;
    var function_time_sum = 0;
    
    if(item.function_time_sum_standard && parseFloat(item.function_time_sum_standard)) {
      function_time_sum_standard = parseFloat(item.function_time_sum_standard);
    }
    if(item.function_time_sum_highmemory && parseFloat(item.function_time_sum_highmemory)) {
      function_time_sum_highmemory = parseFloat(item.function_time_highmemory);
    } 
    if(item.function_time_sum_gpu && parseFloat(item.function_time_sum_gpu)) {
      function_time_sum_gpu = parseFloat(item.function_time_sum_gpu);
    }
   
    function_time_sum = function_time_sum_standard + function_time_sum_highmemory + function_time_sum_gpu;
    var final_time = (function_time_sum/60).toFixed(2)
    return final_time
  }
}