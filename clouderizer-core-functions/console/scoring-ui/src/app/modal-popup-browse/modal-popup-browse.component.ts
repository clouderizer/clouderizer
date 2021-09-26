import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { ViewEncapsulation } from '@angular/core';
import {ErrorStateMatcher} from '@angular/material/core';
import {FormBuilder, FormGroupDirective, NgForm, FormControl, FormGroup, FormArray, Validators, ValidatorFn, ValidationErrors} from '@angular/forms';
import {KeywordValidatorDirective} from './keyword-validator.directive';

declare var $:any;

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    console.log(control.invalid);
    return !!(control && control.invalid);
  }
}

@Component({
  selector: 'app-modal-popup-browse',
  templateUrl: './modal-popup-browse.component.html',
  styleUrls: ['./modal-popup-browse.component.scss'],
})
export class ModalPopupBrowseComponent implements OnInit {
  encapsulation: ViewEncapsulation.None
  displayedColumns: any[]=[];
  matcher = new MyErrorStateMatcher();
  // inputTypes = [Text", "Multiline Text", "Enum", "Numeric"];
  public allowedValues:any[]=[];

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  @Input() columnList;
  @Input() some;
  @Input() inputList;
  @Input() outputList;
  @Input() modelSubType;
  @Input() ioType;
  @Output() ioconfigEvent = new EventEmitter();
  selectable = true;
  removable = true;
  outputColumns: any[]=[];
  item:string;
  addOnBlur = true;
  like:boolean = false;
  dislike:boolean = false;
  minmaxerror = false;
  minmaxabsense = false;
  something: any={};
  feedbackList:any[]=[];
  errorMsg: boolean;
  modelSubtype:string;
  newList:any[]=[];
  rows: FormArray = this._formBuilder.array([]);
  inputForm: FormGroup = this._formBuilder.group({columns: this.rows});
  public ioData: any;
  public objectKeys = Object.keys;
  public objectValues = Object.values;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  
  constructor( 
    public activeModal: NgbActiveModal,
    private router: Router,
    private _formBuilder: FormBuilder,
    private cdRef:ChangeDetectorRef
    ) 
    {}

  ngOnInit() {
    console.log(this.inputForm.valid);
    this.errorMsg = true;
    console.log(this.columnList);
    this.displayedColumns = this.objectKeys(this.columnList[0]);
    if(this.ioType === 'output'){
      console.log(this.outputList);
      this.outputList.forEach(item => {
        this.outputColumns.push(item.userfriendlyName || item.name);
        var out_index = this.displayedColumns.indexOf(item.userfriendlyName || item.name);  
        console.log(out_index);
        this.displayedColumns.splice(out_index, 1);
      });

      var fb_index = this.displayedColumns.indexOf('feedback');
      this.displayedColumns.splice(fb_index, 1);
      console.log(this.displayedColumns);
      this.columnList.forEach(item => this.feedbackList.push(item.feedback));
    }

    console.log(this.columnList);
    if(this.ioType === 'input'){ 
      const row = this._formBuilder.group(
        this.some
      );
      for(let i=0; i<this.columnList.length; i++){
      this.rows.push(row);
      }
      console.log("after for loop");
      console.log(this.inputForm);
      console.log(this.columnList);
      console.log(this.inputList);
    }
  }

  onValueChange() { 
  console.log( "! change" );
  this.cdRef.detectChanges();
}

  changeFeedback(element, text){
    if(text == 'like'){
      element.feedback = true;
    }
    else if(text == 'dislike'){
      element.feedback = false;
    }
    console.log(this.columnList);
  }

  saveInput(){
    console.log('saved');
    console.log(this.inputForm.value);
    for (let i=0;i<this.columnList.length;i++){
      console.log(i);
      for(let j=0; j<Object.keys(this.columnList[i]).length*this.columnList.length;j+=this.columnList.length){   
        console.log(j);
        this.columnList[i][Object.keys(this.columnList[i])[j/this.columnList.length]] = Object.values(this.inputForm.value.columns[0])[i+j]
      }
    }
    console.log(this.columnList);
    console.log(this.inputForm.valid);
    this.ioconfigEvent.emit({data: this.columnList, iotype: this.ioType, formStatus: this.inputForm.valid});
    this.closeModal(false);
  }

  saveOutput(){
    console.log("output saving");
    console.log(this.columnList);
    this.ioconfigEvent.emit({data: this.columnList, iotype: this.ioType});
    this.closeModal(false);
  }

  add(event: MatChipInputEvent, element): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      var index  = this.columnList.indexOf(element);
      this.columnList[index]["allowedValues"].push(value.trim());
      console.log(this.columnList);
    }
    console.log(this.allowedValues);
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(item, element): void {
    const indexElement  = this.columnList.indexOf(element);
    const index = this.columnList[indexElement]["allowedValues"].indexOf(item);

    if (index >= 0) {
      this.columnList[indexElement]["allowedValues"].splice(index, 1);
    }
  }

  turnInput(event){
    var className = event.target.className;
    console.log($(className + '.inputElement'));
    var inputText = $('.inputElement').innerHTML;
    console.log(inputText);
    this.item = "hi";
    $('.inputElement').replaceWith($('<input id="editableText" type="text" value={{item}} />'));
  }

  closemodal(){
    if(this.ioType == 'output'){
      for(let i=0;i<this.columnList.length;i++){
        this.columnList[i].feedback = this.feedbackList[i];
      }
    }

    if(this.ioType == 'input'){
      console.log(this.columnList);
      this.ioconfigEvent.emit({data: this.columnList, iotype: this.ioType, formStatus: this.inputForm.valid});
    }

    this.closeModal(false);
  }

  validateminmax(element){
    console.log("validating");
    var minimum = (<HTMLInputElement>document.getElementById(element.name+ "-min")).value;
    var maximum = (<HTMLInputElement>document.getElementById(element.name+ "-max")).value;
    console.log(minimum);
    console.log(maximum);
    if(minimum || maximum){
      if((minimum && !maximum) || (!minimum && maximum)){
        element.minmaxerror = false;
        element.minmaxabsense = true;
      }
      else if(parseFloat(minimum) >= parseFloat(maximum)){
        element.minmaxerror = true;
        element.minmaxabsense = false;
        
      }
      else{
        element.minmaxerror = false;
        element.minmaxabsense = false;
      }
    }
    else{
      element.minmaxerror = false;
      element.minmaxabsense = false;
    }
    console.log(element.minmaxerror);
    console.log(element.minmaxabsense);
  }
}
