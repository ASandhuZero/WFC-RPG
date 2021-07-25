import { part } from "core-js/core/function";
import * as Constraints from "./Constraints/Constraints"

/**
 * WaveFunctionCollapse
 * @param {*} periodic 
 * @param {*} tilemapData - All the data needed for WFC to work.
 * @returns 
 */
//TODO: Pass everything as a param object rahter than individual variables.
//  then break it out.
export function WFC(periodic, tilemapData, partial = null) {
    //TODO: THERE IS SOME NIGHTMARES RIGHT HERE THAT NEED TO BE WORKED THROUGH.
    //      AS IN THE TILE_RULE AND ITEM_RULE ARE UNDEFINED I THINK AND THAT IS 
    //      WHAT IS CAUSING THE BLANK SCREEN. FIX THIS.
    let w = tilemapData.w ? tilemapData.w : 0;
    let h = tilemapData.h ? tilemapData.h : 0;
    let tilesetInfo = tilemapData.tilesetInfo;
    let tileRules = tilemapData.tileRules;
    let itemRules = tilemapData.itemRules;
    let data = tilesetInfo["data"];
    let neighborData = data["neighbors"];
    let elemNumber = 0;
    // Getting the constraints for each type of data    
    // This really isn't robust TODO: Fix this later.
    // Extra data is being created here that can be broken out. It's shared.
    let tiles = Constraints.GenerateTiles(data["tiles_info"], w, h); // O(n^2)
    let items = Constraints.GenerateItems(data["items_info"], w, h); // O(n)
    let rules = Constraints.GenerateRules(data["rules_info"]); // O(n)

    let neighbors;
    if (neighborData.length != 0) {
        neighbors = neighborData;
    } else {
        neighbors = Constraints.GetNeighbors(tiles); // O(n^2)
    }
    let propagator = GeneratePropagator(neighbors, tiles, items); // O(n^3) ...TODO: this is dumb

        let WaveData = {
        "tiles": tiles,
        "items": items,
        "rules": rules,
        "neighbors": neighbors,
        "propagator": propagator
    }
    let tileAmount = tiles.amount;
    let itemAmount = items.amount;

    let observables = ["tiles", "items"]
    let waves = GenerateWaves(tileAmount, itemAmount, w, h); // O(n)
    
    let result = null;
    let definiteState = 0;
    let init = true;
    
    
    Clear(waves, tileAmount, WaveData); // O(n^3) TODO: I was a broken man when I wrote this function. 
    
    let removeObservables = {};
    let designRules = {
        tileRules : tileRules,
        itemRules : itemRules
    }
    
    for (let type of observables) {
        removeObservables[type] = []
        WaveData[type].elemsToRemove = removeObservables[type]
    }
    if (partial !== null) {
        FillPartial(waves.tiles, partial, periodic, WaveData, w, h, tileAmount);
        console.log("partial has been filled!")
    }
    while (definiteState != observables.length) {
        definiteState = 0; 
        for (let type of observables) {
            if(elemNumber == observables.length){
                init = false;
            } else {
                elemNumber += 1;
            }
            // result returns [chosen tile, chosen index], true (argmin == -1), false (possiblities == 0), or null
            result = Observe(waves, WaveData, type, periodic, w, h, designRules,
                init); // TODO: Fix observe. Like once in your life, please. I can't begin to describe how bad this function is.
                        
            // Converts index to name to match with rules
            if (result === true) {
                definiteState++;
            } else if (result === false) {
                return [];
            } 
            
            Propagate(waves, WaveData, type, periodic, w, h, propagator);
        }
    }
    let tileNames = WaveData.tiles.names;
    let itemNames = WaveData.items.names;
    let generated_tilemap = GenerateTileMap(waves, tileAmount, itemAmount, 
        tileNames, itemNames, w, h); // O(n^4)... Yep. This one is the one TODO: Fix this please, in some way.
    return generated_tilemap
}
/**
 * Clear
 * Will reset the wave to an unobserved state (as in all true).
 * Reset the compatible tiles by going backward through the propgator data collection.
 * Reset all entropies for all data that can be observed (tiles, items, etc)
 * @param {matrix} waves 
 * @param {int} tileAmount 
 * @param {json} WaveData 
 */
