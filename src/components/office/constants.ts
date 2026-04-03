export const TILE_SIZE = 48
export const MAP_COLS = 20
export const MAP_ROWS = 15
export const CANVAS_WIDTH = TILE_SIZE * MAP_COLS // 960
export const CANVAS_HEIGHT = TILE_SIZE * MAP_ROWS // 720

// Tile type IDs
export const T_FLOOR = 0
export const T_WALL = 1
export const T_DESK = 2
export const T_MEETING = 3
export const T_BREAK = 4

// Walkable tile set (desks block movement)
export const WALKABLE_TILES = new Set([T_FLOOR, T_MEETING, T_BREAK])

// Base colors
export const COLORS = {
  floor: 0xf0efe6,
  wall: 0x3d3d4d,
  wallAccent: 0x2d2d3d,
  desk: 0xc4a572,
  deskTop: 0xd4b882,
  deskFront: 0xa07840,
  deskLeg: 0x8a6530,
  meeting: 0xdce8ff,
  meetingBorder: 0xa8c4ff,
  breakRoom: 0xdcf5dc,
  breakBorder: 0xa8e0a8,
  gridLine: 0xe5e4db,
  player: 0xff6b35,
  playerBorder: 0xcc4a10,
  playerHair: 0xff9900,
  proximityRing: 0xffeb3b,
  labelBg: 0x000000,
  // character
  skinTone: 0xffd8a8,
  eyeColor: 0x222222,
  nameplateBackground: 0x1a1a2e,
  nameplateText: 0xffffff,
  // desk accessories
  monitorFrame: 0x333344,
  monitorScreen: 0x4466aa,
  keyboard: 0xccccdd,
} as const

export const AGENT_ROLE_COLORS: Record<string, number> = {
  PM: 0x4a90d9,
  DEVELOPER: 0x7ed321,
  MARKETER: 0xe040fb,
  DESIGNER: 0xff6090,
  REVIEWER: 0xff9800,
  CUSTOM: 0x9b9b9b,
}

export const AGENT_ROLE_HAIR_COLORS: Record<string, number> = {
  PM: 0x1a5fa0,
  DEVELOPER: 0x3d8b00,
  MARKETER: 0x9b00cc,
  DESIGNER: 0xcc1060,
  REVIEWER: 0xcc6600,
  CUSTOM: 0x555555,
}

// Preset desk positions [col, row] on the 20×15 map
export const DESK_POSITIONS: [number, number][] = [
  [2, 2],
  [5, 2],
  [8, 2],
  [11, 2],
  [14, 2],
  [17, 2],
  [2, 4],
  [5, 4],
  [8, 4],
  [11, 4],
  [14, 4],
  [17, 4],
]

// Player start position (world pixels — center of tile 10,6)
export const PLAYER_START = {
  x: 10 * TILE_SIZE + TILE_SIZE / 2,
  y: 6 * TILE_SIZE + TILE_SIZE / 2,
}

export const PLAYER_SPEED = 3 // pixels per ticker tick
export const PLAYER_HALF = 14 // collision half-size (px)
export const PROXIMITY_TILES = 2 // Manhattan tile distance for chat prompt

// ─── SD Character dimensions (feet = origin, y-up = negative) ────────────────
export const CHAR = {
  // Shadow
  SHADOW_RX: 13,
  SHADOW_RY: 4,
  SHADOW_ALPHA: 0.25,
  SHADOW_Y: 2,
  // Head
  HEAD_R: 13,
  HEAD_CY: -35,
  // Eyes
  EYE_R: 2,
  EYE_CY: -37,
  EYE_OFFSET_X: 5,
  // Body
  BODY_W: 14,
  BODY_H: 16,
  BODY_TOP_Y: -28,
  BODY_RADIUS: 4,
  // Legs
  LEG_W: 4,
  LEG_H: 12,
  LEG_TOP_Y: -12,
  LEG_OFFSET_X: 4,
  // Animation
  IDLE_AMPLITUDE: 2,
  IDLE_SPEED: 0.002,
  WALK_AMPLITUDE: 4,
  WALK_SPEED: 0.010,
  // Nameplate
  NAMEPLATE_Y: 8,
  NAMEPLATE_PAD_X: 6,
  NAMEPLATE_PAD_Y: 2,
  NAMEPLATE_R: 5,
} as const

// ─── Desk 3D dimensions ───────────────────────────────────────────────────────
export const DESK_3D = {
  TOP_Y: 8,       // offset from tile top
  TOP_H: 20,      // top face height
  FRONT_H: 10,    // front face height
  LEG_W: 4,
  LEG_H: 6,
  MONITOR_W: 16,
  MONITOR_H: 12,
  MONITOR_INSET: 2,
  KB_W: 14,
  KB_H: 5,
} as const
