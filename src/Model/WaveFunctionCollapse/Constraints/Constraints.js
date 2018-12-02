export function Dependency() {
    console.log("dependency")
}

export function Locality() {
    console.log("locality")
}

export function GetDependecies(items) {
    let dependecies = {
        items: []
    }
    return dependecies
}

export function GetNeighbors(tiles) {
    let neighbors = {
        tiles: []
    }
    let tile_names = tiles["names"]
    for (let i = 0; i < tile_names.length; i++) {
        for (let j = 0; j < tile_names.length; j++) {
            if (i == j) {
                continue;
            }
            neighbors["tiles"].push({"left":tile_names[i], "right":tile_names[j]})
        }
    }
    return neighbors
}

export function GenerateItems(item_info) {
    let item;
    let items = {
        names: [],
        weights: []
    }
    for (let i = 0; i < item_info.length; i++) {
        item = item_info[i];
        items["names"].push(item.name);
        items["weights"].push(item.weight || 1);
    }
    return items
}

export function GenerateTileSymmetry(tiles_info) {
    let tile, tile_name, new_tile;

    let tiles = {
        rotations: [],
        names: [],
        weights: [],
        IDs: {}
    };
    let cardinality = 1;
    let tile_ID = 0;

    let rotation = function(x) { return x; }
    let mirror = function(x) { return x; }
    
    for (let i = 0; i < tiles_info.length; i++) {
        tile = tiles_info[i];

        switch(tile.symmetry) {
        case 'X':
            break;
        case 'L':
            cardinality = 4;
            rotation = function(x) { return (x + 1) % 4; }
            mirror = function(x) { return x % 2 == 0 ? x + 1: x - 1; }
            break;
        case 'T':
            cardinality = 4;
            rotation = function(x) { return (x + 1) % 4; }
            mirror = function(x) { return x % 2 == 0 ? x : 4 - x; }
            break;
        case 'I':
            cardinality = 2;
            rotation = function(x) { return 1 - x; }
            break;
        case '\\':
            cardinality = 2;
            rotation = function(x) { return 1 - x; }
            mirror = function(x) { return 1 - x; }
            break;
        default: // Tiles with no manually assigned symmetries will default to X sym.
            Utils._warning("symmetry for tile " + tile.name + "is not set! Setting symmetry to default symmetry of X. Please change symmetry.")
            break;
        }
        
        for (let c = 0; c < cardinality; c++) {
            tile_name = tile.name + ' ' + c.toString();
            new_tile = [
                c + tile_ID,
                rotation(c) + tile_ID,
                rotation(rotation(c)) + tile_ID,
                rotation(rotation(rotation(c))) + tile_ID,
                mirror(c) + tile_ID,
                mirror(rotation(c)) + tile_ID,
                mirror(rotation(rotation(c))) + tile_ID,
                mirror(rotation(rotation(rotation(c)))) + tile_ID
            ]
            tiles["names"].push(tile_name);
            tiles["rotations"].push(new_tile)
            tiles["weights"].push(tile.weight || 1);
            tiles["IDs"][tile_name] = tile_ID + c
        }
        tile_ID += cardinality;
    }
    return tiles
}