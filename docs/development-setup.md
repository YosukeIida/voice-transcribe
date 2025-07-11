# Voice Transcribe Chrome Extension - 開発環境セットアップガイド

## 必要な環境

- Docker Desktop (最新版)
- Chrome ブラウザ (最新版)
- Git
- GitHub CLI (`gh`)
- VS Code (推奨)
- OpenAI APIキー

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/[your-username]/voice-transcribe.git
cd voice-transcribe
```

### 2. Docker環境の起動

```bash
# Dockerコンテナをビルド・起動
docker-compose up -d

# コンテナに入る（必要に応じて）
docker-compose exec app bash
```

### 3. 依存関係のインストール

```bash
# Dockerコンテナ内で実行
docker-compose exec app pnpm install
```

### 4. 開発サーバーの起動

```bash
# 開発モードで起動
docker-compose exec app pnpm dev
```

### 5. Chrome拡張機能の読み込み

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトの `dist` フォルダを選択

注意: 初回は `dist` フォルダが存在しないため、`pnpm dev` を実行してビルドを生成する必要があります。

## 開発フロー

### ファイル構成

```
voice-transcribe/
├── src/
│   ├── background/      # バックグラウンドスクリプト
│   │   └── index.ts
│   ├── content/         # コンテンツスクリプト
│   │   ├── index.ts
│   │   └── audio-permission.html
│   ├── popup/           # ポップアップUI
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── styles.module.css  # CSS Modules
│   ├── shared/          # 共有モジュール
│   ├── types/           # 型定義
│   │   └── css-modules.d.ts
│   └── manifest.ts      # Chrome拡張機能マニフェスト
├── public/
│   └── icons/          # アイコンファイル
├── dist/               # ビルド出力（自動生成）
└── vite.config.ts      # Viteビルド設定
```

### 開発コマンド

```bash
# 開発サーバー起動（ホットリロード対応）
docker-compose exec app pnpm dev

# プロダクションビルド
docker-compose exec app pnpm build

# TypeScriptの型チェック
docker-compose exec app pnpm check

# ESLintによるコードチェック
docker-compose exec app pnpm lint

# コードフォーマット
docker-compose exec app pnpm format
```

### ホットリロード

開発中は、ソースコードを変更すると自動的に拡張機能が再ビルドされます。ただし、以下の変更時は手動でリロードが必要です：

1. `manifest.ts` の変更
2. バックグラウンドスクリプトの変更
3. コンテンツスクリプトの変更

リロード方法：
- Chrome拡張機能ページで「更新」ボタンをクリック
- または `Ctrl+R` / `Cmd+R` で拡張機能ページをリロード

## APIキーの設定

1. [OpenAI Platform](https://platform.openai.com/) でAPIキーを取得
2. Chrome拡張機能のポップアップを開く
3. APIキー入力欄にキーを入力して保存

注意: APIキーは `chrome.storage.local` に保存され、暗号化されます。

## トラブルシューティング

### よくある問題

#### 1. `pnpm: command not found`

Dockerコンテナ内で実行していることを確認してください：
```bash
docker-compose exec app pnpm install
```

#### 2. 拡張機能が読み込めない

- `dist` フォルダが存在することを確認
- Chrome拡張機能ページでエラーメッセージを確認
- `pnpm build` を実行してから再度読み込み

#### 3. TypeScriptエラー

初回セットアップ時は、依存関係がインストールされるまでエラーが表示されます：
```bash
docker-compose exec app pnpm install
```

#### 4. Notionでテキストが挿入されない

- Notionのページが完全に読み込まれていることを確認
- コンソールでエラーメッセージを確認（F12で開発者ツールを開く）
- コンテンツスクリプトが正しく注入されているか確認

### デバッグ方法

#### バックグラウンドスクリプト
1. `chrome://extensions/` を開く
2. 拡張機能の「Service Worker」をクリック
3. Chrome DevToolsが開き、コンソールログを確認可能

#### コンテンツスクリプト
1. Notionページを開く
2. F12で開発者ツールを開く
3. コンソールタブで `Voice Transcribe:` で始まるログを確認

#### ポップアップ
1. 拡張機能アイコンを右クリック
2. 「ポップアップを検証」を選択
3. Chrome DevToolsが開く

## VS Code Dev Container

VS Code の Dev Container 機能を使用すると、自動的に適切な開発環境が構築されます：

1. VS Code で「Remote-Containers」拡張機能をインストール
2. プロジェクトフォルダを開く
3. 左下の「><」アイコンをクリック
4. 「Reopen in Container」を選択

自動的に以下が設定されます：
- Node.js 20 + pnpm環境
- 推奨VS Code拡張機能
- ESLint/Prettier設定

## 次のステップ

開発環境のセットアップが完了したら、以下のドキュメントを参照してください：

- [Issue一覧](./issues-detail.md) - 実装予定の機能
- [API統合ガイド](./api-integration.md) - OpenAI API統合の詳細
- [コントリビューションガイド](../CONTRIBUTING.md) - PRの作成方法

## 参考リンク

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Preact Documentation](https://preactjs.com/)