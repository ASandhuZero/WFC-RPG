

export function pathfinding(featureMap, start, goal) {
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let aStarMap = GenerateMap(featureMap);
    result = aStar(aStarMap[start.x][start.y], aStarMap[goal.x][goal.y], 
        aStarMap)
    console.log(result);
    return result;
}


function GenerateMap(featureMap) {
    console.log(featureMap.length);
    console.log(featureMap[0].length);
    let map = []
    for (let i = 0; i < featureMap.length; i++) {
        map.push(new Array(featureMap.length));
        for (let j = 0; j < featureMap.length; j++) {
            let tile = new Tile(i, j, featureMap[i][j]);
            map[i][j] = tile;
        }
    }
    return map
}

// function a*: 
// input: starting location, end location, weights (slasher/psych), features
function aStar(start, goal, aStarMap) {
    console.log(start, goal, aStarMap);
    let openSet = [];
    let moves = [];
    openSet.push(start);
    while (openSet.length !== 0) {
        let currentTile = openSet.pop();
        moves.push(currentTile);
        if (currentTile === goal) { return moves; }
        if (currentTile.checked) { continue; }
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) {
            console.log("Is not walkable!");
        } else {
            let neighbors = getNeighbors(currentTile, aStarMap)
            openSet = openSet.concat(neighbors);
        }
    }
    return [];
}


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
            let tile = map[xOffset][yOffset];
            neighbors.push(tile);
        }
    }
    return neighbors;
}

class Tile {
    constructor(x, y, features) {
        this.x = x;
        this. y = y;
        this.features = (features ? features : []);
        this.checked = false;
    }   
}
