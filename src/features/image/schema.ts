import type { SchemaFeature } from '../../schema';

export const NODE_TYPES = [
  'image'
] as const;

export interface FeatureOptions {
  getSrcToShow: ((src: string) => string) | ((src: string) => Promise<string>)
  getSrcToStore: (src: string) => string
}

export default function getFeature(opts: FeatureOptions) {
  const feature: SchemaFeature<typeof NODE_TYPES[number]> = {

    nodes: {

      image: {
        group: 'figure_content',
        inline: false,
        atom: true,
        attrs: {
          alt: { default: '' },
          src: { default: '' },
        },
        parseDOM: [{
          tag: 'img[src]',
          getAttrs(domNode) {
            const el = domNode as HTMLImageElement;
            const src = el.getAttribute('src') || '';
            return {
              alt: el.getAttribute('alt'),
              src: opts.getSrcToStore(src),
            };
          },
        }],
        toDOM(node) {
          const { alt, src } = node.attrs;
          const parsedSrc = opts.getSrcToShow(src);
          // If `getSrcToShow()` is async, we can’t show a proper image.
          // Which is OK in case of editor GUI, where it can notice the promise
          // and resolve show proper image after it resolves,
          // but not OK in case of one-pass HTML generation
          // via `DOMSerialized.serializeFragment()`
          const effectiveSrc = typeof parsedSrc === 'string'
            ? parsedSrc
            : `data:image/svg+xml;base64,${LOADING_ICON_SVG_BASE64}`;
          if (typeof parsedSrc !== 'string') {
            console.warn("Async src resolver function: <img src> is a placeholder");
          }
          return ['img', {
            alt,
            src: effectiveSrc,
          }];
        },
      },
    },

  };

  return feature;
}


export const LOADING_ICON_SVG_BASE64 = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE3LjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyMCAyMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjAgMjAiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8ZyBpZD0ib2ZmbGluZSI+Cgk8Zz4KCQk8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwLDBDNC40OCwwLDAsNC40OCwwLDEwYzAsNS41Miw0LjQ4LDEwLDEwLDEwczEwLTQuNDgsMTAtMTAKCQkJQzIwLDQuNDgsMTUuNTIsMCwxMCwweiBNNywxOGwyLTdINWw4LTlsLTIsN2g0TDcsMTh6Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==" as const;
