<<<<<<< HEAD
import { SimpleTiledModel } from "../WaveFunctionCollapse/SimpleTiledModel";

var model = new SimpleTiledModel(false, "item", 10, 10, tileset_info, null);
var tilemap = model.GenerateTileMap(10,0);
var i = 0;
var jsA = []
for (let i = 0; i < 256; i++) {
    let r = i + 1;
    r = r % 255;
    let js = {
        "left":i.toString(), "right": r.toString()
    }
    jsA.push(js)
}
console.log(JSON.stringify(jsA))
debugger;
while (tilemap[0] == undefined) {
    tilemap = model.GenerateTileMap(10, 0);
    if (i == 100) {
        throw "100 passes and still nothing."
    }
    i++;
}
debugger;
debugger;   


export class WFC {
    constructor(periodic, height, width, tile_json, constraints_json = null) {
        
        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tile_json = tile_json;
        this.constraints = constraints_json;
        
        console.log(this.periodic);
        console.log(this.height);
        console.log(this.width);
        console.log(this.constraints_json);
        console.log(this.tile_json);

        this.stationary = [];
        // this.subsets = this.tile_json.subsets;

        this.tile_occurrence = {}; // Object: tile_name (string) : occurrence (int)
        this.unique_tile_occurrence = {}; // Same as this.tile_occurrence, just takes into account rotations.

        this.tile_names = []; // array of tile_names, used to index tile_occurrence
        
        [this.tiles, this.tile_amount] = this.InitializeTiles();
        this.propagator = this.InitializePropagator();

        [this.wave, this.changes] = this.InitializeWave();
        
        this.FillPropagator();
        
        this.tilemap = this.Generate();
        this.tilemap = this.CreateTiledJson(); // TODO: This seems bad
        this.tiled2dmap = this.WriteToFile(); // Sometimes God hides in their heaven from monsters and this is one.
        // console.log(this.tilemap);
        
        // debugger;
        // this.WriteToFile();
    }
    getTilemap() {
        return this.tilemap;
    }
    getTiled2dmap() {
        return this.tiled2dmap;
    }
    Generate() {
        let tilemap;
        this.Clear();
        for (let i = 0; i < 100; i++) {
            this.SingleIteration();
            // debugger;
            tilemap = this.GenerateTilemap();
            if (tilemap.length = this.width * this.height) {
                return tilemap;
            }
        }
        console.log("Could not find a possible solution.");
        
    }
    InitializePropagator() {
        let propagator = new Array(4);
        for (let i = 0; i < 4; i++) {
            propagator[i] = new Array(this.tile_amount);
            for (let j = 0; j < this.tile_amount; j++) {
                propagator[i][j] = new Array(this.tile_amount);
                for (let k = 0; k < this.tile_amount; k++) {
                    propagator[i][j][k] = false;
                }
            }
        }
        return propagator;
    }

    InitializeTiles() {
        let cardinality = 0;
        let tiles = {};
        let tile_array = this.tile_json.tiles;
        let tile_amount = 0;
        let tile;

        for (let i = 0; i < tile_array.length; i++) {
            tile = tile_array[i];
            this.tile_occurrence[tile.name] = i;
            switch(tile.symmetry) {
                case 'L':
                    cardinality = 4;
                    tiles[tile.name] = {
                        '0' : [0,1,2,3,1,0,3,2],
                        '1' : [1,2,3,1,0,3,2,0],
                        '2' : [2,3,1,0,3,2,0,1],
                        '3' : [3,1,0,3,2,0,1,2]
                    }
                    break;
                case 'T':
                    cardinality = 4;
                    
                    tiles[tile.name] = {
                        '0' : [0,1,2,3,0,3,2,1],
                        '1' : [1,2,3,0,3,2,1,0],
                        '2' : [2,3,0,3,2,1,0,1],
                        '3' : [3,0,3,2,1,0,1,2]
                    }
                    break;
                case 'I':
                    cardinality = 2;
                    tiles[tile.name] = {
                        '0' : [0,1,0,1,0,1,0,1],
                        '1' : [1,0,1,0,1,0,1,0]
                    }
                    break;
                case '\\':
                    cardinality = 2;
                    tiles[tile.name] = {
                        '0' : [0,1,0,1,1,0,1,0],
                        '1' : [1,0,1,1,0,1,0,0]
                    }
                    break;
                case 'X': // Tiles with no manually assigned symmetries will default to X sym.
                default:
                    cardinality = 1;
                    tiles[tile.name] = {
                        '0' : [0,0,0,0,0,0,0,0]
                    }
                    break;
            }
            for (let i = 0; i < cardinality; i++) {
                let T = tile.name + ' ' + i.toString(); // tile name and rotation.
                this.unique_tile_occurrence[T] = tile_amount;
                this.tile_names.push(T);
                this.stationary.push(tile.weight || 1);
                tile_amount++;
            }
        }
        this.weights = this.stationary;
        debugger
        return [tiles, tile_amount]
    }
    /**
     * CreateWave
     * Creates the wave for Wave Function Collapse. 
     * The wave itself is an array of boolean matrices with the booleans set to
     * true.
     * Each array element is a possible state of the tilemap.
     */
    InitializeWave() {
        let wave = new Array(this.height);
        let changes = new Array(this.height);
        
        for (let y = 0; y < this.height; y++) {
            wave[y] = new Array(this.width);
            changes[y] = new Array(this.width);

            for (let x = 0; x < this.width; x++) {
                wave[y][x] = new Array(this.tile_amount);
                changes[y][x] = false;

                for(let k = 0; k < this.tile_amount; k++) {
                    wave[y][x][k] = true;
                }
            }
        }
        return [wave, changes];
    }
    FillPropagator() {
        let neighbor_array = this.tile_json.neighbors;
        let neighbor;
        let L_tile, L_name, L_rotation, L_rotations, L_index;
        let R_tile, R_name, R_rotation, R_rotations, R_index;
        
        for (let i = 0; i < neighbor_array.length; i++) {
            neighbor = neighbor_array[i]
            
            L_tile = neighbor['left'];
            L_tile = L_tile.split(/[ ]+/).filter(function(x) { return x.trim() !== ''}); 
            [L_name, L_rotation] = L_tile;

            if (L_rotation === undefined) {
                L_rotation = '0';
            }
            L_tile = L_name + ' ' + L_rotation;
            L_rotations = this.tiles[L_name][L_rotation];
            L_index = this.unique_tile_occurrence[L_tile];

            R_tile = neighbor['right'];
            R_tile = R_tile.split(/[ ]+/).filter(function(x) { return x.trim() !== ''});
            [R_name, R_rotation] = R_tile;

            if (R_rotation === undefined) {
                R_rotation = '0';
            }
            R_tile = R_name + ' ' + R_rotation;
            R_rotations = this.tiles[R_name][R_rotation];
            R_index = this.unique_tile_occurrence[R_tile];

            // TODO: Figure out a way so this check doesn't need to exist
            if (L_rotations === undefined || R_rotations === undefined) {
                continue;
            }

            let L = L_rotations;
            let D = this.tiles[L_name][L[1]];
            let D_index = this.unique_tile_occurrence[L_name + ' ' + 0];
            let R = R_rotations;
            let U = this.tiles[R_name][R[1]];
            let U_index = this.unique_tile_occurrence[R_name + ' ' + 0];
            
            this.propagator[0][R_index + R[0]][L_index + L[0]] = true;
            this.propagator[0][R_index + R[6]][L_index + L[6]] = true;
            this.propagator[0][L_index + L[4]][R_index + R[4]] = true;
            this.propagator[0][L_index + L[2]][R_index + R[2]] = true;

            this.propagator[1][U_index + U[0]][D_index + D[0]] = true;
            this.propagator[1][D_index + D[6]][U_index + U[6]] = true;
            this.propagator[1][U_index + U[4]][D_index + D[4]] = true;
            this.propagator[1][D_index + D[2]][U_index + U[2]] = true;
        }
        for (let t = 0; t < this.tile_amount; t++) {
            for (let t2 = 0; t2 < this.tile_amount; t2++) {
                this.propagator[2][t][t2] = this.propagator[0][t2][t];
                this.propagator[3][t][t2] = this.propagator[1][t2][t];
            }
        }
    }

