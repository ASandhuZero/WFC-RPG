export function pathfinding(featureMap, start, goal) {
    console.log("Solving for path!")
    featureMap[start.x][start.y].push('START');
    featureMap[goal.x][goal.y].push('GOAL');
    let failureReason = "";
    let cardinalFlag = true; // IF TRUE, ONLY GET CARDINAL DIRECTIONS. NO DIAGONALS.
    // let map = GenerateMap(featureMap);
    let [map, keys, doors] = generateMapAndKeys(featureMap);
    let paths = [];
    // let scoringFunctions = [scoreSpeedRunner, scoreCompletionist, scoreScaredyCat,
    //     scoreSlasher, scorePsych, scoreItem];
    let scoringFunctions = [scoreDistance];
    for (let i = 0; i < scoringFunctions.length; i++) {
        map = resetMapAndScores(map, goal, keys);
        if (map.length === 0) { debugger; return map; }
        // let path = aStar(map[start.x][start.y], map[goal.x][goal.y], 
        let path = null;
        try {
            let startEntry = map[start.x][start.y];
            let goalEntry = map[goal.x][goal.y];
            //TODO: Grab data of aStar completing the levels
            [path, failureReason] = doorStar(startEntry, goalEntry, map, 
                cardinalFlag, scoringFunctions[i]);    
            if (path.length === 0) { 
                return [[], failureReason, keys, doors]; 
            }
        }
        catch (error) {
            console.log(error, path, map);
            debugger;
        }
        paths.push(reconstructPath(path, map));
    }
    return [paths, failureReason, keys, doors];
}
function reconstructPath(result, map) {
    // console.log("starting path reconstruction.");
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
        JSEval += evaluateMetaTag(tile, map, "LV");
        IEval += evaluateMetaTag(tile, map, "I");
        IEval += evaluateMetaTag(tile, map, "AC") ;
        IEval += evaluateMetaTag(tile, map, "LV");
        totalMoves++;
    }
    let pathData = {
        path : path,
        slasherScore : JSEval,
        psychScore : IEval,
        movesTaken : totalMoves
    }
    return pathData;
}
// TODO: Deal with the fact that there can be more than just one key. 
// Either figure out if you can do one key or if you can do a key array.
// If so, then how to do we keep the scores around?

