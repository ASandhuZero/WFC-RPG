import * as Phaser from 'phaser'
// import {EditorView} from './PhaserEditorView'
import {MainState} from './PhaserMainView'

/**
 * phaser view parent class
 */

export class PhaserView {
    constructor(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap) {
        this.selectorY = selectorY;
        this.tileSize = tileSize;
        this.tileNum = tileNum;
        this.game = new Game(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap);
        this.gameExists = true;
        
    }

    createNewGame() {
        // this.game = new Game(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap);
        // this.gameExists = true;
    }

}

class Game extends Phaser.Game {

	constructor(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap) {
        super(worldWidth, worldLength, Phaser.AUTO, 'content', null);
        this.state.add('MainState', MainState, false);
        // this.state.add('EditorState', EditorState, false);
        this.state.start('MainState', false, false, selectorY, tileSize, tileNum, tileMap);
	}

}