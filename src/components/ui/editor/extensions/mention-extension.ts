import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { MentionItem } from '../types'
import { MentionComponent } from '../mention-component'

export interface MentionExtensionOptions {
  HTMLAttributes: Record<string, unknown>
  onMentionClick?: (item: MentionItem, event: MouseEvent) => void
  onMentionRemove?: (item: MentionItem) => void
  renderMention?: (item: MentionItem) => React.ReactNode
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mention: {
      setMention: (attributes: MentionItem) => ReturnType
    }
  }
}

export const MentionExtension = Node.create<MentionExtensionOptions>({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true, // Treated as single unit

  addOptions() {
    return {
      HTMLAttributes: {},
      onMentionClick: undefined,
      onMentionRemove: undefined,
      renderMention: undefined,
    }
  },

  addStorage() {
    return {
      onMentionClick: this.options.onMentionClick,
      onMentionRemove: this.options.onMentionRemove,
      renderMention: this.options.renderMention,
    }
  },

  addAttributes() {
    return {
      id: { default: '' },
      label: { default: '' },
      avatar: { default: null },
      metadata: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-mention]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-mention': '',
        'data-mention-id': HTMLAttributes.id,
        class: 'mention',
      }),
      `@${HTMLAttributes.label}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionComponent)
  },

  addCommands() {
    return {
      setMention:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },

  // Track when mentions are removed
  onDestroy() {
    // Cleanup if needed
  },
})
