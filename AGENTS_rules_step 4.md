# Progresso AI 開發指令 (AGENTS.md)

> 本文件是 Progresso 專案的 AI 編程工具工作手冊。任何 AI 助手（Claude Code / Cursor / Copilot 等）在本倉庫中產生程式碼前，**必須**先閱讀本文件、PRD (`Progresso_App_PRD_step_2.md`) 與技術設計 (`TECH_DESIGN.md`)。

---

## 1. 專案概述

Progresso 是一款給中高階健身愛好者的硬核訓練日誌，核心價值是**漸進性超負荷追蹤**與**自動減載建議**。技術棧固定為：

- **前端：** Flutter 3.x + Dart 3.x
- **狀態管理：** Riverpod 2.x
- **本地資料庫：** Drift (SQLite)
- **雲端：** Firebase (Auth + Firestore)
- **架構：** Feature-First + Clean Architecture

**請勿擅自更換以上技術棧**，包括但不限於改用 Hive、Bloc、Provider、原生 sqflite。若有強烈理由建議更換，先在 PR 描述中說明，等待人類決策。

---

## 2. 架構紀律（最重要）

### 2.1 分層依賴規則

```
presentation  →  domain  →  data
```

- `presentation` 可以 import `domain`，**禁止**直接 import `data`
- `domain` **禁止** import 任何 Flutter / Drift / Firebase API（保持為純 Dart）
- `data` 實作 `domain` 定義的 repository 介面
- 跨 feature **禁止**直接互相 import，必須透過 `core/` 或 `shared/`

違反此規則的 PR 會被直接拒絕，沒有例外。

### 2.2 純函式優先

容量計算、減載判斷、1RM 估算、單位轉換 — 這些屬於業務邏輯核心，**必須**寫成純函式（無副作用、不依賴 IO），放在 `core/utils/` 或 `features/*/domain/usecases/`。

```dart
// ✅ 正確
double calculateTonnage(List<ExerciseSet> sets) { ... }

// ❌ 錯誤：純邏輯混入了資料庫呼叫
Future<double> calculateTonnage(int sessionId) async {
  final sets = await db.getSets(sessionId);  // 不要這樣
  ...
}
```

---

## 3. 編碼規範

### 3.1 Dart / Flutter 風格

