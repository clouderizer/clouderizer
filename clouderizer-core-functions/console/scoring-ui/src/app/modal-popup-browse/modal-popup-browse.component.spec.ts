import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPopupBrowseComponent } from './modal-popup-browse.component';

describe('ModalPopupBrowseComponent', () => {
  let component: ModalPopupBrowseComponent;
  let fixture: ComponentFixture<ModalPopupBrowseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalPopupBrowseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalPopupBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
