export class Model {
    constructor(width, height) {
        this.wave;
        this.observed;

        this.tile_stack = [];
        this.tile_stacksize = 0;

        this.random;
        this.width = width;
        this.height = height;
        this.total_tiles = [];
        this.total_items = [];

    }

    Init(subsets_info) {
        let init_array_length = this.width * this.height;
        this.wave = new Array(init_array_length);
        for(let i = 0; i < subsets_info.length; i++) {
            let subset = subsets_info[i];
            let tiles_info = subset["tiles"]
            let compatible = new Array(tiles_info.tile_amount);

            for (let j = 0; j < init_array_length; j++) {
                compatible[j] = new Array(tiles_info.tile_amount);

                for (let k = 0; k < tiles_info.tile_amount; k++) {
                    compatible[j][k] = new Array(4);
                }
            }
            let log_weights = new Array(tiles_info.tile_amount);
            let summed_weights = 0;
            let summed_log_weights = 0;
            
            for (let t = 0; t < tiles_info.tile_amount; t++) {
                log_weights[t] = tiles_info.weights[t] * Math.log(tiles_info.weights[t]);
                summed_weights += tiles_info.weights[t];
                summed_log_weights += log_weights[t];
            }
            tiles_info["compatible"] = compatible;
            tiles_info["log_weights"] = log_weights;
            tiles_info["summed_weights"] = summed_weights;
            tiles_info["summed_log_weights"] = summed_log_weights;
            tiles_info["starting_entropy"] = Math.log(summed_weights) - summed_log_weights / summed_weights;
            tiles_info["sums_of_ones"] = new Array(init_array_length);
            tiles_info["sums_of_weights"] = new Array(init_array_length);
            tiles_info["sums_of_log_weights"] = new Array(init_array_length);
            tiles_info["entropies"] = new Array(init_array_length);


        }
        for (let i = 0; i < init_array_length; i++) {
            this.wave[i] = {
                "tiles" : new Array(this.total_tiles.length).fill(true),
                "items" : new Array(this.total_items.length).fill(true)
            }
        }
    }

