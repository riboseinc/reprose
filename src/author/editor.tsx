import React, { RefObject } from 'react';
import styled from '@emotion/styled';
import JSONView from 'react-json-view';
import type { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView, EditorProps as ProseMirrorEditorProps } from 'prosemirror-view';
import { AuthoringFeature } from './feature';
import DefaultMenuBar, { MenuOption, MenuBarProps } from './menu';
import { featuresToMenuGroups, featuresToPlugins } from '.';


export interface EditorProps<S extends Schema> {
  /**
   * A ProseMirror structure. At its root it will have at least `{ type: 'doc' }`.
   * If the document is invalid (including violation of the schema passed in the `schema` prop),
   * a fallback view will be displayed.
   */
  initialDoc: Record<string, any>

  /** Use `featuresToSchema()` to convert schema features to ProseMirror schema. */
  schema: S

  features: AuthoringFeature<S>[]

  /**
   * Called on every change within ProseMirror
   * EditorView’s `dispatchTransaction()` handler.
   */
  onChange?: (doc: Record<string, any>) => void

  /** If undefined, `DefaultMenuBar` will be used. */
  MenuBar?: React.FC<MenuBarProps> | null

  //render?: (props: { editor: JSX.Element, view: EditorView<S> }) => JSX.Element

  prosemirrorEditorProps?: ProseMirrorEditorProps
  autoFocus?: boolean

  className?: string
  proseMirrorClassName?: string
  style?: React.CSSProperties

  logger?: Pick<Console, 'debug' | 'warn' | 'error' | 'info'>

  /**
   * Reprose user can pass in own React instance,
   * which will be further passed to authoring features.
   */
  reactCls?: typeof React
}


/**
 * ProseMirror editor, wrapped into a React component.
 */
class Editor extends React.Component<EditorProps<any>> {
  view: EditorView;

  /**
   * Errors populated at runtime, including schema validation errors.
   * A non-empty array implies the document failed to be processed.
   */
  errors: string[] = [];
  editorRef: RefObject<HTMLDivElement>;
  menuGroups: Record<string, Record<string, MenuOption<any>>>;

