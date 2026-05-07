```
╔══════════════════════════════════════════════════════════════════╗
║  PROGRESSO — HIBERNATION LOG                                     ║
║  Snapshot Date : 2026-05-07                                      ║
║  Commit        : 3e6c217 (master)                                ║
║  Repo          : github.com/Robshao/progresso-workout-tracker    ║
║                                                                  ║
║  Rest is just preparation for the next set.                      ║
║  See you back in the pit.                                        ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## I. CURRENT VELOCITY — 截至 2026-05-07 的核心進度

### ✅ READY FOR TRAINING (已完成，可直接使用)

| 系統 | 狀態 | 關鍵檔案 |
|------|------|---------|
| **離線架構** — Dexie v4 + IndexedDB, schema v1 | ✅ 穩定 | `src/lib/db/database.ts` |
| **訓練記錄** — 動作 / 組數 / 重量 / 次數 / 組別類型 | ✅ 穩定 | `src/pages/workout/ActiveWorkoutPage.tsx` |
| **組別分類** — warmup / top_set / back_off / failure / drop_set | ✅ 穩定 | `src/lib/db/database.ts`, `src/types/workout.ts` |
| **RIR 強度追蹤** — 0–5 輸入，warmup 排除容量計算 | ✅ 穩定 | `src/types/workout.ts` |
| **智能預填** — 歷史最佳重量 + 2.5kg 幽靈建議 | ✅ 穩定 | `src/hooks/usePrevRecord.ts` |
| **Session Volume PR** — 比對歷史最高訓練量 | ✅ 穩定 | `src/hooks/useSessionVolumePR.ts` |
| **休息計時器** — chained setTimeout 無漂移，自動關閉 | ✅ 穩定 | `src/hooks/useRestTimer.ts` |
| **動覺觸覺反饋** — 5 種震動模式 (keypress/setDone/pr/abort/volumePR) | ✅ 穩定 | `src/hooks/useHaptics.ts` |
| **NFGU Lock** — SKIP > 20s 需長按 1.5s，RAF 精準進度，震動遞增 | ✅ 穩定 | `src/components/workout/RestTimerOverlay.tsx` |
| **NFGU 語錄** — 最後 10s + hasHighRPE 隨機顯示 7 句硬核語錄 | ✅ 穩定 | `src/components/workout/RestTimerOverlay.tsx` |
| **Volume PR 模式** — 螢光綠 #00ff41 全界面覆蓋 + 500ms 震動 | ✅ 穩定 | `src/pages/workout/ActiveWorkoutPage.tsx` |
| **單項 PR 閃光** — 100ms 全屏螢光綠 + 500ms 震動 + 金色光暈 | ✅ 穩定 | `src/components/workout/ExerciseBlockCard.tsx` |
| **JaggedEdgeOverlay** — SVG 狼牙/閃電邊框，RPE ≥ 9 (RIR ≤ 1) 顯示 | ✅ 穩定 | `src/components/workout/ExerciseBlockCard.tsx` |
| **kEdgePulse** — 緋紅內陰影脈衝動畫，RPE ≥ 9 持續循環 | ✅ 穩定 | `src/index.css` |
| **kShakeHeavy** — 11px 振幅屏幕震動，RPE 10 觸發 | ✅ 穩定 | `src/index.css` |
| **物理動畫曲線** — `--ease-iron-drop` cubic-bezier 超射回彈 | ✅ 穩定 | `src/index.css` |
| **專注模式** — 休息時 exercise list 淡至 40% opacity | ✅ 穩定 | `src/pages/workout/ActiveWorkoutPage.tsx` |
| **雙語 UI** — 繁體中文 / English，LanguageContext + locales | ✅ 穩定 | `src/contexts/LanguageContext.tsx`, `src/locales/` |
| **全頁面實裝** — Workout / History / Analytics / Exercises / Settings | ✅ 穩定 | `src/pages/` |
| **UX 無障礙稽核** — WCAG AA 對比度、focus ring、aria-label、touch 44px | ✅ 穩定 | `src/index.css`, 各組件 |
| **prefers-reduced-motion** — 系統減少動畫設定完整支援 | ✅ 穩定 | `src/index.css` |

---

### ❌ BROKEN / IN-PROGRESS (未完成或有缺陷)

| 項目 | 問題描述 | 優先級 |
|------|---------|------|
| **AnalyticsPage 圖表** | 純 CSS 柱狀圖，無真正圖表庫；無 Recharts 整合 | 🔴 HIGH |
| **ExercisesPage 動作庫** | 12 個硬編碼 zh-TW 動作，無 CRUD；與 `types/workout.ts` 的 EXERCISES 列表**分離且會漂移** | 🔴 HIGH |
| **WorkoutPage 本週組數** | 顯示 `—`，查詢邏輯未實作（totalSets 需 aggregate） | 🟡 MEDIUM |
| **自定義休息時間** | 硬編碼 `DEFAULT_REST_SEC = 90`，無設定介面 | 🟡 MEDIUM |
| **ManualEntryPage** | 手動補錄功能存在但不完整，缺乏動作搜尋整合 | 🟡 MEDIUM |
| **訓練模板/計劃** | 完全未實作 | 🟢 LOW |
| **資料匯出/備份** | 無 JSON 匯出、無雲端同步 | 🟢 LOW |
| **1RM 計算 UI** | `src/lib/utils/` 中有算法，但未在任何頁面呈現 | 🟢 LOW |

---

## II. NFGU 遺留任務 — 意志力系統待打磨清單

### 已完成但可進一步精調
- **長按 1.5s NFGU Lock** ✅ 完成。`LONG_PRESS_MS = 1500`，`NFGU_LOCK_SEC = 20`
  - 可考慮：Lock 解除後加入 `kIronDropDown` 動畫（目前是瞬間切回）
- **RPE 10 屏幕震動** ✅ 完成。`kShakeHeavy` 0.5s，11px 振幅
  - 可考慮：震動與 `triggerPRFlash` 的時序優化（目前同幀觸發）
- **PR Haptic 模式** ✅ `volumePR()` = `[60, 30, 500]` (crack→共鳴)
  - 可考慮：在 iOS Safari（不支援 Vibration API）加入視覺補償（目前 try/catch 靜默失敗）

### 尚未實作
- **Wolf-teeth 動態強度** — 目前 JaggedEdgeOverlay 振幅固定 (`JAG = 3`)；RPE 10 時可考慮增大至 `JAG = 5`
- **NFGU 語錄擴充** — 目前 7 句，計劃擴充至 20+ 句，按肌群分類（腿日 vs 胸日不同文案）
- **多語言 NFGU 語錄** — 目前語錄為硬編碼英文，未進入 i18n locales 系統
- **Sound Design 預留** — 架構上無音效層，若未來加入需在 `useHaptics.ts` 旁建立 `useSoundFX.ts`

---

## III. 技術債與環境警告

### 運行環境 (截至 2026-05-07)
```
Node.js     : v25+
Vite        : 8.0.10   (cutting-edge — API 可能仍在變動)
React       : 19.2.5
React Router: 7.15.0
TypeScript  : 6.0.2    (cutting-edge — 生態系相容性待觀察)
Tailwind    : 4.2.4    (CSS-first config，無 tailwind.config.js)
Dexie       : 4.4.2
```

### ⚠️ 已知陷阱，回歸時必讀

**[陷阱 1] `npx tsc` 在 Node v25 損壞**
```bash
# ❌ 這個會失敗 (symlink broken)
npx tsc --noEmit