    /**
     * TODO:
     */
    ObserveEntropy() {
        let distribution = new Array(this.tile_amount);
        let min = 1000;
        let argminx = -1;
        let argminy = -1;
        let wave_elem, sum, entropy, noise, random_index;
        for (let x = 0; x < this.width; x++) {
            wave_elem = this.wave[x];

            for (let y = 0; y < this.height; y++) {

                sum = 0;

                for (let t = 0; t < this.tile_amount; t++) {
                    let tile_bool = wave_elem[y][t];
                    distribution[t] = tile_bool ? this.stationary[t] : 0;
                    sum += distribution[t];
                    
                }
                if (sum === 0) {
                    return false;
                }

                for (let k = 0; k < this.tile_amount; k++) {
                    distribution[k] /= sum;
                }

                entropy = 0;

                // Used to calculute entropy. 
                // To better understand this segment of code, please look at
                // Shannon entropy formula, since this is the formula. 
                for (let k = 0; k < distribution.length; k++) {

                    if (distribution[k] > 0) {
                        entropy += -distribution[k] * Math.log(distribution[k]);
                    } 
                }

                noise = 0.000001 * Math.random();

                if (entropy > 0 && entropy + noise < min) {
                    min = entropy + noise;
                    argminx = x; //TODO: better understand this. Why noise?
                    argminy = y;
                }
            }
        }

        if (argminx === -1 && argminy === -1) {
            return true;
        }

        for (let t = 0; t < this.tile_amount; t++) {
            distribution[t] = this.wave[argminx][argminy][t] ? this.stationary[t] : 0;
        }

        random_index = this.RandomIndex(distribution);

        for (let t = 0; t < this.tile_amount; t++) {
            this.wave[argminx][argminy][t] = (t === random_index); // THIS IS THE BREAD AND BUTTER BABY. WHERE THE TRUE AND FALSE HAPPENS.
        }

        this.changes[argminx][argminy] = true;
        return null;
    }

    SingleIteration() {
        let result = this.ObserveEntropy();
        
        if (result !== null) {
            return !!result;
        }
        while (this.Propagate()) {}
        
        return null;
    }

