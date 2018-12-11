import * as Constraints from "./Constraints/Constraints"

export function WFC(periodic, width, height, tileset_info) {
    let data = tileset_info["data"];
    let tile_data = GenerateTileData(data, width, height);
    debugger
    let tile_amount = tile_data.tiles.amount;
    let item_amount = tile_data.items.amount;
    let wave = GenerateWave(tile_amount, item_amount, width, height);
    let tile_array = [];
    let result = null;
    Clear(wave, tile_amount, tile_data);
    while (result == null) {
        result = Observe(wave, tile_data, tile_amount, tile_array, periodic, width, height);
        if (result) {
            let tiles = tile_data["tiles"].names
            let items = tile_data["items"].names
            return GenerateTileMap(wave, tile_amount, item_amount, tiles, items, width, height)
        }
        Propagate(wave, tile_array, periodic, width, height, tile_data);
    }
    
}
function Clear(wave, tile_amount, tile_data) {
    let opposite = [2, 3, 0, 1];
    let tiles = tile_data.tiles;
    for (let i = 0; i < wave.length; i++) {
        for (let t = 0; t < tile_amount; t++) {
            wave[i]["tiles"][t] = true;
        }
    }
    for (let w = 0; w < wave.length; w++) {
        for (let t = 0; t < tile_amount; t++) {
            for (let d = 0; d < 4; d++) {
                tiles.compatible[w][t][d] = tile_data.neighbor_propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
            }
        }
    }
    for (let t = 0; t < wave.length; t++) {
        tiles.sums_of_ones[t] = tiles.weights.length;
        tiles.sums_of_weights[t] = tiles.summed_weights;
        tiles.sums_of_log_weights[t] = tiles.summed_log_weights;
        tiles.entropies[t] = tiles.starting_entropy;
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
                }
            }
        } 
    }
    debugger
    return array;
}
/**
 * GenerateTileData
 *  Takes data and converts data into something that WFC can read.
 * @param {array} data 
 * @returns {object} subsets
 */
function GenerateTileData(data, width, height) {
    let tiles = Constraints.GenerateTiles(data["tiles_info"], width, height);
    let items = Constraints.GenerateItems(data["items_info"]);
    let rules = Constraints.GenerateRules(data["rules_info"])
    let neighbors = data["neighbors"].length != 0 ? data["neighbors"] :
                    Constraints.GetNeighbors(tiles)
    let neighbor_propagator = GeneratePropagator(neighbors, tiles, items)
    let tile_data = {
        "tiles": tiles,
        "items": items,
        "rules": rules,
        "neighbors": neighbors,
        "neighbor_propagator": neighbor_propagator
    }
    return tile_data;
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
function Observe(wave, tile_data, tile_amount, tile_array, periodic, width, height) {
    let noise, amount, entropy;
    let min = 1000;
    let argmin = -1;
    let tiles_info = tile_data["tiles"];
    
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
            let items_info = tile_data["items"];
            BanItem(wave, items_info, argmin, null, null)
        }
    }
    return null;
}
function Propagate(wave, tile_array, periodic, width, height, tile_data) {
    let DX = [-1, 0, 1, 0];
    let DY = [0, 1, 0, -1];
    
    let tiles_info = tile_data["tiles"];
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
            let p = tile_data.neighbor_propagator[d][tile_1];
            let compat = tiles_info.compatible[index_2];
            for (let l = 0; l < p.length; l++) {
                let tile_2 = p[l] 
                let comp = compat[tile_2];
                comp[d] = comp[d] - 1;
                if (comp[d] == 0) {
                    tile_array = BanTile(wave, tiles_info, index_2, tile_2, tile_array);
                    let items_info = tile_data["items"];
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
