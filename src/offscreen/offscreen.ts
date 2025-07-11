/// <reference types="chrome" />

import { blobToBase64, formatDataSize } from '../utils/audio-processor';

// グローバル変数
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;
let isPaused = false;

// 録音設定
const RECORDING_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000, // 128kbps
  timeslice: 1000, // 1秒ごとにデータを送信
};

interface MessageRequest {
  action: string;
  [key: string]: any;
}

// メッセージハンドラー
chrome.runtime.onMessage.addListener((request: MessageRequest, _sender, sendResponse) => {
  console.log('Offscreen: メッセージを受信:', request);

  switch (request.action) {
    case 'startRecording':
      void startRecording()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error: Error) => {
          sendResponse({ success: false, error: error.message });
        });
      break;

    case 'stopRecording':
      try {
        stopRecording();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
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
        mimeType: RECORDING_CONFIG.mimeType,
        hasMediaStream: !!mediaStream,
        hasMediaRecorder: !!mediaRecorder,
      });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true; // 非同期レスポンス
});

// 録音開始
async function startRecording(): Promise<void> {
  try {
    console.log('Offscreen: 録音を開始します');

    // 既存のストリームがある場合は停止
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    // マイクアクセス権限を取得
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        channelCount: 1,
      },
    });

    console.log('Offscreen: マイクストリームを取得しました');

    // MediaRecorderを初期化
    if (!MediaRecorder.isTypeSupported(RECORDING_CONFIG.mimeType)) {
      throw new Error(`MimeType ${RECORDING_CONFIG.mimeType} is not supported`);
    }

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: RECORDING_CONFIG.mimeType,
      audioBitsPerSecond: RECORDING_CONFIG.audioBitsPerSecond,
    });

    // イベントリスナーを設定
    setupMediaRecorderEvents();

    // 録音開始
    audioChunks = [];
    mediaRecorder.start(RECORDING_CONFIG.timeslice);
    isRecording = true;
    isPaused = false;

    console.log('Offscreen: MediaRecorderが開始されました');

    // バックグラウンドスクリプトに通知
    void chrome.runtime.sendMessage({
      action: 'recordingStarted',
      mimeType: RECORDING_CONFIG.mimeType,
    });
  } catch (error) {
    console.error('Offscreen: 録音開始エラー:', error);
    isRecording = false;
    isPaused = false;

    // エラーを通知
    void chrome.runtime.sendMessage({
      action: 'recordingError',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });

    throw error;
  }
}

// 録音停止
function stopRecording(): void {
  try {
    console.log('Offscreen: 録音を停止します');

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    isRecording = false;
    isPaused = false;

    console.log('Offscreen: 録音が停止されました');
  } catch (error) {
    console.error('Offscreen: 録音停止エラー:', error);
    throw error;
  }
}

// 録音一時停止
function pauseRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    isPaused = true;
    console.log('Offscreen: 録音が一時停止されました');

    void chrome.runtime.sendMessage({
      action: 'recordingPaused',
    });
  }
}

// 録音再開
function resumeRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    isPaused = false;
    console.log('Offscreen: 録音が再開されました');

    chrome.runtime.sendMessage({
      action: 'recordingResumed',
    });
  }
}

// MediaRecorderイベントの設定
function setupMediaRecorderEvents(): void {
  if (!mediaRecorder) return;

  mediaRecorder.addEventListener('dataavailable', async (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
      console.log(`Offscreen: 音声データチャンクを受信: ${formatDataSize(event.data.size)}`);

      try {
        // 音声データをBase64に変換してバックグラウンドスクリプトに送信
        const base64Data = await blobToBase64(event.data);
        chrome.runtime.sendMessage({
          action: 'audioDataChunk',
          data: base64Data,
          mimeType: RECORDING_CONFIG.mimeType,
          timestamp: Date.now(),
          size: event.data.size,
        });
      } catch (error) {
        console.error('Offscreen: 音声データの変換エラー:', error);
      }
    }
  });

  mediaRecorder.addEventListener('stop', async () => {
    console.log('Offscreen: MediaRecorderが停止されました');

    try {
      // 全ての音声データを結合
      const finalBlob = new Blob(audioChunks, { type: RECORDING_CONFIG.mimeType });
      const finalBase64 = await blobToBase64(finalBlob);

      console.log(`Offscreen: 最終的な音声データ: ${formatDataSize(finalBlob.size)}`);

      // バックグラウンドスクリプトに最終データを送信
      chrome.runtime.sendMessage({
        action: 'recordingComplete',
        data: finalBase64,
        mimeType: RECORDING_CONFIG.mimeType,
        size: finalBlob.size,
        duration: audioChunks.length, // 概算的な長さ
      });

      // クリーンアップ
      audioChunks = [];
      mediaRecorder = null;
    } catch (error) {
      console.error('Offscreen: 録音完了処理エラー:', error);
      chrome.runtime.sendMessage({
        action: 'recordingError',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    chrome.runtime.sendMessage({
      action: 'recordingStopped',
    });
  });

  mediaRecorder.addEventListener('error', (event) => {
    console.error('Offscreen: MediaRecorderエラー:', event.error);
    isRecording = false;
    isPaused = false;

    chrome.runtime.sendMessage({
      action: 'recordingError',
      error: event.error?.message || 'MediaRecorder error',
      errorType: event.error?.name || 'MediaRecorderError',
    });
  });
}

// ページロード時の初期化
console.log('Offscreen: ドキュメントが読み込まれました');

// ポートベースでService WorkerにREADYシグナルを送信
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'offscreen') {
    console.log('Offscreen: Service Workerからのポート接続を受信しました');
    port.postMessage({ type: 'READY' });
    console.log('Offscreen: READYシグナルを送信しました');

    // 録音コマンドを受信
    port.onMessage.addListener(async (msg: any) => {
      if (msg && typeof msg === 'object' && 'type' in msg) {
        switch ((msg as { type: string }).type) {
          case 'START_RECORD':
            console.log('Offscreen: 録音開始コマンドを受信しました');
            await startRecording();
            break;
          case 'STOP_RECORD':
            console.log('Offscreen: 録音停止コマンドを受信しました');
            stopRecording();
            break;
        }
      }
    });
  }
});
