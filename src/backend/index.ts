import { localBackend } from './local'
import { createSheetsBackend } from './sheets'
import type { Backend } from './types'

const sheetsUrl = import.meta.env.VITE_SHEETS_URL as string | undefined

/** Google Sheets when VITE_SHEETS_URL is set at build time, otherwise this browser only. */
export const backend: Backend = sheetsUrl ? createSheetsBackend(sheetsUrl) : localBackend

export type { Backend } from './types'
