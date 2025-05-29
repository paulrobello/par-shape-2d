---
url: "https://brm.io/matter-js/docs/classes/Pairs.html"
title: "Matter.Pairs Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Pairs.js:1`](https://brm.io/matter-js/docs/files/src_collision_Pairs.js.html#l1)

The `Matter.Pairs` module contains methods for creating and manipulating collision pair sets.

## Methods

### Matter.Pairs. [clear](https://brm.io/matter-js/docs/classes/Pairs.html\#method_clear)

(pairs)

→ [Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)

Clears the given pairs structure.

#### Parameters

- `pairs` [Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)


#### Returns

[Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)

pairs

[`src/collision/Pairs.js:125`](https://github.com/liabru/matter-js/tree/master/src/collision/Pairs.js#L125 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pairs.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pairs.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Pairs. [create](https://brm.io/matter-js/docs/classes/Pairs.html\#method_create)

(options)

→ [Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)

Creates a new pairs structure.

#### Parameters

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Pairs](https://brm.io/matter-js/docs/classes/Pairs.html)

A new pairs structure

[`src/collision/Pairs.js:16`](https://github.com/liabru/matter-js/tree/master/src/collision/Pairs.js#L16 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pairs.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pairs.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Pairs. [update](https://brm.io/matter-js/docs/classes/Pairs.html\#method_update)

(pairs, collisions, timestamp)

Updates pairs given a list of collisions.

#### Parameters

- `pairs` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `collisions` [Collision\[\]](https://brm.io/matter-js/docs/classes/Collision.html)

- `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/collision/Pairs.js:32`](https://github.com/liabru/matter-js/tree/master/src/collision/Pairs.js#L32 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Pairs.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Pairs.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")