    Propagate() {
        let change = false;
        let wave1, wave2, b, prop, x, y;

        for (let dx = 0; dx < this.width; dx++) {
            for (let dy = 0; dy < this.height; dy++) {
                for (let d = 0; d < 4; d++) {
                    x = dx;
                    y = dy;
                    // These are hardcoded rules for the propagator arrays...
                    if (d === 0) {
                        if (dx === 0) { 
                            if (!this.periodic) {
                                continue
                            } else {
                                x = this.width - 1;
                            }
                        } else {
                            x = dx - 1;
                        }
                    } else if (d === 1) {
                        if (dy === this.height - 1) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                y = 0;
                            }
                        } else {
                            y = dy + 1;
                        }
                    } else if (d === 2) {
                        if (dx === this.width - 1 ) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                x = 0;
                            }
                        } else {
                            x = dx + 1;
                        }
                    } else {
                        if (dy === 0) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                y = this.height - 1;
                            }
                        } else {
                            y = dy - 1;
                        }
                    }
                    // rules end for propagator stuff.

                    if (!this.changes[x][y]) {
                        continue;
                    }

                    // the two waves that will be used.
                    wave1 = this.wave[x][y];
                    wave2 = this.wave[dx][dy];
                    
                    Manager.Manager(wave2, this.constraints)
                    for (let t = 0; t < this.tile_amount; t++) {
                        if (wave2[t]) {
                            // Possible location of issue when it comes to I or T tiles.
                            prop = this.propagator[d][t];
                            b = false;
                            
                            for (let t1 = 0; t1 < this.tile_amount && !b; t1++) {
                                if (wave1[t1]) {
                                    b = prop[t1];
                                }
                            }
                            
                            if (!b) {
                                // console.log(prop);
                                // debugger;
                                wave2[t] = false;
                                this.changes[dx][dy] = true;
                                change = true;
                            }
                        }
                    }
                }
            }
        }
        return change;
    }

    GenerateTilemap() {
        let wave;
        let array = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                wave = this.wave[x][y];
                for (let t = 0; t < this.tile_amount; t++) {
                    if (wave[t]) {
                        array.push(t);
                        break;
                    }
                }
            }
            
        }
        return array;
    }

    Clear () {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let tile = 0; tile < this.tile_amount; tile++) {
                    this.wave[x][y][tile] = true;
                }
                this.changes[x][y] = false;
            }
        }
    }
    /**
     * 
     * RandomIndex
     * Gets back a random index using the distribution.
     * @param {array} distribution 
     */
    RandomIndex(distribution) {
        let sum = 0;
        let x = 0;

        for (let i = 0; i < distribution.length; i++) {
            sum += distribution[i];
        }

        if (sum === 0) {
            for (let i = 0; i < distribution.length; i++) {
                distribution[i] = 1;
            }
            sum = distribution.length;
        }

        for (let i = 0; i < distribution.length; i++) {
            distribution[i] /= sum;
        }

        for (let i = 0; i < distribution.length; i++) {
            x += distribution[i];
            if (Math.random() <= x) {
                return i;
            }
        }
        return 0;
    }

    CreateTiledJson() {
        let array_to_return = [];
        let tile_number, tile_name, name, rotation;
        for (let i = 0; i < this.tilemap.length; i++) {
            tile_number = this.tilemap[i];
            tile_name = this.tile_names[tile_number];
            [name, rotation] = tile_name.split(/[ ]+/);
            tile_number = this.tile_occurrence[name];
            tile_number = tile_number + 10; // TEST TODO:
            // remember to change this later.
            switch (rotation) {
                case '3':
                    array_to_return.push(tile_number + 0xA0000000);
                    break;
                case '2':
                    array_to_return.push(tile_number + 0xC0000000);
                    break;
                case '1':
                    array_to_return.push(tile_number + 0x60000000);
                    break;
                case '0':
                    tile_number = this.tile_occurrence[name];
                    array_to_return.push(tile_number);
                    break;
                default:
                    array_to_return.push(tile_number);
                    break;
            }
        }
        return array_to_return;
    }

    WriteToFile() {
        let json_to_file = {
            "height":this.height,
            "infinite": false,
            "layers":[
                {
                "data":this.tilemap,
                "height":this.height,
                "name":"Tile Layer 1",
                "opacity":1,
                "type":"tilelayer",
                "visible":true,
                "width":this.width,
                "x":0,
                "y":0
                }],
            "nextobjectid":1,
            "orientation":"orthogonal",
            "renderorder":"right-down",
            "tiledversion":"1.1.6",
            "tileheight":32,
            "tilesets":[
                {
                    "columns":8,
                    "firstgid":1,
                    "image":"../../assets/tilesets/wolfsong/BlackForest_A.png",
                    "imageheight":512,
                    "imagewidth":256,
                    "margin":0,
                    "name":"Town_A",
                    "spacing":0,
                    "tilecount":128,
                    "tileheight":32,
                    "tilewidth":32
                    }, 
            ],
            "tilewidth":32,
            "type":"map",
            "version":1,
            "width":this.width
            }
        return json_to_file;  // TODO: YEAH ALRIGHT NOT THE BEST SOLUTION, BUT AT LEAST IT IS ONE.

        // let a = document.createElement("a");
        // let json_string = JSON.stringify(json_to_file, null, 4);
        // let file = new Blob([json_string], {type: 'text/plain'});
        // a.href = URL.createObjectURL(file);
        // a.download = 'testJson.json';
        // a.click(); // wow what a terrible hack.
        
    }
}
||||||| merged common ancestors


var model = new SimpleTiledModel(false, "item", 10, 10, tileset_info, null);
var tilemap = model.GenerateTileMap(10,0);
var i = 0;
var jsA = []
for (let i = 0; i < 256; i++) {
    let r = i + 1;
    r = r % 255;
    let js = {
        "left":i.toString(), "right": r.toString()
    }
    jsA.push(js)
}
console.log(JSON.stringify(jsA))
debugger;
while (tilemap[0] == undefined) {
    tilemap = model.GenerateTileMap(10, 0);
    if (i == 100) {
        throw "100 passes and still nothing."
    }
    i++;
}
debugger;
debugger;   


