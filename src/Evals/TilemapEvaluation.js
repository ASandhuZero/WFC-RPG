// A class containing methods and objects for use in evaluating the narrative potential of a given tilemap.

// Horror evaluation tool.
// Input: a 2D array whose elements are strings (metadata/higher order features of tiles); numRows - an int, number of rows; numCols - an int, number of columns;
//   subgenre - a string denoting what configuration of weights should be considered in scoring
// Output: a Score object
// Metadata being used in scoring: AC (ambient creep), JS (jumpscare potential), TaR (tension and release), I (isolation), LV (low visibility)
function evaluateHorrorPotential(input, numRows, numCols, subgenre)
{
    // Set up data structures for basic statistics about the map (size of map and frequency of tile tags).
    let size = numRows * numCols;
    let frequencies = [0, 0, 0, 0, 0];

    // Traverse through the input array.
    for (let i = 0; i < input.length; i++)
    {
        for (let j = 0; j < input[i].length; j++)
        {
            // Store the list of metadata for the grid cell we are currently looking at.
            let currentList = input[i][j];
            
            // Gather basic statistics about the map: percentage of the map taken up by each kind of tile/groups of tiles
            // If a certain metatag appears at the current tile, increase its frequency by one.
            // Stored in the frequencies array with the following indices: 0 = AC, 1 = JS, 2 = TaR, 3 = I, 4 = LV
            if (currentList.includes("AC"))
            {
                frequencies[0] += 1;
            }
            if (currentList.includes("JS"))
            {
                frequencies[1] += 1;
            }
            if (currentList.includes("TaR"))
            {
                frequencies[2] += 1;
            }
            if (currentList.includes("I"))
            {
                frequencies[3] += 1;
            }
            if (currentList.includes("LV"))
            {
                frequencies[4] += 1;
            }
        }
    }

    // After traversing entire grid, calculate space usage of tiles per metatag.
    // Identify any metatags that are not used at all.
    // Determine if breadth requirement is met.
    // Determine if oversaturation has occurred -- threshold is currently 80%.
    let spaceUsage = [];
    let unusedTags = [];
    let breadthReqMet = true;
    let oversaturatedTags = [];

    for (let i = 0; i < frequencies.length; i++)
    {
        let currentTagUsage = frequencies[i] / size;
        spaceUsage.push(currentTagUsage);
        if (frequencies[i] === 0)
        {
            breadthReqMet = false;
            unusedTags.push(i);
        }
        if (currentTagUsage > 0.8)
        {
            oversaturatedTags.push(i);
        }
    }

    // An array of 5 weights per metatag used in scoring for each subgenre.
    // [AC, JS, TaR, I, LV]
    const slasher = [0.1, 0.4, 0.1, 0.1, 0.3];
    const psych = [0.3, 0.1, 0.3, 0.2, 0.1];
    const surreal = [0.4, 0.1, 0.2, 0.2, 0.1];

    // Determine the weights that should be used in the current evaluation.
    let weights;
    if (subgenre === "slasher")
    {
        weights = slasher;
    } else if (subgenre === "psych")
    {
        weights = psych;
    } else if (subgenere === "surreal")
    {
        weights = surreal;
    }

    // Current scoring technique: for every tag, calculate the error.
    // Sum the errors. This gives us a chi squared evaluation for goodness of fit.
    let errors = [];
    let chiSquared = 0;
    for (let i = 0; i < weights.length; i++)
    {
        let expectedFrequency = weights[i] * size;
        let distance = frequencies[i] - expectedFrequency;
        let dSquared = distance * distance;
        let error = dSquared / expectedFrequency;
        errors.push(error);
        chiSquared += error;
    }

    // Create a new score object.
    let score = new Score(chiSquared, breadthReqMet, unusedTags, spaceUsage,
        oversaturatedTags);
    
    return score;
}

// An object representing the overall score of the tilemap.
// Details here.
class Score
{
    constructor(chiSquared, breadthReqMet, unusedTags, spaceUsage, 
        oversaturatedTags) {
            this.chiSquared = chiSquared;
            this.breadthReqMet = breadthReqMet;
            this.unusedTags = unusedTags;
            this.spaceUsage = spaceUsage;
            this.oversaturatedTags = oversaturatedTags;
        }
}