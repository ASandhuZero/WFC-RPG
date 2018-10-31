import {TileMapModel} from '../Model/TileMap/TileMapJSON'
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
    constructor(type, tileConstraints, newGame) {
        this.tileConstraints = tileConstraints; // object of tiles and neighbors
        this.viewType = type;
        this.view = new View();
        //TileMapModel parameters: int height, int width, {tile, neighbors}
        this.model = new TileMapModel(this.view.tileNum, this.view.tileNum, this.tileConstraints);  
        this.newGame = newGame;
    }

    getTileMap() {
        return this.model.getTileMap;
    }

    // getTileSet() {
    //     return this.view.getTileSet;
    // }

    getTileNum() {
        return this.view.tileNum;
    }

    // getUserConstraints() {
    //     return this.view.userConstraints;
    // }

    // getUserConfig() {
    //     return this.view.userConfig;
    // }

    // Pass tile set chosen from view to model for computation
    setTileSet() {

    }

    // Pass user constraints
    setUserConstraints() {

    }

    setUserConfig() {

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
        return this.phaserViewParam;
    }

    updateView() {
        switch(this.viewType){
            case 'Phaser':
                this.view.getInputs();
                this.model = new TileMapModel(this.view.tileNum, this.view.tileNum, this.tileConstraints);
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
                console.log(phaserParam);
                this.displayView = this.view.displayPhaserView(phaserParam);
                break;
            case 'Babylon':
                this.view.displayBabylonView;
                break;
        }
    }
}