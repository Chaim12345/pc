import { $createCodeNode } from '@lexical/code'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $createHeadingNode,
    $createQuoteNode
} from '@lexical/rich-text'
import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical'
import { useEffect } from 'react'

const MARKDOWN_SHORTCUTS = {
  '# ': () => $createHeadingNode('h1'),
  '## ': () => $createHeadingNode('h2'),
  '### ': () => $createHeadingNode('h3'),
  '> ': () => $createQuoteNode(),
  '- ': () => createListNode('bullet'),
  '* ': () => createListNode('bullet'),
  '1. ': () => createListNode('number'),
  '```': () => $createCodeNode(),
}

function createListNode(listType: 'bullet' | 'number') {
  const listNode = $createListNode(listType)
  const listItemNode = $createListItemNode()
  listNode.append(listItemNode)
  return listNode
}

export default function MarkdownShortcutPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
      const textContent = textNode.getTextContent()
      
      // Check for markdown shortcuts at the beginning of the text
      for (const [shortcut, createNode] of Object.entries(MARKDOWN_SHORTCUTS)) {
        if (textContent.startsWith(shortcut)) {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const parent = textNode.getParent()
            if (parent && parent.getType() === 'paragraph') {
              const newNode = createNode()
              
              // Remove the markdown syntax from the text
              const remainingText = textContent.slice(shortcut.length)
              
              if (remainingText) {
                if (newNode.getType() === 'list') {
                  // For lists, add text to the list item
                  const listItem = newNode.getFirstChild()
                  if (listItem) {
                    const paragraph = $createParagraphNode()
                    paragraph.append(textNode.createTextNode(remainingText))
                    listItem.append(paragraph)
                  }
                } else {
                  // For other nodes, append the remaining text
                  newNode.append(textNode.createTextNode(remainingText))
                }
              }
              
              parent.replace(newNode)
              
              // Move selection to the end of the new node
              if (newNode.getType() === 'list') {
                const listItem = newNode.getFirstChild()
                if (listItem) {
                  const paragraph = listItem.getFirstChild()
                  if (paragraph) {
                    paragraph.selectEnd()
                  }
                }
              } else {
                newNode.selectEnd()
              }
              
              return
            }
          }
        }
      }
    })

    return removeTransform
  }, [editor])

  return null
}