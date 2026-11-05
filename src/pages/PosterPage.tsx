import { absoluteUrl, hostPath, studentPath } from '../app/routes'
import { useRoom } from '../app/useRoom'
import { QrCode } from '../components/QrCode'

export function PosterPage({ code }: { code: string }) {
  const { room, error } = useRoom(code, 60000)
  const joinUrl = absoluteUrl(studentPath(code))

  return (
    <main className="poster-shell">
      <div className="poster">
        <p className="eyebrow">First Thought</p>
        <h1>{room?.label ?? 'Clinical reasoning reps'}</h1>
        <p className="poster-lede">Scan to try today&apos;s case. Four minutes. No names.</p>
        <QrCode value={joinUrl} label={`QR code to join room ${code}`} />
        <p className="poster-code">
          Room code <strong>{code}</strong>
        </p>
        <p className="poster-url">{joinUrl.replace(/^https?:\/\//, '')}</p>
        <ol className="poster-steps">
          <li>Read the chief complaint.</li>
          <li>Write your differential before you look anything up.</li>
          <li>Submit to see what the room came up with.</li>
        </ol>
        {error && <p className="warning no-print">Room not reachable: {error}</p>}
      </div>
      <div className="poster-actions no-print">
        <button type="button" onClick={() => window.print()}>
          Print poster
        </button>
        <a className="button-link secondary" href={hostPath(code)}>
          Back to host view
        </a>
      </div>
    </main>
  )
}
