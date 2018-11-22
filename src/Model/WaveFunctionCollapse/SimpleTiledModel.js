import {Model} from './Model';
import * as Constraints from "./Constraints/Constraints"

export class SimpleTiledModel extends Model {
    constructor(periodic, subset_name,width, height, tileset_info, constraints_json) {
        super(width, height);
        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tileset_info = tileset_info ? tileset_info : this._throw("No tile json has been passed to SimpleTiled.") ;
        
        this.tiles_info = this.tileset_info.tiles;
        this.neighbors_info = this.tileset_info.neighbors;
        this.items_info = this.tileset_info.items;
        this.tiles = [];
        this.tiles_symmetries = {};
        this.occurrences = {}
        this.rotations = {};
        this.tile_IDs = {};
        this.tempStationary = [];
        this.constraints = constraints_json;
        
        this.tilesize = this.tileset_info.tilesize ? this.tileset_info.tilesize : 32;
        this.unique = false; // have no clue what this does

        this.subsets = this.tileset_info.subsets;

        this.SimpleInit();
    }
    SimpleInit() {
        let sym_return = []
        sym_return = Constraints.GenerateTileSymmetry(this.tiles_info);
        [this.tiles, this.rotations, this.tile_IDs, this.weights, this.tiles_symmetries] = sym_return
        console.log(sym_return)
        this.InitItemNumbering()
        debugger;
        this.InitPropagator();
    }
    
    InitItemNumbering() {

        let item_tile_name, item_tile_ID, items;
        let items_array = this.items_info;
        let temp_stationary = []
        let occurrences = {}
        let tiles = []
        
        for (let i = 0; i < items_array.length; i++) {
            items = items_array[i].items;
            item_tile_name = items_array[i]["tile"]
            item_tile_ID = this.tile_IDs[item_tile_name].tile_ID

            for (let j = 0; j < this.tiles.length; j++) {
                let tile = this.tiles[j];
                let occurrence = this.rotations[tile];
                if (item_tile_ID == occurrence.tile_ID) {

                    for (let j = 0; j < items.length; j++) {
                        let tile_name = tile + " " + j.toString()
                        occurrences[tile_name] = {
                            is_unique_tile : occurrence.is_unique_tile,
                            tile_ID : occurrence.tile_ID
                        }
                        tiles.push(tile_name)
                        temp_stationary.push(1)
                    }
                }
            }
        }
        this.tiles = tiles
        this.occurrences = occurrences
        this.tempStationary = temp_stationary
        this.weights = this.tempStationary
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
            L_id = this.occurrences[neighbors["left"]].tile_ID;
            R_id = this.occurrences[neighbors["right"]].tile_ID;
            L = this.tiles_symmetries[left[0]][left[1]];
            R = this.tiles_symmetries[right[0]][right[1]];
            down = [left[0], L[1].toString()];
            up = [right[0], R[1].toString()];
            D_id = this.rotations[down[0] + ' ' + down[1]].tile_ID; //geting string name of tile
            U_id = this.rotations[up[0] + ' ' + up[1]].tile_ID;
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

    OnBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.width || y >= this.height);
    }

}