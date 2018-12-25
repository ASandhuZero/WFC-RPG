import * as Constraints from "./Constraints/Constraints"

export function WFC(periodic, width, height, tileset_info, chosen_rule) {
    let chosen_tile,chosen_name;
    let data = tileset_info["data"];
    
    let tile_data = GenerateTileData(data, width, height);
    let neighbor_propagator = tile_data["neighbor_propagator"]; //TODO: this is dumb
    let tile_amount = tile_data.tiles.amount;
    let item_amount = tile_data.items.amount;

    let data_to_observe = ["tiles", "items"]
    let wave = GenerateWave(tile_amount, item_amount, width, height);
    
    let result = null;
    let definite_state = 0;
    let init = true;
    
    Clear(wave, tile_amount, tile_data);
    
    let elems_to_remove_obj = {};

    for (elem of data_to_observe) {
        elems_to_remove_obj[elem] = []
    }
    
    while (definite_state != data_to_observe.length) {
        definite_state = 0; 
        for (elem of data_to_observe) {
            let elems_to_remove = elems_to_remove_obj[elem];
            let elem_data = tile_data[elem]
            
            // Observe element returns true (argmin == -1), false (possiblities == 0), or null
            result = Observe(wave, elem_data, elem, elems_to_remove, periodic, width, height, null, false, null, init);
            init = false;
            // Converts index to name to match with rules
            if (result === true) {
                definite_state++;
            }
            else if (result === false) {
                return [];
            } else {
                debugger
                chosen_tile = elem_data.names[result];
                chosen_name = chosen_tile.split(/[ ]+/)[0];
                // Enforce rules if needed
                if (tile_data["rules"][elem][chosen_name] != undefined) {
                    let elem_rules = tile_data["rules"][elem][chosen_name];
                    // debugger
                    Rules(wave, result, chosen_rule, elem_rules, elem, tile_data, elem_data, elems_to_remove, periodic, width, height, neighbor_propagator);
                } 
            }
            
            // let chosen_name = 83;
            Propagate(wave, elems_to_remove, periodic, width, height, elem_data, neighbor_propagator)
        }
    }
    let tiles = tile_data["tiles"].names
    let items = tile_data["items"].names
    //DONE
    console.log(wave);
    //debugger
    return GenerateTileMap(wave, tile_amount, item_amount, tiles, items, width, height)
}
/**
 * Clear
 * Will reset the wave to an unobserved state (as in all true).
 * Reset the compatible tiles by going backward through the propgator data collection.
 * Reset all entropies for all data that can be observed (tiles, items, etc)
 * @param {matrix} wave 
 * @param {int} tile_amount 
 * @param {json} tile_data 
 */
function Clear(wave, tile_amount, tile_data) {
    let opposite = [2, 3, 0, 1];
    let tiles = tile_data.tiles;
    let items = tile_data.items;
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
        tiles.possible_choices[t] = tiles.weights.length;
        tiles.sums_of_weights[t] = tiles.sum_of_weights;
        tiles.sums_of_log_weights[t] = tiles.sum_of_log_weights;
        tiles.entropies[t] = tiles.starting_entropy;

        items.possible_choices[t] = items.weights.length;
        items.sums_of_weights[t] = items.sum_of_weights;
        items.sums_of_log_weights[t] = items.sum_of_log_weights;
        items.entropies[t] = items.starting_entropy;
    }
}
/**
 * GnereateTileMap
 * Uses wave booleans to create a new array from the data indexes.
 * @param {matrix} wave 
 * @param {int} tile_amount 
 * @param {int} item_amount 
 * @param {json} tiles 
 * @param {json} items 
 * @param {int} width 
 * @param {int} height 
 */
