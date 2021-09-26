import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
    //moduleId: module.id,
    selector: 'button-select',
    template: `<div class="btn-group selectbtn">
                    <button *ngFor="let choice of choices" 
                    type="button" class="btn btn-default" 
                    (click)="choose(choice)" [ngClass]="{ 'active' : choice === active }">
                    {{ choice }}</button>
                </div>`
})

export class ButtonSelectComponent implements OnInit {
    @Input() choices: string[];
    @Input() defaultChoice: string;
    @Input() groupName: string;
    @Input() value: string;

    @Output() valueChosen: EventEmitter<any> = new EventEmitter();

    public active: string;

    ngOnInit() {
        this.active = this.defaultChoice;
        this.choose(this.defaultChoice);
    }

    public choose(value: string) {
        this.valueChosen.emit(value);
        this.active = value;
    }
}