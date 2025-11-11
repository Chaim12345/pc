import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DRAG_DROP_PASTE } from '@lexical/rich-text'
import { COMMAND_PRIORITY_LOW } from 'lexical'
import { useEffect } from 'react'

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
]

export default function DragDropPastePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        ;(async () => {
          const filesResult = await mediaFileReader(files)
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: result,
              })
            }
          }
        })()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}

function isMimeType(file: File, acceptableMimeTypes: string[]) {
  return acceptableMimeTypes.some((type) => {
    const [mimeType, mimeSubtype] = type.split('/')
    const [fileMimeType, fileMimeSubtype] = file.type.split('/')
    return (
      mimeType === fileMimeType &&
      (mimeSubtype === undefined || mimeSubtype === fileMimeSubtype)
    )
  })
}

async function mediaFileReader(files: FileList) {
  const filesIterator = files[Symbol.iterator]()
  const results: Array<{ file: File; result: string }> = []
  
  for (const file of filesIterator) {
    const reader = new FileReader()
    const promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
    })
    reader.readAsDataURL(file)
    const result = await promise
    results.push({ file, result })
  }
  
  return results
}

// Placeholder for INSERT_IMAGE_COMMAND - would need proper ImageNode implementation
const INSERT_IMAGE_COMMAND = 'INSERT_IMAGE_COMMAND'