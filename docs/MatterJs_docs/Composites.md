---
url: "https://brm.io/matter-js/docs/classes/Composites.html"
title: "Matter.Composites Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/factory/Composites.js:1`](https://brm.io/matter-js/docs/files/src_factory_Composites.js.html#l1)

The `Matter.Composites` module contains factory methods for creating composite bodies
with commonly used configurations (such as stacks and chains).

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Composites. [car](https://brm.io/matter-js/docs/classes/Composites.html\#method_car)

(x, y, width, height, wheelSize)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)deprecated

Deprecated: moved to car example

This has now moved to the [car example](https://github.com/liabru/matter-js/blob/master/examples/car.js), follow that instead as this function is deprecated here.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in X.

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in Y.

- `width` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `height` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `wheelSize` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite car body

[`src/factory/Composites.js:234`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L234 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.car%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.car%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [chain](https://brm.io/matter-js/docs/classes/Composites.html\#method_chain)

(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Chains all bodies in the given composite together using constraints.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `xOffsetA` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `yOffsetA` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `xOffsetB` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `yOffsetB` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite containing objects chained together with constraints

[`src/factory/Composites.js:76`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L76 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.chain%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.chain%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [mesh](https://brm.io/matter-js/docs/classes/Composites.html\#method_mesh)

(composite, columns, rows, crossBrace, options)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Connects bodies in the composite with constraints in a grid pattern, with optional cross braces.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `columns` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rows` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `crossBrace` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The composite containing objects meshed together with constraints

[`src/factory/Composites.js:115`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L115 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.mesh%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.mesh%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [newtonsCradle](https://brm.io/matter-js/docs/classes/Composites.html\#method_newtonsCradle)

(x, y, number, size, length)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)deprecated

Deprecated: moved to newtonsCradle example

This has now moved to the [newtonsCradle example](https://github.com/liabru/matter-js/blob/master/examples/newtonsCradle.js), follow that instead as this function is deprecated here.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in X.

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in Y.

- `number` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `size` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `length` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite newtonsCradle body

[`src/factory/Composites.js:205`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L205 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.newtonsCradle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.newtonsCradle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [pyramid](https://brm.io/matter-js/docs/classes/Composites.html\#method_pyramid)

(x, y, columns, rows, columnGap, rowGap, callback)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Create a new composite containing bodies created in the callback in a pyramid arrangement.
This function uses the body's bounds to prevent overlaps.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in X.

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in Y.

- `columns` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rows` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `columnGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rowGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `callback` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite containing objects created in the callback

[`src/factory/Composites.js:164`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L164 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.pyramid%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.pyramid%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [softBody](https://brm.io/matter-js/docs/classes/Composites.html\#method_softBody)

(x, y, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)deprecated

Deprecated: moved to softBody and cloth examples

This has now moved to the [softBody example](https://github.com/liabru/matter-js/blob/master/examples/softBody.js)
and the [cloth example](https://github.com/liabru/matter-js/blob/master/examples/cloth.js), follow those instead as this function is deprecated here.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in X.

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in Y.

- `columns` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rows` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `columnGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rowGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `crossBrace` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

- `particleRadius` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `particleOptions` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `constraintOptions` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite softBody

[`src/factory/Composites.js:304`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L304 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.softBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.softBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composites. [stack](https://brm.io/matter-js/docs/classes/Composites.html\#method_stack)

(x, y, columns, rows, columnGap, rowGap, callback)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Create a new composite containing bodies created in the callback in a grid arrangement.
This function uses the body's bounds to prevent overlaps.

#### Parameters

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in X.

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


Starting position in Y.

- `columns` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rows` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `columnGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `rowGap` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `callback` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite containing objects created in the callback

[`src/factory/Composites.js:23`](https://github.com/liabru/matter-js/tree/master/src/factory/Composites.js#L23 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composites.stack%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composites.stack%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")