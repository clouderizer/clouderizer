import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewServingComponent } from './new-serving.component';

describe('NewServingComponent', () => {
  let component: NewServingComponent;
  let fixture: ComponentFixture<NewServingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewServingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewServingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
