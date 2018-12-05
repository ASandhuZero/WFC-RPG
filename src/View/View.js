import {PhaserView} from './Phaser/PhaserView'

/**
 * @file Gets user input
 * 
 */

// This is the parent view class 
// Controller calls this class to do stuff

export class View {
    constructor() {
        this.getInputs();
        this.exportButton = document.getElementById("exportButton");
        this.numButton = document.getElementById("numButton");
        // this.itemToggle = +document.getElementById("itemToggle").value;
    }

    getTileUpdated() {
        this.tileChanged = this.phaserView.getTileUpdated();
        return this.tileChanged;
    }

    getInputs() {
        this.tileNum = +document.getElementById("tileNumInput").value;      // number of tiles in x
        this.tileSize = +document.getElementById("tileSizeInput").value;    // defaults to 32 pixels
    }

    displayPhaserView(phaserParam) {
        this.phaserView = new PhaserView(phaserParam); 
        this.phaserView.createNewGame();
        return this.phaserView;
    }

    updatePhaserView(phaserParam) {
        this.phaserView.setParam(phaserParam);
        this.phaserView.destroyOldGame();
        this.phaserView.createNewGame();
    }

    //for future
    displayBabylonView() {
        return 0;
    }

}