// import * as testjson from "./TileTerrorConstraints.json!json";
// import * as partialsJSON from "./partials.json!json";
import fs from 'fs';
import path from 'path';
import * as testJson from "./TileTerrorConstraints.json" assert {type: 'json'};
let testjson = testJson["default"];
import * as partialsjson from "./partials.json" assert {type: 'json'};
let partialsJSON = partialsjson["default"];
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse.js";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation.js";
import { detectFeatures } from "./Evals/FeatureDetection.js";
// import { generateHeatmaps } from "./Evals/Visualization";
import { pathfinding } from "./pathfinding.js";
import { Draw } from "./View.js";
import { generatePartial } from "./partialGenerator.js";
//TODO: almost everything here is globally defined... We shouldn't do that.
//TODO: add in an item spawn rate. 
// Figure out some way to actually combine the item spawn to a location spawn.
const height = 10;
const width = 10;

//TODO: You might have to add in the fs require stuff because it seems like that's related to your saving functionality... 
//      ... Also you should maybe break out your saving functionality into it's own file or something.
// define(['require', 'fs', 'path'], function(require) {
//     const fs = require('fs')
//     const path = require('path');
//     console.log(fs, path);
// });
// console.log(fs, path, required);
// debugger;


let banList = [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37];


let resultData = {
    "results" : []
}
let tileRules = {}
let itemRules = {}
let mapData = {
    h : height,
    w : width,
    tileRules : tileRules,
    itemRules : itemRules,
    tilesetInfo : testjson
}
let wfcOutput = null;

// Feature mapping of tiles to their horror low level feature.
// TODO: Make sure that tiles without anything come back as traverseable as 
//  well. So, tiles are being drawn and their features aren't being accounted
// for. Maybe we make this into it's own object?
let featureMapping = {};
for (let i = 0; i < testjson.data.tile_info.length; i++) {
    let tile = testjson.data.tile_info[i];
    let name = tile.name;
    featureMapping[name] = tile.features;
}

