import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupMoredetailsComponent } from './popup-moredetails.component';

describe('PopupMoredetailsComponent', () => {
  let component: PopupMoredetailsComponent;
  let fixture: ComponentFixture<PopupMoredetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupMoredetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupMoredetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
