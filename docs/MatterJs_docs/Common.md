---
url: "https://brm.io/matter-js/docs/classes/Common.html"
title: "Matter.Common Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Common.js:1`](https://brm.io/matter-js/docs/files/src_core_Common.js.html#l1)

The `Matter.Common` module contains utility functions that are common to all modules.

## Methods

### Matter.Common. [chain](https://brm.io/matter-js/docs/classes/Common.html\#method_chain)

(funcs...)

→ [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

Takes _n_ functions as arguments and returns a new function that calls them in order.
The arguments applied when calling the new function will also be applied to every function passed.
The value of `this` refers to the last value returned in the chain that was not `undefined`.
Therefore if a passed function does not return a value, the previously returned value is maintained.
After all passed functions have been called the new function returns the last returned value (if any).
If any of the passed functions are a chain, then the chain will be flattened.

#### Parameters

- `funcs` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)multiple


The functions to chain.


#### Returns

[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

A new function that calls the passed functions in order.

[`src/core/Common.js:494`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L494 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.chain%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.chain%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [chainPathAfter](https://brm.io/matter-js/docs/classes/Common.html\#method_chainPathAfter)

(base, path, func)

→ [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

Chains a function to excute after the original function on the given `path` relative to `base`.
See also docs for `Common.chain`.

#### Parameters

- `base` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The base object

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `base`

- `func` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


The function to chain after the original


#### Returns

[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

The chained function that replaced the original

[`src/core/Common.js:560`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L560 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.chainPathAfter%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.chainPathAfter%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [chainPathBefore](https://brm.io/matter-js/docs/classes/Common.html\#method_chainPathBefore)

(base, path, func)

→ [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

Chains a function to excute before the original function on the given `path` relative to `base`.
See also docs for `Common.chain`.

#### Parameters

- `base` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The base object

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `base`

- `func` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


The function to chain before the original


#### Returns

[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

The chained function that replaced the original

[`src/core/Common.js:544`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L544 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.chainPathBefore%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.chainPathBefore%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [choose](https://brm.io/matter-js/docs/classes/Common.html\#method_choose)

(choices)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Randomly chooses a value from a list with equal probability.
The function uses a seeded random generator.

#### Parameters

- `choices` [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

A random choice object from the array

[`src/core/Common.js:165`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L165 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.choose%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.choose%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [clamp](https://brm.io/matter-js/docs/classes/Common.html\#method_clamp)

(value, min, max)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the given value clamped between a minimum and maximum value.

#### Parameters

- `value` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `min` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `max` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The value clamped between min and max inclusive

[`src/core/Common.js:230`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L230 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.clamp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.clamp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [clone](https://brm.io/matter-js/docs/classes/Common.html\#method_clone)

(obj, deep)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Creates a new clone of the object, if deep is true references will also be cloned.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `deep` Bool


#### Returns

obj cloned

[`src/core/Common.js:62`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L62 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.clone%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.clone%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [colorToNumber](https://brm.io/matter-js/docs/classes/Common.html\#method_colorToNumber)

(colorString)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Converts a CSS hex colour string into an integer.

#### Parameters

- `colorString` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer representing the CSS hex string

[`src/core/Common.js:298`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L298 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.colorToNumber%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.colorToNumber%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [deprecated](https://brm.io/matter-js/docs/classes/Common.html\#method_deprecated)

(obj, name, warning)

Shows a deprecated console warning when the function on the given object is called.
The target function will be replaced with a new function that first shows the warning
and then calls the original function.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The object or module

- `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The property name of the function on obj

- `warning` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The one-time message to show if the function is called


[`src/core/Common.js:383`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L383 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.deprecated%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.deprecated%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [extend](https://brm.io/matter-js/docs/classes/Common.html\#method_extend)

(obj, deep)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Extends the object in the first argument using the object in the second argument.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `deep` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)


#### Returns

obj extended

[`src/core/Common.js:20`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L20 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.extend%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.extend%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [get](https://brm.io/matter-js/docs/classes/Common.html\#method_get)

(obj, path, \[begin\], \[end\])

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Gets a value from `base` relative to the `path` string.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The base object

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `base`, e.g. 'Foo.Bar.baz'

- `[begin]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Path slice begin

- `[end]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Path slice end


#### Returns

The object at the given path

[`src/core/Common.js:113`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L113 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.get%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.get%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [getDecomp](https://brm.io/matter-js/docs/classes/Common.html\#method_getDecomp)

()

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Returns the [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module provided through `Common.setDecomp`,
otherwise returns the global `decomp` if set.

#### Returns

The [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module if provided.

[`src/core/Common.js:586`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L586 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.getDecomp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.getDecomp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [indexOf](https://brm.io/matter-js/docs/classes/Common.html\#method_indexOf)

(haystack, needle)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A cross browser compatible indexOf implementation.

#### Parameters

- `haystack` [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

- `needle` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The position of needle in haystack, otherwise -1.

[`src/core/Common.js:407`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L407 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.indexOf%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.indexOf%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [info](https://brm.io/matter-js/docs/classes/Common.html\#method_info)

(objs...)

Shows a `console.info` message only if the current `Common.logLevel` allows it.
The message will be prefixed with 'matter-js' to make it easily identifiable.

#### Parameters

- `objs` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)multiple


The objects to log.


[`src/core/Common.js:345`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L345 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.info%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.info%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [isArray](https://brm.io/matter-js/docs/classes/Common.html\#method_isArray)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the object is an array.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the object is an array, otherwise false

[`src/core/Common.js:190`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L190 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.isArray%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.isArray%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [isElement](https://brm.io/matter-js/docs/classes/Common.html\#method_isElement)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the object is a HTMLElement, otherwise false.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the object is a HTMLElement, otherwise false

[`src/core/Common.js:176`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L176 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.isElement%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.isElement%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [isFunction](https://brm.io/matter-js/docs/classes/Common.html\#method_isFunction)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the object is a function.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the object is a function, otherwise false

[`src/core/Common.js:200`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L200 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.isFunction%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.isFunction%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [isPlainObject](https://brm.io/matter-js/docs/classes/Common.html\#method_isPlainObject)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the object is a plain object.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the object is a plain object, otherwise false

[`src/core/Common.js:210`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L210 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.isPlainObject%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.isPlainObject%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [isString](https://brm.io/matter-js/docs/classes/Common.html\#method_isString)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns true if the object is a string.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

True if the object is a string, otherwise false

[`src/core/Common.js:220`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L220 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.isString%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.isString%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [keys](https://brm.io/matter-js/docs/classes/Common.html\#method_keys)

(obj)

→ [String\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

Returns the list of keys for the given object.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[String\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

keys

[`src/core/Common.js:73`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L73 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.keys%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.keys%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [log](https://brm.io/matter-js/docs/classes/Common.html\#method_log)

(objs...)

Shows a `console.log` message only if the current `Common.logLevel` allows it.
The message will be prefixed with 'matter-js' to make it easily identifiable.

#### Parameters

- `objs` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)multiple


The objects to log.


[`src/core/Common.js:333`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L333 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.log%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.log%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [map](https://brm.io/matter-js/docs/classes/Common.html\#method_map)

(list, func)

→ [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

A cross browser compatible array map implementation.

#### Parameters

- `list` [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

- `func` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


#### Returns

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Values from list transformed by func.

[`src/core/Common.js:426`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L426 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.map%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.map%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [nextId](https://brm.io/matter-js/docs/classes/Common.html\#method_nextId)

()

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the next unique sequential ID.

#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Unique sequential ID

[`src/core/Common.js:398`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L398 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.nextId%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.nextId%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [now](https://brm.io/matter-js/docs/classes/Common.html\#method_now)

()

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the current timestamp since the time origin (e.g. from page load).
The result is in milliseconds and will use high-resolution timing if available.

#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

the current timestamp in milliseconds

[`src/core/Common.js:256`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L256 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.now%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.now%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [random](https://brm.io/matter-js/docs/classes/Common.html\#method_random)

(min, max)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns a random value between a minimum and a maximum value inclusive.
The function uses a seeded random generator.

#### Parameters

- `min` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `max` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A random number between min and max inclusive

[`src/core/Common.js:278`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L278 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.random%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.random%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [set](https://brm.io/matter-js/docs/classes/Common.html\#method_set)

(obj, path, val, \[begin\], \[end\])

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Sets a value on `base` relative to the given `path` string.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The base object

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `base`, e.g. 'Foo.Bar.baz'

- `val` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The value to set

- `[begin]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Path slice begin

- `[end]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


Path slice end


#### Returns

Pass through `val` for chaining

[`src/core/Common.js:132`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L132 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [setDecomp](https://brm.io/matter-js/docs/classes/Common.html\#method_setDecomp)

(decomp)

Provide the [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module to enable
concave vertex decomposition support when using `Bodies.fromVertices` e.g. `Common.setDecomp(require('poly-decomp'))`.

#### Parameters

- `decomp` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The [poly-decomp](https://github.com/schteppe/poly-decomp.js) library module.


[`src/core/Common.js:576`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L576 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.setDecomp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.setDecomp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [shuffle](https://brm.io/matter-js/docs/classes/Common.html\#method_shuffle)

(array)

→ [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Shuffles the given array in-place.
The function uses a seeded random generator.

#### Parameters

- `array` [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)


#### Returns

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

array shuffled randomly

[`src/core/Common.js:148`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L148 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.shuffle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.shuffle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [sign](https://brm.io/matter-js/docs/classes/Common.html\#method_sign)

(value)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the sign of the given value.

#### Parameters

- `value` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

-1 if negative, +1 if 0 or positive

[`src/core/Common.js:246`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L246 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.sign%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.sign%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [topologicalSort](https://brm.io/matter-js/docs/classes/Common.html\#method_topologicalSort)

(graph)

→ [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Takes a directed graph and returns the partially ordered set of vertices in topological order.
Circular dependencies are allowed.

#### Parameters

- `graph` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Partially ordered set of vertices in topological order.

[`src/core/Common.js:447`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L447 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.topologicalSort%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.topologicalSort%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [values](https://brm.io/matter-js/docs/classes/Common.html\#method_values)

(obj)

→ [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Returns the list of values for the given object.

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

Array of the objects property values

[`src/core/Common.js:90`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L90 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.values%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.values%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [warn](https://brm.io/matter-js/docs/classes/Common.html\#method_warn)

(objs...)

Shows a `console.warn` message only if the current `Common.logLevel` allows it.
The message will be prefixed with 'matter-js' to make it easily identifiable.

#### Parameters

- `objs` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)multiple


The objects to log.


[`src/core/Common.js:357`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L357 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.warn%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.warn%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Common. [warnOnce](https://brm.io/matter-js/docs/classes/Common.html\#method_warnOnce)

(objs...)

Uses `Common.warn` to log the given message one time only.

#### Parameters

- `objs` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)multiple


The objects to log.


[`src/core/Common.js:369`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L369 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Common.warnOnce%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Common.warnOnce%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Common.create` and may be passed to it as `options`.

### Common. [`logLevel`](https://brm.io/matter-js/docs/classes/Common.html\#property_logLevel)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

static

The console logging level to use, where each level includes all levels above and excludes the levels below.
The default level is 'debug' which shows all console messages.

Possible level values are:

- 0 = None
- 1 = Debug
- 2 = Info
- 3 = Warn
- 4 = Error

Default: `1`

[`src/core/Common.js:316`](https://github.com/liabru/matter-js/tree/master/src/core/Common.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22logLevel%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22logLevel%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")