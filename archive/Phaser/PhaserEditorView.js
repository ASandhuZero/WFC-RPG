var currentTile = 0;
var bmd;
var map;
var layer;
var cursors;
var facing = 'left';
var jumpTimer = 0;
var jumpButton;


export class EditorView {
    constructor(tileNum, tileSize, height) {
        this.currentTileMarker = 0;
        this.tileNum = tileNum;
        this.tileSize = tileSize;
        this.selectorHeight = height;
    }

    Create(game, wfcMap, layer) {
        this.changedTileArray = new Array();
        this.Game = game;
        this.layer = layer;
        this.wfcMap = wfcMap;
        //  Creates a blank tilemap
        map = game.add.tilemap();
    
        // Adds tileset for tile selection
        map.addTilesetImage(wfcMap.tilesets[0].name, wfcMap.tilesets[0].name);
        
        map.create('level1', this.tileNum, this.tileNum + this.selectorHeight, this.tileSize, this.tileSize);
        let area = new Phaser.Rectangle(0, 0, this.tileSize * this.tileNum, this.tileSize * this.selectorHeight);
        
        bmd = game.make.bitmapData(this.tileSize * this.tileNum, this.tileSize * this.selectorHeight);
        bmd.addToWorld();
        
        var i = 0;
        for (var n = 0; n < this.selectorHeight; n++) {
            for (var m = 0; m < this.tileNum; m++) {
                map.putTile(i, m, n, layer);
                i++;                
            }
        }
    
    
    
        map.setCollisionByExclusion([0]);
    
        //  Create tile selector at the top of the screen
        this.CreateTileSelector(this.Game);
    
        // player = this.Game.add.sprite(64, 100, 'dude');
        // this.Game.physics.arcade.enable(player);
        // this.Game.physics.arcade.gravity.y = 350;
    
        // player.body.bounce.y = 0.1;
        // player.body.collideWorldBounds = true;
        // player.body.setSize(20, 32, 5, 16);
    
        // player.animations.add('left', [0, 1, 2, 3], 10, true);
        // player.animations.add('turn', [4], 20, true);
        // player.animations.add('right', [5, 6, 7, 8], 10, true);
    
        // cursors = this.Game.input.keyboard.createCursorKeys();
        // jumpButton = this.Game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
        this.Game.input.addMoveCallback(this.UpdateMarker, this);
    
    }
    
    Update(game, player) {
        game.physics.arcade.collide(player, layer);
    
        player.body.velocity.x = 0;
    
        if (cursors.left.isDown)
        {
            player.body.velocity.x = -150;
    
            if (facing != 'left')
            {
                player.animations.play('left');
                facing = 'left';
            }
        }
        else if (cursors.right.isDown)
        {
            player.body.velocity.x = 150;
    
            if (facing != 'right')
            {
                player.animations.play('right');
                facing = 'right';
            }
        }
        else
        {
            if (facing != 'idle')
            {
                player.animations.stop();
    
                if (facing == 'left')
                {
                    player.frame = 0;
                }
                else
                {
                    player.frame = 5;
                }
    
                facing = 'idle';
            }
        }
        
        if (jumpButton.isDown && player.body.onFloor() && game.time.now > jumpTimer)
        {
            player.body.velocity.y = -250;
            jumpTimer = game.time.now + 750;
        }
    
    }
    
    PickTile(sprite, pointer, game) {
        // console.log('pick tile');
        var x = this.Game.math.snapToFloor(pointer.x, this.tileSize, 0);
        var y = this.Game.math.snapToFloor(pointer.y, this.tileSize, 0);
    
        this.currentTileMarker.x = x;
        this.currentTileMarker.y = y;
    
        x /= this.tileSize;
        y /= this.tileSize;
    
        currentTile = x + (y * this.tileNum);
    
        // console.log(currentTile);
    }
    
    CreateTileSelector(game) {
    
        //  Our tile selection window
        var tileSelector = game.add.group();
    
        var tileSelectorBackground = game.make.graphics();
        tileSelectorBackground.beginFill(0x000000, 0.3);
        tileSelectorBackground.drawRect(0, 0, this.tileSize*this.tileNum, this.tileSize*this.selectorHeight);
        tileSelectorBackground.endFill();
    
        tileSelector.add(tileSelectorBackground);
    
        var tileStrip = tileSelector.create(1, 1, bmd);
        tileStrip.inputEnabled = true;
        tileStrip.events.onInputDown.add(this.PickTile, this);
    
        //  Our painting marker
        this.marker = game.add.graphics();
        this.marker.lineStyle(2, 0x000000, 1);
        this.marker.drawRect(0, 0, this.tileSize, this.tileSize);
    
        //  Our current tile marker
        this.currentTileMarker = game.add.graphics();
        this.currentTileMarker.lineStyle(1, 0xffffff, 2);
        this.currentTileMarker.drawRect(0, 0, this.tileSize, this.tileSize);
    
        // console.log(this.currentTileMarker)
    
        tileSelector.add(this.currentTileMarker);
    
    
    }
    
    UpdateMarker() {
        this.marker.x = this.layer.getTileX(this.Game.input.activePointer.worldX) * this.tileSize;
        this.marker.y = this.layer.getTileY(this.Game.input.activePointer.worldY) * this.tileSize;
        if (this.Game.input.mousePointer.isDown && this.marker.y >= this.tileSize*this.selectorHeight)
        {
            this.wfcMap.removeTile(this.layer.getTileX(this.marker.x), this.layer.getTileY(this.marker.y-(this.tileSize*this.selectorHeight)), this.layer);
            map.putTile(currentTile, this.layer.getTileX(this.marker.x), this.layer.getTileY(this.marker.y), this.layer);
            
            // Calculates the index of tile changed in map
            var arrayIndex = this.layer.getTileX(this.marker.x) + (this.layer.getTileY(this.marker.y)-this.selectorHeight) * this.tileNum;
            
            // Create array of tiles placed and index position of placed tile on map pair
            var changedTileObject = new Object();
            let tilePlaced = map.getTile(this.layer.getTileX(this.marker.x), this.layer.getTileY(this.marker.y));
            changedTileObject.tile = tilePlaced.index;   // tile placed
            changedTileObject.index = arrayIndex; // index position of placed tile on map
            this.changedTileArray.push(changedTileObject);
            // console.log(this.changedTileArray);
        }
    }
    
    GetChangedTilePair() {
        return this.changedTileArray;
    }
}