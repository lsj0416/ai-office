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

export const COLORS = {
  floorGrid: 0x314055,
  player: 0x78a5ff,
  playerHair: 0xa5c4ff,
  proximityRing: 0xf8b84e,
  selectedRing: 0x78a5ff,
  bubbleBg: 0x0f172a,
  bubbleText: 0xf8fafc,
  nameplateBackground: 0x111827,
  nameplateText: 0xf8fafc,
  skinTone: 0xffd8a8,
  floorLight: 0xe2ebf7,
  deskTop: 0xb17a45,
  deskFront: 0x8d5f32,
  deskLeg: 0x6c4726,
  monitorFrame: 0x263245,
  monitorScreen: 0x78a5ff,
  keyboard: 0xcbd5e1,
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

export type DeskFacing = 'north' | 'south' | 'east' | 'west'

export interface DeskSceneConfig {
  col: number
  row: number
  chairFacing: DeskFacing
  chairOffsetX: number
  chairOffsetY: number
  pcFacing: DeskFacing
  pcOffsetX: number
  pcOffsetY: number
  agentFacing: DeskFacing
  agentOffsetX: number
  agentOffsetY: number
}

// Tweak per-desk computer/agent facing and offsets here.
export const DESK_SCENE_CONFIGS: DeskSceneConfig[] = [
  { col: 3, row: 2, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 3, row: 3, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 6, row: 2, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 6, row: 3, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 12, row: 2, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 15, row: 2, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 12, row: 3, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 15, row: 3, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 3, row: 7, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 6, row: 7, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 12, row: 7, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 15, row: 7, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
]

// Preset desk positions [col, row] on the 20×15 map
export const DESK_POSITIONS: [number, number][] = DESK_SCENE_CONFIGS.map(
  ({ col, row }) => [col, row] as [number, number]
)

// Player start position (world pixels — center of tile 10,8)
export const PLAYER_START = {
  x: 10 * TILE_SIZE + TILE_SIZE / 2,
  y: 8 * TILE_SIZE + TILE_SIZE / 2,
}

export const PLAYER_SPEED = 3 // pixels per ticker tick
export const PLAYER_HALF = 9 // collision half-size (px)
export const PROXIMITY_TILES = 2
export const PROXIMITY_RADIUS = TILE_SIZE * 1.6
export const CHARACTER_SCALE = 2
export const DESK_SCALE = 3
export const TILE_TEXTURE_SCALE = 3
export const WALL_TEXTURE_SCALE = 3
export const PIXEL_SIZE = 4

// ─── Agent FSM parameters ─────────────────────────────────────────────────────
export const AGENT_FSM = {
  WANDER_INTERVAL_MIN: 8000,   // ms: minimum idle time before wandering
  WANDER_INTERVAL_MAX: 20000,  // ms: maximum idle time before wandering
  PHASE_OFFSET_MS: 1500,       // ms per deskIndex → desynchronises agents
  MOVE_SPEED: 1.5,             // px per ticker tick (slower than player)
  ARRIVAL_THRESHOLD: 5,        // px: distance to consider a waypoint "reached"
} as const

export const DESK_3D = {
  TOP_Y: 8,
  TOP_H: 20,
  FRONT_H: 10,
  LEG_W: 4,
  LEG_H: 6,
  MONITOR_W: 16,
  MONITOR_H: 12,
  MONITOR_INSET: 2,
  KB_W: 14,
  KB_H: 5,
} as const
