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
    }

    destroyOldGame() {
        this.game = this.game.destroy(true);
        this.game = null;
    }

    createNewGame() {
        // console.log(this.newGame);
        this.editor = new EditorView(this.tileNum, this.tileSize, this.selectorY);
        this.game = new Game(this.worldLength, this.worldWidth, this.selectorY, this.tileSize, this.tileNum, this.tileMap, this.editor);
        // this.gameExists = true;
        console.log(this.game);
    }

    // createNewEditor() {
    //     // Creates editor selection
    //     this.editor = new EditorView(this.tileNum, this.tileSize, this.selectorY);
    //     this.tileChanged = editor.GetChangedTilePair();
    //     console.log(this.tileChanged);
    //     // console.log(typeof EditorView.Create(this.game, this.map, layer));
    //     editor.Create(this.game, this.map, layer);
    // }
}

class Game extends Phaser.Game {

	constructor(worldLength, worldWidth, selectorY, tileSize, tileNum, tileMap, editor) {
        super(worldWidth, worldLength, Phaser.AUTO, 'content', null);
        this.state.add('MainState', MainState, false);
        this.state.start('MainState', false, false, selectorY, tileSize, tileNum, tileMap, editor);
	}

}