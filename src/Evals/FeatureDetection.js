// A class containing methods and objects for use in detecting higher-order features of WFC-generated tilemaps.

// A main function that runs all detectors and stores them in a Features object.
export function detectFeatures(input, numRows, numCols)
{
    let t = detectTraversable(input, numRows, numCols);
    let ac = detectAmbientCreep(input, numRows, numCols);
    let js = detectJumpscares(input, numRows, numCols);
    let tar = null;
    let iso = detectIsolation(input, numRows, numCols);
    let lv = detectLowVisibility(input, numRows, numCols);

    let features = new Features(t, ac, js, tar, iso, lv);
    return features;
}

export function detectTraversable(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);

    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            
            // Check if the current grid cell contains the relevant metadata.
            if (currentList.includes("T"))
            {
                // If the current grid cell is traversable, mark as traverseable.
                output[i][j].push("T");
            }
        }
    }

    // Return the output array.
    return output;
}

// Jumpscare detector. 
// Input: input - a 2D array whose elements are strings (metadata of tiles); numRows - an int, number of rows; numCols - an int, number of columns.
// Output: a 2D array whose elements are strings describing the grid's features.
// Metadata required for this detector: LV (low visibility), T (traversable)
export function detectJumpscares(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);

    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            
            // Check if the current grid cell contains the relevant metadata.
            if (currentList.includes("LV"))
            {
                // If the current grid cell is low-vis, check if it is traversable.
                if (currentList.includes("T"))
                {
                    // If the current grid cell is traversable, mark this cell as a spot for a jumpscare.
                    output[i][j].push("JS");
                } else
                {
                    // If current grid cell is not traversable, get the cell's neighbors.
                    let neighbors = getNeighbors(input, i, j);
                    // Traverse the neighbors.
                    for (let n = 0; n < neighbors.length; n++)
                    {
                        // Get indices stored in neighbor object.
                        let index_i = neighbors[n].i;
                        let index_j = neighbors[n].j;
                        // Store the metadata list for the index being looked at.
                        let neighborList = input[index_i][index_j];
                        if (neighborList.includes("T"))
                        {
                            // If a neighbor cell is traversable, mark this cell as a spot for a jumpscare.
                            output[index_i][index_j].push("JS");
                        }
                    }
                }
            }
        }
    }

    // Return the output array.
    return output;
}

// Ambient creep detector. 
// Input: input - a 2D array whose elements are strings (metadata of tiles); numRows - an int, number of rows; numCols - an int, number of columns.
// Output: a 2D array whose elements are strings describing the grid's features.
// Metadata required for this detector: AC (ambient creep)
export function detectAmbientCreep(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);
    let threshold = 2;
    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            let count = 0;
            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            
            // Check if the current grid cell contains the relevant metadata.
            if (currentList.includes("AC"))
            {
                for (let k = 0; k < currentList.length; k++) 
                { 
                    if (currentList[k] === "AC") { count++; }
                }
                // If the current grid cell is marked as AC, mark the output tile as AC.
                output[i][j].push("AC");

                // Get the list of neighbors to this cell.
                let neighbors = getNeighbors(input, i, j);

                // Traverse the neighbors.
                for (let n = 0; n < neighbors.length; n++)
                {
                    // Get indices stored in neighbor object.
                    let index_i = neighbors[n].i;
                    let index_j = neighbors[n].j;
                    // Store the metadata list for the index being looked at.
                    let neighborList = input[index_i][index_j];
                    if (neighborList.includes("AC"))
                    {
                        count++;
                        // If a neighbor cell is also marked as AC, increase the output tile's AC score.
                        output[i][j].push("AC");
                    }
                    if (count > threshold) 
                    { 
                        output[index_i][index_j].push("AC"); 
                    }
                }
            }
        }
    }

    // Return the output array.
    return output;
}

// Low-vis detector. 
// Input: input - a 2D array whose elements are strings (metadata of tiles); numRows - an int, number of rows; numCols - an int, number of columns.
// Output: a 2D array whose elements are strings describing the grid's features.
// Metadata required for this detector: LV (low-vis)
export function detectLowVisibility(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);
    let threshold = 2;
    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        let count = 0;
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            
            // Check if the current grid cell contains the relevant metadata.
            if (currentList.includes("LV"))
            {
                // If the current grid cell is marked as AC, mark the output tile as AC.
                output[i][j].push("LV");

                // Get the list of neighbors to this cell.
                let neighbors = getNeighbors(input, i, j);

                // Traverse the neighbors.
                for (let n = 0; n < neighbors.length; n++)
                {
                    // Get indices stored in neighbor object.
                    let index_i = neighbors[n].i;
                    let index_j = neighbors[n].j;
                    // Store the metadata list for the index being looked at.
                    let neighborList = input[index_i][index_j];
                    if (neighborList.includes("LV"))
                    {
                        // If a neighbor cell is also marked as AC, increase the output tile's AC score.
                        output[i][j].push("LV");
                        count++;
                    }
                    if (count > threshold) 
                    { 
                        output[index_i][index_j].push("LV");
                    }
                }
            }
        }
    }

    // Return the output array.
    return output;
}

