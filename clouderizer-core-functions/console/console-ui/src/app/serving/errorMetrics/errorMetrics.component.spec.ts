import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { errorMetricsComponent } from './errorMetrics.component';

describe('PopupMoredetailsComponent', () => {
  let component: errorMetricsComponent;
  let fixture: ComponentFixture<errorMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ errorMetricsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(errorMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
