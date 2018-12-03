import {TileMapModel} from '../Model/TileMap/TileMapModel'
// import {PhaserMainView} from 'phaserMainView'
import {View} from '../View/View'
// import {Model} from 'WFCModel'
/**
 * Gets tile set, user constraints, and user config from view.
 * @class 
 * View is an object containing config, constraints, and tileset
 * Model has available functions that produce a tilemap
 */

// Intakes JSON file

// this is where all the decision on what to put give to the view are located

export class Controller {
    // type = view type such as Phaser or Babylon
    constructor(type, tileJSON, subset, newGame) {
        this.tileJSON = tileJSON;   // object of tiles and neighbors
        // this.tileConstraints = tileConstraints; // object of tiles and neighbors
        this.viewType = type;
        this.view = new View();
        this.subset = subset;
        //TileMapModel parameters: int height, int width, {tile, neighbors}
        this.model = new TileMapModel(this.view.tileSize, this.subset, this.view.tileNum, this.view.tileNum, this.tileJSON);  
        console.log(this.model);
        this.newGame = newGame;
        // this.updateTileMap();
    }

    // getTileMap() {
    //     return this.model.getTileMap;
    // }

    updateTileMap() {
        console.log(this.model.tiles);
        let tiles = this.getTilesUpdated();
        let sortedTiles = tiles.sort(function compare(a, b) {
            const indexA = a.index;
            const indexB = b.index;
          
            let comparison = 0;
            if (indexA > indexB) {
              comparison = 1;
            } else if (indexA < indexB) {
              comparison = -1;
            }
            return comparison;
          }
        );

        for (let i = 0; i < sortedTiles.length; i++) {
            this.model.tiles[sortedTiles[i].index] = sortedTiles[i].tile;
        }
    }

    getTileNum() {
        return this.view.tileNum;
    }

    getTilesUpdated() {
        this.tilesUpdated = this.view.getTileUpdated();
        return this.tilesUpdated;
    }

    getTile2DJSON() {
        this.tile2DJSON = this.model.getTile2DJSON();
        return this.tile2DJSON;
    }

    calculateViewParam() {
        this.selectorY = Math.ceil(this.model.tileMap.tilesets[0].tilecount/this.view.tileNum); // number of rows of tiles
        this.worldWidth = this.view.tileSize * this.view.tileNum;   // x size of world (pixels)
        this.worldLength = this.view.tileSize * (this.view.tileNum+this.selectorY);     // y size of world (pixels)
        return [this.worldLength, this.worldWidth, this.selectorY];
    }
    getPhaserViewParam() {
        let param = this.calculateViewParam();
        this.phaserViewParam = {
            worldLength: param[0],
            worldWidth: param[1],
            selectorY: param[2],
            tileSize: this.view.tileSize,
            tileNum: this.view.tileNum,
            tileMap: this.model.tileMap,
        }
        console.log(this.phaserViewParam);
        return this.phaserViewParam;
    }

    updateView() {
        switch(this.viewType){
            case 'Phaser':
                this.view.getInputs();
                this.model = new TileMapModel(this.subset, this.view.tileNum, this.view.tileNum, this.tileJSON);
                let phaserParam = this.getPhaserViewParam();
                this.displayView = this.view.updatePhaserView(phaserParam);
                break;
            case 'Babylon':
                this.view.displayBabylonView;
                break;
        }
    }

    // choose display type
    displayView() {
        switch(this.viewType){
            case 'Phaser':
                let phaserParam = this.getPhaserViewParam();
                this.displayView = this.view.displayPhaserView(phaserParam);
                break;
            case 'Babylon':
                this.view.displayBabylonView;
                break;
        }
    }
}