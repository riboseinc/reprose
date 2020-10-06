import React from 'react';

import { MarkType, NodeType, Schema } from 'prosemirror-model';
import { Keymap, baseKeymap, chainCommands } from 'prosemirror-commands';
import { InputRule, inputRules, smartQuotes, emDash, ellipsis } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { EditorProps } from './editor';
import DefaultMenuBar, { MenuBarProps, MenuGroups, MenuOption } from './menu';
import { EditorState, NodeSelection, Selection, Plugin } from 'prosemirror-state';


function isNodeSelection(selection: Selection): selection is NodeSelection {
  return selection.hasOwnProperty('node');
}


export const blockActive =
<S extends Schema>(type: NodeType<S>, attrs: Record<string, any> = {}): MenuOption<S>["active"] =>
(state: EditorState<S>) => {
  const { $from, to } = state.selection;

  if (isNodeSelection(state.selection) && state.selection.node) {
    return state.selection.node.hasMarkup(type, attrs);
  } else {
    return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
  }
}


export const markActive =
<S extends Schema>(type: MarkType<S>): MenuOption<S>["active"] =>
(state: EditorState<S>) => {
  const { from, $from, to, empty } = state.selection;

  const result = empty
    ? type.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, type);

  return result !== null && result !== undefined && result !== false;
}


export interface AuthoringFeature<S extends Schema> {
  getMenuOptions?(schema: S): MenuGroups<S>
  getInputRules?(schema: S): InputRule<S>[]
  getKeymap?(schema: S): Keymap<S>
  getPlugins?(schema: S): Plugin<any, S>[]
}


const defaultTypographicInputRules = [
  ...smartQuotes,
  ellipsis,
  emDash,
];


interface EditorCustomizationOptions {
  MenuBar?: React.FC<MenuBarProps>
}


export default function featuresToEditorProps
<S extends Schema>
(features: AuthoringFeature<S>[], schema: S, opts?: EditorCustomizationOptions):
Omit<EditorProps<S>, 'onChange' | 'logger' | 'initialDoc' | 'key' | 'css' | 'style' | 'className'> {

  const menuGroups = features.
    filter(f => f.getMenuOptions !== undefined).
    map(f => f.getMenuOptions!(schema)).
    reduce((prev, curr) => {
      const resultingGroups: MenuGroups<S> = prev;
      for (const [groupID, menuItems] of Object.entries(curr)) {
        resultingGroups[groupID] ||= {};
        Object.assign(resultingGroups[groupID], menuItems);
      }
      return resultingGroups;
    }, {});

  const extraRules = features.
    filter(f => f.getInputRules !== undefined).
    map(f => f.getInputRules!(schema)).
    reduce((prev, curr) => {
      return [ ...prev, ...curr ];
    }, []);
  const rules: InputRule<S>[] = [
    ...defaultTypographicInputRules,
    ...extraRules,
  ];

  const keymaps = features.
    filter(f => f.getKeymap !== undefined).
    map(f => f.getKeymap!(schema)).
    reduce((prev, curr) => {
      Object.keys(prev).forEach(key => {
        if (curr[key]) {
          curr[key] = chainCommands(curr[key], prev[key]);
        } else {
          curr[key] = prev[key];
        }
      });
      return curr;
    }, baseKeymap);

  const plugins = [
    inputRules({ rules }),
    keymap(keymaps),
  ];

  const MenuBar = opts?.MenuBar || DefaultMenuBar

  return {
    plugins,
    schema,
    render: ({ editor, view }) => (
      <>
        <MenuBar menu={menuGroups} view={view} />
        {editor}
      </>
    ),
  };
}
