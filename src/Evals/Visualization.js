import Color from "https://colorjs.io/src/color.js";
import "https://colorjs.io/src/spaces/lab.js";
import "https://colorjs.io/src/spaces/lch.js";
import "https://colorjs.io/src/spaces/srgb.js";
import "https://colorjs.io/src/spaces/p3.js";
import "https://colorjs.io/src/spaces/hsl.js";
import "https://colorjs.io/src/spaces/hwb.js";
import "https://colorjs.io/src/interpolation.js";
import "https://colorjs.io/src/./keywords.js";
window.Color = window.Color || Color;
// Re-export
export default Color;

// A function used to generate visualizations (heatmaps) of features from a Features object.
export function generateHeatmaps(input, numRows, numCols)
{
    let ac = generateHeatmap(input.ac, numRows, numCols, "AC");
    let js = generateHeatmap(input.js, numRows, numCols, "JS");
    let tar = null;
    let iso = generateHeatmap(input.iso, numRows, numCols, "I");
    let lv = generateHeatmap(input.lv, numRows, numCols, "LV");
    let heatmaps = new Heatmaps(ac, js, tar, iso, lv);
    return heatmaps;
}

// Heatmap generation.
// Input: input - a 2D array whose elements are strings (metadata/higher order features of tiles); metatag - a string denoting what tag is being used to generate the curren heatmap
// Output: a 2D array that can be overlayed on the tilemap to see "hotspots" of tags
// Metatags: AC (ambient creep), JS (jumpscare potential), TaR (tension and release), I (isolation), LV (low visibility)
export function generateHeatmap(input, numRows, numCols, metatag)
{
    // Create new 2D array for output.
    let output = generate2DArray(numRows, numCols);

    // Traverse the input array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata for the grid cell we are currently looking at.
            let currentList = input[i][j];
            // Count how many times the metatag appears in the list.
            let count = 0;
            for (let k = 0; k < currentList.length; k++)
            {
                if (currentList[k].includes(metatag))
                {
                    count++;
                }
            }
            // Push the count to the output array at the grid cell we are currently looking at.
            output[i][j].push(count);
        }
    }

    // Generate a heatmap using the output array.
    let heatmap = new Heatmap(output, numRows, numCols);

    // Return the heatmap object.
    return heatmap;
}

// A helper function to generate a range of numbers stored in an array.
function range(start, end) {
    let ans = [];
    for (let i = start; i <= end; i++) {
        ans.push(i);
    }
    return ans;
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

// A class defining a heatmap object, to be used with a 2D input array containing integer values.
class Heatmap
{
    constructor(input, numRows, numCols)
    {
        this.input = input;
        this.c1 = new Color("rebeccapurple");
        this.c2 = new Color("lch", [85, 100, 85]);
        this.colorRange = this.c1.range(this.c2, {space: "hwb"});
        this.output = this.populateArray(this.input, numRows, numCols, this.colorRange);
    }

    populateArray(input, numRows, numCols, colorRange)
    {
        let output = generate2DArray(numRows, numCols);
        for (let i = 0; i < input.length; i++)
        {
            for (let j = 0; j < input[i].length; j++)
            {
                // Get the integer value for the grid cell we are current looking at, and scale it.
                let value = input[i][j] / 10;
                // Set the color value for the corresponding grid cell in the output array.
                output[i][j] = colorRange(value);
            }
        }

        return output;
    }
}

// A data structure holding all heatmaps for all detectable features.
class Heatmaps
{
    constructor(ac, js, tar, iso, lv)
    {
        this.ac = ac;
        this.js = js;
        this.tar = tar;
        this.iso = iso;
        this.lv = lv;
    }
}