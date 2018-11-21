import {Model} from './Model';

export class SimpleTiledModel extends Model {
    constructor(periodic, subset_name,width, height, tileset_info, constraints_json) {
        super(width, height);
        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tileset_info = tileset_info ? tileset_info : this._throw("No tile json has been passed to SimpleTiled.") ;
        
        this.tiles_info = this.tileset_info.tiles;
        this.neighbors_info = this.tileset_info.neighbors;
        this.tiles = [];
        this.tiles_symmetries = {};
        this.occurrences = {};
        this.unique_occurrences = {};
        this.tempStationary = [];
        this.constraints = constraints_json;
        
        this.tilesize = this.tileset_info.tilesize ? this.tileset_info.tilesize : 32;
        this.unique = false; // have no clue what this does

        this.subsets = this.tileset_info.subsets;

        this.SimpleInit();
    }
    SimpleInit() {
        this.InitTileSymmetry();
        this.InitPropagator();
    }
    InitTileSymmetry() {
        let tile, cardinality, new_tile, is_unique_tile;

        let tile_id = 0;
        for (let i = 0; i < this.tiles_info.length; i++) {
            tile = this.tiles_info[i];
            switch(tile.symmetry) {
            case 'L':
                cardinality = 4;
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,1,2,3,1,0,3,2],
                    '1' : [1,2,3,1,0,3,2,0],
                    '2' : [2,3,1,0,3,2,0,1],
                    '3' : [3,1,0,3,2,0,1,2]
                }
                break;
            case 'T':
                cardinality = 4;
                
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,1,2,3,0,3,2,1],
                    '1' : [1,2,3,0,3,2,1,0],
                    '2' : [2,3,0,3,2,1,0,1],
                    '3' : [3,0,3,2,1,0,1,2]
                }
                break;
            case 'I':
                cardinality = 2;
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,1,0,1,0,1,0,1],
                    '1' : [1,0,1,0,1,0,1,0]
                }
                break;
            case '\\':
                cardinality = 2;
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,1,0,1,1,0,1,0],
                    '1' : [1,0,1,1,0,1,0,0]
                }
                break;
            case 'X': 
                cardinality = 1;
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,0,0,0,0,0,0,0]
                }
                break;
            default: // Tiles with no manually assigned symmetries will default to X sym.
                this._warning("symmetry for tile " + tile.name + "is not set! Setting symmetry to default symmetry of X. Please change symmetry.")
                cardinality = 1;
                tiles[tile.name] = {
                    '0' : [0,0,0,0,0,0,0,0]
                }
                break;
            }
            for (let j = 0; j < cardinality; j++) {
                new_tile = tile.name + ' ' + j.toString(); // tile name and rotation.
                this.tiles.push(new_tile);
                this.tempStationary.push(tile.weight || 1);
                is_unique_tile = j == 0 ? true : false;
                
                this.occurrences[new_tile] = {
                    is_unique_tile : is_unique_tile,
                    tile_id : tile_id
                }
                if (is_unique_tile) {
                    this.unique_occurrences[new_tile] = {
                        tile_id : i
                    }
                }
                tile_id = tile_id + 1;
            }
        }
        this.weights = this.tempStationary;
    }

    InitPropagator() {
        let sparse_propagator, propagator, neighbors;
        let left, L_id, L;
        let right, R_id, R;
        let up, U_id, U;
        let down, D_id, D;

        this.propagator = new Array(4);
        propagator = new Array(4);
        for (let d = 0; d < 4; d++) { // d is for direction.
            this.propagator[d] = new Array(this.tiles.length); // all the tiles. We are reaching that superposition stuff
            propagator[d] = new Array(this.tiles.length); // all the tiles. We are reaching that superposition stuff
            for (let t = 0; t < this.tiles.length; t++) {
                this.propagator[d][t] = new Array(this.tiles.length); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
                propagator[d][t] = new Array(this.tiles.length).fill(false); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
            }
        }
        for (let n = 0; n < this.neighbors_info.length; n++) { // n is for neighbor object
            neighbors = this.neighbors_info[n];

            left = neighbors["left"].split(/[ ]+/).filter(function(x) { return x.trim() !== ''});
            right = neighbors["right"].split(/[ ]+/).filter(function(x) { return x.trim() !== ''});;
            L_id = this.occurrences[neighbors["left"]].tile_id;
            R_id = this.occurrences[neighbors["right"]].tile_id;
            L = this.tiles_symmetries[left[0]][left[1]];
            R = this.tiles_symmetries[right[0]][right[1]];
            down = [left[0], L[1].toString()];
            up = [right[0], R[1].toString()];
            D_id = this.occurrences[down[0] + ' ' + down[1]].tile_id; //geting string name of tile
            U_id = this.occurrences[up[0] + ' ' + up[1]].tile_id;
            D = this.tiles_symmetries[left[0]][L[1]];
            U = this.tiles_symmetries[right[0]][R[1]];

            propagator[0][R_id + R[0]][L_id + L[0]] = true;
            propagator[0][R_id + R[6]][L_id + L[6]] = true;
            propagator[0][L_id + L[4]][R_id + R[4]] = true;
            propagator[0][L_id + L[2]][R_id + R[2]] = true;
            propagator[1][U_id + U[0]][D_id + D[0]] = true;
            propagator[1][D_id + D[6]][U_id + U[6]] = true;
            propagator[1][U_id + U[4]][D_id + D[4]] = true;
            propagator[1][D_id + D[2]][U_id + U[2]] = true;
        }
        for (let t = 0; t < this.tiles.length; t++) {
            for (let t2 = 0; t2 < this.tiles.length; t2++) {
                propagator[2][t][t2] = propagator[0][t2][t];
                propagator[3][t][t2] = propagator[1][t2][t];
            }
        }
        
        sparse_propagator = new Array(4);
        for (let d = 0; d < 4; d++) {
            sparse_propagator[d] = new Array(4);
            for (let t = 0; t < this.tiles.length; t++) {
                sparse_propagator[d][t] = [];
            }
        }
        for (let d = 0; d < 4; d++) {
            for (let t = 0; t < this.tiles.length; t++) {
                let sp = sparse_propagator[d][t];
                let p = propagator[d][t]

                for (let t1 = 0; t1 < this.tiles.length; t1++) {
                    if (p[t1]) {
                        sp.push(t1);
                    }
                }
                this.propagator[d][t] = sp;
            }
        }
    }
    GenerateTileMap(seed, limit) {
        this.Run(seed, limit);
        let array = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let a = this.wave[x + y * this.height];
                
                let amount = 0;
                for (let i = 0; i < a.length; i++) {
                    if (a[i]) {
                        amount += 1;
                    }
                }
                if (amount == this.tiles.length) {
                    console.log(amount)
                    this._warning("It seems the wave might not be observed.")
                } else {
                    for (let t = 0; t < this.tiles.length; t++) {
                        if (a[t]) {
                            console.log(this.tiles[t])
                            array.push(this.tiles[t]);
                        }
                    }
                }
            } 
        }
        console.log(array);
        return array;
    }
    OnBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.width || y >= this.height);
    }
    _warning(string) {
        console.warn(string);
    }
    _throw(string) {
        throw string;
    }
}