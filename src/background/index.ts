/// <reference types="chrome" />

import { formatDataSize } from '../utils/audio-processor';

// Chrome拡張機能のバックグラウンドスクリプト
let isRecording = false;
let isPaused = false;
let recordingTabId: number | null = null;
let audioDataBuffer: { data: string; mimeType: string; timestamp: number }[] = [];
let currentRecordingMimeType: string = '';

interface MessageRequest {
  action: string;
  text?: string;
  streamId?: string;
  mimeType?: string;
  error?: string;
  errorType?: string;
  data?: string;
  timestamp?: number;
  size?: number;
}

// Offscreen Document管理（一度だけ作成して再利用）
let offscreenReady: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  // 既にREADY待ちPromiseがあればそれを返す
  if (offscreenReady) {
    console.log('既存のOffscreen Documentを再利用します');
    return offscreenReady;
  }

  offscreenReady = (async () => {
    try {
      const path = 'src/offscreen/offscreen.html';

      // 既存のOffscreen Documentがあるかチェック
      const exists = await chrome.offscreen.hasDocument();

      if (!exists) {
        // Offscreen Documentを作成
        await chrome.offscreen.createDocument({
          url: chrome.runtime.getURL(path),
          reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
          justification: 'Recording audio for real-time transcription',
        });
        console.log('Offscreen Documentを作成しました');
      } else {
        console.log('既存のOffscreen Documentが見つかりました');
      }

      // ポートベースでREADYシグナルを受信
      await waitForOffscreenReady();
    } catch (error) {
      console.error('Offscreen Document作成エラー:', error);
      offscreenReady = null; // エラー時はリセット
      throw error;
    }
  })();

  return offscreenReady;
}

// Offscreen DocumentからのREADYシグナルを待つ（ポートベース）
function waitForOffscreenReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Offscreen Document READY timeout'));
    }, 5000); // 5秒でタイムアウト

    try {
      const port = chrome.runtime.connect({ name: 'offscreen' });

      port.onMessage.addListener((msg: any) => {
        if (
          msg &&
          typeof msg === 'object' &&
          'type' in msg &&
          (msg as { type: string }).type === 'READY'
        ) {
          clearTimeout(timeout);
          console.log('Offscreen Document READYシグナルを受信しました');
          resolve();
        }
      });

      port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
          clearTimeout(timeout);
          reject(new Error(`Port disconnected: ${chrome.runtime.lastError.message}`));
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function closeOffscreenDocument(): Promise<void> {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();
    if (hasDocument) {
      await chrome.offscreen.closeDocument();
      console.log('Offscreen Documentを閉じました');
    }
  } catch (error) {
    console.error('Offscreen Document終了エラー:', error);
  }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request: MessageRequest, _sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      void startRecording();
      sendResponse({ success: true });
      break;

    case 'stopRecording':
      void stopRecording();
      sendResponse({ success: true });
      break;

    case 'pauseRecording':
      pauseRecording();
      sendResponse({ success: true });
      break;

    case 'resumeRecording':
      resumeRecording();
      sendResponse({ success: true });
      break;

    case 'getRecordingStatus':
      sendResponse({
        isRecording,
        isPaused,
        mimeType: currentRecordingMimeType,
        bufferSize: audioDataBuffer.length,
      });
      break;

    case 'insertText':
      if (request.text && recordingTabId) {
        void chrome.tabs.sendMessage(recordingTabId, {
          action: 'insertText',
          text: request.text,
        });
      }
      break;

    case 'offscreenReady':
      // Offscreen DocumentからのREADYシグナル（waitForOffscreenReady()で処理）
      console.log('Offscreen READYシグナルを受信しました');
      sendResponse({ success: true });
      break;

    // Content scriptからのメッセージ処理
    case 'permissionGranted':
      console.log('マイク権限が許可されました:', request.streamId);
      if (request.mimeType) {
        currentRecordingMimeType = request.mimeType;
      }
      break;

    case 'permissionDenied':
      console.error('マイク権限が拒否されました:', request.error);
      isRecording = false;
      updateIcon(false);
      break;

    case 'recordingStarted':
      console.log('録音が開始されました');
      audioDataBuffer = [];
      break;

    case 'recordingStopped':
      console.log('録音が停止されました');
      break;

    case 'recordingPaused':
      console.log('録音が一時停止されました');
      isPaused = true;
      break;

    case 'recordingResumed':
      console.log('録音が再開されました');
      isPaused = false;
      break;

    case 'audioDataChunk':
      // 音声データチャンクを受信
      if (request.data && request.mimeType) {
        audioDataBuffer.push({
          data: request.data,
          mimeType: request.mimeType,
          timestamp: request.timestamp || Date.now(),
        });
        console.log(`音声データチャンクを受信: ${audioDataBuffer.length}個`);
      }
      break;

    case 'recordingComplete':
      // 録音完了
      console.log('録音完了:', {
        size: request.size,
        mimeType: request.mimeType,
        totalChunks: audioDataBuffer.length,
      });
      // ここで音声データの処理（API送信など）を行う
      if (request.data && request.mimeType) {
        void processAudioDataForAPI(request.data, request.mimeType);
      }
      break;

    case 'recordingError':
      console.error('録音エラー:', request.error);
      isRecording = false;
      isPaused = false;
      updateIcon(false);
      break;
  }
  return true;
});

