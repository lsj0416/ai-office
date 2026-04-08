'use client'

import { useEffect, useRef, useState } from 'react'
import type * as PixiNS from 'pixi.js'
import type {
  OfficeAgentViewModel,
  NearbyAgent,
  OfficeMeetingSession,
  OfficeVisualState,
  OfficeZoneId,
  TilePos,
} from '@/types/office'
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  T_FLOOR,
  T_MEETING,
  T_BREAK,
  T_WALL,
  COLORS,
  DESK_SCENE_CONFIGS,
  type DeskFacing,
  DESK_POSITIONS,
  PLAYER_START,
  PLAYER_SPEED,
  PLAYER_HALF,
  PROXIMITY_RADIUS,
  TILE_TEXTURE_SCALE,
} from '../constants'
import { OFFICE_LABELS, OFFICE_PROPS } from '../manifest'
import { bfsPath } from '../pathfinding/bfs'
import { resolvePropPlacement } from '../placement'
import { OFFICE_THEME } from '../theme'
import { OFFICE_MAP, getTileType, isTileWalkable } from '../tilemap'

type PIXI = typeof PixiNS
type Direction = 'down' | 'up' | 'left' | 'right'

const CHAR_FRAME_W = 16
const CHAR_FRAME_H = 32
const CHAR_FRAMES_PER_ROW = 7
const CHARACTER_SCALE = 3
const TILE_SCALE = TILE_TEXTURE_SCALE
const CAMERA_LERP = 0.12
const AGENT_MEETING_SPEED = 1.35
const AGENT_ARRIVAL_THRESHOLD = 5

interface UsePixiOfficeOptions {
  containerRef: React.RefObject<HTMLDivElement>
  agents: OfficeAgentViewModel[]
  meetingSession: OfficeMeetingSession | null
  selectedAgentId: string | null
  onAgentSelect: (agent: OfficeAgentViewModel) => void
  onMeetingParticipantsArrived: (sessionId: string) => void
  isMobile: boolean
}

interface UsePixiOfficeReturn {
  nearbyAgent: NearbyAgent | null
  activeZone: OfficeZoneId
}

interface Waypoint {
  x: number
  y: number
}

interface CharacterNode {
  agent: OfficeAgentViewModel | null
  container: PixiNS.Container
  sprite: PixiNS.Sprite
  shadow: PixiNS.Graphics
  bubble: PixiNS.Container
  bubbleText: PixiNS.Text
  label: PixiNS.Container
  frames: Record<'down' | 'up' | 'right', PixiNS.Texture[]>
  direction: Direction
  currentFrame: number
  worldX: number
  worldY: number
  preferredDirection: Direction
  meetingPath: Waypoint[]
  meetingSessionId: string | null
  meetingArrived: boolean
}

const DESK_COLLISION_OFFSET_X = 10
const DESK_COLLISION_WIDTH = TILE_SIZE * 3 - 16
const DESK_COLLISION_OFFSET_Y = 40
const DESK_COLLISION_HEIGHT = TILE_SIZE + 14

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toFloorTile(worldX: number, worldY: number): TilePos {
  return {
    col: Math.floor(worldX / TILE_SIZE),
    row: Math.floor(worldY / TILE_SIZE),
  }
}

function intersectsDeskCollision(nx: number, ny: number, half: number) {
  const left = nx - half
  const right = nx + half
  const top = ny - half
  const bottom = ny + half

  return DESK_POSITIONS.some(([deskCol, deskRow]) => {
    const deskLeft = deskCol * TILE_SIZE + DESK_COLLISION_OFFSET_X
    const deskRight = deskLeft + DESK_COLLISION_WIDTH
    const deskTop = deskRow * TILE_SIZE + DESK_COLLISION_OFFSET_Y
    const deskBottom = deskTop + DESK_COLLISION_HEIGHT

    return left < deskRight && right > deskLeft && top < deskBottom && bottom > deskTop
  })
}

function isWallBlocked(worldX: number, worldY: number) {
  const col = Math.floor(worldX / TILE_SIZE)
  const row = Math.floor(worldY / TILE_SIZE)

  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
    return true
  }

  return getTileType(col, row) === T_WALL
}

function canMoveTo(nx: number, ny: number): boolean {
  const h = PLAYER_HALF
  return (
    !isWallBlocked(nx - h, ny - h) &&
    !isWallBlocked(nx + h, ny - h) &&
    !isWallBlocked(nx - h, ny + h) &&
    !isWallBlocked(nx + h, ny + h) &&
    !intersectsDeskCollision(nx, ny, h)
  )
}

function resolveZone(worldX: number, worldY: number): OfficeZoneId {
  const row = Math.floor(worldY / TILE_SIZE)
  const col = Math.floor(worldX / TILE_SIZE)

  if (row <= 2) return 'branding'
  const tileType = getTileType(col, row)
  if (tileType === T_MEETING) return 'meeting'
  if (tileType === T_BREAK) return 'lounge'
  return 'workbay'
}

