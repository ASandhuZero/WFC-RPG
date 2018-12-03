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
export function GetItemRules(rules_info) {
    let rule, constraints_info, constraint, result;
    let constraints = {
        "LESS" : {},
        "GREATER" : {},
        "EQUALS" : {},
    }
    let rules = {
    }
    for (let i = 0; i < rules_info.length; i++) {
        rule = rules_info[i];
        constraints_info = rule.constraints;
        for (let c = 0; c < constraints_info.length; c++) {
            constraint = constraints_info[c];
            [constraint, result] = constraint.split(',')
            constraint = constraint.split(' ')
            if (constraint[0] == "<") {
                constraints["LESS"][constraint[1]] = [
                    constraint[2],
                    result
                ]
            } else if (constraint[0] == ">") {
                constraints["GREATER"][constraint[1]] = [
                    constraint[2],
                    result
                ]
            }  else if (constraint[0] == "=") {
                constraints["EQUALS"][constraint[1]] = [
                    constraint[2],
                    result
                ]
            }
        }
            rules[rule.ID] = {
                "constraints" : constraints
        }
    }
    return rules
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
    items["item_amount"] = items["names"].length;
    return items
}

export function GenerateTiles(tiles_info, width, height) {
    let tile, tile_name, new_tile, compatible, log_weights;
    let summed_weights = 0;
    let summed_log_weights = 0;
    let tiles = {
        rotations: [],
        names: [],
        weights: [],
        IDs: {},
        amount : 0
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
            console.warn("symmetry for tile " + tile.name + "is not set! Setting symmetry to default symmetry of X. Please change symmetry.")
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
            tiles["IDs"][tile_name] = tile_ID + c;
            tiles["amount"]++;
        }
        tile_ID += cardinality;
    }
    
    compatible = new Array(tiles.amount);
    log_weights = new Array(tiles.amount);

    for (let j = 0; j < width * height; j++) {
        compatible[j] = new Array(tiles.amount);

        for (let k = 0; k < tiles.amount; k++) {
            compatible[j][k] = new Array(4);
        }
    }

    
    for (let t = 0; t < tiles.amount; t++) {
        log_weights[t] = tiles.weights[t] * Math.log(tiles.weights[t]);
        summed_weights += tiles.weights[t];
        summed_log_weights += log_weights[t];
    }
    tiles["compatible"] = compatible;
    tiles["log_weights"] = log_weights;
    tiles["summed_weights"] = summed_weights;
    tiles["summed_log_weights"] = summed_log_weights;
    tiles["starting_entropy"] = Math.log(summed_weights) - summed_log_weights / summed_weights;
    tiles["sums_of_ones"] = new Array(width * height);
    tiles["sums_of_weights"] = new Array(width * height);
    tiles["sums_of_log_weights"] = new Array(width * height);
    tiles["entropies"] = new Array(width * height);

    return tiles
}