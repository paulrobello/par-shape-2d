---
url: "https://brm.io/matter-js/docs/classes/Collision.html"
title: "Matter.Collision Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Collision.js:1`](https://brm.io/matter-js/docs/files/src_collision_Collision.js.html#l1)

The `Matter.Collision` module contains methods for detecting collisions between a given pair of bodies.

For efficient detection between a list of bodies, see `Matter.Detector` and `Matter.Query`.

See `Matter.Engine` for collision events.

## Methods

### Matter.Collision. [\_findSupports](https://brm.io/matter-js/docs/classes/Collision.html\#method__findSupports)

(bodyA, bodyB, normal, direction)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)private

Finds supporting vertices given two bodies along a given direction using hill-climbing.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `normal` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `direction` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

\[vector\]

[`src/collision/Collision.js:241`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L241 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Collision._findSupports%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Collision._findSupports%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Collision. [\_overlapAxes](https://brm.io/matter-js/docs/classes/Collision.html\#method__overlapAxes)

(result, verticesA, verticesB, axes)

private

Find the overlap between two sets of vertices.

#### Parameters

- `result` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `verticesA` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `verticesB` [Vertices](https://brm.io/matter-js/docs/classes/Vertices.html)

- `axes` [Axes](https://brm.io/matter-js/docs/classes/Axes.html)


[`src/collision/Collision.js:167`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L167 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Collision._overlapAxes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Collision._overlapAxes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Collision. [collides](https://brm.io/matter-js/docs/classes/Collision.html\#method_collides)

(bodyA, bodyB, \[pairs\])

→ [Collision](https://brm.io/matter-js/docs/classes/Collision.html) \| Null


Detect collision between two bodies.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `[pairs]` [Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)optional


Optionally reuse collision records from existing pairs.


#### Returns

[Collision](https://brm.io/matter-js/docs/classes/Collision.html) \| Null

A collision record if detected, otherwise null

[`src/collision/Collision.js:55`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L55 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Collision.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Collision.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Collision. [create](https://brm.io/matter-js/docs/classes/Collision.html\#method_create)

(bodyA, bodyB)

→ [Collision](https://brm.io/matter-js/docs/classes/Collision.html)

Creates a new collision record.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)


The first body part represented by the collision record

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)


The second body part represented by the collision record


#### Returns

[Collision](https://brm.io/matter-js/docs/classes/Collision.html)

A new collision record

[`src/collision/Collision.js:31`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L31 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Collision.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Collision.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Collision.create` and may be passed to it as `options`.

### Collision. [`bodyA`](https://brm.io/matter-js/docs/classes/Collision.html\#property_bodyA)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

The first body part represented by the collision (see also `collision.parentA`).

[`src/collision/Collision.js:318`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bodyA%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bodyA%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`bodyB`](https://brm.io/matter-js/docs/classes/Collision.html\#property_bodyB)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

The second body part represented by the collision (see also `collision.parentB`).

[`src/collision/Collision.js:325`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bodyB%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bodyB%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`collided`](https://brm.io/matter-js/docs/classes/Collision.html\#property_collided)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that indicates if the bodies were colliding when the collision was last updated.

Default: `false`

[`src/collision/Collision.js:310`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collided%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collided%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`depth`](https://brm.io/matter-js/docs/classes/Collision.html\#property_depth)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that represents the minimum separating distance between the bodies along the collision normal.

Default: `0`

[`src/collision/Collision.js:346`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22depth%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22depth%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`normal`](https://brm.io/matter-js/docs/classes/Collision.html\#property_normal)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A normalised `Vector` that represents the direction between the bodies that provides the minimum separating distance.

Default: `{ x: 0, y: 0 }`

[`src/collision/Collision.js:355`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22normal%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22normal%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`pair`](https://brm.io/matter-js/docs/classes/Collision.html\#property_pair)

[Pair](https://brm.io/matter-js/docs/classes/Pair.html) \| Null

A reference to the pair using this collision record, if there is one.

Default: `null`

[`src/collision/Collision.js:302`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22pair%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22pair%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`parentA`](https://brm.io/matter-js/docs/classes/Collision.html\#property_parentA)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

The first body represented by the collision (i.e. `collision.bodyA.parent`).

[`src/collision/Collision.js:332`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22parentA%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22parentA%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`parentB`](https://brm.io/matter-js/docs/classes/Collision.html\#property_parentB)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

The second body represented by the collision (i.e. `collision.bodyB.parent`).

[`src/collision/Collision.js:339`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22parentB%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22parentB%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`penetration`](https://brm.io/matter-js/docs/classes/Collision.html\#property_penetration)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A `Vector` that represents the direction and depth of the collision.

Default: `{ x: 0, y: 0 }`

[`src/collision/Collision.js:371`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22penetration%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22penetration%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`supportCount`](https://brm.io/matter-js/docs/classes/Collision.html\#property_supportCount)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The number of active supports for this collision found in `collision.supports`.

_Note:_ Only the first `collision.supportCount` items of `collision.supports` are active.
Therefore use `collision.supportCount` instead of `collision.supports.length` when iterating the active supports.

Default: `0`

[`src/collision/Collision.js:392`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22supportCount%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22supportCount%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`supports`](https://brm.io/matter-js/docs/classes/Collision.html\#property_supports)

[Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

An array of body vertices that represent the support points in the collision.

_Note:_ Only the first `collision.supportCount` items of `collision.supports` are active.
Therefore use `collision.supportCount` instead of `collision.supports.length` when iterating the active supports.

These are the deepest vertices (along the collision normal) of each body that are contained by the other body's vertices.

Default: `[]`

[`src/collision/Collision.js:379`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22supports%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22supports%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Collision. [`tangent`](https://brm.io/matter-js/docs/classes/Collision.html\#property_tangent)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A normalised `Vector` that is the tangent direction to the collision normal.

Default: `{ x: 0, y: 0 }`

[`src/collision/Collision.js:363`](https://github.com/liabru/matter-js/tree/master/src/collision/Collision.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22tangent%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22tangent%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")