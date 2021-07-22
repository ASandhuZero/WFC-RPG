//TODO: REMOVED TILE COUNT, CURRENTLY HARDCODING TILE COUNT TO 128. FIX THIS 
//      LATER. ALSO THERE IS A BUNCH OF HARDCODED VALUES WITHIN THE TILED 
//      DATA. MIGHT BE WORTH TO SEE HOW MAKE IT MORE DYNAMIC. IF NEED BE.
//   ALSO LOL, ADD BACK IN THE ITEM FUNCTIONALITY WITHIN THE TILED DATA.
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./UNITTEST.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
import { generateHeatmaps } from "./Evals/Visualization";
import { hasData } from "jquery";

// This is the lifted WFC running code. Placing it here to know what I need
//      For the function call.
// this.model = WFC(this.periodic, this.height, this.width, this.tileJSON, 
//     this.tile_rule, this.item_rule); 


const height = 10;
const width = 10;
let tile_rules = {}
let item_rules = {}
let tilemap_data = {
    h : height,
    w : width,
    tile_rules : tile_rules,
    item_rules : item_rules,
    tileset_info : testjson
}
// TODO: ... what can I say. This is bad... and maybe needs something else in
//      in here.
let wfc = undefined
let loop_count = 0;
while (wfc === undefined && loop_count < 100) {
    console.log("in loop");
    try {
        wfc = WFC(0, tilemap_data); 
        console.log(wfc);
        if (wfc.length === 0) {
            wfc = undefined;
        }
    } catch (error) {
        console.log(error);
        wfc = undefined;
    }
    loop_count++;
}
// Feature mapping of tiles to their horror low level feature.
let feature_mapping = {
    1 : ["T"],
    2 : ["T"],
    3 : ["T"],
    4 : ["T"],
    6 : ["T"],
    7 : ["T"], 
    8 : ["T"],
    9 : ["T"],
    10 : ["AC", "LV"],
    11 : ["AC", "LV"],
    12 : ["AC", "LV"],
    13 : ["AC", "LV"],
    14 : ["AC", "LV"],
    15 : ["T"],
    16 : ["T"],
    17 : ["T"],
    18 : ["T"],
    19 : ["AC", "LV"],
    20 : ["AC", "LV"],
    21 : ["AC", "LV"],
    22 : ["AC", "LV"],
    24 : ["T"],
    25 : ["T"],
    26 : ["T"],
    27 : ["T"],
    28 : ["AC", "T"],
    29 : ["AC", "T"],
    30 : ["AC", "T"],
    31 : ["AC", "T"],
    37 : [],
    38 : [],
    39 : []
}

// TODO: Really, just figure out if WFC should be a flattened array or not.
let feature_map = Array.from(Array(width), () => new Array(height));
let col = 0;
for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
        let tile = wfc.tiles[j+(i*10)];
        let tile_feature = feature_mapping[tile.name];
        feature_map[i][j] = tile_feature;
    }
}
console.log(feature_map);
//TODO: Yeah so the above code is horrible. Either flatten everything down to
//      an array. OR just turn everything into a matrix.
let features = detectFeatures(feature_map, 10, 10);
// console.log(features.ac);
// console.log(features.lv);
// console.log(features.js);
// console.log(features.iso);
let heatmaps = generateHeatmaps(features, 10, 10);
console.log(heatmaps.ac);
console.log(heatmaps.lv);
console.log(heatmaps.js);
console.log(heatmaps.iso);
// let tilemapEval = evaluateHorrorPotential(features, 10, 10, "slasher");
// console.log(tilemapEval);


// CANVAS CODE TODO: BREAK THIS OUT INTO ITS OWN JS FILE IF WORK.
// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
// Good good stuff.

const canvasList = document.getElementsByTagName('canvas');

const tilemap_canvas = canvasList[0];
const heatmapCanvases = []
const ctxList = [];
const tileCtx = canvasList[0].getContext('2d');
// Offsetting i because ctxList is already set to tileCtx.
for (let i = 1; i < 5; i++) {
    ctxList.push(canvasList[i].getContext('2d'));
    heatmapCanvases.push(canvasList[i]);
}
let srgbs = []


