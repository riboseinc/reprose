import type { Schema } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { AuthoringFeature, markActive } from '../../author';
import { MARK_TYPES } from './schema';


const feature: AuthoringFeature<Schema<'', typeof MARK_TYPES[number]>> = {

  getMenuOptions(schema) {
    return {
      inline: {
        emphasis: {
          label: 'Emphasize',
          active: markActive(schema.marks.em),
          run: toggleMark(schema.marks.em),
        },
      },
    };
  },

};


export default feature;
