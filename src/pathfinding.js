

export function pathfinding(featureMap, start, goal) {
    console.log("Solving for path!")
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let cardinalFlag = true; // IF TRUE, ONLY GET CARDINAL DIRECTIONS. NO DIAGONALS.
    let map = GenerateMap(featureMap);
    let paths = [];
    let scoringFunctions = [scoreShortest, scoreLongest, scoreScaredyCat,
        scoreSlasher, scorePsych];
    for (let i = 0; i < scoringFunctions.length; i++) {
        map = ResetMap(map, goal);
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

function ResetMap(map, goal) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            map[i][j].checked = false;
            map[i][j].cameFrom = null;
            map[i][j].score = scoreDistance(map[i][j], goal, map, null);
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
        moves.push(currentTile);
        if (currentTile === goal) { return moves; }
        let neighbors = getNeighbors(currentTile, aStarMap, cardinalFlag);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (neighbor === start) { continue; }
            neighbor.score = scoringFunction(neighbor, goal, aStarMap, 
                currentTile);
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
function scoreShortest(neighbor) {
    return neighbor.score;
}

function scoreLongest(neighbor, goal, map, current) {
    dist = scoreDistance(neighbor, goal, map, current);
    return  1/dist;
}

function scoreScaredyCat(neighbor, goal, map, current) {
    let creep = neighbor.ac;
    let scare = neighbor.js;
    let vis = neighbor.lv;
    let iso = neighbor.iso;
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = scare + iso + vis + creep;
    totalHorrorScore = (totalHorrorScore > 1 ? totalHorrorScore : 1);
    return ((0.1*dist) * totalHorrorScore);
}

function scoreSlasher(neighbor, goal, map, current) {
    let creep = neighbor.ac;
    let scare = neighbor.js * 4;
    let vis = neighbor.lv * 2;
    let iso = neighbor.iso * 0.5;
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = iso + creep + vis + scare;
    totalHorrorScore = (totalHorrorScore > 1 ? totalHorrorScore : 1);
    let combined = dist + totalHorrorScore;
    return (dist)/totalHorrorScore;
}

function scorePsych(neighbor, goal, map, current) {
    let creep = neighbor.ac * 2;
    let scare = neighbor.js * 0.5;
    let vis = neighbor.lv;
    let iso = neighbor.iso * 4;
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = iso + creep + vis + scare;
    totalHorrorScore = (totalHorrorScore > 1 ? totalHorrorScore : 1);
    let combined = dist + totalHorrorScore;
    return (dist)/totalHorrorScore;
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
        this.ac = features.filter(item => item === "AC").length;
        this.js = features.filter(item => item === "JS").length;
        this.iso = features.filter(item => item === "I").length;
        this.lv = features.filter(item => item === "LV").length;
        this.checked = false;
        this.cameFrom = null;
        this.score = 9999;
    }   
}
