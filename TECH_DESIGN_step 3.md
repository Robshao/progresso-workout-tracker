# 技術設計文檔 (Tech Design)：Progresso 智慧健身容量追蹤器

> 本文件對應 PRD v1.0，描述 Progresso 的技術選型、系統架構、資料模型與關鍵技術難點。設計核心原則：**離線優先 (Offline-First)**、**高效能輸入體驗**、**可擴展的分析引擎**。

---

## 1. 技術棧選擇 (Tech Stack)

### 1.1 前端框架：Flutter 3.x

| 比較項 | Flutter | React Native | 結論 |
|---|---|---|---|
| UI 渲染一致性 | Skia 自繪，雙平台像素級一致 | 依賴原生元件，需處理差異 | ✅ Flutter |
| 計時器精度 | Dart Isolate + Ticker，60 fps 穩定 | JS Bridge 有延遲風險 | ✅ Flutter |
| 圖表生態 | fl_chart 成熟、可客製化 | Victory Native 性能稍弱 | ✅ Flutter |
| 編譯產物 | AOT，啟動快（符合 1.5 秒要求） | Hermes 引擎，啟動稍慢 | ✅ Flutter |

**選擇理由：** 健身 App 的核心場景是「組間休息計時」與「即時數據對比」，對 UI 流暢度與計時精度極度敏感。Flutter 的自繪渲染與 AOT 編譯能穩定達成 PRD 的非功能性需求。

### 1.2 本地資料庫：Drift (基於 SQLite)

放棄 Hive 的原因：Hive 是 NoSQL key-value 儲存，不適合做複雜的「按肌群、按週、按時間範圍」的聚合查詢（容量分析模組的核心需求）。

選擇 **Drift**（前身 Moor）：
- 基於 SQLite，跨平台一致
- 強型別 Dart API，編譯期 SQL 校驗
- 原生支援 reactive streams（資料變動自動觸發 UI 更新）
- 支援 migrations，方便動作庫等資料的版本演進

### 1.3 雲端後端：Firebase

| 服務 | 用途 |
|---|---|
| Firebase Auth | 使用者登入（Google / Apple Sign-In） |
| Cloud Firestore | 訓練紀錄雲端備份、多設備同步 |
| Firebase Analytics | 使用行為追蹤（哪些功能被高頻使用） |
| Crashlytics | 崩潰監控 |

**為何不自建後端：** MVP 階段使用者規模小，Firebase 的 BaaS 模式能將後端開發成本壓縮到接近零，且其離線支援與 Drift 的離線優先策略契合。後期若有複雜業務邏輯（如 AI 訓練建議），再考慮遷移至自建 API。

### 1.4 狀態管理：Riverpod 2.x

捨棄 Provider / Bloc 的原因：
- Riverpod 編譯期安全，避免 runtime 找不到 Provider 的錯誤
- 對 async data（資料庫查詢、Firebase 同步）有原生 `AsyncValue` 支援
- 易於測試，可在不啟動 widget tree 的情況下單獨測試 logic

### 1.5 其他關鍵函式庫

- **fl_chart**：折線圖、長條圖、雷達圖（肌群容量分佈）
- **flutter_local_notifications**：組間休息結束提醒
- **wakelock_plus**：訓練中強制螢幕常亮
- **freezed + json_serializable**：不可變資料類別與序列化
- **dio**：HTTP 客戶端（穿戴式裝置 API 整合預留）

---

## 2. 專案結構 (Project Structure)

採用 **Feature-First + Clean Architecture** 分層，避免按技術類型（screens/widgets/models）拆分導致的「散彈式修改」。

