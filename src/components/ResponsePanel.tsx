import { useState } from 'react'

type Props = {
  count: number
  placeholder: string
  onSubmit: (text: string) => void
  onSample: () => void
}

export function ResponsePanel({ count, placeholder, onSubmit, onSample }: Props) {
  const [draft, setDraft] = useState('')

  return (
    <section className="panel response-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Student input</p>
          <h2>Anonymous DDx submissions</h2>
        </div>
        <span>{count} reps</span>
      </div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} rows={5} />
      <div className="button-row">
        <button
          type="button"
          onClick={() => {
            onSubmit(draft)
            setDraft('')
          }}
        >
          Add response
        </button>
        <button type="button" className="secondary" onClick={onSample}>
          Add sample
        </button>
      </div>
      <p className="helper-copy">
        Browser-only for now. Phone submissions by QR code arrive in the next build.
      </p>
    </section>
  )
}
