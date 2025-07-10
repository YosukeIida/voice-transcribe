# Voice Transcribe Chrome Extension - プロジェクトマイルストーン

## マイルストーン概要

### v1.0.0 - MVP リリース
**期限**: 開発開始から2ヶ月
**目標**: 基本的な音声認識とNotion挿入機能を持つ最小限の動作可能な製品

**含まれる機能**:
- ✅ プロジェクトセットアップ完了
- ✅ リアルタイム音声キャプチャ
- ✅ GPT-4o-Transcribe APIによる音声認識
- ✅ Notion Web UIへのテキスト挿入
- ✅ 基本的なUI（録音開始/停止）
- ✅ ドキュメンテーション

**成功指標**:
- 5分間の連続録音が可能
- 認識精度90%以上
- Notionへの挿入成功率95%以上

### v1.1.0 - 機能拡張リリース
**期限**: v1.0.0から1ヶ月後
**目標**: ユーザビリティの向上と追加機能の実装

**含まれる機能**:
- ✅ 要約機能の実装
- ✅ ファイルアップロード対応
- ✅ UIの改善とフィードバック強化
- ✅ 設定画面の追加

**成功指標**:
- 要約精度の検証完了
- 25MB以上のファイル処理対応
- ユーザー満足度向上

### v1.2.0 - パフォーマンス最適化
**期限**: v1.1.0から3週間後
**目標**: 安定性とパフォーマンスの向上

**含まれる機能**:
- ✅ メモリ使用量の最適化
- ✅ ネットワーク通信の効率化
- ✅ エラーハンドリングの強化
- ✅ バッテリー消費の改善

### v2.0.0 - メジャーアップデート
**期限**: v1.2.0から2ヶ月後
**目標**: 大規模な機能追加と改善

**検討機能**:
- 複数言語サポート
- カスタマイズ可能な要約テンプレート
- 音声コマンド対応
- Notion以外のプラットフォーム対応

## マイルストーン作成コマンド

```bash
# v1.0.0 - MVP リリース
gh api repos/{owner}/{repo}/milestones \
  --method POST \
  -f title="v1.0.0 - MVP Release" \
  -f description="基本的な音声認識とNotion挿入機能を持つ最小限の動作可能な製品" \
  -f due_on="2025-09-10T23:59:59Z" \
  -f state="open"

# v1.1.0 - 機能拡張リリース
gh api repos/{owner}/{repo}/milestones \
  --method POST \
  -f title="v1.1.0 - Feature Enhancement" \
  -f description="要約機能とファイルアップロード対応" \
  -f due_on="2025-10-10T23:59:59Z" \
  -f state="open"

# v1.2.0 - パフォーマンス最適化
gh api repos/{owner}/{repo}/milestones \
  --method POST \
  -f title="v1.2.0 - Performance Optimization" \
  -f description="安定性とパフォーマンスの向上" \
  -f due_on="2025-10-31T23:59:59Z" \
  -f state="open"

# v2.0.0 - メジャーアップデート
gh api repos/{owner}/{repo}/milestones \
  --method POST \
  -f title="v2.0.0 - Major Update" \
  -f description="大規模な機能追加と改善" \
  -f due_on="2025-12-31T23:59:59Z" \
  -f state="open"
```

## ラベル作成コマンド

プロジェクトで使用するラベルの作成:

```bash
# タスクタイプ
gh label create "task" -d "開発タスク" -c "0E8A16"
gh label create "bug" -d "バグ報告" -c "D73A4A"
gh label create "enhancement" -d "機能改善" -c "A2EEEF"
gh label create "documentation" -d "ドキュメント" -c "0075CA"

# 優先度
gh label create "priority:high" -d "高優先度" -c "D93F0B"
gh label create "priority:medium" -d "中優先度" -c "FBCA04"
gh label create "priority:low" -d "低優先度" -c "0E8A16"

# コンポーネント
gh label create "setup" -d "セットアップ関連" -c "C2E0C6"
gh label create "feature" -d "機能実装" -c "7057FF"
gh label create "api-integration" -d "API統合" -c "008672"
gh label create "ui" -d "ユーザーインターフェース" -c "E99695"
gh label create "subtask" -d "サブタスク" -c "EEEEEE"

# ステータス
gh label create "in-progress" -d "作業中" -c "1D76DB"
gh label create "blocked" -d "ブロック中" -c "E4E669"
gh label create "review-needed" -d "レビュー待ち" -c "D876E3"
```

## プロジェクトボード設定

GitHub Projectsを使用したカンバンボードの設定:

1. **カラム構成**:
   - 📋 Backlog（バックログ）
   - 🏃 In Progress（作業中）
   - 👀 Review（レビュー）
   - ✅ Done（完了）

2. **自動化ルール**:
   - 新規Issueは自動的にBacklogへ
   - PRが作成されたらReviewへ
   - PRがマージされたらDoneへ

## 開発フロー

1. **Issue作成**: 上記コマンドでIssueを作成
2. **ブランチ作成**: `feature/issue-番号-概要` 形式
3. **開発**: ローカルで開発・テスト
4. **PR作成**: PRテンプレートに従って作成
5. **レビュー**: 最低1名のレビュー必須
6. **マージ**: squash mergeを推奨

## リリースプロセス

1. **バージョンタグ**: `v1.0.0` 形式でタグ付け
2. **リリースノート**: 変更内容を記載
3. **Chrome Web Store**: 審査提出
4. **アナウンス**: READMEとドキュメント更新