//TODO: REMOVED TILE COUNT, CURRENTLY HARDCODING TILE COUNT TO 128. FIX THIS 
//      LATER. ALSO THERE IS A BUNCH OF HARDCODED VALUES WITHIN THE TILED 
//      DATA. MIGHT BE WORTH TO SEE HOW MAKE IT MORE DYNAMIC. IF NEED BE.
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./UNITTEST.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
import { generateHeatmaps } from "./Evals/Visualization";
import { pathfinding } from "./pathfinding";

const height = 10;
const width = 10;
let tileRules = {}
let itemRules = {}
let tilemapData = {
    h : height,
    w : width,
    tileRules : tileRules,
    itemRules : itemRules,
    tilesetInfo : testjson
}
// TODO: ... what can I say. This is bad... and maybe needs something else in
//      in here.
let wfc = undefined;

// Feature mapping of tiles to their horror low level feature.
// TODO: Make sure that tiles without anything come back as traverseable as 
//  well. So, tiles are being drawn and their features aren't being accounted
// for. Maybe we make this into it's own object?
let featureMapping = {
    1 : ["T"],
    2 : ["T"],
    3 : ["T"],
    4 : [],
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


// Good lord, the partial is a weird boy. So, set a tile to false if WFC should
// solve for that tile.
// Else put the tile number into the index. Note the tile number doesn't match
// the tile number within the JSON. And that's because WFC does an internal
//remapping of IDS... which causes this offset. To figure out the correct tile
//number, put a random tile in, and search around until the correct tile is 
// found :)
let partial = null;
let partialFlag = true;
let shouldDrawPath = false;
if (partialFlag) {
    partial = [
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 
        [10, 10, 10, 12, 12, 12, 12, 12, 12, 10], 
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 
        [10, 15, 10, 10, 10, 12, 12, 12, 12, 10], 
        [10, 10, 15, 15, 10, 10, 10, 10, 10, 10], 
        [10, 12, 10, 10, 10, 12, 12, 12, 12, 10], 
        [10, 12, 10, 12, 10, 10, 10, 10, 10, 10], 
        [10, 12, 12, 12, 10, 12, 12, 12, 12, 10], 
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 
    ];
} else {
    partial = null;
}

let loopCount = 1;
let paths = false;
let heatmaps = null;
let features = null; 
while ((wfc === undefined || paths === false) && loopCount < 100) {
    console.log("in loop");
    try {
        wfc = WFC(0, tilemapData, partial); 
        console.log(wfc);
        if (wfc.length === 0) {
            wfc = undefined;
        }
    } catch (error) {
        console.log(error);
        wfc = undefined;
    }
    // TODO: Really, just figure out if WFC should be a flattened array or not.
    let lowLevelFeatureMap = Array.from(Array(width), () => new Array(height));
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let tile = wfc.tiles[j+(i*10)];
            lowLevelFeatureMap[i][j] = featureMapping[tile.name];
        }
    }
    //TODO: Yeah so the above code is horrible. Either flatten everything down to
    //      an array. OR just turn everything into a matrix.
    features = detectFeatures(lowLevelFeatureMap, 10, 10);
    // console.log(features.ac);
    // console.log(features.lv);
    // console.log(features.js);
    // console.log(features.iso);
    heatmaps = generateHeatmaps(features, 10, 10);
    // console.log(heatmaps.ac);
    // console.log(heatmaps.lv);
    // console.log(heatmaps.js);
    // console.log(heatmaps.iso);
    let combinedFeatureMap = combineFeatures(features);
    let tilemapEval = evaluateHorrorPotential(combinedFeatureMap, 10, 10, 
        "slasher");
    let start = {
        x : 0,
        y : 0
    };
    let goal = {
        x : 9,
        y : 9
    };
    paths = pathfinding(combinedFeatureMap, start, goal);
    console.log(lowLevelFeatureMap);
    console.log(tilemapEval);
    loopCount++;
}







function combineFeatures(features) {
    let horrorFeatures = [];
    for (let i = 0; i < features.iso.length; i++) 
    {
        let tempArray = new Array(features.iso[i]);
        for (let j = 0; j < features.iso[i].length; j++) 
        {
            tempArray[j] = []
            tempArray[j] = tempArray[j].concat(features.iso[i][j], 
                features.ac[i][j], features.js[i][j], features.lv[i][j],
                features.t[i][j]);
        }
        horrorFeatures.push(tempArray)
    }
    return horrorFeatures
}

// CANVAS CODE TODO: BREAK THIS OUT INTO ITS OWN JS FILE IF WORK.
// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
// Good good stuff.

const canvasList = document.getElementsByTagName('canvas');

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
    if (shouldDrawPath) {
        for (let i = 0; i < paths.length; i++) {
            DrawPath(paths[i], i);
        }
    }
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
                // THIS DRAWS ALL THE NIGHTMARE WALKABLE TILES.
                tileCtx.drawImage(tileSet, (16 % atlasCol) * tileSize, 
                Math.floor(16/atlasCol) * tileSize, tileSize, tileSize, 
                destinationX, destinationY, updatedTileSize, updatedTileSize);
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

function DrawPath(path, pathOffset) {
    if (path.length === 0) { return; }
    tileCtx.strokeStyle = ['rgb(225, 0, 0)','rgb(0, 225, 0)',
        'rgb(0, 0, 225)', 'rgb(225, 225, 0)', 'rgb(225, 0, 225)'][pathOffset]
    tileCtx.beginPath();
    tileCtx.lineWidth = 5;
    let offset = 2;
    tileCtx.moveTo((path[0].x + 1) * updatedTileSize * 1.5, 
        (path[0].y + 1) * updatedTileSize * 1.5);
    for (let i = 1; i < path.length; i++) {
        if (i == path.length-1) { pathOffset = 0; }
        let tile = path[i];
        // TODO: THE ONE IS AN OFFSET BECAUSE OF THE TRIM.
        let x = (tile.x + 1) * tileSize;
        let y = (tile.y + 1) * tileSize;
        tileCtx.lineTo(y * tileOutputSize + updatedTileSize/2 - (5*pathOffset),
            x * tileOutputSize + updatedTileSize/2 + (5*pathOffset));
        tileCtx.stroke();   
    }
}
// Adding in buttons for heatmap toggling.
let heatmapNames = ["Ambient Creep", "Low Visibility", "Jumpscare", "Isolation"]
let btnDiv = document.getElementById("btnDiv")
let rgbs = ['rgb(0, 225, 0)',
        'rgb(0, 0, 225)', 'rgb(225, 225, 0)', 'rgb(225, 0, 225)'];
for (let i = 0; i < heatmapNames.length; i++) {
    let btn = document.createElement("button");
    let heatmapStyle = heatmapCanvases[i].style;
    btn.innerHTML = heatmapNames[i];
    btn.style.position = "relative";
    btn.style.backgroundColor = rgbs[i];
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

