// There is probably a better way of doing this. Look that u and try to make 
// something that isn't so obtuse... It might be time to jump over to D3.
// CANVAS CODE TODO: BREAK THIS OUT INTO ITS OWN JS FILE IF WORK.
// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 

import { parseJSON } from "jquery";

// Good good stuff.
export function Draw(heatmaps, w, h, tileSize, rescale, tileSet, tileSetCol, map, paths) {

    let debugging = false;
    let updatedSize = tileSize * rescale;
    let atlasCol = tileSetCol;
    // TODO: THE REASON WHY WE ARE DOING THIS OFFSET IS BECUASE OF THE TRIM...
    w = w;
    h = h;
    let index = 0;
    //TODO: THE ORDERING HERE MATTERS. WHAT EVER IS GENERATED LAST, WILL BE ON 
    // TOP.
    let tmapcanvas = generateCanvas("Tilemap", w + updatedSize, h + updatedSize); //tilemapcanvas
    let hmapCanveses = [] //heatmap canvas
    let heatmapNames = ["ac", "js", "iso", "lv"]
    for (let i = 0; i < heatmapNames.length; i++) {
        hmapCanveses.push(generateCanvas(heatmapNames[i], w, h));
    }
    let tileNameCanvas = generateCanvas("TileNames", w, h)
    hmapCanveses = hmapCanveses.filter(canvas => typeof canvas !== typeof 1);
    let pathsCanvas = generateCanvas("Paths", w, h);

    for (let row = 1; row < (w / updatedSize); row++) {
        for (let col = 1; col < (h / updatedSize); col++) {
            drawTile(tmapcanvas, tileSet, row, col, rescale, updatedSize,
                tileSize, atlasCol, map);
            if (heatmaps != null) {
                for (let i = 0; i < heatmapNames.length; i++) {
                    let heatmap = heatmaps[heatmapNames[i]];
                    drawHeatmap(hmapCanveses[i], heatmap, row, col, rescale,
                        updatedSize, tileSize);
                }
            }
            drawName(tileNameCanvas, map, row, col, atlasCol, rescale,
                updatedSize, tileSize);
            index++;
        }
    }
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i].path;
        drawPath(pathsCanvas, path, i, rescale, updatedSize, tileSize, w, h);
    }
    generateButton("names", tileNameCanvas.style, "#ff0000", h, updatedSize, 
        debugging);
    let rgbs = ['rgb(0, 225, 0)', 'rgb(0, 0, 225)', 'rgb(225, 225, 0)',
        'rgb(225, 0, 225)'];
    for (let i = 0; i < heatmapNames.length; i++) {
        generateButton(heatmapNames[i], hmapCanveses[i].style, rgbs[i], h,
            updatedSize);
    }
    generateButton("paths", pathsCanvas.style, "#FFF", h, updatedSize, 
        debugging);
    drawTrim(tmapcanvas, tileSet, atlasCol, rescale, tileSize, updatedSize, w, h);
}

function generateButton(name, style, color, h, updatedSize, set = false) {
    let btn = document.createElement("button");
    let buttonStyle = style;
    btn.innerHTML = name;
    btn.style.position = "relative";
    btn.style.backgroundColor = color;
    btn.style.top = h + updatedSize;
    btn.addEventListener("click", function () {
        if (buttonStyle.display === "none") {
            buttonStyle.display = "block";
        } else {
            buttonStyle.display = "none"
        }
    });
    if (set) { buttonStyle.display = "block"; }
    else { buttonStyle.display = "none"; }
    btnDiv.appendChild(btn);
}

function generateCanvas(name, w, h) {
    let canvas = document.createElement('canvas')
    canvas.setAttribute("id", name);
    canvas.width = w;
    canvas.height = h;
    document.body.appendChild(canvas);
    return canvas;
}

