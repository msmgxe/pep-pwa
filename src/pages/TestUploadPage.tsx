import { useState } from 'react'

/**
 * TEST PAGE — accessible at /test-upload (no auth required)
 * Tests 5 file-input techniques in isolation to identify which works
 * on the target device (Android PWA / Chrome).
 */
export default function TestUploadPage() {
  const [log, setLog] = useState<{ time: string; msg: string; ok: boolean }[]>([])

  const record = (label: string, file: File | null | undefined) => {
    const ok = !!file
    setLog(l => [{
      time: new Date().toLocaleTimeString(),
      msg: ok ? `✅ ${label}: ${file!.name} (${(file!.size / 1024).toFixed(1)} KB)` : `❌ ${label}: no file selected`,
      ok
    }, ...l])
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15,
    cursor: 'pointer', border: 'none', minHeight: 44,
    background: '#7B2D8B', color: '#fff', marginBottom: 4,
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ color: '#7B2D8B', marginBottom: 4 }}>Test: File Upload</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>
        Toca cada botón. Si abre galería/cámara → ✅. Si no pasa nada → ❌.<br />
        Los resultados aparecen abajo.
      </p>

      {/* ── TEST 1: input visible directo ─────────────────────────── */}
      <div style={{ marginBottom: 20, padding: 14, background: '#f9f0fc', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T1 — input visible (sin estilos)</p>
        <input
          type="file"
          accept="image/*"
          style={{ fontSize: 16 }}
          onChange={e => record('T1-visible', e.target.files?.[0])}
        />
      </div>

      {/* ── TEST 2: input capture=environment ─────────────────────── */}
      <div style={{ marginBottom: 20, padding: 14, background: '#f0f4ff', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T2 — capture="environment" (cámara trasera)</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ fontSize: 16 }}
          onChange={e => record('T2-capture-env', e.target.files?.[0])}
        />
      </div>

      {/* ── TEST 3: input capture=user ─────────────────────────────── */}
      <div style={{ marginBottom: 20, padding: 14, background: '#f0fff4', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T3 — capture="user" (cámara frontal)</p>
        <input
          type="file"
          accept="image/*"
          capture="user"
          style={{ fontSize: 16 }}
          onChange={e => record('T3-capture-user', e.target.files?.[0])}
        />
      </div>

      {/* ── TEST 4: label + input display:none ─────────────────────── */}
      <div style={{ marginBottom: 20, padding: 14, background: '#fffbf0', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T4 — label con input display:none</p>
        <label style={btn}>
          Seleccionar foto
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => record('T4-label-hidden', e.target.files?.[0])}
          />
        </label>
      </div>

      {/* ── TEST 5: overlay transparente ────────────────────────────── */}
      <div style={{ marginBottom: 20, padding: 14, background: '#fff0f0', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T5 — input transparente sobre botón</p>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <div style={btn}>Seleccionar foto</div>
          <input
            type="file"
            accept="image/*"
            onChange={e => record('T5-overlay', e.target.files?.[0])}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer', fontSize: 0,
            }}
          />
        </div>
      </div>

      {/* ── TEST 6: button + programmatic click ─────────────────────── */}
      <div style={{ marginBottom: 24, padding: 14, background: '#f0f9ff', borderRadius: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>T6 — button + input.click() programático</p>
        <button
          style={btn}
          onClick={() => {
            const inp = document.getElementById('t6-input') as HTMLInputElement
            inp?.click()
          }}
        >
          Seleccionar foto
        </button>
        <input
          id="t6-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => record('T6-programmatic', e.target.files?.[0])}
        />
      </div>

      {/* ── LOG ───────────────────────────────────────────────────────── */}
      <div style={{ padding: 14, background: '#1a1a1a', borderRadius: 12, minHeight: 80 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>RESULTADOS:</p>
        {log.length === 0
          ? <p style={{ color: '#555', fontSize: 13, fontFamily: 'monospace' }}>Toca un botón para ver resultados...</p>
          : log.map((l, i) => (
              <div key={i} style={{ fontSize: 13, fontFamily: 'monospace', color: l.ok ? '#4ade80' : '#f87171', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>{l.time} </span>{l.msg}
              </div>
            ))
        }
      </div>
    </div>
  )
}
