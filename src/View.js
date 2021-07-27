// To thee who find themselves in this file. This is not a traditional view 
// file, the likes of which are seen in MVC, but a module solely focusing on 
// outputting something to the webpage.


// CANVAS CODE TODO: BREAK THIS OUT INTO ITS OWN JS FILE IF WORK.
// Also, got this from this helpful link https://medium.com/geekculture/make-your-own-tile-map-with-vanilla-javascript-a627de67b7d9 
// Good good stuff.
export function Draw(heatmaps, w, h, tileSize, rescale, tileSet, tileSetCol, map, paths) {

    let debugging = true;
    let updatedSize = tileSize * rescale;
    let atlasCol = tileSetCol;
    // TODO: THE REASON WHY WE ARE DOING THIS OFFSET IS BECUASE OF THE TRIM...
    w = w;
    h = h;
    let index = 0;
    //TODO: THE ORDERING HERE MATTERS. WHAT EVER IS GENERATED LAST, WILL BE ON 
    // TOP.
    let tilemapCanvas = generateCanvas("Tilemap", w+updatedSize, h+updatedSize);
    let heatmapCanvases = []
    let heatmapNames = ["ac", "js", "iso", "lv"]
    for (let i = 0; i < heatmapNames.length; i++) {
        heatmapCanvases.push(generateCanvas(heatmapNames[i], w, h));
    }
    let tileNameCanvas = generateCanvas("TileNames", w, h)
    heatmapCanvases = heatmapCanvases.filter(canvas => typeof canvas !== 
        typeof 1);
    let pathsCanvas = generateCanvas("Paths", w, h);

    for (let row = 1; row < (w/updatedSize); row++) {
        for (let col = 1; col < (h/updatedSize); col++) {

            drawTile(tilemapCanvas, tileSet, row, col, rescale, updatedSize, 
                tileSize, atlasCol, map, index);

            for (let i = 0; i < heatmapNames.length; i++) {
                let heatmap = heatmaps[heatmapNames[i]];
                drawHeatmap(heatmapCanvases[i], heatmap, row, col, rescale, 
                    updatedSize, tileSize);
            }
            
            drawName(tileNameCanvas, map, index, row, col, atlasCol, rescale, 
                updatedSize, tileSize);
                
                index++;
            }
        }
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i].path;
        drawPath(pathsCanvas, path, i, rescale, updatedSize, tileSize, w, h);
    }
            
    generateButton("names", tileNameCanvas.style, "#ff0000", h, rescale, 
        updatedSize, debugging);
    let rgbs = ['rgb(0, 225, 0)','rgb(0, 0, 225)', 'rgb(225, 225, 0)', 
        'rgb(225, 0, 225)'];
    for (let i = 0; i < heatmapNames.length; i++) {
        generateButton(heatmapNames[i], heatmapCanvases[i].style, rgbs[i], h, 
            rescale,updatedSize);
    }
    generateButton("paths", pathsCanvas.style, "#FFF", h, rescale, 
        updatedSize, "block");
    drawTrim(tilemapCanvas, tileSet, atlasCol, rescale, tileSize, updatedSize, w, h);
}

