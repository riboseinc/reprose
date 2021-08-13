import type React from 'react';
import type { Plugin } from 'prosemirror-state';
import type { Schema } from 'prosemirror-model';
import { baseKeymap, chainCommands } from 'prosemirror-commands';
import { InputRule, inputRules, smartQuotes, emDash, ellipsis } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import type { MenuGroups, MenuOption } from './menu';
import type { AuthoringFeature } from './feature';

export { AuthoringFeature } from './feature';
export * from './util';


const defaultTypographicInputRules = [
  ...smartQuotes,
  ellipsis,
  emDash,
];


export function featuresToMenuGroups
<S extends Schema>
(features: AuthoringFeature<S>[], schema: S):
Record<string, Record<string, MenuOption<S>>> {

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

  return menuGroups;
}


export function featuresToPlugins
<S extends Schema>
(features: AuthoringFeature<S>[], schema: S, reactCls: typeof React):
Array<Plugin<any, S>> {

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

  const extraPlugins = features.
    filter(f => f.getPlugins !== undefined).
    map(f => f.getPlugins!(schema, reactCls)).
    reduce((prev, curr) => {
      return [ ...prev, ...curr ];
    }, []);

  const plugins = [
    inputRules({ rules }),
    keymap(keymaps),
    ...extraPlugins,
  ];

  return plugins;
}