- 遵循 [Effective Dart](https://dart.dev/effective-dart)，啟用 `flutter_lints` + `very_good_analysis`
- 縮排 2 空格、行寬 100 字元
- `const` 能加就加（widget tree 效能）
- 公開 API 必須有 dartdoc 註解（`///`），私有方法視情況

### 3.2 命名

| 類型 | 規則 | 範例 |
|---|---|---|
| 類別 / 列舉 | PascalCase | `WorkoutSession`, `DeloadSignal` |
| 變數 / 函式 | camelCase | `calculateTonnage`, `restSeconds` |
| 常數 | lowerCamelCase 加 `k` 前綴或 `static const` | `kMaxRestSeconds`, `Duration.kDefaultRest` |
| 私有成員 | 底線前綴 | `_database`, `_validateInput` |
| 檔案名 | snake_case | `volume_calculator.dart` |
| Riverpod Provider | 名詞 + Provider 後綴 | `currentWorkoutProvider` |

### 3.3 資料類別

**強制使用 `freezed`** 定義所有 entity / DTO / state，禁止手寫 `==`、`hashCode`、`copyWith`：

```dart
@freezed
class ExerciseSet with _$ExerciseSet {
  const factory ExerciseSet({
    required String id,
    required double weight,
    required WeightUnit unit,
    required int reps,
    double? rpe,
    @Default(false) bool isWarmup,
  }) = _ExerciseSet;
}
```

### 3.4 Riverpod 規範

- 使用 `riverpod_generator`，避免手寫 `StateNotifierProvider`
- 副作用統一封裝成 `usecase`，provider 只負責編排
- **禁止**在 widget 中直接呼叫 repository，必須走 provider

### 3.5 錯誤處理

- 業務錯誤使用密封類別（sealed class）+ pattern matching，**禁止**用字串訊息傳遞錯誤
- 預期外的例外用 `Result<T, E>` 包裝（建議用 `dartz` 或自訂 `Either`），避免 try-catch 散落各處
- 所有對 Firebase / 網路的呼叫**必須**有超時設定（預設 10 秒）

---

## 4. 領域知識陷阱（容易出錯的地方）

以下是專案中**反覆出現的錯誤**，AI 寫 code 時要特別警惕：

### 4.1 重量單位
- **永遠**儲存原始 unit 與原始 weight，計算前才轉換
- kg ↔ lb 轉換係數使用高精度：`1 lb = 0.45359237 kg`，**禁止**用 0.453 或 2.2 這種近似值
- UI 顯示時根據使用者偏好設定動態轉換

### 4.2 容量計算
- 只計入 `is_warmup = false` 且 `reps > 0` 的有效組
- 多肌群動作必須乘上 `weight_factor`（臥推對三頭只算 40%），**不要**把全部容量重複加給每個關聯肌群
- 週的定義固定為 ISO 週（週一開始），不要用「最近 7 天」的滾動窗口

### 4.3 減載演算法
- 資料 < 3 週時直接回傳 `insufficientData`，**禁止**對新使用者觸發紅燈警告
- 演算法必須與資料庫解耦，輸入是 `List<WeeklyVolumeSnapshot>` 而非 `userId`

### 4.4 主鍵設計
- 所有需要雲端同步的表（sessions / performances / sets）**必須**使用 UUID 字串主鍵，**禁止**用自增 INTEGER（多裝置會衝突）
- 動作庫 `exercises` 表內建動作可用自增 ID，自訂動作仍用 UUID

### 4.5 計時器
- **禁止**用倒數秒數的方式記錄狀態，**必須**記錄 `restStartedAt` 絕對時間戳
- 計時開始時**同步**預約 `flutter_local_notifications`，App 被殺時也要能響鈴
- iOS 上**禁止**依賴 JS Timer 或 Dart `Timer.periodic` 在後台繼續運行

### 4.6 UI 互動
- 訓練頁的數字輸入**禁止**喚起系統鍵盤，必須使用自訂 `NumericKeypad`
- 「完成一組」按鈕固定在右下拇指區，**禁止**為了「美觀」放在頂部或居中
- 新增動畫前先確認不影響 60 fps（`flutter run --profile` 實測）

---

## 5. 資料庫變更

- 任何 schema 變更**必須**寫 Drift migration，**禁止**直接修改 schema 然後刪庫重來
- migration 檔案命名：`migration_v{from}_to_v{to}.dart`
- 變更後執行 `dart run build_runner build --delete-conflicting-outputs` 重新生成

---

## 6. 測試要求

### 6.1 必須有測試的範圍（PR 沒測試會被退）

- `core/utils/` 下所有純函式（覆蓋率 ≥ 90%）
- `features/*/domain/usecases/` 下所有 use case（覆蓋率 ≥ 90%）
- 容量計算、減載演算法、1RM 估算的**邊界情況**：空輸入、單組、暖身組、跨單位、極端 RPE

### 6.2 不強制要求測試的範圍

- 純展示型 widget（無業務邏輯）
- Firebase wrapper（手動整合測試即可）
- 自動產生的 Drift / freezed / riverpod 程式碼

### 6.3 測試風格

- 使用 `flutter_test` + `mocktail`，**禁止**用 `mockito`（reflection-based 慢且不安全）
- 測試命名：`test('should return X when Y given Z', ...)`
- AAA 結構（Arrange-Act-Assert），每個測試只驗證一個行為
- **禁止**在測試中使用真實 Firebase 連線，必須 mock

---

## 7. Git / PR 流程

### 7.1 分支命名

- 功能：`feat/short-description`
- 修復：`fix/short-description`
- 重構：`refactor/short-description`
- 文件：`docs/short-description`

### 7.2 Commit 訊息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(workout): add rest timer with background notification
fix(volume): correct multi-muscle weight factor calculation
refactor(database): migrate exercises table to use UUID
```

### 7.3 PR 自我檢查清單

提交 PR 前 AI **必須**確認：

- [ ] `flutter analyze` 無 warning / error
- [ ] `dart format .` 已執行
- [ ] 新增的純邏輯有對應單元測試
- [ ] 沒有違反第 2 節的分層規則
- [ ] 沒有引入未經討論的新依賴
- [ ] schema 變更有對應 migration
- [ ] 文字字串走 i18n（`AppLocalizations.of(context).xxx`），**禁止**硬編碼中英文

---

## 8. 文件與註解

- README 與本文件以**繁體中文**為主，程式碼註解可中英混用
- 複雜演算法必須在函式上方寫**為什麼**這樣做，而不是**做了什麼**（程式碼本身已說明 what）
- TODO 必須帶 issue 編號或日期：`// TODO(#42): handle deload override`，**禁止**裸 TODO

---

## 9. 不要做的事（Hard No）

以下行為會直接被駁回，無論 PR 多漂亮：

1. ❌ 在 `domain` 層 import `package:flutter/...` 或 `package:drift/...`
2. ❌ 用 `print()` 做日誌（用 `logger` 套件）
3. ❌ 在 widget build 方法裡做 IO 或重型運算
4. ❌ 在 `main()` 做網路請求（會拖慢啟動，違反 1.5 秒目標）
5. ❌ 引入新的 BaaS / 後端服務（除非先更新技術設計）
6. ❌ 為了「看起來簡單」而省略單位欄位、把 weight 強制轉成 kg 儲存
7. ❌ 直接修改 generated 檔案（`*.g.dart`、`*.freezed.dart`）
8. ❌ 在沒有 `if (kDebugMode)` 守護下使用 `debugPrint` 或斷言副作用
9. ❌ 為了趕功能跳過測試（會在 code review 階段被打回）
10. ❌ 在沒讀過 `TECH_DESIGN.md` 第 4 節的情況下動容量計算或減載邏輯

---

## 10. 任務執行優先順序

當 AI 收到模糊或衝突的指令時，按以下順序裁決：

1. **使用者安全與資料正確性** — 例如不能因為「跑得快一點」而捨棄單位欄位
2. **PRD 的非功能性需求** — 1.5 秒啟動、離線優先、自動保存
3. **本文件的架構紀律** — 分層、純函式、命名
4. **本文件的編碼規範** — freezed、Riverpod、Conventional Commits
5. **編碼風格偏好** — 行寬、命名細節等

當不確定時：**停下來問人類**，而不是擅自決定。

---

## 11. 何時可以打破規則

本文件不是法律。當你發現某條規則明顯不合理（例如某個第三方套件強制要求違反命名慣例），請：

1. 在 PR 描述中明確指出**哪一條規則**被違反
2. 解釋**為什麼**這個情況下違反是合理的
3. 提出**替代方案**（如果有）

教條式遵守規則導致的糟糕程式碼，比違反規則更糟。但在還不熟悉本專案的情況下，**預設應遵守規則**。
