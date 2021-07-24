

export function pathfinding(combinedFeatureMap) {
    let startingLocation = new Tile(0, 0);
    let endingLocation = new Tile(10, 2);
    console.log(startingLocation.x);
    for (let i = 0; i < combinedFeatureMap.length; i++) {
        for (let j = 0; j < combinedFeatureMap.length; j++) {
            let tile = new Tile(i, j);
            let neighbors = getNeighbors(tile, combinedFeatureMap);
            console.log(neighbors);
        }
    }
    let neighbors = getNeighbors(startingLocation, combinedFeatureMap);
    return null
}

// function a*: 
// input: starting location, end location, weights (slasher/psych), features

function getNeighbors(location, map) {
    let x = location.x;
    let y = location.y;
    let neighbors = [];
    // Indexing at -1 to capture the top left neighbor tile. 
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let xOffset = x+i;
            let yOffset = y+j;
            if (xOffset < 0 || xOffset >= map.length) { continue }
            if (xOffset === location.x && yOffset === location.y) { continue; }
            if (yOffset < 0 || yOffset >= map[xOffset].length) { continue; }
            let tile = new Tile(xOffset, yOffset, map[xOffset][yOffset]);
            neighbors.push(tile);
        }
    }
    return neighbors;
}

class Tile {
    constructor(x, y, features) {
        this.x = x;
        this. y = y;
        this.features = (features ? features : null);
    }   
}