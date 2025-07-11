/**
 * 音声データ処理ユーティリティ
 */

export interface AudioMetadata {
  mimeType: string;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  timestamp: number;
  size: number;
}

export interface ProcessedAudioData {
  data: string; // Base64エンコードされたデータ
  chunks?: string[]; // 大きなファイルの場合のチャンク
  metadata: AudioMetadata;
}

/**
 * Blobをbase64に変換
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        // data:audio/webm;base64,xxxxx の形式から base64部分のみを抽出
        const base64 = reader.result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to extract base64 data'));
        }
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Base64をBlobに変換
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 音声データのチャンク分割
 * @param base64Data Base64エンコードされた音声データ
 * @param chunkSize チャンクサイズ（デフォルト: 1MB）
 */
export function chunkAudioData(base64Data: string, chunkSize: number = 1024 * 1024): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < base64Data.length; i += chunkSize) {
    chunks.push(base64Data.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * チャンクを結合
 */
export function mergeChunks(chunks: string[]): string {
  return chunks.join('');
}

/**
 * 音声データの圧縮（品質を調整）
 * WebM/Opusは既に効率的な圧縮を行っているため、追加の圧縮は不要
 */
export function optimizeAudioData(blob: Blob, _targetBitRate?: number): Blob {
  // WebM/Opusは既に最適化されているため、そのまま返す
  // 将来的に、必要に応じて追加の最適化を実装可能
  return blob;
}

/**
 * 音声データのメタデータを抽出
 */
export async function extractAudioMetadata(
  blob: Blob,
  additionalInfo?: Partial<AudioMetadata>,
): Promise<AudioMetadata> {
  const metadata: AudioMetadata = {
    mimeType: blob.type,
    size: blob.size,
    timestamp: Date.now(),
    ...additionalInfo,
  };

  // Web Audio APIを使用して詳細なメタデータを取得（オプション）
  if (typeof AudioContext !== 'undefined') {
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      metadata.duration = audioBuffer.duration;
      metadata.sampleRate = audioBuffer.sampleRate;
      metadata.channels = audioBuffer.numberOfChannels;

      await audioContext.close();
    } catch (error) {
      console.warn('Failed to extract detailed audio metadata:', error);
    }
  }

  return metadata;
}

/**
 * 音声データを処理
 */
export async function processAudioData(
  blob: Blob,
  options?: {
    chunkSize?: number;
    includeMetadata?: boolean;
    optimize?: boolean;
  },
): Promise<ProcessedAudioData> {
  const { chunkSize, includeMetadata = true, optimize = false } = options || {};

  // 最適化が必要な場合
  let processedBlob = blob;
  if (optimize) {
    processedBlob = optimizeAudioData(blob);
  }

  // Base64に変換
  const base64Data = await blobToBase64(processedBlob);

  // メタデータを抽出
  const metadata = includeMetadata
    ? await extractAudioMetadata(processedBlob)
    : {
        mimeType: processedBlob.type,
        size: processedBlob.size,
        timestamp: Date.now(),
      };

  // 大きなファイルの場合はチャンク分割
  const result: ProcessedAudioData = {
    data: base64Data,
    metadata,
  };

  if (chunkSize && base64Data.length > chunkSize) {
    result.chunks = chunkAudioData(base64Data, chunkSize);
  }

  return result;
}

/**
 * 複数のBlobを結合
 */
export function mergeBlobArray(blobs: Blob[], mimeType: string): Blob {
  return new Blob(blobs, { type: mimeType });
}

/**
 * データサイズをフォーマット
 */
export function formatDataSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 録音時間をフォーマット
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