export class WFC {
    constructor(periodic, height, width, tile_json, constraints_json = null) {
        
        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tile_json = tile_json;
        this.constraints = constraints_json;
        
        this.stationary = [];
        this.subsets = this.tile_json.subsets;

        this.tile_occurrence = {}; // Object: tile_name (string) : occurrence (int)
        this.unique_tile_occurrence = {}; // Same as this.tile_occurrence, just takes into account rotations.

        this.tile_names = []; // array of tile_names, used to index tile_occurrence
        
        [this.tiles, this.tile_amount] = this.InitializeTiles();
        this.propagator = this.InitializePropagator();

        [this.wave, this.changes] = this.InitializeWave();
        
        this.FillPropagator();
        
        this.tilemap = this.Generate();
        this.tilemap = this.CreateTiledJson(); // TODO: This seems bad
        this.tiled2dmap = this.WriteToFile(); // Sometimes God hides in their heaven from monsters and this is one.
        console.log(this.tilemap);
        
        // debugger;
        // this.WriteToFile();
    }
    getTilemap() {
        return this.tilemap;
    }
    getTiled2dmap() {
        return this.tiled2dmap;
    }
    Generate() {
        let tilemap;
        this.Clear();
        for (let i = 0; i < 100; i++) {
            this.SingleIteration();
            // debugger;
            tilemap = this.GenerateTilemap();
            if (tilemap.length = this.width * this.height) {
                return tilemap;
            }
        }
        console.log("Could not find a possible solution.");
        
    }
    InitializePropagator() {
        let propagator = new Array(4);
        for (let i = 0; i < 4; i++) {
            propagator[i] = new Array(this.tile_amount);
            for (let j = 0; j < this.tile_amount; j++) {
                propagator[i][j] = new Array(this.tile_amount);
                for (let k = 0; k < this.tile_amount; k++) {
                    propagator[i][j][k] = false;
                }
            }
        }
        return propagator;
    }

    InitializeTiles() {
        let cardinality = 0;
        let tiles = {};
        let tile_array = this.tile_json.tiles;
        let tile_amount = 0;
        let tile;

        for (let i = 0; i < tile_array.length; i++) {
            tile = tile_array[i];
            this.tile_occurrence[tile.name] = i;
            switch(tile.symmetry) {
                case 'L':
                    cardinality = 4;
                    tiles[tile.name] = {
                        '0' : [0,1,2,3,1,0,3,2],
                        '1' : [1,2,3,1,0,3,2,0],
                        '2' : [2,3,1,0,3,2,0,1],
                        '3' : [3,1,0,3,2,0,1,2]
                    }
                    break;
                case 'T':
                    cardinality = 4;
                    
                    tiles[tile.name] = {
                        '0' : [0,1,2,3,0,3,2,1],
                        '1' : [1,2,3,0,3,2,1,0],
                        '2' : [2,3,0,3,2,1,0,1],
                        '3' : [3,0,3,2,1,0,1,2]
                    }
                    break;
                case 'I':
                    cardinality = 2;
                    tiles[tile.name] = {
                        '0' : [0,1,0,1,0,1,0,1],
                        '1' : [1,0,1,0,1,0,1,0]
                    }
                    break;
                case '\\':
                    cardinality = 2;
                    tiles[tile.name] = {
                        '0' : [0,1,0,1,1,0,1,0],
                        '1' : [1,0,1,1,0,1,0,0]
                    }
                    break;
                case 'X': // Tiles with no manually assigned symmetries will default to X sym.
                default:
                    cardinality = 1;
                    tiles[tile.name] = {
                        '0' : [0,0,0,0,0,0,0,0]
                    }
                    break;
            }
            for (let i = 0; i < cardinality; i++) {
                let T = tile.name + ' ' + i.toString(); // tile name and rotation.
                this.unique_tile_occurrence[T] = tile_amount;
                this.tile_names.push(T);
                this.stationary.push(tile.weight || 1);
                tile_amount++;
            }
        }
        this.weights = this.stationary;
        debugger
        return [tiles, tile_amount]
    }
    /**
     * CreateWave
     * Creates the wave for Wave Function Collapse. 
     * The wave itself is an array of boolean matrices with the booleans set to
     * true.
     * Each array element is a possible state of the tilemap.
     */
    InitializeWave() {
        let wave = new Array(this.height);
        let changes = new Array(this.height);
        
        for (let y = 0; y < this.height; y++) {
            wave[y] = new Array(this.width);
            changes[y] = new Array(this.width);

            for (let x = 0; x < this.width; x++) {
                wave[y][x] = new Array(this.tile_amount);
                changes[y][x] = false;

                for(let k = 0; k < this.tile_amount; k++) {
                    wave[y][x][k] = true;
                }
            }
        }
        return [wave, changes];
    }
    FillPropagator() {
        let neighbor_array = this.tile_json.neighbors;
        let neighbor;
        let L_tile, L_name, L_rotation, L_rotations, L_index;
        let R_tile, R_name, R_rotation, R_rotations, R_index;
        
        for (let i = 0; i < neighbor_array.length; i++) {
            neighbor = neighbor_array[i]
            
            L_tile = neighbor['left'];
            L_tile = L_tile.split(/[ ]+/).filter(function(x) { return x.trim() !== ''}); 
            [L_name, L_rotation] = L_tile;

            if (L_rotation === undefined) {
                L_rotation = '0';
            }
            L_tile = L_name + ' ' + L_rotation;
            L_rotations = this.tiles[L_name][L_rotation];
            L_index = this.unique_tile_occurrence[L_tile];

            R_tile = neighbor['right'];
            R_tile = R_tile.split(/[ ]+/).filter(function(x) { return x.trim() !== ''});
            [R_name, R_rotation] = R_tile;

            if (R_rotation === undefined) {
                R_rotation = '0';
            }
            R_tile = R_name + ' ' + R_rotation;
            R_rotations = this.tiles[R_name][R_rotation];
            R_index = this.unique_tile_occurrence[R_tile];

            // TODO: Figure out a way so this check doesn't need to exist
            if (L_rotations === undefined || R_rotations === undefined) {
                continue;
            }

            let L = L_rotations;
            let D = this.tiles[L_name][L[1]];
            let D_index = this.unique_tile_occurrence[L_name + ' ' + 0];
            let R = R_rotations;
            let U = this.tiles[R_name][R[1]];
            let U_index = this.unique_tile_occurrence[R_name + ' ' + 0];
            
            this.propagator[0][R_index + R[0]][L_index + L[0]] = true;
            this.propagator[0][R_index + R[6]][L_index + L[6]] = true;
            this.propagator[0][L_index + L[4]][R_index + R[4]] = true;
            this.propagator[0][L_index + L[2]][R_index + R[2]] = true;

            this.propagator[1][U_index + U[0]][D_index + D[0]] = true;
            this.propagator[1][D_index + D[6]][U_index + U[6]] = true;
            this.propagator[1][U_index + U[4]][D_index + D[4]] = true;
            this.propagator[1][D_index + D[2]][U_index + U[2]] = true;
        }
        for (let t = 0; t < this.tile_amount; t++) {
            for (let t2 = 0; t2 < this.tile_amount; t2++) {
                this.propagator[2][t][t2] = this.propagator[0][t2][t];
                this.propagator[3][t][t2] = this.propagator[1][t2][t];
            }
        }
    }

