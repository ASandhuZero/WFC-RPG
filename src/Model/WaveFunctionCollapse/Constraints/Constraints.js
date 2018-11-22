import * as Utils from "../../Utils"

export function Dependency() {
    console.log("dependency")
}

export function Locality() {
    console.log("locality")
}

export function GenerateTileSymmetry(tiles_info) {
    let cardinality, tile; 
    let tile_ID = 0;
    let weights_array = []
    let tiles = [];
    let rotations = {} 
    let tile_IDs = {}
    let tile_symmetries = {};

    let return_array = [tiles, rotations, tile_IDs, weights_array]
    
    for (let i = 0; i < tiles_info.length; i++) {
        tile = tiles_info[i];
        switch(tile.symmetry) {
        case 'L':
            cardinality = 4;
            tile_symmetries[tile.name] = {
                '0' : [0,1,2,3,1,0,3,2],
                '1' : [1,2,3,1,0,3,2,0],
                '2' : [2,3,1,0,3,2,0,1],
                '3' : [3,1,0,3,2,0,1,2]
            }
            break;
        case 'T':
            cardinality = 4;
            tile_symmetries[tile.name] = {
                '0' : [0,1,2,3,0,3,2,1],
                '1' : [1,2,3,0,3,2,1,0],
                '2' : [2,3,0,3,2,1,0,1],
                '3' : [3,0,3,2,1,0,1,2]
            }
            break;
        case 'I':
            cardinality = 2;
            tile_symmetries[tile.name] = {
                '0' : [0,1,0,1,0,1,0,1],
                '1' : [1,0,1,0,1,0,1,0]
            }
            break;
        case '\\':
            cardinality = 2;
            tile_symmetries[tile.name] = {
                '0' : [0,1,0,1,1,0,1,0],
                '1' : [1,0,1,1,0,1,0,0]
            }
            break;
        case 'X': 
            cardinality = 1;
            tile_symmetries[tile.name] = {
                '0' : [0,0,0,0,0,0,0,0]
            }
            break;
        default: // Tiles with no manually assigned symmetries will default to X sym.
            Utils._warning("symmetry for tile " + tile.name + "is not set! Setting symmetry to default symmetry of X. Please change symmetry.")
            cardinality = 1;
            tiles[tile.name] = {
                '0' : [0,0,0,0,0,0,0,0]
            }
            break;
        }
        return_array = GenerateTileCardinality(cardinality, tile, tile_ID, tiles, rotations, tile_IDs, weights_array);
        tile_ID++;
    }
    return_array.push(tile_symmetries)
    return return_array
    this.weights = this.tempStationary;
}

function GenerateTileCardinality(cardinality, tile, tile_ID, tiles, rotations, tile_IDs, weights_array) {
    let new_tile, is_unique_tile;
    for (let i = 0; i < cardinality; i++) {
        new_tile = tile.name + ' ' + i.toString(); // tile name and rotation.
        tiles.push(new_tile);
        weights_array.push(tile.weight || 1);
        is_unique_tile = i == 0 ? true : false;
        
        rotations[new_tile] = {
            is_unique_tile : is_unique_tile,
            tile_ID : tile_ID
        }
        if (is_unique_tile) {
            tile_IDs[tile["name"]] = {
                tile_ID : tile_ID
            }
        }
    }
    return [tiles, rotations, tile_IDs, weights_array]
}