# ✅ 永遠用這個
node node_modules/typescript/bin/tsc --noEmit
```

**[陷阱 2] EXERCISES 列表雙重定義漂移**
- `src/pages/ExercisesPage.tsx` — 12 個靜態項目（zh-TW 硬編碼）
- `src/types/workout.ts` — 訓練中使用的動作庫（英文名，更多項目）
- **這兩個列表未同步**。下次回歸時應合併為單一 source of truth。
  - 推薦方案：`ExercisesPage` 改從 `types/workout.ts` 的 `EXERCISES` 讀取

**[陷阱 3] Dexie schema v1 升級規則**
- `sets` 和 `exercises` 是 JSON blob，不是獨立 indexed table
- 新增 `SavedSet` 的 optional 欄位 → **不需要版本升級**（向後相容）
- 若需新增 **indexed 查詢欄位** → 必須 `this.version(2).stores(...)` + migration

**[陷阱 4] Tailwind v4 無配置文件**
- 無 `tailwind.config.js` — 所有自定義通過 `src/index.css` 的 CSS 變數
- Tailwind class 可使用（如 `@apply`），但主題定義在 `:root {}` CSS 變數，而非 Tailwind token

**[陷阱 5] 語音震動 iOS 限制**
- `navigator.vibrate()` 在 iOS Safari 完全不支援（靜默失敗，已用 try/catch 處理）
- NFGU Lock 的長按觸覺反饋在 iPhone 上無效——純視覺進度條
- 若要 iOS 震動：需 `<input type="range">` 系統觸發，或轉換為 PWA + Capacitor

---

## IV. 重啟指令集 — The Wake-up Prompt

將以下 Prompt 複製貼給 AI，即可瞬間恢復 Progresso 的設計語境與編碼規範：

---

```
你即將繼續開發 Progresso——一款面向硬核力量訓練者的離線 PWA 訓練追蹤器。