    /**
     * TODO:
     */
    ObserveEntropy() {
        let distribution = new Array(this.tile_amount);
        let min = 1000;
        let argminx = -1;
        let argminy = -1;
        let wave_elem, sum, entropy, noise, random_index;
        for (let x = 0; x < this.width; x++) {
            wave_elem = this.wave[x];

            for (let y = 0; y < this.height; y++) {

                sum = 0;

                for (let t = 0; t < this.tile_amount; t++) {
                    let tile_bool = wave_elem[y][t];
                    distribution[t] = tile_bool ? this.stationary[t] : 0;
                    sum += distribution[t];
                    
                }
                if (sum === 0) {
                    return false;
                }

                for (let k = 0; k < this.tile_amount; k++) {
                    distribution[k] /= sum;
                }

                entropy = 0;

                // Used to calculute entropy. 
                // To better understand this segment of code, please look at
                // Shannon entropy formula, since this is the formula. 
                for (let k = 0; k < distribution.length; k++) {

                    if (distribution[k] > 0) {
                        entropy += -distribution[k] * Math.log(distribution[k]);
                    } 
                }

                noise = 0.000001 * Math.random();

                if (entropy > 0 && entropy + noise < min) {
                    min = entropy + noise;
                    argminx = x; //TODO: better understand this. Why noise?
                    argminy = y;
                }
            }
        }

        if (argminx === -1 && argminy === -1) {
            return true;
        }

        for (let t = 0; t < this.tile_amount; t++) {
            distribution[t] = this.wave[argminx][argminy][t] ? this.stationary[t] : 0;
        }

        random_index = this.RandomIndex(distribution);

        for (let t = 0; t < this.tile_amount; t++) {
            this.wave[argminx][argminy][t] = (t === random_index); // THIS IS THE BREAD AND BUTTER BABY. WHERE THE TRUE AND FALSE HAPPENS.
        }

        this.changes[argminx][argminy] = true;
        return null;
    }

    SingleIteration() {
        let result = this.ObserveEntropy();
        
        if (result !== null) {
            return !!result;
        }
        while (this.Propagate()) {}
        
        return null;
    }

    Propagate() {
        let change = false;
        let wave1, wave2, b, prop, x, y;

        for (let dx = 0; dx < this.width; dx++) {
            for (let dy = 0; dy < this.height; dy++) {
                for (let d = 0; d < 4; d++) {
                    x = dx;
                    y = dy;
                    // These are hardcoded rules for the propagator arrays...
                    if (d === 0) {
                        if (dx === 0) { 
                            if (!this.periodic) {
                                continue
                            } else {
                                x = this.width - 1;
                            }
                        } else {
                            x = dx - 1;
                        }
                    } else if (d === 1) {
                        if (dy === this.height - 1) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                y = 0;
                            }
                        } else {
                            y = dy + 1;
                        }
                    } else if (d === 2) {
                        if (dx === this.width - 1 ) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                x = 0;
                            }
                        } else {
                            x = dx + 1;
                        }
                    } else {
                        if (dy === 0) {
                            if (!this.periodic) {
                                continue;
                            } else {
                                y = this.height - 1;
                            }
                        } else {
                            y = dy - 1;
                        }
                    }
                    // rules end for propagator stuff.

                    if (!this.changes[x][y]) {
                        continue;
                    }

                    // the two waves that will be used.
                    wave1 = this.wave[x][y];
                    wave2 = this.wave[dx][dy];
                    