export function drawImage(ctx, tileSet, sourceX, sourceY, sourceSize, destX, destY, updatedSize) {
    updatedSize -= 1; //TODO: figure out how to not make this hardcoded. 
    ctx.drawImage(tileSet, sourceX, sourceY, sourceSize, sourceSize, destX,
        destY, updatedSize, updatedSize);
}
function drawPath(canvas, path, pathOffset, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    if (path.length === 0) { return; }
    ctx.strokeStyle = ['rgb(225, 0, 0)', 'rgb(0, 225, 0)',
        'rgb(0, 0, 225)', 'rgb(225, 225, 0)', 'rgb(225, 0, 225)'][pathOffset]
    ctx.beginPath();
    let lineWidth = 5;
    ctx.lineWidth = lineWidth;
    ctx.moveTo((path[0].x + 1) * (updatedSize * 1.5),
        (path[0].y + 1) * (updatedSize * 1.5));
    for (let i = 1; i < path.length; i++) {
        if (i == path.length - 1) { pathOffset = 0; }
        let tile = path[i];
        let x = (tile.x + 1) * tileSize;
        let y = (tile.y + 1) * tileSize;
        ctx.lineTo(x * rescale + (2 * pathOffset) + updatedSize / 2,
            y * rescale + (2 * pathOffset) + updatedSize / 2);
        ctx.stroke();
    }
}
function drawName(canvas, map, row, col, atlasCol, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    let updatedRow = row * tileSize;
    let updatCol = col * tileSize;
    //TODO: THE DUMB OFFSETTING RIGHT HERE AGAIN.
    let tile = map[row - 1][col - 1];
    let tileVal = tile.name;
    let sourceX = (tileVal % atlasCol) * tileSize;
    let sourceY = Math.floor(tileVal / atlasCol) * tileSize;
    ctx.font = '14px serif';
    ctx.fillStyle = "#ff0000";
    ctx.fillText(tile.name,
        (((updatedRow + 1) * rescale - 10) + (updatedSize / 2)),
        (((updatCol + 1) * rescale) + (updatedSize / 2)));
}
function drawTrim(canvas, tileSet, atlasCol, rescale, tileSize, updatedSize, w, h) {
    let ctx = canvas.getContext('2d');

    drawImage(ctx, tileSet, (5 % atlasCol) * tileSize,
        Math.floor(5 / atlasCol) * tileSize, tileSize, 0, 0, updatedSize)
    drawImage(ctx, tileSet, (23 % atlasCol) * tileSize,
        Math.floor(23 / atlasCol) * tileSize, tileSize, 0, h, updatedSize,)
    drawImage(ctx, tileSet, (8 % atlasCol) * tileSize,
        Math.floor(8 / atlasCol) * tileSize, tileSize, w, 0, updatedSize);
    drawImage(ctx, tileSet, (25 % atlasCol) * tileSize,
        Math.floor(25 / atlasCol) * tileSize, tileSize, (w - updatedSize), h,
        updatedSize);
    drawImage(ctx, tileSet, (7 % atlasCol) * tileSize,
        Math.floor(7 / atlasCol) * tileSize, tileSize, (w - updatedSize), 0,
        updatedSize, updatedSize);
    drawImage(ctx, tileSet, (26 % atlasCol) * tileSize,
        Math.floor(26 / atlasCol) * tileSize, tileSize, w, h, updatedSize);

    for (let col = updatedSize; col < h; col += updatedSize) {
        drawImage(ctx, tileSet, (14 % atlasCol) * tileSize,
            Math.floor(14 / atlasCol) * tileSize, tileSize, 0, col, updatedSize);
        drawImage(ctx, tileSet, (17 % atlasCol) * tileSize,
            Math.floor(17 / atlasCol) * tileSize, tileSize, w, col, updatedSize);
    }

    for (let row = updatedSize; row < h - updatedSize; row += updatedSize) {
        drawImage(ctx, tileSet, (6 % atlasCol) * tileSize,
            Math.floor(6 / atlasCol) * tileSize, tileSize, row, 0, updatedSize);
        drawImage(ctx, tileSet, (24 % atlasCol) * tileSize,
            Math.floor(24 / atlasCol) * tileSize, tileSize, row, h, updatedSize);
    }
}
function drawHeatmap(canvas, heatmap, row, col, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    let updatedRow = row * tileSize;
    let updatCol = col * tileSize;
    let srgb = heatmap.output[row - 1][col - 1].srgb;
    ctx.fillStyle = 'rgba(' + 255 * srgb.red + ', ' + 255 * srgb.green + ', '
        + 255 * srgb.blue + ', 0.4)';
    ctx.fillRect(updatedRow * rescale, updatCol * rescale,
        updatedSize, updatedSize);
}
//TODO: really, you should be using polymorphism for this case...
//      or all the draw functions, now that I'm thinking about it...
//      Should check to see how we want to actual program this entire view 
//      thing. 
function drawItem(item, ctx, sourceX, sourceY, tileSize, destinationX, 
    destinationY, updatedSize ) {
    switch (item) {
        case "KEY":
            drawKey(ctx, sourceX, sourceY, tileSize, destinationX, destinationY,
                updatedSize);
            break;
        case "DOOR":
            drawDoor(ctx, sourceX, sourceY, tileSize, destinationX, destinationY,
                updatedSize);
            break;
        default:
            console.log("Default for drawItem has ran for some reason.");
            break;
    }
}

