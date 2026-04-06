import { T_FLOOR as F, T_WALL as W, T_DESK as D, T_MEETING as M, T_BREAK as B } from './constants'
import { WALKABLE_TILES } from './constants'

// 20×15 office map
// Row 0      : top boundary
// Row 1-2    : branding wall / lobby strip
// Row 3-8    : central work bay with desk clusters
// Row 9      : divider with corridor opening
// Row 10-13  : meeting room (left) | corridor (center) | pantry lounge (right)
// Row 14     : bottom boundary
export const OFFICE_MAP: number[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 0
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 1
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 2
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 3
  [W, F, D, F, F, D, F, F, D, F, F, D, F, F, D, F, F, D, F, W], // row 4
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 5
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 6
  [W, F, F, D, F, F, D, F, F, F, F, F, D, F, F, D, F, F, F, W], // row 7
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 8
  [W, W, W, W, W, W, W, W, W, F, F, W, W, W, W, W, W, W, W, W], // row 9
  [W, W, W, W, W, W, W, W, W, F, F, W, W, W, W, W, W, W, W, W], // row 10
  [W, M, M, M, M, M, M, M, M, F, F, B, B, B, B, B, B, B, B, W], // row 11
  [W, M, M, M, M, M, M, M, M, F, F, B, B, B, B, B, B, B, B, W], // row 12
  [W, M, M, M, M, M, M, M, M, F, F, B, B, B, B, B, B, B, B, W], // row 13
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 14
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
