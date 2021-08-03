//TODO: Maybe doing a bitarray instead might be the solution here...
function Test() {
    let mapping = {}
    // Mapping numbers to bits.
    let fillbit = 1;
    let count = 0;
    tileAmount = 0;
    let testConst = 40;
    let testTileCount = 64;
    let weights = {};
    for (let i = 0; i <= testTileCount; i++) {
        mapping[i] = {
            bit : fillbit, 
            shift : count
        }
        weights[i] = 1 + i;
        fillbit = fillbit << 1;
        if ((fillbit | 0) === 0) { fillbit = 1; count++; }
        tileAmount++;
    }
    if (fillbit > 0) { 
        //undoing last shift...
        fillbit = fillbit >>> 1;
        count++; 
        let fillBitLength = getBits(fillbit).length;
        for (let i = 0; i < fillBitLength; i++) {
            let bit = 1 << i;
            fillbit |= bit;
        }
    }
    console.log("mapping", mapping);
    // Making random neighbors...
    let constraints = [];
    for (let i = 0; i < testConst * testConst; i++) {
        let randRight = Math.ceil(Math.random() * testTileCount);
        let randLeft = Math.ceil(Math.random() * testTileCount);
        constraints.push({
            "right" : randRight,
            "left" : randLeft
        })
    }
    console.log("constraints", constraints);
    let mappedNeighbors = {};
    let neighbors = {};
    while (constraints.length !== 0) {
        let constraint = constraints.pop();
        let left = constraint.left;
        let right = constraint.right;
        if (mappedNeighbors[left] === undefined) { 
            neighbors[left] = 0
            mappedNeighbors[left] = new Array(count).fill(0); 
        }
        neighbors[left]++;
        let mappedNeighbor = mapping[right];
        let neighborBits = mappedNeighbors[left][mappedNeighbor.shift];
        // mappedNeighbors[left][mappedNeighbor.shift] = neighborBits | mappedNeighbor.bit;
        mappedNeighbors[left][mappedNeighbor.shift] = -1;
    }
    console.log("mappedNeighbors", mappedNeighbors);
    // Making test matrix...
    let bitMatrix = new Array(testConst);
    for (let i = 0; i < testConst; i++) {
        bitMatrix[i] = new Array(testConst);
        for (let j = 0; j < testConst; j++) {
            bitMatrix[i][j] = {
                adjacents : setAdjacents(i,j,testConst, testConst),
                tiles : new Array(count).fill(-1),
                neighbors : {}, 
                banned : 0
            }
            bitMatrix[i][j].tiles[count-1] &= fillbit;
        }
    }
    console.log(bitMatrix);
    let banArray = [];
    let stable = false;
    let stableTiles = 0;
    // Actual WFC code...
    while (!stable) {
        banArray = ChooseBit(bitMatrix, count, mappedNeighbors, tileAmount, 
            mapping, weights);
        // We make a tile stable when we choose it.
        stableTiles++;
        if (banArray !== null) {
            PropagateBits(banArray, count, bitMatrix, mapping, mappedNeighbors);
        }
        if (stableTiles === testConst*testConst) {
            stable = true;
        }
    }
    let correctCount = 0;
    let bans = 0;
    for (let i = 0; i < testConst; i++) {
        for (let j = 0; j < testConst; j++) {
            let cell = bitMatrix[i][j];
            if (typeof cell.tiles === typeof 1) { correctCount++; }
            bans += cell.banned;
        }
    }
    if (correctCount === testConst*testConst) {
        console.log("THE BITMATRIX IS STABLE.", bans);
    }
    debugger;
}

function deepCopy(x) {
    let copy;
    if (Array.isArray(x)) {
        copy = new Array(x.length);
        for (let i = 0; i < x.length; i++) { copy[i] = x[i]; }
    } else {
        copy = {};
        if (x === undefined) { debugger; }
        let keys = Object.keys(x);
        for (let i = 0; i < keys.length; i++) { 
            copy[keys[i]] = deepCopy(x[keys[i]]); 
        }
    }
    return copy;
}

function setAdjacents(x, y, w, h) {
    let adjacents = [];
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (i === -1 && (j === -1 || j === 1)) { continue; }
            if (i === 1 && (j === -1 || j === 1)) { continue; }
            if (x + i >= w || x + i < 0) { continue; }
            if (y + j >= h || y + j < 0) { continue; }
            if (i+j === 0) { continue; }
            adjacents.push([x+i,y+j]);
        }
    }
    return adjacents
}

function getBits(x) { return (x >>> 0).toString(2); }

