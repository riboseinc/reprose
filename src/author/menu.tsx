/** @jsx jsx */

import { css, jsx } from '@emotion/react';
import React from 'react';

import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';


export type MenuGroups<S extends Schema<any, any>> =
  Record<string, Record<string, MenuOption<S>>>


export interface MenuOption<S extends Schema<any, any>> {
  label: string
  content?: JSX.Element
  run: (state: EditorState<S>, dispatch: (tr: Transaction<S>) => void, evt: MouseEvent) => void
  active?: (state: EditorState<S>) => boolean
  enable?: (state: EditorState<S>) => boolean
}


export type MenuButtonFactory = ({ state, dispatch }: EditorView<any>) => React.FC<{
  item: MenuOption<any>
  key: string
}>;


export interface MenuBarProps {
  menu: MenuGroups<any>
  view: EditorView<any>
  className?: string
  groupClassName?: string
}


const Button: MenuButtonFactory = ({ state, dispatch }) => ({ key, item }) => {
  const isActive = item.active ? item.active(state) === true : false;
  const isDisabled = item.enable ? item.enable(state) === false : false;

  return (
    <button
        key={key}
        type="button"
        css={css`
          background: transparent;
          border: none;
          font-size: inherit;
          color: #777;
          border-radius: 0;
          padding: 5px 10px;

          &:hover {
            color: #000;
            background: #f6f6f6;
          }

          &:disabled {
            color: #ccc;
            cursor: not-allowed;
          }

          ${isActive
            ? 'color: #000; font-weight: bold'
            : ''}
        `}
        title={item.label}
        disabled={isDisabled}
        onMouseDown={e => {
          e.preventDefault();
          item.run(state, dispatch, e.nativeEvent);
        }}>
      {item.content || item.label}
    </button>
  );
};


const MenuBar: React.FC<MenuBarProps> =
function ({ menu, view, className, groupClassName }) {
  return (
    <div
        className={className}
        css={css`
          display: flex;
          flex-flow: row wrap;
          align-items: baseline;
          padding: .5rem;
        `}>
      {Object.entries(menu).map(([ groupID, items ]) =>
        <span
            key={groupID}
            css={css`
              margin-right: .5rem;
              display: flex;
              flex-flow: row nowrap;
            `}
            className={groupClassName}>
          {Object.entries(items).map(([ itemID, item ]) =>
            Button(view)({ key: itemID, item }))}
        </span>
      )}
    </div>
  );
};


export default MenuBar;
