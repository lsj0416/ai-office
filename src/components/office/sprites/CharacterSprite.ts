/**
 * CharacterSprite — 교체 가능한 캐릭터 스프라이트 인터페이스
 *
 * 현재 구현: PixelCharacterSprite (픽셀 아트 SD 캐릭터)
 * 좌표계: 발 위치 = origin(0,0), y축 위 = 음수
 */

import type * as PixiNS from 'pixi.js'
import { COLORS, AGENT_ROLE_COLORS, AGENT_ROLE_HAIR_COLORS } from '../constants'
import { createPixelCharacterSprite } from './PixelCharacterSprite'

type PIXI = typeof PixiNS

export type Direction = 'down' | 'up' | 'left' | 'right'

export interface CharacterConfig {
  bodyColor: number
  hairColor: number
  name: string
  isPlayer?: boolean
  phaseOffset?: number
}

// ─── 교체 가능 인터페이스 ─────────────────────────────────────────────────────
export interface CharacterSprite {
  /** Pixi scene graph에 추가할 노드 */
  container: PixiNS.Container
  /** 매 프레임 호출 — 애니메이션 + Y-sort zIndex 갱신 */
  update(totalMs: number, isMoving: boolean, direction: Direction): void
  setPosition(x: number, y: number): void
  getPosition(): { x: number; y: number }
  destroy(): void
}

// ─── 팩토리 (현재 구현: PixelCharacterSprite) ─────────────────────────────────

export function createCharacterSprite(PIXI: PIXI, config: CharacterConfig): CharacterSprite {
  return createPixelCharacterSprite(PIXI, config)
}

// ─── 편의 팩토리 ─────────────────────────────────────────────────────────────

export function createAgentCharacter(
  PIXI: PIXI,
  role: string,
  name: string,
  deskIndex: number
): CharacterSprite {
  return createCharacterSprite(PIXI, {
    bodyColor: AGENT_ROLE_COLORS[role] ?? 0x9b9b9b,
    hairColor: AGENT_ROLE_HAIR_COLORS[role] ?? 0x555555,
    name,
    phaseOffset: deskIndex * 0.5,
  })
}

export function createPlayerCharacter(PIXI: PIXI): CharacterSprite {
  return createCharacterSprite(PIXI, {
    bodyColor: COLORS.player,
    hairColor: COLORS.playerHair,
    name: '나',
    isPlayer: true,
    phaseOffset: 0,
  })
}
