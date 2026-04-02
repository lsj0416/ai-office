export const TILE_SIZE = 48
export const MAP_COLS = 20
export const MAP_ROWS = 15
export const CANVAS_WIDTH = TILE_SIZE * MAP_COLS   // 960
export const CANVAS_HEIGHT = TILE_SIZE * MAP_ROWS  // 720

// Tile type IDs
export const T_FLOOR = 0
export const T_WALL = 1
export const T_DESK = 2
export const T_MEETING = 3
export const T_BREAK = 4

// Walkable tile set (desks block movement)
export const WALKABLE_TILES = new Set([T_FLOOR, T_MEETING, T_BREAK])

// Colors (hex numbers for Pixi.js)
export const COLORS = {
  floor: 0xf0efe6,
  wall: 0x3d3d4d,
  wallAccent: 0x2d2d3d,
  desk: 0xc4a572,
  deskTop: 0xb8935a,
  meeting: 0xdce8ff,
  meetingBorder: 0xa8c4ff,
  breakRoom: 0xdcf5dc,
  breakBorder: 0xa8e0a8,
  gridLine: 0xe5e4db,
  player: 0xff6b35,
  playerBorder: 0xcc4a10,
  proximityRing: 0xffeb3b,
  labelBg: 0x000000,
} as const

export const AGENT_ROLE_COLORS: Record<string, number> = {
  PM: 0x4a90d9,
  DEVELOPER: 0x7ed321,
  MARKETER: 0xe040fb,
  DESIGNER: 0xff6090,
  REVIEWER: 0xff9800,
  CUSTOM: 0x9b9b9b,
}

// Preset desk positions [col, row] on the 20×15 map
export const DESK_POSITIONS: [number, number][] = [
  [2, 2],  [5, 2],  [8, 2],  [11, 2], [14, 2], [17, 2],
  [2, 4],  [5, 4],  [8, 4],  [11, 4], [14, 4], [17, 4],
]

// Player start position (world pixels — center of tile 10,6)
export const PLAYER_START = {
  x: 10 * TILE_SIZE + TILE_SIZE / 2,
  y: 6 * TILE_SIZE + TILE_SIZE / 2,
}

export const PLAYER_SPEED = 3       // pixels per ticker tick
export const PLAYER_HALF = 14       // collision half-size (px)
export const PROXIMITY_TILES = 2    // Manhattan tile distance for chat prompt
