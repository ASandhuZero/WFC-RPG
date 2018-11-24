import {Model} from './Model';
import * as Constraints from "./Constraints/Constraints"

export class SimpleTiledModel extends Model {
    constructor(periodic, subset_name, width, height, tileset_info) {
        super(width, height);
        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tileset_info = tileset_info ? tileset_info : this._throw("No tile json has been passed to SimpleTiled.") ;
        
        this.subsets_info = this.tileset_info.subsets;
        this.subset_names = [];
        // this.tiles_info = this.GetTilesFromSubsets(this.subsets_info);

        this.tiles_info = this.tileset_info.tiles;
        this.neighbors_info = this.tileset_info.neighbors;
        this.items_info = this.GetItemInfo(this.tiles_info);
        
        this.tiles = [];
        this.tiles_symmetries = {};
        this.occurrences = {}
        this.rotations = {};
        this.tile_IDs = {};
        
        this.tilesize = this.tileset_info.tilesize ? this.tileset_info.tilesize : 32;
        this.unique = false; // have no clue what this does

        this.SimpleInit(this.subsets_info);
    }
    GetTilesFromSubsets(subsets_info) {
        let tile_array_to_return = []
        for (let i = 0; i < subsets_info.length; i++) {
            console.log(subsets_info[i])
        }

        return tile_array_to_return
    }

    GetItemInfo(tiles_info) {
        let item_info = []
        for (let i = 0; i < tiles_info.length; i++) {
            let tile_info = tiles_info[i];
            item_info.push({
                "tile": tile_info["name"], "items": tile_info["items"]
            })
        }
        return item_info
    }

    SimpleInit(subsets_info) {
        for (let i = 0; i < subsets_info.length; i++) {

            let subset = subsets_info[i];
            this.subset_names.push(subset["name"])

            let tiles_info = subset["tiles_info"];
            let neighbors_info = subset["neighbors"]
            let items_info = this.GetItemInfo(tiles_info);
            
            let sym_return = []
            let items_return = []
            let rotations, tiles, tile_IDs, occurrences, tiles_symmetries, weights;
    
            sym_return = Constraints.GenerateTileSymmetry(tiles_info);
            tiles = sym_return[0];
            rotations = sym_return[1];
            tile_IDs = sym_return[2];
            weights = sym_return[3];
            tiles_symmetries = sym_return[4];

            
            
            items_return = Constraints.GenerateItemTiles(items_info, rotations, tiles, tile_IDs)
            tiles= items_return[0];
            occurrences = items_return[1];
            weights = items_return[2]
            
            if (neighbors_info.length == 0) {
                neighbors_info = Constraints.GetNeighbors(tiles)
            }
            subset["tiles"] = tiles
            subset["neighbor_propagator"] = this.InitSubsetPropagator(neighbors_info, tiles, occurrences, tiles_symmetries, rotations);
            subset["weights"] = weights;
        }
        this.tiles = subsets_info[0].tiles;
        this.weights = subsets_info[0].weights;
        this.locality_propagator = subsets_info[0].neighbor_propagator
    }

    
    InitSubsetPropagator(neighbors_info, tiles, occurrences, tiles_symmetries, rotations) {
        let sparse_propagator, propagator, neighbors;
        let left, L_id, L;
        let right, R_id, R;
        let up, U_id, U;
        let down, D_id, D;
        let locality_propagator = new Array(4)

        propagator = new Array(4);
        for (let d = 0; d < 4; d++) { // d is for direction.
            locality_propagator[d] = new Array(tiles.length); // all the tiles. We are reaching that superposition stuff
            propagator[d] = new Array(tiles.length); // all the tiles. We are reaching that superposition stuff
            for (let t = 0; t < tiles.length; t++) {
                locality_propagator[d][t] = new Array(tiles.length); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
                propagator[d][t] = new Array(tiles.length).fill(false); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
            }
        }
        for (let n = 0; n < neighbors_info.length; n++) { // n is for neighbor object
            neighbors = neighbors_info[n];

            left = neighbors["left"].split(/[ ]+/).filter(function(x) { return x.trim() !== ''});
            right = neighbors["right"].split(/[ ]+/).filter(function(x) { return x.trim() !== ''});
            L_id = occurrences[neighbors["left"]].tile_ID;
            R_id = occurrences[neighbors["right"]].tile_ID;
            L = tiles_symmetries[left[0]][left[1]];
            R = tiles_symmetries[right[0]][right[1]];
            down = [left[0], L[1].toString()];
            up = [right[0], R[1].toString()];
            let d_key = down[0] + ' ' + down[1] + ' ' + left[2];
            let u_key = up[0] + ' ' + up[1] + ' ' +right[2]
            D_id = occurrences[d_key].tile_ID; //geting string name of tile
            U_id = occurrences[u_key].tile_ID;
            D = tiles_symmetries[left[0]][L[1]];
            U = tiles_symmetries[right[0]][R[1]];

            propagator[0][R_id + R[0]][L_id + L[0]] = true;
            propagator[0][R_id + R[6]][L_id + L[6]] = true;
            propagator[0][L_id + L[4]][R_id + R[4]] = true;
            propagator[0][L_id + L[2]][R_id + R[2]] = true;
            
            propagator[1][U_id + U[0]][D_id + D[0]] = true;
            propagator[1][D_id + D[6]][U_id + U[6]] = true;
            propagator[1][U_id + U[4]][D_id + D[4]] = true;
            propagator[1][D_id + D[2]][U_id + U[2]] = true;
        }
        for (let t = 0; t < tiles.length; t++) {
            for (let t2 = 0; t2 < tiles.length; t2++) {
                propagator[2][t][t2] = propagator[0][t2][t];
                propagator[3][t][t2] = propagator[1][t2][t];
            }
        }
        
        sparse_propagator = new Array(4);
        for (let d = 0; d < 4; d++) {
            sparse_propagator[d] = new Array(4);
            for (let t = 0; t < tiles.length; t++) {
                sparse_propagator[d][t] = [];
            }
        }
        for (let d = 0; d < 4; d++) {
            for (let t = 0; t < tiles.length; t++) {
                let sp = sparse_propagator[d][t];
                let p = propagator[d][t]

                for (let t1 = 0; t1 < tiles.length; t1++) {
                    if (p[t1]) {
                        sp.push(t1);
                    }
                }
                locality_propagator[d][t] = sp;
            }
        }
        return locality_propagator;
    }

    OnBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.width || y >= this.height);
    }

}