function Clear(waves, tileAmount, WaveData) {
    let opposite = [2, 3, 0, 1];
    let tiles = WaveData.tiles;
    let items = WaveData.items;
    for (let i = 0; i < waves.length; i++) {
        for (let t = 0; t < tileAmount; t++) {
            waves.tiles[i][t] = true;
        }
    }

    for (let w = 0; w < waves.length; w++) {
        for (let t = 0; t < tileAmount; t++) {
            for (let d = 0; d < 4; d++) {
                // TODO: 
                tiles.compatible[w][t][d] = 
                    WaveData.propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
            }
        }
    }
    for (let t = 0; t < waves.length; t++) {
        //TODO: THIS IS WHERE THE NIGHTMARES EXIST. Why isn't this just 
        // it's own object? Is there a reason?
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
// TODO: SIGH. Please, for the love of god, choose flattened array or 
//      matrix representation. This whole transformation code breaks everything.
function FillPartial(wave, partial, periodic, WaveData, w, h, tileAmount) {
    let tileData = WaveData.tiles;
    let length = partial.length;
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < partial[i].length; j++) {
            let value = partial[i][j];
            if (value !== false) { 
                wave[j+(i*length)][value] = true; 
                for (let k = 0; k < tileAmount; k++) {
                    if (k === value) { continue; }
                    tileData.elemsToRemove = Ban(wave, tileData, j+(i*length), 
                    k, tileData.elemsToRemove, 'observation');
                    Propagate(wave, WaveData, 'tiles', periodic, w, h, 
                        WaveData.propagator);
                }
            }
        }
    }
}
/**
 * GnereateTileMap
 * Uses wave booleans to create a new array from the data indexes.
 * @param {matrix} waves 
 * @param {int} tileAmount 
 * @param {int} itemAmount 
 * @param {json} tiles 
 * @param {json} items 
 * @param {int} w 
 * @param {int} h 
 */