function tileWaypoint(col: number, row: number): Waypoint {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE - 8,
  }
}

function findNearestWalkableTile(worldX: number, worldY: number): TilePos | null {
  const origin = toFloorTile(worldX, worldY)

  for (let radius = 0; radius <= 3; radius++) {
    for (let row = origin.row - radius; row <= origin.row + radius; row++) {
      for (let col = origin.col - radius; col <= origin.col + radius; col++) {
        if (isTileWalkable(col, row)) {
          return { col, row }
        }
      }
    }
  }

  return null
}

function buildMeetingPath(fromWorldX: number, fromWorldY: number, destination: TilePos): Waypoint[] {
  const startTile = findNearestWalkableTile(fromWorldX, fromWorldY)
  const destinationWaypoint = tileWaypoint(destination.col, destination.row)

  if (!startTile) {
    return [destinationWaypoint]
  }

  const startWaypoint = tileWaypoint(startTile.col, startTile.row)
  const travelPath = bfsPath(startTile, destination, isTileWalkable).map((tile) =>
    tileWaypoint(tile.col, tile.row)
  )

  const firstTravelWaypoint = travelPath[0]
  const deduplicatedTravelPath =
    firstTravelWaypoint?.x === startWaypoint.x && firstTravelWaypoint?.y === startWaypoint.y
      ? travelPath.slice(1)
      : travelPath

  return [startWaypoint, ...deduplicatedTravelPath]
}

function tickNodeMovement(node: CharacterNode, deltaMs: number): boolean {
  const target = node.meetingPath[0]
  if (!target) return false

  const dx = target.x - node.worldX
  const dy = target.y - node.worldY
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance <= AGENT_ARRIVAL_THRESHOLD) {
    node.worldX = target.x
    node.worldY = target.y
    node.meetingPath = node.meetingPath.slice(1)
    return node.meetingPath.length > 0
  }

  const step = Math.min(AGENT_MEETING_SPEED * (deltaMs / 16.67), distance)
  node.worldX += (dx / distance) * step
  node.worldY += (dy / distance) * step

  if (Math.abs(dx) >= Math.abs(dy)) {
    node.direction = dx > 0 ? 'right' : 'left'
  } else {
    node.direction = dy > 0 ? 'down' : 'up'
  }

  return true
}

function resetNodeToDesk(node: CharacterNode) {
  if (!node.agent) return
  const deskPosition = getAgentWorldPosition(node.agent.deskIndex)
  node.worldX = deskPosition.x
  node.worldY = deskPosition.y
  node.meetingPath = []
  node.meetingSessionId = null
  node.meetingArrived = false
  node.direction = node.preferredDirection
}

function resolveMeetingDirection(row: number): Direction {
  return row >= 15 ? 'up' : 'down'
}

function createNameplate(PIXI: PIXI, text: string) {
  const labelText = new PIXI.Text(text, {
    fontFamily: 'FS Pixel Sans',
    fontSize: 8,
    fill: OFFICE_THEME.shell.text,
  })
  labelText.anchor.set(0.5, 0)
  labelText.y = 2

  const width = Math.max(30, labelText.width + 10)
  const bg = new PIXI.Graphics()
  bg.beginFill(COLORS.nameplateBackground, 0.92)
  bg.drawRoundedRect(-width / 2, 0, width, labelText.height + 5, 4)
  bg.endFill()

  const container = new PIXI.Container()
  container.y = -92
  container.addChild(bg)
  container.addChild(labelText)
  return container
}

function createBubble(PIXI: PIXI, text: string) {
  const root = new PIXI.Container()
  root.y = -106

  const bg = new PIXI.Graphics()
  bg.beginFill(COLORS.bubbleBg, 0.94)
  bg.drawRoundedRect(-18, -16, 36, 18, 5)
  bg.endFill()
  bg.beginFill(COLORS.bubbleBg, 0.94)
  bg.moveTo(-4, 2)
  bg.lineTo(0, 8)
  bg.lineTo(4, 2)
  bg.closePath()
  bg.endFill()

  const label = new PIXI.Text(text, {
    fontFamily: 'FS Pixel Sans',
    fontSize: 8,
    fill: COLORS.bubbleText,
  })
  label.anchor.set(0.5)
  label.y = -7

  root.addChild(bg)
  root.addChild(label)

  return { root, label }
}

