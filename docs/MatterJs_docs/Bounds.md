---
url: "https://brm.io/matter-js/docs/classes/Bounds.html"
title: "Matter.Bounds Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/geometry/Bounds.js:1`](https://brm.io/matter-js/docs/files/src_geometry_Bounds.js.html#l1)

The `Matter.Bounds` module contains methods for creating and manipulating axis-aligned bounding boxes (AABB).

## Methods

### Matter.Bounds. [contains](https://brm.io/matter-js/docs/classes/Bounds.html\#method_contains)

(bounds, point)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the bounds contains the given point.

#### Parameters

- `bounds` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the bounds contain the point, otherwise false

[`src/geometry/Bounds.js:67`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L67 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.contains%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.contains%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bounds. [create](https://brm.io/matter-js/docs/classes/Bounds.html\#method_create)

(vertices)

→ [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

Creates a new axis-aligned bounding box (AABB) for the given vertices.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

[Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

A new bounds object

[`src/geometry/Bounds.js:13`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L13 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bounds. [overlaps](https://brm.io/matter-js/docs/classes/Bounds.html\#method_overlaps)

(boundsA, boundsB)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the two bounds intersect.

#### Parameters

- `boundsA` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `boundsB` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the bounds overlap, otherwise false

[`src/geometry/Bounds.js:79`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L79 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.overlaps%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.overlaps%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bounds. [shift](https://brm.io/matter-js/docs/classes/Bounds.html\#method_shift)

(bounds, position)

Shifts the bounds to the given position.

#### Parameters

- `bounds` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `position` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/geometry/Bounds.js:104`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L104 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.shift%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.shift%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bounds. [translate](https://brm.io/matter-js/docs/classes/Bounds.html\#method_translate)

(bounds, vector)

Translates the bounds by the given vector.

#### Parameters

- `bounds` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/geometry/Bounds.js:91`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L91 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Bounds. [update](https://brm.io/matter-js/docs/classes/Bounds.html\#method_update)

(bounds, vertices, velocity)

Updates bounds using the given vertices and extends the bounds given a velocity.

#### Parameters

- `bounds` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `velocity` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/geometry/Bounds.js:31`](https://github.com/liabru/matter-js/tree/master/src/geometry/Bounds.js#L31 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Bounds.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Bounds.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")