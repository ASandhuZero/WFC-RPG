//TODO: REMOVED TILE COUNT, CURRENTLY HARDCODING TILE COUNT TO 128. FIX THIS 
//      LATER. ALSO THERE IS A BUNCH OF HARDCODED VALUES WITHIN THE TILED 
//      DATA. MIGHT BE WORTH TO SEE HOW MAKE IT MORE DYNAMIC. IF NEED BE.
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./UNITTEST.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
import { generateHeatmaps } from "./Evals/Visualization";
import { pathfinding } from "./pathfinding";
import { Draw } from "./View";

const height = 20;
const width = 20;



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
    10 : ["AC"],
    11 : ["AC", "LV"],
    12 : ["AC"],
    13 : ["AC", "LV"],
    14 : ["AC", "LV"],
    15 : ["T"],
    16 : ["AC"],
    17 : ["T"],
    18 : ["T"],
    19 : ["AC"],
    20 : ["AC", "LV"],
    21 : ["AC"],
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
    39 : [],
    41 : [],
    45 : [],
    50 : [],
    54 : [],
    59 : [],
    60 : [],
    61 : []
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
let testPaths = false;
let strict = false;
let banList = [19,20,21,22,23,24,25];
let shouldGenerateNeighbors = true;
if (partialFlag) {
    let partials = 
    [
        // [
        //     [19,24,24,24,24,24,24,20],
        //     [21,10,-1,-1,-1,-1,10,22],
        //     [21,10,-1,-1,-1,-1,10,22],
        //     [21,10,-1,-1,-1,-1,10,22]
        // ], 
        [
            [12,10,12,10,12],
            [12,10,12,10,12],
            [12,10,12,10,12]
        ],
        [
            [12,10,12],
            [12,-1,12],
        ],
        [
            [19,24,24,24,24,24,20],
            [21,12,10,12,10,12,22],
            [21,12,10,12,10,12,22],
            [21,12,10,12,10,12,22]
        ], 
    ];
    partial = generatePartial(partials, width, height);
} else {
    partial = null;
}
function generatePartial(partials, w, h) {
    let partialMap = new Array(w);
    for (let i = 0; i < w; i++) {
        partialMap[i] = new Array(h).fill(false);
    }
    let partialPass = 0;
    // partials is a tensor. First degree indicies are the partials.
    while (partialPass < 2) {
        partialPass++;
        for (let i = 0; i < partials.length; i++) {
            if (Math.floor(Math.random()*10) > 5) { continue; }
            let randI, randJ;
            randI = Math.floor(Math.random() * w);
            randJ = Math.floor(Math.random() * h);
            let randJReset = randJ;
            let randIReset = randI;
            //First check if partial can fit...
            let partial = partials[i];
            if (partial.length > w) { continue; }
            let count = 0;
            let allPartial = 0;
            //Check to see if the partial can fit...
            for (let j = 0; j < partial.length; j++) {
                let partialArr = partial[j];
                if (partialArr.length > h) { continue; }
                for (let k = 0; k < partialArr.length; k++) {
                    if (!partialMap[randI][randJ]) { count++; }
                    allPartial++;
                    randJ++;
                    //TODO: This is for the wrapping of the paritals... might want
                    // to turn it back on later.
                    // if (randJ >= h) { randJ = 0;}
                    if (randJ >= h) { count++; }
                }
                // if (randI >= w) { randI = 0;}
                if (randI >= w) { continue; }
                randJ = randJReset; 
            }
            randI = randIReset;
            randJ = randJReset;
            // If it fits then place the tiles!
            if (count === allPartial) {
                for (let j = 0; j < partial.length; j++) {
                    let partialArr = partial[i];
                    for (let k = 0; k < partialArr.length; k++) {
                        partialMap[randI][randJ] = partialArr[k];
                        randJ++;
                        if (randJ >= h) { randJ = 0;}
                    }
                    randI++;
                    if (randI >= w) { randI = 0;}
                    randJ = randJReset; 
                }
            }
        }
    }
    for (let i = 0; i < partialMap.length; i++) {
        for (let j = 0; j < partialMap[i].length; j++) {
            if (partialMap[i][j] === -1) { partialMap[i][j] = false; }
        }
    }
    partialMap[0][0] = 10;
    partialMap[w-1][h-1] = 10;
    return partialMap;
}
let short = 0;
let psych = 0;
let slash = 0; 
let slasher = 0;
let psycho = 0;
let loopCount = 0;
let paths = false;
let heatmaps = null;
let features = null; 
while (wfc === undefined && loopCount < 10) {
    console.log("in loop");
    try {
        wfc = WFC(0, tilemapData, partial, strict, shouldGenerateNeighbors, banList); 
        if (wfc.length === 0) {
            wfc = undefined;
        }
    } catch (error) {
        console.log(error);
        wfc = undefined;
    }
    loopCount++;
}
console.log(wfc);
loopCount = 0;
while (paths === false && loopCount < 10) {
    // TODO: Really, just figure out if WFC should be a flattened array or not.
    let lowLevelFeatureMap = Array.from(Array(width), () => new Array(height));
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let tile = wfc.tiles[i][j];
            lowLevelFeatureMap[i][j] = featureMapping[tile.name];
        }
    }
    //TODO: Yeah so the above code is horrible. Either flatten everything down to
    //      an array. OR just turn everything into a matrix.
    features = detectFeatures(lowLevelFeatureMap, width, height);
    // console.log(features.ac);
    // console.log(features.lv);
    // console.log(features.js);
    // console.log(features.iso);
    let combinedFeatureMap = combineFeatures(features);
    heatmaps = generateHeatmaps(combinedFeatureMap, width, height);
    console.log(combinedFeatureMap);
    // console.log(heatmaps.ac);
    // console.log(heatmaps.lv);
    // console.log(heatmaps.js);
    // console.log(heatmaps.iso);
    let tilemapEval = evaluateHorrorPotential(combinedFeatureMap, width, height, 
        "slasher");
    let start = {
        x : 0,
        y : 0
    };
    let goal = {
        x : width - 1,
        y : height -1
    };
    paths = pathfinding(combinedFeatureMap, start, goal);
    console.log(lowLevelFeatureMap);
    console.log(tilemapEval);
    if (testPaths && paths) {
            if (paths[0].movesTaken > paths[2].movesTaken) { short++; }
            if (paths[0].slasherScore < paths[2].slasherScore ) { slash++; }
            if (paths[0].psychologicalScore < paths[2].psychologicalScore ) { psych++; }
            if (paths[3].slasherScore < paths[4].slasherScore ) { slasher++; }
            if (paths[4].psychologicalScore < paths[3].psychologicalScore ) { psycho++; }
        paths = false;
    }    
    loopCount++;
}
console.log("scaredy cat found shortest path:", short);
console.log("shortest path had less slasher scares:", slash);
console.log("shortest path had less psych scares:", psych);
console.log("Slasher had more psych scare:", psycho);
console.log("Psycho had more Slasher scare:", slasher);
// debugger;

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

// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
const tileSet = new Image();
tileSet.src = './assets/tilesets/graveyard.png';
tileSet.onload = drawAll;

let tileSize = 16;
let rescale = 3; // can set to 1 for 32px or higher

let atlasCol = 9;
let mapCols = width+1;
let mapRows = height+1;
let mapHeight = mapRows * tileSize;
let mapWidth = mapCols * tileSize
let levelMap = wfc.tiles;

function drawAll() {
    let canvasWidth = mapWidth * rescale;
    let canvasHeight = mapHeight * rescale;
    let canvases = document.getElementsByTagName('canvas');
    Draw(heatmaps, canvasWidth, canvasHeight, tileSize, rescale, tileSet, 
        atlasCol, levelMap, paths);
}
