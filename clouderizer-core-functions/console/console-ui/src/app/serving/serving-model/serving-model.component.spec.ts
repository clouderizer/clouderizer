import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServingModelComponent } from './serving-model.component';

describe('ServingModelComponent', () => {
  let component: ServingModelComponent;
  let fixture: ComponentFixture<ServingModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServingModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServingModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
