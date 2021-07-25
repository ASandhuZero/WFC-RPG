

export function pathfinding(featureMap, start, goal) {
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let cardinalFlag = true; // IF TRUE, ONLY GET CARDINAL DIRECTIONS. NO DIAGONALS.
    let aStarMap = GenerateMap(featureMap);
    let paths = [];
    let scoringFunctions = [scoreDistance, scoreScaredyCat];
    for (let i = 0; i < scoringFunctions.length; i++) {
        aStarMap = ResetMap(aStarMap);
        let path = aStar(aStarMap[start.x][start.y], aStarMap[goal.x][goal.y], 
        aStarMap, cardinalFlag, scoringFunctions[i]);
        if (path === false) { return false; }
        paths.push(ReconstructPath(path));
    }
    return paths;
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
    }
    return path;
}

function ResetMap(map) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            map[i][j].checked = false;
            map[i][j].cameFrom = null;
            map[i][j].score = 9999;
        }
    }
    return map;
}
function GenerateMap(featureMap) {
    let map = [];
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
function aStar(start, goal, aStarMap, cardinalFlag, scoringFunction) {
    let openSet = [start];
    let moves = [];
    let currentTile = null;
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; }
        let newTile = new Tile(currentTile.x,currentTile.y);
        newTile.features = currentTile.features;
        newTile.checked = currentTile.checked;
        newTile.score = currentTile.score;
        newTile.cameFrom = currentTile.cameFrom;
        moves.push(newTile);
        if (currentTile === goal) { return moves; }
        
        let neighbors = getNeighbors(currentTile, aStarMap);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            neighbor.score = scoringFunction(neighbor, goal, currentTile);
        }
        neighbors = getNeighbors(currentTile, aStarMap, cardinalFlag);
        neighbors = neighbors.sort((a, b) => b.score - a.score);
        openSet = openSet.concat(neighbors);
        openSet = openSet.sort((a,b) => b.score - a.score)
    }
    return false;
}
function scoreScaredyCat(neighbor, goal, current) {
    let creep = scoreAmbientCreep(neighbor, goal, current);
    let scare = scoreJumpscare(neighbor, goal, current) * 5;
    let vis = scoreLowVis(neighbor, goal, current);
    let iso = scoreIsolation(neighbor, goal, current);
    let score = scoreDistance(neighbor, goal, current);
    console.log(creep, scare, vis, iso);
    return score + creep + scare + vis + iso;
}
function scoreLowVis(neighbor, goal, current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "LV") {
            count++;
        }
    }
    return scoreDistance(neighbor, goal, current) / count;
}
function scoreAmbientCreep(neighbor, goal, current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "AC") {
            count++;
        }
    }
    return scoreDistance(neighbor, goal, current) / count;
}
function scoreIsolation(neighbor, goal, current) {
    let count = 1;
    for (let i= 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "I") {
            count++;
        }
    }
    return scoreDistance(neighbor, goal, current) / count;
}

function scoreJumpscare(neighbor, goal, current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "JS") {
            count++;
        }
    }
    return scoreDistance(neighbor, goal, current) / count;
    
} 
function scoreDistance(neighbor, goal, currentTile) {
    if (neighbor === goal) { return 0; }
    let d_x = goal.x - neighbor.x;
    let d_y = goal.y - neighbor.y;
    let dist = (d_x * d_x) + (d_y * d_y);
    dist = Math.sqrt(dist);
    return dist;
    
}

function getNeighbors(location, map, cardinalFlag=false) {
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
            if (!tile.features.includes("T")) { continue; }
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
