import {Model} from './Model';

export class SimpleTiledModel extends Model {
    constructor(periodic, subset_name,width, height, tile_json, constraints_json) {
        super(width, height);

        this.periodic = periodic; 
        this.height = height;
        this.width = width;
        this.tile_json = tile_json;
        this.constraints = constraints_json;

        this.tilesize = this.tile_json.tilesize;
        this.unique = false; // have no clue what this does

        this.subsets = this.tile_json.subsets;

    }
    OnBoundary(x, y) {
        return !this.periodic && (x < 0 || y < 0 || x >= this.width || y >= this.height);
    }
}