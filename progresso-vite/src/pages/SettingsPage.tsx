import { useState } from 'react'
import { db } from '../lib/db/database'
import { Trash2, Info, Database } from 'lucide-react'

export default function SettingsPage() {
  const [cleared, setCleared] = useState(false)

  async function handleClearData() {
    if (!confirm('確定要清除所有訓練記錄嗎？此操作無法復原。')) return
    await db.workouts.clear()
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>設定</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>應用程式偏好設定</p>
      </div>

      {/* App info */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>關於</h2>
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <span className="text-xl font-black text-black">P</span>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Progresso</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>漸進性超負荷訓練日誌 v1.0</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-variant)' }}>
            <Info size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}/>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              所有訓練資料儲存在您的裝置本機（IndexedDB）。資料不會上傳至任何伺服器，完全離線使用。
            </p>
          </div>
        </div>
      </section>

      {/* Data management */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>資料管理</h2>
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <Database size={18} style={{ color: 'var(--text-muted)' }}/>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>本機資料庫</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>IndexedDB · 僅限此瀏覽器</p>
            </div>
          </div>
          <button onClick={handleClearData}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-opacity active:opacity-60">
            <Trash2 size={18} style={{ color: 'var(--danger)' }}/>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                {cleared ? '✓ 已清除' : '清除所有訓練記錄'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>此操作無法復原</p>
            </div>
          </button>
        </div>
      </section>

      {/* Tips */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>使用提示</h2>
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {[
            '記錄每組的重量和次數，追蹤漸進式超負荷',
            '每週至少訓練 3 次以獲得最佳分析數據',
            '完成的組數才會計入總容量統計',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--primary)', color: '#000' }}>{i + 1}</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
