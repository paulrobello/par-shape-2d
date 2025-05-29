---
url: "https://brm.io/matter-js/docs/classes/Svg.html"
title: "Matter.Svg Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/geometry/Svg.js:1`](https://brm.io/matter-js/docs/files/src_geometry_Svg.js.html#l1)

The `Matter.Svg` module contains methods for converting SVG images into an array of vector points.

To use this module you also need the SVGPathSeg polyfill: [https://github.com/progers/pathseg](https://github.com/progers/pathseg)

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Svg. [pathToVertices](https://brm.io/matter-js/docs/classes/Svg.html\#method_pathToVertices)

(path, \[sampleLength=15\])

→ [Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

Converts an SVG path into an array of vector points.
If the input path forms a concave shape, you must decompose the result into convex parts before use.
See `Bodies.fromVertices` which provides support for this.
Note that this function is not guaranteed to support complex paths (such as those with holes).
You must load the `pathseg.js` polyfill on newer browsers.

#### Parameters

- `path` [SVGPathElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement)

- `[sampleLength=15]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


#### Returns

[Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

points

[`src/geometry/Svg.js:20`](https://github.com/liabru/matter-js/tree/master/src/geometry/Svg.js#L20 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Svg.pathToVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Svg.pathToVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")