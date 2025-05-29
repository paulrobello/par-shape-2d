---
url: "https://brm.io/matter-js/docs/classes/Query.html"
title: "Matter.Query Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Query.js:1`](https://brm.io/matter-js/docs/files/src_collision_Query.js.html#l1)

The `Matter.Query` module contains methods for performing collision queries.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Query. [collides](https://brm.io/matter-js/docs/classes/Query.html\#method_collides)

(body, bodies)

→ [Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

Returns a list of collisions between `body` and `bodies`.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

Collisions

[`src/collision/Query.js:21`](https://github.com/liabru/matter-js/tree/master/src/collision/Query.js#L21 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Query.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Query.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Query. [point](https://brm.io/matter-js/docs/classes/Query.html\#method_point)

(bodies, point)

→ [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

Returns all bodies whose vertices contain the given point, from the given set of bodies.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


#### Returns

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

The bodies matching the query

[`src/collision/Query.js:107`](https://github.com/liabru/matter-js/tree/master/src/collision/Query.js#L107 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Query.point%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Query.point%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Query. [ray](https://brm.io/matter-js/docs/classes/Query.html\#method_ray)

(bodies, startPoint, endPoint, \[rayWidth\])

→ [Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

Casts a ray segment against a set of bodies and returns all collisions, ray width is optional. Intersection points are not provided.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `startPoint` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `endPoint` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[rayWidth]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


#### Returns

[Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

Collisions

[`src/collision/Query.js:59`](https://github.com/liabru/matter-js/tree/master/src/collision/Query.js#L59 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Query.ray%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Query.ray%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Query. [region](https://brm.io/matter-js/docs/classes/Query.html\#method_region)

(bodies, bounds, \[outside=false\])

→ [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

Returns all bodies whose bounds are inside (or outside if set) the given set of bounds, from the given set of bodies.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `bounds` [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

- `[outside=false]` Booloptional


#### Returns

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

The bodies matching the query

[`src/collision/Query.js:86`](https://github.com/liabru/matter-js/tree/master/src/collision/Query.js#L86 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Query.region%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Query.region%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")