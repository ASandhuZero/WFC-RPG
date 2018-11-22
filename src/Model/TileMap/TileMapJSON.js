import { WFC } from "../WaveFunctionCollapse/WFC";
import { SimpleTiledModel } from "../WaveFunctionCollapse/SimpleTiledModel";

/**
 * Creates tile map JSON for Tile2D
 */

// var model = new WFC(false, tileNum, tileNum, test_json);

// model parameter is an object 
/**
 * ----- WFC OUTPUT ------------
 * {
 *  "tileMap": [array of tile_id],
 *  "tileDict": [{"index":"tileName"}],
 * }
 * ----- WFC INPUT --------
 * {
 *      periodic : boolean,
 *      width : int,
 *      height : int,
 *      tile_json: {
 *          tiles : [
 *              {"name" : tile_1, symmetry: "\\"}    
 *          ],
 *          neighbors: [
 *          {left: tile_1 0, right: tile_1 1}         
 *          ]
 * },
 *      constraints : Object, 
 * }
 */


export class TileMapModel {
    constructor (height, width, tileConstraints) {
        this.height = height;
        this.width = width;
        this.periodic = false;
        this.subset = null;
        this.tileConstraints = tileConstraints;
        this.constraints = null;
        // this.tileMapArray = this.getWFCModel();
        this.tileArray = this.getTilemap();
        this.tileMap = this.getTile2DJSON();
    }

    getWFCModel() {
        this.model = new SimpleTiledModel(this.periodic, this.subset,this.height, this.width, this.tileConstraints); // Output: tileMap ["tile rotation item","1 0 0"]
        return this.model;
    }

    // Output: [tile, tile ...]
    getTileMap() {
        let tileArray = [];
        // let tile_number, tile_name, name, rotation, item;
        for (let i = 0; i < this.model.length; i++) {
            tile_number = this.model[i];
            tile_name = this.tile_names[tile_number];
            [name, rotation] = tile_name.split(/[ ]+/);
            tile_number = this.tile_occurrence[name];
            tile_number = tile_number + 10; // TEST TODO:
            // remember to change this later.
            switch (rotation) {
                case '3':
                    tileArray.push(tile_number + 0xA0000000);
                    break;
                case '2':
                    tileArray.push(tile_number + 0xC0000000);
                    break;
                case '1':
                    tileArray.push(tile_number + 0x60000000);
                    break;
                case '0':
                    tile_number = this.tile_occurrence[name];
                    tileArray.push(tile_number);
                    break;
                default:
                    tileArray.push(tile_number);
                    break;
            }
        }
        return tileArray;
    }

    // Output: [itemId, itemId ...]
    getItemMap() {

    }

    // Output: JSON file compatiblewith Tiled2D
    getTile2DJSON() {
        let tile2DJSON = {
            "height":this.height,
            "infinite": false,
            "layers":[
                {
                "data": this.tileArray,
                "height":this.height,
                "name":"Tile Layer 1",
                "opacity":1,
                "type":"tilelayer",
                "visible":true,
                "width":this.width,
                "x":0,
                "y":0
                }],
            "nextobjectid":1,
            "orientation":"orthogonal",
            "renderorder":"right-down",
            "tiledversion":"1.1.6",
            "tileheight":32,
            "tilesets":[
                {
                    "columns":8,
                    "firstgid":1,
                    "image":"../../assets/tilesets/wolfsong/BlackForest_A.png",
                    "imageheight":512,
                    "imagewidth":256,
                    "margin":0,
                    "name":"Town_A",
                    "spacing":0,
                    "tilecount":128,
                    "tileheight":32,
                    "tilewidth":32
                }, 
            ],
            "tilewidth":32,
            "type":"map",
            "version":1,
            "width":this.width
        }
        return tile2DJSON; 
    }
        
}