import * as LayerManager from "./LayerManager"
import * as ItemManager from "./ItemManager"

export function Manager(wave = null, constraints) {
  let managers = ["LayerManager", "ItemManager"]
  console.log(constraints)
  LayerManager.testFunc(wave);
  ItemManager.testFunc(wave);
  debugger
}