// Isolation detector. 
// Input: input - a 2D array whose elements are strings (metadata of tiles); numRows - an int, number of rows; numCols - an int, number of columns.
// Output: a 2D array whose elements are strings describing the grid's features.
// Metadata required for this detector: LV (low-vis), T (traversable), AC (ambient creep)
export function detectIsolation(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);

    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // The minimum number of low-vis tiles that must be surrounding a certain tile for it to be considered isolated.
            let threshold = 3;

            // The current number of low-vis tiles surrounding the current tile.
            let surroundings = 0;

            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            
            // Check if the current grid cell contains the relevant metadata.
            if (currentList.includes("T"))
            {
                // If the tile is traversable, get its neighbors.
                let neighbors = getNeighbors(input, i, j);

                // Traverse the neighbors.
                for (let n = 0; n < neighbors.length; n++)
                {
                    // Get indices stored in neighbor object.
                    let index_i = neighbors[n].i;
                    let index_j = neighbors[n].j;
                    // Store the metadata list for the index being looked at.
                    let neighborList = input[index_i][index_j];
                    if (neighborList.includes("LV"))
                    {
                        surroundings++;
                    }
                }

                // If the number of low-vis tiles surrounding the current tile is greater than the given threshold
                if (surroundings >= threshold)
                {
                    // Mark the corresponding output tile as isolated.
                    output[i][j].push("I");
                }
            }
        }
    }

    // Return the output array.
    return output;
}

// A subroutine that returns a given grid cell's neighbors.
// Input: input - the original grid; and the [i][j] location of the current grid cell.
// Output: an array of Neighbor objects
function getNeighbors(input, i, j)
{
    let neighbors = [];
    // Top left corner
    if (i === 0 && j === 0)
    {
        neighbors.push(new Neighbor(i, j+1));
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i+1,j+1));
    }
    // Top right corner
    else if (i === 0 && j === input[i].length - 1)
    {
        neighbors.push(new Neighbor(i,j-1));
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i+1,j-1));
    }
    // Bottom left corner
    else if (i === input.length - 1 && j === 0)
    {
        neighbors.push(new Neighbor(i,j+1));
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i-1,j+1));
    }
    // Bottom right corner
    else if (i === input.length - 1 && j === input[i].length - 1)
    {
        neighbors.push(new Neighbor(i,j-1));
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i-1,j-1));
    }
    // Top row
    else if (i === 0)
    {
        neighbors.push(new Neighbor(i,j+1));
        neighbors.push(new Neighbor(i,j-1));
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i+1,j+1));
        neighbors.push(new Neighbor(i+1,j-1));
    }
    // Leftmost column
    else if (j === 0)
    {
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i+1,j+1));
        neighbors.push(new Neighbor(i-1,j+1));
        neighbors.push(new Neighbor(i,j+1));
    }
    // Bottom row
    else if (i === input.length - 1)
    {
        neighbors.push(new Neighbor(i,j+1));
        neighbors.push(new Neighbor(i,j-1));
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i-1,j+1));
        neighbors.push(new Neighbor(i-1,j-1));
    }
    // Rightmost column
    else if (j === input[i].length - 1)
    {
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i+1,j-1));
        neighbors.push(new Neighbor(i-1,j-1));
        neighbors.push(new Neighbor(i,j-1));
    }
    // Not on borders of grid
    else
    {
        neighbors.push(new Neighbor(i-1,j));
        neighbors.push(new Neighbor(i+1,j));
        neighbors.push(new Neighbor(i,j+1));
        neighbors.push(new Neighbor(i,j-1));
        neighbors.push(new Neighbor(i-1,j-1));
        neighbors.push(new Neighbor(i-1,j+1));
        neighbors.push(new Neighbor(i+1,j+1));
        neighbors.push(new Neighbor(i+1,j-1));
    }

    // Return the list of neighbors.
    return neighbors;
}

// A simple data structure describing the i and j location of a neighbor grid cell.
class Neighbor
{
    constructor(i, j)
    {
        this.i = i;
        this.j = j;
    }
}

// A helper function to generate an empty 2D array.
function generate2DArray(numRows, numCols)
{
    let output = [];
    for (let i = 0; i < numRows; i++) {
        output.push([]);
        for (let j = 0; j < numCols; j++) {
            output[i][j] = [];
        }
    }
    
    return output;
}

// A simple data structure to hold the output maps of all features.
class Features
{
    constructor(t, ac, js, tar, iso, lv)
    {
        this.t = t;
        this.ac = ac;
        this.js = js;
        this.tar = tar;
        this.iso = iso;
        this.lv = lv;
    }
}
