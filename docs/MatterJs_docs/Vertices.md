---
url: "https://brm.io/matter-js/docs/classes/Vertices.html"
title: "Matter.Vertices Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/geometry/Vertices.js:1`](https://brm.io/matter-js/docs/files/src_geometry_Vertices.js.html#l1)

The `Matter.Vertices` module contains methods for creating and manipulating sets of vertices.
A set of vertices is an array of `Matter.Vector` with additional indexing properties inserted by `Vertices.create`.
A `Matter.Body` maintains a set of vertices to represent the shape of the object (its convex hull).

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Vertices. [area](https://brm.io/matter-js/docs/classes/Vertices.html\#method_area)

(vertices, signed)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the area of the set of vertices.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `signed` Bool


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The area

[`src/geometry/Vertices.js:116`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L116 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.area%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.area%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [centre](https://brm.io/matter-js/docs/classes/Vertices.html\#method_centre)

(vertices)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Returns the centre (centroid) of the set of vertices.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

The centre point

[`src/geometry/Vertices.js:76`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L76 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.centre%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.centre%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [chamfer](https://brm.io/matter-js/docs/classes/Vertices.html\#method_chamfer)

(vertices, radius, quality, qualityMin, qualityMax)

Chamfers a set of vertices by giving them rounded corners, returns a new set of vertices.
The radius parameter is a single number or an array to specify the radius for each vertex.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `radius` [Number\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `quality` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `qualityMin` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `qualityMax` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/geometry/Vertices.js:274`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L274 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.chamfer%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.chamfer%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [clockwiseSort](https://brm.io/matter-js/docs/classes/Vertices.html\#method_clockwiseSort)

(vertices)

→ [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

Sorts the input vertices into clockwise order in place.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

[Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

vertices

[`src/geometry/Vertices.js:348`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L348 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.clockwiseSort%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.clockwiseSort%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [contains](https://brm.io/matter-js/docs/classes/Vertices.html\#method_contains)

(vertices, point)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns `true` if the `point` is inside the set of `vertices`.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the vertices contains point, otherwise false

[`src/geometry/Vertices.js:219`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L219 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.contains%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.contains%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [create](https://brm.io/matter-js/docs/classes/Vertices.html\#method_create)

(points, body)

Creates a new set of `Matter.Body` compatible vertices.
The `points` argument accepts an array of `Matter.Vector` points orientated around the origin `(0, 0)`, for example:

```
[{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]

```

The `Vertices.create` method returns a new array of vertices, which are similar to Matter.Vector objects,
but with some additional references required for efficient collision detection routines.

Vertices must be specified in clockwise order.

Note that the `body` argument is not optional, a `Matter.Body` reference must be provided.

#### Parameters

- `points` [Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


[`src/geometry/Vertices.js:20`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L20 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [fromPath](https://brm.io/matter-js/docs/classes/Vertices.html\#method_fromPath)

(path, body)

→ [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

Parses a string containing ordered x y pairs separated by spaces (and optionally commas),
into a `Matter.Vertices` object for the given `Matter.Body`.
For parsing SVG paths, see `Svg.pathToVertices`.

#### Parameters

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

vertices

[`src/geometry/Vertices.js:56`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L56 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.fromPath%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.fromPath%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [hull](https://brm.io/matter-js/docs/classes/Vertices.html\#method_hull)

(vertices)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Returns the convex hull of the input vertices as a new array of points.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

\[vertex\] vertices

[`src/geometry/Vertices.js:408`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L408 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.hull%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.hull%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [inertia](https://brm.io/matter-js/docs/classes/Vertices.html\#method_inertia)

(vertices, mass)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the moment of inertia (second moment of area) of the set of vertices given the total mass.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `mass` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The polygon's moment of inertia

[`src/geometry/Vertices.js:138`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L138 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.inertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.inertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [isConvex](https://brm.io/matter-js/docs/classes/Vertices.html\#method_isConvex)

(vertices)

→
Bool


Returns true if the vertices form a convex shape (vertices must be in clockwise order).

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

Bool

`true` if the `vertices` are convex, `false` if not (or `null` if not computable).

[`src/geometry/Vertices.js:364`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L364 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.isConvex%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.isConvex%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [mean](https://brm.io/matter-js/docs/classes/Vertices.html\#method_mean)

(vertices)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Returns the average (mean) of the set of vertices.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

The average point

[`src/geometry/Vertices.js:99`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L99 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [rotate](https://brm.io/matter-js/docs/classes/Vertices.html\#method_rotate)

(vertices, angle, point)

Rotates the set of vertices in-place.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `angle` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/geometry/Vertices.js:187`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L187 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [scale](https://brm.io/matter-js/docs/classes/Vertices.html\#method_scale)

(vertices, scaleX, scaleY, point)

Scales the vertices from a point (default is centre) in-place.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `scaleX` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `scaleY` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/geometry/Vertices.js:247`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L247 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vertices. [translate](https://brm.io/matter-js/docs/classes/Vertices.html\#method_translate)

(vertices, vector, scalar)

Translates the set of vertices in-place.

#### Parameters

- `vertices` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `scalar` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/geometry/Vertices.js:164`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vertices.js#L164 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vertices.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vertices.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")