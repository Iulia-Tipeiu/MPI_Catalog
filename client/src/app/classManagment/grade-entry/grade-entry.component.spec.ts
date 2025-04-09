import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeEntryComponent } from './grade-entry.component';

describe('GradeEntryComponent', () => {
  let component: GradeEntryComponent;
  let fixture: ComponentFixture<GradeEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
