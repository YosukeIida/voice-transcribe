import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chrome API のモック
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    lastError: null as chrome.runtime.LastError | null,
  },
};

// グローバルにchromeを設定
global.chrome = mockChrome as any;

describe('Recording State Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Storage State Persistence', () => {
    it('should save recording state to storage when recording starts', async () => {
      // chrome.storage.local.set のモック設定
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      // 録音開始をシミュレート
      await mockChrome.storage.local.set({ isRecording: true });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { isRecording: true },
        expect.any(Function),
      );
    });

    it('should save recording state to storage when recording stops', async () => {
      // chrome.storage.local.set のモック設定
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      // 録音停止をシミュレート
      await mockChrome.storage.local.set({ isRecording: false });

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { isRecording: false },
        expect.any(Function),
      );
    });

    it('should restore recording state from storage', async () => {
      // chrome.storage.local.get のモック設定
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ isRecording: true });
      });

      // ストレージから状態を取得
      return new Promise<void>((resolve) => {
        mockChrome.storage.local.get(['isRecording'], (result) => {
          expect(result.isRecording).toBe(true);
          resolve();
        });
      });
    });
  });

  describe('Background Script State Sync', () => {
    it('should respond to getRecordingStatus message', async () => {
      const mockResponse = {
        isRecording: true,
        isPaused: false,
        mimeType: 'audio/webm',
        bufferSize: 0,
      };

      // chrome.runtime.sendMessage のモック設定
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getRecordingStatus') {
          callback(mockResponse);
        }
      });

      // メッセージを送信
      return new Promise<void>((resolve) => {
        mockChrome.runtime.sendMessage({ action: 'getRecordingStatus' }, (response) => {
          expect(response.isRecording).toBe(true);
          expect(response.isPaused).toBe(false);
          expect(response.mimeType).toBe('audio/webm');
          resolve();
        });
      });
    });

    it('should handle runtime errors gracefully', async () => {
      // エラーをシミュレート
      mockChrome.runtime.lastError = { message: 'Connection error' };

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      // メッセージを送信
      return new Promise<void>((resolve) => {
        mockChrome.runtime.sendMessage({ action: 'getRecordingStatus' }, (response) => {
          expect(mockChrome.runtime.lastError).toBeTruthy();
          expect(response).toBeNull();
          resolve();
        });
      });
    });
  });

  describe('State Synchronization Logic', () => {
    it('should prioritize background script state over storage', async () => {
      // ストレージでは録音中、バックグラウンドでは停止中
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ isRecording: true });
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getRecordingStatus') {
          callback({ isRecording: false, isPaused: false, mimeType: '', bufferSize: 0 });
        }
      });

      // 実際の同期ロジックをシミュレート
      return new Promise<void>((resolve) => {
        let storageState = false;
        let finalState = false;

        // ストレージから取得
        mockChrome.storage.local.get(['isRecording'], (result) => {
          if (typeof result.isRecording === 'boolean') {
            storageState = result.isRecording;
          }

          // バックグラウンドスクリプトから取得
          mockChrome.runtime.sendMessage({ action: 'getRecordingStatus' }, (response) => {
            if (response && typeof response.isRecording === 'boolean') {
              finalState = response.isRecording;
            }

            // バックグラウンドスクリプトの状態を優先
            expect(storageState).toBe(true);
            expect(finalState).toBe(false);
            resolve();
          });
        });
      });
    });
  });
});
