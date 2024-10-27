import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusiqueComponent } from './musique.component';

describe('MusiqueComponent', () => {
  let component: MusiqueComponent;
  let fixture: ComponentFixture<MusiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusiqueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MusiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
