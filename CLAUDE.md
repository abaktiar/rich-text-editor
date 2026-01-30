# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Notion-style Rich Text Editor built with Tiptap 3.x, React 19, TypeScript, and Tailwind CSS 4 (via shadcn/ui design tokens).

## Commands

```bash
bun install       # Install dependencies
bun run dev       # Start dev server
bun run build     # Build for production (runs tsc -b && vite build)
bun run lint      # Run ESLint
```

## Architecture

### Editor Components (`src/components/ui/editor/`)

The editor uses a modular architecture with these main components:

- **RichTextEditor** (`editor.tsx`) - Main editable component. Initializes Tiptap editor, manages toolbar/bubble-menu/slash-commands. Exposes imperative ref API (`RichTextEditorRef`) for programmatic control.
- **RichTextViewer** (`viewer.tsx`) - Lightweight read-only viewer using the same extensions.
- **Toolbar** (`toolbar.tsx`) - Fixed toolbar at top of editor with formatting buttons.
- **BubbleMenu** (`bubble-menu.tsx`) - Floating menu that appears on text selection.
- **CommandMenu** (`command-menu.tsx`) - Slash command popup triggered by "/" at line start.
- **CodeBlockComponent** (`code-block.tsx`) - Custom code block with language selector and copy button.
- **TableControls** (`table-controls.tsx`) - Floating controls for table manipulation (add/delete rows/columns).
- **FloatingLinkPopover** (`link-popover.tsx`) - Popover for editing links, triggered via toolbar or slash command.
- **MentionList** (`mention-list.tsx`) - Suggestion list for @mentions.

### Extensions (`src/components/ui/editor/extensions/`)

- `createExtensions()` in `index.ts` - Factory function that configures all Tiptap extensions
- `EnhancedCodeBlock` - Custom code block extension with syntax highlighting via lowlight
- `SlashCommands` - Extension that handles "/" command triggers
- `tableExtensions` - Configures Table, TableRow, TableCell, TableHeader extensions
- `MentionExtension` - Handles @mention functionality with suggestion plugin

### Key Types (`src/components/ui/editor/types.ts`)

- `RichTextEditorRef` - Imperative handle for programmatic control (getContent, setContent, focus, blur, clear)
- `SlashCommand` - Interface for slash command definitions (name, description, icon, action, group)
- `EditorPlugin` - Plugin interface for extending editor functionality
- `EditorActionContext` - Context passed to slash commands for UI actions (e.g., opening link popover)

### Default Slash Commands (`src/components/ui/editor/commands.ts`)

Commands are organized into groups: basic, lists, formatting, advanced, media, custom. Each command has aliases for easier discovery.

### Key Behaviors

- Slash commands only trigger at the start of a line (not mid-text)
- Code blocks have an editable language dropdown in edit mode; read-only label in view mode
- Extensions use named exports (not default) for Tiptap 3.x compatibility
- Link commands use `EditorActionContext` to trigger the link popover UI

### Plugin System

Custom functionality can be added via the `plugins` prop:

```typescript
interface EditorPlugin {
  name: string
  slashCommands?: SlashCommand[]
  toolbarActions?: ToolbarAction[]
  extensions?: Extension[]
  onInit?: (editor: Editor) => void
  onDestroy?: () => void
}
```

## Code Style

- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)
- CSS classes follow BEM-like naming (e.g., `code-block-header`, `toolbar-button-active`)
- Use `forwardRef` for components that need ref access
- Named exports for all components and types
