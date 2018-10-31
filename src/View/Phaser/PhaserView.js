import * as Phaser from 'phaser'
import {MainState} from './PhaserMainView'

/**
 * phaser view parent class
 */

export class PhaserView {
    constructor(phaserParam) {
        this.setParam(phaserParam);
    }

    setParam (phaserParam) {
        this.selectorY = phaserParam.selectorY;
        this.tileSize = phaserParam.tileSize;
        this.tileNum = phaserParam.tileNum;
        this.worldLength = phaserParam.worldLength;
        this.worldWidth = phaserParam.worldWidth;  
        this.tileMap = phaserParam.tileMap;    
    }

    destroyOldGame() {
        this.game = this.game.destroy(true);
        this.game = null;
    }

    createNewGame() {
        // console.log(this.newGame);
        this.game = new Game(this.worldLength, this.worldWidth, this.selectorY, this.tileSize, this.tileNum, this.tileMap);
        // this.gameExists = true;
    }
}

class Game extends Phaser.Game {

	constructor(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap) {
        super(worldWidth, worldLength, Phaser.AUTO, 'content', null);
        this.state.add('MainState', MainState, false);
        this.state.start('MainState', false, false, selectorY, tileSize, tileNum, tileMap);
	}

}