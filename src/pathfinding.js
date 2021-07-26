

export function pathfinding(featureMap, start, goal) {
    console.log("Solving for path!")
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let cardinalFlag = true; // IF TRUE, ONLY GET CARDINAL DIRECTIONS. NO DIAGONALS.
    let map = GenerateMap(featureMap);
    let paths = [];
    let scoringFunctions = [scoreDistance, scoreLongest,scoreScaredyCat,
        scorePsych, scoreSlasher];
    for (let i = 0; i < scoringFunctions.length; i++) {
        map = ResetMap(map);
        let path = aStar(map[start.x][start.y], map[goal.x][goal.y], 
        map, cardinalFlag, scoringFunctions[i]);
        if (path === false) { return false; }
        paths.push(ReconstructPath(path, map));
    }
    return paths;
}
function ReconstructPath(result, map) {
    console.log("starting path reconstruction");
    let tile = result.pop(); //Pop gets the last item in a list. Basically the goal.
    let temp = []
    let path = []
    let JSEval = 0;
    let IEval = 0;
    let totalMoves = 0;
    while (tile.cameFrom !== null) {
        temp.push(tile);
        tile = tile.cameFrom;
    }
    temp.push(tile);
    while (temp.length !== 0) {
        tile = temp.pop();
        path.push(tile);
        JSEval += evaluateMetaTag(tile, map, "JS");
        JSEval += evaluateMetaTag(tile, map, "AC");
        JSEval += evaluateMetaTag(tile, map, "I");
        JSEval += evaluateMetaTag(tile, map, "LV");
        IEval += evaluateMetaTag(tile, map, "I");
        IEval += evaluateMetaTag(tile, map, "JS");
        IEval += evaluateMetaTag(tile, map, "AC");
        IEval += evaluateMetaTag(tile, map, "I");
        IEval += evaluateMetaTag(tile, map, "LV");
        totalMoves++;
    }
    let pathData = {
        path : path,
        slasherScore : JSEval,
        psychologicalScore : IEval,
        movesTaken : totalMoves
    }
    console.log(pathData);
    return pathData;
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
    let totalScore = 0;
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; }
        moves.push(currentTile);
        if (currentTile === goal) { return moves; }
        let neighbors = getNeighbors(currentTile, aStarMap, cardinalFlag);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            neighbor.score = scoringFunction(neighbor, goal, aStarMap, 
                currentTile);
            neighbor.score += totalScore;
            neighbor.cameFrom = currentTile;
        }
        neighbors = neighbors.sort((a, b) => b.score - a.score);
        openSet = openSet.concat(neighbors);
    }
    return false;
}
// TODO: This whole count nonsense would be solved if instead of arrays, we 
//      used an object, keeping the count around and the feature as the key.
function evaluateMetaTag(tile, map, metatag) {
    let neighbors = getNeighbors(tile, map);
    let count = 0;
    for (let i = 0; i < tile.features.length; i++) {
        if (tile.features[i] === metatag) { count++; }
    }
    for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        for (let j = 0; j < neighbor.features; j++) {
            if (neighbors.features[j] === metatag) { count++; }
        }
    }
    return count;
}
function scoreScaredyCat(neighbor, goal, map, current) {
    let creep = scoreAmbientCreep(neighbor, goal, map, current);
    let scare = scoreJumpscare(neighbor, goal, map, current);
    let vis = scoreLowVis(neighbor, goal, map, current);
    let iso = scoreIsolation(neighbor, goal, map, current);
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = scare + iso + vis + creep;
    return totalHorrorScore;
}
function scoreLongest(neighbor, goal, map, current) {
    let dist = scoreDistance(neighbor, goal, map, current);
    return  1/(dist);
}

