//TODO: REMOVED TILE COUNT, CURRENTLY HARDCODING TILE COUNT TO 128. FIX THIS 
//      LATER. ALSO THERE IS A BUNCH OF HARDCODED VALUES WITHIN THE TILED 
//      DATA. MIGHT BE WORTH TO SEE HOW MAKE IT MORE DYNAMIC. IF NEED BE.
// TODO: have some way to turn heatmaps on and off. like a flag or something
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./UNITTEST.json!json";
import * as partialsJSON from "./partials.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
// import { generateHeatmaps } from "./Evals/Visualization";
import { pathfinding } from "./pathfinding";
import { Draw } from "./View";
// import { Test }  from "./BitWFC"


// Test();
define(['require', 'fs', 'path'], function(require) {
    const fs = require('fs');
    const path = require('path');
})
const height = 20;
const width = 20;

let partialFlag = true;
let testPaths = false;
let save = false;
let strict = false;
let shouldGenerateNeighbors = true;
// TODO: This feels dumb... Why can't we just turn off a tile?
let banList = [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37];


let resultData = {
    "results" : []
}
let tileRules = {}
let itemRules = {}
let tilemapData = {
    h : height,
    w : width,
    tileRules : tileRules,
    itemRules : itemRules,
    tilesetInfo : testjson
}
let wfc = undefined;

// Feature mapping of tiles to their horror low level feature.
// TODO: Make sure that tiles without anything come back as traverseable as 
//  well. So, tiles are being drawn and their features aren't being accounted
// for. Maybe we make this into it's own object?
let featureMapping = {};
for (let i = 0; i < testjson.data.tiles_info.length; i++) {
    let tile = testjson.data.tiles_info[i];
    let name = tile.name;
    featureMapping[name] = tile.features;
}

