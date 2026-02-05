import { forwardRef, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'
import type { MentionItem } from './types'

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
  loading?: boolean
  noResultsText: string
  loadingText: string
  renderItem?: (item: MentionItem, isSelected: boolean) => React.ReactNode
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command, loading, noResultsText, loadingText, renderItem }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Handle keyboard navigation via ref
    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (event.key === 'ArrowUp') {
            setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1))
            return true
          }
          if (event.key === 'ArrowDown') {
            setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1))
            return true
          }
          if (event.key === 'Enter') {
            const safeIdx = Math.min(selectedIndex, items.length - 1)
            if (items[safeIdx]) {
              command(items[safeIdx])
            }
            return true
          }
          return false
        },
      }),
      [items, selectedIndex, command],
    )

    if (loading) {
      return (
        <div className="mention-list">
          <div className="mention-list-loading">{loadingText}</div>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="mention-list">
          <div className="mention-list-empty">{noResultsText}</div>
        </div>
      )
    }

    // Ensure selectedIndex is in bounds for rendering
    const safeIndex = Math.min(Math.max(0, selectedIndex), items.length - 1)

    return (
      <div className="mention-list">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn('mention-list-item', index === safeIndex && 'is-selected')}
            onClick={() => command(item)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {renderItem ? renderItem(item, index === safeIndex) : <DefaultMentionItem item={item} />}
          </button>
        ))}
      </div>
    )
  },
)

MentionList.displayName = 'MentionList'

function DefaultMentionItem({ item }: { item: MentionItem }) {
  return (
    <>
      {item.avatar && <img src={item.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
      <span className="font-medium truncate">{item.label}</span>
    </>
  )
}
