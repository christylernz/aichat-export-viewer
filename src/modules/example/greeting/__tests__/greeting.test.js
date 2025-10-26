import { createElement } from "lwc";
import Greeting from "example/greeting";

describe('example-greeting', () => {
    //Check that the component renders correctly
    it('displays greeting message', () => {
        // Arrange create the component
        const element = createElement('example-greeting', {
            is: Greeting
        });

        //Add it to the test DOM
        document.body.appendChild(element);
        
        // Act - query the div element
        const div = element.shadowRoot.querySelector('.greeting');
        
        // Assert - check that the div contains the correct greeting message
        expect(div.textContent).toBe('Hello, Its Me!');
    });
});