function GenerateTileMap(waves, tileAmount, itemAmount, tiles, items, w, h) {
    let array = [];
    let generated_tilemap = {
        tiles : [],
        items : []
    }
    console.log(tiles); 
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            let tileElem = waves.tiles[y + x * h];
            let itemElem = waves.items[y + x * h];
            let amount = 0;
            for (let i = 0; i < tileElem.length; i++) {
                if (tileElem[i]) {
                    amount += 1;
                }
            }
            if (amount == tileAmount) {
                console.warn(amount)
            } else {
                for (let t = 0; t < tileAmount; t++) {
                    if (tileElem[t]) {
                        for (let i = 0; i < itemAmount; i++) {
                            if (itemElem[i]) {
                                array.push(tiles[t] + ' ' + items[i]);
                                let split = tiles[t].split(/[ ]+/);
                                let tile = {
                                    name : split[0],
                                    rotation : split[1]
                                }
                                generated_tilemap.tiles.push(tile);
                                generated_tilemap.items.push(items[i]);
                            }
                        }
                    }
                }
            }
        } 
    }
    if(array.length != 0) {
        return generated_tilemap;
    } else {
        throw 'No Map Generated'
    }
    
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
    let tile_amount = tiles.names.length
    let propagator = new Array(4);
    for (let direction = 0; direction < 4; direction++) {
        propagator[direction] = new Array(tile_amount);
        for (let i = 0; i < tile_amount; i++) {
            propagator[direction][i] = new Array(tile_amount).fill(-1); // -1 should never be a tile ID. If it is then something has gone horribly wrong.
        }
    }
    for (let i = 0; i < neighbors.length; i++) {
        // dissect neighbor constraints
        let neighbor_pair = neighbors[i];
        let left = tiles.IDs[neighbor_pair.left];  // user defined rotation for left tile
        let right = tiles.IDs[neighbor_pair.right];  // user defined rotation for right tile
        
        let L = tiles.rotations[left];   // uses tile id number
        let R = tiles.rotations[right];   // array of tile id number according to its rotations
        let D = tiles.rotations[L[1]];
        let U = tiles.rotations[R[1]];
        // determines which neighbor tiles can exist
        propagator[0][L[0]][R[0]] = R[0];   // propagator[R, U, L, D]
        propagator[0][L[6]][R[6]] = R[6];
        propagator[0][R[4]][L[4]] = L[4];
        propagator[0][R[2]][L[2]] = L[2];

        propagator[1][D[0]][U[0]] = U[0];
        propagator[1][U[6]][D[6]] = D[6];
        propagator[1][D[4]][U[4]] = U[4];
        propagator[1][U[2]][D[2]] = D[2];
    }
    for (let tile_1 = 0; tile_1 < tile_amount; tile_1++) {
        for (let tile_2 = 0; tile_2 < tile_amount; tile_2++) {
            if (propagator[0][tile_2][tile_1] !== -1) {
                propagator[2][tile_1][tile_2] = tile_2;
            }
            if (propagator[1][tile_2][tile_1] !== -1) {
                propagator[3][tile_1][tile_2] = tile_2;
            }
        }
    }
    // Removing non-unique -1's from the neighbor arrays.
    for (let direction = 0; direction < 4; direction++) {
        let direction_array = propagator[direction];
        for (let i = 0; i < direction_array.length; i++) {
            let unique_neighbors = [];
            let neighbor_array = direction_array[i];
            for (let j = 0; j < neighbor_array.length; j++) {
                let neighbor = neighbor_array[j];
                if (neighbor !== -1) { unique_neighbors.push(neighbor); }
            }
            // Fun fact, javascript sort does not sort numbers by ascending order. Instead, they are transformed into strings and sorted alphabetically. The arrow function ensures sort does an actual numerical sort. 
            // Doc: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
            unique_neighbors = unique_neighbors.sort((a, b) => a - b);
            propagator[direction][i] = unique_neighbors;
        }
    }
    return propagator;
}
/**
 * GenerateWave
 * @param {*} tileAmount 
 * @param {*} itemAmount 
 * @param {*} w 
 * @param {*} h
 * @returns matrix with each element being a true boolean array size of tiles. 
 */
