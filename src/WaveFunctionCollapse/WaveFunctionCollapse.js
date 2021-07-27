
import * as Constraints from "./Constraints/Constraints"

/**
 * WaveFunctionCollapse
 * @param {*} periodic 
 * @param {*} tilemapData - All the data needed for WFC to work.
 * @returns 
 */
//TODO: Pass everything as a param object rahter than individual variables.
//  then break it out.
export function WFC(periodic, tilemapData, partial = null, strict=false) {
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
    let propagator = GeneratePropagator(neighbors, tiles, items, strict); // O(n^3) ...TODO: this is dumb

        tiles.rules = rules.tiles;
        items.rules = rules.items;
        let waveData = {
        "tiles": tiles,
        "items": items,
        "rules": rules,
        "neighbors": neighbors,
        "propagator": propagator
    }
    let tileAmount = tiles.amount;
    let itemAmount = items.amount;

    let observables = ["tiles", "items"]
    let waves = GenerateWaves(tiles, items, w, h); // O(n)
    
    let result = null;
    let definiteState = 0;
    let init = (partial===null); //Basically if there is a partial, don't try to randomly choose the first element.

    Clear(waves,  waveData); // O(n^3) TODO: I was a broken man when I wrote this function. 
    
    let removeObservables = {};
    let designRules = {
        tileRules : tileRules,
        itemRules : itemRules
    }
    let type = "tiles";
    let elemsToRemove = []
    for (let type of observables) {
        // removeObservables[type] = []
        // elemsToRemove = [];
        // waveData[type].elemsToRemove = removeObservables[type]
    }
    if (partial !== null) {
        FillPartial(waves.tiles, partial, periodic, waveData, w, h, tileAmount);
        console.log("partial has been filled!")
    }
    elemsToRemove = [];
    while (result !== true) {
        // result returns [chosen tile, chosen index], true (argmin == -1), false (possiblities == 0), or null
        result = Observe(waves[type], waveData[type], periodic, w, h, 
            designRules, init); // TODO: Fix observe. Like once in your life, please. I can't begin to describe how bad this function is.
        if (init) { init = false; }
        if (result.length !== undefined) {
            elemsToRemove = result;
        }
        while (elemsToRemove.length !== 0) {
            let toRemove = elemsToRemove.pop();
            let removed  = Ban(waves[type], waveData[type], toRemove[0],
                toRemove[1], toRemove[2], elemsToRemove, "main loop");
            if (removed === null) { continue; }
            elemnsToRemove = elemsToRemove.concat(Propagate(waves[type], 
                waveData[type], removed, periodic, w, h, propagator));
        }
    }
    // Converts index to name to match with rules
    // if (result === true) {
    //     definiteState++;
    // } else if (result === false) {
    //     debugger;
    //     return [];
    // } 
    // while (definiteState != observables.length) {
    //     definiteState = 0; 
    //     for (let type of observables) {
                // if (result === true) {
                //     definiteState++;
                // } else if (result === false) {
                //     debugger;
                //     return [];
                // } 
    //     }
    // }
    let tileNames = waveData.tiles.names;
    let itemNames = waveData.items.names;
    let generated_tilemap = GenerateTileMap(waves, tileAmount, itemAmount, 
        tileNames, itemNames, w, h); // O(n^4)... Yep. This one is the one TODO: Fix this please, in some way.
    console.log(waves[type]);
    debugger;
    return generated_tilemap
}
/**
 * Clear
 * Will reset the wave to an unobserved state (as in all true).
 * Reset the compatible tiles by going backward through the propgator data collection.
 * Reset all entropies for all data that can be observed (tiles, items, etc)
 * @param {matrix} waves 
 * @param {int} tileAmount 
 * @param {json} waveData 
 */
