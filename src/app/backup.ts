import { checksumOf } from '../engine/save/checksum'
import { parseSave, type SaveFile } from '../engine/save/saves'

/** The same shape the store saves. */
export const exportText = (file: SaveFile): string => JSON.stringify({ checksum: checksumOf(file), file })

export function importText(text: string): SaveFile | null {
  try {
    return parseSave(JSON.parse(text))
  } catch {
    return null
  }
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
