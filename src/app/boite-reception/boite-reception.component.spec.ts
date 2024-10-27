import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoiteReceptionComponent } from './boite-reception.component';

describe('BoiteReceptionComponent', () => {
  let component: BoiteReceptionComponent;
  let fixture: ComponentFixture<BoiteReceptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoiteReceptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoiteReceptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
