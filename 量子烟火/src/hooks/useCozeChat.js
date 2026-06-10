import { useRef } from 'react'
import { innerWorldStream } from '../api/coze'
import { useEmotionStore } from '../store/emotionStore'

/** Coze 流式对话 Hook */
export function useCozeChat() {
  const abortRef = useRef(false)
  const { setProcessing, appendResponse, clearResponse } = useEmotionStore()

  const sendMessage = async ({ botType = 'inner', userInput, location, userId }) => {
    abortRef.current = false
    clearResponse()
    setProcessing(true)

    try {
      await innerWorldStream({
        userInput,
        location,
        userId,
        onChunk: (chunk) => {
          if (!abortRef.current) appendResponse(chunk)
        },
        onDone: () => setProcessing(false),
      })
    } catch (err) {
      console.error('Coze 对话错误:', err)
      appendResponse('\n\n[连接暂时中断，请稍后重试]')
      setProcessing(false)
    }
  }

  const abort = () => {
    abortRef.current = true
    setProcessing(false)
  }

  return { sendMessage, abort }
}
