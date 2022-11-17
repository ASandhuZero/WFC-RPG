import * as Constraints from "./Constraints/Constraints";
//TODO: Actually write out the pseudocode.
/**
 * Fill Partials
 *      Ban all tiles or just use
 *      some kind of partials.
 * ————————————————
 * Choose
 * Observe
 *      Design Observe
 * Propagate
 */

//TODO: Make a better mapping file for tile and items.
// Entry being something that is within the matrix itslef.

let entry = {
    setTile : false,
    setItem : false,
    "item" : [], // item is an array that either has nothing in it or an item. so something like this. [] || [1]
    "tile" : [], //All of the possible tiles, must have a tile however. TODO: What if there is no tile? What do we do then? 
    "entropy" : 0
}
/**
 * TODO: A way we could save time with item choice is by having some kind of look up JSON.
 * Also item choice must come last because first:
 * Choose tile
 * Roll to see if there should be item. 
 *  If no, then go next
 *  if yes, then:
 *      Remove all items that can't exist on tile
 *      If no items —> go next
 *      if items, then choose randomly.
 */

function WFCLog() {
    if (false) { console.log(arguments); }
}
/**
 * WaveFunctionCollapse
 * @param {*} map - All the data needed for WFC to work.
 * @returns 
 */
export function WFC(map, partial=null, neighborFlag=false, banList=[]) {
    let w = map.w ? map.w : 0;
    let h = map.h ? map.h : 0;
    let tilesetInfo = map.tilesetInfo;
    let data = tilesetInfo["data"];
    let neighbors = null;
    let neighborData = data["neighbors"];
    if (neighborFlag) {  neighborData = []; }
    // Getting the constraints for each type of data 
    // This really isn't robust TODO: Fix this later.
    let tiles = Constraints.GenerateTiles(data["tile_info"], w, h); // O(n^2)
    let rules = Constraints.GenerateRules(data["rules_info"]); // O(n)
    // Get neighbors
    if (neighborData.length != 0) { neighbors = neighborData; } 
    else { neighbors = Constraints.GetNeighbors(tiles); } // O(n^2)
    let propagator = GeneratePropagator(neighbors, tiles); // O(n^3) ...TODO: this is dumb
    tiles["rules"] = rules.tiles;
    tiles["propagator"] = propagator;
    let tileAmount = tiles.amount;
    let wave = GenerateWaves(tiles, w, h); // O(n)
    let result = null;
    let init = (partial===null); // if there is a partial, don't randomly choose the first element.
    //TODO: Make this function pure. Currently using a side effect to do the 
    //      change which isn't that great..
    Clear(wave,  tiles); // O(n^3)

    if (partial !== null) {
        //TODO: FillPartial doesn't have a debugger or a logger that fires when it fails...
        // We should fix this.
        FillPartial(wave, partial, tiles, propagator, tileAmount);
        WFCLog("partial has been filled!")
    }
    banBeforeHand(wave, banList, tiles, propagator);
    let entriesToRemove = [];
    while (result !== true) {
        result = Observe(wave, tiles, w, h, init); 
        if (init) { init = false; }
        if (result.length !== undefined) {
            let entry = wave[result[0]][result[1]];
            for (let i = 0; i < tileAmount; i++) {
                if (!entry.choices[i]) { entriesToRemove.push([entry, i]); }
            }
        }
        while (entriesToRemove.length !== 0) {
            let remove = entriesToRemove.pop();
            if (typeof remove === typeof 1) { debugger; }
            WFCLog("Removing", remove);
            let removed  = Ban(tiles, remove[0], remove[1], entriesToRemove);
            if (removed === null) { continue; }
            let newRemoves = Propagate(wave, removed, propagator)
            entriesToRemove = newRemoves.concat(entriesToRemove);
        }
    }
    let tileNames = tiles.names;
    let generated_tilemap = GenerateTileMap(wave, tileAmount, tileNames, w, h); // O(n^4)... Yep. This one is the one TODO: Fix this please, in some way.
    return generated_tilemap
}
/**
 * Clear
 * Will reset the entire wave to an unobserved state (as in all true).
 * @param {matrix} wave 
 * @param {json} tiles 
 */