function sliceCharacterFrames(PIXI: PIXI, texture: PixiNS.Texture) {
  const rows: Record<'down' | 'up' | 'right', number> = { down: 0, up: 1, right: 2 }
  return {
    down: Array.from({ length: CHAR_FRAMES_PER_ROW }, (_, frame) =>
      new PIXI.Texture(
        texture.baseTexture,
        new PIXI.Rectangle(frame * CHAR_FRAME_W, rows.down * CHAR_FRAME_H, CHAR_FRAME_W, CHAR_FRAME_H)
      )
    ),
    up: Array.from({ length: CHAR_FRAMES_PER_ROW }, (_, frame) =>
      new PIXI.Texture(
        texture.baseTexture,
        new PIXI.Rectangle(frame * CHAR_FRAME_W, rows.up * CHAR_FRAME_H, CHAR_FRAME_W, CHAR_FRAME_H)
      )
    ),
    right: Array.from({ length: CHAR_FRAMES_PER_ROW }, (_, frame) =>
      new PIXI.Texture(
        texture.baseTexture,
        new PIXI.Rectangle(frame * CHAR_FRAME_W, rows.right * CHAR_FRAME_H, CHAR_FRAME_W, CHAR_FRAME_H)
      )
    ),
  }
}

function setNearestScale(PIXI: PIXI, texture: PixiNS.Texture) {
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
}

function createWorldSprite(
  PIXI: PIXI,
  texture: PixiNS.Texture,
  {
    x,
    y,
    scale = TILE_SCALE,
    anchorX = 0,
    anchorY = 0,
    mirror = false,
    zIndex,
  }: {
    x: number
    y: number
    scale?: number
    anchorX?: number
    anchorY?: number
    mirror?: boolean
    zIndex?: number
  }
) {
  const sprite = new PIXI.Sprite(texture)
  sprite.anchor.set(anchorX, anchorY)
  sprite.scale.set(mirror ? -scale : scale, scale)
  sprite.x = x
  sprite.y = y
  const bottomY = y + texture.height * scale * (1 - anchorY)
  sprite.zIndex = zIndex ?? Math.floor(bottomY)
  sprite.roundPixels = true
  return sprite
}

function toCharacterDirection(facing: DeskFacing): Direction {
  switch (facing) {
    case 'north':
      return 'up'
    case 'east':
      return 'right'
    case 'west':
      return 'left'
    case 'south':
    default:
      return 'down'
  }
}

function getDeskSceneConfig(deskIndex: number) {
  return (
    DESK_SCENE_CONFIGS[deskIndex] ??
    DESK_SCENE_CONFIGS[0] ?? {
      col: 2,
      row: 4,
      pcFacing: 'south',
      pcOffsetX: 48,
      pcOffsetY: 12,
      agentFacing: 'south',
      agentOffsetX: 72,
      agentOffsetY: 81.6,
    }
  )
}

function getAgentWorldPosition(deskIndex: number) {
  const layout = getDeskSceneConfig(deskIndex)
  return {
    x: layout.col * TILE_SIZE + layout.agentOffsetX,
    y: layout.row * TILE_SIZE + layout.agentOffsetY,
  }
}

function drawWallTile(graphics: PixiNS.Graphics, col: number, row: number) {
  const x = col * TILE_SIZE
  const y = row * TILE_SIZE
  const wallHeight = TILE_SIZE
  const trimHeight = 10
  const isWall = (targetCol: number, targetRow: number) => OFFICE_MAP[targetRow]?.[targetCol] === T_WALL

  graphics.beginFill(OFFICE_THEME.world.wallBase)
  graphics.drawRect(x, y, TILE_SIZE, wallHeight)
  graphics.endFill()

  graphics.beginFill(OFFICE_THEME.world.wallTrimLight)
  graphics.drawRect(x, y, TILE_SIZE, trimHeight)
  graphics.endFill()

  graphics.lineStyle(1, OFFICE_THEME.world.wallLine, 0.9)
  graphics.moveTo(x, y)
  graphics.lineTo(x, y + wallHeight)
  if (!isWall(col + 1, row)) {
    graphics.moveTo(x + TILE_SIZE, y)
    graphics.lineTo(x + TILE_SIZE, y + wallHeight)
  }
  if (!isWall(col, row - 1)) {
    graphics.moveTo(x, y)
    graphics.lineTo(x + TILE_SIZE, y)
  }
  if (!isWall(col, row + 1)) {
    graphics.moveTo(x, y + TILE_SIZE)
    graphics.lineTo(x + TILE_SIZE, y + TILE_SIZE)
  }
  graphics.lineStyle(0)
}

function findNearbyAgent(
  playerX: number,
  playerY: number,
  nodes: CharacterNode[]
): NearbyAgent | null {
  let closest: NearbyAgent | null = null

  for (const node of nodes) {
    if (!node.agent) continue
    const dx = node.worldX - playerX
    const dy = node.worldY - playerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > PROXIMITY_RADIUS) continue
    if (!closest || distance < closest.distance) {
      closest = {
        agent: node.agent,
        worldX: node.worldX,
        worldY: node.worldY,
        distance,
      }
    }
  }

  return closest
}