                    Manager.Manager(wave2, this.constraints)
                    for (let t = 0; t < this.tile_amount; t++) {
                        if (wave2[t]) {
                            // Possible location of issue when it comes to I or T tiles.
                            prop = this.propagator[d][t];
                            b = false;
                            
                            for (let t1 = 0; t1 < this.tile_amount && !b; t1++) {
                                if (wave1[t1]) {
                                    b = prop[t1];
                                }
                            }
                            
                            if (!b) {
                                // console.log(prop);
                                // debugger;
                                wave2[t] = false;
                                this.changes[dx][dy] = true;
                                change = true;
                            }
                        }
                    }
                }
            }
        }
        return change;
    }

    GenerateTilemap() {
        let wave;
        let array = []
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                wave = this.wave[x][y];
                for (let t = 0; t < this.tile_amount; t++) {
                    if (wave[t]) {
                        array.push(t);
                        break;
                    }
                }
            }
            
        }
        return array;
    }

    Clear () {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let tile = 0; tile < this.tile_amount; tile++) {
                    this.wave[x][y][tile] = true;
                }
                this.changes[x][y] = false;
            }
        }
    }
    /**
     * 
     * RandomIndex
     * Gets back a random index using the distribution.
     * @param {array} distribution 
     */
    RandomIndex(distribution) {
        let sum = 0;
        let x = 0;

        for (let i = 0; i < distribution.length; i++) {
            sum += distribution[i];
        }

        if (sum === 0) {
            for (let i = 0; i < distribution.length; i++) {
                distribution[i] = 1;
            }
            sum = distribution.length;
        }

        for (let i = 0; i < distribution.length; i++) {
            distribution[i] /= sum;
        }

        for (let i = 0; i < distribution.length; i++) {
            x += distribution[i];
            if (Math.random() <= x) {
                return i;
            }
        }
        return 0;
    }

    CreateTiledJson() {
        let array_to_return = [];
        let tile_number, tile_name, name, rotation;
        for (let i = 0; i < this.tilemap.length; i++) {
            tile_number = this.tilemap[i];
            tile_name = this.tile_names[tile_number];
            [name, rotation] = tile_name.split(/[ ]+/);
            tile_number = this.tile_occurrence[name];
            tile_number = tile_number + 10; // TEST TODO:
            // remember to change this later.
            switch (rotation) {
                case '3':
                    array_to_return.push(tile_number + 0xA0000000);
                    break;
                case '2':
                    array_to_return.push(tile_number + 0xC0000000);
                    break;
                case '1':
                    array_to_return.push(tile_number + 0x60000000);
                    break;
                case '0':
                    tile_number = this.tile_occurrence[name];
                    array_to_return.push(tile_number);
                    break;
                default:
                    array_to_return.push(tile_number);
                    break;
            }
        }
        return array_to_return;
    }

    WriteToFile() {
        let json_to_file = {
            "height":this.height,
            "infinite": false,
            "layers":[
                {
                "data":this.tilemap,
                "height":this.height,
                "name":"Tile Layer 1",
                "opacity":1,
                "type":"tilelayer",
                "visible":true,
                "width":this.width,
                "x":0,
                "y":0
                }],
            "nextobjectid":1,
            "orientation":"orthogonal",
            "renderorder":"right-down",
            "tiledversion":"1.1.6",
            "tileheight":32,
            "tilesets":[
                {
                    "columns":8,
                    "firstgid":1,
                    "image":"../../assets/tilesets/wolfsong/BlackForest_A.png",
                    "imageheight":512,
                    "imagewidth":256,
                    "margin":0,
                    "name":"Town_B",
                    "spacing":0,
                    "tilecount":128,
                    "tileheight":32,
                    "tilewidth":32
                    }, 
            ],
            "tilewidth":32,
            "type":"map",
            "version":1,
            "width":this.width
            }
        return json_to_file;  // TODO: YEAH ALRIGHT NOT THE BEST SOLUTION, BUT AT LEAST IT IS ONE.

        // let a = document.createElement("a");
        // let json_string = JSON.stringify(json_to_file, null, 4);
        // let file = new Blob([json_string], {type: 'text/plain'});
        // a.href = URL.createObjectURL(file);
        // a.download = 'testJson.json';
        // a.click(); // wow what a terrible hack.
        
    }
}
=======
import * as Constraints from "./Constraints/Constraints"

export function WFC(periodic, width, height, tileset_info) {
    let subsets_info = tileset_info["subsets"];
    let subsets = GenerateSubsets(subsets_info, width, height);
    let tile_amount = MaxTiles(subsets);
    let item_amount = MaxItems(subsets)
    let wave = GenerateWave(tile_amount, item_amount, width, height);
    let subset = subsets["No_items"]
    let tile_array = [];
    let result = null;

    Clear(wave, tile_amount, subsets);
    while (result == null) {
        result = Observe(wave, subset, tile_amount, tile_array, periodic, width, height);
        if (result) {
            let tiles = subset["tiles"].names
            let items = subset["items"].names
            debugger
            return GenerateTileMap(wave, tile_amount, item_amount, tiles, items, width, height)
        }
        Propagate(wave, tile_array, periodic, width, height, subset);
    }
    
}
function Clear(wave, tile_amount, subsets) {
    let opposite = [2, 3, 0, 1];
    let entries = Object.entries(subsets)
    for (let i = 0; i < wave.length; i++) {
        for (let t = 0; t < tile_amount; t++) {
            wave[i]["tiles"][t] = true;
        }
    }
    for (const [name, subset] of entries) {
        let tiles_info = subset["tiles"]
        for (let w = 0; w < wave.length; w++) {
            for (let t = 0; t < tiles_info.amount; t++) {
                for (let d = 0; d < 4; d++) {
                    tiles_info.compatible[w][t][d] = subset.neighbor_propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                }
            }
        }
        for (let t = 0; t < wave.length; t++) {
            tiles_info.sums_of_ones[t] = tiles_info.weights.length;
            tiles_info.sums_of_weights[t] = tiles_info.summed_weights;
            tiles_info.sums_of_log_weights[t] = tiles_info.summed_log_weights;
            tiles_info.entropies[t] = tiles_info.starting_entropy;
        }
    }

}
function GenerateTileMap(wave, tile_amount, item_amount, tiles, items, width, height) {
    let array = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let tile_elem = wave[x + y * height]["tiles"];
            let item_elem = wave[x + y * height]["items"];
            let amount = 0;
            for (let i = 0; i < tile_elem.length; i++) {
                if (tile_elem[i]) {
                    amount += 1;
                }
            }
            if (amount == tile_amount) {
                console.warn(amount)
            } else {
                for (let t = 0; t < tile_amount; t++) {
                    if (tile_elem[t]) {
                        for (let i = 0; i < item_amount; i++) {
                            if (item_elem[i]) {
                                array.push(tiles[t] + ' ' + items[i]);
                            }
                        }
                    }
                        // if (tile_elem[t]) {
                    //     for (let i = 0; i < tile_amount; i++) {
                    //         if (item_elem[i]) {
                    //             array.push(tiles[t] + ' ' + tiles[i]);
                    //         } 
                    //     }
                    // }
                }
            }
        } 
    }
    return array;
}
/**
 * GenerateSubsets
 *  Takes subset_info and creates subsets based off info.
 * @param {array} subsets_info 
 * @returns {object} subsets
 */
