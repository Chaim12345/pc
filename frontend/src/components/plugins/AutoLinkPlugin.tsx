import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
    $createTextNode,
    TextNode
} from 'lexical'
import { useEffect } from 'react'

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

function findAndTransformURI(node: TextNode): null | TextNode {
  const text = node.getTextContent()
  const match = URL_REGEX.exec(text) || EMAIL_REGEX.exec(text)

  if (match === null) {
    return null
  }

  const matchStart = match.index
  const matchLength = match[0].length
  const matchEnd = matchStart + matchLength
  const isLastMatch = matchEnd === text.length

  let linkTextNode
  if (matchStart === 0) {
    ;[linkTextNode] = node.splitText(matchLength)
  } else {
    ;[, linkTextNode] = node.splitText(matchStart, matchStart + matchLength)
  }

  if (!linkTextNode) {
    return null
  }

  const linkNode = $createLinkNode(match[0])
  linkNode.append(linkTextNode)
  linkTextNode.replace(linkNode)

  return isLastMatch ? null : linkNode
}

function handleLinkCreation(node: TextNode): void {
  let currentNode: null | TextNode = node

  while (currentNode !== null) {
    currentNode = findAndTransformURI(currentNode)
  }
}

function handleLinkEdit(linkNode: any, url: string): void {
  // Simple check for valid URL
  const isValidUrl = URL_REGEX.test(url) || EMAIL_REGEX.test(url)
  
  if (!isValidUrl) {
    // If URL becomes invalid, convert back to text
    const textNode = $createTextNode(url)
    linkNode.replace(textNode)
  } else {
    // Update the URL
    linkNode.setURL(url)
  }
}

export default function AutoLinkPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
      const parent = textNode.getParent()
      
      // Don't auto-link inside existing links
      if ($isLinkNode(parent)) {
        const url = textNode.getTextContent()
        handleLinkEdit(parent, url)
        return
      }

      // Don't auto-link inside code blocks
      if (parent && parent.getType() === 'code') {
        return
      }

      handleLinkCreation(textNode)
    })

    return removeTransform
  }, [editor])

  return null
}