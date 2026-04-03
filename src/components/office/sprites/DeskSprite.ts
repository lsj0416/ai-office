/**
 * DeskSprite — 3D 느낌 책상 팩토리 (Pixi.js Graphics 기반)
 *
 * 위면(top face) + 앞면(front face) + 모니터 + 키보드로 구성.
 * zIndex = worldY + 38 (앞면 하단 Y) → Y-sort에 사용.
 */

import type * as PixiNS from 'pixi.js'
import { TILE_SIZE, COLORS, DESK_3D } from '../constants'

type PIXI = typeof PixiNS

export interface DeskConfig {
  worldX: number
  worldY: number
}

export interface DeskSprite {
  container: PixiNS.Container
  /** Y-sort zIndex 기준값 (앞면 하단 Y) */
  readonly bottomY: number
}

export function createDeskSprite(PIXI: PIXI, config: DeskConfig): DeskSprite {
  const { worldX, worldY } = config

  const root = new PIXI.Container()
  root.x = worldX
  root.y = worldY

  const tileW = TILE_SIZE
  const tileH = TILE_SIZE
  const insetX = 4
  const topW = tileW - insetX * 2   // 40px

  // ── 1. 바닥 (타일 전체 floor 색) ─────────────────────────────────────────
  const floor = new PIXI.Graphics()
  floor.beginFill(COLORS.floor)
  floor.drawRect(0, 0, tileW, tileH)
  floor.endFill()
  root.addChild(floor)

  // ── 2. 위면 (top face) ────────────────────────────────────────────────────
  const topY = DESK_3D.TOP_Y   // 8
  const top = new PIXI.Graphics()
  top.beginFill(COLORS.deskTop)
  top.drawRect(insetX, topY, topW, DESK_3D.TOP_H)
  top.endFill()
  // 상단 하이라이트 (빛 반사)
  top.beginFill(0xffffff, 0.18)
  top.drawRect(insetX, topY, topW, 4)
  top.endFill()
  // 좌측 그림자 edge
  top.beginFill(0x000000, 0.06)
  top.drawRect(insetX, topY, 3, DESK_3D.TOP_H)
  top.endFill()
  root.addChild(top)

  // ── 3. 앞면 (front face) ──────────────────────────────────────────────────
  const frontY = topY + DESK_3D.TOP_H   // 28
  const front = new PIXI.Graphics()
  front.beginFill(COLORS.deskFront)
  front.drawRect(insetX, frontY, topW, DESK_3D.FRONT_H)
  front.endFill()
  // 앞면 하단 경계선
  front.lineStyle(1, COLORS.deskLeg, 0.5)
  front.moveTo(insetX, frontY + DESK_3D.FRONT_H)
  front.lineTo(insetX + topW, frontY + DESK_3D.FRONT_H)
  front.lineStyle(0)
  root.addChild(front)

  // ── 4. 다리 ───────────────────────────────────────────────────────────────
  const legY = frontY + DESK_3D.FRONT_H   // 38
  const legs = new PIXI.Graphics()
  legs.beginFill(COLORS.deskLeg)
  // 왼쪽 다리
  legs.drawRect(insetX + 2, legY, DESK_3D.LEG_W, DESK_3D.LEG_H)
  // 오른쪽 다리
  legs.drawRect(insetX + topW - DESK_3D.LEG_W - 2, legY, DESK_3D.LEG_W, DESK_3D.LEG_H)
  legs.endFill()
  root.addChild(legs)

  // ── 5. 모니터 ─────────────────────────────────────────────────────────────
  const monX = insetX + (topW - DESK_3D.MONITOR_W) / 2
  const monY = topY + 2
  const monitor = new PIXI.Graphics()
  // 모니터 프레임
  monitor.beginFill(COLORS.monitorFrame)
  monitor.drawRoundedRect(monX, monY, DESK_3D.MONITOR_W, DESK_3D.MONITOR_H, 2)
  monitor.endFill()
  // 스크린
  const si = DESK_3D.MONITOR_INSET
  monitor.beginFill(COLORS.monitorScreen, 0.9)
  monitor.drawRect(monX + si, monY + si, DESK_3D.MONITOR_W - si * 2, DESK_3D.MONITOR_H - si * 2)
  monitor.endFill()
  // 스크린 글로우 (미미한 하이라이트)
  monitor.beginFill(0xffffff, 0.08)
  monitor.drawRect(monX + si, monY + si, DESK_3D.MONITOR_W - si * 2, 3)
  monitor.endFill()
  // 받침대
  monitor.beginFill(COLORS.monitorFrame)
  monitor.drawRect(monX + DESK_3D.MONITOR_W / 2 - 2, monY + DESK_3D.MONITOR_H, 4, 2)
  monitor.endFill()
  root.addChild(monitor)

  // ── 6. 키보드 ─────────────────────────────────────────────────────────────
  const kbX = insetX + (topW - DESK_3D.KB_W) / 2
  const kbY = topY + DESK_3D.TOP_H - DESK_3D.KB_H - 2
  const keyboard = new PIXI.Graphics()
  keyboard.beginFill(COLORS.keyboard)
  keyboard.drawRoundedRect(kbX, kbY, DESK_3D.KB_W, DESK_3D.KB_H, 1)
  keyboard.endFill()
  // 키보드 라인 (작은 키 표현)
  keyboard.lineStyle(0.5, 0x999999, 0.6)
  for (let i = 1; i < 3; i++) {
    const lineX = kbX + (DESK_3D.KB_W / 3) * i
    keyboard.moveTo(lineX, kbY + 1)
    keyboard.lineTo(lineX, kbY + DESK_3D.KB_H - 1)
  }
  keyboard.lineStyle(0)
  root.addChild(keyboard)

  // ── Y-sort zIndex ─────────────────────────────────────────────────────────
  // 앞면 하단 Y = worldY + legY = worldY + 38
  const bottomY = worldY + legY
  root.zIndex = Math.floor(bottomY)

  return { container: root, bottomY }
}
