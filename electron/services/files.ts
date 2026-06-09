import { dialog } from 'electron'
import { promises as fs } from 'node:fs'
import { stripDataUrl } from './providers/helpers'

export async function exportImage(dataUrl: string, defaultName: string): Promise<string | null> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '导出图片',
    defaultPath: defaultName,
    filters: [
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
    ],
  })
  if (canceled || !filePath) return null
  await fs.writeFile(filePath, Buffer.from(stripDataUrl(dataUrl), 'base64'))
  return filePath
}

// Save an already-composited long image (the renderer stitches sections on a canvas).
export async function exportLongImage(dataUrl: string): Promise<string | null> {
  return exportImage(dataUrl, `详情页长图_${Date.now()}.png`)
}
