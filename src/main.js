import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./TileTerrorConstraints.json!json";
import * as partialsJSON from "./partials.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
// import { generateHeatmaps } from "./Evals/Visualization";
import { pathfinding } from "./pathfinding";
import { Draw } from "./View";
import { generatePartials } from "./partialGenerator";
//TODO: add in an item spawn rate. 
// Figure out some way to actually combine the item spawn to a location spawn.
const height = 20;
const width = 20;

let partialFlag = true;
let testPaths = false;
let save = false;
let shouldGenerateNeighbors = true;
// TODO: This feels silly... Why can't we just turn off a tile?
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
let wfcOutput = undefined;

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


let partial = null;
let partials = partialsJSON.partials;


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

while ((wfcOutput=== undefined ||paths === false) && loopCount < 10) {
    console.log("in loop");
    if (partialFlag) {
        partial = generatePartial(partials, width, height);
    } else {
        partial = null;
    }
    try {
        wfcOutput = WFC(mapData, partial, shouldGenerateNeighbors, banList); 
        if (wfcOutput.length === 0) { wfcOutput = null; }
    } catch (error) {
        console.log(error);
        wfcOutput = undefined;
    }
    let lowLevelFeatureMap = Array.from(Array(width), () => new Array(height));
    let tilemapToSave = Array.from(Array(width), () => new Array(height));
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let tile = wfcOutput[i][j];
            tilemapToSave[i][j] = parseInt(wfcOutput[i][j].name);
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
let levelMap = wfcOutput;

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