let partialFlag = true;
let testPaths = false;
let save = true;
let shouldGenerateNeighbors = true;
// TODO: This feels silly... Why can't we just turn off a tile?
let partial = null;
let partials = partialsJSON.partials;
//TODO: we need data on the different reasons why it failed.
let short = 0;
let psych = 0;
let slash = 0; 
let slasher = 0;
let psycho = 0;
let paths = true;
let heatmaps = null;
let features = null; 
let loops = 0;
let totalTestLoops = 1;
let partialCoverage = 0.0;
let [tempPartPercent, highestPartPercent, lowestPartPercent] = [0, 0, 999];
let [keyFail, genFail] = [0, 0];
let [solvableCount, unsolvableCount] = [0, 0];
// make sure there is some way to check if there is a door and a key and if the
// key/door pairing
// Save key number
// Save door number
// heatmap for this generative space
// Vanilla WFC is effectively our baseline for complability, which I imagine
// will be high, while the rest of our WFC tests will focus on the 
// completeability based on percentages of our additional design and key/door pairings. 
while ((wfcOutput === null ||paths === false)) {
    // Make sure that it doesn't just continue to loop or something.
    // we need some way to make sure if the map is unsolveable, then
    // it remains that way.
    loops++;
    let failureReason = "";
    let solved = true;
    let keyFailed = false;
    let pathFailed = false;
    let genFailed = false;
    console.log("%c%s", "color:red", 
        `————STARTING NEW LOOP ITERATION: ————
        Number of loops:`, loops);
    if (partialFlag) { 
        [partial, tempPartPercent] = generatePartial(
            partials, width, height, partialCoverage); 
        if (tempPartPercent > highestPartPercent) { 
            highestPartPercent = tempPartPercent;
        }
        if (tempPartPercent < lowestPartPercent) {
            lowestPartPercent = tempPartPercent;
        }
    }
    else { partial = null; }
    try {
        wfcOutput = WFC(mapData, partial, shouldGenerateNeighbors, banList); 
        if (wfcOutput.length === 0) { 
            genFail++;
            genFailed = true;
            wfcOutput = null; 
            continue;
        }
    } catch (error) {
        console.log(error);
        wfcOutput = null;
    }
    //TODO: can't we just do a deep copy of the arrays here? Eh, maybe
    let lowLevelFeatureMap = Array.from(Array(width), () => new Array(height));
    let tilemapToSave = Array.from(Array(width), () => new Array(height));
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let tile = wfcOutput[i][j];
            tilemapToSave[i][j] = parseInt(wfcOutput[i][j].name);
            // Doing a deep copy right here.
            lowLevelFeatureMap[i][j] = featureMapping[tile.name].map(x => x);
            if (tile.item) { lowLevelFeatureMap[i][j].push(tile.item); }
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
    let keys = [];
    let doors = [];
    [paths, failureReason, keys, doors] = pathfinding(
        combinedFeatureMap, start, goal);
    if (paths === false) {debugger; }
    if (paths.length === 0) { 
        if (failureReason === "NO_KEY") { 
            keyFailed = true;
            keyFail++; 
        }
        else if (failureReason === "NO_PATH") { 
            solved = false;
            pathFailed = true;
            unsolvableCount++; 
        }
        console.log("%c%s", "background-color:red", "MAP IS UNSOLVEABLE.",
        "Times failed:", unsolvableCount, failureReason); 
        paths = false;
    } else {
        solvableCount++;
        console.log("%c%s", "background-color:green", "MAP CAN BE COMPLETED.",
        "Times completed:", solvableCount); 
    }
    // if (testPaths && save && paths) {
    //     if (paths[0].movesTaken > paths[2].movesTaken) { short++; }
    //     if (paths[0].slasherScore < paths[2].slasherScore ) { slash++; }
    //     if (paths[0].psychScore < paths[2].psychScore ) { psych++; }
    //     if (paths[3].slasherScore < paths[4].slasherScore ) { slasher++; }
    //     if (paths[4].psychScore < paths[3].psychScore ) { psycho++; }
    //     let pathsToSave = [];
    //     let short = {
    //         psychScore : [],
    //         slasherScore : [],
    //         movesTaken : -1
    //     }
    //     let long= {
    //         psychScore : [],
    //         slasherScore : [],
    //         movesTaken : -1
    //     }
    //     let scaredyCat = {
    //         psychScore : [],
    //         slasherScore : [],
    //         movesTaken : -1
    //     }
    //     let slasherPrio= {
    //         psychScore : [],
    //         slasherScore : [],
    //         movesTaken : -1
    //     }
    //     let psychoPrio = {
    //         psychScore : [],
    //         slasherScore : [],
    //         movesTaken : -1
    //     }
    //     let pathNames = ["short", "long", "ScaredyCat", "Slasher Prio", 
    //         "Psychological Prio"];
    //     let pathobj = [short, long, scaredyCat, slasherPrio, psychoPrio]

    //     for (let i = 0; i < paths.length; i++) {
    //         let path = paths[i];
    //         let obj = pathobj[i];
    //         obj.psychScore = path.psychScore;
    //         obj.slasherScore = path.slasherScore;
    //         obj.movesTaken = path.movesTaken;
    //     }
    //     resultData.results.push({
    //             short : short,
    //             long : long,
    //             scaredyCat : scaredyCat,
    //             slasherPrio : slasherPrio,
    //             psychologicalPrio : psychoPrio
    //         });
    //     if (loops%100===0) {
    //         writeResults(resultData, fs, path);
    //         resultData.results = [];
    //     }
    //     console.log("Results have been pushed!", loops);
    //     paths = false;
    // }
    let movesTakenData = paths[0] !== undefined ? paths[0].movesTaken: 0;
    resultData.results.push({
        width: mapData.w,
        height : mapData.h,
        partialThreshold : partialCoverage,
        partialCoverage : tempPartPercent,
        solvable : solved,
        pathFail : pathFailed,
        keyFail : keyFailed,
        genFail : genFailed,
        movesTaken : movesTakenData,
        keys : keys.length,
        doors: doors.length 
    });
    let isNode=new Function("try {return this===global;}catch(e){return false;}");
    if (loops < totalTestLoops) { paths = false; }
    else {
        if (partialCoverage < 0.95) { 
            totalTestLoops+=1;
            partialCoverage += 0.1;
            paths = false;
            console.log(partialCoverage);
            if (isNode() && save) { writeResults(resultData, fs, path); } 
            
            //TODO: do the file writing right here
        } else if (mapData.w < 40) {
            totalTestLoops+=1;
            mapData.w += 10;
            mapData.h += 10;
            partialCoverage = 0;
            console.log(mapData.w, mapData.h);
            if (isNode() && save) { writeResults(resultData, fs, path); } 
        }  
        else if (loops >= totalTestLoops) { 
            console.log(mapData.w, mapData.h, partialCoverage);
            break; 
        }
    }
}
// console.log(`Highest Partial Percent per runs: %c${
//     highestPartPercent.toFixed(2) * 100}%`, "color:Chartreuse");
// console.log(`Lowest Partial Percent per runs: %c${
//     lowestPartPercent.toFixed(2) * 100}%`, "color:Chartreuse");

