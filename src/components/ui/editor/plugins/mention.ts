import { AtSign } from 'lucide-react'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { EditorPlugin, MentionItem } from '../types'
import { MentionExtension } from '../extensions/mention-extension'
import { MentionSuggestion } from '../extensions/mention-suggestion'
import { MentionList, type MentionListRef } from '../mention-list'

export interface MentionPluginOptions {
  /**
   * Trigger character for mentions (default: "@")
   */
  trigger?: string

  /**
   * Search handler - required. Called when user types after trigger.
   * Should return filtered list of mention items.
   */
  onSearch: (query: string) => Promise<MentionItem[]> | MentionItem[]

  /**
   * Allow spaces in search query (default: false)
   * If false, mention closes on space
   */
  allowSpaces?: boolean

  /**
   * Minimum characters before searching (default: 0)
   */
  minQueryLength?: number

  /**
   * Maximum items to show in dropdown (default: 10)
   */
  maxSuggestions?: number

  /**
   * Debounce delay for search in ms (default: 150)
   */
  debounceMs?: number

  /**
   * Custom render for dropdown items
   */
  renderItem?: (item: MentionItem, isSelected: boolean) => React.ReactNode

  /**
   * Custom render for inserted mention
   */
  renderMention?: (item: MentionItem) => React.ReactNode

  /**
   * Placeholder text when no results (default: "No results found")
   */
  noResultsText?: string

  /**
   * Loading text while searching (default: "Searching...")
   */
  loadingText?: string

  /**
   * Callback when a mention is selected/inserted
   */
  onMentionSelect?: (item: MentionItem) => void

  /**
   * Callback when a mention is removed from editor
   */
  onMentionRemove?: (item: MentionItem) => void

  /**
   * Callback when mention is clicked in view/edit mode
   */
  onMentionClick?: (item: MentionItem, event: MouseEvent) => void
}

export function createMentionPlugin(options: MentionPluginOptions): EditorPlugin {
  const {
    trigger = '@',
    onSearch,
    allowSpaces = false,
    minQueryLength = 0,
    maxSuggestions = 10,
    debounceMs = 150,
    renderItem,
    renderMention,
    noResultsText = 'No results found',
    loadingText = 'Searching...',
    onMentionSelect,
    onMentionRemove,
    onMentionClick,
  } = options

  return {
    name: 'mention',

    extensions: [
      MentionExtension.configure({
        onMentionClick,
        onMentionRemove,
        renderMention,
      }),
      MentionSuggestion.configure({
        trigger,
        onSearch,
        allowSpaces,
        minQueryLength,
        maxSuggestions,
        debounceMs,
        renderItem,
        noResultsText,
        loadingText,
        onMentionSelect,
        suggestion: {
          render: () => {
            let component: ReactRenderer<MentionListRef> | null = null
            let popup: TippyInstance[] | null = null

            return {
              onStart: (props: SuggestionProps<MentionItem>) => {
                component = new ReactRenderer(MentionList, {
                  props: {
                    ...props,
                    loading: false,
                    noResultsText,
                    loadingText,
                    renderItem,
                    command: props.command,
                  },
                  editor: props.editor,
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
                  animation: 'shift-away',
                  maxWidth: 'none',
                })
              },

              onUpdate: (props: SuggestionProps<MentionItem>) => {
                component?.updateProps({
                  ...props,
                  loading: false,
                  noResultsText,
                  loadingText,
                  renderItem,
                  command: props.command,
                })

                if (!props.clientRect) return

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide()
                  return true
                }

                return component?.ref?.onKeyDown(props) ?? false
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

    // Optional: Add slash command for mentions
    slashCommands: [
      {
        name: 'Mention',
        description: 'Mention a user',
        icon: AtSign,
        aliases: ['mention', 'user', '@'],
        group: 'basic',
        action: (editor) => {
          // Insert @ character to trigger mention
          editor.chain().focus().insertContent(trigger).run()
        },
      },
    ],
  }
}
