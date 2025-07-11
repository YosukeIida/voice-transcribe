// Vitest global setup

// Mock Chrome API
global.chrome = {
  runtime: {
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
  },
} as any;

// Mock FileReader for tests
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  error: any = null;
  onloadend: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  readAsDataURL(blob: Blob) {
    // Simple mock implementation
    this.result = 'data:' + blob.type + ';base64,SGVsbG8sIFdvcmxkIQ==';
    if (this.onloadend) {
      setTimeout(() => this.onloadend!(), 0);
    }
  }

  readAsText(blob: Blob) {
    // Simple mock implementation
    void blob.text().then((text) => {
      this.result = text;
      if (this.onloadend) this.onloadend();
    });
  }
} as any;
