import {
  TestBed
} from '@angular/core/testing';

import {
  App
} from './app';


/**
 * Verifies the basic creation and rendered output of the root application component.
 */
describe('App', () => {

  /**
   * Creates a fresh testing module before each test to prevent state
   * from previous test cases from affecting the current fixture.
   */
  beforeEach(async () => {

    await TestBed
      .configureTestingModule({
        imports: [App],
      })
      .compileComponents();

  });


  /**
   * Ensures that Angular can instantiate the root component successfully.
   */
  it('should create the app', () => {

    const fixture =
      TestBed.createComponent(App);

    const app =
      fixture.componentInstance;

    expect(app).toBeTruthy();

  });


  /**
   * Verifies that the expected application heading is present
   * after the component has completed its initial rendering.
   */
  it('should render title', async () => {

    const fixture =
      TestBed.createComponent(App);

    await fixture.whenStable();

    const compiled =
      fixture.nativeElement as HTMLElement;

    expect(
      compiled
        .querySelector('h1')
        ?.textContent
    ).toContain(
      'Hello, Frontend'
    );

  });

});
