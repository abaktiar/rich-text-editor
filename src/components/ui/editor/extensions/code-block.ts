import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeBlockComponent } from '../code-block'

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

/**
 * Enhanced CodeBlock extension with:
 * - Language selector dropdown
 * - Copy code button
 * - Syntax highlighting via lowlight
 */
export const EnhancedCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  },
}).configure({
  lowlight,
  HTMLAttributes: {
    class: 'editor-code-block',
  },
})
