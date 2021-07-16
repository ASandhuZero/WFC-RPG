// A class containing methods and objects for use in detecting higher-order features of WFC-generated tilemaps.

// Jumpscare detector. 
// Input: input - a 2D array whose elements are strings (metadata of tiles); numRows - an int, number of rows; numCols - an int, number of columns.
// Output: a 2D array whose elements are strings describing the grid's features.
// Metadata required for this detector: LV (low visibility), T (traversable)
export function detectJumpscares(input, numRows, numCols)
{
    // Create new 2D array for output.
    let output = [];
    for (let i = 0; i < numRows; i++) {
        output.push([]);
        for (let j = 0; j < numCols; j++) {
            output[i][j] = [];
        }
    }
    // Traverse through array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata we are currently looking at in the corresponding grid cell, along with the output list.
            let currentList = input[i][j];
            // Initialize contents of output array to empty.
            if (output[i][j] == null)
            {
                output[i][j] = [];
            }
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
