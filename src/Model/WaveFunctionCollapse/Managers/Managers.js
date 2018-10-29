import * as LayerManager from "./LayerManager"
import * as ItemManager from "./ItemManager"

export function Manager(wave = null, constraints) {
  const managers = [
    LayerManager,
    ItemManager
  ]
  let constraint;
  
  // managers.forEach(function(manager) {
  //   debugger;
  //   constraint = constraints[manager];
  //   manager.testFunc(wave, constraint);
  // })
  LayerManager.testFunc(wave);
  ItemManager.testFunc(wave);
}