function resolvePcDisplay(
  facing: DeskFacing,
  isTyping: boolean,
  textures: {
    pcOn: [PixiNS.Texture, PixiNS.Texture, PixiNS.Texture]
    pcOff: PixiNS.Texture
    pcSide: PixiNS.Texture
    pcBack: PixiNS.Texture
  }
) {
  switch (facing) {
    case 'north':
      return { texture: textures.pcBack, mirror: false }
    case 'east':
      return { texture: textures.pcSide, mirror: false }
    case 'west':
      return { texture: textures.pcSide, mirror: true }
    case 'south':
    default:
      return { texture: isTyping ? textures.pcOn[0] : textures.pcOff, mirror: false }
  }
}

function resolveChairDisplay(
  facing: DeskFacing,
  textures: {
    chairFront: PixiNS.Texture
    chairSide: PixiNS.Texture
    chairBack: PixiNS.Texture
  }
) {
  switch (facing) {
    case 'north':
      return { texture: textures.chairBack, mirror: false }
    case 'east':
      return { texture: textures.chairSide, mirror: false }
    case 'west':
      return { texture: textures.chairSide, mirror: true }
    case 'south':
    default:
      return { texture: textures.chairFront, mirror: false }
  }
}

function animateCharacter(node: CharacterNode, totalMs: number, isMoving: boolean, direction: Direction) {
  const frames = direction === 'left' ? node.frames.right : node.frames[direction === 'right' ? 'right' : direction]
  const frameIndex = isMoving ? Math.floor(totalMs / 140) % 4 : Math.floor(totalMs / 500) % 2

  if (frameIndex !== node.currentFrame || direction !== node.direction) {
    node.currentFrame = frameIndex
    node.direction = direction
    node.sprite.texture = frames[frameIndex] ?? frames[0] ?? node.sprite.texture
  }

  node.sprite.scale.set(direction === 'left' ? -CHARACTER_SCALE : CHARACTER_SCALE, CHARACTER_SCALE)
  node.container.zIndex = Math.floor(node.worldY)
}

