import type React from 'react';
import type { Plugin } from 'prosemirror-state';
import type { InputRule } from 'prosemirror-inputrules';
import type { Keymap } from 'prosemirror-commands';
import type { Schema } from 'prosemirror-model';
import type { MenuGroups } from './menu';


export interface AuthoringFeature<S extends Schema> {
  getMenuOptions?(schema: S): MenuGroups<S>
  getInputRules?(schema: S): InputRule<S>[]
  getKeymap?(schema: S): Keymap<S>
  getPlugins?(schema: S, reactCls: typeof React): Plugin<any, S>[]

  // TODO: support?
  getCSS?(schema: S): string
}