function GenerateWaves(tileAmount, itemAmount, w, h) {
    let waves = {
        "tiles" : [],
        "items" : []
    }
    //TODO: Using wave and wave1 to avoid having to deep copy problem. 
    // Figure out a better solution.
    let wave = new Array(w * h);
    let wave1 = new Array(w * h);
    
    for (let i = 0; i < w * h; i++) {
        wave[i] = new Array(tileAmount).fill(true);
        wave1[i] = new Array(tileAmount).fill(true);
    }
    waves.tiles = wave;
    waves.items = wave1;
    waves.length = (w * h);
    return waves;
}
function Observe(waves, WaveData, type, periodic, w, h, designRules, init) {
    let elemsData = WaveData[type];
    let elemsToRemove = WaveData[type].elemsToRemove;
    let noise, entropy, possiblities, r;
    let min = 1000;
    let argmin = -1;    // wave_element_index
    let tileRules = designRules.tileRules;
    let itemRules = designRules.itemRules;
    
    // update min to reflect highest entropy and noise
    for (let i = 0; i < waves.length; i++) {
        if (OnBoundary(i % w, i / w, periodic, w, h)) { continue; }

        possiblities = elemsData.possible_choices[i];
        // console.log(possiblities)
        if (possiblities == 0) {
            return false;
        }
        entropy = elemsData.entropies[i];
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
    if(init == true) {
        argmin = Math.floor(Math.random()*waves.length);
        init = false;
    }

    // Creates distribution array that reflects the weight of each tile according to the number of tiles in an element of the wave
    let distribution = new Array(elemsData.amount);
    let wave = waves[type][argmin];
    for (let t = 0; t < elemsData.amount; t++) {
        distribution[t] = wave[t] ? elemsData.weights[t] : 0;
        // distribution[t] /= elemsData.amount;
    }

    // {int} r: randomly choosen tile index using weighted selection
    r = _NonZeroIndex(distribution, elemsData.carray, elemsData.csumweight);

    // frequency adjustment
    if(type == 'items' && elemsData.frequencies[r] == 0){ 
        // defaults to no tile
        return Ban(waves[type], elemsData, argmin, r, elemsToRemove, 'frequency')

    } else if(type == 'items' && elemsData.frequencies[r] > 0){
        elemsData.frequencies[r] -= 1;
    }    

    /**
     * Decides which tiles to ban
     * loop through number of tiles
     * if counter is equal to randomly chosen tile AND wave already knows its false then ban the tile
     */
    
    for (let t = 0; t < elemsData.amount; t++) {
        
        if (wave[t] != (t == r)) {
            // argmin = wave element index to remove
            // t = tile index to remove
            elemsToRemove = Ban(waves[type], elemsData, argmin, t, 
                elemsToRemove, 'observation');
        } 
    }

    let chosen_tile = elemsData.names[r];
    let chosen_name = chosen_tile.split(/[ ]+/)[0];
    if (WaveData["rules"][type][chosen_name] != undefined) {
        let elem_rules = WaveData["rules"][type][chosen_name];
        Force(waves[type], r, argmin,tileRules, itemRules, elem_rules, 
            type, WaveData, elemsData, elemsToRemove, periodic, w, h);
    } 
    
    return null;
}
/**
 * 
 * @param {matrix} wave 
 * @param {int} r : tile index
 * @param {int} argmin : wave element index
 * @param {object} rules : rules set by user constraint
 */
// TODO: You ever seen bad code? Well it's right here. Clean this up for the 
//  love of god.
function Force(wave, r, argmin, tile_rule, item_rule, elem_rules, elem_type, tile_data, elemsData, elemsToRemove, periodic, width, height) {

    let wave_elem;
    let sorted_entropies;
    let xmin, xmax, ymin, ymax;
    let collapse_indexes;
    let w;
    // TODO: This is really gross... Maybe just want to break these up into 
    // Further functions so we can clean things up :)
    switch(elem_type){
        case 'tiles':
            switch(tile_rule) {
                case 'observe':
                    /** area collapse */
                    // calculate distance 
                    // debugger
                    if(elem_rules[tile_rule] == undefined) {break;}
                    if(elem_rules[tile_rule]["distance"] != undefined){
                        xmin = elem_rules[tile_rule]["distance"][0];
                        xmax = elem_rules[tile_rule]["distance"][1];
                        ymin = elem_rules[tile_rule]["distance"][2];
                        ymax = elem_rules[tile_rule]["distance"][3];
                    } else {
                        throw "no distance constraint given"
                    }
                    // debugger
                    // get tile index of lowest entropy
                    collapse_indexes = GetCollapseArea(xmin, xmax, ymin, ymax, width, height, elemsData, argmin);
                    sorted_entropies = GetEntropySort(collapse_indexes);
                    while(sorted_entropies.length > 0){
                        // debugger
                        argmin = sorted_entropies.shift();  // chosen wave element
                        let distribution = new Array(elemsData.amount);
                        w = wave[argmin][elem];
                        for (let i = 0; i < elemsData.amount; i++) {
                            distribution[i] = w[i] ? elemsData.weights[i] : 0;
                            // distribution[t] /= elemsData.amount;
                        }
                        r = _NonZeroIndex(distribution, elemsData.carray, 
                            elemsData.csumweight);    // chosen tile index within wave element
                        for (let t = 0; t < elemsData.amount; t++) {
        
                            if (w[t] != (t == r)) {
                                // argmin = wave element index
                                // t = tile index
                                elemsToRemove = Ban(wave, elemsData, elem, 
                                    argmin, t, elemsToRemove, 'tile force');
                            } 
                        }
                        Propagate(wave, elements_data, periodic, width, height, 
                            tile_data['propagator']);
                    }
                    
                break;
                case 'propagate':
                    /** area propagation */
                    // NOTE: adding tiles to the generative space is not implemented so this rule will not be able to produce results easily
                    if(elem_rules[tile_rule] == undefined) {break;}
                    if(elem_rules[tile_rule]["distance"] != undefined){
                        xmin = elem_rules[tile_rule]["distance"][0];
                        xmax = elem_rules[tile_rule]["distance"][1];
                        ymin = elem_rules[tile_rule]["distance"][2];
                        ymax = elem_rules[tile_rule]["distance"][3];
                    } else {
                        throw "no distance constraint given"
                    }
                    // get tile index of lowest entropy
                    collapse_indexes = GetCollapseArea(xmin, xmax, ymin, ymax, width, height, elemsData, argmin);
                    while(collapse_indexes.length > 0){
                        let argminObj = collapse_indexes.shift();  // chosen wave element
                        argmin = argminObj.index;
                        w = wave[argmin][elem];
                        for (let i = 0; i < elemsData.amount; i++) {
                            if((elemsData.types[i] == elem_rules[tile_rule]['type']) == false) {
                                elemsToRemove = Ban(wave, elemsData, elem, argmin, i, elemsToRemove, 'item force');;
                            }
                        }

                        Propagate(wave, elemsToRemove, periodic, width, height, elemsData, tile_data['propagator']);
                    }
                break;
                case 'weight':
                    // if(elem_rules[tile_rule] == undefined) {break;}
                    let weight;
                    let old_weight = elemsData.weights[r];
                    let old_log = (elemsData.weights[r] * Math.log(elemsData.weights[r]));
                    if(elem_rules[tile_rule] != undefined){
                        weight = elem_rules[tile_rule];
                    } else {
                        throw "no weight constraint given"
                    }
                    
                    if((elemsData.weights[r]+weight) <= 0) {
                        elemsData.weights[r] = Math.min(elemsData.weights);
                    } else {
                        elemsData.weights[r] += weight;
                    }
                    let log_weight = (elemsData.weights[r] * Math.log(elemsData.weights[r]));
                    for(let i = 0; i < wave.length; i++) {
                        elemsData.sums_of_weights[i] -= old_weight;
                        elemsData.sums_of_weights[i] += elemsData.weights[r];
                        elemsData.sums_of_log_weights[i] -= old_log;
                        elemsData.sums_of_log_weights[i] += log_weight;
                        elemsData.entropies[i] = elemsData.sums_of_log_weights[i] / elemsData.sums_of_weights[i] - Math.log(elemsData.sums_of_weights[i]); // recalculate entropy
                    }
                break;
                default:
                break;
            }
        break;
        case 'items':
            switch(item_rule){
                case 'distance':
                    if(elem_rules[item_rule] != undefined){
                        xmin = elem_rules[item_rule][0];
                        xmax = elem_rules[item_rule][1];
                        ymin = elem_rules[item_rule][2];
                        ymax = elem_rules[item_rule][3];
                    } else {
                        throw "no distance constraint given"
                    }
                    r = elem_rules["item"];
                    collapse_area = GetCollapseArea(xmin, xmax, ymin, ymax, width, height, elemsData, argmin);
                    let random = Math.floor(Math.random()*collapse_area.length);
                    elemsToRemove = [];
                    argmin = collapse_area[random].index;
                    w = wave[argmin][elem];

                    for (let t = 0; t < elemsData.amount; t++) {
        
                        if (w[t] != (t == r)) {
                            // argmin = wave element index
                            // t = tile index
                            elemsToRemove = Ban(wave, elemsData, elem, argmin, t, elemsToRemove, 'item force');
                        } 
                    }
                    elemsData.frequencies[r] -= 1;

                break;
                default:
                break;
            }
        break;
        default:
            break;
    }

    return null;
}
function GetCollapseArea(xmin,xmax,ymin,ymax,width,height,elemsData,chosen_index) {
    let index;
    let indexes=[];
    let xcomp, ycomp;
    let indexx,indexy;
    let prev_index;
    for(let i = (-1)*ymax; i <= ymax; i++){
        indexy = Math.floor(chosen_index/width) + i;
        if (indexy < 0 || indexy > height) { continue; }
        for(let j = (-1)*xmax; j <= xmax; j++){
            indexx = chosen_index%width + j;
            if(indexx < 0 || indexx > width) { continue; }
            index = indexx+indexy*width; // calculate index to observe
            xcomp = Math.abs((index%width) - (chosen_index%width));
            ycomp = Math.abs(Math.floor(index/width) - Math.floor(chosen_index/width));

            if( (xcomp < xmin &&  ycomp < ymin) || xcomp > xmax || ycomp > ymax) { continue;}
            if( index == prev_index) { continue;}

            if(elemsData.entropies[index] > 0){
                indexes.push({
                    index: index,
                    entropy: elemsData.entropies[index]
                });
            }
            prev_index = index;
        }
    }

    return indexes;
}
function GetEntropySort(indexes){
    var sortEnt = indexes.slice(0);
    sortEnt.sort(function(a,b) { return a.entropy - b.entropy;});
    let ordered_index = sortEnt.map(a => a.index);
    return ordered_index;
}

function Propagate(wave, WaveData, type, periodic, w, h, propagator) {
    let DX = [1, 0, -1, 0]; // [right, up, left, down]
    let DY = [0, -1, 0, 1]; // [right, up, left, down]
    let elemsToRemove = WaveData[type].elemsToRemove;
    let elemsData = WaveData[type];
    if (elemsData.compatible == undefined) {
        return [];
    }
    // item elem_to_remove never reaches this while loop
    while(elemsToRemove.length > 0) {
        let e1 = elemsToRemove.pop(); // element 1
        let index_1 = e1[0]; // index of element to remove
        let tile_1 = e1[1]; // tile within element to remove
        let x1 = index_1 % w;   // calculates x position of tile in map
        let y1 = Math.floor(index_1 / w);   // calculate y position of tile in map

        for (let d = 0; d < 4; d++) {
            let dx = DX[d];
            let dy = DY[d];
            let x2 = x1 + dx;   // x position of neighbor
            let y2 = y1 + dy;   // y position of neighbor

            // boundary check
            if (OnBoundary(x2, y2, periodic, w, h)) {
                continue;
            }
            
            // x position correction for index_2 calculation?
            if (x2 < 0) {
                x2 += w;
            } else if (x2 >= w) {
                x2 -= w;
            }

            if (y2 < 0) {
                y2 += h;
            } else if (y2 >= h) {
                y2 -= h;
            }

            // 
            let index_2 = x2 + y2 * w;  // Item 2 - calculates index of neighbor tile element within map
            let p = propagator[d][tile_1]; // an array of tiles to remove according to d
            /* propagator is a matrix
             * each element corresponds to [right, up, left, down]
             * each element is an array of all tiles
             * each tile is an array of tile index to remove from wave 
             * */
            let compat = elemsData.compatible[index_2]; // a matrix of number of compatible tiles
            for (let l = 0; l < p.length; l++) {
                let tile_2 = p[l]   // position of neighbor tile to remove
                let comp = compat[tile_2];  // array of number of compatible tiles with neighbor tile to be removed
                comp[d] = comp[d] - 1;  // decrease number of compatible tiles according to d
                if (comp[d] == 0) {
                    elemsToRemove = Ban(wave, elemsData, elem, index_2, tile_2, elemsToRemove, 'propagate');
                }
            }
        }
    }
    // debugger
    return elemsToRemove
}
// TODO: Check all of the Ban calls. You might be able to simplify this.
/**
 * Ban
 *  Removes tiles from wave.
 * @param {matrix} wave 
 * @param {object} elemsData
 * @param {int} wave_index : index of element in wave
 * @param {int} wave_elem : index of tile within element
 * @param {array} elemsToRemove 
 * @returns {array} elements to remove in wave
 */
function Ban(wave, elemsData, wave_index, wave_elem, elemsToRemove, origin) {

    let wave_array = wave[wave_index];    // creates array of tiles in chosen element
    // This is where Ban actually bans the undesired tile
    wave_array[wave_elem] = false;  // set tile to false according to wave_elem passed in

    // This is where Ban takes it a step further to get rid of the banned tile's number of compatible tiles
    if (elemsData.compatible != undefined) {
        // elemsData.compatible contains number of compatible tiles
        elemsData.compatible[wave_index][wave_elem] = [0,0,0,0];    // set the false tile's corresponding set of compatible tiles to 0
    }

    // Now it's time to actually set the banned tile up for removal 
    elemsToRemove.push([wave_index, wave_elem]);  // add the false tile to elemsToRemove array

    // Need to recalculate entropy for the element in the wave using Shannon Entropy
    if(elemsData.sums_of_weights[wave_index] == elemsData.weights[wave_elem] || elemsData.entropies == NaN) { 
        throw 'conflict detected'
    }
    let sum = elemsData.sums_of_weights[wave_index];    // get sum of weights for element with false tile
    let log_sums = elemsData.sums_of_log_weights[wave_index];
    elemsData.entropies[wave_index] += log_sums / sum - Math.log(sum); // recalculate entropy
    elemsData.possible_choices[wave_index] -= 1;    // decrease possible choices according to wave_index
    elemsData.sums_of_weights[wave_index] -= elemsData.weights[wave_elem];  
    elemsData.sums_of_log_weights[wave_index] -= elemsData.log_weights[wave_elem];
    sum = elemsData.sums_of_weights[wave_index];    // get sum of weights for element with false tile
    elemsData.entropies[wave_index] -= log_sums / sum - Math.log(sum);
    //TODO: Maybe not have a pass by reference call here? Maybe do something a bit more... idk better?
    return elemsToRemove;
}
function BinarySearch(array, value, start, end) {
    const middle = Math.floor((start + end)/2);
    if (value == array[middle] || (value < array[middle] && value > array[middle-1])) return array[middle];
    if (end - 1 === start) return Math.abs(array[start] - value) > Math.abs(array[end] - value) ? array[end] : array[start]; 
    if (value > array[middle]) return BinarySearch(array, value, middle, end);
    if (value < array[middle]) return BinarySearch(array, value, start, middle);
}
/**
 * Weighted choosing of tiles
 * @param {array} array: wave element 
 */
function _NonZeroIndex(distribution, cweights, csumweight) {
    let random = Math.random()*(csumweight+1);
    let choice = Math.floor(random);
    // binary search for first value that is larger than choice in cweights
    let tile_choice = BinarySearch(cweights, choice, 0, cweights.length);
    let index = cweights.indexOf(tile_choice);
    let elem = distribution[index];
    while(elem == 0) {
        choice = Math.floor(Math.random()*csumweight);
        tile_choice = BinarySearch(cweights, choice, 0, cweights.length);
        index = cweights.indexOf(tile_choice);
        elem = distribution[index];
    }
    
    return index;
}  
function OnBoundary(x, y, periodic, width, height) {
    return !periodic && (x < 0 || y < 0 || x >= width || y >= height);
}