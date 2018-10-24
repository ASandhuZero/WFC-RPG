import {Model} from './Model';

export class SimpleTiledModel extends Model {
    constructor(periodic, subset_name,width, height, tileset_info, constraints_json) {
        super(width, height);

        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tileset_info = tileset_info ? tileset_info : this._throw("No tile json has been passed to SimpleTiled.") ;
        
        this.tiles_info = this.tileset_info.tiles;
        this.tiles = [];
        this.tiles_symmetries = {};
        this.constraints = constraints_json;
        
        this.tilesize = this.tileset_info.tilesize ? this.tileset_info.tilesize : 32;
        this.unique = false; // have no clue what this does

        this.subsets = this.tileset_info.subsets;

        this.SimpleInit();
    }
    
    SimpleInit() {
        let tempStationary, action, first_occurrence, tile;

        for (let i = 0; i < this.tiles_info.length; i++) {
            tile = this.tiles_info[i];
            this.SetTileSymmetry(tile);
        }
        debugger;

    }

    SetTileSymmetry(tile, id) {
        let cardinality, new_tile;
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
            case 'X': // Tiles with no manually assigned symmetries will default to X sym.
                cardinality = 1;
                this.tiles_symmetries[tile.name] = {
                    '0' : [0,0,0,0,0,0,0,0]
                }
                break;
            default:
            this._warning("symmetry for tile " + tile.name + "is not set! Setting symmetry to default symmetry of X. Please change symmetry.")
                cardinality = 1;
                tiles[tile.name] = {
                    '0' : [0,0,0,0,0,0,0,0]
                }
                break;
        }
        for (let i = 0; i < cardinality; i++) {
            new_tile = tile.name + ' ' + i.toString(); // tile name and rotation.
            this.tiles.push(new_tile);

            // this.unique_tile_occurrence[T] = tile_amount;
            // this.tile_names.push(T);
            // this.stationary.push(tile.weight || 1);
            // tile_amount++;
        }
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