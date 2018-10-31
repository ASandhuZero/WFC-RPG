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

var wfcController = new Controller('Phaser',test_json);
wfcController.displayView();
console.log(wfcController);


var numButton = document.getElementById("numButton");
numButton.addEventListener("click", function(){
    // tileNum = +document.getElementById("tileNumInput").value;
    var wfcController = new Controller('Phaser',test_json);
    wfcController.displayView();
});