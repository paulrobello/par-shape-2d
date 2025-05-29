---
url: "https://brm.io/matter-js/docs/classes/Detector.html"
title: "Matter.Detector Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Detector.js:1`](https://brm.io/matter-js/docs/files/src_collision_Detector.js.html#l1)

The `Matter.Detector` module contains methods for efficiently detecting collisions between a list of bodies using a broadphase algorithm.

## Methods

### Matter.Detector. [\_sortCompare](https://brm.io/matter-js/docs/classes/Detector.html\#method__sortCompare)

(bodyA, bodyB)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)private

The comparison function used in the broadphase algorithm.
Returns the signed delta of the bodies bounds on the x-axis.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The signed delta used for sorting

[`src/collision/Detector.js:162`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L162 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector._sortCompare%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector._sortCompare%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Detector. [canCollide](https://brm.io/matter-js/docs/classes/Detector.html\#method_canCollide)

(filterA, filterB)

→
Bool


Returns `true` if both supplied collision filters will allow a collision to occur.
See `body.collisionFilter` for more information.

#### Parameters

- `filterA` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `filterB` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

Bool

`true` if collision can occur

[`src/collision/Detector.js:147`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L147 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector.canCollide%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector.canCollide%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Detector. [clear](https://brm.io/matter-js/docs/classes/Detector.html\#method_clear)

(detector)

Clears the detector including its list of bodies.

#### Parameters

- `detector` [Detector](https://brm.io/matter-js/docs/classes/Detector.html)


[`src/collision/Detector.js:42`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L42 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Detector. [collisions](https://brm.io/matter-js/docs/classes/Detector.html\#method_collisions)

(detector)

→ [Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

Efficiently finds all collisions among all the bodies in `detector.bodies` using a broadphase algorithm.

_Note:_ The specific ordering of collisions returned is not guaranteed between releases and may change for performance reasons.
If a specific ordering is required then apply a sort to the resulting array.

#### Parameters

- `detector` [Detector](https://brm.io/matter-js/docs/classes/Detector.html)


#### Returns

[Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

collisions

[`src/collision/Detector.js:52`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L52 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector.collisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector.collisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Detector. [create](https://brm.io/matter-js/docs/classes/Detector.html\#method_create)

(options)

→ [Detector](https://brm.io/matter-js/docs/classes/Detector.html)

Creates a new collision detector.

#### Parameters

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Detector](https://brm.io/matter-js/docs/classes/Detector.html)

A new collision detector

[`src/collision/Detector.js:16`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L16 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Detector. [setBodies](https://brm.io/matter-js/docs/classes/Detector.html\#method_setBodies)

(detector, bodies)

Sets the list of bodies in the detector.

#### Parameters

- `detector` [Detector](https://brm.io/matter-js/docs/classes/Detector.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


[`src/collision/Detector.js:32`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L32 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Detector.setBodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Detector.setBodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Detector.create` and may be passed to it as `options`.

### Detector. [`bodies`](https://brm.io/matter-js/docs/classes/Detector.html\#property_bodies)

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

The array of `Matter.Body` between which the detector finds collisions.

_Note:_ The order of bodies in this array _is not fixed_ and will be continually managed by the detector.

Default: `[]`

[`src/collision/Detector.js:181`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bodies%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Detector. [`collisions`](https://brm.io/matter-js/docs/classes/Detector.html\#property_collisions)

[Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

The array of `Matter.Collision` found in the last call to `Detector.collisions` on this detector.

Default: `[]`

[`src/collision/Detector.js:190`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisions%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Detector. [`pairs`](https://brm.io/matter-js/docs/classes/Detector.html\#property_pairs)

[Pairs](https://brm.io/matter-js/docs/classes/Pairs.html) \| Null

Optional. A `Matter.Pairs` object from which previous collision objects may be reused. Intended for internal `Matter.Engine` usage.

Default: `null`

[`src/collision/Detector.js:197`](https://github.com/liabru/matter-js/tree/master/src/collision/Detector.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22pairs%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22pairs%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")