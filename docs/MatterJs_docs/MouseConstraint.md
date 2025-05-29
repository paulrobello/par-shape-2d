---
url: "https://brm.io/matter-js/docs/classes/MouseConstraint.html"
title: "Matter.MouseConstraint Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/constraint/MouseConstraint.js:1`](https://brm.io/matter-js/docs/files/src_constraint_MouseConstraint.js.html#l1)

The `Matter.MouseConstraint` module contains methods for creating mouse constraints.
Mouse constraints are used for allowing user interaction, providing the ability to move bodies via the mouse or touch.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.MouseConstraint. [\_triggerEvents](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#method__triggerEvents)

(mouseConstraint)

private

Triggers mouse constraint events.

#### Parameters

- `mouseConstraint` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


[`src/constraint/MouseConstraint.js:133`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L133 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22MouseConstraint._triggerEvents%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22MouseConstraint._triggerEvents%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.MouseConstraint. [create](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#method_create)

(engine, options)

→ [MouseConstraint](https://brm.io/matter-js/docs/classes/MouseConstraint.html)

Creates a new mouse constraint.
All properties have default values, and many are pre-calculated automatically based on other properties.
See the properties section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[MouseConstraint](https://brm.io/matter-js/docs/classes/MouseConstraint.html)

A new MouseConstraint

[`src/constraint/MouseConstraint.js:26`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L26 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22MouseConstraint.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22MouseConstraint.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.MouseConstraint. [update](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#method_update)

(mouseConstraint, bodies)

private

Updates the given mouse constraint.

#### Parameters

- `mouseConstraint` [MouseConstraint](https://brm.io/matter-js/docs/classes/MouseConstraint.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


[`src/constraint/MouseConstraint.js:86`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L86 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22MouseConstraint.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22MouseConstraint.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.MouseConstraint.create` and may be passed to it as `options`.

### MouseConstraint. [`body`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#property_body)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

The `Body` that is currently being moved by the user, or `null` if no body.

Default: `null`

[`src/constraint/MouseConstraint.js:237`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22body%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22body%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### MouseConstraint. [`collisionFilter`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#property_collisionFilter)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An `Object` that specifies the collision filter properties.
The collision filter allows the user to define which types of body this mouse constraint can interact with.
See `body.collisionFilter` for more information.

[`src/constraint/MouseConstraint.js:252`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionFilter%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionFilter%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### MouseConstraint. [`constraint`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#property_constraint)

[Constraint](https://brm.io/matter-js/docs/classes/Constraint.html)

The `Constraint` object that is used to move the body during interaction.

[`src/constraint/MouseConstraint.js:245`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22constraint%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22constraint%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### MouseConstraint. [`mouse`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#property_mouse)

[Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

The `Mouse` instance in use. If not supplied in `MouseConstraint.create`, one will be created.

Default: `mouse`

[`src/constraint/MouseConstraint.js:229`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mouse%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mouse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### MouseConstraint. [`type`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#property_type)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A `String` denoting the type of object.

Default: `"constraint"`

[`src/constraint/MouseConstraint.js:220`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.MouseConstraint.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(MouseConstraint, " [`enddrag`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#event_enddrag)", callback)

Fired when the user ends dragging a body

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


    The engine's mouse instance

  - `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


    The body that has stopped being dragged

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/constraint/MouseConstraint.js:203`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22enddrag%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22enddrag%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(MouseConstraint, " [`mousedown`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#event_mousedown)", callback)

Fired when the mouse is down (or a touch has started) during the last step

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


    The engine's mouse instance

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/constraint/MouseConstraint.js:172`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mousedown%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mousedown%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(MouseConstraint, " [`mousemove`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#event_mousemove)", callback)

Fired when the mouse has moved (or a touch moves) during the last step

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


    The engine's mouse instance

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/constraint/MouseConstraint.js:162`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mousemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mousemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(MouseConstraint, " [`mouseup`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#event_mouseup)", callback)

Fired when the mouse is up (or a touch has ended) during the last step

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


    The engine's mouse instance

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/constraint/MouseConstraint.js:182`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mouseup%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mouseup%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(MouseConstraint, " [`startdrag`](https://brm.io/matter-js/docs/classes/MouseConstraint.html\#event_startdrag)", callback)

Fired when the user starts dragging a body

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)


    The engine's mouse instance

  - `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


    The body being dragged

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/constraint/MouseConstraint.js:192`](https://github.com/liabru/matter-js/tree/master/src/constraint/MouseConstraint.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22startdrag%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22startdrag%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")