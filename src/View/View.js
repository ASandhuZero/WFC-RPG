import {PhaserView} from './Phaser/PhaserView'

/**
 * @file Gets user input
 * 
 */

// This is the parent view class 
// Controller calls this class to do stuff

export class View {
    constructor() {
        console.log('view constructor')
        this.tileNum = +document.getElementById("tileNumInput").value;      // number of tiles in x
        this.tileSize = +document.getElementById("tileSizeInput").value;    // defaults to 32 pixels
        this.exportButton = document.getElementById("exportButton");
        this.numButton = document.getElementById("numButton");
    }

    

    displayPhaserView(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap) {
        this.phaserView = new PhaserView(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap); 
        return this.phaserView;
    }

    clearPhaserView() {
        if (typeof this.phaserView != "undefined") {
            if(this.phaserView.gameExists){
                console.log('game has been destroyed')
                this.game.destroy(true);
            } else {
                console.log('new game')
                
            }
        }
    }
// TODO: If old game exists then destroy it and make new game


    //for future
    displayBabylonView() {
        return 0;
    }

}