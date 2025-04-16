import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentsDialogComponent } from './add-students-dialog.component';

describe('AddStudentsDialogComponent', () => {
  let component: AddStudentsDialogComponent;
  let fixture: ComponentFixture<AddStudentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStudentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
