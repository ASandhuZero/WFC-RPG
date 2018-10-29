export class Model {
    constructor(width, height) {
        this.wave;
        this.propagator;
        this.compatible;
        this.observed;

        this.stack = {};
        this.stacksize = 0;

        this.random;
        this.width = width;
        this.height = height;
        this.tiles;
        this.weights; 
        this.log_weights;

        this.summed_weights;
        this.summed_log_weights;
        this.starting_entropy;
        
        this.sums_of_ones;
        this.sums_of_weights;
        this.sums_of_log_weights;
        this.entropies;
    }

    Init() {
        let init_array_length = this.width * this.height;
        
        this.wave = new Array(init_array_length);
        this.compatible = new Array(init_array_length);

        for (let i = 0; i < init_array_length; i++) {
            this.wave[i] = new Array(this.tiles.length).fill(true);
            this.compatible[i] = new Array(this.tiles.length);
            
            for (let t = 0; t < this.tiles.length; t++) {
                this.compatible[i][t] = new Array(4);
            }
        } 
        this.log_weights = new Array(this.tiles.length);
        this.summed_weights = 0;
        this.summed_log_weights = 0;
        
        for (let t = 0; t < this.tiles.length; t++) {
            this.log_weights[t] = this.weights[t] * Math.log(this.weights[t]);
            this.summed_weights += this.weights[t];
            this.summed_log_weights += this.log_weights[t];
        }

        this.starting_entropy = Math.log(this.summed_log_weights) - this.summed_log_weights / this.summed_weights;
        this.sums_of_ones = new Array(init_array_length);
        this.sums_of_weights = new Array(init_array_length);
        this.sums_of_log_weights = new Array(init_array_length);
        this.entropies = new Array(init_array_length);
    }

    Observe() {
        let min = 1000;
        let argmin = -1;

        for (let i = 0; i < this.wave.length; i++) {
            if (this.OnBoundary(i % this.width, i / this.height)) {
                continue;
            }
            let amount = this.sums_of_ones[i];
            if (amount == 0) {
                return false;
            }
            let entropy = this.entropies[i];
            if (amount > 1 && entropy <= min) {
                let noise = 0.000001 * this.random;
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

        let distribution = new Array(this.tiles.length);
        for (let t = 0; t < this.tiles.length; t++) {
            distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
        }
        // let r = distribution.random
        let r = distribution[Math.floor(Math.random()*distribution.length)];

        let w = this.wave[argmin];
        for (let t = 0; t < this.tiles.length; t++) {
            if (w[t] != (t == r)) {
                this.Ban(argmin, t);
            }
        }
        return null;
    }

    Propagate() {
        let DX = [-1, 0, 1, 0];
        let DY = [0, 1, 0, -1];
        while(this.stacksize > 0) {
            let e1 = this.stack[this.stacksize - 1]; //element 1
            this.stacksize = this.stacksize - 1;

            let i1 = e1[0]; // Item 1
            let x1 = i1 % this.width;
            let y1 = i1 % this.height;

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
                } else if (x2 > this.width) {
                    x2 -= this.width;
                }

                if (y2 < 0) {
                    y2 += this.height;
                } else if (y2 > this.height) {
                    y2 -= this.height;
                }

                let i2 = x2 + y2 * this.width; // Item 2
                debugger;
                let p = this.propagator[d][e1[1]];
                let compat = this.compatible[i2];
                for (let l = 0; l < p.length; l++) {
                    let t2 = p[l] // tile of some sort
                    let comp = compat[t2]; // all compatible tiles of t2?

                    comp[d]--;
                    if (comp[d] == 0) {
                        this.Ban(i2, t2);
                    }
                }
            }
        }
    }

    Run(seed, limit) {
        if (this.wave == null) {
            this.Init();
        }

        this.Clear();
        this.random = Math.random() // IS NOT SEEDED

        for (let l = 0; l < limit || limit == 0; l++) {
            let result = this.Observe();
            
            if (result != null) {
                return result;
            }
            this.Propagate();
            // console.log(this.wave);
        }
        return true;
    }

    Ban(item, tile) {
        this.wave[item][tile] = false;
        console.log(this.wave[item], item, tile);
        

        let comp = this.compatible[item][tile];
        for (let d = 0; d < 4; d++) {
            comp[d] = 0;
            this.stack[this.stacksize] = [item, tile];
            this.stacksize++;

            let sum = this.sums_of_weights[item];
            this.entropies[item] += this.sums_of_log_weights[item] / sum - Math.log(sum);

            this.sums_of_ones[item] -= 1;
            this.sums_of_weights[item] -= this.weights[tile];
            this.sums_of_log_weights[item] -= this.log_weights[tile];

            sum = this. sums_of_weights[item];
            this.entropies[item] -= this.sums_of_log_weights[item] / sum - Math.log(sum);
        }
    }

    Clear() {
        let opposite = [2, 3, 0, 1]
        for (let i = 0; i < this.wave.length; i++) {
            for (let t = 0; t < this.tiles.length; t++) {
                this.wave[i][t] = true;
                for (let d = 0; d < 4; d++) {
                    this.compatible[i][t][d] = this.propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                }
                
                this.sums_of_ones[i] = this.weights.length;
                this.sums_of_weights[i] = this.summed_weights;
                this.sums_of_log_weights[i] = this.summed_log_weights;
                this.entropies[i] = this.starting_entropy;
            }
        }
        debugger;
    }
    OnBoundary(x,y) {
        pass;
    }
}