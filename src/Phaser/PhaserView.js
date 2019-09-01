import * as Phaser from 'phaser'
import {MainState} from './PhaserMainView'
import {EditorView} from './PhaserEditorView'

/**
 * phaser view parent class
 */

export class PhaserView {
    constructor(phaserParam) {
        this.setParam(phaserParam);
    }

    getTileUpdated() {
        this.tileChanged = this.editor.GetChangedTilePair();
        return this.tileChanged;
    }

    setParam (phaserParam) {
        this.selectorY = phaserParam.selectorY;
        this.tileSize = phaserParam.tileSize;
        this.tileNum = phaserParam.tileNum;
        this.worldLength = phaserParam.worldLength;
        this.worldWidth = phaserParam.worldWidth;  
        this.tileMap = phaserParam.tileMap;
        this.includeItem = phaserParam.includeItem;   
        // debugger 
    }

    destroyOldGame() {
        this.game = this.game.destroy(true);
        this.game = null;
    }

    createNewGame() {
        // this.items = new ItemView(this.tileNum, this.tileSize);
        this.editor = new EditorView(this.tileNum, this.tileSize, this.selectorY);
        this.game = new Game(this.worldLength, this.worldWidth, this.selectorY, this.tileSize, this.tileNum, this.tileMap, this.editor, this.includeItem);
    }
}

class Game extends Phaser.Game {

	constructor(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap, editor, includeItem) {
        super(worldWidth, worldLength, Phaser.AUTO, 'content', null);
        this.state.add('MainState', MainState, false);
        this.state.start('MainState', false, false, selectorY, tileSize, tileNum, tileMap, editor, includeItem);
	}

}