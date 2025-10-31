import { createElement } from "lwc";
import Greeting from "example/greeting";

describe('example-greeting', () => {
    afterEach(() => {
        // Clean up the DOM after each test handling shadow DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    //Check that the component renders correctly
    it('displays greeting message', () => {
        const element = createElement('example-greeting', {
            is: Greeting
        });

        //Add it to the test DOM
        document.body.appendChild(element);
        
        const divClass = element.shadowRoot.querySelector('.greeting');
        expect(divClass).not.toBeNull();
        expect(divClass.textContent).toBe('Hello, Its Me!');

        const divId = element.shadowRoot.querySelector('[data-id="greetingmessage"]');
        expect(divId).not.toBeNull();
        expect(divId.textContent).toBe('Hello, Its Me!');
    });
     it('has only one greeting component', () => {
        const element = createElement('example-greeting', {
            is: Greeting
        });
        document.body.appendChild(element);

        // Query all example-greeting elements in the DOM
        const greetingElements = document.body.querySelectorAll('example-greeting');
        expect(greetingElements.length).toBe(1);
    });
});