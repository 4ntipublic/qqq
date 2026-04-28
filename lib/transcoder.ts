
'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const FFMPEG_CORE_VERSION = '0.12.6'
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`

let ffmpegPromise: Promise<FFmpeg> | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise) return ffmpegPromise
  ffmpegPromise = (async () => {
    const ffmpeg = new FFmpeg()
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    ])
    await ffmpeg.load({ coreURL, wasmURL })
    return ffmpeg
  })()
  return ffmpegPromise
}

export type ProgressCallback = (ratio: number) => void

interface TranscodeArgs {
  file: File
  inputName: string
  outputName: string
  ffmpegArgs: string[]
  outputMime: string
  onProgress?: ProgressCallback
}

async function runTranscode({
  file,
  inputName,
  outputName,
  ffmpegArgs,
  outputMime,
  onProgress,
}: TranscodeArgs): Promise<File> {
  const ffmpeg = await getFFmpeg()

  const progressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(1, progress)))
  }
  ffmpeg.on('progress', progressHandler)

  const logLines: string[] = []
  const logHandler = ({ message }: { message: string }) => {
    logLines.push(message)
  }
  ffmpeg.on('log', logHandler)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const exitCode = await ffmpeg.exec(ffmpegArgs)
    if (exitCode !== 0) {
      const tail = logLines.slice(-12).join('\n')
      throw new Error(
        `FFmpeg exited with code ${exitCode}.\n${tail || '(no log output)'}`
      )
    }
    const data = await ffmpeg.readFile(outputName)
    const blob =
      data instanceof Uint8Array
        ? new Blob([data.buffer as ArrayBuffer], { type: outputMime })
        : new Blob([data], { type: outputMime })
    return new File([blob], outputName, { type: outputMime })
  } finally {
    ffmpeg.off('log', logHandler)
    ffmpeg.off('progress', progressHandler)
    try {
      await ffmpeg.deleteFile(inputName)
    } catch {
      /* noop — file may not exist if writeFile failed */
    }
    try {
      await ffmpeg.deleteFile(outputName)
    } catch {
      /* noop */
    }
  }
}

const AUDIO_PASSTHROUGH = /\.mp3$/i

export async function transcodeAudioToMp3(
  file: File,
  onProgress?: ProgressCallback
): Promise<File> {
  if (AUDIO_PASSTHROUGH.test(file.name)) {
    onProgress?.(1)
    return file
  }
  return runTranscode({
    file,
    inputName: 'input_audio',
    outputName: 'output.mp3',
    ffmpegArgs: [
      '-i',
      'input_audio',
      '-vn',
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '128k',
      'output.mp3',
    ],
    outputMime: 'audio/mpeg',
    onProgress,
  })
}

