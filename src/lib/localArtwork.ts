import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';

const ARTWORKS_DIR_NAME = 'artworks';
const ARTWORK_MAX_EDGE_PX = 600;
const ARTWORK_JPEG_QUALITY = 0.8;

export type LocalArtworkPickResult =
  | { status: 'selected'; uri: string }
  | { status: 'canceled' }
  | { status: 'error'; message: string };

/** ローカル保存された画像URI（file://）かどうかを判定する */
export function isLocalArtworkUri(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith('file://');
}

function getArtworksDir(): Directory {
  return new Directory(Paths.document, ARTWORKS_DIR_NAME);
}

/** 永続フォルダ（document/artworks/）配下のファイルか判定する */
export function isPermanentLocalArtworkUri(uri: string | null | undefined): boolean {
  if (!isLocalArtworkUri(uri)) return false;
  const dirUri = getArtworksDir().uri;
  const prefix = dirUri.endsWith('/') ? dirUri : `${dirUri}/`;
  return (uri as string).startsWith(prefix);
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

/**
 * 写真ギャラリーを直接開き、OS標準の1:1トリミング後に
 * 長辺600px以内・JPEG圧縮した一時ファイル（cache）のURIを返す。
 * 永続保存は編集画面の「保存」押下時に commitLocalArtwork() で行う。
 */
export async function pickLocalArtwork(): Promise<LocalArtworkPickResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);

    // 高解像度写真による容量肥大を防ぐため、長辺が 600px を超える場合のみ縮小する
    const width = asset.width ?? 0;
    const height = asset.height ?? 0;
    if (width > ARTWORK_MAX_EDGE_PX || height > ARTWORK_MAX_EDGE_PX) {
      if (width >= height) {
        context.resize({ width: ARTWORK_MAX_EDGE_PX });
      } else {
        context.resize({ height: ARTWORK_MAX_EDGE_PX });
      }
    }

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      compress: ARTWORK_JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });

    return { status: 'selected', uri: saved.uri };
  } catch (e) {
    console.error('Failed to pick local artwork:', e);
    return {
      status: 'error',
      message: '写真の読み込みに失敗しました。別の画像でお試しください。',
    };
  }
}

/**
 * 曲の保存時に一時キャッシュ画像をアプリ専用の永続フォルダへ確定コピーする。
 * すでに永続フォルダ内・リモートURL・null の場合はそのまま返す。
 */
export function commitLocalArtwork(uri: string | null): string | null {
  if (!uri || !isLocalArtworkUri(uri) || isPermanentLocalArtworkUri(uri)) {
    return uri;
  }
  const dir = getArtworksDir();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  const filename = `artwork-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
  const sourceFile = new File(uri);
  const destFile = new File(dir, filename);
  sourceFile.copy(destFile);

  // 元の一時キャッシュファイルは不要なので掃除（失敗しても処理は継続）
  try {
    if (sourceFile.exists) sourceFile.delete();
  } catch {
    // ignore cache cleanup error
  }
  return destFile.uri;
}

/**
 * 永続フォルダ（document/artworks/）内のファイルのうち、
 * DBで参照されていない未使用ファイルのみを安全に削除する。
 */
export function cleanupUnusedLocalArtworks(usedUris: Iterable<string | null | undefined>): void {
  try {
    const dir = getArtworksDir();
    if (!dir.exists) return;
    const usedSet = new Set<string>();
    for (const u of usedUris) {
      if (typeof u === 'string' && u.length > 0) usedSet.add(u);
    }
    for (const entry of dir.list()) {
      if (entry instanceof File && !usedSet.has(entry.uri)) {
        try {
          entry.delete();
        } catch {
          // ignore individual delete error
        }
      }
    }
  } catch (e) {
    console.error('Failed to cleanup unused local artworks:', e);
  }
}
