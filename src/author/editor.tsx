/** @jsx jsx */

import { css, jsx } from '@emotion/core';
import React, { RefObject } from 'react';
import { Schema } from 'prosemirror-model';
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView, EditorProps as ProseMirrorEditorProps } from 'prosemirror-view';


export interface EditorProps<S extends Schema> {
  initialDoc: Record<string, any>
  schema: S

  plugins?: Array<Plugin<any, S>>
  prosemirrorEditorProps?: ProseMirrorEditorProps

  onChange?: (doc: Record<string, any>) => void
  autoFocus?: boolean

  render?: (props: { editor: JSX.Element, view: EditorView<S> }) => JSX.Element
  className?: string
  proseMirrorClassName?: string
  style?: React.CSSProperties
  logger?: Pick<Console, 'debug' | 'warn' | 'error' | 'info'>
}


class Editor extends React.Component<EditorProps<any>> {
  view: EditorView;
  editorRef: RefObject<HTMLDivElement>;

  constructor(props: EditorProps<any>) {
    super(props);
    this.editorRef = React.createRef<HTMLDivElement>();
    this.view = new EditorView(undefined, {
      state: EditorState.create({
        doc: props.schema.nodeFromJSON(this.props.initialDoc),
        schema: props.schema,
        plugins: props.plugins,
      }),
      dispatchTransaction: transaction => {
        const { state, transactions } = this.view.state.applyTransaction(transaction);

        this.view.updateState(state);

        if (transactions.some(tr => tr.docChanged)) {
          this.props.onChange ? this.props.onChange(state.doc.toJSON()) : void 0;
        }
        this.forceUpdate();
      },
      ...(props.prosemirrorEditorProps || {}),
    });
  }

  componentDidMount() {
    if (this.props.proseMirrorClassName) {
      for (const token of this.props.proseMirrorClassName.split(' ')) {
        const cls = token.trim();
        if (cls !== '') {
          this.view.dom.classList.add(cls);
        }
      }
    }

    this.editorRef.current?.appendChild(this.view.dom);

    if (this.props.autoFocus) {
      this.view.focus();
    }
  }

  render() {
    const editor = <div
      ref={this.editorRef}
      className={this.props.className}
      css={css`
        ${PROSEMIRROR_CSS}
        ${REACT_PROSEMIRROR_CSS}
      `}
      style={this.props.style}
    />;

    return this.props.render
      ? this.props.render({
          editor,
          view: this.view,
        })
      : editor;
  }
}


export default Editor;


const PROSEMIRROR_CSS = `
  .ProseMirror {
    position: relative;
  }

  .ProseMirror {
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: break-spaces;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
  }

  .ProseMirror pre {
    white-space: pre-wrap;
  }

  .ProseMirror li {
    position: relative;
  }

  .ProseMirror-hideselection *::selection { background: transparent; }
  .ProseMirror-hideselection *::-moz-selection { background: transparent; }
  .ProseMirror-hideselection { caret-color: transparent; }

  .ProseMirror-selectednode {
    outline: 2px solid #8cf;
  }

  /* Make sure li selections wrap around markers */

  li.ProseMirror-selectednode {
    outline: none;
  }

  li.ProseMirror-selectednode:after {
    content: "";
    position: absolute;
    left: -32px;
    right: -2px; top: -2px; bottom: -2px;
    border: 2px solid #8cf;
    pointer-events: none;
  }
`;


const REACT_PROSEMIRROR_CSS = `
  .ProseMirror {
    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    padding: 10px;
    background: #fff;
  }

  .ProseMirror:focus {
    outline: none;
  }

  .ProseMirror hr {
    padding: 2px 10px;
    border: none;
    margin: 1em 0;
  }

  .ProseMirror hr:after {
    content: "";
    display: block;
    height: 1px;
    background-color: silver;
    line-height: 2px;
  }

  .ProseMirror ul, .ProseMirror ol {
    padding-left: 30px;
  }

  .ProseMirror blockquote {
    padding-left: 1em;
    border-left: 3px solid #eee;
    margin-left: 0;
    margin-right: 0;
  }

  .ProseMirror img {
    cursor: default;
  }

  .ProseMirror th,
  .ProseMirror td {
    border: 1px solid #eee;
    padding: 2px 5px;
  }

  .ProseMirror sup,
  .ProseMirror sub {
    line-height: 0;
  }
`;