```
progresso/
├── lib/
│   ├── main.dart
│   ├── app.dart                          # MaterialApp 設定、路由根
│   │
│   ├── core/                             # 跨 feature 共用基礎設施
│   │   ├── database/
│   │   │   ├── app_database.dart         # Drift 資料庫定義
│   │   │   ├── tables/                   # 各資料表 schema
│   │   │   └── daos/                     # Data Access Objects
│   │   ├── theme/
│   │   │   ├── app_theme.dart            # 深色模式主題
│   │   │   └── app_colors.dart           # 進步綠 / 疲勞紅 等語意色
│   │   ├── router/
│   │   │   └── app_router.dart           # go_router 設定
│   │   ├── utils/
│   │   │   ├── volume_calculator.dart    # 容量計算純函式
│   │   │   └── one_rm_estimator.dart     # 1RM 估算（Epley 公式）
│   │   └── constants/
│   │
│   ├── features/                         # 業務功能模組（按 PRD 模組拆）
│   │   ├── workout/                      # 訓練執行模組（PRD 2.1）
│   │   │   ├── data/
│   │   │   │   ├── repositories/
│   │   │   │   └── models/
│   │   │   ├── domain/
│   │   │   │   ├── entities/             # WorkoutSession, ExerciseSet
│   │   │   │   └── usecases/             # StartWorkout, LogSet
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       ├── widgets/              # RestTimer, SetInputCard
│   │   │       └── providers/            # Riverpod providers
│   │   │
│   │   ├── analytics/                    # 容量分析模組（PRD 2.2）
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   │   └── usecases/
│   │   │   │       ├── calculate_weekly_volume.dart
│   │   │   │       └── deload_advisor.dart   # 減載決策引擎
│   │   │   └── presentation/
│   │   │
│   │   ├── exercise_library/             # 動作庫（PRD 2.3）
│   │   ├── history/                      # 日曆視圖（PRD 2.3）
│   │   ├── auth/                         # 登入註冊
│   │   └── settings/                     # 單位切換、備份設定
│   │
│   └── shared/                           # 跨 feature UI 元件
│       ├── widgets/
│       │   ├── numeric_keypad.dart       # 加大數字鍵盤
│       │   └── primary_button.dart
│       └── extensions/
│
├── test/
│   ├── unit/                             # 純邏輯測試（容量計算、減載演算法）
│   ├── widget/                           # UI 元件測試
│   └── integration/                      # 端到端測試
│
└── pubspec.yaml
```

**分層原則：**
- `presentation` 只能依賴 `domain`，不能直接碰 `data`
- `domain` 不依賴任何 Flutter / Drift / Firebase API（純 Dart）
- 跨 feature 不可直接 import，需透過 `core` 或 `shared`

---

## 3. 資料模型 (Data Model)

### 3.1 核心實體關係

```
User (1) ──< (N) WorkoutSession (1) ──< (N) ExercisePerformance (1) ──< (N) ExerciseSet
                                              │
                                              ▼
                                          Exercise (來自 ExerciseLibrary)
                                              │
                                              ▼
                                          MuscleGroup (多對多)
```

### 3.2 資料表設計（Drift schema 概要）

#### `exercises` — 動作庫
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | 動作唯一 ID |
| name | TEXT | 例如「槓鈴臥推」 |
| name_zh / name_en | TEXT | 多語系名稱 |
| is_custom | BOOLEAN | 系統內建 / 使用者自訂 |
| equipment | TEXT | 槓鈴 / 啞鈴 / 機械式 |
| created_at | DATETIME | |

#### `muscle_groups` — 肌群
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | 胸 / 背 / 腿 / 肩 / 手臂 / 核心 |
| category | TEXT | upper / lower / core |

#### `exercise_muscle_groups` — 動作與肌群多對多關聯
| 欄位 | 型別 | 說明 |
|---|---|---|
| exercise_id | INTEGER FK | |
| muscle_group_id | INTEGER FK | |
| is_primary | BOOLEAN | 主動肌 / 協同肌（容量分配權重不同） |
| weight_factor | REAL | 容量計算的肌群分配比例（0.0~1.0） |

> 例如「臥推」對胸的 `weight_factor = 1.0`、對三頭的 `weight_factor = 0.4`，避免協同肌的容量被重複計算為 100%。

#### `workout_sessions` — 訓練場次
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | TEXT PK (UUID) | 用 UUID 而非自增 ID，便於雲端同步避免衝突 |
| user_id | TEXT FK | |
| started_at | DATETIME | |
| ended_at | DATETIME NULL | 進行中時為 null |
| total_duration_sec | INTEGER | |
| notes | TEXT | |
| sync_status | INTEGER | 0=本地, 1=已同步, 2=待上傳 |

#### `exercise_performances` — 一場訓練中執行的某個動作
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | TEXT PK | |
| session_id | TEXT FK | |
| exercise_id | INTEGER FK | |
| order_index | INTEGER | 動作執行順序 |
| total_duration_sec | INTEGER | 該動作總耗時（PRD 2.1） |

