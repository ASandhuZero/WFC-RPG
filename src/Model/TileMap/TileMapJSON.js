import { WFC } from "../WaveFunctionCollapse/WFC";

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
        this.tileConstraints = tileConstraints;
        this.constraints = null;
        this.tileMapArray = this.getWFCModel();
        this.tileArray = this.tileMapArray.getTilemap();
        this.tileMap = this.getTile2DJSON();
    }

    getWFCModel() {
        this.model = new WFC(this.periodic, this.height, this.width, this.tileConstraints); // Output: {tileMap, tileDict}
        return this.model;
    }

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