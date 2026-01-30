import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

export type TableAlignment = 'left' | 'center' | 'right'
export type TableWidth = 'auto' | 'fixed' | 'full'

// Extended table extension with alignment and width support
export const TableExtension = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-alignment') || 'left',
        renderHTML: attributes => ({
          'data-alignment': attributes.alignment,
        }),
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('data-width')
          return width ? parseInt(width, 10) : null
        },
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width}px; max-width: 100%;`,
          }
        },
      },
    }
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

// Table header cell extension
export const TableHeaderExtension = TableHeader.configure({
  HTMLAttributes: {
    class: 'editor-table-header',
  },
})

// Table cell extension
export const TableCellExtension = TableCell.configure({
  HTMLAttributes: {
    class: 'editor-table-cell',
  },
})

// Export all table extensions as an array
export const tableExtensions = [
  TableExtension,
  TableRowExtension,
  TableHeaderExtension,
  TableCellExtension,
]