//TODO: This should be a pure function, just return back the wave from this.
function Clear(wave, tiles) {
    let opposite = [2, 3, 0, 1];
    let tileData = tiles;
    let tileAmount = tileData.amount
    for (let i = 0; i < wave.length; i++) {
        for (let j = 0; j < wave[i].length; j++) {
            let entry = wave[i][j];
            for (let t = 0; t < tileAmount; t++) {
                entry.choices[t] = true;
                entry.logWeightSum = tileData.logWeightSum;
                entry.weightSum = tileData.weightSum;
                entry.entropy = tileData.entropy;
                let compatible = [0, 0, 0, 0];
                for (let d = 0; d < 4; d++) {
                    compatible[d] = tileData.propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                }
                entry.compatible[t] = compatible;
            }
        }
    }
}
function FillPartial(wave, partial, tiles, propagator, tileAmount) {
    let length = partial.length;
    let removeArr = [];
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < partial[i].length; j++) {
            let value = partial[i][j];
            if (wave[i][j] === undefined) { debugger; }
            if (value && wave[i][j].choices[value]) { 
                wave[i][j].choices[value] = true; 
                for (let k = 0; k < tileAmount; k++) {
                    if (k === value) { continue; }
                    removeArr.push([wave[i][j], k]);
                    while (removeArr.length !== 0) {
                        let toRemove = removeArr.pop();
                        let removed = Ban(tiles, toRemove[0], toRemove[1]);
                        if (removed === null) {  continue; }
                        removeArr = removeArr.concat(
                            Propagate(wave, removed, propagator));
                    }
                }
            }
        }
    }
    WFCLog(wave);
}
function banBeforeHand(wave, banList, tiles, propagator) {
    for (let i = 0; i < banList.length; i++) {
        let removeArr = [];
        let bannedTile = banList[i];
        for (let j = 0; j < wave.length; j++) {
            for (let k = 0; k < wave[j].length; k++) {
                if (wave[j][k].choices.filter(x => x===true).length === 1) {
                    continue;
                }
                removeArr.push([wave[j][k], bannedTile]);
                while (removeArr.length !== 0) {
                    let toRemove = removeArr.pop();
                    let removed = Ban(tiles, toRemove[0], toRemove[1]);
                    if (removed === null) {  continue; }
                    removeArr = removeArr.concat(
                        Propagate(wave, removed, propagator));
                }
            }
        }
    }
}
/**
 * GenerateTileMap
 * Uses wave booleans to create a new array from the data indexes.
 * @param {matrix} waves 
 * @param {int} tileAmount 
 * @param {json} tileNames 
 * @param {int} w 
 * @param {int} h 
 */
function GenerateTileMap(waves, tileAmount, tileNames, w, h) {
    let tilemap = new Array(w);
    for (let i = 0; i < w; i++) {
        tilemap[i] = new Array(h);
        for (let j = 0; j < h; j++) {
            let choices = waves[j][i].choices;
            let choice = 0;
            for (let k = 0; k < tileAmount; k++) {
                if (choices[k]) { 
                    choice = k; 
                    break;
                }
            }
            let tile = tileNames[choice].split(/[ ]+/);
            tilemap[i][j] = {
                name : tile[0],
                rotation : tile[1]
            };
        }
    }
    return tilemap;
}
/**
 * GeneratePropagator
 * @param {*} neighbors 
 * @param {*} tiles 
 * Returns a matrix of possible neighboring tiles.
 * @returns {object} locality_propagator
 */
