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
    constructor(type, tileConstraints) {
        this.tileConstraints = tileConstraints; // object of tiles and neighbors
        this.viewType = type;
        this.view = new View();
        //TileMapModel parameters: int height, int width, {tile, neighbors}
        this.model = new TileMapModel(this.view.tileNum, this.view.tileNum, this.tileConstraints);  
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

    getTile2DJSON() {
        return this.model.getTile2DJSON;
    }

    updateView() {

    }

    // choose display type
    displayView() {
        switch(this.viewType){
            case 'Phaser':
                this.selectorY = Math.ceil(this.model.tileMap.tilesets[0].tilecount/this.view.tileNum); // number of rows of tiles
                this.worldWidth = this.view.tileSize * this.view.tileNum;   // x size of world (pixels)
                this.worldLength = this.view.tileSize * (this.view.tileNum+this.selectorY);     // y size of world (pixels)
                this.view.clearPhaserView();
                this.view.displayPhaserView(this.worldLength, this.worldWidth, this.selectorY, this.view.tileSize, this.view.tileNum, this.model.tileMap);
                break;
            case 'Babylon':
                this.view.displayBabylonView;
                break;
        }
    }
}