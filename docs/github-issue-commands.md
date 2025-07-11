# GitHub Issue 作成コマンド一覧

以下のコマンドを順番に実行してください。各コマンドはGitHub CLIの`gh`コマンドを使用しています。

## メインIssueの作成

### Issue #1: プロジェクトセットアップと設定
```bash
gh issue create \
  --title "[TASK] プロジェクトセットアップと設定" \
  --body "## タスクの概要
Chrome拡張機能のプロジェクト基盤を構築します。Docker開発環境、Node.js/pnpmの設定、Manifest V3の設定、ビルドシステムの構築を行います。

## 詳細説明
このタスクでは、開発環境の標準化と効率的な開発フローの確立を目指します。Dockerコンテナによる環境の統一、TypeScriptとViteによるモダンな開発体験の提供、Chrome拡張機能Manifest V3への完全対応を実現します。

## 実装内容
- [ ] Docker開発環境の構築
- [ ] Node.jsプロジェクトの初期化
- [ ] Chrome拡張機能Manifest V3の設定
- [ ] ビルドシステムの構築
- [ ] 開発環境ドキュメントの作成

## 受け入れ条件
- Dockerコンテナ内で開発環境が動作すること
- pnpmによる依存関係管理が機能すること
- Chrome拡張機能として読み込み可能なビルドが生成されること
- 開発手順がREADMEに記載されていること

## 関連Issue
なし

## 参考資料
- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Vite Chrome Extension Plugin](https://github.com/crxjs/chrome-extension-tools)" \
  --label "task,setup" \
  --milestone "v1.0.0"
```

### Issue #2: マイク音声キャプチャ機能
```bash
gh issue create \
  --title "[TASK] マイク音声キャプチャ機能の実装" \
  --body "## タスクの概要
ユーザーのマイクからリアルタイムで音声をキャプチャする機能を実装します。

## 詳細説明
Chrome拡張機能コンテキストでのgetUserMedia APIの使用、権限取得フロー、音声ストリーム処理、録音制御機能を実装します。iframeを使った権限取得の回避策も含みます。

## 実装内容
- [ ] getUserMedia権限取得の実装
- [ ] 音声ストリーム処理の実装
- [ ] 録音制御機能の実装
- [ ] 音声データ変換処理

## 受け入れ条件
- マイク権限の取得が正常に動作すること
- 音声の録音開始/停止が制御できること
- 音声データがWebM Opus形式で取得できること
- エラーハンドリングが適切に実装されていること

## 関連Issue
- #1

## 参考資料
- [MediaStream Recording API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)" \
  --label "task,feature" \
  --milestone "v1.0.0"
```

### Issue #3: OpenAI GPT-4o-Transcribe API統合
```bash
gh issue create \
  --title "[TASK] OpenAI GPT-4o-Transcribe API統合" \
  --body "## タスクの概要
OpenAIのGPT-4o-Transcribe APIと連携し、リアルタイム音声認識機能を実装します。

## 詳細説明
WebSocketによるストリーミング音声認識の実装を優先し、REST APIフォールバックも用意します。APIキーの安全な管理とエラーハンドリングも含みます。

## 実装内容
- [ ] WebSocket接続の実装
- [ ] ストリーミング音声送信の実装
- [ ] REST APIフォールバックの実装
- [ ] APIキー管理システム
- [ ] API エラーハンドリング

## 受け入れ条件
- WebSocket経由でリアルタイム音声認識が動作すること
- APIキーが安全に保存・使用されること
- ネットワークエラー時の適切な処理
- レート制限への対応

## 関連Issue
- #2

## 参考資料
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)" \
  --label "task,api-integration" \
  --milestone "v1.0.0"
```

### Issue #4: Notion Web UI統合
```bash
gh issue create \
  --title "[TASK] Notion Web UI統合（DOM操作）" \
  --body "## タスクの概要
Notion Web UIに対して、認識したテキストを直接挿入する機能を実装します（API非使用）。

## 詳細説明
Content Scriptを使用してNotionのDOM構造を解析し、適切な位置にテキストを挿入します。React/仮想DOMを考慮した実装が必要です。

## 実装内容
- [ ] Notion DOM構造の調査と対応
- [ ] テキスト挿入メカニズムの実装
- [ ] カーソル位置管理
- [ ] リアルタイム挿入最適化

## 受け入れ条件
- Notionページ内の適切な位置にテキストが挿入されること
- カーソル位置が維持されること
- Notionの機能を妨げないこと
- パフォーマンスが良好であること

## 関連Issue
- #3

## 参考資料
- [ContentEditable API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)
- [Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)" \
  --label "task,feature" \
  --milestone "v1.0.0"
```

