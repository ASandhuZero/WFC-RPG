// Good lord, the partial is a weird boy. So, set a tile to false if WFC should
// solve for that tile.
// Else put the tile number into the index. Note the tile number doesn't match
// the tile number within the JSON. And that's because WFC does an internal
//remapping of IDS... which causes this offset. To figure out the correct tile
//number, put a random tile in, and search around until the correct tile is 
// found :)
function generatePartial(partials, w, h) {
    let partialMap = new Array(w);
    for (let i = 0; i < w; i++) {
        partialMap[i] = new Array(h).fill(false);
    }
    let partialPass = 0;
    // partials is a tensor. First degree indicies are the partials.
    while (partialPass < 4) {
        partialPass++;
        for (let p = 0; p < partials.length; p++) {
            let partial = partials[p];
            if (Math.floor(Math.random()*10) > 6) { continue; }
            let longestPartialArr = 0;
            let randI, randJ;
            randI = Math.floor(Math.random() * (w - partial.length));
            for (let i = 0; i < partial.length; i++) {
                if (longestPartialArr < partial[i].length) {
                    longestPartialArr = partial[i].length;
                }
            }
            randJ = Math.floor(Math.random() * (h - longestPartialArr));
            let randRowReset = randI;
            let randColReset = randJ;
            let shouldContinue = false;
            let shouldDraw = false;
            if (partial.length >= w) { continue; }
            if (partial.length + randI >= w) { continue; }
            for (let i = 0; i < partial.length; i++) {
                let partialArr = partial[i];
                if (partialArr.length >= h) { shouldContinue = true; break;}
                //Checking for wrapping. Will break if too long.
                if (partialArr.length + randJ >= h) { shouldContinue = true; break;}
                for (let j = 0; j < partialArr.length; j++) {
                    if (partialMap[randI+i][randJ+j] !== false )  { shouldContinue = true; break;}
                }
            }
            if (shouldContinue) { continue; } 
            else { shouldDraw = true; }
            //First check if partial can fit...
            if (shouldDraw) {
                for (let i = 0; i < partial.length; i++) {
                    let partialArr = partial[i];
                    if (partialArr === undefined) { continue;}
                    for (let j = 0; j < partialArr.length; j++) {
                        partialMap[randI+i][randJ+j] = partialArr[j];
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
    partialMap[0][0] = 10;
    partialMap[w-1][h-1] = 10;
    return partialMap;
}