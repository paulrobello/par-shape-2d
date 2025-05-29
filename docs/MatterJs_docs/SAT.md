---
url: "https://brm.io/matter-js/docs/classes/SAT.html"
title: "Matter.SAT Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/SAT.js:1`](https://brm.io/matter-js/docs/files/src_collision_SAT.js.html#l1)

This class is deprecated.


This module has now been replaced by `Matter.Collision`.

All usage should be migrated to `Matter.Collision`.
For back-compatibility purposes this module will remain for a short term and then later removed in a future release.

The `Matter.SAT` module contains methods for detecting collisions using the Separating Axis Theorem.

## Methods

### Matter.SAT. [collides](https://brm.io/matter-js/docs/classes/SAT.html\#method_collides)

(bodyA, bodyB)

→ [Collision](https://brm.io/matter-js/docs/classes/Collision.html)deprecated

Deprecated: replaced by Collision.collides

Detect collision between two bodies using the Separating Axis Theorem.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Collision](https://brm.io/matter-js/docs/classes/Collision.html)

collision

[`src/collision/SAT.js:23`](https://github.com/liabru/matter-js/tree/master/src/collision/SAT.js#L23 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22SAT.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22SAT.collides%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")