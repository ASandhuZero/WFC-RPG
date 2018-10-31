import * as Phaser from 'phaser'
import {EditorView} from './PhaserEditorView'

/**
 * @file Contains PhaserMainView, Game, and GameState classes
 */

export class MainState extends Phaser.State {
    init(selectorY, tileSize, tileNum, tileMap){
        this.tileMap = tileMap;
        this.selectorY = selectorY;
        this.tileSize = tileSize;
        this.tileNum = tileNum;
        this.mapName = 'map';
    }

    preload () {
        this.game.load.tilemap(this.mapName, null, this.tileMap, Phaser.Tilemap.TILED_JSON);
        this.game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png');
        // this.game.load.image(tileSet.name,tileSet.path);    //game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png'); 
        // this.game.load.tilemap(tileMap.name, null, tileMap.tilemap,Phaser.Tilemap.TILED_JSON);  //game.load.tilemap('testPCG', null, pcg_tilemap, Phaser.Tilemap.TILED_JSON);
    }

    create () {
        this.game.stage.backgroundColor = '#ccc';
        this.map = this.game.add.tilemap(this.mapName);
        this.map.addTilesetImage(this.map.tilesets[0].name, this.map.tilesets[0].name);
    
        let layer = this.map.createLayer(0);
        layer.fixedToCamera = false;
        // move layer in y direction to make room for selector
        layer.position.setTo(0, this.selectorY* this.tileSize);
    
        // Creates editor selection
        let editor = new EditorView(this.tileNum, this.tileSize, this.selectorY);
        // console.log(typeof EditorView.Create(this.game, this.map, layer));
        editor.Create(this.game, this.map, layer);
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.refresh();

        layer.resizeWorld();
    }
}

