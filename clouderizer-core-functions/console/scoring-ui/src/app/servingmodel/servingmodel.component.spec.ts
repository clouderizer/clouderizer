import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServingmodelComponent } from './servingmodel.component';

describe('ServingmodelComponent', () => {
  let component: ServingmodelComponent;
  let fixture: ComponentFixture<ServingmodelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServingmodelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServingmodelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
