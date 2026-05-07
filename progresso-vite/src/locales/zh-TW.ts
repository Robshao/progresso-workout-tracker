/* ─────────────────────────────────────────────────────────────
   Progresso — Traditional Chinese (zh-TW)
   硬核健身術語標準：
     Volume     → 訓練容量      Session  → 訓練
     Sets       → 組數          Reps     → 次數
     Breakdown  → 肌群分佈      Iron     → 鐵器 / 訓練
     Progressive Overload → 漸進式超負荷
   Bundled inline — NO external CDN / API calls (offline-first)
───────────────────────────────────────────────────────────── */
import type { Locale } from './en-US'

export const zhTW: Locale = {
  /* ── 底部導航 ────────────────────────────────────────────── */
  nav: {
    train: '訓練',
    stats: '分析',
    iron:  '動作',
    log:   '記錄',
    set:   '設定',
  },

  /* ── 訓練首頁 ────────────────────────────────────────────── */
  workout: {
    subtitle:       '// 漸進式超負荷訓練日誌',
    startCta:       '開始訓練',
    weekSection:    '本週摘要',
    totalIronLabel: '訓練容量',
    sessionsLabel:  '訓練次數',
    setsLabel:      '完成組數',
    recentSection:  '最近訓練',
    emptyTitle:     '尚無訓練記錄',
    emptySub:       '> 開始你的第一次訓練_',
    kgUnit:         'KG',
    minUnit:        '分',
    hourUnit:       '時',
    emptySession:   '空訓練',
  },

  /* ── 進行中訓練頁 ────────────────────────────────────────── */
  active: {
    statusLabel:      '訓練進行中',
    abortBtn:         '放棄',
    lockInBtn:        '完成訓練',
    abortConfirm:     '放棄訓練？本次進度將會遺失。',
    finalizeConfirm:  '完成訓練？記錄將儲存至日誌。',
    ironMovedLabel:   '訓練容量',
    setsDoneLabel:    '完成組數',
    movementsLabel:   '動作數',
    noMovementsTitle: '尚未新增動作',
    noMovementsSub:   '> 點擊下方按鈕新增動作_',
    addMovementBtn:   '+ 新增動作',
    doneColHeader:    '完成',
    addSetBtn:        '+ 新增組數',
    pickerTitle:      '選擇動作',
    pickerSearch:     '搜尋動作...',
  },

  /* ── 訓練記錄頁 ──────────────────────────────────────────── */
  history: {
    title:          '訓練日誌',
    recordedOne:    '筆訓練記錄',
    recordedMany:   '筆訓練記錄',
    forgeBtn:       '+ 補錄',
    noSessionsTitle:'尚無訓練記錄',
    noSessionsSub:  '> 開始你的第一次訓練_',
    kgLabel:        'KG',
    setsLabel:      '組',
    emptySession:   '空訓練',
  },

  /* ── 手動補錄頁 ──────────────────────────────────────────── */
  manualEntry: {
    entryLabel:      '手動補錄',
    title:           '補錄訓練',
    backBtn:         '返回',
    saveBtn:         '儲存',
    volumeLabel:     '訓練容量',
    setsLabel:       '組數',
    movesLabel:      '動作數',
    dateLabel:       '日期',
    durationLabel:   '時長（分鐘）',
    noMovementsTitle:'尚未新增動作',
    noMovementsSub:  '> 點擊下方按鈕新增動作_',
    addMovementBtn:  '+ 新增動作',
    colHash:         '組',
    colKg:           '重量',
    colReps:         '次數',
    colDone:         '✓',
    addSetBtn:       '+ 新增組數',
    pickerTitle:     '選擇動作',
    pickerSearch:    '搜尋...',
    errorDate:       '// 請選擇日期',
    errorMovement:   '// 請新增至少一個動作',
  },

  /* ── 分析頁 ──────────────────────────────────────────────── */
  analytics: {
    title:            '訓練分析',
    subtitle:         '// 全期訓練數據',
    sessionsLabel:    '訓練次數',
    totalIronLabel:   '總訓練容量',
    totalSetsLabel:   '總組數',
    avgSessionLabel:  '平均時長',
    weeklySection:    '每週訓練容量',
    muscleSection:    '肌群分佈',
    noDataLabel:      '> 尚無資料_',
    setsUnit:         '組',
    tUnit:            '公噸',
    minUnit:          '分',
  },

  /* ── 動作庫頁 ────────────────────────────────────────────── */
  exercises: {
    title:            '動作庫',
    catalogueSuffix:  '個動作',
    searchPlaceholder:'搜尋動作...',
    notFound:         '找不到符合的動作',
    allFilter:        '全部',
  },

  /* ── 設定頁 ──────────────────────────────────────────────── */
  settings: {
    title:          '設定',
    subtitle:       '// 偏好設定與資料管理',
    appTagline:     '漸進式超負荷訓練日誌 // v1.0',
    offlineNote:    '所有訓練資料儲存在您的裝置本機（IndexedDB）。資料不會上傳至任何伺服器，完全離線使用。',
    dataSection:    '資料管理',
    localDbLabel:   '本機資料庫',
    localDbSub:     'IndexedDB ╱ 僅限此瀏覽器',
    activeLabel:    '使用中',
    purgeLabel:     '清除所有訓練記錄',
    purgeSub:       '此操作無法復原',
    purgedLabel:    '已清除',
    purgedSub:      '訓練記錄已成功清除',
    purgeConfirm:   '確定要清除所有訓練記錄嗎？此操作無法復原。',
    protocolSection:'使用提示',
    tip1:           '記錄每組的重量和次數，追蹤漸進式超負荷。',
    tip2:           '每週至少訓練 3 次以獲得最佳分析數據。',
    tip3:           '完成的組數才會計入訓練容量統計。',
    languageSection:'語言',
  },
}