function GenerateSubsets(subsets_info, width, height) {
    let subsets = {}
    for (let i = 0; i < subsets_info.length; i++) {
        let subset_info = subsets_info[i]
        let tiles = Constraints.GenerateTiles(subset_info["tiles_info"], width, height);
        let items = Constraints.GenerateItems(subset_info["items_info"]);
        let neighbors = subset_info["neighbors"].length != 0 ? subset_info["neighbors"] :
                        Constraints.GetNeighbors(tiles)
        let neighbor_propagator = GeneratePropagator(neighbors, tiles, items)
        let subset = {
            "tiles": tiles,
            "items": items,
            "neighbors": neighbors,
            "neighbor_propagator": neighbor_propagator
        }
        subsets[subset_info["name"]] = subset;
    }
    return subsets;
}
/**
 * GeneratePropagator
 * @param {*} neighbors 
 * @param {*} tiles 
 * @param {*} items 
 * Returns a matrix of possible neighboring tiles.
 * @returns {object} locality_propagator    
 */
function GeneratePropagator(neighbors, tiles, items) {
    let sparse_propagator;
    let neighbor_pair;
    let left, right, L_ID, R_ID, L, R, D, U;

    let neighbor_tiles = neighbors.tiles;

    let locality_propagator = new Array(4)
    let propagator = new Array(4);
    
    let tile_names = tiles["names"];

    for (let d = 0; d < 4; d++) { // d is for direction.
        locality_propagator[d] = new Array(tile_names.length); // all the tiles. We are reaching that superposition stuff
        propagator[d] = new Array(tile_names.length); // all the tiles. We are reaching that superposition stuff
        for (let t = 0; t < tile_names.length; t++) {
            locality_propagator[d][t] = new Array(tile_names.length); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
            propagator[d][t] = new Array(tile_names.length).fill(false); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
        }
    }
    for (let i = 0; i < neighbor_tiles.length; i++) {
        neighbor_pair = neighbor_tiles[i];
        left = neighbor_pair.left
        right = neighbor_pair.right
        L_ID = tiles["IDs"][left];
        R_ID = tiles["IDs"][right]
        L = tiles["rotations"][L_ID];
        R = tiles["rotations"][R_ID];
        D = tiles["rotations"][L[1]];
        U = tiles["rotations"][R[1]];
        
        propagator[0][R[0]][L[0]] = true;
        propagator[0][R[6]][L[6]] = true;
        propagator[0][L[4]][R[4]] = true;
        propagator[0][L[2]][R[2]] = true;

        propagator[1][U[0]][D[0]] = true;
        propagator[1][D[6]][U[6]] = true;
        propagator[1][U[4]][D[4]] = true;
        propagator[1][D[2]][U[2]] = true;
    }
    for (let t = 0; t < tile_names.length; t++) {
        for (let t2 = 0; t2 < tile_names.length; t2++) {
            propagator[2][t][t2] = propagator[0][t2][t];
            propagator[3][t][t2] = propagator[1][t2][t];
        }
    }
    sparse_propagator = new Array(4);
    for (let d = 0; d < 4; d++) {
        sparse_propagator[d] = new Array(4);
        for (let t = 0; t < tile_names.length; t++) {
            sparse_propagator[d][t] = [];
        }
    }
    for (let d = 0; d < 4; d++) {
        for (let t = 0; t < tile_names.length; t++) {
            let sp = sparse_propagator[d][t];
            let p = propagator[d][t]

            for (let t1 = 0; t1 < tile_names.length; t1++) {
                if (p[t1]) {
                    sp.push(t1);
                }
            }
            locality_propagator[d][t] = sp;
        }
    }
    return locality_propagator;
}
/**
 * GenerateWave
 * @param {*} tile_amount 
 * @param {*} item_amount 
 * @param {*} width 
 * @param {*} height
 * @returns matrix with each element being a true boolean array size of tiles. 
 */
function GenerateWave(tile_amount, item_amount, width, height) {
    let wave = new Array(width * height)
    for (let i = 0; i < width * height; i++) {
        wave[i] = {
            "tiles" : new Array(tile_amount).fill(true),
            "items" : new Array(item_amount).fill(true)
        }
    }
    return wave;
}
/**
 * MaxTiles
 * @param {object} subsets 
 * @returns tile_amount max amount of tiles from all subsets.
 */
