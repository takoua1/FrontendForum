import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnologieComponent } from './technologie.component';

describe('TechnologieComponent', () => {
  let component: TechnologieComponent;
  let fixture: ComponentFixture<TechnologieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnologieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnologieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