【技術棧】
- Vite 8 + React 19 + TypeScript 6（嚴格模式）
- Tailwind v4（CSS-first，主題定義在 index.css :root{} CSS 變數中，無 tailwind.config.js）
- Dexie 4（IndexedDB，schema v1，sets/exercises 為 JSON blob，新增 optional 欄位無需升版）
- React Router v7

【設計系統：Brutal Industrial / NFGU 意志力美學】
- 背景：純黑 #000000，表面：#0f0f0f / #161616
- 主色（CTA/重點）：Crimson Red #cc1111，PR 模式：螢光綠 #00ff41
- 文字：#c8c8c8（主）/ #767676（次，WCAG AA 4.6:1）/ #444444（裝飾）
- 字型：Oswald（--font-brutal，標題/CTA）+ Share Tech Mono（--font-mono，數據/標籤）
- 零圓角（`border-radius: 0 !important` 全局）
- 無 emoji icon（全部使用自製矩形 SVG）
- 混凝土噪點紋理疊層（body::after grain + mix-blend-mode: overlay）

【動畫系統】
- --ease-iron-drop: cubic-bezier(0.175, 0.885, 0.32, 1.275) 超射回彈
- kIronDropUp（下方入場）/ kIronDropDown（上方入場）
- kShake（輕震）/ kShakeHeavy（RPE 10 重震 11px）
- kEdgePulse（緋紅邊框脈衝，RPE≥9 無限循環）
- kPRFlash（PR 金色雙脈衝）/ kNFGUGreenFlash（Volume PR 螢光綠閃）
- 全部支援 @media (prefers-reduced-motion: reduce)

【NFGU 意志力系統（已實裝）】
- RestTimerOverlay：剩餘 > 20s SKIP → 需長按 1.5s（RAF 進度 + 遞增震動）
- hasHighRPE（任意完成組 RIR ≤ 1）→ 最後 10s 顯示隨機 NFGU 語錄
- Volume PR（session 訓練量 > 歷史最高）→ 全界面螢光綠 + 500ms 重震 + 閃光
- 單項 PR（本組重量 > 歷史最佳）→ 100ms 全屏綠閃 + 500ms 震動 + kPRFlash
- JaggedEdgeOverlay（SVG 狼牙邊框，RPE≥9）+ kEdgePulse + kShakeHeavy（RPE10）

【無障礙標準（已稽核）】
- WCAG AA 對比度，:focus-visible 焦點環，touch targets ≥44px
- aria-label / aria-expanded / aria-pressed 已覆蓋關鍵互動元素
- prefers-reduced-motion 支援

