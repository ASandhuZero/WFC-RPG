import * as Manager from "./Managers/Managers"

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