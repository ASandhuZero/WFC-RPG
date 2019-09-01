import { WFC } from "../WaveFunctionCollapse/WFC";
// import { SimpleTiledModel } from "../WaveFunctionCollapse/SimpleTiledModel";

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
    constructor (tilesize, subset,height, width, tileJSON, tile_rule, item_rule, num_items) {
        this.num_items = num_items;
        this.tile_rule = tile_rule;
        this.item_rule = item_rule;
        this.tilesize = tilesize;
        this.height = height;
        this.width = width;
        this.periodic = false;
        this.subset = subset;
        this.tileJSON = tileJSON;
        this.tileCount = 128;
        this.constraints = null;
        this.tileMapArray = this.getWFCModel();
        this.tileMap = this.getTile2DJSON();
        // this.tiles = this.getMap(0);
        // console.log(this.tileMapArray);
    }

    getWFCModel() {
        this.model = WFC(this.periodic, this.height, this.width, this.tileJSON, this.tile_rule, this.item_rule); 
        // console.log(this.model);
        if(this.model.length == 0) { debugger}
        // debugger
        return this.model;
    }

    // Input: int a - 0 >> array of tiles; 1 >> array of items
    // Output: [tile, tile ...]
    getMap(a) {

        var array = [];
        var elements, element, tile_number, rotation;
        switch(a) {
            case 1:
                for (let i = 0; i < this.tileMapArray.length; i++){
                    elements = this.tileMapArray[i];
                    element = elements.split(/[ ]+/);
                    array.push(element[a+1]);
                }
                break;
            case 0:
                for (let i = 0; i < this.tileMapArray.length; i++) {
                    elements = this.tileMapArray[i];
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

    calculateItemPosition(id) {
        let x=id*this.tilesize;
        let y=0;
        

        if (id >= this.width ){
            x = (id % this.width)*this.tilesize;
            y = (Math.floor(id / this.width))*this.tilesize;
        }
        return [x,y];
    }

    createItemObjects() {
        let itemsObjectArray = [];
        let j = 0;
        let gid;
        let items = this.getMap(1);
        let gids=[];
        let editorHeight = Math.ceil(this.tileCount/this.width)+1;
        
        for(let i = 1;i <= this.num_items; i++){
            gids[i] = this.tileMapArray.length+i;
        }
        
        if(this.subset == 'item'){
            for (let i = 0; i < items.length; i++){
                
                if (items[i]>0){
                    
                    gid = gids[items[i]];

                    let itemJSON = {
                        "gid":gid,
                        "id":j,
                        "name":this.subset,
                        "rotation":0,
                        "visible":true,
                        "width": 0,
                        "x":this.calculateItemPosition(i)[0], //position x
                        "y":this.calculateItemPosition(i)[1]+(editorHeight*this.tilesize)
                    }
                    itemsObjectArray.push(itemJSON);
                    j++;
                }
            }
        } else {
            throw 'No item subset given'
        }
            
        return itemsObjectArray;
    }

    // Output: JSON file compatiblewith Tiled2D
    getTile2DJSON() {
        let tile2DJSON = {
            "height":this.height,
            "infinite": false,
            "layers":[
                {
                    "id": 1,
                    "data": this.getMap(0),
                    "height":this.height,
                    "name":"Map",
                    "opacity":1,
                    "type":"tilelayer",
                    "visible":true,
                    "width":this.width,
                    "x":0,
                    "y":0
                },
                {
                    "draworder":"topdown",
                    "height":this.height,
                    "name":"items",
                    "objects":this.createItemObjects(),
                    "opacity":1,
                    "type":"objectgroup",
                    "visible":true,
                    "width":this.width,
                    "x":0,
                    "y":0
                  }],
            "nextobjectid":1,
            "nextlayerid": 2,
            "orientation":"orthogonal",
            "renderorder":"right-down",
            "tiledversion":"1.2",
            "tileheight":32,
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
                    "tilecount":this.tileCount,
                    "tileheight":32,
                    "tilewidth":32
                }, 
                {
                    "firstgid":this.tileMapArray.length+1,
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
            "width":this.width
        }
        return tile2DJSON; 
    }
        
}