function getInt(x, shift) {
    if (x === 0) { return 0;}
    return (32 * shift) + getBits(x >>> 0).length - 1;
}
// Reflect entropy choosing... TODO:
function chooseCell(bitMatrix) {
    let xRand = 0;
    let yRand = 0;
    let cell = bitMatrix[xRand][yRand];
    while (typeof cell.tiles === typeof 1) {
        xRand = Math.floor(Math.random() * bitMatrix.length);
        yRand = Math.floor(Math.random() * bitMatrix[xRand].length);
        cell = bitMatrix[xRand][yRand];
    }
    return cell;
}
//TODO: reflect entropy choice.
function chooseChoice(bitMatrix, cell, tileAmount, count, weights) {
    // Make sure the CHOICE is coming from one of the on bits.
    // return 1;
    let choices = {}
    let choicesKey = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
        let tileShift = cell.tiles[i];
        while ((tileShift | 0) !== 0) {

            let pushedBit = 1<<getBits(tileShift).length-1;
            let choice = getInt(tileShift, i)
            choices[choice] = weights[choice];
            choicesKey.push(choice);
            total += weights[choice];
            tileShift &= ~pushedBit;
        }
    }
    let randChoice = Math.floor(Math.random() * total);
    for (let i = 1; i < choicesKey.length; i++) {
        randChoice -= choices[choicesKey[i]];
        if (randChoice <= 0) {
            return choicesKey[i];
        }
    }
    debugger;
    return 1
}

function ChooseBit(bitMatrix, count, mappedNeighbors, tileAmount, mapping, weights) {
    let cell = chooseCell(bitMatrix);
    if (typeof cell.tiles === typeof 1) { return null; }
    // chooseChoice
    let choice = chooseChoice(bitMatrix, cell, tileAmount, count, weights);
    //Making a choice.
    cell['tiles'] = choice;
    // Don't care about possible neighbors now.
    if (cell.neighbors === undefined) { debugger; };
    let compat = mappedNeighbors[choice]; // Might have to do a deep copy
    // Removing this for garbage collection.
    cell.neighbors = 0;
    let compatArray = [];
    // Making sure adjacent neighbors ONLY have compatible neighbors.
    for (let j = 0; j < count; j++) {
        if (compat === undefined) { debugger; }
        // adjCell['tiles'][j] = compat[j];
        // When we set this compatibilty, we NEED to remove all the tiles
        // that are not compatible.
        // Get noncompats, set each neighbor to false, and move to next c
        let nonCompats = ~compat[j];
        while ((nonCompats | 0) !== 0) {
            let removedBit = 1 << getBits(nonCompats).length-1;
            let removed = getInt(removedBit, j);
            nonCompats &= ~removedBit; 
        }
    }
    for (let i = 0; i < cell.adjacents.length; i++) {
        compatArray.push({
            compat : compat,
            cell : cell.adjacents[i]
        });
    }
    return compatArray;
}

function banBits(mappedNeighbors, j, tileAmount, cell) {
    let removedCompat = deepCopy(mappedNeighbors[j]);
    cell.neighbors[j] = false;
    cell.banned++;
    if (cell.banned >= tileAmount) { debugger; }
    return removedCompat; 
}

function PropagateBits(banArray, count, bitMatrix, mapping, mappedNeighbors) {
    while (banArray.length !== 0) {
        let toBan = banArray.shift();
        let compat = toBan.compat;
        if (compat === undefined) { debugger; }
        let cellCoord = toBan.cell;
        let shouldPropagate = false;

        cell = bitMatrix[cellCoord[0]][cellCoord[1]];
        //Not checking a stable tile. For now. We should check to see if compat
        if (cell.neighbors === 0) { continue; }
        
        for (let i = 1; i < tileAmount; i++) {
            if (cell.neighbors[i] === undefined) { 
                cell.neighbors[i] = deepCopy(mappedNeighbors[i]);
            }
        }
        for (let j = 0; j < count; j++) {
            let nonCompats = ~compat[j];
            while ((nonCompats | 0) !== 0) {
                let removedBit = 1 << getBits(nonCompats).length-1;
                let removed = getInt(removedBit, j);
                nonCompats &= ~removedBit; 
                if (cell.neighbors[removed] !== false) {
                    cell.neighbors[removed] = false;
                    let removedInfo = mapping[removed];
                    if (removedInfo === undefined) { continue; }
                    cell.tiles[removedInfo.shift] &= ~removedInfo.bit;
                    cell.banned++;
                    shouldPropagate = true;
                }
            }
        }
        let newCompat = new Array(count).fill(0);
        for (let i = 0; i < tileAmount; i++) {
            let neighbor = cell.neighbors[i];
            if (neighbor === false) { continue; }
            let neighborInfo = mapping[i];
            newCompat[neighborInfo.shift] |= neighborInfo.bit;
        }
        if (shouldPropagate) {
            for (let i = 0; i < cell.adjacents.length; i++) {
                let adj = cell.adjacents[i];
                banArray.push({
                    compat : newCompat,
                    cell: adj 
                });
            }
        }
    }
}