// console.log(`Success rate was %c${(
//     solvableCount/loops).toFixed(2)*100}%`, "color:Chartreuse");

// console.log(`Failure rate was %c${(
//     (unsolvableCount+genFail+keyFail)/loops).toFixed(2)*100}%`, "color:red");

// console.log(`No path from start to exit percent: %c${(
//     unsolvableCount/loops).toFixed(2)*100}%`, "color:red");

// console.log(`No key percent: %c${(
//     keyFail/loops).toFixed(2)*100}%`, "color:red");

// console.log(`Failed to generate map percent %c${(
//     genFail/loops).toFixed(2)*100}%`, "color:red");
function combineFeatures(features) {
    let horrorFeatures = [];
    for (let i = 0; i < features.iso.length; i++) {
        let tempArray = new Array(features.iso[i]);
        for (let j = 0; j < features.iso[i].length; j++) {
            tempArray[j] = []
            tempArray[j] = tempArray[j].concat(features.iso[i][j], 
                features.ac[i][j], features.js[i][j], features.lv[i][j],
                features.t[i][j], features.items[i][j]);
        }
        horrorFeatures.push(tempArray)
    }
    return horrorFeatures
}

//Things that we need to do. 
// We have to get the key count as well. Maybe even door count. That way
// we can get a key to door ratio.
//TODO: PLEASE FOR THE LOVE OF ALL THAT IS HOLY, DECIDE IF NODE OR BROWSER.
let isNode=new Function("try {return this===global;}catch(e){return false;}");
if (isNode() && save) { writeResults(resultData, fs, path); } 
// This is the drawing code... We need to figure out where to put this.
else {
    // Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
    const tileSet = new Image();
    tileSet.src = './assets/tilesets/graveyard.png';
    tileSet.onload = drawAll; // there is a function below defined as drawAll; this function draws the tile map.
    let tileSize = 16;
    let rescale = 2; // can set to 1 for 32px or higher
    
    let atlasCol = 9;
    let mapCols = width+1;
    let mapRows = height+1;
    let mapHeight = mapRows * tileSize;
    let mapWidth = mapCols * tileSize
    function drawAll() {
        let canvasWidth = mapWidth * rescale;
        let canvasHeight = mapHeight * rescale;
        Draw(heatmaps, canvasWidth, canvasHeight, tileSize, rescale, tileSet, 
            atlasCol, wfcOutput, paths);
    }

}
function writeResults(results, fs, path) {
    let fileName = "results.json";
    let writeableResults = JSON.stringify(results);
    fs.writeFile(`./${fileName}`, writeableResults, function(err) {
        if (err) { 
            console.log(err); 
            return false;
        }
        console.log("file has been saved!")
    });
}