function GenerateTileMap(wave, tile_amount, item_amount, tiles, items, width, height) {
    let array = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let tile_elem = wave[y + x * height]["tiles"];
            let item_elem = wave[y + x * height]["items"];
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
    let items = Constraints.GenerateItems(data["items_info"], width, height);
    let rules = Constraints.GenerateRules(data["rules_info"]);
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

    let neighbor_tiles = neighbors;

    let locality_propagator = new Array(4)
    let propagator = new Array(4);
    
    let tile_names = tiles["names"];

    // creates locality_propagator and propagator
    // array of 4 elements, each element is an array equal to the number of tiles
    for (let d = 0; d < 4; d++) { // d is for direction.
        locality_propagator[d] = new Array(tile_names.length); // all the tiles. We are reaching that superposition stuff
        propagator[d] = new Array(tile_names.length); // all the tiles. We are reaching that superposition stuff
        for (let t = 0; t < tile_names.length; t++) {
            locality_propagator[d][t] = new Array(tile_names.length); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
            propagator[d][t] = new Array(tile_names.length).fill(false); // This will be the bool array. Since each tile should know what it's possible neighbor tile is.
        }
    }
    for (let i = 0; i < neighbor_tiles.length; i++) {
        // dissect neighbor constraints
        neighbor_pair = neighbor_tiles[i];
        left = neighbor_pair.left
        right = neighbor_pair.right
        L_ID = tiles["IDs"][left];  // user defined rotation for left tile
        R_ID = tiles["IDs"][right]  // user defined rotation for right tile
        L = tiles["rotations"][L_ID];   // uses tile id number
        R = tiles["rotations"][R_ID];   // array of tile id number according to its rotations
        D = tiles["rotations"][L[1]];
        U = tiles["rotations"][R[1]];
        
        // determines which neighbor tiles can exist
        propagator[0][L[0]][R[0]] = true;   // propagator[R, U, L, D]
        propagator[0][L[6]][R[6]] = true;
        propagator[0][R[4]][L[4]] = true;
        propagator[0][R[2]][L[2]] = true;

        propagator[1][D[0]][U[0]] = true;
        propagator[1][U[6]][D[6]] = true;
        propagator[1][D[4]][U[4]] = true;
        propagator[1][U[2]][D[2]] = true;

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

function Observe(wave, elem_data, elem, elems_to_remove, periodic, width, height, chosen_index, forced, forced_tile, init) {
    let noise, entropy, possiblities;
    let min = 1000;
    let argmin = -1;
    let chosen_elem = -1;
    let r;
    
    // update min to reflect highest entropy and noise
    for (let i = 0; i < wave.length; i++) {
        if (OnBoundary(i % width, i / width, periodic, width, height)) {
            continue;
        }
        possiblities = elem_data.possible_choices[i];
        if (possiblities == 0) {
            return false;
        }
        entropy = elem_data.entropies[i];
        if (possiblities > 1 && entropy <= min) {
            // let noise = 0.000001 * this.random();
            noise = 0.000001;
            if (entropy + noise < min) {
                min = entropy + noise;
                argmin = i;
            }
        }
    }
    if (argmin == -1) {
        return true;
    }
    // debugger
    if(forced == true) {
        argmin = chosen_index;
    }
    
    if(init == true) {
        argmin = Math.floor(Math.random()*wave.length);
    }

    // Creates distribution array that reflects the weight of each tile according to the number of tiles in an element of the wave
    let distribution = new Array(elem_data.amount);
    let w = wave[argmin][elem];
    for (let t = 0; t < elem_data.amount; t++) {
        distribution[t] = w[t] ? elem_data.weights[t] : 0;
        // distribution[t] /= elem_data.amount;
    }

    debugger
    if(forced_tile != null){
        r = elem_data.names.indexOf(forced_tile);
    } else {
        // r randomly chooses a tile by its index using weighted selection
        r = _NonZeroIndex(distribution, elem_data.carray, elem_data.csumweight);
    }
    


    
    /**
     * Decides which tiles to ban
     * loop through number of tiles
     * if counter is equal to randomly chosen tile AND wave already knows its false then ban the tile
     */
    for (let t = 0; t < elem_data.amount; t++) {
        if (w[t] != (t == r)) {
            // argmin = wave index to remove
            // t = tile index to remove
            elems_to_remove = Ban(wave, elem_data, elem, argmin, t, elems_to_remove);
        } 
    }
    // debugger
    return r;
}

/**
 * 
 * @param {matrix} wave 
 * @param {int} chosen_index : index of tile
 * @param {object} rules : rules set by user constraint
 */


function Rules(wave, chosen_tile, chosen_rule, elem_rules, elem_type, tile_data, elem_data, elems_to_remove, periodic, width, height, neighbor_propagator) {
    debugger
    let ctile;
    let sorted_entropies;
    let xmin, xmax, ymin, ymax;
    let chosen_index = elems_to_remove[0][0];
    let depTile = null;
    // let depTile = elem_rules["dependency"]["tile"]; // tile that is dependent on chosen tile
    // let fmin = elem_rules["dependency"]["frequency"][0];
    // let fmax = elem_rules["dependency"]["frequency"][1];
    // let freq = Math.floor(Math.random()*(fmax-fmin+1)+fmin);    // calculate a random frequency according to range given in constraint
    // let ftemp = 0;
    console.log(chosen_index)
    switch(chosen_rule){
        case 'distance':
            // calculate distance 
            if(elem_rules["dependency"]["distance"] != undefined){
                xmin = elem_rules["dependency"]["distance"][0];
                xmax = elem_rules["dependency"]["distance"][1];
                ymin = elem_rules["dependency"]["distance"][2];
                ymax = elem_rules["dependency"]["distance"][3];
            } else {
                throw "no radius constraint given"
            }

            // get tile index of lowest entropy
            sorted_entropies = GetEntropySort(xmin, xmax, ymin, ymax, wave.length, width, elem_data, chosen_index);
            console.log(sorted_entropies);
            
            // uses sorted entropy to determine where the next 

            while(sorted_entropies.length > 0){
                
            }
            for(let i = 0; i < sorted_entropies.length; i++){
                ctile = sorted_entropies.shift();
                let result = Observe(wave, elem_data, elem, elems_to_remove, periodic, width, height, chosen_index, true, depTile, false);
                if (result === false) return [];
                Propagate(wave, elems_to_remove, periodic, width, height, elem_data, neighbor_propagator);
                sorted_entropies = GetEntropySort(xmin, xmax, ymin, ymax, wave.length, width, elem_data, chosen_tile);
                console.log(sorted_entropies);
            }
            break;
        default:
            break;
    }


    console.log("this is the force funtion wooho.");
    // debugger
    return null;
}

function GetEntropySort(xmin,xmax,ymin,ymax,length,width,elem_data,chosen_tile){
    debugger
    let index;
    let indexes=[];
    for(let i = (-1)*ymax; i <= ymax; i++){
        for(let j = (-1)*xmax; j <= xmax; j++){
            if(Math.abs(j) <= xmin && Math.abs(i) <= ymin) continue;    // limitations

            index = (chosen_tile + (j))+(i*width); // calculate index to observe
            if(index < 0 || index > length-1) continue;
            indexes.push({
                index: index,
                entropy: elem_data.entropies[index]
            });
        }
        
    }
    var sortEnt = indexes.slice(0);
    sortEnt.sort(function(a,b) { return a.entropy - b.entropy;});
    let ordered_index = sortEnt.map(a => a.index);
    return ordered_index;
}


function Propagate(wave, elems_to_remove, periodic, width, height, elem_data, neighbor_propagator) {
    let DX = [1, 0, -1, 0]; // [right, up, left, down]
    let DY = [0, -1, 0, 1]; // [right, up, left, down]
    if (elem_data.compatible == undefined) {
        return [];
    }
    // item elem_to_remove never reaches this while loop
    while(elems_to_remove.length > 0) {
        let e1 = elems_to_remove.pop(); // element 1

        let index_1 = e1[0]; // index of element to remove
        let tile_1 = e1[1]; // tile within element to remove
        let x1 = index_1 % width;   // calculates x position of tile in map
        let y1 = Math.floor(index_1 / width);   // calculate y position of tile in map

        for (let d = 0; d < 4; d++) {
            let dx = DX[d];
            let dy = DY[d];
            let x2 = x1 + dx;   // x position of neighbor
            let y2 = y1 + dy;   // y position of neighbor

            // boundary check
            if (OnBoundary(x2, y2, periodic, width, height)) {
                continue;
            }
            
            // x position correction for index_2 calculation?
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

            // 
            let index_2 = x2 + y2 * width;  // Item 2 - calculates index of neighbor tile element within map
            let p = neighbor_propagator[d][tile_1]; // an array of tiles to remove according to d
            /* neighbor_propagator is a matrix
             * each element corresponds to [right, up, left, down]
             * each element is an array of all tiles
             * each tile is an array of tile index to remove from wave 
             * */
            let compat = elem_data.compatible[index_2]; // a matrix of number of compatible tiles
            
            for (let l = 0; l < p.length; l++) {
                let tile_2 = p[l]   // position of neighbor tile to remove
                let comp = compat[tile_2];  // array of number of compatible tiles with neighbor tile to be removed
                comp[d] = comp[d] - 1;  // decrease number of compatible tiles according to d
                if (comp[d] == 0) {
                    elems_to_remove = Ban(wave, elem_data, elem, index_2, tile_2, elems_to_remove);
                }
            }
        }
    }
    return elems_to_remove
}

/**
 * Ban
 *  Removes tiles from wave.
 * @param {matrix} wave 
 * @param {object} elem_data
 * @param {int} wave_index : index of element in wave
 * @param {int} wave_elem : index of tile within element
 * @param {array} elems_to_remove 
 * @returns {array} elements to remove in wave
 */
function Ban(wave, elem_data, elem, wave_index, wave_elem, elems_to_remove) {
    let wave_array = wave[wave_index][elem];    // creates array of tiles in chosen element

    // This is where Ban actually bans the undesired tile
    wave_array[wave_elem] = false;  // set tile to false according to wave_elem passed in

    // This is where Ban takes it a step further to get rid of the banned tile's number of compatible tiles
    if (elem_data.compatible != undefined) {
        // elem_data.compatible contains number of compatible tiles
        elem_data.compatible[wave_index][wave_elem] = [0,0,0,0];    // set the false tile's corresponding set of compatible tiles to 0
    }

    // Now it's time to actually set the banned tile up for removal 
    elems_to_remove.push([wave_index, wave_elem]);  // add the false tile to elems_to_remove array

    // Need to recalculate entropy for the element in the wave using Shannon Entropy?
    let sum = elem_data.sums_of_weights[wave_index];    // get sum of weights for element with false tile
    elem_data.entropies[wave_index] += elem_data.sums_of_log_weights[wave_index] / sum - Math.log(sum); // recalculate entropy
    elem_data.possible_choices[wave_index] -= 1;
    elem_data.sums_of_weights[wave_index] -= elem_data.weights[wave_elem];
    elem_data.sums_of_log_weights[wave_index] -= elem_data.log_weights[wave_elem];
    sum = elem_data.sums_of_weights[wave_index];
    elem_data.entropies[wave_index] -= elem_data.sums_of_log_weights[wave_index] / sum - Math.log(sum);

    return elems_to_remove;
}

/**
 * Weighted choosing of tiles
 * @param {array} array: wave element 
 */
function _NonZeroIndex(distribution, cweights, csumweight) {
    let random = Math.random()*csumweight;
    let choice = Math.floor(random);
    let closest = cweights.reduce((prev, curr) => Math.abs(curr - choice) < Math.abs(prev - choice) ? curr : prev);
    let index = cweights.indexOf(closest);
    let elem = distribution[index];
    while(elem == 0) {
        choice = Math.floor(Math.random()*csumweight);
        closest = cweights.reduce((prev, curr) => Math.abs(curr - choice) < Math.abs(prev - choice) ? curr : prev);
        index = cweights.indexOf(closest);
        elem = distribution[index];
    }
    
    return index;

}  
function OnBoundary(x, y, periodic, width, height) {
    return !periodic && (x < 0 || y < 0 || x >= width || y >= height);
}
