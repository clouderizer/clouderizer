import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudSettingsComponent } from './cloud-settings.component';

describe('CloudSettingsComponent', () => {
  let component: CloudSettingsComponent;
  let fixture: ComponentFixture<CloudSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
