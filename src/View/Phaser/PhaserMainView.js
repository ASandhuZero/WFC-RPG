import * as Phaser from 'phaser'
import {EditorView} from './PhaserEditorView'

/**
 * @file Contains PhaserMainView, Game, and GameState classes
 */

export class MainState extends Phaser.State {
    init(selectorY, tileSize, tileNum, tileMap, editor, includeItem){
        this.tileMap = tileMap;
        this.selectorY = selectorY;
        this.tileSize = tileSize;
        this.tileNum = tileNum;
        this.mapName = 'map';
        this.editor = editor;
        this.includeItem = includeItem;
        // debugger
    }

    preload () {

        this.game.load.tilemap(this.mapName, null, this.tileMap, Phaser.Tilemap.TILED_JSON);
        this.game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png');
        this.game.load.image('car', 'assets/sprites/car.png');
        this.game.load.image('ball', 'assets/sprites/blue_ball.png');
        this.game.load.image('key', 'assets/sprites/key.png');
        this.game.load.image('chest', 'assets/sprites/chest.gif');
        // this.game.load.image(tileSet.name,tileSet.path);    //game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png'); 
        // this.game.load.tilemap(tileMap.name, null, tileMap.tilemap,Phaser.Tilemap.TILED_JSON);  //game.load.tilemap('testPCG', null, pcg_tilemap, Phaser.Tilemap.TILED_JSON);
    }

    create () {
        this.game.stage.backgroundColor = '#ccc';
        // console.log(this.tileMap);
        this.map = this.game.add.tilemap(this.mapName);
        // console.log(this.map);
        
        this.map.addTilesetImage(this.map.tilesets[0].name, this.map.tilesets[0].name);
        // this.map.addTilesetImage(this.map.tilesets[1].name, this.map.tilesets[1].name);
    
        let layer = this.map.createLayer(0);
        layer.fixedToCamera = false;
        // move layer in y direction to make room for selector
        layer.position.setTo(0, this.selectorY* this.tileSize);
    
        // Creates editor selection
        // this.editor = new EditorView(this.tileNum, this.tileSize, this.selectorY);
        // this.tileChanged = this.editor.GetChangedTilePair();
        // console.log(this.tileChanged);
        // console.log(typeof EditorView.Create(this.game, this.map, layer));

        // Create items group
        let items = this.game.add.group();
        items.enableBody = true;
        // Display objects using gid, x, and y position specified in TileMapModel JSON
        if(this.includeItem == true){
            this.map.createFromObjects('items', this.tileNum*this.tileNum+1, 'key', 0, true, false, items);
            this.map.createFromObjects('items', this.tileNum*this.tileNum+2, 'chest', 0, true, false, items);
        }

        // Create editor layer
        this.editor.Create(this.game, this.map, layer);
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.refresh();

        layer.resizeWorld();
        return [this.game, this.map, layer];
    }
}