  constructor(props: EditorProps<any>) {
    super(props);

    const plugins = featuresToPlugins(props.features, props.schema, props.reactCls || React);

    this.editorRef = React.createRef<HTMLDivElement>();
    let doc: any;
    try {
      doc = props.schema.nodeFromJSON(this.props.initialDoc);
      this.errors = [];
    } catch (e) {
      // TODO: If we make `this.view` optional, we can avoid this rigmarole
      doc = props.schema.nodeFromJSON(PLACEHOLDER_SCHEMA_ERROR_NOTICE);
      this.errors.push((e as any).toString?.() ?? `${e}`);
    }
    this.view = new EditorView(undefined, {
      state: EditorState.create({
        doc,
        schema: props.schema,
        plugins,
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
    this.menuGroups = featuresToMenuGroups(props.features, props.schema);
  }

  componentDidUpdate(newProps: EditorProps<any>) {
    const editable = newProps.onChange !== undefined ? (() => true) : (() => false);
    this.view.setProps({
      editable,
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
    const Menu = this.props.MenuBar !== undefined
      ? this.props.MenuBar
      : DefaultMenuBar;

    if (this.errors.length <= 0) {
      return (
        <>
          {Menu
            ? <Menu menu={this.menuGroups} view={this.view} />
            : null}
          <StyledReactProseMirrorContainer
            ref={this.editorRef}
            className={this.props.className}
            style={this.props.style}
          />
        </>
      );
    } else {
      const handleEditDoc = (doc: any) => this.props.onChange
        ? this.props.onChange(doc)
        : void 0;

      return (
        <FallbackView
          className={this.props.className}
          doc={this.props.initialDoc}
          onValidateAgainstSchema={this.props.schema.nodeFromJSON}
          onChange={this.props.onChange ? handleEditDoc : undefined}
        />
      );
    }
  }
}


interface FallbackViewProps {
  /** A ProseMirror document structure, with `{ type: 'doc' }` at topmost level. */
  doc: any

  /** Should throw if a document does not comply with the schema. */
  onValidateAgainstSchema: (doc: any) => void

  /**
   * Called on any change the user makes to the raw document,
   * if the document looks valid after the change.
   */
  onChange?: (newDoc: any) => void 

  className?: string
}

interface FallbackViewState {
  _raw: string | null
  jsonParseError: string | null
  schemaValidationError: string | null 
}

/**
 * If main editor fails to display a document (e.g., due to schema violation),
 * it shows this as fallback view allowing the user to edit the source
 * as text directly and showing any errors.
 * 
 * TODO: Allow users to pass custom fallback view implementation to `Editor` instance.
 */
class FallbackView extends React.Component<FallbackViewProps, FallbackViewState> {
  state: FallbackViewState = {
    _raw: null,
    jsonParseError: null,
    schemaValidationError: null,
  }

  constructor(props: FallbackViewProps) {
    super(props);
  }

  componentDidMount() {
    this.deserializeAndValidateDoc(JSON.stringify(this.props.doc));
  }
  componentWillReceiveProps(nextProps: FallbackViewProps) {
    const newDoc = JSON.stringify(nextProps.doc);
    const oldDoc = JSON.stringify(this.props.doc);
    if (newDoc !== oldDoc) {
      this.setState({ _raw: null });
    }
    this.deserializeAndValidateDoc(JSON.stringify(newDoc));
  }

  deserializeAndValidateDoc(newRaw: string): undefined | Record<string, any> {
    let newDoc;
    try {
      newDoc = JSON.parse(newRaw);
      this.setState({ jsonParseError: null });
    } catch (e) {
      this.setState({ jsonParseError: (e as any).toString?.() ?? `${e}` });
      return undefined;
    }
    try {
      this.props.onValidateAgainstSchema(newDoc);
      this.setState({ schemaValidationError: null });
    } catch (e) {
      this.setState({ schemaValidationError: (e as any).toString?.() ?? `${e}` });
      return undefined;
    }
    return newDoc;
  }

  handleUpdateRaw(newRaw: string | null) {
    this.setState({ _raw: newRaw });

    if (newRaw !== null) {
      const newDoc = this.deserializeAndValidateDoc(newRaw);
      if (newDoc && this.props.onChange) {
        this.props.onChange(newDoc);
      }
    }
  }

  render() {
    const errors = [this.state?.jsonParseError, this.state.schemaValidationError].filter(v => v !== null);

    const handleChange = (evt: { updated_src: any }) => {
      this.props.onChange
        ? this.handleUpdateRaw(JSON.stringify(evt.updated_src))
        : undefined
    }

    return (
      <StyledFallbackViewContainer className={this.props.className}>
        <div>
          <p>
            Ouch! This document could not be loaded.
            Most likely the structure does not conform to the ProseMirror schema expected
            by this editor instance (such as by using content blocks that the schema does not have provisions for),
            or source data could be malformed in some other way.
          </p>
          <p>
            Below you can correct the source document so that it uses a structure that conforms to required schema.
          </p>
        </div>

        {this.state.jsonParseError
          ? <StyledFallbackTextarea
              value={this.state._raw ?? JSON.stringify(this.props.doc, undefined, 4)}
              disabled={!this.props.onChange}
              onChange={this.props.onChange
                ? (evt => this.handleUpdateRaw(evt.currentTarget.value))
                : undefined}
            />
          : <JSONView
              style={{ flex: 1, overflowY: 'auto' }}
              src={this.state._raw !== null ? JSON.parse(this.state._raw) : this.props.doc}
              onEdit={handleChange}
              onAdd={handleChange}
              onDelete={handleChange}
            />}

        {errors.length > 0
          ? <StyledValidationErrorContainer>
              <p>Following errors were encountered while validating the document:</p>
              <ul>
                {errors.map(e => <li>{e}</li>)}
              </ul>
            </StyledValidationErrorContainer>
          : null}
      </StyledFallbackViewContainer>
    );
  }
}

export default Editor;


const StyledFallbackViewContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  padding: 10px;
  background: #fefefe !important;
  overflow: hidden;
`;

const StyledFallbackTextarea = styled.textarea`
  flex: 1;
  margin: 10px 0;
  padding: 10px;
  background: #ddd;
  border: none;
  font-size: 12px;
`;

const StyledValidationErrorContainer = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: lightsalmon;
`;

const StyledReactProseMirrorContainer = styled.div`

  // ProseMirror CSS

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

  // React ProseMirror CSS

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


const PLACEHOLDER_SCHEMA_ERROR_NOTICE = {
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{
      type: 'text',
      text: 'Document could not be parsed. Most likely, it does not conform to the schema expected by this editor instance (such as by using content blocks that the schema does not have provisions for).',
    }],
  },
  {
    type: 'paragraph',
    content: [{
      type: 'text',
      text: 'You can edit this text and save changes, in which case it will overwrite the original contents.',
    }],
  }, {
    type: 'paragraph',
    content: [{
      type: 'text',
      text: 'Otherwise, for the time being it’s required to manually correct the source document so that it uses a structure that conforms to required schema.',
    }],
  }],
};