// Good lord, the partial is a weird boy. So, set a tile to false if WFC should
// solve for that tile.
// Else put the tile number into the index. Note the tile number doesn't match
// the tile number within the JSON. And that's because WFC does an internal
//remapping of IDS... which causes this offset. To figure out the correct tile
//number, put a random tile in, and search around until the correct tile is 
// found :)
let partial = null;
let partials = partialsJSON.partials;
function generatePartial(partials, w, h) {
    let partialMap = new Array(w);
    for (let i = 0; i < w; i++) {
        partialMap[i] = new Array(h).fill(false);
    }
    let partialPass = 0;
    // partials is a tensor. First degree indicies are the partials.
    while (partialPass < 4) {
        partialPass++;
        for (let p = 0; p < partials.length; p++) {
            let partial = partials[p];
            if (Math.floor(Math.random()*10) > 6) { continue; }
            let longestPartialArr = 0;
            let randI, randJ;
            randI = Math.floor(Math.random() * (w - partial.length));
            for (let i = 0; i < partial.length; i++) {
                if (longestPartialArr < partial[i].length) {
                    longestPartialArr = partial[i].length;
                }
            }
            randJ = Math.floor(Math.random() * (h - longestPartialArr));
            let randRowReset = randI;
            let randColReset = randJ;
            let shouldContinue = false;
            let shouldDraw = false;
            if (partial.length >= w) { continue; }
            if (partial.length + randI >= w) { continue; }
            for (let i = 0; i < partial.length; i++) {
                let partialArr = partial[i];
                if (partialArr.length >= h) { shouldContinue = true; break;}
                //Checking for wrapping. Will break if too long.
                if (partialArr.length + randJ >= h) { shouldContinue = true; break;}
                for (let j = 0; j < partialArr.length; j++) {
                    if (partialMap[randI+i][randJ+j] !== false )  { shouldContinue = true; break;}
                }
            }
            if (shouldContinue) { continue; } 
            else { shouldDraw = true; }
            //First check if partial can fit...
            if (shouldDraw) {
                for (let i = 0; i < partial.length; i++) {
                    let partialArr = partial[i];
                    if (partialArr === undefined) { continue;}
                    for (let j = 0; j < partialArr.length; j++) {
                        partialMap[randI+i][randJ+j] = partialArr[j];
                    }
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
loopCount = 0;
while ((wfc=== undefined ||paths === false) && loopCount < 10) {
    console.log("in loop");
    if (partialFlag) {
        partial = generatePartial(partials, width, height);
    } else {
        partial = null;
    }
    try {
        
        wfc = WFC(0, tilemapData, partial, strict, shouldGenerateNeighbors, banList); 
        if (wfc.length === 0) {
            wfc = undefined;
        }
    } catch (error) {
        console.log(error);
        wfc = undefined;
    }
    let lowLevelFeatureMap = Array.from(Array(width), () => new Array(height));
    let tilemapToSave = Array.from(Array(width), () => new Array(height));
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let tile = wfc.tiles[i][j];
            tilemapToSave[i][j] = parseInt(wfc.tiles[i][j].name);
            lowLevelFeatureMap[i][j] = featureMapping[tile.name];
        }
    }
    features = detectFeatures(lowLevelFeatureMap, width, height);
    let combinedFeatureMap = combineFeatures(features);
    // heatmaps = generateHeatmaps(combinedFeatureMap, width, height);
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
    if (testPaths && save && paths) {
        if (paths[0].movesTaken > paths[2].movesTaken) { short++; }
        if (paths[0].slasherScore < paths[2].slasherScore ) { slash++; }
        if (paths[0].psychologicalScore < paths[2].psychologicalScore ) { psych++; }
        if (paths[3].slasherScore < paths[4].slasherScore ) { slasher++; }
        if (paths[4].psychologicalScore < paths[3].psychologicalScore ) { psycho++; }
        let pathsToSave = [];
        let short = {
            psychologicalScore : [],
            slasherScore : [],
            movesTaken : -1
        }
        let long= {
            psychologicalScore : [],
            slasherScore : [],
            movesTaken : -1
        }
        let scaredyCat = {
            psychologicalScore : [],
            slasherScore : [],
            movesTaken : -1
        }
        let slasherPrio= {
            psychologicalScore : [],
            slasherScore : [],
            movesTaken : -1
        }
        let psychologicalPrio = {
            psychologicalScore : [],
            slasherScore : [],
            movesTaken : -1
        }
        let pathNames = ["short", "long", "ScaredyCat", "Slasher Prio", "Psychological Prio"];
        let pathobj = [short, long, scaredyCat, slasherPrio, psychologicalPrio]

        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            let obj = pathobj[i];
            obj.psychologicalScore = path.psychologicalScore;
            obj.slasherScore = path.slasherScore;
            obj.movesTaken = path.movesTaken;
        }
        resultData.results.push(
            {
                short : short,
                long : long,
                scaredyCat : scaredyCat,
                slasherPrio : slasherPrio,
                psychologicalPrio : psychologicalPrio
            });
        if (loopCount%100===0) {
            writeResults(resultData, fs, path);
            resultData.results = [];
        }
        console.log("Results have been pushed!", loopCount);
        paths = false;
    }
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

// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
const tileSet = new Image();
tileSet.src = './assets/tilesets/graveyard.png';
tileSet.onload = drawAll;

let tileSize = 16;
let rescale = 2; // can set to 1 for 32px or higher

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
if (save) {
    writeResults(resultData, fs, path);

}
function writeResults(results, fs, path) {
    let fileName = "results.json";
    let resolved = path.resolve(__dirname, fileName);
    let rawdata = '';
    let savedResults = {
        "results" : []
    };
    if (fs.existsSync(resolved)) {
        rawdata = fs.readFileSync(resolved);
        if (rawdata.length !== 0 ) {
            savedResults = JSON.parse(rawdata);
        }
    }
    results.results = results.results.concat(savedResults.results);
    let data = JSON.stringify(results, null, 2);  
    // let parsed = JSON.parse(data);
    // console.log(parsed, "Parsed data");
    fs.writeFileSync(fileName, data, (err) => {
        if (err) { throw err; }
    });
    console.log(results.results.length);
    console.log('Results have been exported!');
}