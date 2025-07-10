import { useState } from 'preact/hooks';
import styles from './styles.module.css';

export function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Chrome storageからAPIキーを取得
  chrome.storage.local.get(['openaiApiKey'], (result) => {
    if (result.openaiApiKey) {
      setHasApiKey(true);
    }
  });

  const handleStartRecording = async () => {
    if (!hasApiKey) {
      alert('OpenAI APIキーを設定してください');
      return;
    }

    setIsRecording(true);
    // バックグラウンドスクリプトに録音開始を通知
    chrome.runtime.sendMessage({ action: 'startRecording' });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // バックグラウンドスクリプトに録音停止を通知
    chrome.runtime.sendMessage({ action: 'stopRecording' });
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
        setHasApiKey(true);
        setApiKey('');
        alert('APIキーを保存しました');
      });
    }
  };

  return (
    <div className={styles.popupContainer}>
      <h1 className={styles.title}>Voice Transcribe</h1>
      
      {!hasApiKey && (
        <div className={styles.apiKeySection}>
          <input
            type="password"
            placeholder="OpenAI APIキーを入力"
            value={apiKey}
            onInput={(e) => setApiKey(e.currentTarget.value)}
            className={styles.apiKeyInput}
          />
          <button onClick={handleSaveApiKey} className={`${styles.button} ${styles.buttonPrimary}`}>
            保存
          </button>
        </div>
      )}

      <div className={styles.controls}>
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className={`${styles.button} ${styles.buttonRecord}`}
            disabled={!hasApiKey}
          >
            🎤 録音開始
          </button>
        ) : (
          <button onClick={handleStopRecording} className={`${styles.button} ${styles.buttonStop}`}>
            ⏹️ 録音停止
          </button>
        )}
      </div>

      {isRecording && (
        <div className={styles.status}>
          <span className={styles.recordingIndicator}></span>
          録音中...
        </div>
      )}
    </div>
  );
}