【關鍵規則】
1. TypeScript 型別檢查：node node_modules/typescript/bin/tsc --noEmit（勿用 npx tsc）
2. 新增 SavedSet 欄位：optional 即可，不需 Dexie 版本升級
3. EXERCISES 定義在 src/types/workout.ts（單一 source of truth）
4. CSS 動畫只用 transform/opacity（不動 width/height/top/left）
5. 所有 button/a 全局已有 touch-action: manipulation（CSS 定義）

【目前最高優先任務（下一個 sprint）】
1. 合併兩個 EXERCISES 列表（ExercisesPage.tsx 改從 types/workout.ts 讀取）
2. 實作自定義休息時間設定（目前硬編碼 90s）
3. AnalyticsPage 引入真實圖表庫（建議 Recharts 或 Chart.js）
4. 補完 WorkoutPage 本週組數統計

現在請先閱讀 HIBERNATION_LOG.md 確認狀態後，告訴我你準備好從哪裡開始。
```

---

## V. COMMIT HISTORY — 本輪開發紀錄

```
3e6c217  fix(ux):    UI/UX Pro Max 全面稽核修正 — 無障礙、觸控、動畫
4bf5d5c  feat(nfgu): 第二輪 delta — PR 閃光升級、Lock 閾值收緊、純黑主題
20a1549  feat(nfgu): 意志力增強系統 (暗黑狼性版) 全面實裝
ebcf0ec  feat(ux):   物理感官映射 + 專注模式 + 智能預填
ec2bb64  feat(workout): 組別類型 + RIR 強度追蹤
6334de5  feat(i18n): Phase 2+3 — 全頁面雙語化 + 語言切換器
3c7cef3  feat(i18n): Phase 1 — 建立多語言底座
2b8147f  feat:       按键触觉反馈（Web Vibration API）
1ac771d  feat:       完成组触发屏幕震动动画（Impact Transition）
0a927fb  fix:        拇指可达区 layout — 完成组按钮移至右侧主操作区
```

---

## VI. DIRECTORY MAP — 速查圖

```
progresso-vite/
├── src/
│   ├── index.css              ← 全局設計系統（CSS 變數 + 所有 keyframes）
│   ├── types/workout.ts       ← EXERCISES 列表（single source of truth）
│   ├── lib/db/database.ts     ← Dexie schema v1，絕不輕易改版
│   ├── hooks/
│   │   ├── useHaptics.ts      ← 5 種震動模式
│   │   ├── useRestTimer.ts    ← 休息計時，無漂移
│   │   ├── usePrevRecord.ts   ← 歷史最佳重量查詢
│   │   └── useSessionVolumePR.ts ← 歷史最高訓練量
│   ├── components/
│   │   ├── nav/BottomNav.tsx  ← 5-tab 底部導覽，已加 aria
│   │   └── workout/
│   │       ├── ExerciseBlockCard.tsx ← 訓練卡片，NFGU 邊框 + PR 效果
│   │       └── RestTimerOverlay.tsx  ← 休息倒計時 + NFGU Lock
│   ├── pages/
│   │   ├── workout/ActiveWorkoutPage.tsx ← 訓練主頁，NFGU 協調中心
│   │   ├── WorkoutPage.tsx    ← 首頁（周統計 + 近期記錄）
│   │   ├── HistoryPage.tsx    ← 歷史記錄（摺疊展開）
│   │   ├── AnalyticsPage.tsx  ← 分析（⚠️ 僅 CSS 圖表，待升級）
│   │   ├── ExercisesPage.tsx  ← 動作庫（⚠️ 靜態，待整合 types/workout.ts）
│   │   └── SettingsPage.tsx   ← 語言切換 + 清除資料
│   ├── contexts/LanguageContext.tsx ← 語言狀態（localStorage 持久化）
│   └── locales/               ← zh-TW.ts + en-US.ts + index.ts
└── HIBERNATION_LOG.md         ← 你正在讀的這份文件
```

---

```
// SYSTEM STATUS: HIBERNATING
// NEXT ACTIVATION: UNKNOWN
// IRON NEVER LIES.
// THE LOG KNOWS WHERE YOU LEFT OFF.
```