    Observe(subset) {
        let min = 1000;
        let argmin = -1;
        let tiles_info = subset["tiles"]
        
        for (let i = 0; i < this.wave.length; i++) {
            if (this.OnBoundary(i % this.width, i / this.width)) {
                continue;
            }
            let amount = tiles_info.sums_of_ones[i];
            if (amount == 0) {
                return false;
            }
            let entropy = tiles_info.entropies[i];
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
                for (let t = 0; t < this.total_tiles.length; t++) {
                    let wave_tiles = this.wave[i]["tiles"]
                    if (wave_tiles[t]) {
                        this.observed[i] = t;
                        break;
                    }
                }
            }
            return true;
        }
        let distribution = new Array(tiles_info.tile_amount);
        let w = this.wave[argmin]["tiles"];
        for (let t = 0; t < tiles_info.tile_amount; t++) {
            distribution[t] = w[t] ? tiles_info.weights[t] : 0;
            distribution[t] /= tiles_info.tile_amount;
        }
        let r = this._NonZeroIndex(distribution);
        for (let t = 0; t < tiles_info.tile_amount; t++) {
            if (w[t] != (t == r)) {
                this.BanTile(tiles_info, argmin, t);
                this.BanItem(subset, argmin, 1);
            }
        }
        return null;
    }

    Propagate(subset) {
        let DX = [-1, 0, 1, 0];
        let DY = [0, 1, 0, -1];
        
        let tiles_info = subset["tiles"];
        while(this.tile_stacksize > 0) {
            let e1 = this.tile_stack.pop(); // element 1
            this.tile_stacksize = this.tile_stack.length;

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
                let p = tiles_info.neighbor_propagator[d][tile_1];
                let compat = tiles_info.compatible[index_2];
                for (let l = 0; l < p.length; l++) {
                    let tile_2 = p[l] 
                    let comp = compat[tile_2];
                    comp[d] = comp[d] - 1;
                    if (comp[d] == 0) {
                        this.BanTile(tiles_info, index_2, tile_2);
                        this.BanItem(subset, index_2, 1);
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
                let tile_elem = this.wave[x + y * this.height]["tiles"];
                let item_elem = this.wave[x + y * this.height]["items"];
                let amount = 0;
                for (let i = 0; i < tile_elem.length; i++) {
                    if (tile_elem[i]) {
                        amount += 1;
                    }
                }
                if (amount == this.total_tiles.length) {
                    console.warn(amount)
                } else {
                    for (let t = 0; t < this.total_tiles.length; t++) {
                        if (tile_elem[t]) {
                            for (let i = 0; i < this.total_items.length; i++) {
                                if (item_elem[i]) {
                                    array.push(this.total_tiles[t] + ' ' + this.total_items[i]);
                                } 
                            }
                        }
                    }
                }
            } 
        }
        console.log(array)
        debugger
        return array;
    }

    Run(seed, limit) {
        if (this.wave == null) {
            this.Init(this.subsets_info);
        }
        this.Clear();
        this.random = Math.random // IS NOT SEEDED
        
        let subset = this.subsets_info[0]
        for (let l = 0; l < limit || limit == 0; l++) {
            let result = this.Observe(subset);
            console.warn("Observe has ran");
            
            if (result != null) {
                return result;
            }
            this.Propagate(subset);
        }
        return true;
    }
    BanItem(subset, elem, item) {
        let item_amount = subset.item_amount;
        let wave_item_array = this.wave[elem]["items"];
        for (let i = item_amount; i < wave_item_array.length; i++) {
            wave_item_array[i] = false;
        }
        wave_item_array[item] = false;
    }
    BanTile(tiles_info, elem, tile) {
        let tile_amount = tiles_info.tile_amount;
        let wave_tile_array = this.wave[elem]["tiles"];
        for (let i = tile_amount; i < wave_tile_array.length; i++) {
            wave_tile_array[i] = false;
        }
        wave_tile_array[tile] = false;
        tiles_info.compatible[elem][tile] = [0,0,0,0];
        this.tile_stack.push([elem, tile]);
        this.tile_stacksize = this.tile_stack.length;

        let sum = tiles_info.sums_of_weights[elem];
        tiles_info.entropies[elem] += tiles_info.sums_of_log_weights[elem] / sum - Math.log(sum);

        tiles_info.sums_of_ones[elem] -= 1;
        tiles_info.sums_of_weights[elem] -= tiles_info.weights[tile];
        tiles_info.sums_of_log_weights[elem] -= tiles_info.log_weights[tile];

        sum = tiles_info.sums_of_weights[elem];
        tiles_info.entropies[elem] -= tiles_info.sums_of_log_weights[elem] / sum - Math.log(sum);
    }

    Clear() {
        let opposite = [2, 3, 0, 1]
        for (let i = 0; i < this.wave.length; i++) {
            for (let t = 0; t < this.total_tiles.length; t++) {
                this.wave[i]["tiles"][t] = true;
            }
        }
        
        for (let i = 0; i < this.subsets_info.length; i++) {
            let subset = this.subsets_info[i];
            let tiles_info = subset["tiles"]
            for (let w = 0; w < this.wave.length; w++) {
                for (let t = 0; t < tiles_info.tile_amount; t++) {
                    for (let d = 0; d < 4; d++) {
                        tiles_info.compatible[w][t][d] = tiles_info.neighbor_propagator[opposite[d]][t].length; // compatible is the compatible tiles of t. NOT t itself. Which is why opposite is involved.
                    }
                }
            }
            for (let t = 0; t < this.wave.length; t++) {
                tiles_info.sums_of_ones[t] = tiles_info.weights.length;
                tiles_info.sums_of_weights[t] = tiles_info.summed_weights;
                tiles_info.sums_of_log_weights[t] = tiles_info.summed_log_weights;
                tiles_info.entropies[t] = tiles_info.starting_entropy;
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