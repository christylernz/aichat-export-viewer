import { LightningElement, api } from 'lwc';

export default class Greeting extends LightningElement {
    @api name = '';
    myArray = ['a', 'b', 'c', 'd', 'e'];
    handleClick(event) {
        this.name = "Chris";
    }
}