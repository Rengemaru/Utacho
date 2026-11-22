import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

const ARTWORKS_DIR_NAME = 'artworks';

export type LocalArtworkPickResult =
  | { status: 'selected'; uri: string }
  | { status: 'canceled' }
  | { status: 'error'; message: string };

/** ローカル保存された画像URI（file://）かどうかを判定する */
export function isLocalArtworkUri(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith('file://');
}

/** バックアップ復元時に存在しないローカル画像パスを null へフォールバックする */
export function resolveRestoredArtworkUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (!isLocalArtworkUri(uri)) return uri;
  try {
    const file = new File(uri);
    return file.exists ? uri : null;
  } catch {
    return null;
  }
}

function getExtensionFromAsset(name?: string, mimeType?: string): string {
  if (name) {
    const match = /\.([a-zA-Z0-9]+)$/.exec(name);
    if (match) return match[1].toLowerCase();
  }
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

/** 端末から画像を選び、アプリ専用の永続領域へコピーして file:// URI を返す */
export async function pickLocalArtwork(): Promise<LocalArtworkPickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];
    const dir = new Directory(Paths.document, ARTWORKS_DIR_NAME);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }

    const ext = getExtensionFromAsset(asset.name, asset.mimeType);
    const filename = `artwork-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const sourceFile = new File(asset.uri);
    const destFile = new File(dir, filename);
    sourceFile.copy(destFile);

    return { status: 'selected', uri: destFile.uri };
  } catch (e) {
    console.error('Failed to pick local artwork:', e);
    return {
      status: 'error',
      message: '写真の読み込みに失敗しました。別の画像でお試しください。',
    };
  }
}
