import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { CV } from './cv/cv.data';

describe('App', () => {
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('renders the name as the page heading', () => {
    expect(compiled.querySelector('h1')?.textContent).toContain(CV.name);
  });

  it('renders one entry per experience and per education item', () => {
    const sections = compiled.querySelectorAll('section');
    expect(sections[0].querySelectorAll('.entry').length).toBe(CV.experiences.length);
    expect(sections[1].querySelectorAll('.entry').length).toBe(CV.education.length);
  });

  it('opens external links in a new tab without leaking the opener', () => {
    const link = compiled.querySelector<HTMLAnchorElement>('.links a');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
  });
});
