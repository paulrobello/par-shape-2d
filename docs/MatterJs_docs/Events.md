---
url: "https://brm.io/matter-js/docs/classes/Events.html"
title: "Matter.Events Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Events.js:1`](https://brm.io/matter-js/docs/files/src_core_Events.js.html#l1)

The `Matter.Events` module contains methods to fire and listen to events on other objects.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Events. [off](https://brm.io/matter-js/docs/classes/Events.html\#method_off)

(object, eventNames, callback)

Removes the given event callback. If no callback, clears all callbacks in `eventNames`. If no `eventNames`, clears all events.

#### Parameters

- `object` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `eventNames` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `callback` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


[`src/core/Events.js:38`](https://github.com/liabru/matter-js/tree/master/src/core/Events.js#L38 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Events.off%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Events.off%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Events. [on](https://brm.io/matter-js/docs/classes/Events.html\#method_on)

(object, eventNames, callback)

Subscribes a callback function to the given object's `eventName`.

#### Parameters

- `object` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `eventNames` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `callback` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


[`src/core/Events.js:17`](https://github.com/liabru/matter-js/tree/master/src/core/Events.js#L17 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Events.on%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Events.on%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Events. [trigger](https://brm.io/matter-js/docs/classes/Events.html\#method_trigger)

(object, eventNames, event)

Fires all the callbacks subscribed to the given object's `eventName`, in the order they subscribed, if any.

#### Parameters

- `object` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `eventNames` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


[`src/core/Events.js:74`](https://github.com/liabru/matter-js/tree/master/src/core/Events.js#L74 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Events.trigger%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Events.trigger%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")