# AGENTS.md

A Notion-style Rich Text Editor built with Tiptap, React, TypeScript, and shadcn/ui styling.

## Setup Commands

- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Build for production: `bun run build`
- Lint code: `bun run lint`

## Project Structure

```
src/
├── components/
│   ├── ui/
│   │   └── editor/           # Rich Text Editor components
│   │       ├── editor.tsx    # Main RichTextEditor component
│   │       ├── viewer.tsx    # Read-only RichTextViewer component
│   │       ├── toolbar.tsx   # Fixed toolbar with formatting buttons
│   │       ├── bubble-menu.tsx # Floating selection menu
│   │       ├── command-menu.tsx # Slash command popup
│   │       ├── code-block.tsx # Enhanced code block with language selector
│   │       ├── commands.ts   # Slash command definitions
│   │       ├── types.ts      # TypeScript interfaces
│   │       ├── editor.css    # Styling
│   │       ├── index.ts      # Public exports
│   │       └── extensions/   # Tiptap extensions
│   └── editor-demo.tsx       # Demo page
├── App.tsx                   # Main app entry
└── index.css                 # Global styles
```

## Code Style

- TypeScript strict mode
- React functional components with hooks
- Use `forwardRef` for components needing ref access
- CSS classes follow BEM-like naming (e.g., `code-block-header`, `toolbar-button-active`)
- Use `cn()` utility from `@/lib/utils` for conditional class names
- Named exports for all components and types

## Component Architecture

The editor follows a modular design:

1. **RichTextEditor** - Main editable component with toolbar, bubble menu, slash commands
2. **RichTextViewer** - Lightweight read-only viewer
3. **Toolbar** - Fixed top toolbar (only in edit mode)
4. **BubbleMenu** - Floating menu on text selection (only in edit mode)
5. **CommandMenu** - Slash command popup ("/") for block insertion
6. **CodeBlockComponent** - Custom code block with language selector and copy button

## Key Technologies

- **Tiptap** - Headless editor framework built on ProseMirror
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling via shadcn/ui design tokens
- **Vite** - Build tool
- **Bun** - Package manager and runtime

## Props Reference

### RichTextEditor
- `content` - Initial HTML or JSON content
- `onChange` - Callback when content changes
- `editable` - Enable/disable editing (default: true)
- `showToolbar` - Show fixed toolbar (default: true in edit mode)
- `placeholder` - Placeholder text
- `plugins` - Array of custom plugins
- `className` - Additional CSS classes

### RichTextViewer
- `content` - HTML or JSON to display
- `className` - Additional CSS classes

## Testing Guidelines

- Test editor in both edit and view modes
- Verify slash commands trigger only at line start
- Check code block language selector works in edit mode only
- Ensure bubble menu appears on text selection
- Test toolbar button active states match current formatting

## Important Notes

- Slash commands only trigger at the start of a line (not mid-text)
- Code blocks have language dropdown in edit mode, read-only label in view mode
- Extensions use named exports (not default exports) for Tiptap 3.x compatibility
