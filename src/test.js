import {Controller} from './Controller/Controller'
import * as test_json from "./testJSON.json!json"

// Controller parameters: type, tileJSON, subset, newGame
var wfcController = new Controller('Phaser',test_json, "item", false, true, null,'distance', 2);
wfcController.displayView();

var numButton = document.getElementById("numButton");
numButton.addEventListener("click", function(){
    wfcController.updateView();
});

var exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", function(){
    wfcController.updateTileMap();
    var json_to_file = wfcController.getTile2DJSON();

    let a = document.createElement("a");
    let json_string = JSON.stringify(json_to_file, null, 4);
    let file = new Blob([json_string], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = 'testJson.json';
    a.click(); // wow what a terrible hack.
});

var updateButton = document.getElementById("updateButton");
updateButton.addEventListener("click", function(){
    wfcController.getTilesUpdated();
    wfcController.updateTileMap();
});

var updateButton = document.getElementById("itemToggle");
updateButton.addEventListener("click", function(){
    if (wfcController.includeItem == true) {
        wfcController.includeItem = false;
    } else {
        wfcController.includeItem = true;
    }
    wfcController.itemToggle();   
    
});