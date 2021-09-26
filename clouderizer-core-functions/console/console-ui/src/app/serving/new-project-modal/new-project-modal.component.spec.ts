import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProjectModalComponent } from './new-project-modal.component';

describe('NewProjectModalComponent', () => {
  let component: NewProjectModalComponent;
  let fixture: ComponentFixture<NewProjectModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewProjectModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewProjectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
