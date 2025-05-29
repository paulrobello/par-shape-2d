---
url: "https://brm.io/matter-js/docs/classes/Resolver.html"
title: "Matter.Resolver Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Resolver.js:1`](https://brm.io/matter-js/docs/files/src_collision_Resolver.js.html#l1)

The `Matter.Resolver` module contains methods for resolving collision pairs.

## Methods

### Matter.Resolver. [postSolvePosition](https://brm.io/matter-js/docs/classes/Resolver.html\#method_postSolvePosition)

(bodies)

Apply position resolution.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


[`src/collision/Resolver.js:115`](https://github.com/liabru/matter-js/tree/master/src/collision/Resolver.js#L115 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Resolver.postSolvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Resolver.postSolvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Resolver. [preSolvePosition](https://brm.io/matter-js/docs/classes/Resolver.html\#method_preSolvePosition)

(pairs)

Prepare pairs for position solving.

#### Parameters

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


[`src/collision/Resolver.js:24`](https://github.com/liabru/matter-js/tree/master/src/collision/Resolver.js#L24 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Resolver.preSolvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Resolver.preSolvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Resolver. [preSolveVelocity](https://brm.io/matter-js/docs/classes/Resolver.html\#method_preSolveVelocity)

(pairs)

Prepare pairs for velocity solving.

#### Parameters

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


[`src/collision/Resolver.js:163`](https://github.com/liabru/matter-js/tree/master/src/collision/Resolver.js#L163 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Resolver.preSolveVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Resolver.preSolveVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Resolver. [solvePosition](https://brm.io/matter-js/docs/classes/Resolver.html\#method_solvePosition)

(pairs, delta, \[damping=1\])

Find a solution for pair positions.

#### Parameters

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)

- `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[damping=1]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


[`src/collision/Resolver.js:48`](https://github.com/liabru/matter-js/tree/master/src/collision/Resolver.js#L48 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Resolver.solvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Resolver.solvePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Resolver. [solveVelocity](https://brm.io/matter-js/docs/classes/Resolver.html\#method_solveVelocity)

(pairs, delta)

Find a solution for pair velocities.

#### Parameters

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)

- `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/collision/Resolver.js:222`](https://github.com/liabru/matter-js/tree/master/src/collision/Resolver.js#L222 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Resolver.solveVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Resolver.solveVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")