// 録音開始
async function startRecording() {
  try {
    isRecording = true;
    isPaused = false;
    audioDataBuffer = [];

    // 録音状態をstorageに保存
    await chrome.storage.local.set({ isRecording: true });

    // 現在のアクティブタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url?.includes('notion.so')) {
      recordingTabId = tab.id;

      // Offscreen Documentを作成（READYシグナルを待つ）
      await ensureOffscreenDocument();

      // Offscreen Documentに録音開始を通知
      try {
        await chrome.runtime.sendMessage({ action: 'startRecording' });
        console.log('Offscreen Documentに録音開始メッセージを送信しました');
      } catch (error) {
        console.error('Offscreen Documentへのメッセージ送信エラー:', error);
        throw error;
      }

      // アイコンを録音中の状態に変更
      updateIcon(true);

      console.log('録音を開始しました（Offscreen Document使用）');
    } else {
      console.error('Notionのタブが見つかりません');
      isRecording = false;
      // 録音状態をstorageに保存
      await chrome.storage.local.set({ isRecording: false });
      // エラー通知をポップアップに送信
      void chrome.runtime.sendMessage({
        action: 'recordingError',
        error: 'Notionのタブでのみ録音できます',
      });
    }
  } catch (error) {
    console.error('録音開始エラー:', error);
    isRecording = false;
    await chrome.storage.local.set({ isRecording: false });
    updateIcon(false);
  }
}

// 録音停止
async function stopRecording() {
  try {
    isRecording = false;
    isPaused = false;

    // 録音状態をstorageに保存
    await chrome.storage.local.set({ isRecording: false });

    // Offscreen Documentに録音停止を通知
    await chrome.runtime.sendMessage({ action: 'stopRecording' }).catch(() => {
      // Offscreen Documentが存在しない場合は無視
      console.log('Offscreen Documentが見つかりません（既に停止済み）');
    });

    // Offscreen Documentを閉じる
    await closeOffscreenDocument();

    if (recordingTabId) {
      recordingTabId = null;
    }

    // アイコンを通常の状態に戻す
    updateIcon(false);

    console.log('録音を停止しました');
  } catch (error) {
    console.error('録音停止エラー:', error);
    updateIcon(false);
  }
}

// 録音一時停止
function pauseRecording() {
  if (isRecording && !isPaused && recordingTabId) {
    isPaused = true;
    // コンテンツスクリプトに一時停止を通知
    void chrome.tabs.sendMessage(recordingTabId, { action: 'pauseRecording' });
  }
}

// 録音再開
function resumeRecording() {
  if (isRecording && isPaused && recordingTabId) {
    isPaused = false;
    // コンテンツスクリプトに再開を通知
    void chrome.tabs.sendMessage(recordingTabId, { action: 'resumeRecording' });
  }
}

// アイコンを更新
function updateIcon(recording: boolean) {
  if (recording) {
    void chrome.action.setIcon({
      path: {
        '16': 'icons/icon-recording-16.png',
        '32': 'icons/icon-recording-32.png',
        '48': 'icons/icon-recording-48.png',
        '128': 'icons/icon-recording-128.png',
      },
    });
  } else {
    void chrome.action.setIcon({
      path: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    });
  }
}

// 音声データを処理
async function processAudioDataForAPI(base64Data: string, mimeType: string) {
  try {
    // Base64データサイズを計算
    const dataSize = Math.ceil((base64Data.length * 3) / 4);

    console.log('音声データの処理を開始:', {
      dataLength: base64Data.length,
      estimatedSize: formatDataSize(dataSize),
      mimeType: mimeType,
    });

    // TODO: ここでOpenAI APIに送信する処理を実装
    // const response = await sendToOpenAIAPI(base64Data, mimeType);

    // 仮の処理時間をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 処理後、audioDataBufferをクリア
    audioDataBuffer = [];

    console.log('音声データの処理が完了しました');
  } catch (error) {
    console.error('音声データの処理中にエラーが発生しました:', error);
    // エラーをポップアップに通知
    void chrome.runtime.sendMessage({
      action: 'processingError',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener(() => {
  console.log('Voice Transcribe for Notion - インストール完了');

  // コンテキストメニューの作成（オプション）
  void chrome.contextMenus.create({
    id: 'voice-transcribe-start',
    title: '音声の文字起こしを開始',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.notion.so/*'],
  });
});

// Service Worker起動時の状態復元
chrome.runtime.onStartup.addListener(() => {
  void restoreRecordingState();
});

// Service Worker再起動時の状態復元
chrome.runtime.onConnect.addListener(() => {
  void restoreRecordingState();
});

// 録音状態を復元
async function restoreRecordingState() {
  try {
    const result = await chrome.storage.local.get(['isRecording']);
    if (result.isRecording) {
      isRecording = true;
      console.log('録音状態を復元しました');
      updateIcon(true);
    }
  } catch (error) {
    console.error('録音状態の復元に失敗しました:', error);
  }
}

// コンテキストメニューのクリックハンドラ
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === 'voice-transcribe-start' && !isRecording) {
    void startRecording();
  }
});

// タブが閉じられた時の処理
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === recordingTabId && isRecording) {
    void stopRecording();
  }
});

// ウィンドウフォーカスが変わった時の処理（オプション）
chrome.windows.onFocusChanged.addListener((windowId) => {
  void (async () => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // フォーカスが失われた場合は何もしない
      return;
    }

    // 録音中の場合、現在のタブがNotionかチェック
    if (isRecording && recordingTabId) {
      try {
        const tab = await chrome.tabs.get(recordingTabId);
        if (!tab.active || !tab.url?.includes('notion.so')) {
          // Notionタブがアクティブでない場合の処理
          console.log('Notionタブがアクティブではありません');
        }
      } catch (error) {
        // タブが存在しない場合
        console.error('録音中のタブが見つかりません:', error);
        void stopRecording();
      }
    }
  })();
});
