// Good lord, the partial is a weird boy. So, set a tile to false if WFC should
// solve for that tile.
// Else put the tile number into the index. Note the tile number doesn't match
// the tile number within the JSON. And that's because WFC does an internal
//remapping of IDS... which causes this offset. To figure out the correct tile
//number, put a random tile in, and search around until the correct tile is 
// found :)
export function generatePartial(partials, w, h, coverage) {
    let partialMap = new Array(w);
    let loops = 0;
    let temp = 0;
    let partialTiles = 0;
    for (let i = 0; i < w; i++) { partialMap[i] = new Array(h).fill(false); }
    // partials is a tensor. First degree indicies are the partials.
    let partialPercent = 0;
    // TODO: You need to figure out how to make sure that this always 
    // creates a full partial with the percentage you are looking for...
    while (partialPercent < coverage ) {
        if (partialPercent === temp) { loops++ }
        if (loops > 100) {
            console.log("%c%s", "color:red",
                "Failed to reach partial percent threshold.");
            break; 
        }
        temp = partialPercent
        partialPercent = partialTiles/(w*h);
        for (let p = 0; p < partials.length; p++) {
            
            partialPercent = partialTiles/(w*h);
            let shouldContinue = false;
            if (partialPercent > coverage) { 
                shouldContinue = true; 
                continue; 
            }
            let partial = partials[p];
            if (Math.random() > 0.5) { continue; }
            let longestPartialArr = 0;
            let randI, randJ;
            randI = Math.floor(Math.random() * (w - partial.length));
            for (let i = 0; i < partial.length; i++) {
                if (longestPartialArr < partial[i].length) {
                    longestPartialArr = partial[i].length;
                }
            }
            randJ = Math.floor(Math.random() * (h - longestPartialArr));
            let shouldPlace = false;
            if (partial.length >= w) { continue; }
            if (partial.length + randI >= w) { continue; }
            for (let i = 0; i < partial.length; i++) {
                let partialArr = partial[i];
                if (partialArr.length >= h) { 
                    shouldContinue = true; 
                    break;
                }
                //Checking for wrapping. Will break if too long.
                if (partialArr.length + randJ >= h) { 
                    shouldContinue = true; 
                    break;
                }
                for (let j = 0; j < partialArr.length; j++) {
                    if (partialMap[randI+i][randJ+j] !== false )  { 
                        shouldContinue = true; 
                        break;
                    }
                }
            }
            // The reason why there is a continue here and not within the 
            // loop, is because the program should continue to the next partial.
            if (shouldContinue) { continue; } 
            else { shouldPlace = true; }
            //First check if partial can fit...
            if (shouldPlace) {
                for (let i = 0; i < partial.length; i++) {
                    let partialArr = partial[i];
                    if (partialArr === undefined) { continue;}
                    for (let j = 0; j < partialArr.length; j++) {
                        partialMap[randI+i][randJ+j] = partialArr[j];
                        partialTiles++;
                    }
                }
            }
        }
    }
    for (let i = 0; i < partialMap.length; i++) {
        for (let j = 0; j < partialMap[i].length; j++) {
            if (partialMap[i][j] === -1) { partialMap[i][j] = false; }
        }
    }
    generateDoor(partialMap, w, h);
    partialMap[0][0] = 10;
    partialMap[w-1][h-1] = 10;
    console.log("%c%s", "color:yellow", 
        "percent of tiles that come from partials", partialPercent);
    return [partialMap, partialPercent];
}
function generateDoor(map, w, h) {
    let blockingDoor = [
        [19,24,24,24,"DOOR",24,24,24,20],
        [21,10,10,10,10,10,10,10],
        [21,10,10,10,10,10,10,10],
        [21,10,10,10,10, 10,10,10]
    ]
    let longestPartArr = [];
    for (let i = 0; i < blockingDoor.length; i++) {
        let arr = blockingDoor[i];
        if (longestPartArr.length < arr.length) {
            longestPartArr = arr;
        }
    }
    let doorArrLen = blockingDoor.length;
    let longArrLen = longestPartArr.length
    for (let i = doorArrLen ; i > 0; i--) {
        for (let j = longArrLen; j > 0; j--) {
            try {
                map[w-i][h-j] = blockingDoor[doorArrLen-i][longArrLen-j];
            } catch (e) {
                console.log(i, j);
                debugger
            }
        }
    }
}