import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { mergeAttributes } from '@tiptap/react'

export type TableAlignment = 'left' | 'center' | 'right'
export type TableWidth = 'auto' | 'fixed' | 'full'

// Extended table extension with alignment and width support
export const TableExtension = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'left',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('data-width')
          return width ? parseInt(width, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width}px; max-width: 100%;`,
          }
        },
      },
    }
  },

  // Wrap table in a .tableWrapper div for view mode (read-only).
  // In edit mode, ProseMirror's NodeView creates the wrapper instead.
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'tableWrapper' },
      ['table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0]],
    ]
  },
}).configure({
  resizable: true,
  HTMLAttributes: {
    class: 'editor-table',
  },
})

// Table row extension
export const TableRowExtension = TableRow.configure({
  HTMLAttributes: {
    class: 'editor-table-row',
  },
})

// Override colwidth attribute to output inline width style in renderHTML.
// By default, Tiptap stores colwidth as a data attribute but doesn't emit
// style="width: …" in getHTML(). ProseMirror's NodeView handles widths via
// <colgroup> in edit mode, but in view mode (no NodeView) we need inline styles.
const colwidthOverride = {
  default: null,
  parseHTML: (element: HTMLElement) => {
    const colwidth = element.getAttribute('colwidth')
    if (colwidth) {
      return colwidth.split(',').map((w: string) => parseInt(w, 10))
    }
    // Fallback: try to read width from inline style
    const style = element.style?.width
    if (style && style.endsWith('px')) {
      return [parseInt(style, 10)]
    }
    return null
  },
  renderHTML: (attributes: { colwidth?: number[] | null }) => {
    if (!attributes.colwidth?.length) return {}
    return {
      colwidth: attributes.colwidth.join(','),
      style: `width: ${attributes.colwidth[0]}px`,
    }
  },
}

// Table header cell extension with colwidth → inline width
export const TableHeaderExtension = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: colwidthOverride,
    }
  },
}).configure({
  HTMLAttributes: {
    class: 'editor-table-header',
  },
})

// Table cell extension with colwidth → inline width
export const TableCellExtension = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: colwidthOverride,
    }
  },
}).configure({
  HTMLAttributes: {
    class: 'editor-table-cell',
  },
})

// Export all table extensions as an array
export const tableExtensions = [TableExtension, TableRowExtension, TableHeaderExtension, TableCellExtension]
