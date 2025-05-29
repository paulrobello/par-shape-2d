---
url: "https://brm.io/matter-js/docs/classes/Pair.html"
title: "Matter.Pair Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Pair.js:1`](https://brm.io/matter-js/docs/files/src_collision_Pair.js.html#l1)

The `Matter.Pair` module contains methods for creating and manipulating collision pairs.

## Methods

### Matter.Pair. [create](https://brm.io/matter-js/docs/classes/Pair.html\#method_create)

(collision, timestamp)

→ [Pair](https://brm.io/matter-js/docs/classes/Pair.html)

Creates a pair.

#### Parameters

- `collision` [Collision](https://brm.io/matter-js/docs/classes/Collision.html)

- `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Pair](https://brm.io/matter-js/docs/classes/Pair.html)

A new pair

[`src/collision/Pair.js:15`](https://github.com/liabru/matter-js/tree/master/src/collision/Pair.js#L15 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pair.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pair.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Pair. [id](https://brm.io/matter-js/docs/classes/Pair.html\#method_id)

(bodyA, bodyB)

→ [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

Get the id for the given pair.

#### Parameters

- `bodyA` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `bodyB` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

Unique pairId

[`src/collision/Pair.js:111`](https://github.com/liabru/matter-js/tree/master/src/collision/Pair.js#L111 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pair.id%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pair.id%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Pair. [setActive](https://brm.io/matter-js/docs/classes/Pair.html\#method_setActive)

(pair, isActive, timestamp)

Set a pair as active or inactive.

#### Parameters

- `pair` [Pair](https://brm.io/matter-js/docs/classes/Pair.html)

- `isActive` Bool

- `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/collision/Pair.js:94`](https://github.com/liabru/matter-js/tree/master/src/collision/Pair.js#L94 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pair.setActive%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pair.setActive%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Pair. [update](https://brm.io/matter-js/docs/classes/Pair.html\#method_update)

(pair, collision, timestamp)

Updates a pair given a collision.

#### Parameters

- `pair` [Pair](https://brm.io/matter-js/docs/classes/Pair.html)

- `collision` [Collision](https://brm.io/matter-js/docs/classes/Collision.html)

- `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/collision/Pair.js:50`](https://github.com/liabru/matter-js/tree/master/src/collision/Pair.js#L50 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pair.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pair.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")