function GeneratePropagator(neighbors, tiles) {
    let strict = false; //TODO: Figure out what Strict does exactly... As in can we remove
    let tileAmount = tiles.names.length
    let propagator = new Array(4);
    for (let direction = 0; direction < 4; direction++) {
        propagator[direction] = new Array(tileAmount);
        for (let i = 0; i < tileAmount; i++) {
            propagator[direction][i] = new Array(tileAmount).fill(-1); // -1 should never be a tile ID. If it is then something has gone horribly wrong.
        }
    }
    for (let i = 0; i < neighbors.length; i++) {
        // dissect neighbor constraints
        let up = "";
        let down = "";
        let left = "";
        let right = "";
        let U, D;
        let R, L;
        let neighborPair = neighbors[i];
        if (neighborPair.hasOwnProperty("up")) {
            up = neighborPair.up;
            down = neighborPair.down;  // user defined rotation for left tile
            U = tiles.rotations[tiles.IDs[up]];
            D = tiles.rotations[tiles.IDs[down]];
            L = tiles.rotations[D[3]]
            R = tiles.rotations[U[3]]
            propagator[1][D[0]][U[0]] = U[0];
        } else {
            left = neighborPair.left;  // user defined rotation for right tile
            right = neighborPair.right;  // user defined rotation for right tile
            L = tiles.rotations[tiles.IDs[left]];   // uses tile id number
            R = tiles.rotations[tiles.IDs[right]];   // array of tile id number according to its rotations
            D = tiles.rotations[L[1]];
            U = tiles.rotations[R[1]];
            propagator[0][L[0]][R[0]] = R[0];   // propagator[R, U, L, D]
        }
        // TODO: This is one of the most frustrating bugs. Basically
        // determines which neighbor tiles can exist
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
    for (let tile_1 = 0; tile_1 < tileAmount; tile_1++) {
        for (let tile_2 = 0; tile_2 < tileAmount; tile_2++) {
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
            let uniqueNeighbors = [];
            let neighbor_array = direction_array[i];
            for (let j = 0; j < neighbor_array.length; j++) {
                let neighbor = neighbor_array[j];
                if (neighbor !== -1) { uniqueNeighbors.push(neighbor); }
            }
            // Fun fact, javascript sort does not sort numbers by ascending order. Instead, they are transformed into strings and sorted alphabetically. The arrow function ensures sort does an actual numerical sort. 
            // Doc: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
            uniqueNeighbors = uniqueNeighbors.sort((a, b) => a - b);
            propagator[direction][i] = uniqueNeighbors;
        }
    }
    return propagator;
}

function getNearNeighbors(i, j, w, h) {
    let x = i;
    let y = j
    let neighbors = [];
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let xOffset = x+i;
            let yOffset = y+j;
            if (xOffset < 0 || xOffset >= w) { continue; }
            if (xOffset ===  x && yOffset === y) { continue; }
            if (yOffset < 0 || yOffset >= h) { continue; }
            neighbors.push([xOffset, yOffset]);
        }
    }
    return neighbors;
}
/**
 * GenerateWave
 * @param {*} tileAmount 
 * @param {*} itemAmount 
 * @param {*} w 
 * @param {*} h
 * @returns matrix with each element being a true boolean array size of tiles. 
 * Note: A wave is just a tensor with each entry being a true tile-space, 
 *       and all of the entropies and weights. 
 */
 function GenerateWaves(tileData, w, h) {
    let tileAmount = tileData.amount;
    let wave = new Array(w);
    for (let i = 0; i < w; i++) {
        wave[i] = new Array(h);
        for (let j = 0; j < h; j++) {
            wave[i][j] = {
                choices : new Array(tileAmount).fill(true),
                weightSum : tileData.weightSum,
                logWeightSum : tileData.logWeightSum,
                entropy : tileData.entropy,
                compatible : new Array(tileAmount).fill([0,0,0,0]),
                neighbors : getNearNeighbors(i, j, w, h),
                coordinates : [i, j]
            }
        }
    }
    return wave;
}
function Observe(wave, tiles, w, h, init) {
    let noise, entropy, possiblities, r;
    let min = 1000;
    let iMin = -1; // wave_element_index
    let jMin = -1;
    // update min to reflect highest entropy and noise
    if (init) {
        iMin = Math.floor(Math.random()*wave.length);
        jMin = Math.floor(Math.random()*wave[iMin].length);
    } else {
        for (let i = 0; i < wave.length; i++) {
            for (let j = 0; j < wave[i].length; j++) {
                if (OnBoundary(i % w, i / w, w, h)) { continue; }
                let entry = wave[i][j];
                possiblities = entry.choices.filter(x => x===true).length;
                if (possiblities === 1) { continue; }
                if (possiblities === 0) { return false; }
                entropy = entry.entropy;
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
    let distribution = new Array(tiles.amount);
    for (let t = 0; t < tiles.amount; t++) {
        distribution[t] = wave[iMin][jMin].choices[t] ? tiles.weights[t] : 0;
    }
    
    // {int} r: randomly choosen tile index using weighted selection
    r = _NonZeroIndex(distribution, tiles.carray, tiles.csumweight);
    /**
     * Decides which tiles to ban
     * loop through number of tiles
     * if counter is equal to randomly chosen tile AND wave already knows its false then ban the tile
     */
    
    for (let t = 0; t < tiles.amount; t++) {
        if (t !== r) { 
            wave[iMin][jMin].choices[t] = false;
        }
    }
    return [iMin, jMin];
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
function Force(wave, r, argmin, tile_rule, item_rule, elem_rules, 
    elem_type, tile_data, elemsData, elemsToRemove, width, height) {

    let sorted_entropies;
    let xmin, xmax, ymin, ymax;
    let collapse_indexes;
    let w;
    // TODO: This is really gross... Maybe just want to break these up into 
    // Further functions so we can clean things up :)
    switch(elem_type) {
        case 'tiles':
            switch(tile_rule) {
                case 'observe':
                    WFCLog("Currently in observe.");
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
                                elemsToRemove = Ban(elemsData, elem, 
                                    argmin, t, elemsToRemove);
                            } 
                        }
                        Propagate(wave, elements_data, tile_data['propagator']);
                    }
                    
                break;
                case 'propagate':
                    WFCLog("Currently area propagating.")
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
                                elemsToRemove = Ban(elemsData, elem, argmin, i, 
                                    elemsToRemove);;
                            }
                        }

                        Propagate(wave, elemsToRemove, tile_data['propagator']);
                    }
                break;
                case 'weight':
                    WFCLog("Currently in weight readjustment.")
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
                            elemsToRemove = Ban(elemsData, elem, argmin, t, elemsToRemove);
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
// TODO: Refactor this function, please.
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
            // TODO: This seems horrible, please remove or do something different.
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

function Propagate(wave, removed, propagator) {
    let elemsToRemove = new Array();
    let waveElem = removed[0];
    let bannedTile = removed[1];
    let coordinates = waveElem.coordinates;
    if (waveElem.compatible == undefined) { throw waveElem, "undefined compatability"; }
    for (let d = 0; d < waveElem.neighbors; d++) {
        let neighborCoordinates = waveElem.neighbors[d];
        let iNeighbor = neighborCoordinates[0];
        let jNeighbor = neighborCoordinates[1];
        let neighbor = wave[iNeighbor][jNeighbor]
        
        if (neighbor.choices.filter(x => x===true).length === 1) {
            WFCLog("Propagate: Neighbor is stable!", x, y,);
            return elemsToRemove;
        }
        if (coordinates[1] === jNeighbor) {
            if (coordinates[0] < iNeighbor) { p = propagator.down; }
            if (coordinates[0] > iNeighbor) { p = propagator.up; }
        }
        if (coordinates[0] === iNeighbor) {
            if (coordinates[1] < jNeighbor) { p = propagator.right; }
            if (coordinates[1] > jNeighbor) { p = propagator.left; }
        }
        p = p[bannedTile]; // an array of tiles to remove according to d
        /* propagator is a matrix
        * each element corresponds to [right, up, left, down]
        * each element is an array of all tiles
        * each tile is an array of tile index to remove from wave 
        * */
        let neighborCompatibleArr = wave[x][y].compatible; 
        for (let i = 0; i < p.length; i++) {
            let tile = p[i]   // position of neighbor tile to remove
            if (!wave[x][y].choices[tile]) { 
                WFCLog("Propagate: this tile is already banned!", x, y, tile);
                continue; 
            }
            let compatibleCount = neighborCompatibleArr[tile];  // array of number of compatible tiles with neighbor tile to be removed
            compatibleCount[d] = compatibleCount[d] - 1;  // decrease number of compatible tiles according to d
            if (compatibleCount[d] === 0) {
                WFCLog("Propagate: A neighbor tile must be banned!", x, y, tile);
                elemsToRemove.push([neighbor, tile]);
            }
            if (compatibleCount[d] < 0) { 
                WFCLog("The tile", x, y, tile, "should have been banned!", wave[x][y].choices[tile]);
                debugger;
                throw "A compatible cell has reached zero. Here they are ", i, j, tile; } 
        }
    }
    if (elemsToRemove.length > 0) { debugger; }
    WFCLog("Propagate: The banned choice has been propagated!", elemsToRemove);
    return elemsToRemove;
}
// TODO: Check all of the Ban calls. You might be able to simplify this.
/**
 * Ban
 *  Removes tiles from wave.
 * @returns {array} elements to remove in wave
 */
function Ban(typeData, entry, bannedTile) {

    // If this is true, then the tile has become stable.
    if (entry === undefined) { debugger;}
    if (entry.choices.filter(x => x===true).length === 1) { 
        return null;
    }
    // This is where Ban actually bans the undesired tile
    if ( entry === undefined) { debugger; }
    // This is where Ban takes it a step further to get rid of the banned tile's number of compatible tiles   
    entry.choices[bannedTile] = false;  // set tile to false according to wave_elem passed in
    if (entry.choices[bannedTile]) { debugger; }  
    
    if (entry.compatible != undefined) {
        entry.compatible[bannedTile] = [0,0,0,0];    // set the false tile's corresponding set of compatible tiles to 0
    }
    let weight = typeData.weights[bannedTile];
    entry.weightSum -= weight;  
    entry.logWeightSum -= weight * Math.log(weight);
    let weightSum = entry.weightSum;    // get sum of weights for element with false tile
    let logWeightSum = entry.logWeightSum;
    entry.entropy -= logWeightSum / weightSum - Math.log(weightSum); // recalculate entropy
    WFCLog("Ban: The tile", entry, bannedTile, "has been banned!");
    return [entry, bannedTile];
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
function OnBoundary(x, y, width, height) {
    return (x < 0 || y < 0 || x >= width || y >= height);
}