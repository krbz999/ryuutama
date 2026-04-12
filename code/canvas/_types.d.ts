export {};

// This is surely a workaround for a bug, that none of the layers are known by intellisense.
declare module "@client/canvas/board.mjs" {
  export default interface Canvas {
    controls: foundry.canvas.layers.ControlsLayer;
    drawings: foundry.canvas.layers.DrawingsLayer;
    grid: foundry.canvas.layers.GridLayer;
    lighting: foundry.canvas.layers.LightingLayer;
    notes: foundry.canvas.layers.NotesLayer;
    regions: foundry.canvas.layers.RegionLayer;
    sounds: foundry.canvas.layers.SoundsLayer;
    tiles: foundry.canvas.layers.TilesLayer;
    tokens: foundry.canvas.layers.TokenLayer;
    walls: foundry.canvas.layers.WallsLayer;
  }
}
