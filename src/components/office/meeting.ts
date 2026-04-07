import type { OfficeMeetingSeatAssignment } from '@/types/office'

export const MEETING_SEAT_TILES: OfficeMeetingSeatAssignment[] = [
  { col: 2, row: 13 },
  { col: 4, row: 13 },
  { col: 6, row: 13 },
  { col: 8, row: 13 },
  { col: 2, row: 15 },
  { col: 4, row: 15 },
  { col: 6, row: 15 },
  { col: 8, row: 15 },
]

export function buildMeetingSeatAssignments(
  participantIds: string[]
): Record<string, OfficeMeetingSeatAssignment> {
  if (participantIds.length === 0) {
    throw new Error('회의 참가자가 필요합니다.')
  }

  if (participantIds.length > MEETING_SEAT_TILES.length) {
    throw new Error(`회의실 좌석은 최대 ${MEETING_SEAT_TILES.length}명까지 지원합니다.`)
  }

  return participantIds.reduce<Record<string, OfficeMeetingSeatAssignment>>((acc, participantId, index) => {
    const seat = MEETING_SEAT_TILES[index]
    if (!seat) return acc
    acc[participantId] = seat
    return acc
  }, {})
}
