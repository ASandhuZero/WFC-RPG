import {Model} from './Model'
import {View} from './View'
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
    constructor(type, model_data) {
        this.viewType = type;
        this.view = new View();
        var shared_data = {
            // tileSize : this.view.tileSize,
            tileSize : 16,
            tileNum : this.view.tileNum
        }
        this.subset = model_data.subset;
        this.model = new Model(shared_data, model_data);  
        this.newGame = model_data.newGame;
        this.includeItem = model_data.includeItem;
        // this.updateTileMap();
    }

    itemToggle() {
        let phaserParam = this.getPhaserViewParam();
        this.displayView = this.view.updatePhaserView(phaserParam);
        return this.displayView;
    }

    updateTileMap() {
        // console.log(this.model.tiles);
        let tiles = this.getTilesUpdated();
        // console.log(tiles);
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
        });

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

    getPhaserViewParam() {
        let selectorYf = Math.ceil(this.model.tileMap.tilesets[0].tilecount/
            this.view.tileNum); // number of rows of tiles
        let worldWidth = this.view.tileSize * this.view.tileNum;   // x size of world (pixels)
        let worldLength = this.view.tileSize * (this.view.tileNum+
            this.selectorY);     // y size of world (pixels)
        
        this.phaserViewParam = {
            worldLength: worldLength,
            worldWidth: worldWidth,
            selectorY: selectorYf,
            tileSize: this.view.tileSize,
            tileNum: this.view.tileNum,
            tileMap: this.model.tileMap,
            includeItem: this.includeItem,
        }
        return this.phaserViewParam;
    }

    updateView() {
        switch(this.viewType){
            case 'Phaser':
                this.view.getInputs();
                this.model.generate();
                let phaserParam = this.getPhaserViewParam();
                // console.log(this.model.tileMap)
                this.displayView = this.view.updatePhaserView(phaserParam);
                break;
            case 'Babylon':
                this.view.displayBabylonView;
                break;
        }
    }

    checkModelOutput() {
        if(this.model == undefined) {
            
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
        return null;
    }
}