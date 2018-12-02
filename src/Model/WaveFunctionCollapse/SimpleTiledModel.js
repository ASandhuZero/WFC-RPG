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
        this.tiles = [];
        
        this.tiles_symmetries = {};
        this.occurrences = {}
        this.rotations = {};
        this.tile_IDs = {};
        
        this.tilesize = this.tileset_info.tilesize ? this.tileset_info.tilesize : 32;
        this.unique = false; // have no clue what this does
        this.SimpleInit(this.subsets_info)
    }

    SimpleInit(subsets_info) {
        for (let i = 0; i < subsets_info.length; i++) {

            let subset = subsets_info[i];
            this.subset_names.push(subset["name"])

            let tiles_info = subset["tiles_info"];
            let items_info = subset["items_info"];
            let neighbors_info = subset["neighbors"]
            let dependencies_info = subset["dependecies"]
            let tiles, items, neighbors, dependecies;
    
            tiles = Constraints.GenerateTileSymmetry(tiles_info);

            items = Constraints.GenerateItems(items_info, tiles);
            if (neighbors_info.length == 0) {
                neighbors = Constraints.GetNeighbors(tiles)
            } else {
                neighbors = {
                    tiles : neighbors_info
                }
            }
            if (dependencies_info.length == 0) {
                dependecies = Constraints.GetDependecies(items);
            }
            subset["tiles"] = tiles
            subset["tiles"]["weights"] = tiles.weights;
            subset["tiles"]["neighbor_propagator"] = this.GeneratePropagator(neighbors, tiles, items);
            subset["tiles"]["tile_amount"] = tiles.names.length;
            
            if (tiles.names.length > this.total_tiles.length) {
                this.total_tiles = tiles.names;
            }
            if (items.names.length > this.total_items.length) {
                this.total_items = items.names;
            }
        }
    }

    
    GeneratePropagator(neighbors, tiles, items) {
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

    OnBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.width || y >= this.height);
    }


    
}