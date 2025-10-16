/**
 * Audio utilities for recording and playing audio
 */

/**
 * Convert blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 string to blob
 */
export function base64ToBlob(base64: string, mimeType = 'audio/mpeg'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Play audio from base64 string
 */
export function playAudioBase64(base64: string, mimeType = 'audio/mpeg'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const blob = base64ToBlob(base64, mimeType)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(url)
        reject(error)
      }
      
      audio.play()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Record audio using MediaRecorder
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm'
      })
      
      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      this.mediaRecorder.start()
    } catch (error) {
      console.error('Error starting audio recording:', error)
      throw error
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop())
        }
        
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}

/**
 * Record audio in chunks for real-time streaming
 */
export class ChunkedAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private onChunkCallback: ((chunk: Blob) => void) | null = null

  async start(onChunk: (chunk: Blob) => void, chunkInterval = 2000): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm'
      })
      
      this.onChunkCallback = onChunk
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.onChunkCallback) {
          this.onChunkCallback(event.data)
        }
      }
      
      // Start recording with time slices
      this.mediaRecorder.start(chunkInterval)
    } catch (error) {
      console.error('Error starting chunked audio recording:', error)
      throw error
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}

