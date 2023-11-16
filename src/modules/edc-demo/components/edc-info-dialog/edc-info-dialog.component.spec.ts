import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdcInfoDialogComponent } from './edc-info-dialog.component';

describe('EdcInfoDialogComponent', () => {
  let component: EdcInfoDialogComponent;
  let fixture: ComponentFixture<EdcInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EdcInfoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdcInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
