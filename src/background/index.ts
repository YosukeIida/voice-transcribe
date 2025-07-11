// Chrome拡張機能のバックグラウンドスクリプト
let isRecording = false;
let recordingTabId: number | null = null;

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    startRecording();
    sendResponse({ success: true });
  } else if (request.action === 'stopRecording') {
    stopRecording();
    sendResponse({ success: true });
  } else if (request.action === 'insertText' && request.text) {
    // コンテンツスクリプトにテキスト挿入を指示
    if (recordingTabId) {
      chrome.tabs.sendMessage(recordingTabId, {
        action: 'insertText',
        text: request.text,
      });
    }
  }
  return true;
});

// 録音開始
async function startRecording() {
  isRecording = true;
  
  // 現在のアクティブタブを取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id && tab.url?.includes('notion.so')) {
    recordingTabId = tab.id;
    
    // コンテンツスクリプトに録音開始を通知
    chrome.tabs.sendMessage(recordingTabId, { action: 'startRecording' });
    
    // アイコンを録音中の状態に変更
    chrome.action.setIcon({
      path: {
        '16': '/icons/icon-recording-16.png',
        '32': '/icons/icon-recording-32.png',
        '48': '/icons/icon-recording-48.png',
        '128': '/icons/icon-recording-128.png',
      },
    });
  } else {
    console.error('Notionのタブが見つかりません');
    isRecording = false;
  }
}

// 録音停止
function stopRecording() {
  isRecording = false;
  
  if (recordingTabId) {
    // コンテンツスクリプトに録音停止を通知
    chrome.tabs.sendMessage(recordingTabId, { action: 'stopRecording' });
    recordingTabId = null;
  }
  
  // アイコンを通常の状態に戻す
  chrome.action.setIcon({
    path: {
      '16': '/icons/icon-16.png',
      '32': '/icons/icon-32.png',
      '48': '/icons/icon-48.png',
      '128': '/icons/icon-128.png',
    },
  });
}

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener(() => {
  console.log('Voice Transcribe for Notion - インストール完了');
});