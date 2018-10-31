import {Controller} from './Controller/Controller'

var test_json = {
    tiles: [
        {name: 'tile_1', symmetry: '\\'},
        {name: 'tile_2', symmetry: 'L'},
        {name: 'tile_3', symmetry: 'X'}
    ],
    // Number after tile name is referring to rotation. 
    // 0 = 0 degree rotation, 1 = 90 degree rotation, 2 = 180 degree rotation,
    // 3 = 270 degree rotation.
    neighbors: [
        {left: 'tile_1 0', right: 'tile_2 0'},
        {left: 'tile_2 0', right: 'tile_3 0'},
        {left: 'tile_3 0', right: 'tile_1 1'}
    ]
}

var wfcController = new Controller('Phaser',test_json, false);
wfcController.displayView();
console.log(wfcController);

var numButton = document.getElementById("numButton");
numButton.addEventListener("click", function(){
    wfcController.updateView();
});

var exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", function(){
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
    let updates = wfcController.getTilesUpdated();
    console.log(updates);
});