function Clear(waves, waveData) {
    let opposite = [2, 3, 0, 1];
    let tileData = waveData.tiles;
    let itemData = waveData.items;
    let tileAmount = tileData.amount
    let itemAmount = itemData.amount;

    for (let i = 0; i < waves.tiles.length; i++) {
        for (let j = 0; j < waves.tiles[i].length; j++) {
            for (let t = 0; t < tileAmount; t++) {
                let elem = waves.tiles[i][j];
                elem.choices[t] = true;
                elem.logWeightSum = tileData.logWeightSum;
                elem.weightSum = tileData.weightSum;
                elem.entropy = tileData.entropy;
                for (let d = 0; d < 4; d++) {
                    elem.compatible[t][d] = 
                        waveData.propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                }
            }
        }
    }
    for (let i = 0; i < waves.items.length; i++) {
        for (let j = 0; j < waves.items[i].length; j++)
            for (let t = 0; t < itemAmount; t++) {
                let elem = waves.items[i][j];
                elem.choices[t] = true;
                elem.logWeightSum = itemData.logWeightSum;
                elem.weightSum = itemData.weightSum;
                elem.entropy = itemData.entropy;
            }
    }
}
function FillPartial(wave, partial, periodic, WaveData, w, h, tileAmount) {
    let tileData = WaveData.tiles;
    let length = partial.length;
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < partial[i].length; j++) {
            let value = partial[i][j];
            if (value) { 
                wave[i][j].choices[value] = true; 
                for (let k = 0; k < tileAmount; k++) {
                    if (k === value) { continue; }
                    // BAN MAKES THE ELEMENTS TO REMOVE
                    let removed = Ban(wave, tileData, i, j, k, 
                        tileData.elemsToRemove, 'fill partial');
                    // PROPAGATE SENDS OUT THOSE CHANGES.
                    Propagate(wave, WaveData['tiles'], removed, periodic, 
                        w, h, WaveData.propagator);
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
 * @param {json} tileNames 
 * @param {json} itemNames 
 * @param {int} w 
 * @param {int} h 
 */
function GenerateTileMap(waves, tileAmount, itemAmount, tileNames, itemNames, w, h) {
    let tilemap = {
        tiles : new Array(w),
        items : new Array(w)
    }
    console.log(waves["tiles"]);
    console.log(tileNames); 


    for (let i = 0; i < w; i++) {
        tilemap.tiles[i] = new Array(h);
        tilemap.items[i] = new Array(h);
        for (let j = 0; j < h; j++) {
            let choices = waves.tiles[j][i].choices;
            let choice = 0;
            for (let k = 0; k < tileAmount; k++) {
                if (choices[k]) { choice = k; }
            }
            let tile = tileNames[choice].split(/[ ]+/);
            tilemap.tiles[i][j] = {
                name : tile[0],
                rotation : tile[1]
            };
            // ITEMS are not being chosen right now... figure that out TODO:
            // choices = waves.items[i][j].choices;
            // choice = 0;
            // for (let k = 0; k < itemAmount; k++) {
            //     if (choices[k]) { choice = k; }
            // }
            // let item = choice;
            // tilemap.items[i][j] = item;
        }
    }
    //TODO: Maybe we want to throw something if there is no tilemap outputted?
    console.log(tilemap);
    return tilemap;
    
}
/**
 * GeneratePropagator
 * @param {*} neighbors 
 * @param {*} tiles 
 * @param {*} items 
 * Returns a matrix of possible neighboring tiles.
 * @returns {object} locality_propagator    
 */
function GeneratePropagator(neighbors, tiles, items, strict) {
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
        // TODO: This is one of the most frustrating bugs. Basically
        // If a tile isn't defined, then it should skip through the undefined
        //tile, but there seems to be something wrong. Validate the josn, me
        // thinks.
        if (R === undefined) { debugger; }
        if (L === undefined) { debugger; }
        let D = tiles.rotations[L[1]];
        let U = tiles.rotations[R[1]];
        // determines which neighbor tiles can exist
        propagator[0][L[0]][R[0]] = R[0];   // propagator[R, U, L, D]
        if (!strict) {
            propagator[0][L[6]][R[6]] = R[6];
            propagator[0][R[4]][L[4]] = L[4];
            propagator[0][R[2]][L[2]] = L[2];
            propagator[1][D[0]][U[0]] = U[0];
            propagator[1][U[6]][D[6]] = D[6];
            propagator[1][D[4]][U[4]] = U[4];
            propagator[1][U[2]][D[2]] = D[2];
        }

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
function GenerateWaves(tileData, itemData, w, h) {
    let waves = {
        "tiles" : [],
        "items" : []
    }
    //TODO: Using wave and wave1 to avoid having to deep copy problem. 
    // Figure out a better solution.
    let tileAmount = tileData.amount;
    let itemAmount = itemData.amount;
    let newWave = new Array(w);
    let newWave1 = new Array(w);
    let wave = new Array(w);
    let wave1 = new Array(w);
    for (let i = 0; i < w; i++) {
        newWave[i] = new Array(h);
        newWave1[i] = new Array(h);
        for (let j = 0; j < h; j++) {
            newWave[i][j] = {
                choices : new Array(tileAmount).fill(true),
                weightSum : tileData.weightSum,
                logWeightSum : tileData.logWeightSum,
                entropy : tileData.entropy,
                compatible : new Array(tileAmount).fill([0,0,0,0])
            }

            newWave1[i][j] = {
                choices : new Array(itemAmount).fill(true),
                currentEntropy : 0,
                weightSum : 0,
                logWeightSum : 0,
            }
        }
    }
    for (let i = 0; i < w * h; i++) {
        wave[i] = new Array(tileAmount).fill(true);
        wave1[i] = new Array(tileAmount).fill(true);
    }
    waves.tiles = wave;
    waves.items = wave1;
    waves.length = (w * h);
    waves.tiles = newWave;
    waves.items = newWave1;

    return waves;
}
function Observe(wave, waveData, periodic, w, h, designRules, init) {
    let noise, entropy, possiblities, r;
    let min = 1000;
    let iMin = -1;    // wave_element_index
    let jMin = -1;
    let elemsToRemove = [];
    let tileRules = designRules.tileRules;
    let itemRules = designRules.itemRules;
    // update min to reflect highest entropy and noise
    if(init == true) {
        iMin = Math.floor(Math.random()*wave.length);
        jMin = Math.floor(Math.random()*wave[iMin].length);
        init = false;
    } else {
        for (let i = 0; i < wave.length; i++) {
            for (let j = 0; j < wave[i].length; j++) {
                if (OnBoundary(i % w, i / w, periodic, w, h)) { continue; }
                let elem = wave[i][j];
                possiblities = elem.choices.filter(x => x===true).length;
                if (possiblities === 1) { continue; }
                if (possiblities === 0) { return false; }
    
    
                entropy = elem.entropy;
                // if (possiblities === 1) {debugger;} //SOMETHING IS WRONG HERE.
                if (possiblities > 1 && entropy <= min) {
                    // let noise = 0.000001 * this.random();
                    noise = 0.000001;
                    if (entropy + noise < min) {
                        min = entropy + noise;
                        iMin = i;
                        jMin = j;
                    }
                }
            }
        }
    }
    if (iMin === -1 && jMin === -1) {
        return true;
    }
    


    // Creates distribution array that reflects the weight of each tile according to the number of tiles in an element of the wave
    let distribution = new Array(waveData.amount);
    for (let t = 0; t < waveData.amount; t++) {
        distribution[t] = wave[iMin][jMin].choices[t] ? waveData.weights[t] : 0;
    }
    
    // {int} r: randomly choosen tile index using weighted selection
    r = _NonZeroIndex(distribution, waveData.carray, waveData.csumweight);
    //TODO: This focuses on item banning... Add this back in later.
    // frequency adjustment
    // if(type == 'items' && waveData.frequencies[r] == 0) { 
    //     // defaults to no tile
    //     // return Ban(waves[type], waveData, argmin, r, elemsToRemove, 'frequency')
        
    // } else if(type == 'items' && waveData.frequencies[r] > 0) {
    //     waveData.frequencies[r] -= 1;
    // }    

    /**
     * Decides which tiles to ban
     * loop through number of tiles
     * if counter is equal to randomly chosen tile AND wave already knows its false then ban the tile
     */
    
    for (let t = 0; t < waveData.amount; t++) {
        if (t !== r) { elemsToRemove.push([iMin, jMin, t]); } 
    }

    // waveData.elemsToRemove = elemsToRemove;
    let chosen_tile = waveData.names[r];
    let chosen_name = chosen_tile.split(/[ ]+/)[0];
    //TODO: removed rulesObverseation because, uh, I want to debug everything
    // else, and this will be a nightmare to refactor.
    // if (waveData["rules"][chosen_name] != undefined) {
    //     let elem_rules = waveData["rules"][type][chosen_name];
    //     Force(waves[type], r, argmin,tileRules, itemRules, elem_rules, 
    //         type, waveData, waveData, elemsToRemove, periodic, w, h);
    // } 
    return elemsToRemove;
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

function Propagate(wave, typeData, removed, periodic, w, h, propagator) {
    let DX = [1, 0, -1, 0]; // [right, up, left, down]
    let DY = [0, -1, 0, 1]; // [right, up, left, down]
    if (typeData.compatible == undefined) {
        return [];
    }
    let elemsToRemove = [];
    // item elem_to_remove never reaches this while loop
    let x1 = removed[0]; // index of element to remove
    let y1 = removed[1]
    let tile1 = removed[2]; // tile within element to remove
    
    for (let d = 0; d < 4; d++) {
        let x2 = x1 + DX[d];   // x position of neighbor
        let y2 = y1 + DY[d];   // y position of neighbor

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
        if (tile1 === undefined) {debugger; } 
        if (d === undefined) {debugger; } 
        if (propagator === undefined) {debugger; } 
        let p = propagator[d][tile1]; // an array of tiles to remove according to d
        /* propagator is a matrix
        * each element corresponds to [right, up, left, down]
        * each element is an array of all tiles
        * each tile is an array of tile index to remove from wave 
        * */
        let compat = wave[x2][y2].compatible; // a matrix of number of compatible tiles
        for (let i = 0; i < p.length; i++) {
            let tile2 = p[i]   // position of neighbor tile to remove
            let comp = compat[tile2];  // array of number of compatible tiles with neighbor tile to be removed
            if (comp[d] < 0) { continue; }
            comp[d] = comp[d] - 1;  // decrease number of compatible tiles according to d
            //TODO: comptible can go below zero. Figure out what this means.
            if (comp[d] == 0) {
                elemsToRemove.push([x2, y2, tile2]);
                // elemsToRemove = Ban(wave, typeData, x2, y2, tile2, 
                //     elemsToRemove, 'propagate');
            }
        }
    }
    return elemsToRemove;
}
// TODO: Check all of the Ban calls. You might be able to simplify this.
/**
 * Ban
 *  Removes tiles from wave.
 * @param {matrix} wave 
 * @param {object} typeData
 * @param {int} waveIndex : index of element in wave
 * @param {int} index : index of tile within element
 * @param {array} elemsToRemove 
 * @returns {array} elements to remove in wave
 */
// function Ban(wave, typeData, row, col, waveElem, elemsToRemove, origin) {
function Ban(wave, typeData, row, col, index, origin) {

    // console.log(origin);
    let waveArray = wave[row][col];
    // If this is true, then the tile has become stable.
    if (waveArray.choices.filter(x => x===true).length === 1) { 
        console.log(row, col);
        return null;
    }
    // This is where Ban actually bans the undesired tile
    if ( waveArray === undefined) { debugger; }
    waveArray.choices[index] = false;  // set tile to false according to wave_elem passed in
    // This is where Ban takes it a step further to get rid of the banned tile's number of compatible tiles
    if (waveArray.compatible != undefined) {
        // elemsData.compatible contains number of compatible tiles
        //TODO: I think the compatibility being calculated here is wrong...
        waveArray.compatible[index] = [0,0,0,0];    // set the false tile's corresponding set of compatible tiles to 0
    }
    
    // Now it's time to actually set the banned tile up for removal 
    // Need to recalculate entropy for the element in the wave using Shannon Entropy
    if(waveArray.weightSum == typeData.weights[index] || waveArray.entropy == NaN) { 
        console.log(row, col);
        debugger;
        // throw 'conflict detected';
    }
    if (waveArray.weightSum < 0) { 
        console.log(row, col);
        debugger; 
    }
    let weight = typeData.weights[index];
    waveArray.weightSum -= weight;  
    waveArray.logWeightSum -= weight * Math.log(weight);
    let weightSum = waveArray.weightSum;    // get sum of weights for element with false tile
    let logWeightSum = waveArray.logWeightSum;
    waveArray.entropy -= logWeightSum / weightSum - Math.log(weightSum); // recalculate entropy
    return [row, col, index];
}
function BinarySearch(array, value, start, end) {
    if (array === undefined) { debugger;}
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