#### `exercise_sets` — 單一組數
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | TEXT PK | |
| performance_id | TEXT FK | |
| set_index | INTEGER | 第幾組 |
| weight | REAL | 重量值 |
| weight_unit | TEXT | 'kg' / 'lb'（避免單位轉換誤差累積） |
| reps | INTEGER | |
| rpe | REAL NULL | 1.0~10.0，可選 |
| rest_seconds | INTEGER NULL | 與下一組之間的休息秒數 |
| is_warmup | BOOLEAN | 暖身組不計入容量 |
| completed_at | DATETIME | |

#### `weekly_volume_cache` — 週容量預計算快取
| 欄位 | 型別 | 說明 |
|---|---|---|
| user_id | TEXT | |
| week_start | DATE | ISO 週的週一 |
| muscle_group_id | INTEGER | |
| total_tonnage | REAL | 總噸位（kg） |
| avg_rpe | REAL | 加權平均 RPE |
| set_count | INTEGER | 有效組數 |
| computed_at | DATETIME | |

> **為何需要快取表：** 容量計算需 join 4 張表並做聚合，使用者每打開一次分析頁都重算會慢。新增/編輯組數時觸發增量更新該週快取，分析頁直接讀快取。

### 3.3 雲端 Firestore 結構

對應本地 SQLite 結構，但採用 NoSQL 文件嵌套：

```
users/{uid}/
  ├── sessions/{sessionId}            # 場次主資料
  │   └── performances: [             # 嵌套子陣列（單場資料量不大）
  │         { exercise_id, sets: [...] }
  │       ]
  ├── custom_exercises/{exerciseId}   # 使用者自訂動作
  └── settings                         # 單一文件，使用者偏好
```

**同步策略：** 以 `updated_at` 與 `sync_status` 欄位做雙向同步，衝突時採「最後寫入優先 (Last Write Wins)」+ 場次層級鎖定（同一場次不允許多裝置同時編輯）。

---

## 4. 關鍵技術點 (Technical Highlights)

### 4.1 容量計算引擎的正確性

**難點：** 使用者隨時可能編輯/刪除歷史組數，週容量必須即時跟進；同時要避免暖身組、失敗組汙染數據。

**設計方案：**
1. **純函式設計**：`calculateVolume(sets) -> Map<MuscleGroupId, double>` 不涉及 IO，方便單元測試覆蓋邊界情況
2. **公式：** `tonnage = Σ (weight × reps × muscle_weight_factor)`，僅納入 `is_warmup = false` 且 `reps > 0` 的組
3. **單位統一**：計算前一律轉為 kg，避免 kg/lb 混合場次的誤算（轉換因子 1 lb = 0.45359237 kg，使用高精度常數）
4. **觸發增量更新**：透過 Drift 的 `triggers` 或 Repository 層的 `onSetChanged` 鉤子，只重算受影響的那一週快取

### 4.2 減載建議演算法 (Deload Advisor)

PRD 給出兩條觸發邏輯，但實際實作需處理「資料量不足」與「假陽性」問題。

```dart
class DeloadAdvisor {
  DeloadSignal evaluate(List<WeeklyVolumeSnapshot> last4Weeks) {
    // 防呆：少於 3 週資料不給建議，避免新使用者誤判
    if (last4Weeks.length < 3) return DeloadSignal.insufficientData;

    final recent2 = last4Weeks.takeLast(2);
    final baseline = last4Weeks.average(field: 'tonnage');

    // 邏輯 A: 連續兩週容量下降 + RPE 持續高
    final volumeDeclining = recent2[1].tonnage < recent2[0].tonnage
        && recent2[0].tonnage < baseline;
    final rpeHigh = recent2.every((w) => w.avgRpe >= 9.0);
    if (volumeDeclining && rpeHigh) return DeloadSignal.recommendDeload;

    // 邏輯 B: 當週容量超過歷史平均 20%
    final currentSpike = recent2[1].tonnage > baseline * 1.20;
    if (currentSpike) return DeloadSignal.overtrainingRisk;

    return DeloadSignal.normal;
  }
}
```

**注意事項：**
- 演算法本身需獨立可測，不依賴資料庫
- 提示文案需給「為什麼」+ 「建議怎麼做」（例如：本週減量 40%、組數減半），而非冷冰冰的紅燈
- 使用者可選擇「忽略此次建議」，並記錄忽略次數作為後續演算法迭代依據

### 4.3 計時器的精度與後台存活

**難點：** Flutter 在 iOS / Android 後台會被系統凍結，純 `Timer.periodic` 無法保證休息結束時的精準提醒。

