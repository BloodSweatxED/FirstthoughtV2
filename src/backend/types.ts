import type { RoomPatch, RoomRecord } from '../domain/rounds'
import type { LearnerLevel, ResponseEntry } from '../domain/types'

export type RoundResponses = {
  /** False until the caller is allowed to see answers. Count is always available. */
  visible: boolean
  count: number
  responses: ResponseEntry[]
}

export type SubmitInput = {
  code: string
  roundId: string
  learnerId: string
  caseId: string
  level: LearnerLevel
  text: string
}

/** Everything the UI needs from storage. Local and Google Sheets implement the same contract. */
export interface Backend {
  kind: 'local' | 'sheets'
  createRoom(input: { label: string; level: LearnerLevel }): Promise<{ room: RoomRecord; hostKey: string }>
  getRoom(code: string): Promise<RoomRecord | null>
  verifyHost(code: string, hostKey: string): Promise<boolean>
  getResponses(input: { code: string; roundId: string; learnerId?: string; hostKey?: string }): Promise<RoundResponses>
  submit(input: SubmitInput): Promise<void>
  updateRoom(input: { code: string; hostKey: string; patch: RoomPatch }): Promise<RoomRecord>
}
