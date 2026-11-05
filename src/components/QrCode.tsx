import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let cancelled = false
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then((markup) => {
      if (!cancelled) setSvg(markup)
    })
    return () => {
      cancelled = true
    }
  }, [value])
  // The SVG comes from the QR library, generated from our own URL. No user content is inserted.
  return <div className="qr-code" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
}