const tileSet = new Image();
tileSet.src = './assets/tilesets/graveyard.png';
tileSet.onload = draw;

let tileSize = 16;
let tileOutputSize = 4; // can set to 1 for 32px or higher
let updatedTileSize = tileSize * tileOutputSize - 1; // this -1 is offsetting everything and giving that cool grid look.

let atlasCol = 9;
let atlasRow = 8;
let mapCols = 11;
let mapRows = 11;
let mapHeight = mapRows * tileSize;
let mapWidth = mapCols * tileSize
let levelMap = wfc.tiles;
let mapIndex = 0;
let sourceX = 0;
let sourceY = 0;


function draw() {
    DrawTileMap();
}

function DrawTileMap() {
    // Going to have to update all canvases right here.
    for (let i = 0; i < canvasList.length; i++) {
        canvasList[i].width = mapWidth * (1 + tileOutputSize);
        canvasList[i].height = mapHeight * (1 + tileOutputSize);

    }
    let destinationX = 0;
    let destinationY = 0;
    let tile = {};
    let tileVal = "";
    let tileRot = "";
    srgbs = [];
    // Sigh... This offsetting, with tileSize, is to ensure the interior of the map gets properly drawn.
    for (let col = tileSize; col < mapHeight; col += tileSize) {
        for (let row = tileSize; row < mapWidth; row += tileSize) {
            tile = levelMap[mapIndex];
            tileVal = tile.name;
            tileRot = tile.rotation;
            rotation = (90 * tileRot)* Math.PI / 180;
            if(tileVal !=0) {
                tileVal -= 1;
                sourceX = (tileVal % atlasCol) * tileSize;
                sourceY = Math.floor(tileVal/atlasCol) * tileSize;
                destinationX = row * tileOutputSize;
                destinationY = col * tileOutputSize;
                // Rotates canvsas. Rotating at the location of the tile. And then trasnlating the rotation back to the (0,0)
                tileCtx.translate(destinationX, destinationY);
                tileCtx.rotate(rotation);
                tileCtx.translate(-(destinationX), -(destinationY));
                // Adjusting rotation offset. ctx.rotate does not rotate at center, but at the top-left corner of the image. Hence the offseting.
                if (tileRot === "1") {
                    destinationY = destinationY - updatedTileSize;
                } else if (tileRot === "2") {
                    destinationY = destinationY - updatedTileSize;
                    destinationX = destinationX - updatedTileSize;
                } else if (tileRot === "3") {
                    destinationX = destinationX - updatedTileSize;
                }
                // Actual drawing of the tilemap right here.
                tileCtx.drawImage(tileSet, sourceX, sourceY, tileSize,
                    tileSize, destinationX, destinationY,
                    updatedTileSize, updatedTileSize);
                tileCtx.setTransform(1, 0, 0, 1, 0, 0);
                
                // DEBUGGING CODE FOR TILE NAME TODO: REMOVE AT SOME POINT.
                tileCtx.font = '24px serif';
                tileCtx.fillStyle = "#ff0000";
                tileCtx.fillText(tile.name, 
                    (((row+1) * tileOutputSize-10) + (updatedTileSize/2)),
                    (((col+1) * tileOutputSize) + (updatedTileSize/2)));
                // THE ABOVE IS CODE TO REMOVE.
                // TODO: Please figure out a standard for matrix (row by column or column by row), for the love of GOD.
                //TODO: THIS IS ONLY FOR AC. NEEDS TO DO ALL OF THE HEATMAPS.
                // Also hardcoding an index call like this is weird... stop it.
                srgbs[0] = heatmaps.ac.output[(col / 16)-1][(row / 16)-1].srgb;
                srgbs[1] = heatmaps.lv.output[(col / 16)-1][(row / 16)-1].srgb;
                srgbs[2] = heatmaps.js.output[(col / 16)-1][(row / 16)-1].srgb;
                srgbs[3] = heatmaps.iso.output[(col / 16)-1][(row / 16)-1].srgb;
                for (let i = 0; i < 4; i++) {
                    ctxList[i].fillStyle = 'rgba(' + 255 * srgbs[i].red + ', '
                    + 255 * srgbs[i].green + ', ' + 255 * srgbs[i].blue + 
                    ', 0.5)';
                    //TODO: Decide if ctxList should contain the tilemap 
                    // renderer as well.
                    ctxList[i].fillRect(row * tileOutputSize, 
                        col * tileOutputSize, updatedTileSize, updatedTileSize);
                }
            }
            mapIndex ++;
        }
    }
    // .. a hardcoded nightmare for the tilemap trim tile.
    tileCtx.drawImage(tileSet, (5 % atlasCol) * tileSize, 
        Math.floor(5/atlasCol) * tileSize, tileSize, tileSize, 0, 0, 
        updatedTileSize, updatedTileSize);

    tileCtx.drawImage(tileSet, (23 % atlasCol) * tileSize, 
        Math.floor(23/atlasCol) * tileSize, tileSize, tileSize, 0, 
        mapHeight * tileOutputSize, updatedTileSize, updatedTileSize);

    tileCtx.drawImage(tileSet, (8 % atlasCol) * tileSize, 
        Math.floor(8/atlasCol) * tileSize, tileSize, tileSize, 
        mapWidth * tileOutputSize, 0, updatedTileSize, updatedTileSize);

    tileCtx.drawImage(tileSet, (25 % atlasCol) * tileSize, 
        Math.floor(25/atlasCol) * tileSize, tileSize, tileSize, 
        (mapWidth-tileSize) * tileOutputSize, mapHeight * tileOutputSize, 
        updatedTileSize, updatedTileSize);

    tileCtx.drawImage(tileSet, (7 % atlasCol) * tileSize, 
        Math.floor(7/atlasCol) * tileSize, tileSize, tileSize, 
        (mapWidth-tileSize) * tileOutputSize, 0, 
        updatedTileSize, updatedTileSize);

    tileCtx.drawImage(tileSet, (26 % atlasCol) * tileSize, 
        Math.floor(26/atlasCol) * tileSize, tileSize, tileSize, 
        mapWidth * tileOutputSize, mapHeight * tileOutputSize, 
        updatedTileSize, updatedTileSize);

    for (let col = tileSize; col < mapHeight; col += tileSize) {
        tileCtx.drawImage(tileSet, (14 % atlasCol) * tileSize, 
            Math.floor(14/atlasCol) * tileSize, tileSize, tileSize, 0, 
            col * tileOutputSize, updatedTileSize, updatedTileSize);
        tileCtx.drawImage(tileSet, (17 % atlasCol) * tileSize, 
            Math.floor(17/atlasCol) * tileSize, tileSize, tileSize, 
            mapWidth * tileOutputSize, col * tileOutputSize, updatedTileSize, 
            updatedTileSize);
    }
    for (let row = tileSize ; row < mapHeight - tileSize; row += tileSize) {
        tileCtx.drawImage(tileSet, (6 % atlasCol) * tileSize, 
            Math.floor(6/atlasCol) * tileSize, tileSize, tileSize, 
            row * tileOutputSize, 0, updatedTileSize, updatedTileSize);
        tileCtx.drawImage(tileSet, (24 % atlasCol) * tileSize, 
            Math.floor(24/atlasCol) * tileSize, tileSize, tileSize, 
            row * tileOutputSize, mapHeight * tileOutputSize, updatedTileSize, 
            updatedTileSize);
    }
}
// Adding in buttons for heatmap toggling.
let heatmapNames = ["Ambient Creep", "Low Visibility", "Jumpscare", "Isolation"]
let btnDiv = document.getElementById("btnDiv")
for (let i = 0; i < heatmapNames.length; i++) {
    let btn = document.createElement("button");
    let heatmapStyle = heatmapCanvases[i].style;
    btn.innerHTML = heatmapNames[i];
    btn.style.position = "relative";
    btn.style.top = (mapHeight * tileOutputSize) + updatedTileSize;
    btn.addEventListener("click", function () {
        if (heatmapStyle.display === "none") {
            heatmapStyle.display = "block";
        } else {
            heatmapStyle.display = "none"
        }
    });
    heatmapStyle.display = "none";
    btnDiv.appendChild(btn);
}

