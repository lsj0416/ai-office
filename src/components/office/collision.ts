import type { OfficeBlockedTile, OfficeCollisionBox, OfficeProp, OfficePropPlacement } from '@/types/office'
import { TILE_SIZE } from './constants'

export interface WorldCollisionBox {
  left: number
  top: number
  right: number
  bottom: number
}

export interface OfficeCollisionMap {
  boxes: WorldCollisionBox[]
  blockedTiles: Set<string>
}

function toTileKey(col: number, row: number): string {
  return `${col},${row}`
}

function getPlacementOriginTile(placement: OfficePropPlacement): OfficeBlockedTile {
  return {
    col: Math.floor(placement.col),
    row: Math.floor(placement.row),
  }
}

function getBaseCollisionBox(placement: OfficePropPlacement): { x: number; y: number } {
  if (placement.kind === 'wall') {
    return {
      x: placement.col * TILE_SIZE + (placement.offsetX ?? 0),
      y: placement.row * TILE_SIZE + (placement.offsetY ?? 0),
    }
  }

  return {
    x: placement.col * TILE_SIZE + (placement.offsetX ?? 0),
    y: placement.row * TILE_SIZE + (placement.offsetY ?? 0),
  }
}

function getPlacementFootprintBox(placement: OfficePropPlacement): WorldCollisionBox {
  const base = getBaseCollisionBox(placement)
  return {
    left: base.x,
    top: base.y,
    right: base.x + placement.footprintW * TILE_SIZE,
    bottom: base.y + placement.footprintH * TILE_SIZE,
  }
}

function getResolvedBlockedTiles(prop: OfficeProp): OfficeBlockedTile[] {
  if (!prop.blocksMovement || !prop.blockedTiles?.length) {
    return []
  }

  const origin = getPlacementOriginTile(prop.placement)
  return prop.blockedTiles.map(({ col, row }) => ({
    col: origin.col + col,
    row: origin.row + row,
  }))
}

function getResolvedCollisionBoxes(prop: OfficeProp, blockedTiles: OfficeBlockedTile[]): WorldCollisionBox[] {
  if (!prop.blocksMovement) {
    return []
  }

  if (prop.collisionBoxes?.length) {
    const base = getBaseCollisionBox(prop.placement)
    return prop.collisionBoxes.map((box: OfficeCollisionBox) => ({
      left: base.x + box.offsetX,
      top: base.y + box.offsetY,
      right: base.x + box.offsetX + box.width,
      bottom: base.y + box.offsetY + box.height,
    }))
  }

  if (blockedTiles.length > 0) {
    return blockedTiles.map(({ col, row }) => ({
      left: col * TILE_SIZE,
      top: row * TILE_SIZE,
      right: (col + 1) * TILE_SIZE,
      bottom: (row + 1) * TILE_SIZE,
    }))
  }

  return [getPlacementFootprintBox(prop.placement)]
}

export function buildOfficeCollisionMap(props: OfficeProp[]): OfficeCollisionMap {
  const blockedTiles = new Set<string>()
  const boxes: WorldCollisionBox[] = []

  for (const prop of props) {
    const resolvedBlockedTiles = getResolvedBlockedTiles(prop)
    for (const tile of resolvedBlockedTiles) {
      blockedTiles.add(toTileKey(tile.col, tile.row))
    }
    boxes.push(...getResolvedCollisionBoxes(prop, resolvedBlockedTiles))
  }

  return { boxes, blockedTiles }
}

export function intersectsBlockingProps(
  collisionMap: OfficeCollisionMap,
  centerX: number,
  centerY: number,
  halfSize: number
): boolean {
  const left = centerX - halfSize
  const right = centerX + halfSize
  const top = centerY - halfSize
  const bottom = centerY + halfSize

  return collisionMap.boxes.some(
    (box) => left < box.right && right > box.left && top < box.bottom && bottom > box.top
  )
}

export function isBlockedByFurniture(
  collisionMap: OfficeCollisionMap,
  col: number,
  row: number
): boolean {
  return collisionMap.blockedTiles.has(toTileKey(col, row))
}

export function createOfficeWalkability(
  collisionMap: OfficeCollisionMap,
  isBaseWalkable: (col: number, row: number) => boolean
): (col: number, row: number) => boolean {
  return (col: number, row: number) =>
    isBaseWalkable(col, row) && !isBlockedByFurniture(collisionMap, col, row)
}
