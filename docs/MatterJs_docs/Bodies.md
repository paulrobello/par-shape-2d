---
url: "https://brm.io/matter-js/docs/classes/Bodies.html"
title: "Matter.Bodies Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/factory/Bodies.js:1`](https://brm.io/matter-js/docs/files/src_factory_Bodies.js.html#l1)

The `Matter.Bodies` module contains factory methods for creating rigid body models
with commonly used body configurations (such as rectangles, circles and other polygons).

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Bodies. [circle](https://brm.io/matter-js/docs/classes/Bodies.html\#method_circle)

(x, y, radius, \[options\], \[maxSides\])

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Creates a new rigid body model with a circle hull.
The options parameter is an object that specifies any properties you wish to override the defaults.
See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `radius` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional

- `[maxSides]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

A new circle body

[`src/factory/Bodies.js:106`](https://github.com/liabru/matter-js/tree/master/src/factory/Bodies.js#L106 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bodies.circle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bodies.circle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bodies. [fromVertices](https://brm.io/matter-js/docs/classes/Bodies.html\#method_fromVertices)

(x, y, vertexSets, \[options\], \[flagInternal=false\], \[removeCollinear=0.01\], \[minimumArea=10\], \[removeDuplicatePoints=0.01\])

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Utility to create a compound body based on set(s) of vertices.

_Note:_ To optionally enable automatic concave vertices decomposition the [poly-decomp](https://github.com/schteppe/poly-decomp.js)
package must be first installed and provided see `Common.setDecomp`, otherwise the convex hull of each vertex set will be used.

The resulting vertices are reorientated about their centre of mass,
and offset such that `body.position` corresponds to this point.

The resulting offset may be found if needed by subtracting `body.bounds` from the original input bounds.
To later move the centre of mass see `Body.setCentre`.

Note that automatic conconcave decomposition results are not always optimal.
For best results, simplify the input vertices as much as possible first.
By default this function applies some addtional simplification to help.

Some outputs may also require further manual processing afterwards to be robust.
In particular some parts may need to be overlapped to avoid collision gaps.
Thin parts and sharp points should be avoided or removed where possible.

The options parameter object specifies any `Matter.Body` properties you wish to override the defaults.

See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `vertexSets` [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)


One or more arrays of vertex points e.g. `[[{ x: 0, y: 0 }...], ...]`.

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


The body options.

- `[flagInternal=false]` Booloptional


Optionally marks internal edges with `isInternal`.

- `[removeCollinear=0.01]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Threshold when simplifying vertices along the same edge.

- `[minimumArea=10]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Threshold when removing small parts.

- `[removeDuplicatePoints=0.01]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Threshold when simplifying nearby vertices.


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

[`src/factory/Bodies.js:183`](https://github.com/liabru/matter-js/tree/master/src/factory/Bodies.js#L183 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bodies.fromVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bodies.fromVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bodies. [polygon](https://brm.io/matter-js/docs/classes/Bodies.html\#method_polygon)

(x, y, sides, radius, \[options\])

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Creates a new rigid body model with a regular polygon hull with the given number of sides.
The options parameter is an object that specifies any properties you wish to override the defaults.
See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `sides` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `radius` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

A new regular polygon body

[`src/factory/Bodies.js:137`](https://github.com/liabru/matter-js/tree/master/src/factory/Bodies.js#L137 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bodies.polygon%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bodies.polygon%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bodies. [rectangle](https://brm.io/matter-js/docs/classes/Bodies.html\#method_rectangle)

(x, y, width, height, \[options\])

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Creates a new rigid body model with a rectangle hull.
The options parameter is an object that specifies any properties you wish to override the defaults.
See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `width` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `height` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

A new rectangle body

[`src/factory/Bodies.js:24`](https://github.com/liabru/matter-js/tree/master/src/factory/Bodies.js#L24 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bodies.rectangle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bodies.rectangle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bodies. [trapezoid](https://brm.io/matter-js/docs/classes/Bodies.html\#method_trapezoid)

(x, y, width, height, slope, \[options\])

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Creates a new rigid body model with a trapezoid hull.
The `slope` is parameterised as a fraction of `width` and must be < 1 to form a valid trapezoid.
The options parameter is an object that specifies any properties you wish to override the defaults.
See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `width` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `height` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `slope` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Must be a number < 1.

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

A new trapezoid body

[`src/factory/Bodies.js:55`](https://github.com/liabru/matter-js/tree/master/src/factory/Bodies.js#L55 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bodies.trapezoid%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bodies.trapezoid%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")