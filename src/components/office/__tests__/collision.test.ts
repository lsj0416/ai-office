import { describe, expect, it } from 'vitest'
import { bfsPath } from '../pathfinding/bfs'
import {
  buildOfficeCollisionMap,
  createOfficeWalkability,
  intersectsBlockingProps,
  isBlockedByFurniture,
} from '../collision'
import { TILE_SIZE } from '../constants'
import { OFFICE_COLLISION_PROPS } from '../layout'
import { isBaseTileWalkable } from '../tilemap'

describe('office collision map', () => {
  const collisionMap = buildOfficeCollisionMap(OFFICE_COLLISION_PROPS)
  const isOfficeTileWalkable = createOfficeWalkability(collisionMap, isBaseTileWalkable)

  it('does not mark wall decor as furniture blockers', () => {
    expect(isBlockedByFurniture(collisionMap, 12, 1)).toBe(false)
    expect(isBlockedByFurniture(collisionMap, 15, 1)).toBe(false)
  })

  it('marks lounge furniture tiles as blocked', () => {
    expect(isBlockedByFurniture(collisionMap, 18, 12)).toBe(true)
    expect(isBlockedByFurniture(collisionMap, 18, 11)).toBe(false)
    expect(isBlockedByFurniture(collisionMap, 23, 12)).toBe(true)
    expect(isBlockedByFurniture(collisionMap, 22, 15)).toBe(true)
  })

  it('uses derived prop collision for workstation desks too', () => {
    expect(intersectsBlockingProps(collisionMap, 4 * TILE_SIZE + 60, 3 * TILE_SIZE + 72, 9)).toBe(true)
    expect(intersectsBlockingProps(collisionMap, 14 * TILE_SIZE + 24, 8 * TILE_SIZE + 24, 9)).toBe(false)
  })

  it('aligns lounge collision with fractional prop placement instead of floored tiles', () => {
    const sofaLeft = 18.7 * TILE_SIZE
    const upperRowCenterY = 11.5 * TILE_SIZE
    const lowerRowCenterY = 12.5 * TILE_SIZE

    expect(intersectsBlockingProps(collisionMap, sofaLeft + 24, upperRowCenterY, 9)).toBe(false)
    expect(intersectsBlockingProps(collisionMap, sofaLeft + 24, lowerRowCenterY, 9)).toBe(true)
  })

  it('keeps bfs routes out of blocked lounge furniture', () => {
    const path = bfsPath({ col: 16, row: 12 }, { col: 20, row: 12 }, isOfficeTileWalkable)

    expect(path.length).toBeGreaterThan(0)
    expect(path).not.toContainEqual({ col: 18, row: 12 })
    expect(path).not.toContainEqual({ col: 19, row: 12 })
  })
})