function scoreSlasher(neighbor, goal, map, current) {
    let creep = scoreAmbientCreep(neighbor, goal, map, current) * 0.9;
    let scare = scoreJumpscare(neighbor, goal, map, current) * 0.1;
    let vis = scoreLowVis(neighbor, goal, map, current) * 0.1;
    let iso = scoreIsolation(neighbor, goal, map, current) * 0.1;
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = scare + iso + vis + creep;
    return 1/totalHorrorScore;
}

function scorePsych(neighbor, goal, map, current) {
    let creep = scoreAmbientCreep(neighbor, goal, map, current);
    let scare = scoreJumpscare(neighbor, goal, map, current);
    let vis = scoreLowVis(neighbor, goal, map, current);
    let iso = scoreIsolation(neighbor, goal, map, current);
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = scare + iso + vis + creep;
    return 1/totalHorrorScore;
}
function scoreLowVis(neighbor, goal, map, current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "LV") { count++; }
    }
    // let distantNeihgbors = getNeighbors(neighbor, map);
    // for (let i = 0; i < distantNeihgbors.length; i++) {
    //     let distantNeighbor = distantNeihgbors[i];
    //     for (let j = 0; j < distantNeighbor.features.length; j++) {
    //         if (distantNeighbor.features[j] === "LV") { count++; };
    //     }
    // }
    let dist = scoreDistance(neighbor, goal, map, current);
    let score = (dist) - (dist * count);
    if (count == 1) { score = 1}
    if (score < 1) { score = 1/(score * score); }
    if (score < 0) { debugger; }
    return count;
    return 100 + score;
}
function scoreAmbientCreep(neighbor, goal, map,  current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "AC") { count++; }
    }
    // let distantNeihgbors = getNeighbors(neighbor, map);
    // for (let i = 0; i < distantNeihgbors.length; i++) {
    //     let distantNeighbor = distantNeihgbors[i];
    //     for (let j = 0; j < distantNeighbor.features.length; j++) {
    //         if (distantNeighbor.features[j] === "AC") { count++; };
    //     }
    // }
    let dist = scoreDistance(neighbor, goal, map, current);
    let score = (dist) - (dist * count);
    if (count == 1) { score = 1}
    if (score < 1) { score = 1/(score * score); }
    if (score < 0) { debugger; }
    return count;
    return 100 + score;
}
function scoreIsolation(neighbor, goal, map, current) {
    let count = 1;
    for (let i= 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "I") { count++; }
    }    
    // let distantNeihgbors = getNeighbors(neighbor, map);
    // for (let i = 0; i < distantNeihgbors.length; i++) {
    //     let distantNeighbor = distantNeihgbors[i];
    //     for (let j = 0; j < distantNeighbor.features.length; j++) {
    //         if (distantNeighbor.features[j] === "I") { count++; };
    //     }
    // }
    let dist = scoreDistance(neighbor, goal, map, current);
    let score = (dist) - (dist * count);
    if (count == 1) { score = 1}
    if (score < 1) { score = 1/(score * score); }
    if (score < 0) { debugger; }
    return count;
    return 100 + score;
}

function scoreJumpscare(neighbor, goal, map, current) {
    let count = 1;
    for (let i = 0; i < neighbor.features.length; i++) {
        if (neighbor.features[i] === "JS") { count++; }
    }
    // let distantNeihgbors = getNeighbors(neighbor, map);
    // for (let i = 0; i < distantNeihgbors.length; i++) {
    //     let distantNeighbor = distantNeihgbors[i];
    //     for (let j = 0; j < distantNeighbor.features.length; j++) {
    //         if (distantNeighbor.features[j] === "JS") { count++; };
    //     }
    // }
    let dist = scoreDistance(neighbor, goal, map, current);
    let score = (dist) - (dist * count);
    if (count == 1) { score = 1}
    if (score < 1) { score = 1/(score * score); }
    if (score < 0) { debugger; }
    return count;
    return 100 + score;
} 
function scoreDistance(neighbor, goal, map, currentTile) {
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
            if (tile.checked) { continue; }
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
