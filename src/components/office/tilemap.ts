import { T_FLOOR as F, T_WALL as W, T_DESK as D, T_MEETING as M, T_BREAK as B } from './constants'
import { WALKABLE_TILES } from './constants'

// 20×15 office map
// Row 0-1    : top boundary
// Row 2,4    : desk rows (main work area)
// Row 3,5-7  : walkable corridors
// Row 8      : horizontal divider wall (cols 9-10 = corridor opening)
// Row 9-12   : Meeting room (cols 1-8) | Corridor (cols 9-10) | Break room (cols 11-18)
// Row 13     : bottom divider wall (cols 9-10 = corridor opening)
// Row 14     : bottom boundary
export const OFFICE_MAP: number[][] = [
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W], // row 0
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W], // row 1
  [W,F,D,F,F,D,F,F,D,F,F,D,F,F,D,F,F,D,F,W], // row 2 (desks)
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W], // row 3
  [W,F,D,F,F,D,F,F,D,F,F,D,F,F,D,F,F,D,F,W], // row 4 (desks)
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W], // row 5
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W], // row 6
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W], // row 7
  [W,W,W,W,W,W,W,W,W,F,F,W,W,W,W,W,W,W,W,W], // row 8 (divider, corridor at 9-10)
  [W,M,M,M,M,M,M,M,M,F,F,B,B,B,B,B,B,B,B,W], // row 9
  [W,M,M,M,M,M,M,M,M,F,F,B,B,B,B,B,B,B,B,W], // row 10
  [W,M,M,M,M,M,M,M,M,F,F,B,B,B,B,B,B,B,B,W], // row 11
  [W,M,M,M,M,M,M,M,M,F,F,B,B,B,B,B,B,B,B,W], // row 12
  [W,W,W,W,W,W,W,W,W,F,F,W,W,W,W,W,W,W,W,W], // row 13 (divider, corridor at 9-10)
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W], // row 14
]

export function isTileWalkable(col: number, row: number): boolean {
  const mapRow = OFFICE_MAP[row]
  if (!mapRow) return false
  if (col < 0 || col >= mapRow.length) return false
  const tile = mapRow[col]
  return tile !== undefined && WALKABLE_TILES.has(tile)
}

export function getTileType(col: number, row: number): number {
  const mapRow = OFFICE_MAP[row]
  if (!mapRow) return -1
  return mapRow[col] ?? -1
}
