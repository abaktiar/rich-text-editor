import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import { Plus, Trash2, GripVertical, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TableAlignment } from './extensions/table'

interface TableControlsProps {
  editor: Editor
}

const TABLE_SIZES = [
  { label: 'S', width: 400 },
  { label: 'M', width: 600 },
  { label: 'L', width: 800 },
  { label: 'Full', width: null },
]

export function TableControls({ editor }: TableControlsProps) {
  const [tableElement, setTableElement] = useState<HTMLElement | null>(null)
  const [tablePos, setTablePos] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [showRowMenu, setShowRowMenu] = useState<number | null>(null)
  const [showColMenu, setShowColMenu] = useState<number | null>(null)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [liveTableRect, setLiveTableRect] = useState<DOMRect | null>(null) // Live rect during resize
  const controlsRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef<{ x: number; width: number; newWidth?: number } | null>(null)

  // Get table attributes
  const getTableAttributes = useCallback(() => {
    if (!editor.isActive('table')) return { alignment: 'left' as TableAlignment, width: null }

    const { selection } = editor.state
    const $pos = selection.$from

    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.type.name === 'table') {
        return {
          alignment: (node.attrs.alignment || 'left') as TableAlignment,
          width: node.attrs.width as number | null,
        }
      }
    }
    return { alignment: 'left' as TableAlignment, width: null }
  }, [editor])

  const [tableAttrs, setTableAttrs] = useState(getTableAttributes())

  // Find the table element when cursor is inside a table
  const updateTableElement = useCallback(() => {
    if (!editor.isActive('table')) {
      setTableElement(null)
      setTablePos(null)
      setShowRowMenu(null)
      setShowColMenu(null)
      setShowTableMenu(false)
      return
    }

    const { selection } = editor.state
    const $pos = selection.$from

    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.type.name === 'table') {
        const pos = $pos.before(depth)
        setTablePos(pos)
        const dom = editor.view.nodeDOM(pos) as HTMLElement | null
        if (dom) {
          // Find the actual table element (might be wrapped)
          const table = dom.tagName === 'TABLE' ? dom : dom.querySelector('table')
          const wrapper = dom.classList.contains('tableWrapper') ? dom : dom.closest('.tableWrapper')
          setTableElement((wrapper || table) as HTMLElement)
          setTableAttrs(getTableAttributes())
          return
        }
        break
      }
    }
    setTableElement(null)
    setTablePos(null)
  }, [editor, getTableAttributes])

  useEffect(() => {
    editor.on('selectionUpdate', updateTableElement)
    editor.on('transaction', updateTableElement)
    return () => {
      editor.off('selectionUpdate', updateTableElement)
      editor.off('transaction', updateTableElement)
    }
  }, [editor, updateTableElement])

  // Apply initial styles when table element changes
  useEffect(() => {
    if (tableElement && tableAttrs) {
      const wrapper = tableElement.classList.contains('tableWrapper')
        ? tableElement
        : tableElement.closest('.tableWrapper')

      if (wrapper instanceof HTMLElement) {
        // Apply alignment
        wrapper.style.marginLeft = tableAttrs.alignment === 'center' || tableAttrs.alignment === 'right' ? 'auto' : ''
        wrapper.style.marginRight = tableAttrs.alignment === 'center' ? 'auto' : ''
        // Apply width
        if (tableAttrs.width) {
          wrapper.style.width = `${tableAttrs.width}px`
          wrapper.style.maxWidth = '100%'
        } else {
          wrapper.style.width = ''
        }
      }
    }
  }, [tableElement, tableAttrs])

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) {
        setShowRowMenu(null)
        setShowColMenu(null)
        setShowTableMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update table attributes and apply styles to wrapper
  const updateTableAttributes = useCallback(
    (attrs: Record<string, unknown>) => {
      if (tablePos === null) return

      const { tr } = editor.state
      tr.setNodeMarkup(tablePos, undefined, {
        ...editor.state.doc.nodeAt(tablePos)?.attrs,
        ...attrs,
      })
      editor.view.dispatch(tr)
      setTableAttrs((prev) => ({ ...prev, ...attrs }) as typeof prev)

      // Apply styles to wrapper element
      if (tableElement) {
        const wrapper = tableElement.classList.contains('tableWrapper')
          ? tableElement
          : tableElement.closest('.tableWrapper')

        if (wrapper instanceof HTMLElement) {
          // Apply alignment
          if (attrs.alignment) {
            wrapper.style.marginLeft = attrs.alignment === 'center' || attrs.alignment === 'right' ? 'auto' : ''
            wrapper.style.marginRight = attrs.alignment === 'center' ? 'auto' : ''
          }
          // Apply width
          if ('width' in attrs) {
            wrapper.style.width = attrs.width ? `${attrs.width}px` : ''
            wrapper.style.maxWidth = '100%'
          }
        }
      }
    },
    [editor, tablePos, tableElement],
  )

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!tableElement) return
      e.preventDefault()
      e.stopPropagation()

      const rect = tableElement.getBoundingClientRect()
      resizeStartRef.current = {
        x: e.clientX,
        width: rect.width,
      }
      setIsResizing(true)

      // Add resizing class for visual feedback
      const wrapper = tableElement.classList.contains('tableWrapper')
        ? tableElement
        : tableElement.closest('.tableWrapper')
      if (wrapper) {
        wrapper.classList.add('resizing')
      }
    },
    [tableElement],
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeStartRef.current || !tableElement) return
      const deltaX = e.clientX - resizeStartRef.current.x
      const newWidth = Math.max(300, Math.min(1200, resizeStartRef.current.width + deltaX))

      // Store in ref to avoid full re-renders during drag
      resizeStartRef.current.newWidth = newWidth

      // Apply width immediately to wrapper for live preview (DOM only)
      const wrapper = tableElement.classList.contains('tableWrapper')
        ? tableElement
        : tableElement.closest('.tableWrapper')

      if (wrapper instanceof HTMLElement) {
        wrapper.style.width = `${newWidth}px`
        wrapper.style.maxWidth = '100%'
        wrapper.style.overflow = 'hidden' // Prevent content from expanding wrapper

        // Update live rect for handle positioning
        setLiveTableRect(wrapper.getBoundingClientRect())
      }
    },
    [tableElement],
  )

  const handleResizeEnd = useCallback(() => {
    // Remove resizing class and restore overflow
    if (tableElement) {
      const wrapper = tableElement.classList.contains('tableWrapper')
        ? tableElement
        : tableElement.closest('.tableWrapper')
      if (wrapper instanceof HTMLElement) {
        wrapper.classList.remove('resizing')
        wrapper.style.overflow = '' // Restore overflow
      }
    }

    // Use width from ref (set during drag) instead of state
    if (resizeStartRef.current?.newWidth) {
      const finalWidth = Math.round(resizeStartRef.current.newWidth)
      updateTableAttributes({ width: finalWidth })
    }
    resizeStartRef.current = null
    setIsResizing(false)
    setLiveTableRect(null) // Clear live rect
  }, [updateTableAttributes, tableElement])

  useEffect(() => {
    if (isResizing) {
      // Add cursor style to body for smooth resize experience
      document.body.style.cursor = 'se-resize'
      document.body.style.userSelect = 'none'

      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // Handle table click for menu
  const handleTableClick = useCallback(() => {
    if (isResizing) return
    const rect = tableElement?.getBoundingClientRect()
    if (rect) {
      setMenuPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2,
      })
      setShowTableMenu(true)
    }
  }, [tableElement, isResizing])

  if (!tableElement || !editor.isEditable) {
    return null
  }

  const tableRect = tableElement.getBoundingClientRect()
  const actualTable = tableElement.tagName === 'TABLE' ? tableElement : tableElement.querySelector('table')

  if (!actualTable) return null

  const rows = Array.from(actualTable.querySelectorAll('tr'))
  const firstRowCells = Array.from(rows[0]?.querySelectorAll('td, th') || [])

  // Get column positions from first row cells
  const columnPositions = firstRowCells.map((cell, index) => {
    const rect = cell.getBoundingClientRect()
    return { left: rect.left, right: rect.right, width: rect.width, index }
  })

  // Get row positions
  const rowPositions = rows.map((row, index) => {
    const rect = row.getBoundingClientRect()
    return { top: rect.top, bottom: rect.bottom, height: rect.height, index }
  })

  return (
    <>
      <div ref={controlsRef} className="table-controls">
        {/* Row handles on the left */}
        {rowPositions.map((row, index) => (
          <div
            key={`row-${index}`}
            className={cn(
              'table-row-handle',
              (hoveredRow === index || showRowMenu === index) && 'table-row-handle-active',
            )}
            style={{
              position: 'fixed',
              top: row.top,
              left: tableRect.left - 32,
              height: row.height,
            }}
            onMouseEnter={() => setHoveredRow(index)}
            onMouseLeave={() => !showRowMenu && setHoveredRow(null)}
          >
            <button
              className="table-row-handle-button"
              onClick={() => setShowRowMenu(showRowMenu === index ? null : index)}
            >
              <GripVertical size={14} />
            </button>

            {/* Row menu dropdown */}
            {showRowMenu === index && (
              <div className="table-control-dropdown table-row-dropdown">
                <button
                  className="table-control-dropdown-item"
                  onClick={() => {
                    editor.chain().focus().addRowBefore().run()
                    setShowRowMenu(null)
                  }}
                >
                  <Plus size={14} />
                  <span>Insert above</span>
                </button>
                <button
                  className="table-control-dropdown-item"
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run()
                    setShowRowMenu(null)
                  }}
                >
                  <Plus size={14} />
                  <span>Insert below</span>
                </button>
                <div className="table-control-dropdown-divider" />
                <button
                  className="table-control-dropdown-item table-control-dropdown-item-danger"
                  onClick={() => {
                    editor.chain().focus().deleteRow().run()
                    setShowRowMenu(null)
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete row</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Column add buttons - at top between columns */}
        {columnPositions.map((col, index) => (
          <div
            key={`col-${index}`}
            className={cn(
              'table-col-handle',
              (hoveredCol === index || showColMenu === index) && 'table-col-handle-active',
            )}
            style={{
              position: 'fixed',
              top: tableRect.top - 12,
              left: col.right - 10,
            }}
            onMouseEnter={() => setHoveredCol(index)}
            onMouseLeave={() => !showColMenu && setHoveredCol(null)}
          >
            <button
              className="table-col-add-button"
              onClick={() => setShowColMenu(showColMenu === index ? null : index)}
            >
              <Plus size={12} />
            </button>

            {/* Vertical line */}
            <div className="table-col-line" style={{ height: tableRect.height + 12 }} />

            {/* Column menu dropdown */}
            {showColMenu === index && (
              <div className="table-control-dropdown table-col-dropdown">
                <button
                  className="table-control-dropdown-item"
                  onClick={() => {
                    editor.chain().focus().addColumnBefore().run()
                    setShowColMenu(null)
                  }}
                >
                  <Plus size={14} />
                  <span>Insert left</span>
                </button>
                <button
                  className="table-control-dropdown-item"
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run()
                    setShowColMenu(null)
                  }}
                >
                  <Plus size={14} />
                  <span>Insert right</span>
                </button>
                <div className="table-control-dropdown-divider" />
                <button
                  className="table-control-dropdown-item table-control-dropdown-item-danger"
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run()
                    setShowColMenu(null)
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete column</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Table options button - top left */}
        <button
          className="table-options-button"
          style={{
            position: 'fixed',
            top: tableRect.top - 12,
            left: tableRect.left - 32,
          }}
          onClick={handleTableClick}
          title="Table options"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </button>

        {/* Resize handle - bottom right corner */}
        <div
          className={cn('table-resize-handle', isResizing && 'table-resize-handle-active')}
          style={{
            position: 'fixed',
            top: (liveTableRect || tableRect).bottom - 12,
            left: (liveTableRect || tableRect).right - 12,
          }}
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <div className="table-resize-handle-inner" />
        </div>

        {/* Add row at bottom */}
        <div
          className="table-add-row-bottom"
          style={{
            position: 'fixed',
            top: (liveTableRect || tableRect).bottom + 4,
            left: (liveTableRect || tableRect).left,
            width: (liveTableRect || tableRect).width,
          }}
        >
          <button className="table-add-row-bottom-button" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Plus size={14} />
            <span>Add row</span>
          </button>
        </div>
      </div>

      {/* Floating table menu */}
      {showTableMenu &&
        createPortal(
          <div
            className="table-floating-menu"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Alignment */}
            <div className="table-menu-section">
              <Button
                variant={tableAttrs.alignment === 'left' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => updateTableAttributes({ alignment: 'left' })}
                title="Align left"
                className={cn('h-7 w-7', tableAttrs.alignment === 'left' && 'bg-primary text-primary-foreground')}
              >
                <AlignLeft size={14} />
              </Button>
              <Button
                variant={tableAttrs.alignment === 'center' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => updateTableAttributes({ alignment: 'center' })}
                title="Align center"
                className={cn('h-7 w-7', tableAttrs.alignment === 'center' && 'bg-primary text-primary-foreground')}
              >
                <AlignCenter size={14} />
              </Button>
              <Button
                variant={tableAttrs.alignment === 'right' ? 'default' : 'ghost'}
                size="icon-xs"
                onClick={() => updateTableAttributes({ alignment: 'right' })}
                title="Align right"
                className={cn('h-7 w-7', tableAttrs.alignment === 'right' && 'bg-primary text-primary-foreground')}
              >
                <AlignRight size={14} />
              </Button>
            </div>

            <div className="table-menu-divider" />

            {/* Size */}
            <div className="table-menu-section">
              {TABLE_SIZES.map((size) => (
                <Button
                  key={size.label}
                  variant={tableAttrs.width === size.width ? 'default' : 'ghost'}
                  size="icon-xs"
                  onClick={() => updateTableAttributes({ width: size.width })}
                  title={size.width ? `${size.width}px` : 'Full width'}
                  className={cn(
                    'h-7 w-7 text-xs font-medium',
                    tableAttrs.width === size.width && 'bg-primary text-primary-foreground',
                  )}
                >
                  {size.label === 'Full' ? <Maximize2 size={14} /> : size.label}
                </Button>
              ))}
            </div>

            <div className="table-menu-divider" />

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                editor.chain().focus().deleteTable().run()
                setShowTableMenu(false)
              }}
              title="Delete table"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} />
            </Button>
          </div>,
          document.body,
        )}
    </>
  )
}
