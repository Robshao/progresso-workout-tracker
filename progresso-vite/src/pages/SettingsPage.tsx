import { useState } from 'react'
import { db } from '../lib/db/database'

export default function SettingsPage() {
  const [cleared, setCleared] = useState(false)

  async function handleClearData() {
    if (!confirm('// PURGE ALL SESSION DATA? THIS CANNOT BE UNDONE.')) return
    await db.workouts.clear()
    setCleared(true)
    setTimeout(() => setCleared(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Header */}
      <div className="steel" style={{ padding: '20px 16px 16px', borderBottom: '3px solid var(--primary)', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-brutal)', fontSize: '30px', color: 'var(--primary)', letterSpacing: '0.06em' }}>
          SYSTEM
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
          // CONFIGURATION &amp; DATA MANAGEMENT
        </p>
      </div>

      <div className="brutal-rule"/>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* App identity */}
        <div style={{ border: '2px solid var(--border)', borderTop: '3px solid var(--primary)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
            <div style={{
              width: '52px', height: '52px', flexShrink: 0,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--primary-dark)',
              boxShadow: '3px 3px 0 var(--primary-dark)',
            }}>
              <span style={{ fontFamily: 'var(--font-brutal)', fontSize: '26px', color: '#000', fontWeight: 900, lineHeight: 1 }}>P</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '22px', color: 'var(--text)', letterSpacing: '0.06em' }}>PROGRESSO</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                IRON DISCIPLINE TRACKER // v1.0
              </p>
            </div>
          </div>
          <div style={{
            padding: '12px 16px',
            borderTop: '2px solid var(--border)',
            background: 'var(--surface-variant)',
            display: 'flex', gap: '10px',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '14px', flexShrink: 0 }}>&gt;</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              ALL DATA IS STORED LOCALLY IN YOUR BROWSER (INDEXEDDB).
              NO SERVER. NO CLOUD. OFFLINE-FIRST. YOUR IRON, YOUR DATA.
            </p>
          </div>
        </div>

        {/* Data section header */}
        <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          ▸ DATA MANAGEMENT
        </p>

        {/* Storage info */}
        <div style={{ border: '2px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '14px', color: 'var(--text)', letterSpacing: '0.05em' }}>LOCAL DATABASE</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>INDEXEDDB ╱ BROWSER-LOCAL</p>
            </div>
            <div style={{
              padding: '4px 10px',
              background: 'var(--surface-variant)',
              border: '2px solid var(--border-heavy)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--primary)',
              letterSpacing: '0.08em',
            }}>ACTIVE</div>
          </div>

          {/* Purge button */}
          <button
            onClick={handleClearData}
            style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: '14px',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}>
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: cleared ? 'transparent' : 'rgba(204,17,17,0.1)',
              border: `2px solid ${cleared ? 'var(--border-heavy)' : 'var(--primary)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cleared ? 'var(--text-muted)' : 'var(--primary)',
              fontFamily: 'var(--font-brutal)',
              fontSize: '16px',
            }}>
              {cleared ? '✓' : '✕'}
            </div>
            <div>
              <p style={{
                fontFamily: 'var(--font-brutal)',
                fontSize: '14px',
                letterSpacing: '0.05em',
                color: cleared ? 'var(--text-muted)' : 'var(--primary)',
              }}>
                {cleared ? 'DATA PURGED' : 'PURGE ALL SESSION DATA'}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {cleared ? 'LOG CLEARED SUCCESSFULLY' : 'IRREVERSIBLE — CANNOT BE UNDONE'}
              </p>
            </div>
          </button>
        </div>

        {/* Protocol tips */}
        <p style={{ fontFamily: 'var(--font-brutal)', fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          ▸ IRON PROTOCOL
        </p>
        <div style={{ border: '2px solid var(--border)', borderLeft: '4px solid var(--primary)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            'LOG EVERY SET. TRACK PROGRESSIVE OVERLOAD.',
            'MINIMUM 3 SESSIONS/WEEK FOR MEANINGFUL ANALYTICS.',
            'ONLY COMPLETED SETS COUNT TOWARD VOLUME.',
          ].map((tip, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '12px 14px',
              borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            }}>
              <span style={{
                flexShrink: 0, width: '22px', height: '22px',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-brutal)',
                fontSize: '11px',
                color: '#000',
                fontWeight: 900,
              }}>{i+1}</span>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, letterSpacing: '0.04em' }}>
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
