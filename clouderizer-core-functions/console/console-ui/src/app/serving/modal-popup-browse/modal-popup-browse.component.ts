import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { ViewEncapsulation } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { interval, Subscription } from 'rxjs';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { NotifyService } from '../../services/notify.service';
import { fileService } from '../../services/s3fileupload.service';
import {Http, Headers} from '@angular/http';


declare var $:any;

@Component({
  selector: 'app-modal-popup-browse',
  templateUrl: './modal-popup-browse.component.html',
  styleUrls: ['./modal-popup-browse.component.scss']
})
export class ModalPopupBrowseComponent implements OnInit {
  subscription: Subscription;
  @ViewChild( MatPaginator, {static:false}) paginator: MatPaginator; 
  encapsulation: ViewEncapsulation.None
  displayedColumns: any[]=[];
  timeseriesTypes = ["None", "Numeric"];
  inputTypes = ["None", "Text", "Enum", "Image", "Multiline Text"];
  inputSubTypes = [{name: "Numeric", types: ["Integer", "Whole"]}]
  public allowedValues:any[]=[];

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  @Input() columnList;
  @Input() preprocessEnabled;
  @Input() postprocessEnabled;
  @Input() iotype;
  @Input() subtype;
  @Input() projectType;
  @Input() projectStatus;
  @Input() timeSeries;
  @Output() ioconfigEvent = new EventEmitter();

  displayimages = ["clouderizerImage_smile.svg", "clouderizerImage_ok.svg", "clouderizerImage_ok1.svg", "clouderizerImage_freight.svg", "clouderizerImage_anxiety.svg", "clouderizerImage_failure.svg","clouderizerImage_no.svg","clouderizerImage_cloud.svg","clouderizerImage_fire.svg","clouderizerImage_girl.svg","clouderizerImage_man.svg","clouderizerImage_sad (1).svg","clouderizerImage_sad (2).svg","clouderizerImage_sad (3).svg","clouderizerImage_storm.svg","clouderizerImage_sun.svg","clouderizerImage_wave.svg","clouderizerImage_rain (1).svg","clouderizerImage_rain.svg","clouderizerImage_happy.webp","clouderizerImage_unhappy.webp"];
  selectable = true;
  gallerySrc: any;
  enumIndex: number;
  removable = true;
  columnListTemp: any[]=[];
  outputSelect: boolean = true;
  advanceSelect: boolean = false;
  bgimageSrc: any;
  bgimageExt: any;
  bgimageName: any;
  bgimageWidth: any;
  bgimageHeight: any;
  enums: any[]=[];
  menuEnable: boolean=false;
  currentElementIndex: number;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly separatorKeysCodes2: number[] = [ENTER, COMMA];
  
  item:string;
  currentPage:any;
  pageSize:any;
  viewmore:boolean=true;
  addOnBlur = true;
  public columnLength: number;
  minmax:boolean = true;
  public ioData: any;
  dataSource:any;
  posts:any;
  public objectKeys = Object.keys;
  public objectValues = Object.values;
  pageLength: number = 30;
  attributeLength: any;
  
  constructor( 
    private ref: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private router: Router,
    private http: Http,
    private notifyService: NotifyService,
    private fileService: fileService
    ) {
    }


