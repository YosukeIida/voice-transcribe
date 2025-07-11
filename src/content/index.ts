// Notion Web UIに注入されるコンテンツスクリプト
let isRecording = false;
let audioPermissionFrame: HTMLIFrameElement | null = null;

// バックグラウンドスクリプトからのメッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    handleStartRecording();
    sendResponse({ success: true });
  } else if (request.action === 'stopRecording') {
    handleStopRecording();
    sendResponse({ success: true });
  } else if (request.action === 'insertText' && request.text) {
    insertTextAtCursor(request.text);
    sendResponse({ success: true });
  }
  return true;
});

// 録音開始処理
async function handleStartRecording() {
  isRecording = true;
  
  // マイク権限を取得するためのiframeを作成
  if (!audioPermissionFrame) {
    createAudioPermissionFrame();
  }
  
  console.log('Notion: 録音を開始しました');
}

// 録音停止処理
function handleStopRecording() {
  isRecording = false;
  
  // iframeを削除
  if (audioPermissionFrame) {
    audioPermissionFrame.remove();
    audioPermissionFrame = null;
  }
  
  console.log('Notion: 録音を停止しました');
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
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && isContentEditable(element)) {
      return element;
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
  `;
  audioPermissionFrame.setAttribute('allow', 'microphone');
  document.body.appendChild(audioPermissionFrame);
}

// ページの初期化
console.log('Voice Transcribe: Notionページで初期化されました');