function drawKey(ctx, tileSize, destinationX, destinationY,
                updatedSize) {
    const key = new Image();
    key.src = './assets/sprites/key.png';
    console.log(key);
    key.onload = function() {
        drawImage(ctx, key, 0, 0, tileSize, destinationX,
                destinationY, updatedSize);
    }
}

function drawDoor(ctx, tileSize, destinationX, destinationY,
                updatedSize) {
    const door = new Image();
    door.src = './assets/sprites/door.png'; 
    door.onload = function() {
    drawImage(ctx, door, 0, 0, tileSize, destinationX,
            destinationY, updatedSize);
    }
}

// We are passing too many things into this. Should just make it a parameter
// Object TODO:
function drawTile(canvas, tileSet, row, col, rescale, updatedSize, tileSize,
    atlasCol, map) {
    let ctx = canvas.getContext('2d');
    let updatedRow = row * tileSize;
    let updatCol = col * tileSize;
    let destinationX = 0;
    let destinationY = 0;
    let tile = {};
    let tileVal = "";
    let tileRot = "";
    //TODO: THIS DUMB OFFSET REARS ITS UGLY HEAD. PLEASE FIGURE OUT A WAY TO 
    // JUST DEAL WITH THIS.
    tile = map[row - 1][col - 1];
    tileVal = tile.name;
    tileRot = tile.rotation;
    let rotation = (90 * tileRot) * Math.PI / 180;
    if (tileVal != 0) {
        tileVal -= 1;
        let sourceX = (tileVal % atlasCol) * tileSize;
        let sourceY = Math.floor(tileVal / atlasCol) * tileSize;
        destinationX = updatedRow * rescale;
        destinationY = updatCol * rescale;
        // Rotates canvsas. Rotating at the location of the tile. And then trasnlating the rotation back to the (0,0)
        ctx.translate(destinationX, destinationY);
        ctx.rotate(rotation);
        ctx.translate(-(destinationX), -(destinationY));
        // Adjusting rotation offset. ctx.rotate does not rotate at center, but at the top-left corner of the image. Hence the offseting.
        if (tileRot === "1") {
            destinationY = destinationY - updatedSize;
        } else if (tileRot === "2") {
            destinationY = destinationY - updatedSize;
            destinationX = destinationX - updatedSize;
        } else if (tileRot === "3") {
            destinationX = destinationX - updatedSize;
        }
        // This draws all the walkable tiles underneath the tilemaps.
        // Basically making sure we have an NxN grid. 
        drawImage(ctx, tileSet, (16 % atlasCol) * tileSize,
            Math.floor(16 / atlasCol) * tileSize, tileSize, destinationX,
            destinationY, updatedSize)
        // Actual drawing of the tilemap right here.
        drawImage(ctx, tileSet, sourceX, sourceY, tileSize, destinationX,
            destinationY, updatedSize);
        if (tile.item) { 
            drawItem(tile.item, ctx, tileSize, destinationX, 
                destinationY, updatedSize); 
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}