  ngOnInit() {

    for (let i = 0; i < this.columnList.length; i++) {
      this.columnListTemp[i] = {}; 
      for (var prop in this.columnList[i]) {
        this.columnListTemp[i][prop] = this.columnList[i][prop];
      }
    }

    for(let i=0; i<this.columnList.length; i++){
      if(!this.columnList[i].allowed2){
        this.columnList[i].allowed2 = [this.columnList[i].name]
      }
    }

    this.columnLength = this.columnList.length;
    this.dataSource = this.columnList;
    this.dataSource = new MatTableDataSource(this.dataSource);
    this.dataSource.paginator = this.paginator;
    this.attributeLength = this.columnList.length;
    console.log(this.columnList);
    if(this.iotype === 'Input'){
      if(this.preprocessEnabled || this.subtype == 'pythonscore' || this.subtype == 'pmml' || this.subtype == 'jpmml' || this.subtype == 'pmml4s'){
        this.displayedColumns = ['slno', 'name', 'userfriendlyName', 'important', 'description', 'type', 'add', 'remove'];
      }
      else{
        this.displayedColumns = ['slno', 'name', 'userfriendlyName', 'important', 'description', 'type', 'add'];
      }
    }
    else if(this.iotype === 'Output'){
      if(this.timeSeries){       
        this.displayedColumns = ['slno', 'name', 'userfriendlyName', 'description', 'include']; 
      }
      else{
        if(this.postprocessEnabled || this.subtype == 'pythonscore' || this.subtype == 'pmml' || this.subtype == 'jpmml' || this.subtype == 'pmml4s'){
          this.displayedColumns = ['slno', 'name', 'userfriendlyName', 'description', 'type', 'add', 'advance', 'remove'];
        }
        else{
          this.displayedColumns = ['slno', 'name', 'userfriendlyName', 'description', 'type', 'add', 'advance'];
        }
      } 
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
  }

  ViewMore(){
    if(this.pageLength <= this.columnLength){
      this.pageLength += 30;
      this.paginator._changePageSize(this.pageLength);
    }
    if(this.pageLength >= this.columnLength){
      this.viewmore = false;
    }
  }

  public handlePage(e: any) {
    console.log(e.pageIndex);
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.iterator();
  }

  private iterator() {
    const end = (this.currentPage + 1) * this.pageSize;
    const start = this.currentPage * this.pageSize;
    this.dataSource.data = this.columnList.slice(start, end);
  }


  opensnack(){
      this.pageLength += 10;
      this.paginator._changePageSize(this.pageLength);
  }

  onScrollEvent() {
    console.log(this.pageLength);
    setTimeout(()=>{
      
      if (this.pageLength <= this.columnLength) {
        this.pageLength += 10;
        this.paginator._changePageSize(this.pageLength);
      }
    }, 2000);
  }

  onScrollDown(){
    console.log(this.posts.length);
    console.log(this.posts);
    if(this.posts.length < this.columnList.length){  
      let len = this.posts.length;
 
      for(let i = len; i <= len+20; i++){
        this.posts.push(this.columnList[i]);
      }
    }
  }

  add(event: MatChipInputEvent, element): void {
    const input = event.input;
    const value = event.value;
    console.log(input.value)
    console.log(event.input)
    console.log(event.value)
    if ((value || '').trim()) {
      var index  = this.dataSource.data.indexOf(element);
      if(this.dataSource.data[index]["allowed2"].length > 1){
        this.dataSource.data[index]["allowed2"].push(value.trim());
      }
      else {
        this.dataSource.data[index]["allowedValues"].push(value.trim());
      }
      this.dataSource._updateChangeSubscription(); 
    }
    console.log(this.allowedValues);
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(item, element): void {
    var indexElement  = this.dataSource.data.indexOf(element);
    if(this.dataSource.data[indexElement]["allowed2"].length > 1){
      var index = this.dataSource.data[indexElement]["allowed2"].indexOf(item);
      var value = "allowed2"
    }
    else{
      var index = this.dataSource.data[indexElement]["allowedValues"].indexOf(item);
      var value = "allowedValues"
    }

    if (index >= 0) {
      this.dataSource.data[indexElement][value].splice(index, 1);
      this.dataSource._updateChangeSubscription(); 
    }
  }

  removeRow(element){
    console.log(element)
    console.log(this.dataSource)
    console.log(this.dataSource.data.indexOf(element))
    console.log(this.dataSource.data)
    this.dataSource.data.splice(this.dataSource.data.indexOf(element), 1)
    this.dataSource._updateChangeSubscription(); 
    console.log(this.columnList)
    console.log(this.dataSource.data)
  }

  addRow(){
    this.dataSource.data.push({
      "name" : "",
      "userfriendlyName" : "",
      "allowedValues" : [],
      "allowed2": [],
      "dataType" : "",
      "type" : "None",
      "description" : "None",
      "min" : null,
      "max" : null,
      "important" : false
  });
  this.notifyService.notify('Row added in the bottom', 'success');
  this.dataSource._updateChangeSubscription(); 
  }

  turnInput(event){
    var className = event.target.className;
    console.log($(className + '.inputElement'));
    var inputText = $('.inputElement').innerHTML;
    console.log(inputText);
    this.item = "hi";
    $('.inputElement').replaceWith($('<input id="editableText" type="text" value={{item}} />'));
  }

  createGroup(){
    this.columnList.push({name: '', userfriendlyName: '', allowed2:[], type: 'Enum', allowedValues: [], description: 'None', min: null, max: null})
  }

  removeGroup(element){
    var elementIndex = this.columnList.indexOf(element);
    this.columnList.splice(elementIndex, 1);
  }

  GoBack(){
    this.closeGallery();
    this.saveTemp();
    this.advanceSelect = false;
    this.outputSelect = true;
  }

  save(){
    if(this.projectType != 'public'){
      console.log(this.columnList);
      console.log(this.dataSource.data);
      this.ioconfigEvent.emit({data: this.dataSource.data, event: 'save'});
      this.closeModal(false);
    }
    else{
      this.notifyService.notify('cannot save for public projects', 'danger');
    }
  }

  saveTemp(){
    this.dataSource.data[this.currentElementIndex].enums = this.enums;
    this.dataSource.data[this.currentElementIndex].enums.forEach(item =>{
      delete item["file"];
      delete item["src"];
      delete item["uploading"];
      delete item["uploadHideAndShow"];
    })
  }

  saveAdvance(){
    if(this.projectType != 'public'){
      this.saveTemp();
      this.save();
    }
    else{
      this.notifyService.notify('cannot save for public projects', 'danger');
    }
  }

  advanceSettings(element){
    console.log(element)
    this.advanceSelect = true;
    this.outputSelect = false;
    this.currentElementIndex = this.dataSource.data.indexOf(element);
    this.enums = [];
    console.log(this.dataSource.data[this.currentElementIndex].enums);
    
    if(element.allowed2.length > 1){
      if(this.dataSource.data[this.currentElementIndex].enums){
        for(let i=0; i<element.allowed2.length; i++){
          this.dataSource.data[this.currentElementIndex].enums.every(item => {
            if(element.allowedValues[i] == item.name){
              if(item.fileName){
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  item.src = `assets/images/outputServing/${item.fileName}`;
                  this.enums.push(item);
                  return false;
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, "get").subscribe(res =>{
                    console.log(res);
                    item.src = res.urls[0];
                    this.enums.push(item);
                    return false;
                  });
                }
              }
              else{
                this.enums.push({name: element.allowed2[i], src: '', width:'', height: '', ext:'', fileName: '', text: ''});
                return false;
              }
            }
            else{
              if(this.dataSource.data[this.currentElementIndex].enums.indexOf(item) == this.dataSource.data[this.currentElementIndex].enums.length-1){
                this.enums.push({name: element.allowed2[i], src: '', width:'', height: '', ext:'', fileName: '', text: ''});
              }
              return true;
            }
          })
        };
      }
      else{
        for(let i=0; i<element.allowed2.length; i++){
          this.enums.push({name: element.allowed2[i], src: '', width:'', height: '', ext:'', fileName: '', text: ''});
        }
      }
    }
    else if(element.allowedValues.length > 0){
      if(this.dataSource.data[this.currentElementIndex].enums){
        for(let i=0; i<element.allowedValues.length; i++){
          this.dataSource.data[this.currentElementIndex].enums.every(item => {
            if(element.allowedValues[i] == item.name){
              if(item.fileName){
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  item.src = `assets/images/outputServing/${item.fileName}`;
                  this.enums.push(item);
                  return false;
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, "get").subscribe(res =>{
                    console.log(res);
                    item.src = res.urls[0];
                    this.enums.push(item);
                    return false;
                  });
                }
              }
              else{
                this.enums.push({name: element.allowedValues[i], src: '', width:'', height: '', ext:'', fileName: ''});
                return false;
              }
            }
            else{
              if(this.dataSource.data[this.currentElementIndex].enums.indexOf(item) == this.dataSource.data[this.currentElementIndex].enums.length-1){
                this.enums.push({name: element.allowedValues[i], src: '', width:'', height: '', ext:'', fileName: ''});
              }
              return true;
            }
          })
        };
      }
      else{
        for(let i=0; i<element.allowedValues.length; i++){
          this.enums.push({name: element.allowedValues[i], src: '', width:'', height: '', ext:'', fileName: ''});
        }
      }
    }
    else{
      this.enums = [];
    }
  }

  onFileChange(event, item) {
    var itemIndex = this.enums.indexOf(item);
    const reader = new FileReader();
    console.log(event.target.result)
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = (e) => {
        console.log(e)
        
        console.log(reader)
        if(event.target.id == 'bgImage'){
          var img:any = new Image();
          img.src = reader.result;
          img.onload = () =>{
            this.bgimageWidth = img.width;
            this.bgimageHeight = img.height;
          }
          this.bgimageSrc = reader.result as string;
          this.bgimageName = event.target.files[0].name
          this.bgimageExt = event.target.files[0].name.split('.')[1]
        }
        else if(event.target.id == 'classImage'+ item.name){
          var img:any = new Image();
          img.src = reader.result;
          img.onload = () =>{
            this.enums[itemIndex]['width'] = img.width;
            this.enums[itemIndex]['height'] = img.height;
          }
          this.enums[itemIndex]['src'] = reader.result as string;
          this.enums[itemIndex]['file'] = event.target.files[0];
          this.enums[itemIndex]['fileName'] = event.target.files[0].name;
          this.enums[itemIndex]['ext'] = event.target.files[0].name.split('.')[1]
        }
      };
    }
  }

  uploadMessage(item){  
    item.uploadHideAndShow=true;  
    setTimeout(() => {    
      item.uploadHideAndShow=false;  
    }, 3000);    
  }

  uploadClassImage(item){
    item.uploading = true;
    var uploadImage = item['file'];
    var ctype = 'image/*;charset=utf-8';
    const blob: Blob = new Blob([uploadImage], {type: ctype} ); //;charset=utf-8
    var fileName = item['fileName'];
    
    this.fileService.getpresignedurls(fileName, "put", ctype).subscribe(res =>{
      console.log(res); 
      if(res.success){
        const fileuploadurl = res.urls[0];
        this.fileService.uploadfileAWSS3(fileuploadurl, blob).subscribe(data => {
          console.log(data);
        }, err => {
          this.notifyService.notify('File(s) upload failed: ${err}', 'danger');
          console.log(err);
        },
        () => {
          item.uploading = false;
          this.uploadMessage(item);
          this.notifyService.notify('image uploaded successfully', 'success');
      });
      }
      else {
        this.notifyService.notify(res.msg, 'danger');
      }
    });
  }

  closemodal(){
    console.log(this.columnListTemp);
    this.ioconfigEvent.emit({data: this.columnListTemp, event: 'close'});
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
        element.minmaxdigits = false;
        this.minmax = false;
      }
      else if(parseFloat(minimum) >= parseFloat(maximum)){
        console.log(parseFloat(minimum));
        console.log(parseFloat(maximum));
        element.minmaxerror = true;
        element.minmaxabsense = false;
        element.minmaxdigits = false;
        this.minmax = false;
        
      }
      else if((minimum.split('.')[1] || maximum.split('.')[1]) && !(minimum.split('.')[1] && maximum.split('.')[1])){
        console.log("one decimal missing")
        element.minmaxdigits = true;
        element.minmaxerror = false;
        element.minmaxabsense = false;
        this.minmax = false;
      }
      else if(minimum.split('.')[1] && maximum.split('.')[1]){
        console.log("both decimal");
        element.minmaxerror = false;
        element.minmaxabsense = false;
        element.minmaxdigits = false;
        this.minmax = true;
        if(minimum.split('.')[1].length !== maximum.split('.')[1].length){
          console.log("unequal decimal");
          console.log(minimum.split('.')[1].length);
          console.log(maximum.split('.')[1].length);
          element.minmaxdigits = true;
          element.minmaxerror = false;
          element.minmaxabsense = false;
          this.minmax = false;
        }
      }
      else{
        element.minmaxerror = false;
        element.minmaxabsense = false;
        element.minmaxdigits = false;
        this.minmax = true;
      }
    }
    else{
      element.minmaxerror = false;
      element.minmaxabsense = false;
      element.minmaxdigits = false;
      this.minmax = true;
    }
  }

  gallery(item){
    this.enumIndex = this.enums.indexOf(item);
    var x = document.getElementById("clouderizerGallery");
    x.className = "col-sm-12 row show";
  }

  galleryImageClick(event){
    this.gallerySrc = event.target.src;
    console.log(this.gallerySrc);
    this.enums[this.enumIndex].src = this.gallerySrc;
    this.enums[this.enumIndex].height = '350';
    this.enums[this.enumIndex].width = '1920';
    this.enums[this.enumIndex].ext = 'svg';
    this.enums[this.enumIndex].fileName = this.gallerySrc.split('/')[this.gallerySrc.split('/').length-1];
    var x = document.getElementById("clouderizerGallery");
    x.className = x.className.replace("col-sm-12 row show", "col-sm-12 row");
  }

  closeGallery(){
    var x = document.getElementById("clouderizerGallery");
    x.className = "col-sm-12 row";
  }
}