function generateButton(name, style, color, h, rescale, updatedSize, set=false) {
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

function drawImage(ctx, tileSet, sourceX, sourceY, sourceSize, destX, destY, updatedSize) {
    // updatedSize -= 1;
    ctx.drawImage(tileSet, sourceX, sourceY, sourceSize, sourceSize, destX, 
        destY, updatedSize, updatedSize);
}
function drawPath(canvas, path, pathOffset, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    if (path.length === 0) { return; }
    ctx.strokeStyle = ['rgb(225, 0, 0)','rgb(0, 225, 0)',
        'rgb(0, 0, 225)', 'rgb(225, 225, 0)', 'rgb(225, 0, 225)'][pathOffset]
    ctx.beginPath();
    let lineWidth = 5;
    ctx.lineWidth = lineWidth;
    ctx.moveTo((path[0].x + 1) * (updatedSize * 1.5), 
        (path[0].y + 1) * (updatedSize * 1.5));
    for (let i = 1; i < path.length; i++) {
        if (i == path.length-1) { pathOffset = 0; }
        let tile = path[i];
        // TODO: THE ONE IS AN OFFSET BECAUSE OF THE TRIM.
        let x = (tile.x + 1) * tileSize;
        let y = (tile.y + 1) * tileSize;
        ctx.lineTo(x * rescale + (2 * pathOffset)  + updatedSize/2, 
            y * rescale + (2 * pathOffset) + updatedSize/2 );
        ctx.stroke();   
    }
}
function drawName(canvas, map, index, row, col, atlasCol, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    let updatedRow = row * tileSize;
    let updatCol = col * tileSize;
    //TODO: THE DUMB OFFSETTING RIGHT HERE AGAIN.
    let tile = map[row-1][col-1];
    let tileVal = tile.name;
    let sourceX = (tileVal % atlasCol) * tileSize;
    let sourceY = Math.floor(tileVal/atlasCol) * tileSize;
    ctx.font = '14px serif';
    ctx.fillStyle = "#ff0000";
    ctx.fillText(tile.name, 
        (((updatedRow+1) * rescale-10) + (updatedSize/2)),
        (((updatCol+1) * rescale) + (updatedSize/2)));
}
function drawTrim(canvas, tileSet, atlasCol, rescale, tileSize, updatedSize, w, h) {
    let ctx = canvas.getContext('2d');
    
    drawImage(ctx, tileSet, (5 % atlasCol) * tileSize, 
        Math.floor(5/atlasCol) * tileSize, tileSize, 0, 0, updatedSize)
    drawImage(ctx, tileSet, (23 % atlasCol) * tileSize, 
        Math.floor(23/atlasCol) * tileSize, tileSize, 0, h, updatedSize,)
    drawImage(ctx, tileSet, (8 % atlasCol) * tileSize, 
        Math.floor(8/atlasCol) * tileSize, tileSize, w, 0, updatedSize);
    drawImage(ctx, tileSet, (25 % atlasCol) * tileSize, 
        Math.floor(25/atlasCol) * tileSize, tileSize, (w-updatedSize), h, 
        updatedSize);
    drawImage(ctx, tileSet, (7 % atlasCol) * tileSize, 
        Math.floor(7/atlasCol) * tileSize, tileSize, (w-updatedSize), 0, 
        updatedSize, updatedSize);
    drawImage(ctx, tileSet, (26 % atlasCol) * tileSize, 
        Math.floor(26/atlasCol) * tileSize, tileSize, w, h, updatedSize);
        
    for (let col = updatedSize; col < h; col += updatedSize) {
        drawImage(ctx, tileSet, (14 % atlasCol) * tileSize, 
            Math.floor(14/atlasCol) * tileSize, tileSize, 0, col, updatedSize);
        drawImage(ctx, tileSet, (17 % atlasCol) * tileSize, 
            Math.floor(17/atlasCol) * tileSize, tileSize, w, col, updatedSize);
    }

    for (let row = updatedSize; row < h - updatedSize; row += updatedSize) {
        drawImage(ctx, tileSet, (6 % atlasCol) * tileSize, 
            Math.floor(6/atlasCol) * tileSize, tileSize, row, 0, updatedSize);
        drawImage(ctx, tileSet, (24 % atlasCol) * tileSize, 
            Math.floor(24/atlasCol) * tileSize, tileSize, row, h, updatedSize);
    }
}
// Parameter object? TODO:
function drawHeatmap(canvas, heatmap, row, col, rescale, updatedSize, tileSize) {
    let ctx = canvas.getContext('2d');
    let updatedRow = row * tileSize;
    let updatCol = col * tileSize;
    let srgb = heatmap.output[row-1][col-1].srgb;
    ctx.fillStyle = 'rgba(' + 255 * srgb.red + ', '+ 255 * srgb.green + ', ' 
        + 255 * srgb.blue + ', 0.4)';
    ctx.fillRect(updatedRow * rescale, updatCol * rescale, 
        updatedSize, updatedSize);
}
// We are passing too many things into this. Should just make it a parameter
// Object TODO:
function drawTile(canvas, tileSet, row, col, rescale, updatedSize, tileSize, 
        atlasCol, map, index) {
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
    tile = map[row-1][col-1];
    tileVal = tile.name;
    tileRot = tile.rotation;
    let rotation = (90 * tileRot)* Math.PI / 180;
    if(tileVal !=0) {
        tileVal -= 1;
        let sourceX = (tileVal % atlasCol) * tileSize;
        let sourceY = Math.floor(tileVal/atlasCol) * tileSize;
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
        // THIS DRAWS ALL THE NIGHTMARE WALKABLE TILES. TODO:
        drawImage(ctx, tileSet, (16 % atlasCol) * tileSize, 
            Math.floor(16/atlasCol) * tileSize, tileSize, destinationX, 
            destinationY, updatedSize)
        // Actual drawing of the tilemap right here.
        drawImage(ctx, tileSet, sourceX, sourceY, tileSize, destinationX, 
            destinationY, updatedSize);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}