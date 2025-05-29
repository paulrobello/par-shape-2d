---
url: "https://brm.io/matter-js/docs/classes/Vector.html"
title: "Matter.Vector Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/geometry/Vector.js:1`](https://brm.io/matter-js/docs/files/src_geometry_Vector.js.html#l1)

The `Matter.Vector` module contains methods for creating and manipulating vectors.
Vectors are the basis of all the geometry related operations in the engine.
A `Matter.Vector` object is of the form `{ x: 0, y: 0 }`.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Vector. [add](https://brm.io/matter-js/docs/classes/Vector.html\#method_add)

(vectorA, vectorB, \[output\])

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Adds the two vectors.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[output]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector of vectorA and vectorB added

[`src/geometry/Vector.js:142`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L142 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.add%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.add%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [angle](https://brm.io/matter-js/docs/classes/Vector.html\#method_angle)

(vectorA, vectorB)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the angle between the vector `vectorB - vectorA` and the x-axis in radians.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The angle in radians

[`src/geometry/Vector.js:216`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L216 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.angle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.angle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [clone](https://brm.io/matter-js/docs/classes/Vector.html\#method_clone)

(vector)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Returns a new vector with `x` and `y` copied from the given `vector`.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new cloned vector

[`src/geometry/Vector.js:30`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L30 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.clone%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.clone%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [create](https://brm.io/matter-js/docs/classes/Vector.html\#method_create)

(x, y)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Creates a new vector.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector

[`src/geometry/Vector.js:19`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L19 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [cross](https://brm.io/matter-js/docs/classes/Vector.html\#method_cross)

(vectorA, vectorB)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the cross-product of two vectors.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The cross product of the two vectors

[`src/geometry/Vector.js:119`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L119 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.cross%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.cross%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [cross3](https://brm.io/matter-js/docs/classes/Vector.html\#method_cross3)

(vectorA, vectorB, vectorC)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the cross-product of three vectors.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorC` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The cross product of the three vectors

[`src/geometry/Vector.js:130`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L130 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.cross3%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.cross3%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [div](https://brm.io/matter-js/docs/classes/Vector.html\#method_div)

(vector, scalar)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Divides a vector and a scalar.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `scalar` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector divided by scalar

[`src/geometry/Vector.js:183`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L183 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.div%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.div%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [dot](https://brm.io/matter-js/docs/classes/Vector.html\#method_dot)

(vectorA, vectorB)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the dot-product of two vectors.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The dot product of the two vectors

[`src/geometry/Vector.js:108`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L108 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.dot%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.dot%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [magnitude](https://brm.io/matter-js/docs/classes/Vector.html\#method_magnitude)

(vector)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the magnitude (length) of a vector.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The magnitude of the vector

[`src/geometry/Vector.js:40`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L40 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.magnitude%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.magnitude%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [magnitudeSquared](https://brm.io/matter-js/docs/classes/Vector.html\#method_magnitudeSquared)

(vector)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the magnitude (length) of a vector (therefore saving a `sqrt` operation).

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The squared magnitude of the vector

[`src/geometry/Vector.js:50`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L50 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.magnitudeSquared%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.magnitudeSquared%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [mult](https://brm.io/matter-js/docs/classes/Vector.html\#method_mult)

(vector, scalar)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Multiplies a vector and a scalar.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `scalar` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector multiplied by scalar

[`src/geometry/Vector.js:172`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L172 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.mult%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.mult%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [neg](https://brm.io/matter-js/docs/classes/Vector.html\#method_neg)

(vector)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Negates both components of a vector such that it points in the opposite direction.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

The negated vector

[`src/geometry/Vector.js:206`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L206 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.neg%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.neg%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [normalise](https://brm.io/matter-js/docs/classes/Vector.html\#method_normalise)

(vector)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Normalises a vector (such that its magnitude is `1`).

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector normalised

[`src/geometry/Vector.js:95`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L95 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.normalise%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.normalise%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [perp](https://brm.io/matter-js/docs/classes/Vector.html\#method_perp)

(vector, \[negate=false\])

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Returns the perpendicular vector. Set `negate` to true for the perpendicular in the opposite direction.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[negate=false]` Booloptional


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

The perpendicular vector

[`src/geometry/Vector.js:194`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L194 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.perp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.perp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [rotate](https://brm.io/matter-js/docs/classes/Vector.html\#method_rotate)

(vector, angle, \[output\])

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Rotates the vector about (0, 0) by specified angle.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `angle` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[output]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

The vector rotated about (0, 0)

[`src/geometry/Vector.js:60`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L60 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [rotateAbout](https://brm.io/matter-js/docs/classes/Vector.html\#method_rotateAbout)

(vector, angle, point, \[output\])

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Rotates the vector about a specified point by specified angle.

#### Parameters

- `vector` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `angle` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[output]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector rotated about the point

[`src/geometry/Vector.js:77`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L77 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.rotateAbout%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.rotateAbout%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Vector. [sub](https://brm.io/matter-js/docs/classes/Vector.html\#method_sub)

(vectorA, vectorB, \[output\])

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Subtracts the two vectors.

#### Parameters

- `vectorA` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `vectorB` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[output]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A new vector of vectorA and vectorB subtracted

[`src/geometry/Vector.js:157`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L157 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Vector.sub%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Vector.sub%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Vector.create` and may be passed to it as `options`.

### Vector. [`_temp`](https://brm.io/matter-js/docs/classes/Vector.html\#property__temp)

[Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

private

Temporary vector pool (not thread-safe).

[`src/geometry/Vector.js:227`](https://github.com/liabru/matter-js/tree/master/src/geometry/Vector.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22_temp%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22_temp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")