function MaxTiles(subsets) {    
    let entries = Object.entries(subsets)
    let tile_amount = 0;
    for (const [name, info] of entries) {
        let tiles_info = info["tiles"];
        if (tiles_info.amount > tile_amount) {
            tile_amount = tiles_info.amount;
        }
    }
    return tile_amount;
}
function MaxItems(subsets) {
    let entries = Object.entries(subsets)
    let item_amount = 0;
    for (const [name, info] of entries) {
        let items_info = info["items"];
        if (items_info.item_amount > item_amount) {
            item_amount = items_info.item_amount;
        }
    }
    return item_amount;
}
function Observe(wave, subset, tile_amount, tile_array, periodic, width, height) {
    let noise, amount, entropy;
    let min = 1000;
    let argmin = -1;
    let tiles_info = subset["tiles"];
    
    for (let i = 0; i < wave.length; i++) {
        if (OnBoundary(i % width, i / width, periodic, width, height)) {
            continue;
        }
        amount = tiles_info.sums_of_ones[i];
        if (amount == 0) {
            return false;
        }
        entropy = tiles_info.entropies[i];
        if (amount > 1 && entropy <= min) {
            // let noise = 0.000001 * this.random();
            noise = 0.000001;
            if (entropy + noise < min) {
                min = entropy + noise;
                argmin = i;
            }
        }
    }
    if (argmin == -1) {
        let observed = new Array(width * height);
        for (let i = 0; i <  wave.length; i++) {
            for (let t = 0; t < tile_amount; t++) {
                let wave_tiles = wave[i]["tiles"]
                if (wave_tiles[t]) {
                    observed[i] = t;
                    break;
                }
            }
        }
        return true;
    }
    let distribution = new Array(tiles_info.amount);
    let w = wave[argmin]["tiles"];
    for (let t = 0; t < tiles_info.amount; t++) {
        distribution[t] = w[t] ? tiles_info.weights[t] : 0;
        distribution[t] /= tiles_info.amount;
    }
    let r = _NonZeroIndex(distribution);
    for (let t = 0; t < tiles_info.amount; t++) {
        if (w[t] != (t == r)) {
            tile_array = BanTile(wave, tiles_info, argmin, t, tile_array);
            let items_info = subset["items"];
            BanItem(wave, items_info, argmin, null, null)
        }
    }
    return null;
}
function Propagate(wave, tile_array, periodic, width, height, subset) {
    let DX = [-1, 0, 1, 0];
    let DY = [0, 1, 0, -1];
    
    let tiles_info = subset["tiles"];
    while(tile_array.length > 0) {
        let e1 = tile_array.pop(); // element 1

        let index_1 = e1[0]; // Item 1
        let tile_1 = e1[1];
        let x1 = index_1 % width;
        let y1 = Math.floor(index_1 / width);
        
        for (let d = 0; d < 4; d++) {
            let dx = DX[d]; 
            let dy = DY[d];
            let x2 = x1 + dx;
            let y2 = y1 + dy;

            if (OnBoundary(x2, y2, periodic, width, height)) {
                continue;
            }

            if (x2 < 0) {
                x2 += width;
            } else if (x2 >= width) {
                x2 -= width;
            }

            if (y2 < 0) {
                y2 += height;
            } else if (y2 >= height) {
                y2 -= height;
            }

            let index_2 = x2 + y2 * width;  // Item 2
            let p = subset.neighbor_propagator[d][tile_1];
            let compat = tiles_info.compatible[index_2];
            for (let l = 0; l < p.length; l++) {
                let tile_2 = p[l] 
                let comp = compat[tile_2];
                comp[d] = comp[d] - 1;
                if (comp[d] == 0) {
                    tile_array = BanTile(wave, tiles_info, index_2, tile_2, tile_array);
                    let items_info = subset["items"];
                    BanItem(wave, items_info, index_2, null, null)
                }
            }
        }
    }
    return tile_array
}
function BanTile(wave, tiles_info, elem, tile, tile_array) {
    let tile_amount = tiles_info.amount;
    let wave_tile_array = wave[elem]["tiles"];
    for (let i = tile_amount; i < wave_tile_array.length; i++) {
        wave_tile_array[i] = false;
    }
    wave_tile_array[tile] = false;
    tiles_info.compatible[elem][tile] = [0,0,0,0];

    tile_array.push([elem, tile]);
    let sum = tiles_info.sums_of_weights[elem];
    tiles_info.entropies[elem] += tiles_info.sums_of_log_weights[elem] / sum - Math.log(sum);

    tiles_info.sums_of_ones[elem] -= 1;
    tiles_info.sums_of_weights[elem] -= tiles_info.weights[tile];
    tiles_info.sums_of_log_weights[elem] -= tiles_info.log_weights[tile];

    sum = tiles_info.sums_of_weights[elem];
    tiles_info.entropies[elem] -= tiles_info.sums_of_log_weights[elem] / sum - Math.log(sum);

    return tile_array;
}
function BanItem(wave, items_info, elem, item, item_array) {
    let item_amount = items_info.amount;
    let count = 0;
    let wave_item_array = wave[elem]["items"];
    for (let i = 0; i < wave_item_array.length; i++) {
        if (wave_item_array[i]) {
            count++;
        }
    }
    if (count == 1) {
        return
    }
    let index = Math.floor(Math.random()*wave_item_array.length);
    for (let i = 0; i < wave_item_array.length; i++) {
        if (i != index) {
            wave_item_array[i] = false;
        }
    }
}
function _NonZeroIndex(array) {
    let index = Math.floor(Math.random()*array.length);
    let elem = array[index];
    let zero_array = [];
    for (let i = 0; i < array.length; i++) {
        if (elem == 0) {
            zero_array.push(index);
        }
        if (zero_array.includes(index)) {
            index = Math.floor(Math.random()*array.length);
            elem = array[index];
        }
        else {
            return index;
        }
    }
}  
function OnBoundary(x, y, periodic, width, height) {
    return !periodic && (x < 0 || y < 0 || x >= width || y >= height);
}
>>>>>>> WFC