**方案：**
1. **前景顯示**：使用 `AnimationController` + `Ticker` 驅動 UI（60 fps 動畫）
2. **絕對時間戳**：記錄 `restStartedAt` 而非倒數秒數。每次重新進入 App 時用 `now - restStartedAt` 重算剩餘時間，避免後台暫停造成漂移
3. **本地通知預約**：使用 `flutter_local_notifications` 在計時開始時就排程一個 N 秒後的通知，即使 App 被殺也能響鈴
4. **iOS 特別處理**：開啟 Background Modes > Audio，搭配無聲音檔維持 App 運行（健身房場景使用者通常開著 App）

### 4.4 離線優先的同步策略

**核心原則：** 寫入永遠先進本地 SQLite，再非同步推送至 Firestore。

```
[使用者操作] → [Drift 本地寫入] → UI 立即更新（reactive stream）
                       │
                       └─→ [SyncQueue] → [Firestore upload] → 標記 sync_status=1
```

**衝突處理：**
- 每筆資料攜帶 `updated_at` 時間戳與 `device_id`
- 拉取雲端資料時，對比本地版本，新版覆蓋舊版
- 場次資料設計為「append-only」結構，編輯生成新的 patch event，降低衝突機率

### 4.5 數字鍵盤的單手最佳化

PRD 要求加大數字鍵盤、關鍵按鈕在拇指區。實作要點：

- 自製 `NumericKeypad` widget，**不**使用系統鍵盤（系統鍵盤會把畫面推到上半部，違反單手原則）
- 採用「右下角扇形佈局」：「完成一組」按鈕固定在右下 65% 視覺權重位置
- 數字鍵採 `0.5 / 1.0 / 2.5 / 5.0` 的快速增減步進（健身房常見槓片重量），減少輸入步數
- 觸覺回饋：`HapticFeedback.lightImpact()` 在每次按鍵與完成組數時觸發

### 4.6 圖表效能與資料抽樣

**問題：** 訓練 1 年後，週容量趨勢圖可能需渲染 52 個資料點 × 6 個肌群 = 312 個點，且若使用者切換到「日視圖」會更多。

**方案：**
- fl_chart 開啟 `LineChartData.curveSmoothness = 0.3`，降低渲染壓力
- 超過 90 天的資料採用「滑動窗口聚合」（兩週合併為一點）
- 圖表元件使用 `RepaintBoundary` 隔離，避免外層滾動觸發整圖重繪

### 4.7 啟動速度（PRD 1.5 秒目標）

- `main()` 中**不**做任何網路請求
- Firebase 初始化以 `Future.wait` 平行啟動
- 動作庫使用 `lazy loading`，首屏只載入「最近使用的 5 個動作」
- 使用 `flutter_native_splash` 提供原生啟動畫面，覆蓋 Flutter Engine 啟動的 ~400ms 空檔
- 透過 `flutter build apk --analyze-size` 持續監控套件大小，控制在 25 MB 以內

### 4.8 1RM 估算（第三階段）

採用 **Epley 公式**：`1RM ≈ weight × (1 + reps / 30)`

對 reps > 10 的組數誤差會放大，因此：
- 僅納入 reps ≤ 10 的「有效組」做 1RM 估算
- 取近 30 天內前 5 高的估算值取均值，避免單次峰值的誤差
- 預測曲線使用簡單線性回歸，未來可替換為 Prophet / ARIMA

---

## 5. 測試策略

| 層級 | 範圍 | 工具 |
|---|---|---|
| 單元測試 | 容量計算、減載演算法、1RM 估算、單位轉換 | `flutter_test` + `mocktail` |
| Widget 測試 | 數字鍵盤輸入流程、計時器顯示 | `flutter_test` |
| 整合測試 | 完整訓練場次：開始 → 記錄 → 結束 → 同步 | `integration_test` |
| 手動測試 | 健身房實地測試（強光、汗手、震動環境） | 真機 |

**目標覆蓋率：** `core/utils` 與 `analytics/domain/usecases` 達 90%+；UI 層達 60%+。

---

## 6. 後續演進建議

- **MVP 階段**完成 Section 1.1 ~ 1.3 的基礎架構即可，不必預先實作快取表（資料量小直接查詢即可）
- **第二階段**引入 `weekly_volume_cache` 快取與減載決策引擎
- **第三階段**評估是否從 Firebase 遷出，特別是當需要：(a) 跨使用者排行榜 (b) 機器學習模型推論 (c) 自訂訓練計劃市集 等需要伺服器端運算的場景
