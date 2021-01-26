import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoUrlComponent } from './logo-url.component';

describe('LogoUrlComponent', () => {
  let component: LogoUrlComponent;
  let fixture: ComponentFixture<LogoUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogoUrlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
