'use client'

import { useEffect, useRef, useState } from 'react'
import type { Application, Graphics } from 'pixi.js'
import type { OfficeAgent, NearbyAgent } from '@/types/office'
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT,
  T_FLOOR, T_WALL, T_DESK, T_MEETING, T_BREAK,
  COLORS, AGENT_ROLE_COLORS, DESK_POSITIONS,
  PLAYER_START, PLAYER_SPEED, PLAYER_HALF, PROXIMITY_TILES,
} from '../constants'
import { OFFICE_MAP, isTileWalkable } from '../tilemap'

interface UsePixiOfficeOptions {
  containerRef: React.RefObject<HTMLDivElement>
  agents: OfficeAgent[]
}

interface UsePixiOfficeReturn {
  nearbyAgent: NearbyAgent | null
}

// ─── drawing helpers ──────────────────────────────────────────────────────────

function drawTilemap(gfx: Graphics) {
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tile = OFFICE_MAP[row]?.[col] ?? T_FLOOR
      const x = col * TILE_SIZE
      const y = row * TILE_SIZE

      switch (tile) {
        case T_WALL:
          gfx.beginFill(COLORS.wall)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          // darker top edge for 3-D feel
          gfx.beginFill(COLORS.wallAccent)
          gfx.drawRect(x, y, TILE_SIZE, 4)
          gfx.endFill()
          break

        case T_DESK:
          // floor under desk
          gfx.beginFill(COLORS.floor)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          // desk surface
          gfx.beginFill(COLORS.desk)
          gfx.drawRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 12)
          gfx.endFill()
          // desk top highlight
          gfx.beginFill(COLORS.deskTop)
          gfx.drawRect(x + 4, y + 8, TILE_SIZE - 8, 6)
          gfx.endFill()
          break

        case T_MEETING:
          gfx.beginFill(COLORS.meeting)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break

        case T_BREAK:
          gfx.beginFill(COLORS.breakRoom)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break

        default: // T_FLOOR
          gfx.beginFill(COLORS.floor)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break
      }

      // subtle grid line
      if (tile !== T_WALL) {
        gfx.lineStyle(0.5, COLORS.gridLine, 0.6)
        gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
        gfx.lineStyle(0)
      }
    }
  }
}

function drawRoomLabels(PIXI: typeof import('pixi.js'), container: import('pixi.js').Container) {
  const style = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: 'bold',
    fill: 0x888899,
  })

  const meetingLabel = new PIXI.Text('🤝 회의실', style)
  meetingLabel.x = 1 * TILE_SIZE + 8
  meetingLabel.y = 9 * TILE_SIZE + 8
  container.addChild(meetingLabel)

  const breakLabel = new PIXI.Text('☕ 탕비실', style)
  breakLabel.x = 11 * TILE_SIZE + 8
  breakLabel.y = 9 * TILE_SIZE + 8
  container.addChild(breakLabel)
}

function drawAgent(
  PIXI: typeof import('pixi.js'),
  container: import('pixi.js').Container,
  agent: OfficeAgent,
): Graphics {
  const [col, row] = DESK_POSITIONS[agent.deskIndex] ?? [1, 1]
  const cx = col * TILE_SIZE + TILE_SIZE / 2
  const cy = row * TILE_SIZE + TILE_SIZE / 2

  const color = AGENT_ROLE_COLORS[agent.role] ?? AGENT_ROLE_COLORS.CUSTOM

  const g = new PIXI.Graphics()
  g.beginFill(color)
  g.drawCircle(0, 0, 14)
  g.endFill()
  g.lineStyle(2, 0xffffff, 0.6)
  g.drawCircle(0, 0, 14)
  g.lineStyle(0)
  g.x = cx
  g.y = cy - 8 // sit slightly above desk center

  // name label
  const labelStyle = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: 'bold',
    fill: 0xffffff,
  })
  const label = new PIXI.Text(agent.name.slice(0, 4), labelStyle)
  label.anchor.set(0.5)
  label.y = -24
  g.addChild(label)

  // role initial inside circle
  const initStyle = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: 'bold',
    fill: 0xffffff,
  })
  const init = new PIXI.Text(agent.role[0], initStyle)
  init.anchor.set(0.5, 0.5)
  g.addChild(init)

  container.addChild(g)
  return g
}

function drawPlayer(PIXI: typeof import('pixi.js'), container: import('pixi.js').Container): Graphics {
  const g = new PIXI.Graphics()

  g.beginFill(COLORS.player)
  g.drawCircle(0, 0, 16)
  g.endFill()
  g.lineStyle(2.5, COLORS.playerBorder)
  g.drawCircle(0, 0, 16)
  g.lineStyle(0)

  const style = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: 'bold',
    fill: 0xffffff,
  })
  const label = new PIXI.Text('나', style)
  label.anchor.set(0.5, 0.5)
  g.addChild(label)

  g.x = PLAYER_START.x
  g.y = PLAYER_START.y
  container.addChild(g)
  return g
}

