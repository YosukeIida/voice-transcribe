/// <reference types="chrome" />

// Notion Web UIに注入されるコンテンツスクリプト
let recordingActive = false;
let audioPermissionFrame: HTMLIFrameElement | null = null;
let _mediaRecorder: MediaRecorder | null = null; // content側では直接使用しない
let _audioChunks: Blob[] = []; // 音声データのバッファ
let permissionStatus: 'prompt' | 'granted' | 'denied' = 'prompt';
let recordingMimeType: string = '';

interface RequestMessage {
  action: string;
  text?: string;
}

interface PermissionMessageData {
  source?: string;
  type?: string;
  status?: 'prompt' | 'granted' | 'denied';
  streamId?: string;
  error?: string;
  errorType?: string;
  mimeType?: string;
  data?: string;
  timestamp?: number;
  size?: number;
  duration?: number;
}

// バックグラウンドスクリプトからのメッセージリスナー
chrome.runtime.onMessage.addListener(
  (
    request: RequestMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    if (request.action === 'startRecording') {
      void handleStartRecording().then((success) => sendResponse({ success }));
      return true; // 非同期レスポンスのために必要
    } else if (request.action === 'stopRecording') {
      void handleStopRecording().then((success) => sendResponse({ success }));
      return true;
    } else if (request.action === 'pauseRecording') {
      pauseRecording();
      sendResponse({ success: true });
      return false;
    } else if (request.action === 'resumeRecording') {
      resumeRecording();
      sendResponse({ success: true });
      return false;
    } else if (request.action === 'insertText' && request.text) {
      insertTextAtCursor(request.text);
      sendResponse({ success: true });
      return false;
    }
    return false;
  },
);

// 録音開始処理
async function handleStartRecording(): Promise<boolean> {
  try {
    console.log('Notion: 録音開始処理を開始');

    // 既に録音中の場合はスキップ
    if (recordingActive) {
      console.warn('既に録音中です');
      return false;
    }

    recordingActive = true;

    // マイク権限を取得
    const permissionGranted = await requestAudioPermission();

    if (!permissionGranted) {
      recordingActive = false;
      return false;
    }

    // 録音を開始
    startRecording();

    console.log('Notion: 録音を開始しました');
    return true;
  } catch (error) {
    console.error('録音開始エラー:', error);
    recordingActive = false;
    return false;
  }
}

// 録音を開始
function startRecording() {
  if (audioPermissionFrame && audioPermissionFrame.contentWindow) {
    audioPermissionFrame.contentWindow.postMessage(
      {
        source: 'voice-transcribe-content',
        action: 'startRecording',
        timeslice: 1000, // 1秒ごとにデータを取得
      },
      '*',
    );
  }
}

// 録音を一時停止
function pauseRecording() {
  if (audioPermissionFrame && audioPermissionFrame.contentWindow) {
    audioPermissionFrame.contentWindow.postMessage(
      {
        source: 'voice-transcribe-content',
        action: 'pauseRecording',
      },
      '*',
    );
  }
}

// 録音を再開
function resumeRecording() {
  if (audioPermissionFrame && audioPermissionFrame.contentWindow) {
    audioPermissionFrame.contentWindow.postMessage(
      {
        source: 'voice-transcribe-content',
        action: 'resumeRecording',
      },
      '*',
    );
  }
}

// 録音停止処理
async function handleStopRecording(): Promise<boolean> {
  try {
    recordingActive = false;

    // iframeに録音停止を通知
    if (audioPermissionFrame && audioPermissionFrame.contentWindow) {
      audioPermissionFrame.contentWindow.postMessage(
        {
          source: 'voice-transcribe-content',
          action: 'stopRecording',
        },
        '*',
      );
    }

    // iframeにストリーム解放を通知
    if (audioPermissionFrame && audioPermissionFrame.contentWindow) {
      audioPermissionFrame.contentWindow.postMessage(
        {
          source: 'voice-transcribe-content',
          action: 'releaseStream',
        },
        '*',
      );
    }

    // iframeを削除
    if (audioPermissionFrame) {
      // 少し遅延させてからiframeを削除（メッセージ送信を確実にするため）
      await new Promise((resolve) => setTimeout(resolve, 100));
      audioPermissionFrame?.remove();
      audioPermissionFrame = null;
    }

    // 音声データをクリア
    _audioChunks = [];
    _mediaRecorder = null;
    recordingMimeType = '';

    console.log('Notion: 録音を停止しました');
    return true;
  } catch (error) {
    console.error('録音停止エラー:', error);
    return false;
  }
}

