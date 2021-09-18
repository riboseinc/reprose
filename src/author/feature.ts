import type React from 'react';
import type { Plugin } from 'prosemirror-state';
import type { InputRule } from 'prosemirror-inputrules';
import type { Keymap } from 'prosemirror-commands';
import type { Schema } from 'prosemirror-model';
import type { MenuGroups } from './menu';


/**
 * An _authoring feature_ affects editor instance behavior and appearance,
 * encapsulating menu groups, editor instance plugins, key bindings, and so on.
 *
 * Authoring features may depend on relevant schema features,
 * but they don’t have 1:1 correspondence.
 *
 * Crucially, authoring features may require heavier code and React widgets
 * only needed for editing content.
 */
export interface AuthoringFeature<S extends Schema> {
  getMenuOptions?(schema: S): MenuGroups<S>
  getInputRules?(schema: S): InputRule<S>[]
  getKeymap?(schema: S): Keymap<S>
  getPlugins?(schema: S, reactCls: typeof React): Plugin<any, S>[]

  // TODO: provisional support for features to provide CSS styling
  getCSS?(schema: S): string
}
