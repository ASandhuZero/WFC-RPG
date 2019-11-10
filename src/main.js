import * as Phaser from 'phaser'
import * as spriteAssetKey from 'assets/spriteAssetKey.json!json';
import {WFC} from './WaveFunctionCollapse/WFC'
import * as tileset_info from "./WaveFunctionCollapse/tile_info.json!json"

var game = new Phaser.Game(512, 512, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var tilemap = WFC(false, 16, 16, tileset_info);

function preload () {

    //Testing
    game.load.image('maleSpriteSheet', 'assets/sprites/Male_SpriteSheet.png');
    game.load.image('testSpriteSheet', 'assets/sprites/test.png');

    //Shaders
    game.load.shader('TileMapFrag', 'assets/shaders/TileMap.frag');
    game.load.shader('TileMapVert', 'assets/shaders/TileMap.vert');
    game.load.shader('TestUV', 'assets/shaders/TestUV.frag');

    //Character sprites
    game.load.image('player', 'assets/sprites/PlayerSample.png')
    game.load.image('NPC', 'assets/sprites/PlayerSample2.png')

    //Assorted sprites
    game.load.image('door', 'assets/sprites/door.png')
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    
    //Tilemaps
    // game.load.image('RPGTown33x32', '/assets/tilesets/RPGTown32x32.png');
    game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png');

    game.load.tilemap('testPCG', null, pcg_tilemap, Phaser.Tilemap.TILED_JSON)

    //UI
    game.load.image('testDialogueBox', 'assets/sprites/ui/testDialogueBox.png')
    game.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71)

}

function create () {
    game.stage.backgroundColor = '#ccc';
    let map = game.add.tilemap('testPCG');
    map.addTilesetImage(map.tilesets[0].name, map.tilesets[0].name);

    let layer = map.createLayer(0);
    layer.fixedToCamera = false;
    // move layer in y direction to make room for selector
    layer.position.setTo(0, selectorY*tileSize);

    // Creates editor selection
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    layer.resizeWorld();
    // console.log(map, pcg_tilemap);
}

function update() {
    // TODO: add player movement mechanics
    console.log(game.keyboard.lastKey);
    

}


// look at this lovely hack
function handler() {
    // recreate game when button clicked

    if(game) {
        game.destroy();
        game = null;

        WFCTest = new WFC(false, tileNum, tileNum, test_json);
        pcg_tilemap = WFCTest.getTiled2dmap();
        selectorY = Math.ceil(pcg_tilemap.tilesets[0].tilecount/pcg_tilemap.height);    // number of rows of tiles
        worldWidth = tileSize * tileNum;   // x size of world (pixels)
        worldLength = tileSize * (tileNum+selectorY);     // y size of world (pixels)

        game = new Phaser.Game({
            width:          worldWidth, 
            height:         worldLength,
            renderer:       Phaser.AUTO,
            parent:         "",
            enableDebug:    false,
            state:          {
                    preload:        preload,
                    create:         create,
                    update:         update
            },
        });
        console.log(typeof map);
        editor = new Editor(tileNum, tileSize, selectorY);
        create();
    } else {
        console.log('no game')
    }
}