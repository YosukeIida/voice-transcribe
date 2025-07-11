# Voice Transcribe Chrome Extension

OpenAI GPT-4o-Transcribeを使用したリアルタイム音声認識Chrome拡張機能。音声をテキストに変換し、Notion Web UIに直接挿入します。

## 🌟 主な機能

- 🎤 **リアルタイム音声認識**: マイクから音声をキャプチャし、GPT-4o-Transcribeでテキスト化
- 📝 **Notion直接挿入**: API不要でNotion Web UIに直接テキストを挿入
- 📄 **ファイル対応**: MP4、MP3、WAVなどの音声/動画ファイルの文字起こし
- 🤖 **要約機能**: 長い音声認識結果をAIで要約
- 🔒 **プライバシー重視**: APIキーは安全にローカル保存

## 📋 プロジェクトセットアップ

### 前提条件

- Docker Desktop
- GitHub CLI (`gh`)
- Chrome ブラウザ
- OpenAI APIキー

### 開発環境のセットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/[your-username]/voice-transcribe.git
cd voice-transcribe
```

2. **GitHub Issueの作成**
```bash
# GitHub CLIでログイン
gh auth login

# マイルストーンとラベルの作成（docs/project-milestones.mdを参照）
# Issueの作成（docs/github-issue-commands.mdを参照）
```

3. **Docker環境の起動**
```bash
docker-compose up -d
```

4. **依存関係のインストール**
```bash
docker-compose exec app pnpm install
```

5. **開発サーバーの起動**
```bash
docker-compose exec app pnpm dev
```

6. **拡張機能の読み込み**
- Chrome で `chrome://extensions/` を開く
- 「デベロッパーモード」を有効化
- 「パッケージ化されていない拡張機能を読み込む」をクリック
- `dist` フォルダを選択

## 🚀 使い方

1. Chrome拡張機能アイコンをクリック
2. OpenAI APIキーを設定（初回のみ）
3. Notionページを開く
4. 「録音開始」ボタンをクリック
5. 話した内容が自動的にNotionに挿入される

## 🏗️ アーキテクチャ

```
voice-transcribe/
├── .github/              # GitHub設定
│   ├── ISSUE_TEMPLATE/   # Issueテンプレート
│   └── pull_request_template.md
├── docs/                 # ドキュメント
│   ├── issues-detail.md  # 詳細なIssue一覧
│   ├── github-issue-commands.md  # Issue作成コマンド
│   └── project-milestones.md     # マイルストーン設定
├── src/                  # ソースコード
│   ├── background/       # バックグラウンドスクリプト
│   ├── content/          # コンテンツスクリプト
│   ├── popup/            # ポップアップUI
│   └── shared/           # 共通モジュール
├── docker-compose.yml    # Docker設定
├── Dockerfile           # Dockerイメージ定義
├── manifest.json        # Chrome拡張機能マニフェスト
├── package.json         # npm設定
└── vite.config.ts       # Viteビルド設定
```

## 📚 ドキュメント

- [詳細なIssue一覧](docs/issues-detail.md)
- [GitHub Issue作成コマンド](docs/github-issue-commands.md)
- [プロジェクトマイルストーン](docs/project-milestones.md)

## 🤝 コントリビューション

1. Issueを確認または作成
2. フィーチャーブランチを作成 (`feature/issue-番号-概要`)
3. 変更をコミット
4. プルリクエストを作成（PRテンプレートに従う）

## 📜 ライセンス

MIT License

## 🙏 謝辞

- OpenAI GPT-4o-Transcribe
- Chrome Extension API
- Vite
- React

---

**注意**: このプロジェクトは開発中です。本番環境での使用は推奨されません。
