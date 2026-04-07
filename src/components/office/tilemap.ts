import { T_FLOOR as F, T_WALL as W, T_DESK as D, T_MEETING as M, T_BREAK as B } from './constants'
import { WALKABLE_TILES } from './constants'

// 28×18 office map
// Row 0      : top boundary
// Row 1-2    : branding wall / lobby strip
// Row 3-9    : expanded central work bay with desk clusters
// Row 10     : upper wall for meeting room / pantry, corridor opening in the middle
// Row 11-16  : meeting room (left) | corridor (center) | pantry lounge (right)
// Row 17     : bottom boundary
export const OFFICE_MAP: number[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 0
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 1
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 2
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 3
  [W, F, F, F, D, F, F, F, D, F, F, F, F, F, F, F, F, D, F, F, F, D, F, F, F, F, F, W], // row 4
  [W, F, F, F, D, F, F, F, D, F, F, F, F, F, F, F, F, D, F, F, F, D, F, F, F, F, F, W], // row 5
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 6
  [W, F, F, F, D, F, F, F, D, F, F, F, F, F, F, F, F, D, F, F, F, D, F, F, F, F, F, W], // row 7
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 8
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W], // row 9
  [W, W, W, W, W, W, W, W, W, W, W, W, F, F, F, F, W, W, W, W, W, W, W, W, W, W, W, W], // row 10
  [W, W, W, W, W, W, W, W, W, W, W, W, F, F, F, F, W, W, W, W, W, W, W, W, W, W, W, W], // row 11
  [W, M, M, M, M, M, M, M, M, M, M, M, F, F, F, F, B, B, B, B, B, B, B, B, B, B, B, W], // row 12
  [W, M, M, M, M, M, M, M, M, M, M, M, F, F, F, F, B, B, B, B, B, B, B, B, B, B, B, W], // row 13
  [W, M, M, M, M, M, M, M, M, M, M, W, F, F, F, F, W, B, B, B, B, B, B, B, B, B, B, W], // row 14
  [W, M, M, M, M, M, M, M, M, M, M, W, F, F, F, F, W, B, B, B, B, B, B, B, B, B, B, W], // row 15
  [W, M, M, M, M, M, M, M, M, M, M, W, F, F, F, F, W, B, B, B, B, B, B, B, B, B, B, W], // row 16
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // row 17
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
