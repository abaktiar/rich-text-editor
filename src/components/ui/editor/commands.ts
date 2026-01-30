import type { Editor } from '@tiptap/react'
import type { SlashCommand, SlashCommandGroupInfo, EditorActionContext } from './types'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Link,
  Highlighter,
  CodeSquare,
} from 'lucide-react'

// Command group definitions
export const commandGroups: SlashCommandGroupInfo[] = [
  { id: 'basic', label: 'Basic Blocks', priority: 1 },
  { id: 'lists', label: 'Lists', priority: 2 },
  { id: 'formatting', label: 'Formatting', priority: 3 },
  { id: 'advanced', label: 'Advanced', priority: 4 },
  { id: 'media', label: 'Media', priority: 5 },
  { id: 'custom', label: 'Custom', priority: 6 },
]

// Default slash commands
export const defaultSlashCommands: SlashCommand[] = [
  // Basic blocks
  {
    name: 'Text',
    description: 'Just start writing with plain text',
    icon: Type,
    aliases: ['paragraph', 'p'],
    group: 'basic',
    action: (editor: Editor) => {
      editor.chain().focus().setParagraph().run()
    },
  },
  {
    name: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    aliases: ['h1', 'title'],
    group: 'basic',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
  },
  {
    name: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    aliases: ['h2', 'subtitle'],
    group: 'basic',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
  },
  {
    name: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    aliases: ['h3'],
    group: 'basic',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
  },

  // Lists
  {
    name: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: List,
    aliases: ['ul', 'unordered', 'bullets'],
    group: 'lists',
    action: (editor: Editor) => {
      editor.chain().focus().toggleBulletList().run()
    },
  },
  {
    name: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    aliases: ['ol', 'ordered', 'numbers'],
    group: 'lists',
    action: (editor: Editor) => {
      editor.chain().focus().toggleOrderedList().run()
    },
  },
  {
    name: 'Task List',
    description: 'Track tasks with a to-do list',
    icon: CheckSquare,
    aliases: ['todo', 'checkbox', 'checklist'],
    group: 'lists',
    action: (editor: Editor) => {
      editor.chain().focus().toggleTaskList().run()
    },
  },

  // Formatting
  {
    name: 'Inline Code',
    description: 'Mark text as inline code',
    icon: CodeSquare,
    aliases: ['code', 'monospace', 'mono'],
    group: 'formatting',
    action: (editor: Editor) => {
      editor.chain().focus().toggleCode().run()
    },
  },
  {
    name: 'Highlight',
    description: 'Highlight important text',
    icon: Highlighter,
    aliases: ['mark', 'marker', 'yellow'],
    group: 'formatting',
    action: (editor: Editor) => {
      editor.chain().focus().toggleHighlight().run()
    },
  },
  {
    name: 'Link',
    description: 'Add a link to text',
    icon: Link,
    aliases: ['url', 'href', 'anchor'],
    group: 'formatting',
    action: (_editor: Editor, context?: EditorActionContext) => {
      if (!context) {
        console.warn('[RichTextEditor] Link command requires EditorActionContext')
        return
      }
      context.openLinkPopover()
    },
  },

  // Advanced
  {
    name: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    aliases: ['blockquote', 'quotation'],
    group: 'advanced',
    action: (editor: Editor) => {
      editor.chain().focus().toggleBlockquote().run()
    },
  },
  {
    name: 'Code Block',
    description: 'Display code with syntax highlighting',
    icon: Code,
    aliases: ['codeblock', 'pre', 'syntax'],
    group: 'advanced',
    action: (editor: Editor) => {
      editor.chain().focus().toggleCodeBlock().run()
    },
  },
  {
    name: 'Divider',
    description: 'Visually divide blocks',
    icon: Minus,
    aliases: ['hr', 'horizontal', 'rule', 'separator'],
    group: 'advanced',
    action: (editor: Editor) => {
      editor.chain().focus().setHorizontalRule().run()
    },
  },
]

// Filter commands based on query
export function filterCommands(
  commands: SlashCommand[],
  query: string
): SlashCommand[] {
  if (!query) return commands

  const lowerQuery = query.toLowerCase()

  return commands.filter((command) => {
    const nameMatch = command.name.toLowerCase().includes(lowerQuery)
    const descriptionMatch = command.description.toLowerCase().includes(lowerQuery)
    const aliasMatch = command.aliases?.some((alias) =>
      alias.toLowerCase().includes(lowerQuery)
    )
    return nameMatch || descriptionMatch || aliasMatch
  })
}

// Group commands by their group
export function groupCommands(
  commands: SlashCommand[]
): Map<SlashCommandGroupInfo, SlashCommand[]> {
  const grouped = new Map<SlashCommandGroupInfo, SlashCommand[]>()

  // Sort groups by priority
  const sortedGroups = [...commandGroups].sort((a, b) => a.priority - b.priority)

  for (const group of sortedGroups) {
    const groupCommands = commands.filter((cmd) => cmd.group === group.id)
    if (groupCommands.length > 0) {
      grouped.set(group, groupCommands)
    }
  }

  return grouped
}
