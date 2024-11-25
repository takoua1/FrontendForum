import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPosteComponent } from './detail-poste.component';

describe('DetailPosteComponent', () => {
  let component: DetailPosteComponent;
  let fixture: ComponentFixture<DetailPosteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPosteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetailPosteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
