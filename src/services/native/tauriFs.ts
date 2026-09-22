import { invoke, isTauri } from '@tauri-apps/api/core';

export { isTauri };

/**
 * Prompts user to pick an existing manuscript/project file to open (.chronicle, .epub, .md).
 * Returns the selected absolute path on disk, or null if cancelled.
 */
export async function pickFileToOpen(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const result = await invoke<string | null>('pick_file_to_open');
    return result || null;
  } catch (err) {
    console.error('Failed to pick file to open via Tauri:', err);
    return null;
  }
}

/**
 * Prompts user with a native Save File Dialog to choose destination path for .chronicle project.
 * Returns the selected absolute path on disk, or null if cancelled.
 */
export async function pickFileToSave(defaultName?: string): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const result = await invoke<string | null>('pick_file_to_save', { defaultName });
    return result || null;
  } catch (err) {
    console.error('Failed to pick file to save via Tauri:', err);
    return null;
  }
}

/**
 * Reads binary file contents from a local path on disk.
 */
export async function readLocalBinaryFile(path: string): Promise<Uint8Array> {
  if (!isTauri()) {
    throw new Error('Native file system operations are only supported in desktop app mode.');
  }
  const bytes = await invoke<number[]>('read_binary_file', { path });
  return new Uint8Array(bytes);
}

/**
 * Writes binary file contents directly to a local path on disk (overwriting existing file).
 */
export async function writeLocalBinaryFile(
  path: string,
  data: Uint8Array | ArrayBuffer | Blob
): Promise<void> {
  if (!isTauri()) {
    throw new Error('Native file system operations are only supported in desktop app mode.');
  }
  let uint8: Uint8Array;
  if (data instanceof Uint8Array) {
    uint8 = data;
  } else if (data instanceof ArrayBuffer) {
    uint8 = new Uint8Array(data);
  } else {
    const buffer = await data.arrayBuffer();
    uint8 = new Uint8Array(buffer);
  }

  await invoke('write_binary_file', { path, contents: Array.from(uint8) });
}

/**
 * Checks if a file exists on disk.
 */
export async function checkLocalFileExists(path: string): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>('file_exists', { path });
  } catch {
    return false;
  }
}
