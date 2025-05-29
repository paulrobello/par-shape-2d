---
url: "https://brm.io/matter-js/docs/classes/Mouse.html"
title: "Matter.Mouse Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Mouse.js:1`](https://brm.io/matter-js/docs/files/src_core_Mouse.js.html#l1)

The `Matter.Mouse` module contains methods for creating and manipulating mouse inputs.

## Methods

### Matter.Mouse. [\_getRelativeMousePosition](https://brm.io/matter-js/docs/classes/Mouse.html\#method__getRelativeMousePosition)

(event, element, pixelRatio)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)private

Gets the mouse position relative to an element given a screen pixel ratio.

#### Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `element` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `pixelRatio` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[`src/core/Mouse.js:170`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L170 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse._getRelativeMousePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse._getRelativeMousePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Mouse. [clearSourceEvents](https://brm.io/matter-js/docs/classes/Mouse.html\#method_clearSourceEvents)

(mouse)

Clears all captured source events.

#### Parameters

- `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


[`src/core/Mouse.js:131`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L131 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse.clearSourceEvents%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse.clearSourceEvents%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Mouse. [create](https://brm.io/matter-js/docs/classes/Mouse.html\#method_create)

(element)

→ [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

Creates a mouse input.

#### Parameters

- `element` [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)


#### Returns

[Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

A new mouse

[`src/core/Mouse.js:15`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L15 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Mouse. [setElement](https://brm.io/matter-js/docs/classes/Mouse.html\#method_setElement)

(mouse, element)

Sets the element the mouse is bound to (and relative to).

#### Parameters

- `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

- `element` [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)


[`src/core/Mouse.js:111`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L111 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse.setElement%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse.setElement%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Mouse. [setOffset](https://brm.io/matter-js/docs/classes/Mouse.html\#method_setOffset)

(mouse, offset)

Sets the mouse position offset.

#### Parameters

- `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

- `offset` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/core/Mouse.js:144`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L144 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse.setOffset%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse.setOffset%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Mouse. [setScale](https://brm.io/matter-js/docs/classes/Mouse.html\#method_setScale)

(mouse, scale)

Sets the mouse position scale.

#### Parameters

- `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

- `scale` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/core/Mouse.js:157`](https://github.com/liabru/matter-js/tree/master/src/core/Mouse.js#L157 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Mouse.setScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Mouse.setScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")