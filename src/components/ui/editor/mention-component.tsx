import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { cn } from '@/lib/utils'
import type { MentionItem } from './types'

export function MentionComponent({ node, editor, selected }: NodeViewProps) {
  const { id, label, avatar, metadata } = node.attrs as MentionItem & { metadata?: Record<string, unknown> }
  const isEditable = editor.isEditable

  // Get callbacks from storage (using type assertion to avoid type errors)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (editor.storage as any).mention as
    | {
        onMentionClick?: (item: MentionItem, event: MouseEvent) => void
        renderMention?: (item: MentionItem) => React.ReactNode
      }
    | undefined
  const onMentionClick = storage?.onMentionClick
  const renderMention = storage?.renderMention

  const mentionItem: MentionItem & { metadata?: Record<string, unknown> } = { id, label, avatar, metadata }

  // Custom render if provided
  if (renderMention) {
    return (
      <NodeViewWrapper as="span" className="mention-wrapper">
        {renderMention(mentionItem)}
      </NodeViewWrapper>
    )
  }

  // Default render: badge with name (avatar only if provided)
  return (
    <NodeViewWrapper as="span" className="mention-wrapper">
      <span
        className={cn(
          'mention',
          'inline-flex items-center gap-1 px-1.5 rounded',
          'bg-primary/10 text-primary text-sm font-medium',
          'cursor-pointer hover:bg-primary/20',
          'transition-colors whitespace-nowrap',
          selected && isEditable && 'ring-2 ring-primary ring-offset-1',
        )}
        onClick={(e) => onMentionClick?.(mentionItem, e.nativeEvent)}
        contentEditable={false}
      >
        {avatar && <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />}
        <span>@{label}</span>
      </span>
    </NodeViewWrapper>
  )
}
