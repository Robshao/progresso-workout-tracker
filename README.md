# Progresso

Progresso 是一款離線優先的智慧健身容量追蹤器，面向需要追蹤漸進性超負荷、週容量與 RPE 疲勞訊號的中高階訓練者。

## 技術棧

- Flutter 3.x + Dart 3.x
- Riverpod 2.x
- Drift + SQLite
- Firebase Auth / Firestore / Analytics / Crashlytics 預留
- go_router
- fl_chart
- freezed / json_serializable
- flutter_local_notifications
- wakelock_plus

## 專案結構

```text
lib/
├── main.dart
├── app.dart
├── core/
│   ├── database/
│   ├── router/
│   ├── theme/
│   ├── utils/
│   └── constants/
├── features/
│   ├── workout/
│   ├── analytics/
│   ├── exercise_library/
│   ├── history/
│   ├── auth/
│   └── settings/
└── shared/
    ├── widgets/
    └── extensions/
```

## 啟動方式

此專案需要本機已安裝 Flutter SDK。

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## 測試

```bash
flutter test
```

目前已建立容量計算、重量單位轉換、1RM 估算與減載建議的單元測試骨架。

## 開發規範摘要

- `presentation -> domain -> data` 單向依賴
- `domain` 不 import Flutter / Drift / Firebase
- 容量計算、減載演算法、1RM 估算維持純函式
- 重量儲存原始數值與原始單位，計算前才轉 kg
- 少於 3 週資料時不觸發減載警告
- 訓練頁使用自訂數字鍵盤，不喚起系統鍵盤
