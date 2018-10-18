import {WFC} from '../WaveFunctionCollapse/WFC.js'


let height = 4;
let width = 4;
let WFCTest = new WFC(false, height, width, test_json);

if (WFCTest.length != height * width) {
    console.log("work");
    
}
console.log(WFCTest);
