import * as Phaser from 'phaser'
import * as spriteAssetKey from 'assets/spriteAssetKey.json!json';
import {Editor} from "Editor";
import {SimpleTiledModel} from './Model//WaveFunctionCollapse/SimpleTiledModel'
import * as tileset_info from "./Model/WaveFunctionCollapse/tile_info.json!json"


// var jsA = []
// var item_num = [0, 1, 2]
// for (let i = 0; i < 100; i++) {
//     for (let k = 0; k < 100; k++) {
//         if (i == k) {
//             continue
//         }
//         let item_s = item_num[Math.floor(Math.random() * item_num.length)].toString()
//         let js = {
//             "left" : i.toString() + " 0" + " " + item_s, "right": k.toString() + " 0" + " 0" 
//         }
//         jsA.push(js);
//     }
// }

// console.log(JSON.stringify(jsA))

// debugger
var game = new Phaser.Game(512, 512, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var editor;
var model = new SimpleTiledModel(false, "item", 10, 10, tileset_info, null);
var tilemap = model.GenerateTileMap(10,0);
var i = 0;


while (tilemap[0] == undefined) {
    tilemap = model.GenerateTileMap(10, 0);
    if (i == 1) {
        throw "10 passes and still nothing."
    }
    i++;
}
debugger;

editor = new Editor();
function preload () {
//   editor.Preload(game);
  //Testing
    game.load.image('lil', 'assets/Lil_Prom.png')
    // game.load.image('maleSpriteSheet', 'assets/sprites/Male_SpriteSheet.png');
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

    //Tilemaps
    // game.load.image('RPGTown32x32', '/assets/tilesets/RPGTown32x32.png');
    game.load.image('Town_A', 'assets/tilesets/wolfsong/Town_A.png');
    game.load.image('Town_B', 'assets/tilesets/wolfsong/Town_B.png');
    game.load.image('City_A', 'assets/tilesets/wolfsong/City_A.png');
    game.load.image('City_B', 'assets/tilesets/wolfsong/City_B.png');
    game.load.image('Interior_A', 'assets/tilesets/wolfsong/Interior_A.png');
    game.load.image('Interior_B', 'assets/tilesets/wolfsong/Interior_B.png');
    game.load.image('FF_Set_1', 'assets/tilesets/wolfsong/FF_Set_1.png');
    game.load.image('Streets01b', 'assets/tilesets/wolfsong/Streets01b.png');
    game.load.image('BlackForest_A', 'assets/tilesets/wolfsong/BlackForest_A.png');
    game.load.image('Forests_B', 'assets/tilesets/wolfsong/Forests_B.png');

    game.load.tilemap('testPCG', null, pcg_tilemap, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('turnipFarm', 'assets/tilemaps/turnipFarm.json', null, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('turniptown', 'assets/tilemaps/turniptown.json', null, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('turniptown2', 'assets/tilemaps/turniptown2.json', null, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('town', 'assets/tilemaps/town.json', null, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('pubInterior', 'assets/tilemaps/pubInterior.json', null, Phaser.Tilemap.TILED_JSON)
    game.load.tilemap('shopInterior', 'assets/tilemaps/shopInterior.json', null, Phaser.Tilemap.TILED_JSON)

    //UI
    game.load.image('testDialogueBox', 'assets/sprites/ui/testDialogueBox.png')
    game.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71)



}

function create () {
    editor.Create(game)
    let map = game.add.tilemap('testPCG')    

    map.addTilesetImage(map.tilesets[0].name, map.tilesets[0].name)
    // map.addTilesetImage('Town_A', 'Town_A')
    // map.addTilesetImage('Town_B', 'Town_B')
    // map.addTilesetImage('City_A', 'City_A')
    // map.addTilesetImage('City_B', 'City_B')
    // map.addTilesetImage('Interior_A', 'Interior_A')
    // map.addTilesetImage('Interior_B', 'Interior_B')
    // map.addTilesetImage('FF_Set_1', 'FF_Set_1')
    // map.addTilesetImage('Streets01b', 'Streets01b')
    // map.addTilesetImage('BlackForest_A', 'BlackForest_A')
    // map.addTilesetImage('Forests_B', 'Forests_B')
    let layer = map.createLayer(0);
    layer.resizeWorld();
    console.log(map, pcg_tilemap);
}

function update() {
    // TODO: add player movement mechanics
    console.log(game.keyboard.lastKey);
    

    // editor.Update(game);
}