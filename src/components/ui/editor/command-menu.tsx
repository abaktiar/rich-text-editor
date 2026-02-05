import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useState, useCallback } from 'react'
import type { SlashCommand } from './types'
import { filterCommands, groupCommands } from './commands'
import { cn } from '@/lib/utils'

interface CommandMenuProps {
  items: SlashCommand[]
  query: string
  onSelect: (command: SlashCommand) => void
  onClose: () => void
}

export interface CommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const CommandMenu = forwardRef<CommandMenuRef, CommandMenuProps>(function CommandMenu(
  { items, query, onSelect, onClose },
  ref,
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter items based on query
  const filteredItems = filterCommands(items, query)
  const groupedItems = groupCommands(filteredItems)

  // Flatten for keyboard navigation
  const flatItems = Array.from(groupedItems.values()).flat()

  // Reset selection when items change
  useLayoutEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    const element = document.querySelector(`[data-command-index="${selectedIndex}"]`)
    element?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const selectItem = useCallback(
    (index: number) => {
      const item = flatItems[index]
      if (item) {
        onSelect(item)
      }
    },
    [flatItems, onSelect],
  )

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1))
        return true
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev >= flatItems.length - 1 ? 0 : prev + 1))
        return true
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }

      if (event.key === 'Escape') {
        onClose()
        return true
      }

      return false
    },
  }))

  if (flatItems.length === 0) {
    return (
      <div className="command-menu">
        <div className="command-menu-empty">No results found</div>
      </div>
    )
  }

  let globalIndex = 0

  return (
    <div className="command-menu">
      {Array.from(groupedItems.entries()).map(([group, commands]) => (
        <div key={group.id} className="command-menu-group">
          <div className="command-menu-group-label">{group.label}</div>
          {commands.map((command) => {
            const index = globalIndex++
            const Icon = command.icon
            return (
              <button
                key={command.name}
                data-command-index={index}
                className={cn('command-menu-item', index === selectedIndex && 'command-menu-item-selected')}
                onClick={() => onSelect(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-menu-item-icon">
                  <Icon size={18} />
                </div>
                <div className="command-menu-item-content">
                  <div className="command-menu-item-name">{command.name}</div>
                  <div className="command-menu-item-description">{command.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
})
