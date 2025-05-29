---
url: "https://brm.io/matter-js/docs/classes/Render.html"
title: "Matter.Render Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/render/Render.js:1`](https://brm.io/matter-js/docs/files/src_render_Render.js.html#l1)

The `Matter.Render` module is a lightweight, optional utility which provides a simple canvas based renderer for visualising instances of `Matter.Engine`.
It is intended for development and debugging purposes, but may also be suitable for simple games.
It includes a number of drawing options including wireframe, vector with support for sprites and viewports.

## Methods

### Matter.Render. [\_createCanvas](https://brm.io/matter-js/docs/classes/Render.html\#method__createCanvas)

(width, height)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)private

#### Parameters

- `width` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `height` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

canvas

[`src/render/Render.js:1474`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1474 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render._createCanvas%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render._createCanvas%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [\_getPixelRatio](https://brm.io/matter-js/docs/classes/Render.html\#method__getPixelRatio)

(canvas)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)private

Gets the pixel ratio of the canvas.

#### Parameters

- `canvas` [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

pixel ratio

[`src/render/Render.js:1490`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1490 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render._getPixelRatio%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render._getPixelRatio%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [\_getTexture](https://brm.io/matter-js/docs/classes/Render.html\#method__getTexture)

(render, imagePath)

→
Image
private

Gets the requested texture (an Image) via its path

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `imagePath` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


#### Returns

Image

texture

[`src/render/Render.js:1507`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1507 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render._getTexture%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render._getTexture%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [\_mean](https://brm.io/matter-js/docs/classes/Render.html\#method__mean)

(values)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)private

Returns the mean value of the given numbers.

#### Parameters

- `values` [Number\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

the mean of given values

[`src/render/Render.js:1459`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1459 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render._mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render._mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [\_updateTiming](https://brm.io/matter-js/docs/classes/Render.html\#method__updateTiming)

(render, time)

private

Updates render timing.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `time` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/render/Render.js:1421`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1421 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render._updateTiming%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render._updateTiming%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [applyBackground](https://brm.io/matter-js/docs/classes/Render.html\#method_applyBackground)

(render, background)

private

Applies the background to the canvas using CSS.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `background` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


[`src/render/Render.js:1527`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1527 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.applyBackground%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.applyBackground%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodies](https://brm.io/matter-js/docs/classes/Render.html\#method_bodies)

(render, bodies, context)

private

Description

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:749`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L749 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyAxes](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyAxes)

(render, bodies, context)

private

Draws body angle indicators and axes

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1021`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1021 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyAxes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyAxes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyBounds](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyBounds)

(render, bodies, context)

private

Draws body bounds

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:984`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L984 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyBounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyBounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyConvexHulls](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyConvexHulls)

(render, bodies, context)

private

Optimised method for drawing body convex hull wireframes in one pass

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:905`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L905 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyConvexHulls%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyConvexHulls%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyIds](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyIds)

(render, bodies, context)

private

Draws body ids

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1169`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1169 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyIds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyIds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyPositions](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyPositions)

(render, bodies, context)

private

Draws body positions

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1083`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1083 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyPositions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyPositions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyVelocity](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyVelocity)

(render, bodies, context)

private

Draws body velocity

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1139`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1139 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [bodyWireframes](https://brm.io/matter-js/docs/classes/Render.html\#method_bodyWireframes)

(render, bodies, context)

private

Optimised method for drawing body wireframes in one pass

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:852`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L852 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.bodyWireframes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.bodyWireframes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [collisions](https://brm.io/matter-js/docs/classes/Render.html\#method_collisions)

(render, pairs, context)

private

Description

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1196`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1196 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.collisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.collisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [constraints](https://brm.io/matter-js/docs/classes/Render.html\#method_constraints)

(constraints, context)

private

Description

#### Parameters

- `constraints` [Constraint\[\]](https://brm.io/matter-js/docs/classes/Constraint.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:672`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L672 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.constraints%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.constraints%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [create](https://brm.io/matter-js/docs/classes/Render.html\#method_create)

(\[options\])

→ [Render](https://brm.io/matter-js/docs/classes/Render.html)

Creates a new renderer. The options parameter is an object that specifies any properties you wish to override the defaults.
All properties have default values, and many are pre-calculated automatically based on other properties.
See the properties section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Render](https://brm.io/matter-js/docs/classes/Render.html)

A new renderer

[`src/render/Render.js:38`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L38 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [endViewTransform](https://brm.io/matter-js/docs/classes/Render.html\#method_endViewTransform)

(render)

Resets all transforms on the render context.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)


[`src/render/Render.js:341`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L341 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.endViewTransform%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.endViewTransform%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [inspector](https://brm.io/matter-js/docs/classes/Render.html\#method_inspector)

(inspector, context)

private

Description

#### Parameters

- `inspector` Inspector

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1336`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1336 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.inspector%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.inspector%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [lookAt](https://brm.io/matter-js/docs/classes/Render.html\#method_lookAt)

(render, objects, \[padding\], \[center=true\])

Positions and sizes the viewport around the given object bounds.
Objects must have at least one of the following properties:

- `object.bounds`
- `object.position`
- `object.min` and `object.max`
- `object.x` and `object.y`

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `objects` [Object\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `[padding]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional

- `[center=true]` Booloptional


[`src/render/Render.js:224`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L224 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.lookAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.lookAt%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [mousePosition](https://brm.io/matter-js/docs/classes/Render.html\#method_mousePosition)

(render, mouse, context)

private

Renders mouse position.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `mouse` [Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:970`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L970 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.mousePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.mousePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [performance](https://brm.io/matter-js/docs/classes/Render.html\#method_performance)

(render, context)

private

Renders engine and render performance information.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:542`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L542 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.performance%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.performance%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [run](https://brm.io/matter-js/docs/classes/Render.html\#method_run)

(render)

Continuously updates the render canvas on the `requestAnimationFrame` event.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)


[`src/render/Render.js:135`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L135 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [separations](https://brm.io/matter-js/docs/classes/Render.html\#method_separations)

(render, pairs, context)

private

Description

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:1279`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1279 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.separations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.separations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [setPixelRatio](https://brm.io/matter-js/docs/classes/Render.html\#method_setPixelRatio)

(render, pixelRatio)

Sets the pixel ratio of the renderer and updates the canvas.
To automatically detect the correct ratio, pass the string `'auto'` for `pixelRatio`.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `pixelRatio` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/render/Render.js:171`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L171 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.setPixelRatio%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.setPixelRatio%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [setSize](https://brm.io/matter-js/docs/classes/Render.html\#method_setSize)

(render, width, height)

Sets the render `width` and `height`.

Updates the canvas accounting for `render.options.pixelRatio`.

Updates the bottom right render bound `render.bounds.max` relative to the provided `width` and `height`.
The top left render bound `render.bounds.min` isn't changed.

Follow this call with `Render.lookAt` if you need to change the render bounds.

See also `Render.setPixelRatio`.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `width` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


The width (in CSS pixels)

- `height` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


The height (in CSS pixels)


[`src/render/Render.js:194`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L194 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.setSize%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.setSize%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [startViewTransform](https://brm.io/matter-js/docs/classes/Render.html\#method_startViewTransform)

(render)

Applies viewport transforms based on `render.bounds` to a render context.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)


[`src/render/Render.js:322`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L322 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.startViewTransform%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.startViewTransform%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [stats](https://brm.io/matter-js/docs/classes/Render.html\#method_stats)

(render, context, time)

private

Renders statistics about the engine and world useful for debugging.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)

- `time` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/render/Render.js:487`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L487 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.stats%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.stats%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [status](https://brm.io/matter-js/docs/classes/Render.html\#method_status)

(context, x, y, width, height, count, label, indicator, plotY)

private

Renders a label, indicator and a chart.

#### Parameters

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)

- `x` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `y` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `width` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `height` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `count` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `label` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `indicator` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

- `plotY` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


[`src/render/Render.js:631`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L631 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.status%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.status%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [stop](https://brm.io/matter-js/docs/classes/Render.html\#method_stop)

(render)

Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)


[`src/render/Render.js:162`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L162 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.stop%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.stop%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [vertexNumbers](https://brm.io/matter-js/docs/classes/Render.html\#method_vertexNumbers)

(render, bodies, context)

private

Renders body vertex numbers.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `context` [RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/RenderingContext)


[`src/render/Render.js:944`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L944 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.vertexNumbers%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.vertexNumbers%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Render. [world](https://brm.io/matter-js/docs/classes/Render.html\#method_world)

(render)

Renders the given `engine`'s `Matter.World` object.
This is the entry point for all rendering and should be called every time the scene changes.

#### Parameters

- `render` [Render](https://brm.io/matter-js/docs/classes/Render.html)


[`src/render/Render.js:350`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L350 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Render.world%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Render.world%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Render.create` and may be passed to it as `options`.

### Render. [`bounds`](https://brm.io/matter-js/docs/classes/Render.html\#property_bounds)

[Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

A `Bounds` object that specifies the drawing view region.
Rendering will be automatically transformed and scaled to fit within the canvas size ( `render.options.width` and `render.options.height`).
This allows for creating views that can pan or zoom around the scene.
You must also set `render.options.hasBounds` to `true` to enable bounded rendering.

[`src/render/Render.js:1608`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bounds%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`canvas`](https://brm.io/matter-js/docs/classes/Render.html\#property_canvas)

[HTMLCanvasElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement)

The canvas element to render to. If not specified, one will be created if `render.element` has been specified.

Default: `null`

[`src/render/Render.js:1600`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22canvas%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22canvas%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`context`](https://brm.io/matter-js/docs/classes/Render.html\#property_context)

[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)

The 2d rendering context from the `render.canvas` element.

[`src/render/Render.js:1618`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22context%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22context%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`controller`](https://brm.io/matter-js/docs/classes/Render.html\#property_controller)

[Render](https://brm.io/matter-js/docs/classes/Render.html)

deprecated

A back-reference to the `Matter.Render` module.

[`src/render/Render.js:1577`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22controller%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22controller%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`element`](https://brm.io/matter-js/docs/classes/Render.html\#property_element)

[HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)

A reference to the element where the canvas is to be inserted (if `render.canvas` has not been specified)

Default: `null`

[`src/render/Render.js:1592`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22element%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22element%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`engine`](https://brm.io/matter-js/docs/classes/Render.html\#property_engine)

[Engine](https://brm.io/matter-js/docs/classes/Engine.html)

A reference to the `Matter.Engine` instance to be used.

[`src/render/Render.js:1585`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22engine%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22engine%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`mouse`](https://brm.io/matter-js/docs/classes/Render.html\#property_mouse)

[Mouse](https://brm.io/matter-js/docs/classes/Mouse.html)

The mouse to render if `render.options.showMousePosition` is enabled.

Default: `null`

[`src/render/Render.js:1632`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mouse%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mouse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options`](https://brm.io/matter-js/docs/classes/Render.html\#property_options)

The configuration options of the renderer.

[`src/render/Render.js:1640`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.background`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.background)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A CSS background color string to use when `render.options.wireframes` is disabled.
This may be also set to `'transparent'` or equivalent.

Default: `'#14151f'`

[`src/render/Render.js:1673`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.background%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.background%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.enabled`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.enabled)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable rendering entirely.

Default: `false`

[`src/render/Render.js:1756`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.enabled%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.enabled%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.hasBounds`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.hasBounds)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that specifies if `render.bounds` should be used when rendering.

Default: `false`

[`src/render/Render.js:1700`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.hasBounds%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.hasBounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.height`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.height)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The target height in pixels of the `render.canvas` to be created.
See also the `options.pixelRatio` property to change render quality.

Default: `600`

[`src/render/Render.js:1656`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.height%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.height%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.pixelRatio`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.pixelRatio)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The [pixel ratio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) to use when rendering.

Default: `1`

[`src/render/Render.js:1665`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.pixelRatio%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.pixelRatio%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showAngleIndicator`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showAngleIndicator)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body angle debug overlay.

Default: `false`

[`src/render/Render.js:1845`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showAngleIndicator%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showAngleIndicator%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showAxes`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showAxes)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body axes debug overlay.

Default: `false`

[`src/render/Render.js:1829`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showAxes%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showAxes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showBounds`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showBounds)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body bounds debug overlay.

Default: `false`

[`src/render/Render.js:1797`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showBounds%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showBounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showBroadphase`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showBroadphase)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

deprecated

Deprecated: no longer implemented

A flag to enable or disable the collision broadphase debug overlay.

Default: `false`

[`src/render/Render.js:1788`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showBroadphase%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showBroadphase%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showCollisions`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showCollisions)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body collisions debug overlay.

Default: `false`

[`src/render/Render.js:1813`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showCollisions%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showCollisions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showConvexHulls`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showConvexHulls)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body convex hulls debug overlay.

Default: `false`

[`src/render/Render.js:1869`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showConvexHulls%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showConvexHulls%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showDebug`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showDebug)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable all debug information overlays together.

This includes and has priority over the values of:

- `render.options.showStats`
- `render.options.showPerformance`

Default: `false`

[`src/render/Render.js:1708`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showDebug%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showDebug%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showDebug`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showDebug)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the debug information overlay.

Default: `false`

[`src/render/Render.js:1780`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showDebug%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showDebug%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showIds`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showIds)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body and part ids debug overlay.

Default: `false`

[`src/render/Render.js:1853`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showIds%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showIds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showInternalEdges`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showInternalEdges)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body internal edges debug overlay.

Default: `false`

[`src/render/Render.js:1877`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showInternalEdges%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showInternalEdges%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showMousePosition`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showMousePosition)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the mouse position debug overlay.

Default: `false`

[`src/render/Render.js:1885`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showMousePosition%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showMousePosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showPerformance`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showPerformance)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable performance charts.

From left to right, the values shown are:

- average render frequency (e.g. 60 fps)
- exact engine delta time used for last update (e.g. 16.66ms)
- average updates per frame (e.g. 1)
- average engine execution duration (e.g. 5.00ms)
- average render execution duration (e.g. 0.40ms)
- average effective play speed (e.g. '1.00x' is 'real-time')

Each value is recorded over a fixed sample of past frames (60 frames).

A chart shown below each value indicates the variance from the average over the sample.
The more stable or fixed the value is the flatter the chart will appear.

Default: `false`

[`src/render/Render.js:1735`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showPerformance%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showPerformance%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showPositions`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showPositions)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body positions debug overlay.

Default: `false`

[`src/render/Render.js:1837`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showPositions%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showPositions%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showSeparations`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showSeparations)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the collision resolver separations debug overlay.

Default: `false`

[`src/render/Render.js:1821`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showSeparations%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showSeparations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showSleeping`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showSleeping)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable sleeping bodies indicators.

Default: `true`

[`src/render/Render.js:1772`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showSleeping%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showSleeping%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showStats`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showStats)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the engine stats info overlay.

From left to right, the values shown are:

- body parts total
- body total
- constraints total
- composites total
- collision pairs total

Default: `false`

[`src/render/Render.js:1720`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showStats%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showStats%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showVelocity`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showVelocity)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body velocity debug overlay.

Default: `false`

[`src/render/Render.js:1805`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showVelocity%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.showVertexNumbers`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.showVertexNumbers)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to enable or disable the body vertex numbers debug overlay.

Default: `false`

[`src/render/Render.js:1861`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.showVertexNumbers%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.showVertexNumbers%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.width`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.width)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The target width in pixels of the `render.canvas` to be created.
See also the `options.pixelRatio` property to change render quality.

Default: `800`

[`src/render/Render.js:1647`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.width%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.width%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.wireframeBackground`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.wireframeBackground)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A CSS color string to use for background when `render.options.wireframes` is enabled.
This may be also set to `'transparent'` or equivalent.

Default: `'#14151f'`

[`src/render/Render.js:1682`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.wireframeBackground%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.wireframeBackground%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.wireframes`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.wireframes)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag to toggle wireframe rendering otherwise solid fill rendering is used.

Default: `true`

[`src/render/Render.js:1764`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.wireframes%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.wireframes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`options.wireframeStrokeStyle`](https://brm.io/matter-js/docs/classes/Render.html\#property_options.wireframeStrokeStyle)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A CSS color string to use for stroke when `render.options.wireframes` is enabled.
This may be also set to `'transparent'` or equivalent.

Default: `'#bbb'`

[`src/render/Render.js:1691`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22options.wireframeStrokeStyle%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22options.wireframeStrokeStyle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Render. [`textures`](https://brm.io/matter-js/docs/classes/Render.html\#property_textures)

The sprite texture cache.

[`src/render/Render.js:1625`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22textures%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22textures%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.Render.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(Render, " [`afterRender`](https://brm.io/matter-js/docs/classes/Render.html\#event_afterRender)", callback)

Fired after rendering

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/render/Render.js:1561`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterRender%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterRender%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Render, " [`beforeRender`](https://brm.io/matter-js/docs/classes/Render.html\#event_beforeRender)", callback)

Fired before rendering

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/render/Render.js:1551`](https://github.com/liabru/matter-js/tree/master/src/render/Render.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeRender%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeRender%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")