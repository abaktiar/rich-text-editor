import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { createExtensions } from './extensions'
import { SlashCommands } from './extensions/slash-commands'
import { defaultSlashCommands } from './commands'
import { CommandMenu, type CommandMenuRef } from './command-menu'
import { BubbleMenu } from './bubble-menu'
import { Toolbar } from './toolbar'
import type {
  RichTextEditorProps,
  RichTextEditorRef,
  SlashCommand,
  EditorContentFormat,
} from './types'
import { cn } from '@/lib/utils'
import './editor.css'

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      content,
      onChange,
      editable = true,
      placeholder,
      autoFocus = false,
      className,
      showToolbar,
      plugins = [],
      minHeight = '200px',
    },
    ref
  ) {
    const [, setForceUpdate] = useState(0)

    // Collect slash commands from plugins
    const allSlashCommands = [
      ...defaultSlashCommands,
      ...plugins.flatMap((p) => p.slashCommands ?? []),
    ]

    // Collect extensions from plugins
    const pluginExtensions = plugins.flatMap((p) => p.extensions ?? [])

    // Collect toolbar actions from plugins
    const pluginToolbarActions = plugins.flatMap((p) => p.toolbarActions ?? [])

    const editor = useEditor({
      extensions: [
        ...createExtensions({ placeholder }),
        ...pluginExtensions,
        SlashCommands.configure({
          suggestion: {
            items: ({ query }: { query: string }) => {
              return allSlashCommands.filter((item) => {
                const nameMatch = item.name.toLowerCase().includes(query.toLowerCase())
                const aliasMatch = item.aliases?.some((a) =>
                  a.toLowerCase().includes(query.toLowerCase())
                )
                return nameMatch || aliasMatch
              })
            },
            command: ({ editor, range, props }: { editor: unknown; range: unknown; props: SlashCommand }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (editor as any).chain().focus().deleteRange(range).run()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              props.action(editor as any)
            },
            render: () => {
              let component: ReactRenderer<CommandMenuRef> | null = null
              let popup: TippyInstance[] | null = null
              // Store the range and editor for use in onSelect
              let currentRange: unknown = null
              let currentEditor: unknown = null

              return {
                onStart: (props: { editor: unknown; clientRect: (() => DOMRect | null) | null; items: SlashCommand[]; range: unknown }) => {
                  currentEditor = props.editor
                  currentRange = props.range
                  
                  component = new ReactRenderer(CommandMenu, {
                    props: {
                      items: props.items,
                      query: '',
                      onSelect: (command: SlashCommand) => {
                        // Delete the "/" and any typed query, then execute the command
                        if (currentEditor && currentRange) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (currentEditor as any).chain().focus().deleteRange(currentRange).run()
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          command.action(currentEditor as any)
                        }
                        popup?.[0]?.hide()
                      },
                      onClose: () => {
                        popup?.[0]?.hide()
                      },
                    },
                    editor: props.editor as import('@tiptap/react').Editor,
                  })

                  if (!props.clientRect) return

                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                  })
                },
                onUpdate: (props: { query: string; items: SlashCommand[]; clientRect: (() => DOMRect | null) | null; range: unknown }) => {
                  // Update the range as user types
                  currentRange = props.range
                  
                  component?.updateProps({
                    items: props.items,
                    query: props.query,
                  })

                  if (props.clientRect) {
                    popup?.[0]?.setProps({
                      getReferenceClientRect: props.clientRect as () => DOMRect,
                    })
                  }
                },
                onKeyDown: (props: { event: KeyboardEvent }) => {
                  if (props.event.key === 'Escape') {
                    popup?.[0]?.hide()
                    return true
                  }

                  return component?.ref?.onKeyDown(props.event) ?? false
                },
                onExit: () => {
                  popup?.[0]?.destroy()
                  component?.destroy()
                },
              }
            },
          },
        }),
      ],
      content: typeof content === 'string' ? content : content,
      editable,
      autofocus: autoFocus,
      onUpdate: ({ editor }) => {
        if (onChange) {
          onChange({
            html: editor.getHTML(),
            json: editor.getJSON(),
            text: editor.getText(),
          })
        }
        // Force re-render for controlled component behavior
        setForceUpdate((n) => n + 1)
      },
      onCreate: ({ editor }) => {
        // Call plugin onInit
        plugins.forEach((plugin) => plugin.onInit?.(editor))
      },
      onDestroy: () => {
        // Call plugin onDestroy
        plugins.forEach((plugin) => plugin.onDestroy?.())
      },
    })

    // Imperative handle
    const getContent = useCallback(
      (format: EditorContentFormat = 'html') => {
        if (!editor) return null
        switch (format) {
          case 'html':
            return editor.getHTML()
          case 'json':
            return editor.getJSON()
          case 'text':
            return editor.getText()
          default:
            return editor.getHTML()
        }
      },
      [editor]
    )

    const setContent = useCallback(
      (newContent: string | Record<string, unknown>) => {
        if (!editor) return
        if (typeof newContent === 'string') {
          editor.commands.setContent(newContent)
        } else {
          editor.commands.setContent(newContent)
        }
      },
      [editor]
    )

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editor,
        getContent,
        setContent,
        focus: () => editor?.commands.focus(),
        blur: () => editor?.commands.blur(),
        isEmpty: () => editor?.isEmpty ?? true,
        clear: () => editor?.commands.clearContent(),
      }),
      [editor, getContent, setContent]
    )

    if (!editor) {
      return null
    }

    // Determine if toolbar should be shown (defaults to true in edit mode)
    const shouldShowToolbar = showToolbar ?? editable

    if (shouldShowToolbar && editable) {
      return (
        <div className="editor-with-toolbar" style={{ minHeight }}>
          <Toolbar editor={editor} pluginActions={pluginToolbarActions} />
          <div
            className={cn('rich-text-editor', className)}
            data-editable={editable}
          >
            <BubbleMenu editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn('rich-text-editor', className)}
        data-editable={editable}
        style={{ minHeight }}
      >
        {editable && <BubbleMenu editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    )
  }
)
