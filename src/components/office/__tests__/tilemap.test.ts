import { describe, expect, it } from 'vitest'
import { getTileType, isTileWalkable, OFFICE_MAP } from '../tilemap'
import { T_FLOOR, T_MEETING, T_BREAK, T_WALL } from '../constants'

describe('office tilemap', () => {
  it('keeps the central divider corridor open wide enough to pass through', () => {
    expect(isTileWalkable(9, 9)).toBe(true)
    expect(isTileWalkable(10, 9)).toBe(true)
    expect(getTileType(8, 9)).toBe(T_WALL)
    expect(getTileType(11, 9)).toBe(T_WALL)
  })

  it('marks room and floor tiles as walkable but walls as blocked', () => {
    expect(getTileType(1, 2)).toBe(T_FLOOR)
    expect(getTileType(1, 11)).toBe(T_MEETING)
    expect(getTileType(12, 11)).toBe(T_BREAK)
    expect(isTileWalkable(1, 2)).toBe(true)
    expect(isTileWalkable(1, 11)).toBe(true)
    expect(isTileWalkable(12, 11)).toBe(true)
    expect(isTileWalkable(0, 10)).toBe(false)
    expect(OFFICE_MAP[10]?.length).toBe(20)
  })
})