function drawProximityRing(PIXI: typeof import('pixi.js'), container: import('pixi.js').Container): Graphics {
  const ring = new PIXI.Graphics()
  ring.visible = false
  container.addChild(ring)
  return ring
}

// ─── collision ────────────────────────────────────────────────────────────────

function canMoveTo(nx: number, ny: number): boolean {
  const h = PLAYER_HALF
  return (
    isTileWalkable(Math.floor((nx - h) / TILE_SIZE), Math.floor((ny - h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx + h) / TILE_SIZE), Math.floor((ny - h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx - h) / TILE_SIZE), Math.floor((ny + h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx + h) / TILE_SIZE), Math.floor((ny + h) / TILE_SIZE))
  )
}

// ─── proximity ────────────────────────────────────────────────────────────────

function findNearbyAgent(
  playerX: number,
  playerY: number,
  agents: OfficeAgent[],
): NearbyAgent | null {
  const playerCol = Math.floor(playerX / TILE_SIZE)
  const playerRow = Math.floor(playerY / TILE_SIZE)

  for (const agent of agents) {
    const pos = DESK_POSITIONS[agent.deskIndex]
    if (!pos) continue
    const [deskCol, deskRow] = pos
    const dist = Math.abs(deskCol - playerCol) + Math.abs(deskRow - playerRow)
    if (dist <= PROXIMITY_TILES) {
      return { agent, deskCol, deskRow }
    }
  }
  return null
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function usePixiOffice({ containerRef, agents }: UsePixiOfficeOptions): UsePixiOfficeReturn {
  const [nearbyAgent, setNearbyAgent] = useState<NearbyAgent | null>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function init() {
      const PIXI = await import('pixi.js')

      if (destroyed || !containerRef.current) return

      const app = new PIXI.Application({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: COLORS.floor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      appRef.current = app
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      // ── static layer ──────────────────────────────────────────────────────
      const mapGfx = new PIXI.Graphics()
      drawTilemap(mapGfx)
      app.stage.addChild(mapGfx)

      const labelContainer = new PIXI.Container()
      drawRoomLabels(PIXI, labelContainer)
      app.stage.addChild(labelContainer)

      // ── agent layer ───────────────────────────────────────────────────────
      const agentContainer = new PIXI.Container()
      app.stage.addChild(agentContainer)
      agents.forEach((agent) => drawAgent(PIXI, agentContainer, agent))

      // ── player layer ──────────────────────────────────────────────────────
      const playerContainer = new PIXI.Container()
      app.stage.addChild(playerContainer)
      const proximityRing = drawProximityRing(PIXI, playerContainer)
      const player = drawPlayer(PIXI, playerContainer)

      // ── keyboard state ────────────────────────────────────────────────────
      const keys = new Set<string>()

      function onKeyDown(e: KeyboardEvent) {
        keys.add(e.code)
      }
      function onKeyUp(e: KeyboardEvent) {
        keys.delete(e.code)
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      // ── game loop ─────────────────────────────────────────────────────────
      app.ticker.add(() => {
        const up    = keys.has('KeyW') || keys.has('ArrowUp')
        const down  = keys.has('KeyS') || keys.has('ArrowDown')
        const left  = keys.has('KeyA') || keys.has('ArrowLeft')
        const right = keys.has('KeyD') || keys.has('ArrowRight')

        let dx = (right ? 1 : 0) - (left ? 1 : 0)
        let dy = (down  ? 1 : 0) - (up   ? 1 : 0)

        if (dx !== 0 || dy !== 0) {
          // normalise diagonal
          if (dx !== 0 && dy !== 0) {
            dx *= 0.707
            dy *= 0.707
          }
          const nx = player.x + dx * PLAYER_SPEED
          const ny = player.y + dy * PLAYER_SPEED

          if (canMoveTo(nx, player.y)) player.x = nx
          if (canMoveTo(player.x, ny)) player.y = ny
        }

        // proximity check
        const nearby = findNearbyAgent(player.x, player.y, agents)

        if (nearby) {
          proximityRing.visible = true
          proximityRing.clear()
          proximityRing.lineStyle(2, COLORS.proximityRing, 0.8)
          proximityRing.drawCircle(player.x, player.y, 26)
          proximityRing.lineStyle(0)
        } else {
          proximityRing.visible = false
        }

        setNearbyAgent(nearby)
      })
    }

    init()

    return () => {
      destroyed = true
      if (appRef.current) {
        window.removeEventListener('keydown', () => {})
        window.removeEventListener('keyup', () => {})
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
    }
  // agents list changes → re-init (agents added/removed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, agents.length])

  return { nearbyAgent }
}
