import { describe, it, expect } from 'vitest';
import {
  blobToBase64,
  base64ToBlob,
  chunkAudioData,
  mergeChunks,
  formatDataSize,
  formatDuration,
  mergeBlobArray,
} from '../audio-processor';

describe('audio-processor', () => {
  describe('blobToBase64', () => {
    it('should convert Blob to base64 string', async () => {
      // Arrange
      const text = 'Hello, World!';
      const blob = new Blob([text], { type: 'text/plain' });

      // Act
      const base64 = await blobToBase64(blob);

      // Assert
      expect(base64).toBeDefined();
      expect(typeof base64).toBe('string');
      // base64デコードして元のテキストと一致することを確認
      const decoded = atob(base64);
      expect(decoded).toBe(text);
    });

    it('should handle empty Blob', async () => {
      // Arrange
      const blob = new Blob([], { type: 'text/plain' });

      // Act
      const base64 = await blobToBase64(blob);

      // Assert
      expect(base64).toBe('');
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 string to Blob', () => {
      // Arrange
      const text = 'Hello, World!';
      const base64 = btoa(text);
      const mimeType = 'text/plain';

      // Act
      const blob = base64ToBlob(base64, mimeType);

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe(mimeType);
      expect(blob.size).toBe(text.length);
    });
  });

  describe('chunkAudioData', () => {
    it('should split data into chunks of specified size', () => {
      // Arrange
      const data = 'a'.repeat(1000);
      const chunkSize = 300;

      // Act
      const chunks = chunkAudioData(data, chunkSize);

      // Assert
      expect(chunks).toHaveLength(4); // 300, 300, 300, 100
      expect(chunks[0]).toHaveLength(300);
      expect(chunks[1]).toHaveLength(300);
      expect(chunks[2]).toHaveLength(300);
      expect(chunks[3]).toHaveLength(100);
    });

    it('should return single chunk if data is smaller than chunk size', () => {
      // Arrange
      const data = 'small data';
      const chunkSize = 1000;

      // Act
      const chunks = chunkAudioData(data, chunkSize);

      // Assert
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(data);
    });
  });

  describe('mergeChunks', () => {
    it('should merge chunks back into original data', () => {
      // Arrange
      const originalData = 'This is a test string for chunking';
      const chunks = chunkAudioData(originalData, 10);

      // Act
      const merged = mergeChunks(chunks);

      // Assert
      expect(merged).toBe(originalData);
    });
  });

  describe('formatDataSize', () => {
    it('should format bytes correctly', () => {
      expect(formatDataSize(0)).toBe('0 Bytes');
      expect(formatDataSize(500)).toBe('500 Bytes');
      expect(formatDataSize(1024)).toBe('1 KB');
      expect(formatDataSize(1536)).toBe('1.5 KB');
      expect(formatDataSize(1048576)).toBe('1 MB');
      expect(formatDataSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds into readable duration', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3725)).toBe('1h 2m 5s');
    });
  });

  describe('mergeBlobArray', () => {
    it('should merge multiple blobs into one', async () => {
      // Arrange
      const blob1 = new Blob(['Hello'], { type: 'text/plain' });
      const blob2 = new Blob([' '], { type: 'text/plain' });
      const blob3 = new Blob(['World'], { type: 'text/plain' });

      // Act
      const merged = mergeBlobArray([blob1, blob2, blob3], 'text/plain');

      // Assert
      expect(merged.type).toBe('text/plain');
      const text = await merged.text();
      expect(text).toBe('Hello World');
    });
  });
});
