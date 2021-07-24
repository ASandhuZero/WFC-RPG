

export function pathfinding(featureMap, start, goal) {
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let cardinalFlag = true; // IF TRUE, ONLY GET CARDINAL DIRECTIONS. NO DIAGONALS.
    let aStarMap = GenerateMap(featureMap);
    result = aStar(aStarMap[start.x][start.y], aStarMap[goal.x][goal.y], 
        aStarMap, cardinalFlag)
    if (result.length !== 0) {
        return ReconstructPath(result);
    }
    return false;
}
function ReconstructPath(result) {
    let tile = result.pop(); //Pop gets the last item in a list. Basically the goal.
    let temp = []
    let path = []
    while (tile.cameFrom !== null) {
        temp.push(tile);
        tile = tile.cameFrom;
    }
    temp.push(tile);
    while (temp.length !== 0) {
        tile = temp.pop();
        path.push(tile);
        console.log(tile.score);
    }
    return path;
}

function GenerateMap(featureMap) {
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
function aStar(start, goal, aStarMap, cardinalFlag) {
    let openSet = [];
    let moves = [];
    let currentTile = null;
    openSet.push(start);
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; } 
        moves.push(currentTile);
        if (currentTile === goal) { return moves; }
        
        let neighbors = getNeighbors(currentTile, aStarMap, cardinalFlag);
        neighbors = scoreNeighbors(neighbors, goal);
        openSet = openSet.concat(neighbors);
    }
    return [];
}

function scoreNeighbors(neighbors, goal) {
    for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        let d_x = goal.x - neighbor.x;
        let d_y = goal.y - neighbor.y;
        let dist = (d_x * d_x) + (d_y * d_y);
        dist = Math.sqrt(dist);
        neighbor.score = dist; 
    }
    neighbors = neighbors.sort((a, b) => b.score - a.score);
    return neighbors;
    
}

function getNeighbors(location, map, cardinalFlag) {
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
            if (cardinalFlag) {
                if (i === -1 && (j === -1 || j === 1) ) { continue; }
                if (i === 1 && (j === -1 || j === 1) ) { continue; }
            }
            let tile = map[xOffset][yOffset];
            if (tile.checked) { continue; }
            tile.cameFrom = location;


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
        this.cameFrom = null;
        this.score = 9999;
    }   
}
