import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ToolbarAction } from './types'
import { LinkPopoverButton } from './link-popover'

interface ToolbarProps {
  editor: Editor
  pluginActions?: ToolbarAction[]
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
}

function ToolbarButton({ icon, onClick, isActive, disabled, title }: ToolbarButtonProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      className={cn(
        isActive && 'bg-primary text-primary-foreground',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {icon}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className="toolbar-divider" />
}

export function Toolbar({ editor, pluginActions = [] }: ToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div className="toolbar" data-slot="editor-toolbar">
      {/* Undo/Redo */}
      <ToolbarButton
        icon={<Undo size={16} />}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Cmd+Z)"
      />
      <ToolbarButton
        icon={<Redo size={16} />}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Cmd+Shift+Z)"
      />

      <ToolbarDivider />

      {/* Text Styles */}
      <ToolbarButton
        icon={<Type size={16} />}
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Normal text"
      />
      <ToolbarButton
        icon={<Heading1 size={16} />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      />
      <ToolbarButton
        icon={<Heading2 size={16} />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      />
      <ToolbarButton
        icon={<Heading3 size={16} />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      />

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        icon={<Bold size={16} />}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Cmd+B)"
      />
      <ToolbarButton
        icon={<Italic size={16} />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Cmd+I)"
      />
      <ToolbarButton
        icon={<UnderlineIcon size={16} />}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Cmd+U)"
      />
      <ToolbarButton
        icon={<Strikethrough size={16} />}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      />
      <ToolbarButton
        icon={<Code size={16} />}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline code"
      />
      <ToolbarButton
        icon={<Highlighter size={16} />}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      />

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        icon={<AlignLeft size={16} />}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      />
      <ToolbarButton
        icon={<AlignCenter size={16} />}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      />
      <ToolbarButton
        icon={<AlignRight size={16} />}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        icon={<List size={16} />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet list"
      />
      <ToolbarButton
        icon={<ListOrdered size={16} />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered list"
      />
      <ToolbarButton
        icon={<CheckSquare size={16} />}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task list"
      />

      <ToolbarDivider />

      {/* Block Elements */}
      <ToolbarButton
        icon={<Quote size={16} />}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      />
      <ToolbarButton
        icon={<Minus size={16} />}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      />

      <ToolbarDivider />

      {/* Link */}
      <LinkPopoverButton editor={editor} variant="toolbar" />

      {/* Plugin Actions */}
      {pluginActions.length > 0 && (
        <>
          <ToolbarDivider />
          {pluginActions.map((action) => (
            <ToolbarButton
              key={action.id}
              icon={<action.icon size={16} />}
              onClick={() => action.action(editor)}
              isActive={action.isActive?.(editor)}
              title={action.label}
            />
          ))}
        </>
      )}
    </div>
  )
}
