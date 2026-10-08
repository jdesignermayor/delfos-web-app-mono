"use client";

import type { ComponentType } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extensions";
import { Bold, Heading3, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";

import { MARKDOWN_PROSE_CLASS } from "@/lib/markdown";

/** Only the formatting `MarkdownContent` renders; everything else in StarterKit is off. */
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [3] },
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  // `breaks`: single newlines in older plain-text descriptions stay as line breaks.
  Markdown.configure({ markedOptions: { breaks: true } }),
];

type ToolbarAction = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
  canRun?: (editor: Editor) => boolean;
};

const FORMAT_ACTIONS: ToolbarAction[] = [
  {
    label: "Negrita",
    icon: Bold,
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    label: "Cursiva",
    icon: Italic,
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    label: "Subtítulo",
    icon: Heading3,
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Lista con viñetas",
    icon: List,
    isActive: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Lista numerada",
    icon: ListOrdered,
    isActive: (editor) => editor.isActive("orderedList"),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
];

const HISTORY_ACTIONS: ToolbarAction[] = [
  {
    label: "Deshacer",
    icon: Undo2,
    run: (editor) => editor.chain().focus().undo().run(),
    canRun: (editor) => editor.can().undo(),
  },
  {
    label: "Rehacer",
    icon: Redo2,
    run: (editor) => editor.chain().focus().redo().run(),
    canRun: (editor) => editor.can().redo(),
  },
];

function ToolbarButton({
  action,
  active,
  disabled,
  editor,
}: {
  action: ToolbarAction;
  active: boolean;
  disabled: boolean;
  editor: Editor;
}) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      title={action.label}
      aria-label={action.label}
      aria-pressed={action.isActive ? active : undefined}
      disabled={disabled}
      // Keep the selection in the editor while clicking the toolbar.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => action.run(editor)}
      className={`flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render the toolbar only when an active/enabled state actually changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      active: FORMAT_ACTIONS.map((action) => action.isActive?.(current) ?? false),
      enabled: HISTORY_ACTIONS.map((action) => action.canRun?.(current) ?? true),
    }),
  });

  return (
    <div role="toolbar" aria-label="Formato" className="flex items-center gap-0.5 border-b border-separator p-1">
      {FORMAT_ACTIONS.map((action, index) => (
        <ToolbarButton key={action.label} action={action} editor={editor} active={state.active[index]} disabled={false} />
      ))}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-separator" />
      {HISTORY_ACTIONS.map((action, index) => (
        <ToolbarButton key={action.label} action={action} editor={editor} active={false} disabled={!state.enabled[index]} />
      ))}
    </div>
  );
}

/**
 * Small WYSIWYG editor that reads and writes Markdown. `value` is only used
 * as the initial content; afterwards the editor owns the text and reports
 * every change through `onChange`.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  invalid = false,
}: {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  ariaLabel: string;
  invalid?: boolean;
}) {
  const editor = useEditor({
    extensions: [...EXTENSIONS, Placeholder.configure({ placeholder: placeholder ?? "" })],
    content: value,
    contentType: "markdown",
    // Rendered in the browser only; avoids a hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        "aria-multiline": "true",
        role: "textbox",
        class: `${MARKDOWN_PROSE_CLASS} min-h-36 px-3 py-2.5 text-sm text-foreground outline-none`,
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? "" : current.getMarkdown()),
  });

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-focus/30 ${
        invalid ? "border-danger" : "border-separator"
      }`}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-[41px] border-b border-separator" />}
      <EditorContent
        editor={editor}
        className="[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
