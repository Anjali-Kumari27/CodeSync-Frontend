import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { oneDark } from '@codemirror/theme-one-dark';

import { useAuthStore } from '../store';
import { collabApi } from '../api/services';
import {
  connectCollab,
  disconnectCollab,
  sendCursor,
  sendEdit,
  sendTyping
} from '../api/collabService';

const LANG_EXTENSIONS: Record<string, any> = {
  JAVASCRIPT: javascript({ jsx: true }),
  TYPESCRIPT: javascript({ jsx: true, typescript: true }),
  JAVA: java(),
  PYTHON: python(),
  CPP: cpp(),
  C: cpp(),
  RUST: rust(),
  GO: go(),
  KOTLIN: java(),
  BASH: javascript(),
};

interface Props {
  fileId: number;
  content: string;
  language: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  projectId: number;
}

export default function CodeEditor({
  fileId,
  content,
  language,
  onChange,
  readOnly,
  projectId,
}: Props) {
  const { user } = useAuthStore();

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const sessionIdRef = useRef<number | null>(null);
  const remoteUpdatingRef = useRef(false);

  // create collab session + websocket connect
  useEffect(() => {
    if (!user?.id) return;

    const init = async () => {
      try {
        let sessionId: number;

        try {
          // POST /sessions handles both creating a new session OR joining an existing one
          // and properly registers the user as an active participant in the database.
          const res = await collabApi.createSession({
            fileId,
            projectId,
            sessionName: `File-${fileId}`,
            language,
          });
          sessionId = res.data.id;
        } catch (err) {
          console.error('Failed to create or join session:', err);
          return;
        }

        sessionIdRef.current = sessionId;

        connectCollab(
          sessionId,
          user.id,
          (msg) => {
            if (!viewRef.current) return;

            if (
              msg.type === 'INSERT' ||
              msg.type === 'DELETE' ||
              msg.type === 'REPLACE'
            ) {
              remoteUpdatingRef.current = true;

              const newText = msg.text ?? '';

              const current = viewRef.current.state.doc.toString();

              if (current !== newText) {
                viewRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: current.length,
                    insert: newText,
                  },
                });

                onChange(newText);
              }

              remoteUpdatingRef.current = false;
            }

            if (msg.type === 'TYPING') {
              console.log(msg.username + ' is typing...');
            }

            if (msg.type === 'CURSOR') {
              console.log(
                `${msg.username} cursor at line ${msg.cursorLine}`
              );
            }

            if (msg.type === 'COMMENT') {
              // Dispatch a global event so the CommentsPanel knows to reload
              window.dispatchEvent(new CustomEvent('collab-comment-added', { detail: { fileId } }));
            }
          }
        );
      } catch (e) {
        console.error('Collaboration init failed', e);
      }
    };

    init();

    return () => {
      if (sessionIdRef.current && user?.id) {
        disconnectCollab(sessionIdRef.current, user.id);
      }
    };
  }, [fileId]);

  // create editor
  useEffect(() => {
    if (!editorRef.current) return;

    const langExt = LANG_EXTENSIONS[language] || javascript();

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        oneDark,
        langExt,

        EditorView.editable.of(!readOnly),

        EditorView.updateListener.of((update) => {
          if (!viewRef.current) return;

          // content changed
          if (
            update.docChanged &&
            !readOnly &&
            !remoteUpdatingRef.current
          ) {
            const newContent =
              update.state.doc.toString();

            onChange(newContent);

            if (sessionIdRef.current && user) {
              sendEdit({
                sessionId: sessionIdRef.current,
                userId: user.id,
                username: user.username,
                type: 'REPLACE',
                text: newContent,
                timestamp: Date.now(),
              });

              sendTyping({
                sessionId: sessionIdRef.current,
                userId: user.id,
                username: user.username,
                type: 'TYPING',
                typing: true,
                timestamp: Date.now(),
              });
            }
          }

          // cursor moved
          if (update.selectionSet && sessionIdRef.current && user) {
            const pos =
              update.state.selection.main.head;

            const line =
              update.state.doc.lineAt(pos);

            sendCursor({
              sessionId: sessionIdRef.current,
              userId: user.id,
              username: user.username,
              type: 'CURSOR',
              cursorLine: line.number,
              cursorColumn: pos - line.from,
              timestamp: Date.now(),
            });
          }
        }),

        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13.5px',
            fontFamily:
              "'JetBrains Mono','Fira Code',monospace",
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
          '.cm-content': {
            padding: '8px 0',
          },
          '.cm-gutters': {
            backgroundColor: '#0d1117',
            borderRight:
              '1px solid rgba(99,130,255,0.12)',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [fileId, language]);

  // sync external content
  useEffect(() => {
    if (!viewRef.current) return;

    const current =
      viewRef.current.state.doc.toString();

    if (current !== content) {
      remoteUpdatingRef.current = true;

      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: content,
        },
      });

      remoteUpdatingRef.current = false;
    }
  }, [content]);

  return (
    <div
      ref={editorRef}
      style={{
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        background: '#0d1117',
      }}
    />
  );
}