export function usePixiOffice({
  containerRef,
  agents,
  meetingSession,
  selectedAgentId,
  onAgentSelect,
  onMeetingParticipantsArrived,
  isMobile,
}: UsePixiOfficeOptions): UsePixiOfficeReturn {
  const [nearbyAgent, setNearbyAgent] = useState<NearbyAgent | null>(null)
  const [activeZone, setActiveZone] = useState<OfficeZoneId>('workbay')

  const meetingSessionRef = useRef<OfficeMeetingSession | null>(meetingSession)
  const selectedAgentIdRef = useRef<string | null>(selectedAgentId)
  const onAgentSelectRef = useRef(onAgentSelect)
  const onMeetingParticipantsArrivedRef = useRef(onMeetingParticipantsArrived)
  const nearbyAgentIdRef = useRef<string | null>(null)
  const activeZoneRef = useRef<OfficeZoneId>('workbay')

  useEffect(() => {
    meetingSessionRef.current = meetingSession
  }, [meetingSession])

  useEffect(() => {
    selectedAgentIdRef.current = selectedAgentId
  }, [selectedAgentId])

  useEffect(() => {
    onAgentSelectRef.current = onAgentSelect
  }, [onAgentSelect])

  useEffect(() => {
    onMeetingParticipantsArrivedRef.current = onMeetingParticipantsArrived
  }, [onMeetingParticipantsArrived])

  useEffect(() => {
    if (!containerRef.current) return
    const host = containerRef.current

    let destroyed = false
    let resizeObserver: ResizeObserver | null = null
    let app: PixiNS.Application | null = null
    let removeKeyboardListeners = () => {}

    async function init() {
      const PIXI = await import('pixi.js')
      if (destroyed) return

      const assetPaths = [
        OFFICE_THEME.assets.floors.work,
        OFFICE_THEME.assets.floors.meeting,
        OFFICE_THEME.assets.floors.lounge,
        OFFICE_THEME.assets.furniture.deskFront,
        OFFICE_THEME.assets.furniture.chairFront,
        OFFICE_THEME.assets.furniture.chairSide,
        OFFICE_THEME.assets.furniture.chairBack,
        ...OFFICE_THEME.assets.furniture.pcOn,
        OFFICE_THEME.assets.furniture.pcOff,
        OFFICE_THEME.assets.furniture.pcSide,
        OFFICE_THEME.assets.furniture.pcBack,
        OFFICE_THEME.assets.furniture.whiteboard,
        OFFICE_THEME.assets.furniture.bookshelf,
        OFFICE_THEME.assets.furniture.doubleBookshelf,
        OFFICE_THEME.assets.furniture.smallPainting,
        OFFICE_THEME.assets.furniture.largePainting,
        OFFICE_THEME.assets.furniture.hangingPlant,
        OFFICE_THEME.assets.furniture.plant,
        OFFICE_THEME.assets.furniture.largePlant,
        OFFICE_THEME.assets.furniture.sofaFront,
        OFFICE_THEME.assets.furniture.sofaSide,
        OFFICE_THEME.assets.furniture.smallTableFront,
        OFFICE_THEME.assets.furniture.coffeeTable,
        OFFICE_THEME.assets.furniture.coffee,
        OFFICE_THEME.assets.furniture.clock,
        OFFICE_THEME.assets.furniture.bin,
        ...OFFICE_THEME.assets.characters,
      ]

      const textures = await Promise.all(assetPaths.map((path) => PIXI.Assets.load(path)))
      textures.forEach((texture) => setNearestScale(PIXI, texture))

      const [
        floorWork,
        floorMeeting,
        floorLounge,
        deskTexture,
        chairFront,
        chairSide,
        chairBack,
        pcOn1,
        pcOn2,
        pcOn3,
        pcOff,
        pcSide,
        pcBack,
        whiteboard,
        bookshelf,
        doubleBookshelf,
        smallPainting,
        largePainting,
        hangingPlant,
        plant,
        largePlant,
        sofaFront,
        sofaSide,
        smallTableFront,
        coffeeTable,
        coffee,
        clock,
        bin,
        ...characterSheets
      ] = textures

      const furnitureTextures = {
        deskFront: deskTexture,
        chairFront,
        chairSide,
        chairBack,
        whiteboard,
        bookshelf,
        doubleBookshelf,
        smallPainting,
        largePainting,
        hangingPlant,
        plant,
        largePlant,
        sofaFront,
        sofaSide,
        smallTableFront,
        coffeeTable,
        coffee,
        clock,
        bin,
      } as const

      app = new PIXI.Application({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: OFFICE_THEME.world.backdrop,
        antialias: false,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })

      host.innerHTML = ''
      host.appendChild(app.view as HTMLCanvasElement)
      host.classList.add('pixel-canvas')
      ;(app.view as HTMLCanvasElement).style.imageRendering = 'pixelated'

      resizeObserver = new ResizeObserver(() => {
        const width = host.clientWidth
        const height = Math.round(width * (CANVAS_HEIGHT / CANVAS_WIDTH))
        host.style.height = `${height}px`
      })
      resizeObserver.observe(host)
      const initialHeight = Math.round(host.clientWidth * (CANVAS_HEIGHT / CANVAS_WIDTH))
      host.style.height = `${initialHeight}px`

      const vignette = new PIXI.Graphics()
      vignette.beginFill(OFFICE_THEME.world.brandingWall)
      vignette.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      vignette.endFill()
      app.stage.addChild(vignette)

      const worldRoot = new PIXI.Container()
      worldRoot.sortableChildren = false
      app.stage.addChild(worldRoot)

      const tileLayer = new PIXI.Container()
      const wallLayer = new PIXI.Container()
      wallLayer.sortableChildren = true
      const decorLayer = new PIXI.Container()
      decorLayer.sortableChildren = true
      const actorLayer = new PIXI.Container()
      actorLayer.sortableChildren = true
      worldRoot.addChild(tileLayer)
      worldRoot.addChild(wallLayer)
      worldRoot.addChild(decorLayer)
      worldRoot.addChild(actorLayer)

      const grid = new PIXI.Graphics()
      const brandingStrip = new PIXI.Graphics()
      brandingStrip.beginFill(OFFICE_THEME.world.brandingWall, 1)
      brandingStrip.drawRect(TILE_SIZE, TILE_SIZE, WORLD_WIDTH - TILE_SIZE * 2, TILE_SIZE * 2)
      brandingStrip.endFill()
      brandingStrip.beginFill(OFFICE_THEME.world.brandingTrim, 0.75)
      brandingStrip.drawRect(TILE_SIZE, TILE_SIZE * 3 - 10, WORLD_WIDTH - TILE_SIZE * 2, 10)
      brandingStrip.endFill()
      tileLayer.addChild(brandingStrip)

      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          const tile = OFFICE_MAP[row]?.[col] ?? T_FLOOR
          const x = col * TILE_SIZE
          const y = row * TILE_SIZE

          if (tile !== T_WALL) {
            const floorTexture =
              tile === T_MEETING ? floorMeeting : tile === T_BREAK ? floorLounge : floorWork
            const sprite = createWorldSprite(PIXI, floorTexture, { x, y, scale: TILE_SCALE })
            tileLayer.addChild(sprite)

            grid.lineStyle(1, COLORS.floorGrid, 0.18)
            grid.drawRect(x, y, TILE_SIZE, TILE_SIZE)
            grid.lineStyle(0)
          }
        }
      }

      tileLayer.addChild(grid)

      const wallBackdrop = new PIXI.Graphics()
      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          if (OFFICE_MAP[row]?.[col] !== T_WALL) continue
          drawWallTile(wallBackdrop, col, row)
        }
      }
      wallLayer.addChild(wallBackdrop)

      for (const label of OFFICE_LABELS) {
        const text = new PIXI.Text(label.text, {
          fontFamily: 'FS Pixel Sans',
          fontSize: label.tone === 'accent' ? 14 : 10,
          fill: label.tone === 'accent' ? OFFICE_THEME.world.signage : OFFICE_THEME.world.signageMuted,
        })
        text.x = label.col * TILE_SIZE + 6
        text.y = label.row * TILE_SIZE + 6
        decorLayer.addChild(text)
      }

      for (const prop of OFFICE_PROPS) {
        const texture = furnitureTextures[prop.asset]
        const placement = resolvePropPlacement(prop.placement, texture)
        const sprite = createWorldSprite(PIXI, texture, {
          x: placement.x,
          y: placement.y,
          scale: placement.scale,
          anchorX: placement.anchorX,
          anchorY: placement.anchorY,
          mirror: placement.mirror,
          zIndex: placement.zIndex,
        })
        decorLayer.addChild(sprite)
      }

      const selectionRing = new PIXI.Graphics()
      selectionRing.visible = false
      selectionRing.zIndex = 9999
      actorLayer.addChild(selectionRing)

      const playerSheet = characterSheets[0]
      if (!playerSheet) {
        app.destroy(true, { children: true })
        return
      }
      const playerNodeFrames = sliceCharacterFrames(PIXI, playerSheet)
      const playerShadow = new PIXI.Graphics()
      playerShadow.beginFill(OFFICE_THEME.world.shadow, 0.24)
      playerShadow.drawEllipse(0, 0, 16, 6)
      playerShadow.endFill()

      const playerSprite = new PIXI.Sprite(playerNodeFrames.down[0])
      playerSprite.anchor.set(0.5, 1)
      playerSprite.scale.set(CHARACTER_SCALE)
      playerSprite.roundPixels = true

      const playerContainer = new PIXI.Container()
      playerContainer.addChild(playerShadow)
      playerContainer.addChild(playerSprite)
      actorLayer.addChild(playerContainer)

      let playerX = PLAYER_START.x
      let playerY = PLAYER_START.y
      let cameraX = 0
      let cameraY = 0
      const maxCameraX = Math.max(0, WORLD_WIDTH - CANVAS_WIDTH)
      const maxCameraY = Math.max(0, WORLD_HEIGHT - CANVAS_HEIGHT)

      function setCameraPosition(nextX: number, nextY: number) {
        cameraX = clamp(nextX, 0, maxCameraX)
        cameraY = clamp(nextY, 0, maxCameraY)
        worldRoot.x = -Math.round(cameraX)
        worldRoot.y = -Math.round(cameraY)
      }

      function updateCamera(targetX: number, targetY: number, immediate = false) {
        const desiredX = clamp(targetX - CANVAS_WIDTH / 2, 0, maxCameraX)
        const desiredY = clamp(targetY - CANVAS_HEIGHT / 2, 0, maxCameraY)

        if (immediate) {
          setCameraPosition(desiredX, desiredY)
          return
        }

        setCameraPosition(
          cameraX + (desiredX - cameraX) * CAMERA_LERP,
          cameraY + (desiredY - cameraY) * CAMERA_LERP
        )
      }

      const playerNode: CharacterNode = {
        agent: null,
        container: playerContainer,
        sprite: playerSprite,
        shadow: playerShadow,
        bubble: new PIXI.Container(),
        bubbleText: new PIXI.Text(''),
        label: new PIXI.Container(),
        frames: playerNodeFrames,
        direction: 'down',
        currentFrame: 0,
        worldX: playerX,
        worldY: playerY,
        preferredDirection: 'down',
        meetingPath: [],
        meetingSessionId: null,
        meetingArrived: false,
      }
      updateCamera(playerX, playerY, true)

      const agentNodes: CharacterNode[] = agents.map((agent, index) => {
        const layout = getDeskSceneConfig(agent.deskIndex)
        const preferredDirection = toCharacterDirection(layout.agentFacing)
        const characterSheet =
          characterSheets[agent.paletteIndex % characterSheets.length] ??
          characterSheets[index % characterSheets.length] ??
          playerSheet
        const frames = sliceCharacterFrames(PIXI, characterSheet)
        const shadow = new PIXI.Graphics()
        shadow.beginFill(OFFICE_THEME.world.shadow, 0.18)
        shadow.drawEllipse(0, 0, 14, 5)
        shadow.endFill()

        const sprite = new PIXI.Sprite(frames.down[0])
        sprite.anchor.set(0.5, 1)
        sprite.scale.set(CHARACTER_SCALE)
        sprite.roundPixels = true
        sprite.texture =
          preferredDirection === 'up'
            ? (frames.up[0] ?? frames.down[0] ?? sprite.texture)
            : preferredDirection === 'left' || preferredDirection === 'right'
              ? (frames.right[0] ?? frames.down[0] ?? sprite.texture)
              : (frames.down[0] ?? sprite.texture)

        const { root: bubble, label: bubbleText } = createBubble(
          PIXI,
          OFFICE_THEME.status[agent.visualState].icon.toUpperCase()
        )
        bubble.visible = agent.visualState !== 'idle'

        const label = createNameplate(PIXI, agent.name.slice(0, 8))
        const container = new PIXI.Container()
        const { x, y } = getAgentWorldPosition(agent.deskIndex)
        container.x = x
        container.y = y
        container.eventMode = 'static'
        container.cursor = 'pointer'
        container.hitArea = new PIXI.Rectangle(-24, -98, 48, 110)
        container.addChild(shadow)
        container.addChild(sprite)
        container.addChild(bubble)
        container.addChild(label)
        container.zIndex = Math.floor(y)
        container.on('pointertap', () => onAgentSelectRef.current(agent))
        actorLayer.addChild(container)

        return {
          agent,
          container,
          sprite,
          shadow,
          bubble,
          bubbleText,
          label,
          frames,
          direction: preferredDirection,
          currentFrame: 0,
          worldX: x,
          worldY: y,
          preferredDirection,
          meetingPath: [],
          meetingSessionId: null,
          meetingArrived: false,
        }
      })

      DESK_SCENE_CONFIGS.forEach((layout, deskIndex) => {
        const { col: deskCol, row: deskRow } = layout
        const chairDisplay = resolveChairDisplay(layout.chairFacing, {
          chairFront,
          chairSide,
          chairBack,
        })
        const chairSprite = createWorldSprite(PIXI, chairDisplay.texture, {
          x: deskCol * TILE_SIZE + layout.chairOffsetX,
          y: deskRow * TILE_SIZE + layout.chairOffsetY,
          scale: TILE_SCALE,
          mirror: chairDisplay.mirror,
        })
        const desk = createWorldSprite(PIXI, deskTexture, {
          x: deskCol * TILE_SIZE,
          y: deskRow * TILE_SIZE,
          scale: TILE_SCALE,
          zIndex: deskRow * TILE_SIZE + TILE_SIZE * 1.8,
        })
        const activeAgent = agentNodes.find((node) => node.agent?.deskIndex === deskIndex)
        const pcDisplay = resolvePcDisplay(layout.pcFacing, activeAgent?.agent?.visualState === 'typing', {
          pcOn: [pcOn1, pcOn2, pcOn3],
          pcOff,
          pcSide,
          pcBack,
        })

        const pcSprite = createWorldSprite(PIXI, pcDisplay.texture, {
          x: deskCol * TILE_SIZE + layout.pcOffsetX,
          y: deskRow * TILE_SIZE + layout.pcOffsetY,
          scale: TILE_SCALE,
          mirror: pcDisplay.mirror,
          zIndex: desk.zIndex + 1,
        })

        actorLayer.addChild(chairSprite)
        actorLayer.addChild(desk)
        actorLayer.addChild(pcSprite)
      })

      const keys = new Set<string>()
      function onKeyDown(event: KeyboardEvent) {
        keys.add(event.code)
      }
      function onKeyUp(event: KeyboardEvent) {
        keys.delete(event.code)
      }

      if (!isMobile) {
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        removeKeyboardListeners = () => {
          window.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('keyup', onKeyUp)
        }
      }

      const pixiApp = app
      let lastArrivedSessionId: string | null = null

      pixiApp.ticker.add(() => {
        const totalMs = pixiApp.ticker.lastTime
        const deltaMs = pixiApp.ticker.deltaMS
        const activeMeetingSession = meetingSessionRef.current
        const activeParticipantIds = new Set(activeMeetingSession?.participantIds ?? [])

        const up = keys.has('KeyW') || keys.has('ArrowUp')
        const down = keys.has('KeyS') || keys.has('ArrowDown')
        const left = keys.has('KeyA') || keys.has('ArrowLeft')
        const right = keys.has('KeyD') || keys.has('ArrowRight')

        let dx = (right ? 1 : 0) - (left ? 1 : 0)
        let dy = (down ? 1 : 0) - (up ? 1 : 0)
        const isMoving = !isMobile && (dx !== 0 || dy !== 0)

        if (dx !== 0 && dy !== 0) {
          const norm = Math.sqrt(dx * dx + dy * dy)
          dx /= norm
          dy /= norm
        }

        let direction: Direction = 'down'
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) direction = dx > 0 ? 'right' : 'left'
        else if (dy !== 0) direction = dy > 0 ? 'down' : 'up'

        if (isMoving) {
          const speed = PLAYER_SPEED * (deltaMs / 16.67)
          const nextX = playerX + dx * speed
          const nextY = playerY + dy * speed

          if (canMoveTo(nextX, playerY)) playerX = nextX
          if (canMoveTo(playerX, nextY)) playerY = nextY
        }

        playerContainer.x = playerX
        playerContainer.y = playerY
        playerContainer.zIndex = Math.floor(playerY)
        playerNode.worldX = playerX
        playerNode.worldY = playerY
        animateCharacter(playerNode, totalMs, isMoving, direction)

        for (const node of agentNodes) {
          const { agent } = node
          if (!agent) continue

          const isMeetingParticipant = activeParticipantIds.has(agent.id)
          const meetingSeat = isMeetingParticipant
            ? activeMeetingSession?.seatAssignments[agent.id]
            : undefined

          if (
            activeMeetingSession &&
            isMeetingParticipant &&
            meetingSeat &&
            node.meetingSessionId !== activeMeetingSession.id
          ) {
            node.meetingPath = buildMeetingPath(node.worldX, node.worldY, meetingSeat)
            node.meetingSessionId = activeMeetingSession.id
            node.meetingArrived = false
          } else if (!isMeetingParticipant && node.meetingSessionId) {
            resetNodeToDesk(node)
          }

          const isNodeMoving = tickNodeMovement(node, deltaMs)
          if (isMeetingParticipant && meetingSeat && !isNodeMoving && node.meetingPath.length === 0) {
            node.meetingArrived = true
            node.direction = resolveMeetingDirection(meetingSeat.row)
          }

          node.container.x = node.worldX
          node.container.y = node.worldY

          const displayVisualState: OfficeVisualState = isMeetingParticipant
            ? 'meeting'
            : agent.visualState
          const bob =
            displayVisualState === 'typing' || isNodeMoving
              ? 0
              : Math.sin(totalMs * 0.002 + node.worldX * 0.01) * 2
          node.sprite.y = bob
          node.label.alpha = selectedAgentIdRef.current === agent.id ? 1 : 0.72
          node.bubble.visible = selectedAgentIdRef.current === agent.id || displayVisualState !== 'idle'
          node.bubbleText.text = OFFICE_THEME.status[displayVisualState].icon.toUpperCase()

          const visualDirection = isNodeMoving ? node.direction : isMeetingParticipant ? node.direction : node.preferredDirection
          const movingFrames = isNodeMoving || displayVisualState === 'typing'
          animateCharacter(node, totalMs + node.worldX, movingFrames, visualDirection)
        }

        if (
          activeMeetingSession &&
          activeParticipantIds.size > 0 &&
          Array.from(activeParticipantIds).every((participantId) =>
            agentNodes.some(
              (node) =>
                node.agent?.id === participantId &&
                node.meetingSessionId === activeMeetingSession.id &&
                node.meetingArrived
            )
          )
        ) {
          if (lastArrivedSessionId !== activeMeetingSession.id) {
            lastArrivedSessionId = activeMeetingSession.id
            onMeetingParticipantsArrivedRef.current(activeMeetingSession.id)
          }
        } else if (!activeMeetingSession) {
          lastArrivedSessionId = null
        }

        const zone = resolveZone(playerX, playerY)
        if (zone !== activeZoneRef.current) {
          activeZoneRef.current = zone
          setActiveZone(zone)
        }

        const nearby = isMobile ? null : findNearbyAgent(playerX, playerY, agentNodes)
        const nextNearbyId = nearby?.agent.id ?? null
        if (nextNearbyId !== nearbyAgentIdRef.current) {
          nearbyAgentIdRef.current = nextNearbyId
          setNearbyAgent(nearby)
        }

        const highlighted =
          agentNodes.find((node) => node.agent?.id === selectedAgentIdRef.current) ??
          agentNodes.find((node) => node.agent?.id === nearby?.agent.id)

        const cameraTarget = isMobile
          ? highlighted
            ? { x: highlighted.worldX, y: highlighted.worldY - TILE_SIZE * 2 }
            : { x: PLAYER_START.x, y: PLAYER_START.y - TILE_SIZE }
          : { x: playerX, y: playerY - TILE_SIZE * 1.5 }

        updateCamera(cameraTarget.x, cameraTarget.y)

        if (highlighted?.agent) {
          selectionRing.visible = true
          selectionRing.clear()
          selectionRing.lineStyle(
            2,
            selectedAgentIdRef.current ? COLORS.selectedRing : COLORS.proximityRing,
            0.95
          )
          selectionRing.drawEllipse(0, 0, 22, 10)
          selectionRing.x = highlighted.worldX
          selectionRing.y = highlighted.worldY - 2
        } else {
          selectionRing.visible = false
        }
      })

      if (destroyed) {
        removeKeyboardListeners()
        app.destroy(true, { children: true })
      }
    }

    void init()

    return () => {
      destroyed = true
      removeKeyboardListeners()
      resizeObserver?.disconnect()
      host.classList.remove('pixel-canvas')
      app?.destroy(true, { children: true })
      host.replaceChildren()
      nearbyAgentIdRef.current = null
      setNearbyAgent(null)
    }
  }, [agents, containerRef, isMobile])

  return { nearbyAgent, activeZone }
}
