'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Eraser,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  helperText?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
  rows = 4,
  label,
  className = '',
  helperText,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const savedSelectionRef = useRef<Range | null>(null);

  // Link Dialog Modal State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Active formats state for toolbar highlights
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
    quote: false,
  });

  // Save current selection range
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection range
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Check which formatting states are currently active
  const checkActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return;
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const ul = document.queryCommandState('insertUnorderedList');
      const ol = document.queryCommandState('insertOrderedList');

      // Check block tags
      const sel = window.getSelection();
      let h1 = false;
      let h2 = false;
      let quote = false;

      if (sel && sel.anchorNode) {
        let el: Node | null = sel.anchorNode;
        while (el && el !== editorRef.current) {
          if (el.nodeName === 'H1' || el.nodeName === 'H2') {
            h1 = true;
          }
          if (el.nodeName === 'H3') {
            h2 = true;
          }
          if (el.nodeName === 'BLOCKQUOTE') {
            quote = true;
          }
          el = el.parentNode;
        }
      }

      setActiveFormats({ bold, italic, underline, h1, h2, ul, ol, quote });
    } catch {
      // ignore
    }
  }, []);

  // Sync initial and external changes
  useEffect(() => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      if (value !== currentHTML) {
        let htmlValue = value || '';
        if (htmlValue && !htmlValue.startsWith('<') && !htmlValue.includes('</')) {
          htmlValue = htmlValue
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');
        }
        editorRef.current.innerHTML = htmlValue;
        const text = editorRef.current.innerText.trim();
        setIsEmpty(!text && !htmlValue.includes('<img'));
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText.trim();
      const empty = !text && !html.includes('<img') && html !== '<p><br></p>';
      setIsEmpty(empty);
      onChange(empty ? '' : html);
      checkActiveFormats();
    }
  }, [onChange, checkActiveFormats]);

  // Execute standard formatting commands
  const executeCommand = (command: string, arg?: string) => {
    if (typeof document !== 'undefined' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();

      try {
        document.execCommand(command, false, arg);
      } catch (e) {
        console.warn('execCommand:', e);
      }

      saveSelection();
      handleInput();
    }
  };

  // Robust heading toggle
  const toggleHeading = (level: 'H1' | 'H2' | 'P') => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const tag = level === 'H1' ? 'h2' : level === 'H2' ? 'h3' : 'p';

    try {
      const success = document.execCommand('formatBlock', false, tag);
      if (!success) {
        document.execCommand('formatBlock', false, `<${tag}>`);
      }
    } catch {
      try {
        document.execCommand('formatBlock', false, `<${tag}>`);
      } catch {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const headingNode = document.createElement(tag);
          headingNode.appendChild(range.extractContents());
          range.insertNode(headingNode);
        }
      }
    }

    saveSelection();
    handleInput();
  };

  // Robust quote toggle
  const toggleQuote = () => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    try {
      document.execCommand('formatBlock', false, 'blockquote');
    } catch {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const bq = document.createElement('blockquote');
        bq.appendChild(range.extractContents());
        range.insertNode(bq);
      }
    }

    saveSelection();
    handleInput();
  };

  // Open Link Dialog
  const openLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  // Apply Link
  const applyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('mailto:')) {
      finalUrl = `https://${finalUrl}`;
    }

    setShowLinkDialog(false);
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();

      if (linkText.trim()) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const a = document.createElement('a');
          a.href = finalUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = linkText;
          a.className = 'text-[#0099e6] underline font-semibold cursor-pointer';
          range.insertNode(a);
        }
      } else {
        document.execCommand('createLink', false, finalUrl);
      }

      handleInput();
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Explicit scoped CSS for visual WYSIWYG tags */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .wysiwyg-surface ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .wysiwyg-surface ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .wysiwyg-surface li {
              display: list-item !important;
              margin: 0.25rem 0 !important;
              list-style-position: outside !important;
            }
            .wysiwyg-surface h1,
            .wysiwyg-surface h2 {
              font-size: 1.25rem !important;
              font-weight: 900 !important;
              color: #0f172a !important;
              margin: 0.6rem 0 0.25rem 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .wysiwyg-surface h3,
            .wysiwyg-surface h4 {
              font-size: 1.05rem !important;
              font-weight: 700 !important;
              color: #1e293b !important;
              margin: 0.5rem 0 0.2rem 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .wysiwyg-surface p {
              margin: 0.25rem 0 !important;
            }
            .wysiwyg-surface blockquote {
              border-left: 4px solid #0099e6 !important;
              padding: 0.4rem 0.75rem !important;
              margin: 0.5rem 0 !important;
              font-style: italic !important;
              background-color: rgba(0, 153, 230, 0.08) !important;
              border-radius: 0 0.5rem 0.5rem 0 !important;
              color: #334155 !important;
            }
            .wysiwyg-surface a {
              color: #0099e6 !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            .wysiwyg-surface b,
            .wysiwyg-surface strong {
              font-weight: 800 !important;
            }
            .wysiwyg-surface i,
            .wysiwyg-surface em {
              font-style: italic !important;
            }
            .wysiwyg-surface u {
              text-decoration: underline !important;
            }
            .wysiwyg-surface strike,
            .wysiwyg-surface s {
              text-decoration: line-through !important;
            }
          `,
        }}
      />

      {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-[#0099e6] focus-within:border-transparent transition-all">
        {/* WYSIWYG Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200/90 text-slate-700">
          {/* Bold */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('bold');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.bold
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Bold className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('italic');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.italic
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('underline');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeFormats.underline
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            title="Strikethrough"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('strikeThrough');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* H1 Heading */}
          <button
            type="button"
            title="Large Heading (H1)"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('H1');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeFormats.h1
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            H1
          </button>

          {/* H2 Heading */}
          <button
            type="button"
            title="Medium Heading (H2)"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('H2');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.h2
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-800'
            }`}
          >
            H2
          </button>

          {/* Normal Paragraph */}
          <button
            type="button"
            title="Normal Body Text"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleHeading('P');
            }}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            Normal
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            title="Bullet Points List"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertUnorderedList');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.ul
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Numbered List"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertOrderedList');
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.ol
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Quote Block */}
          <button
            type="button"
            title="Quote Block"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleQuote();
            }}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFormats.quote
                ? 'bg-[#0099e6] text-white shadow-2xs'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Link */}
          <button
            type="button"
            title="Insert Website Link"
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkDialog();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Clear formatting */}
          <button
            type="button"
            title="Clear Formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('removeFormat');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-auto"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Link Insertion Modal / Inline Popover */}
        {showLinkDialog && (
          <div className="p-3 bg-sky-50 border-b border-sky-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Display text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
            />
            <input
              type="url"
              autoFocus
              required
              placeholder="Paste URL (e.g. https://github.com/...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={applyLink}
                className="px-3 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Live Visual ContentEditable Area */}
        <div className="relative">
          {isEmpty && (
            <div className="absolute top-3.5 left-4 pointer-events-none text-xs text-slate-400 select-none">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onKeyUp={() => {
              saveSelection();
              checkActiveFormats();
            }}
            onMouseUp={() => {
              saveSelection();
              checkActiveFormats();
            }}
            onSelect={() => {
              saveSelection();
              checkActiveFormats();
            }}
            style={{ minHeight: `${rows * 2}rem` }}
            className="wysiwyg-surface p-4 text-xs text-slate-900 outline-none leading-relaxed font-sans"
          />
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#0099e6]" />
            <span>WYSIWYG Direct Editor • Formatting applies instantly</span>
          </span>
          <span className="font-semibold text-slate-500">Live Visual Format</span>
        </div>
      </div>

      {helperText && <p className="text-[10px] text-slate-400">{helperText}</p>}
    </div>
  );
}
