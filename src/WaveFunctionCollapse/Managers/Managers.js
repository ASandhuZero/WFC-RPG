import * as LayerManager from "./LayerManager"
import * as ItemManager from "./ItemManager"

export function Manager(wave = null, constraints = null) {
  const managers = [
    LayerManager,
    ItemManager
  ]
  let constraint;

  managers.forEach(function(manager) {
    constraint = constraints[manager];
    manager.testFunc(wave, constraint);
    
  });
}