//TODO: basically what you need to do is first pathfind and see if you can beat
// the level without a key. 
//      ASTAR() beat level.
//      If that fails, see if there is a door, then execute findkey
//      This is a new part of the ASTAR, but keep the old path around. 
//      Just in case. Really you should get the path that brings your agent
//      to the near end. 
//      Then search for key, this is a new astar with its own path
//      Once key is found, go back to the door, and head through.
function resetMap(map) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            map[i][j].checked = false;
            map[i][j].cameFrom = null;
        }
    }
    return map;
}
function resetMapAndScores(map, goal, keys) {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            let keyScores = [];
            let index = map[i][j];
            index.checked = false;
            index.cameFrom = null;
            index.score = scoreDistance(index, goal, map, null);
            if (keys === undefined) {
                //TODO: This should be giving back some kind of score.
                //      deal with this later. 
                console.warn("There is no key! This map is unsolveable.")
                return [];
            }
            else { 
                for (let i = 0; i < keys.length; i++) {
                    keyScores.push(scoreDistance(index, keys[i], map, null)); 
                }
                keyScores = keyScores.sort((a, b) => a - b);
                index.keyScores = keyScores
            }
        }
    }
    return map;
}
function generateMap(featureMap) {
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

function generateMapAndKeys(featureMap) {
    let map = [];
    let keys = []
    let doors = [];
    for (let i = 0; i < featureMap.length; i++) {
        map.push(new Array(featureMap.length));
        for (let j = 0; j < featureMap.length; j++) {
            let featEntry = featureMap[i][j];
            let tile = new Tile(i, j, featEntry);
            if (featEntry.includes("KEY")) {
                keys.push(structuredClone(tile)); 
                console.log("%c%s", "color:yellow", 
                    "Number of keys:", keys.length);
            }
            if (featEntry.includes("DOOR")) { 
                doors.push(structuredClone(tile));
                debugger;
            } 
            map[i][j] = tile;
        }
    }
    return [map, keys, doors]
}
// TODO: This is the silliest function within the code, I think.
// Basically a* but with a prio on finding a key. So really the goal is just 
// different. But I needed to add some extra stuff in here, which is why I'm not
// calling thi a*, as it is a variation on the algorithm.
function findItemKey(map, start, cardinalFlag) {
    map = resetMap(map);
    let openSet = [start];
    let moves = [];
    let currentTile = null;
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; }
        moves.push(structuredClone(currentTile)); 
        if (currentTile.features.includes("KEY")) { 
            console.log("A key has been found! We are now backtracking!");
            let temp = [];
            let current = moves[moves.length-1];
            for (let i = moves.length-2; i >= 0; i--) {
                let move = structuredClone(moves[i]);
                move.cameFrom = current;
                temp.push(move);
                current = move;
            }
            moves = moves.concat(temp); 
            return moves; 
        }
        let neighbors = getNeighbors(currentTile, map, cardinalFlag);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (neighbor === start) { continue; }
            neighbor.cameFrom = currentTile;
        }
        // TODO: The issue with having all the key scores means that they
        // should be removed from all within the map once found...
        // This really is just a mess, isn't it?
        neighbors = neighbors.sort((a, b) => b.keyScores[0] - a.keyScores[0]);
        openSet = openSet.concat(neighbors);
    }
    return []; 
}
// function Door*:
// focuses on finding keys and doors withing the level. 
function doorStar(start, goal, map, cardinalFlag, scoringFunction) {
    let openSet = [start];
    let moves = [];
    let currentTile = null;
    let keys = 0; // Number of keys the agent has at the moment.
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        if (currentTile.features.includes("DOOR")) {
            //TODO: probably should first explore the area before 
            // we try to open the door... But it is what it is. 
            // TODO: make sure if we pick up a key, then we stay on that path.
            if (keys == 0) { 
                // console.log("Found door, but don't have a key!");
                let itemMap = structuredClone(map);
                let keyMoves = findItemKey(itemMap, currentTile, cardinalFlag);
                // console.log(keyMoves);
                if (keyMoves.length === 0) { 
                    console.log("There is no path to the key!"); 
                    // TODO: we need to return something else
                    // that will help us with the final data collection
                    // that we need for the paper.
                    return [[], "NO_KEY"];
                }
                else { 
                    currentTile.cameFrom = keyMoves[keyMoves.length -1 ];
                    moves = moves.concat(keyMoves); 
                }
            }
            else if (keys > 0) { 
                keys--; 
                // console.log("Used key!")
            }
        }
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; }
        moves.push(structuredClone(currentTile)); 
        if (currentTile === goal) { return [moves, "SUCCESS"]; }
        if (currentTile.features.includes("KEY")) { 
            keys++; 
            // console.log("Found key!");
        }
        let neighbors = getNeighbors(currentTile, map, cardinalFlag);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (neighbor === start) { continue; }
            neighbor.score = scoringFunction(neighbor, goal, map, currentTile);
            neighbor.cameFrom = currentTile;
        }
        neighbors = neighbors.sort((a, b) => b.score - a.score);
        openSet = openSet.concat(neighbors);
    }
    return [[], "NO_PATH"];
}
// function a*: 
// input: starting location, end location, weights (slasher/psych), features
function aStar(start, goal, map, cardinalFlag, scoringFunction) {
    let openSet = [start];
    let moves = [];
    let currentTile = null;
    while (openSet.length !== 0) {
        currentTile = openSet.pop();
        currentTile.checked = true;
        if (!currentTile.features.includes("T")) { continue; }
        moves.push(structuredClone(currentTile)); 
        if (currentTile === goal) { return moves; }
        let neighbors = getNeighbors(currentTile, map, cardinalFlag);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (neighbor === start) { continue; }
            neighbor.score = scoringFunction(neighbor, goal, map, currentTile);
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
function scoreSpeedRunner(neighbor) {
    // Returning the distance function. Please look at ResetMap.
    return neighbor.score;
}
function scoreCompletionist(neighbor, goal, map, current) {
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
    let iso = neighbor.iso * 0.1;
    let dist = scoreDistance(neighbor, goal, map, current);
    let totalHorrorScore = iso + creep + vis + scare;
    totalHorrorScore = iso + creep + vis + scare;
    totalHorrorScore = (totalHorrorScore > 1 ? totalHorrorScore : 1);
    let combined = dist + totalHorrorScore;
    return (dist)/totalHorrorScore;
}

function scorePsych(neighbor, goal, map, current) {
    let creep = neighbor.ac * 2;
    let scare = neighbor.js * 0.1;
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
// TODO: ... Why doesn't the currentTile just know what neighbors it has?
// This feels like extra computation for no good reason. 
function getNeighbors(location, map, cardinalFlag=false) {
    let x = location.x;
    let y = location.y;
    let neighbors = [];
    // Indexing at -1 to capture the top left neighbor tile. 
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let xOffset = x+i;
            let yOffset = y+j;
            if (xOffset < 0 || xOffset >= map.length) { continue; }
            if (xOffset === location.x && yOffset === location.y) { continue; }
            if (yOffset < 0 || yOffset >= map[xOffset].length) { continue; }
            if (cardinalFlag && (j === -1 || j === 1)) {
                if (i === -1) { continue; }
                if (i === 1) { continue; }
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
        this.key = features.filter(item => item === "KEY").length;
        this.door = features.filter(item => item === "DOOR").length;
        this.checked = false;
        this.cameFrom = null;
        this.score = 9999;
        this.keyScores = 9999;
    }   
}
