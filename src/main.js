//TODO: REMOVED TILE COUNT, CURRENTLY HARDCODING TILE COUNT TO 128. FIX THIS 
//      LATER. ALSO THERE IS A BUNCH OF HARDCODED VALUES WITHIN THE TILED 
//      DATA. MIGHT BE WORTH TO SEE HOW MAKE IT MORE DYNAMIC. IF NEED BE.
//   ALSO LOL, ADD BACK IN THE ITEM FUNCTIONALITY WITHIN THE TILED DATA.
import { WFC } from "./WaveFunctionCollapse/WaveFunctionCollapse";
import * as testjson from "./UNITTEST.json!json";
import evaluateHorrorPotential from "./Evals/TilemapEvaluation";
import { detectFeatures } from "./Evals/FeatureDetection";
import { generateHeatmaps } from "./Evals/Visualization";

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
let wfc = WFC(0, tilemap_data); 

// PAIN EXISTS HERE. FIGURE OUT A BETTER WAY TO DO MAPPINGS LIKE THIS
// TODO: PLEASE GOD HELP ME
let feature_mapping = {
    6 : ["LV"],
    7 : ["T"], 
    8 : ["AC, T"],
    9 : ["T"],
    16 : ["AC", "LV", "T"]
}

// YEPT THIS IS BAD CODE. STRUCTURAL CODE RIGHT HERE THT NEEDS TO BE REFACTORED TODO:
let feature_map = Array.from(Array(width), () => new Array(height));
let col = 0;
for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
        let tile = wfc[0][j+(i*10)].split(" ");
        let tile_name = tile[0]; // This is the tile name. Honestly this is more broken then a college student trying to get a job.
        let tile_feature = feature_mapping[tile_name];
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
// console.log(heatmaps.ac);
// console.log(heatmaps.lv);
// console.log(heatmaps.js);
// console.log(heatmaps.iso);
let tilemapEval = evaluateHorrorPotential(features, 10, 10, "slasher");
// console.log(tilemapEval);
//TODO: wfc returns back two different things, right now I should focus on 
//      consolidating it over to one output. Probably the more structured of 
//      the two.
let mapData = GetMap(wfc[0], 1);
let tiledData = getTile2DJSON(mapData, height, width, wfc.length);

function GetMap(wfc, a) {

    var array = [];
    var elements, element, tile_number, rotation;
    switch(a) {
        case 1:
            for (let i = 0; i < wfc.length; i++){
                elements = wfc[i];
                element = elements.split(/[ ]+/);
                array.push(element[0]);
            }
            break;
        case 0:
            for (let i = 0; i < wfc.length; i++) {
                elements = wfc[i];
                element = elements.split(/[ ]+/);
                tile_number = parseInt(element[a]);
                rotation = element[a+1];
                switch (rotation) {
                    case '3':
                    array.push(tile_number + 0xA0000000);
                        break;
                    case '2':
                    array.push(tile_number + 0xC0000000);
                        break;
                    case '1':
                    array.push(tile_number + 0x60000000);
                        break;
                    case '0':
                    array.push(tile_number);
                        break;
                    default:
                    array.push(tile_number);
                        break;
                }
            }
    }
    return array;
}

function getTile2DJSON(mapData, height, width, wfc_length) {
    let tile2DJSON = {
        "height":height,
        "infinite": false,
        "layers":[
            {
                "id": 1,
                "data": mapData,
                "height":height,
                "name":"Map",
                "opacity":1,
                "type":"tilelayer",
                "visible":true,
                "width":width,
                "x":0,
                "y":0
            },
            {
                "draworder":"topdown",
                "height":height,
                "name":"items",
                // "objects":this.createItemObjects(),
                "objects":{},
                "opacity":1,
                "type":"objectgroup",
                "visible":true,
                "width":width,
                "x":0,
                "y":0
            }],
        "nextobjectid":1,
        "nextlayerid": 2,
        "orientation":"orthogonal",
        "renderorder":"right-down",
        "tiledversion":"1.2",
        "tileheight":16,
        "tilesets":[
            {
                "columns":8,
                "firstgid":1,
                "image":"../../assets/tilesets/wolfsong/Town_A.png",
                "imageheight":512,
                "imagewidth":256,
                "margin":0,
                "name":"Town_A",
                "spacing":0,
                //"tilecount":this.tileCount,
                "tilecount":128,
                "tileheight":32,
                "tilewidth":32
            }, 
            {
                "firstgid":wfc_length+1,
                "image":"../../assets/sprites/car.png",
                "imageheight":32,
                "imagewidth":32,
                "margin":0,
                "name":"car",
                "spacing":0,
                "tilecount":1,
                "tileheight":32,
                "tilewidth":32
            },
        ],
        "tilewidth":32,
        "type":"map",
        "version":1.2,
        "width":width
    }
    return tile2DJSON; 
}

// CANVAS CODE TODO: BREAK THIS OUT INTO ITS OWN JS FILE IF WORK.
// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
// Good good stuff.
const canvas = document.getElementById('test-canvas');
const ctx = canvas.getContext('2d');


const tileAtlas = new Image();
tileAtlas.src = './assets/tilesets/graveyard.png';
tileAtlas.onload = draw;

let tileSize = 16;
let tileOutputSize = 4; // can set to 1 for 32px or higher
let updatedTileSize = tileSize * tileOutputSize;

let atlasCol = 10;
let atlasRow = 8;
let mapCols = 10;
let mapRows = 10;
let mapHeight = mapRows * tileSize;
let mapWidth = mapCols * tileSize
let level1Map = mapData
let mapIndex = 0;
let sourceX = 0;
let sourceY = 0;



function draw() {
    canvas.width = mapWidth * updatedTileSize;
    canvas.height = mapHeight * updatedTileSize;
    for (let col = 0; col < mapHeight; col += tileSize) {
        for (let row = 0; row < mapWidth; row += tileSize) {
            let tileVal = level1Map[mapIndex];
            if(tileVal !=0) {
                tileVal -= 1;
                sourceY = Math.floor(tileVal/atlasCol) * tileSize;
                sourceX = (tileVal % atlasCol) * tileSize;
                ctx.drawImage(tileAtlas, sourceX, sourceY, tileSize,
                    tileSize, row * tileOutputSize, col * tileOutputSize,
                    updatedTileSize, updatedTileSize);
                // TODO: Please figure out a standard for matrix (row by column or column by row), for the love of GOD.
                // let srgb = heatmap.output[col / 16][row / 16].srgb;
                // ctx.fillStyle = 'rgba(' + 255 * srgb.red + ', ' +
                // 255 * srgb.green + ', ' + 255 * srgb.blue + ', 0.5)';
                // ctx.fillRect(row * tileOutputSize, col * tileOutputSize,
                //     updatedTileSize, updatedTileSize);
            }
            mapIndex ++;
        }
    }
    
}
