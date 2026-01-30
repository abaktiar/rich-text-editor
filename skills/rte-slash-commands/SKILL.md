---
name: rte-slash-commands
description: Work with slash commands in Rich Text Editor. Use when adding custom commands or understanding available formatting options.
---

# Slash Commands

Type `/` at line start to open command menu.

## Default Commands

### Basic
| Command | Aliases | Action |
|---------|---------|--------|
| Text | paragraph, p | Plain paragraph |
| Heading 1 | h1, title | Large heading |
| Heading 2 | h2, subtitle | Medium heading |
| Heading 3 | h3 | Small heading |

### Lists
| Command | Aliases | Action |
|---------|---------|--------|
| Bullet List | ul, unordered, bullets | Unordered list |
| Numbered List | ol, ordered, numbers | Ordered list |
| Task List | todo, checkbox, checklist | Checkboxes |

### Formatting
| Command | Aliases | Action |
|---------|---------|--------|
| Inline Code | code, monospace | Code style |
| Highlight | mark, marker, yellow | Highlight |
| Link | url, href, anchor | Add link |

### Advanced
| Command | Aliases | Action |
|---------|---------|--------|
| Quote | blockquote, quotation | Block quote |
| Code Block | codeblock, pre, syntax | Code with highlighting |
| Divider | hr, horizontal, separator | Horizontal rule |
| Table | table, grid | 3x3 table |
| Callout | note, info, alert | Highlighted block |
| Toggle | expand, collapse, details | Collapsible |

## Adding Custom Commands

```tsx
import {
  RichTextEditor,
  type EditorPlugin,
  type SlashCommand,
} from '@/components/ui/editor'
import { Sparkles } from 'lucide-react'

const myCommand: SlashCommand = {
  name: 'Magic',
  description: 'Insert magic content',
  icon: Sparkles,
  aliases: ['magic', 'special'],
  group: 'custom',
  action: (editor) => {
    editor.chain().focus().insertContent('<p>✨ Magic!</p>').run()
  },
}

const myPlugin: EditorPlugin = {
  name: 'magic-plugin',
  slashCommands: [myCommand],
}

<RichTextEditor plugins={[myPlugin]} />
```

## SlashCommand Interface

```tsx
interface SlashCommand {
  name: string
  description: string
  icon: LucideIcon
  aliases?: string[]
  group: 'basic' | 'lists' | 'formatting' | 'advanced' | 'media' | 'custom'
  action: (editor: Editor, context?: EditorActionContext) => void
}
```

## Command Groups (by priority)

| Group | Priority | Content |
|-------|----------|---------|
| basic | 1 | Text, headings |
| lists | 2 | Bullet, numbered, tasks |
| formatting | 3 | Code, highlight, link |
| advanced | 4 | Quote, table, callout, toggle |
| media | 5 | File attachments |
| custom | 6 | Your commands |

## Working with Commands

```tsx
import {
  defaultSlashCommands,
  filterCommands,
  groupCommands,
  commandGroups,
} from '@/components/ui/editor'

// Get all default commands
const commands = defaultSlashCommands

// Filter by query
const filtered = filterCommands(commands, 'head')

// Group by category
const grouped = groupCommands(commands) // Map<GroupInfo, SlashCommand[]>

// Get group definitions
const groups = commandGroups // [{id, label, priority}, ...]
```

## EditorActionContext

For commands needing UI (like link popover):

```tsx
const linkCommand: SlashCommand = {
  name: 'Link',
  icon: Link,
  group: 'formatting',
  action: (editor, context) => {
    context?.openLinkPopover()
  },
}
```
