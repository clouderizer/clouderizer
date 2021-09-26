import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavheaderComponent } from './navheader.component';

describe('NavheaderComponent', () => {
  let component: NavheaderComponent;
  let fixture: ComponentFixture<NavheaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavheaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavheaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
