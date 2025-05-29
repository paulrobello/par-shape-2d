---
url: "https://brm.io/matter-js/docs/classes/Composite.html"
title: "Matter.Composite Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/body/Composite.js:1`](https://brm.io/matter-js/docs/files/src_body_Composite.js.html#l1)

A composite is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite` objects.

They are a container that can represent complex objects made of multiple parts, even if they are not physically connected.
A composite could contain anything from a single body all the way up to a whole world.

When making any changes to composites, use the included functions rather than changing their properties directly.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Composite. [add](https://brm.io/matter-js/docs/classes/Composite.html\#method_add)

(composite, object)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Generic single or multi-add function. Adds a single or an array of body(s), constraint(s) or composite(s) to the given composite.
Triggers `beforeAdd` and `afterAdd` events on the `composite`.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `object` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)


A single or an array of body(s), constraint(s) or composite(s)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the objects added

[`src/body/Composite.js:83`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L83 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.add%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.add%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [addBody](https://brm.io/matter-js/docs/classes/Composite.html\#method_addBody)

(composite, body)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Adds a body to the given composite.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the body added

[`src/body/Composite.js:229`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L229 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.addBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.addBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [addComposite](https://brm.io/matter-js/docs/classes/Composite.html\#method_addComposite)

(compositeA, compositeB)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Adds a composite to the given composite.

#### Parameters

- `compositeA` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `compositeB` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original compositeA with the objects from compositeB added

[`src/body/Composite.js:169`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L169 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.addComposite%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.addComposite%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [addConstraint](https://brm.io/matter-js/docs/classes/Composite.html\#method_addConstraint)

(composite, constraint)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Adds a constraint to the given composite.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `constraint` [Constraint](https://brm.io/matter-js/docs/classes/Constraint.html)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the constraint added

[`src/body/Composite.js:283`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L283 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.addConstraint%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.addConstraint%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [allBodies](https://brm.io/matter-js/docs/classes/Composite.html\#method_allBodies)

(composite)

→ [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

Returns all bodies in the given composite, including all bodies in its children, recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


#### Returns

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

All the bodies

[`src/body/Composite.js:365`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L365 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.allBodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.allBodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [allComposites](https://brm.io/matter-js/docs/classes/Composite.html\#method_allComposites)

(composite)

→ [Composite\[\]](https://brm.io/matter-js/docs/classes/Composite.html)

Returns all composites in the given composite, including all composites in its children, recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


#### Returns

[Composite\[\]](https://brm.io/matter-js/docs/classes/Composite.html)

All the composites

[`src/body/Composite.js:411`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L411 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.allComposites%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.allComposites%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [allConstraints](https://brm.io/matter-js/docs/classes/Composite.html\#method_allConstraints)

(composite)

→ [Constraint\[\]](https://brm.io/matter-js/docs/classes/Constraint.html)

Returns all constraints in the given composite, including all constraints in its children, recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


#### Returns

[Constraint\[\]](https://brm.io/matter-js/docs/classes/Constraint.html)

All the constraints

[`src/body/Composite.js:388`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L388 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.allConstraints%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.allConstraints%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [bounds](https://brm.io/matter-js/docs/classes/Composite.html\#method_bounds)

(composite)

→ [Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

Returns the union of the bounds of all of the composite's bodies.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


The composite.


#### Returns

[Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

The composite bounds.

[`src/body/Composite.js:575`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L575 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.bounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.bounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [clear](https://brm.io/matter-js/docs/classes/Composite.html\#method_clear)

(composite, keepStatic, \[deep=false\])

Removes all bodies, constraints and composites from the given composite.
Optionally clearing its children recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `keepStatic` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

- `[deep=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Composite.js:336`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L336 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [create](https://brm.io/matter-js/docs/classes/Composite.html\#method_create)

(\[options\])

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Creates a new composite. The options parameter is an object that specifies any properties you wish to override the defaults.
See the properites section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

A new composite

[`src/body/Composite.js:25`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L25 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [get](https://brm.io/matter-js/docs/classes/Composite.html\#method_get)

(composite, id, type)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Searches the composite recursively for an object matching the type and id supplied, null if not found.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `id` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `type` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The requested object, if found

[`src/body/Composite.js:434`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L434 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.get%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.get%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [move](https://brm.io/matter-js/docs/classes/Composite.html\#method_move)

(compositeA, objects, compositeB)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Moves the given object(s) from compositeA to compositeB (equal to a remove followed by an add).

#### Parameters

- `compositeA` CompositeA

- `objects` [Object\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `compositeB` CompositeB


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Returns compositeA

[`src/body/Composite.js:468`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L468 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.move%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.move%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [rebase](https://brm.io/matter-js/docs/classes/Composite.html\#method_rebase)

(composite)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Assigns new ids for all objects in the composite, recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Returns composite

[`src/body/Composite.js:482`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L482 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.rebase%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.rebase%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [remove](https://brm.io/matter-js/docs/classes/Composite.html\#method_remove)

(composite, object, \[deep=false\])

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

Generic remove function. Removes one or many body(s), constraint(s) or a composite(s) to the given composite.
Optionally searching its children recursively.
Triggers `beforeRemove` and `afterRemove` events on the `composite`.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `object` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

- `[deep=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the objects removed

[`src/body/Composite.js:128`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L128 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.remove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.remove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeBody](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeBody)

(composite, body, \[deep=false\])

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a body from the given composite, and optionally searching its children recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `[deep=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the body removed

[`src/body/Composite.js:243`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L243 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeBodyAt](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeBodyAt)

(composite, position)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a body from the given composite.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `position` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the body removed

[`src/body/Composite.js:269`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L269 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeBodyAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeBodyAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeComposite](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeComposite)

(compositeA, compositeB, \[deep=false\])

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a composite from the given composite, and optionally searching its children recursively.

#### Parameters

- `compositeA` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `compositeB` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `[deep=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original compositeA with the composite removed

[`src/body/Composite.js:184`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L184 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeComposite%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeComposite%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeCompositeAt](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeCompositeAt)

(composite, position)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a composite from the given composite.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `position` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the composite removed

[`src/body/Composite.js:215`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L215 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeCompositeAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeCompositeAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeConstraint](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeConstraint)

(composite, constraint, \[deep=false\])

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a constraint from the given composite, and optionally searching its children recursively.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `constraint` [Constraint](https://brm.io/matter-js/docs/classes/Constraint.html)

- `[deep=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the constraint removed

[`src/body/Composite.js:297`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L297 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeConstraint%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeConstraint%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [removeConstraintAt](https://brm.io/matter-js/docs/classes/Composite.html\#method_removeConstraintAt)

(composite, position)

→ [Composite](https://brm.io/matter-js/docs/classes/Composite.html)private

Removes a body from the given composite.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `position` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The original composite with the constraint removed

[`src/body/Composite.js:322`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L322 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.removeConstraintAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.removeConstraintAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [rotate](https://brm.io/matter-js/docs/classes/Composite.html\#method_rotate)

(composite, rotation, point, \[recursive=true\])

Rotates all children in the composite by a given angle about the given point, without imparting any angular velocity.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `rotation` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[recursive=true]` Booloptional


[`src/body/Composite.js:518`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L518 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [scale](https://brm.io/matter-js/docs/classes/Composite.html\#method_scale)

(composite, scaleX, scaleY, point, \[recursive=true\])

Scales all children in the composite, including updating physical properties (mass, area, axes, inertia), from a world-space point.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `scaleX` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `scaleY` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `point` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[recursive=true]` Booloptional


[`src/body/Composite.js:547`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L547 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [setModified](https://brm.io/matter-js/docs/classes/Composite.html\#method_setModified)

(composite, isModified, \[updateParents=false\], \[updateChildren=false\])

private

Sets the composite's `isModified` flag.
If `updateParents` is true, all parents will be set (default: false).
If `updateChildren` is true, all children will be set (default: false).

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `isModified` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

- `[updateParents=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional

- `[updateChildren=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Composite.js:51`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L51 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.setModified%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.setModified%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Composite. [translate](https://brm.io/matter-js/docs/classes/Composite.html\#method_translate)

(composite, translation, \[recursive=true\])

Translates all children in the composite by a given vector relative to their current positions,
without imparting any velocity.

#### Parameters

- `composite` [Composite](https://brm.io/matter-js/docs/classes/Composite.html)

- `translation` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[recursive=true]` Booloptional


[`src/body/Composite.js:500`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L500 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Composite.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Composite.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Composite.create` and may be passed to it as `options`.

### Composite. [`bodies`](https://brm.io/matter-js/docs/classes/Composite.html\#property_bodies)

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

An array of `Body` that are _direct_ children of this composite.
To add or remove bodies you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
If you wish to recursively find all descendants, you should use the `Composite.allBodies` method.

Default: `[]`

[`src/body/Composite.js:686`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bodies%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`cache`](https://brm.io/matter-js/docs/classes/Composite.html\#property_cache)

private

An object used for storing cached results for performance reasons.
This is used internally only and is automatically managed.

[`src/body/Composite.js:723`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22cache%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22cache%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`composites`](https://brm.io/matter-js/docs/classes/Composite.html\#property_composites)

[Composite\[\]](https://brm.io/matter-js/docs/classes/Composite.html)

An array of `Composite` that are _direct_ children of this composite.
To add or remove composites you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
If you wish to recursively find all descendants, you should use the `Composite.allComposites` method.

Default: `[]`

[`src/body/Composite.js:706`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22composites%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22composites%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`constraints`](https://brm.io/matter-js/docs/classes/Composite.html\#property_constraints)

[Constraint\[\]](https://brm.io/matter-js/docs/classes/Constraint.html)

An array of `Constraint` that are _direct_ children of this composite.
To add or remove constraints you should use `Composite.add` and `Composite.remove` methods rather than directly modifying this property.
If you wish to recursively find all descendants, you should use the `Composite.allConstraints` method.

Default: `[]`

[`src/body/Composite.js:696`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22constraints%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22constraints%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`id`](https://brm.io/matter-js/docs/classes/Composite.html\#property_id)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.

[`src/body/Composite.js:645`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22id%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22id%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`isModified`](https://brm.io/matter-js/docs/classes/Composite.html\#property_isModified)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that specifies whether the composite has been modified during the current step.
This is automatically managed when bodies, constraints or composites are added or removed.

Default: `false`

[`src/body/Composite.js:669`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22isModified%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22isModified%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`label`](https://brm.io/matter-js/docs/classes/Composite.html\#property_label)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

An arbitrary `String` name to help the user identify and manage composites.

Default: `"Composite"`

[`src/body/Composite.js:661`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22label%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22label%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`parent`](https://brm.io/matter-js/docs/classes/Composite.html\#property_parent)

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The `Composite` that is the parent of this composite. It is automatically managed by the `Matter.Composite` methods.

Default: `null`

[`src/body/Composite.js:678`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22parent%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22parent%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`plugin`](https://brm.io/matter-js/docs/classes/Composite.html\#property_plugin)

An object reserved for storing plugin-specific properties.

[`src/body/Composite.js:716`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Composite. [`type`](https://brm.io/matter-js/docs/classes/Composite.html\#property_type)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A `String` denoting the type of object.

Default: `"composite"`

[`src/body/Composite.js:652`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.Composite.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(Composite, " [`afterAdd`](https://brm.io/matter-js/docs/classes/Composite.html\#event_afterAdd)", callback)

Fired when a call to `Composite.add` is made, after objects have been added.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `object`


    The object(s) that have been added (may be a single body, constraint, composite or a mixed array of these)

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Composite.js:609`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterAdd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterAdd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Composite, " [`afterRemove`](https://brm.io/matter-js/docs/classes/Composite.html\#event_afterRemove)", callback)

Fired when a call to `Composite.remove` is made, after objects have been removed.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `object`


    The object(s) that have been removed (may be a single body, constraint, composite or a mixed array of these)

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Composite.js:629`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterRemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterRemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Composite, " [`beforeAdd`](https://brm.io/matter-js/docs/classes/Composite.html\#event_beforeAdd)", callback)

Fired when a call to `Composite.add` is made, before objects have been added.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `object`


    The object(s) to be added (may be a single body, constraint, composite or a mixed array of these)

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Composite.js:599`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeAdd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeAdd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Composite, " [`beforeRemove`](https://brm.io/matter-js/docs/classes/Composite.html\#event_beforeRemove)", callback)

Fired when a call to `Composite.remove` is made, before objects have been removed.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `object`


    The object(s) to be removed (may be a single body, constraint, composite or a mixed array of these)

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Composite.js:619`](https://github.com/liabru/matter-js/tree/master/src/body/Composite.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeRemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeRemove%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")