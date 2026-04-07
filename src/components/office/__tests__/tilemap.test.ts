import { describe, expect, it } from 'vitest'
import { getTileType, isTileWalkable, OFFICE_MAP } from '../tilemap'
import { MAP_COLS, MAP_ROWS, T_FLOOR, T_MEETING, T_BREAK, T_WALL } from '../constants'

describe('office tilemap', () => {
  it('keeps the central corridor open while moving the room boundary upward', () => {
    expect(isTileWalkable(12, 10)).toBe(true)
    expect(isTileWalkable(15, 11)).toBe(true)
    expect(getTileType(11, 10)).toBe(T_WALL)
    expect(getTileType(16, 11)).toBe(T_WALL)
  })

  it('marks room and floor tiles as walkable but walls as blocked', () => {
    expect(getTileType(1, 2)).toBe(T_FLOOR)
    expect(getTileType(1, 11)).toBe(T_MEETING)
    expect(getTileType(17, 11)).toBe(T_BREAK)
    expect(isTileWalkable(1, 2)).toBe(true)
    expect(isTileWalkable(1, 11)).toBe(true)
    expect(isTileWalkable(17, 11)).toBe(true)
    expect(isTileWalkable(0, 10)).toBe(false)
    expect(OFFICE_MAP).toHaveLength(MAP_ROWS)
    expect(OFFICE_MAP[10]?.length).toBe(MAP_COLS)
  })
})
