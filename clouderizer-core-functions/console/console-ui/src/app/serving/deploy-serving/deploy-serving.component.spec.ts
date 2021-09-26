import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployServingComponent } from './deploy-serving.component';

describe('DeployServingComponent', () => {
  let component: DeployServingComponent;
  let fixture: ComponentFixture<DeployServingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployServingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployServingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
