/**
 * BFS 패스파인딩 — 4방향 너비 우선 탐색
 * 순수 함수: 외부 상태 없음, isWalkable 콜백으로 타일 접근성 주입
 */

import type { TilePos } from '@/types/office'

const DIRECTIONS: TilePos[] = [
  { col: 0, row: -1 }, // up
  { col: 0, row: 1 }, // down
  { col: -1, row: 0 }, // left
  { col: 1, row: 0 }, // right
]

const MAX_DEPTH = 200 // 탐색 최대 타일 수 (무한 루프 방지)

/**
 * start → goal 까지의 최단 경로를 반환한다.
 * 반환값: start를 제외한 경로 배열 (goal 포함). 경로 없으면 [].
 */
export function bfsPath(
  start: TilePos,
  goal: TilePos,
  isWalkable: (col: number, row: number) => boolean
): TilePos[] {
  if (start.col === goal.col && start.row === goal.row) return []

  const key = (p: TilePos) => `${p.col},${p.row}`

  const visited = new Set<string>([key(start)])
  // queue: [current, path-from-start]
  const queue: Array<[TilePos, TilePos[]]> = [[start, []]]

  while (queue.length > 0) {
    const [current, path] = queue.shift()!
    if (path.length >= MAX_DEPTH) continue

    for (const dir of DIRECTIONS) {
      const next: TilePos = { col: current.col + dir.col, row: current.row + dir.row }
      const k = key(next)
      if (visited.has(k)) continue
      if (!isWalkable(next.col, next.row)) continue

      const newPath = [...path, next]

      if (next.col === goal.col && next.row === goal.row) {
        return newPath
      }

      visited.add(k)
      queue.push([next, newPath])
    }
  }

  return [] // 경로 없음
}