// マイク権限を取得
async function requestAudioPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    // 権限が既に許可されている場合
    if (permissionStatus === 'granted' && audioPermissionFrame) {
      resolve(true);
      return;
    }

    // メッセージリスナーを設定
    const messageHandler = (event: MessageEvent<PermissionMessageData>) => {
      const data = event.data;
      if (data?.source !== 'voice-transcribe-permission') {
        return;
      }

      switch (data.type) {
        case 'permissionStatus':
          if (data.status) {
            permissionStatus = data.status;
          }
          break;

        case 'audioPermissionGranted':
          permissionStatus = 'granted';
          console.log('マイク権限が許可されました');
          if (data.mimeType) {
            recordingMimeType = data.mimeType;
            console.log('Recording MIME type:', recordingMimeType);
          }

          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'permissionGranted',
            streamId: data.streamId || '',
            mimeType: recordingMimeType,
          });

          window.removeEventListener('message', messageHandler);
          resolve(true);
          break;

        case 'audioPermissionDenied':
          permissionStatus = 'denied';
          console.error('マイク権限が拒否されました:', data.error);

          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'permissionDenied',
            error: data.error || '',
            errorType: data.errorType || '',
          });

          // エラー通知を表示
          showPermissionError(data.errorType || 'unknown', data.error || 'Unknown error');

          window.removeEventListener('message', messageHandler);
          resolve(false);
          break;

        case 'audioData':
          // 音声データを受信
          if (data.data) {
            handleAudioData(data.data, data.mimeType || '', data.timestamp || Date.now());
          }
          break;

        case 'recordingStarted':
          console.log('録音が開始されました');
          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'recordingStarted',
          });
          break;

        case 'recordingStopped':
          console.log('録音が停止されました');
          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'recordingStopped',
          });
          break;

        case 'recordingComplete':
          // 最終的な音声データを処理
          if (data.data) {
            console.log('録音完了:', {
              size: data.size,
              mimeType: data.mimeType,
              duration: data.duration,
            });
            handleRecordingComplete(data.data, data.mimeType || '', data.size || 0);
          }
          break;

        case 'recordingError':
          console.error('録音エラー:', data.error);
          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'recordingError',
            error: data.error || '',
          });
          break;

        case 'recordingPaused':
          console.log('録音が一時停止されました');
          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'recordingPaused',
          });
          break;

        case 'recordingResumed':
          console.log('録音が再開されました');
          // バックグラウンドスクリプトに通知
          void chrome.runtime.sendMessage({
            action: 'recordingResumed',
          });
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // iframeを作成または再利用
    if (!audioPermissionFrame) {
      createAudioPermissionFrame();
    } else {
      // 既存のiframeに権限リクエストを送信
      audioPermissionFrame.contentWindow?.postMessage(
        {
          source: 'voice-transcribe-content',
          action: 'requestPermission',
        },
        '*',
      );
    }

    // タイムアウト設定（30秒）
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      resolve(false);
    }, 30000);
  });
}

// 音声データを処理
function handleAudioData(base64Data: string, mimeType: string, timestamp: number) {
  // Base64データをBlobに変換
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  _audioChunks.push(blob);

  // バックグラウンドスクリプトに音声データを送信
  void chrome.runtime.sendMessage({
    action: 'audioDataChunk',
    data: base64Data,
    mimeType: mimeType,
    timestamp: timestamp,
  });
}

// 録音完了時の処理
function handleRecordingComplete(base64Data: string, mimeType: string, size: number) {
  // バックグラウンドスクリプトに完了を通知
  void chrome.runtime.sendMessage({
    action: 'recordingComplete',
    data: base64Data,
    mimeType: mimeType,
    size: size,
  });
}

// エラー通知を表示
function showPermissionError(errorType: string, message: string) {
  // Notionのトースト通知スタイルでエラーを表示
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #e85d75;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideUp 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  let errorMessage = message;
  if (errorType === 'denied') {
    errorMessage = 'マイクへのアクセスが拒否されました。ブラウザの設定から許可してください。';
  } else if (errorType === 'no_device') {
    errorMessage = 'マイクが見つかりません。マイクが接続されているか確認してください。';
  }

  toast.textContent = errorMessage;
  document.body.appendChild(toast);

  // 5秒後に自動的に削除
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 5000);
}

// テキストをカーソル位置に挿入
function insertTextAtCursor(text: string) {
  const activeElement = document.activeElement;

  // Notionのcontenteditableな要素を確認
  if (activeElement && isContentEditable(activeElement)) {
    // execCommandを使用してテキストを挿入
    document.execCommand('insertText', false, text);

    // 挿入後にフォーカスを維持
    (activeElement as HTMLElement).focus();
  } else {
    // アクティブな要素がない場合は、Notionの編集可能な要素を探す
    const editableElement = findNotionEditableElement();
    if (editableElement) {
      editableElement.focus();
      document.execCommand('insertText', false, text);
    } else {
      console.warn('Notion: 編集可能な要素が見つかりません');
    }
  }
}

// 要素がcontentEditableかどうかをチェック
function isContentEditable(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  return (
    htmlElement.contentEditable === 'true' ||
    htmlElement.getAttribute('contenteditable') === 'true' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA'
  );
}

// Notionの編集可能な要素を探す
function findNotionEditableElement(): HTMLElement | null {
  // Notionの主な編集エリアのセレクタ
  const selectors = [
    '[contenteditable="true"]',
    '.notion-page-content',
    '.notion-text-block',
    '[placeholder="Type \'/\' for commands"]',
    '[placeholder="Press Enter to continue with an empty page, or pick a template"]',
    '.notion-focusable',
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element && isContentEditable(element)) {
        return element as HTMLElement;
      }
    }
  }

  return null;
}

// マイク権限取得用のiframeを作成
function createAudioPermissionFrame() {
  audioPermissionFrame = document.createElement('iframe');
  audioPermissionFrame.src = chrome.runtime.getURL('src/content/audio-permission.html');
  audioPermissionFrame.style.cssText = `
    position: fixed;
    top: -100px;
    left: -100px;
    width: 1px;
    height: 1px;
    border: none;
    opacity: 0;
    pointer-events: none;
  `;
  audioPermissionFrame.setAttribute('allow', 'microphone');
  document.body.appendChild(audioPermissionFrame);
}

// ページの初期化
console.log('Voice Transcribe: Notionページで初期化されました');

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
  if (recordingActive) {
    void handleStopRecording();
  }
});
