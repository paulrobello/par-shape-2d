---
url: "https://brm.io/matter-js/docs/classes/Matter.html"
title: "Matter.Matter Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Matter.js:1`](https://brm.io/matter-js/docs/files/src_core_Matter.js.html#l1)

The `Matter` module is the top level namespace. It also includes a function for installing plugins on top of the library.

## Methods

### Matter.Matter. [after](https://brm.io/matter-js/docs/classes/Matter.html\#method_after)

(path, func)

→ [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

Chains a function to excute after the original function on the given `path` relative to `Matter`.
See also docs for `Common.chain`.

#### Parameters

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `Matter`

- `func` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


The function to chain after the original


#### Returns

[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

The chained function that replaced the original

[`src/core/Matter.js:73`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L73 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Matter.after%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Matter.after%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Matter. [before](https://brm.io/matter-js/docs/classes/Matter.html\#method_before)

(path, func)

→ [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

Chains a function to excute before the original function on the given `path` relative to `Matter`.
See also docs for `Common.chain`.

#### Parameters

- `path` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The path relative to `Matter`

- `func` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


The function to chain before the original


#### Returns

[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)

The chained function that replaced the original

[`src/core/Matter.js:60`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L60 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Matter.before%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Matter.before%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Matter. [use](https://brm.io/matter-js/docs/classes/Matter.html\#method_use)

(plugin...)

Installs the given plugins on the `Matter` namespace.
This is a short-hand for `Plugin.use`, see it for more information.
Call this function once at the start of your code, with all of the plugins you wish to install as arguments.
Avoid calling this function multiple times unless you intend to manually control installation order.

#### Parameters

- `plugin` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)multiple


The plugin(s) to install on `base` (multi-argument).


[`src/core/Matter.js:48`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L48 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Matter.use%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Matter.use%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Matter.create` and may be passed to it as `options`.

### Matter. [`name`](https://brm.io/matter-js/docs/classes/Matter.html\#property_name)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

The library name.

[`src/core/Matter.js:16`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22name%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22name%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter. [`used`](https://brm.io/matter-js/docs/classes/Matter.html\#property_used)

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

The plugins that have been installed through `Matter.Plugin.install`. Read only.

[`src/core/Matter.js:40`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22used%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22used%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter. [`uses`](https://brm.io/matter-js/docs/classes/Matter.html\#property_uses)

[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

A list of plugin dependencies to be installed. These are normally set and installed through `Matter.use`.
Alternatively you may set `Matter.uses` manually and install them by calling `Plugin.use(Matter)`.

[`src/core/Matter.js:32`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22uses%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22uses%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter. [`version`](https://brm.io/matter-js/docs/classes/Matter.html\#property_version)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

The library version.

[`src/core/Matter.js:24`](https://github.com/liabru/matter-js/tree/master/src/core/Matter.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22version%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22version%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")