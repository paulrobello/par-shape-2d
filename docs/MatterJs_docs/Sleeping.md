---
url: "https://brm.io/matter-js/docs/classes/Sleeping.html"
title: "Matter.Sleeping Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Sleeping.js:1`](https://brm.io/matter-js/docs/files/src_core_Sleeping.js.html#l1)

The `Matter.Sleeping` module contains methods to manage the sleeping state of bodies.

## Methods

### Matter.Sleeping. [afterCollisions](https://brm.io/matter-js/docs/classes/Sleeping.html\#method_afterCollisions)

(pairs)

Given a set of colliding pairs, wakes the sleeping bodies involved.

#### Parameters

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


[`src/core/Sleeping.js:62`](https://github.com/liabru/matter-js/tree/master/src/core/Sleeping.js#L62 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Sleeping.afterCollisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Sleeping.afterCollisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Sleeping. [set](https://brm.io/matter-js/docs/classes/Sleeping.html\#method_set)

(body, isSleeping)

Set a body as sleeping or awake.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `isSleeping` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)


[`src/core/Sleeping.js:97`](https://github.com/liabru/matter-js/tree/master/src/core/Sleeping.js#L97 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Sleeping.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Sleeping.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Sleeping. [update](https://brm.io/matter-js/docs/classes/Sleeping.html\#method_update)

(bodies, delta)

Puts bodies to sleep or wakes them up depending on their motion.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/core/Sleeping.js:21`](https://github.com/liabru/matter-js/tree/master/src/core/Sleeping.js#L21 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Sleeping.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Sleeping.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")