### Issue #5: 要約機能の実装
```bash
gh issue create \
  --title "[TASK] 要約機能の実装" \
  --body "## タスクの概要
長い音声認識結果を要約する機能を実装します。

## 詳細説明
GPT-4またはGPT-3.5-turboを使用して、音声認識結果のテキストを要約します。自動要約と手動要約の両方をサポートします。

## 実装内容
- [ ] 要約API統合
- [ ] 要約タイミング制御
- [ ] 長文処理戦略

## 受け入れ条件
- 要約が正確で有用であること
- 長文でも適切に処理できること
- ユーザーが要約タイミングを制御できること

## 関連Issue
- #3
- #4

## 参考資料
- [OpenAI API - Chat Completions](https://platform.openai.com/docs/api-reference/chat)" \
  --label "task,enhancement" \
  --milestone "v1.1.0"
```

### Issue #6: ユーザーインターフェースの実装
```bash
gh issue create \
  --title "[TASK] ユーザーインターフェースの実装" \
  --body "## タスクの概要
Chrome拡張機能のポップアップUIと制御フローを実装します。

## 詳細説明
React/Preactを使用したモダンなUIの構築、状態管理、拡張機能内のメッセージングシステムを実装します。

## 実装内容
- [ ] ポップアップUI実装
- [ ] 状態管理システム
- [ ] メッセージング実装
- [ ] フィードバックシステム

## 受け入れ条件
- 直感的で使いやすいUIであること
- 録音状態が明確に表示されること
- エラーや状態変更が適切に通知されること

## 関連Issue
- #2
- #3
- #4
- #5

## 参考資料
- [Chrome Extension UI Guidelines](https://developer.chrome.com/docs/extensions/mv3/user_interface/)
- [React Documentation](https://react.dev/)" \
  --label "task,ui" \
  --milestone "v1.0.0"
```

### Issue #7: ファイルアップロード機能
```bash
gh issue create \
  --title "[TASK] ファイルアップロード機能の実装" \
  --body "## タスクの概要
音声/動画ファイルをアップロードして文字起こしする機能を実装します。

## 詳細説明
MP4、MP3、WAVなどのファイルを受け付け、GPT-4o-Transcribeで文字起こしを行います。大容量ファイルへの対応も含みます。

## 実装内容
- [ ] ファイル選択UI
- [ ] ファイル処理エンジン
- [ ] 大容量ファイル対応

## 受け入れ条件
- 主要な音声/動画形式がサポートされること
- 25MB以上のファイルも処理できること
- 進捗が表示されること

## 関連Issue
- #3
- #4
- #6

## 参考資料
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [Web Audio API - Decoding Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#audio_sources)" \
  --label "task,enhancement" \
  --milestone "v1.1.0"
```

### Issue #8: ドキュメンテーションとリリース準備
```bash
gh issue create \
  --title "[TASK] ドキュメンテーションとリリース準備" \
  --body "## タスクの概要
プロジェクトのドキュメント作成とChrome Web Storeへのリリース準備を行います。

## 詳細説明
ユーザー向けと開発者向けのドキュメント、テスト戦略、Chrome Web Store公開に必要な資料を準備します。

## 実装内容
- [ ] ユーザードキュメント
- [ ] 開発者ドキュメント
- [ ] テスト戦略
- [ ] Chrome Web Storeリリース準備

## 受け入れ条件
- 包括的なドキュメントが用意されていること
- テストカバレッジが十分であること
- Chrome Web Storeの審査要件を満たしていること

## 関連Issue
- すべてのIssue

## 参考資料
- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)" \
  --label "task,documentation" \
  --milestone "v1.0.0"
```

## サブタスクの作成（各メインIssueの後に実行）

### Issue #1のサブタスク
```bash
# 1-1: Docker開発環境の構築
gh issue create \
  --title "[TASK] Docker開発環境の構築" \
  --body "## タスクの概要
Dockerを使用した開発環境を構築します。

## 実装内容
- [ ] Dockerfileの作成（Node.js 20, pnpm環境）
- [ ] docker-compose.ymlの作成
- [ ] VS Code Dev Container設定
- [ ] ボリュームマウントの設定

## 受け入れ条件
- Dockerコンテナが正常に起動すること
- pnpmコマンドが使用できること
- ホットリロードが機能すること

## 関連Issue
- #1" \
  --label "task,subtask,setup" \
  --milestone "v1.0.0"

# 他のサブタスクも同様に作成...
```

## 実行方法

1. GitHub CLIがインストールされていることを確認
```bash
gh --version
```

2. GitHub認証を行う
```bash
gh auth login
```

3. リポジトリに移動
```bash
cd /path/to/voice-transcribe
```

4. 上記のコマンドを順番に実行