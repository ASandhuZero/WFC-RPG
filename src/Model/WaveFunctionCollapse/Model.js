export class Model {
    constructor(width, height) {
        this.wave;
        this.compatible;
        this.observed;

        this.stack = [];
        this.stacksize = 0;

        this.random;
        this.width = width;
        this.height = height;
        this.tiles;
        this.weights; 
        this.log_weights;

    }

    Init(subsets_info) {
        let init_array_length = this.width * this.height;
        
        this.wave = new Array(init_array_length);
        for(let i = 0; i < subsets_info.length; i++) {
            let subset = subsets_info[i];
            let compatible = new Array(subset.tiles.length);

            for (let j = 0; j < init_array_length; j++) {
                compatible[j] = new Array(subset.tiles.length);

                for (let k = 0; k < subset.tiles.length; k++) {
                    compatible[j][k] = new Array(4);
                }
            }
            let log_weights = new Array(subset.tiles.length);
            let summed_weights = 0;
            let summed_log_weights = 0;
            
            for (let t = 0; t < subset.tiles.length; t++) {
                log_weights[t] = subset.weights[t] * Math.log(subset.weights[t]);
                summed_weights += subset.weights[t];
                summed_log_weights += log_weights[t];
            }

            subset["compatible"] = compatible;
            subset["log_weights"] = log_weights;
            subset["summed_weights"] = summed_weights;
            subset["summed_log_weights"] = summed_log_weights;
            subset["starting_entropy"] = Math.log(summed_weights) - summed_log_weights / summed_weights;
            subset["sums_of_ones"] = new Array(init_array_length);
            subset["sums_of_weights"] = new Array(init_array_length);
            subset["sums_of_log_weights"] = new Array(init_array_length);
            subset["entropies"] = new Array(init_array_length);


        }
        for (let i = 0; i < init_array_length; i++) {
            this.wave[i] = new Array(this.tiles.length).fill(true);
        }
    }

    Observe(subset) {
        let min = 1000;
        let argmin = -1;
        
        for (let i = 0; i < this.wave.length; i++) {
            if (this.OnBoundary(i % this.width, i / this.width)) {
                continue;
            }
            let amount = subset.sums_of_ones[i];
            if (amount == 0) {
                return false;
            }
            let entropy = subset.entropies[i];
            if (amount > 1 && entropy <= min) {
                // let noise = 0.000001 * this.random();
                let noise = 0.000001;
                if (entropy + noise < min) {
                    min = entropy + noise;
                    argmin = i;
                }
            }
        }
        if (argmin == -1) {
            this.observed = new Array(this.width * this.height);
            for (let i = 0; i < this.wave.length; i++) {
                for (let t = 0; t < this.tiles.length; t++) {
                    if (this.wave[i][t]) {
                        this.observed[i] = t;
                        break;
                    }
                }
            }
            return true;
        }
        let distribution = new Array(subset.tiles.length);
        let w = this.wave[argmin];
        for (let t = 0; t < subset.tiles.length; t++) {
            distribution[t] = w[t] ? subset.weights[t] : 0;
            distribution[t] /= subset.tiles.length;
        }
        let r = this._NonZeroIndex(distribution);
        for (let t = 0; t < subset.tiles.length; t++) {
            if (w[t] != (t == r)) {
                this.Ban(subset, argmin, t);
            }
        }
        return null;
    }

    Propagate(subset) {
        let DX = [-1, 0, 1, 0];
        let DY = [0, 1, 0, -1];
        
        while(this.stacksize > 0) {
            let e1 = this.stack.pop(); // element 1
            this.stacksize = this.stack.length;

            let index_1 = e1[0]; // Item 1
            let tile_1 = e1[1];
            let x1 = index_1 % this.width;
            let y1 = Math.floor(index_1 / this.width);
            
            for (let d = 0; d < 4; d++) {
                let dx = DX[d]; 
                let dy = DY[d];
                let x2 = x1 + dx;
                let y2 = y1 + dy;

                if (this.OnBoundary(x2, y2)) {
                    continue;
                }

                if (x2 < 0) {
                    x2 += this.width;
                } else if (x2 >= this.width) {
                    x2 -= this.width;
                }

                if (y2 < 0) {
                    y2 += this.height;
                } else if (y2 >= this.height) {
                    y2 -= this.height;
                }

                let index_2 = x2 + y2 * this.width;  // Item 2
                let p = subset.neighbor_propagator[d][tile_1];
                let compat = subset.compatible[index_2];
                for (let l = 0; l < p.length; l++) {
                    let tile_2 = p[l] 
                    let comp = compat[tile_2];
                    comp[d] = comp[d] - 1;
                    if (comp[d] == 0) {
                        this.Ban(subset, index_2, tile_2);
                    }
                }
            }
        }
    }

    GenerateTileMap(seed, limit) {
        this.Run(seed, limit);
        let array = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let a = this.wave[x + y * this.height];
                
                let amount = 0;
                for (let i = 0; i < a.length; i++) {
                    if (a[i]) {
                        amount += 1;
                    }
                }
                if (amount == this.tiles.length) {
                    console.log(amount)
                    // Utils._warning("It seems the wave might not be observed.")
                } else {
                    for (let t = 0; t < this.tiles.length; t++) {
                        if (a[t]) {
                            array.push(this.tiles[t]);
                        }
                    }
                }
            } 
        }
        if (array.length == 2) {
            debugger;
        }
        // console.log(array);
        return array;
    }

    Ban(subset, item, tile) {
        let tile_amount = subset.tiles.length;
        for (let i = tile_amount; i < this.wave[item].length; i++) {
            this.wave[item][i] = false;
        }
        this.wave[item][tile] = false;
        subset.compatible[item][tile] = [0,0,0,0];
        this.stack.push([item, tile]);
        this.stacksize = this.stack.length;

        let sum = subset.sums_of_weights[item];
        subset.entropies[item] += subset.sums_of_log_weights[item] / sum - Math.log(sum);

        subset.sums_of_ones[item] -= 1;
        subset.sums_of_weights[item] -= subset.weights[tile];
        subset.sums_of_log_weights[item] -= subset.log_weights[tile];

        sum = subset.sums_of_weights[item];
        subset.entropies[item] -= subset.sums_of_log_weights[item] / sum - Math.log(sum);
    }

    Clear() {
        let opposite = [2, 3, 0, 1]
        for (let i = 0; i < this.wave.length; i++) {
            for (let t = 0; t < this.tiles.length; t++) {
                this.wave[i][t] = true;
            }
        }
        
        for (let i = 0; i < this.subsets_info.length; i++) {
            let subset = this.subsets_info[i];
            for (let w = 0; w < this.wave.length; w++) {
                for (let t = 0; t < subset.tiles.length; t++) {
                    for (let d = 0; d < 4; d++) {
                        subset.compatible[w][t][d] = subset.neighbor_propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                    }
                }
            }
            for (let t = 0; t < this.wave.length; t++) {
                subset.sums_of_ones[t] = subset.weights.length;
                subset.sums_of_weights[t] = subset.summed_weights;
                subset.sums_of_log_weights[t] = subset.summed_log_weights;
                subset.entropies[t] = subset.starting_entropy;
            }
        }
    }
    OnBoundary(x,y) {
        pass;
    }

    _NonZeroIndex(array) {
        let index = Math.floor(Math.random()*array.length);
        let elem = array[index];
        let zero_array = [];
        for (let i = 0; i < array.length; i++) {
            if (elem == 0) {
                zero_array.push(index);
                // array.splice(index, 1);
            }
            if (zero_array.includes(index)) {
                index = Math.floor(Math.random()*array.length);
                elem = array[index];
            }
            else {
                return index;
            }
        }
    }                

}
