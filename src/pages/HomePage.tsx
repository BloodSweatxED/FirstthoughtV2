import { useState } from 'react'
import { hostPath, studentPath } from '../app/routes'
import { knownHostRooms, saveHostKey } from '../app/storage'
import { backend } from '../backend'
import { DEMO_ROOM } from '../backend/local'
import { levelConfig } from '../data/levels'
import type { LearnerLevel } from '../domain/types'

export function HomePage() {
  const [joinCode, setJoinCode] = useState('')
  const [label, setLabel] = useState('')
  const [level, setLevel] = useState<LearnerLevel>('M1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rooms = knownHostRooms()

  const createRoom = async () => {
    setBusy(true)
    setError(null)
    try {
      const { room, hostKey } = await backend.createRoom({ label, level })
      saveHostKey(room.code, hostKey)
      window.location.assign(hostPath(room.code))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the room')
      setBusy(false)
    }
  }

  return (
    <main className="home-shell">
      <header className="home-hero">
        <p className="eyebrow">Rapid Microskills for Clinical Reasoning</p>
        <h1>First Thought</h1>
        <p className="subtitle">
          A four-minute, low-information differential. Learners answer on their phones. The room sees the pattern.
        </p>
      </header>

      {backend.kind === 'local' && (
        <p className="mode-banner">
          Demo mode. Data stays in this browser, so phones cannot join yet. Connect Google Sheets to go live.
        </p>
      )}

      <div className="home-grid">
        <section className="panel home-card">
          <p className="section-label">Learner</p>
          <h2>Join a room</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (/^[a-z]{4}$/i.test(joinCode.trim())) window.location.assign(studentPath(joinCode.trim().toUpperCase()))
            }}
          >
            <input
              className="code-input"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="ABCD"
              maxLength={4}
              autoCapitalize="characters"
              aria-label="Room code"
            />
            <button type="submit" disabled={!/^[a-z]{4}$/i.test(joinCode.trim())}>
              Join
            </button>
          </form>
        </section>

        <section className="panel home-card">
          <p className="section-label">Instructor</p>
          <h2>Create a room</h2>
          <label>
            Room name
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="BAP Thursday group" />
          </label>
          <label>
            Default level when no one is leading
            <select value={level} onChange={(event) => setLevel(event.target.value as LearnerLevel)}>
              {Object.entries(levelConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={createRoom} disabled={busy}>
            {busy ? 'Creating...' : 'Create room'}
          </button>
          {error && <p className="warning">{error}</p>}
        </section>

        {(rooms.length > 0 || backend.kind === 'local') && (
          <section className="panel home-card">
            <p className="section-label">On this device</p>
            <h2>Your rooms</h2>
            <ul className="room-links">
              {backend.kind === 'local' && !rooms.includes(DEMO_ROOM.code) && (
                <li>
                  <a href={hostPath(DEMO_ROOM.code)} onClick={() => saveHostKey(DEMO_ROOM.code, DEMO_ROOM.hostKey)}>
                    Demo room ({DEMO_ROOM.code})
                  </a>
                </li>
              )}
              {rooms.map((code) => (
                <li key={code}>
                  <a href={hostPath(code)}>Room {code}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="home-footnote">Synthetic cases only. No names, no PHI. Formative practice, not grading.</p>
    </main>
  )
}
