---
url: "https://brm.io/matter-js/docs/classes/Engine.html"
title: "Matter.Engine Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Engine.js:1`](https://brm.io/matter-js/docs/files/src_core_Engine.js.html#l1)

The `Matter.Engine` module contains methods for creating and manipulating engines.
An engine is a controller that manages updating the simulation of the world.
See `Matter.Runner` for an optional game loop utility.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Engine. [\_bodiesApplyGravity](https://brm.io/matter-js/docs/classes/Engine.html\#method__bodiesApplyGravity)

(bodies, gravity)

private

Applies gravitational acceleration to all `bodies`.
This models a [uniform gravitational field](https://en.wikipedia.org/wiki/Gravity_of_Earth), similar to near the surface of a planet.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `gravity` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/core/Engine.js:276`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L276 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine._bodiesApplyGravity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine._bodiesApplyGravity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [\_bodiesClearForces](https://brm.io/matter-js/docs/classes/Engine.html\#method__bodiesClearForces)

(bodies)

private

Zeroes the `body.force` and `body.torque` force buffers.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


[`src/core/Engine.js:257`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L257 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine._bodiesClearForces%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine._bodiesClearForces%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [\_bodiesUpdate](https://brm.io/matter-js/docs/classes/Engine.html\#method__bodiesUpdate)

(bodies, delta)

private

Applies `Body.update` to all given `bodies`.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


The amount of time elapsed between updates


[`src/core/Engine.js:305`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L305 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine._bodiesUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine._bodiesUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [\_bodiesUpdateVelocities](https://brm.io/matter-js/docs/classes/Engine.html\#method__bodiesUpdateVelocities)

(bodies)

private

Applies `Body.updateVelocities` to all given `bodies`.

#### Parameters

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)


[`src/core/Engine.js:325`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L325 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine._bodiesUpdateVelocities%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine._bodiesUpdateVelocities%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [clear](https://brm.io/matter-js/docs/classes/Engine.html\#method_clear)

(engine)

Clears the engine pairs and detector.

#### Parameters

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


[`src/core/Engine.js:247`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L247 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [create](https://brm.io/matter-js/docs/classes/Engine.html\#method_create)

(\[options\])

→ [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
All properties have default values, and many are pre-calculated automatically based on other properties.
See the properties section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


#### Returns

[Engine](https://brm.io/matter-js/docs/classes/Engine.html)

engine

[`src/core/Engine.js:29`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L29 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [merge](https://brm.io/matter-js/docs/classes/Engine.html\#method_merge)

(engineA, engineB)

Merges two engines by keeping the configuration of `engineA` but replacing the world with the one from `engineB`.

#### Parameters

- `engineA` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

- `engineB` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


[`src/core/Engine.js:223`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L223 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine.merge%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine.merge%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [run](https://brm.io/matter-js/docs/classes/Engine.html\#method_run)

(engine)

deprecated

Deprecated: use Matter.Runner.run(engine) instead

A deprecated alias for `Runner.run`, use `Matter.Runner.run(engine)` instead and see `Matter.Runner` for more information.

#### Parameters

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


[`src/core/Engine.js:339`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L339 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Engine. [update](https://brm.io/matter-js/docs/classes/Engine.html\#method_update)

(engine, \[delta=16.666\])

Moves the simulation forward in time by `delta` milliseconds.
Triggers `beforeUpdate`, `beforeSolve` and `afterUpdate` events.
Triggers `collisionStart`, `collisionActive` and `collisionEnd` events.

#### Parameters

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

- `[delta=16.666]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


[`src/core/Engine.js:77`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L77 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Engine.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Engine.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Engine.create` and may be passed to it as `options`.

### Engine. [`broadphase`](https://brm.io/matter-js/docs/classes/Engine.html\#property_broadphase)

[Grid](https://brm.io/matter-js/docs/classes/Grid.html)

deprecated

Deprecated: replaced by \`engine.detector\`

Replaced by and now alias for `engine.grid`.

Default: `a Matter.Grid instance`

[`src/core/Engine.js:521`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22broadphase%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22broadphase%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`constraintIterations`](https://brm.io/matter-js/docs/classes/Engine.html\#property_constraintIterations)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer `Number` that specifies the number of constraint iterations to perform each update.
The higher the value, the higher quality the simulation will be at the expense of performance.
The default value of `2` is usually very adequate.

Default: `2`

[`src/core/Engine.js:439`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22constraintIterations%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22constraintIterations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`detector`](https://brm.io/matter-js/docs/classes/Engine.html\#property_detector)

[Detector](https://brm.io/matter-js/docs/classes/Detector.html)

A `Matter.Detector` instance.

Default: `a Matter.Detector instance`

[`src/core/Engine.js:504`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22detector%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22detector%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`enableSleeping`](https://brm.io/matter-js/docs/classes/Engine.html\#property_enableSleeping)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that specifies whether the engine should allow sleeping via the `Matter.Sleeping` module.
Sleeping can improve stability and performance, but often at the expense of accuracy.

Default: `false`

[`src/core/Engine.js:449`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22enableSleeping%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22enableSleeping%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`gravity`](https://brm.io/matter-js/docs/classes/Engine.html\#property_gravity)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An optional gravitational acceleration applied to all bodies in `engine.world` on every update.

This models a [uniform gravitational field](https://en.wikipedia.org/wiki/Gravity_of_Earth), similar to near the surface of a planet. For gravity in other contexts, disable this and apply forces as needed.

To disable set the `scale` component to `0`.

This is split into three components for ease of use:

a normalised direction ( `x` and `y`) and magnitude ( `scale`).

[`src/core/Engine.js:545`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22gravity%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22gravity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`gravity.scale`](https://brm.io/matter-js/docs/classes/Engine.html\#property_gravity.scale)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The magnitude of the gravitational acceleration.

Default: `0.001`

[`src/core/Engine.js:575`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22gravity.scale%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22gravity.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`gravity.x`](https://brm.io/matter-js/docs/classes/Engine.html\#property_gravity.x)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The gravitational direction normal `x` component, to be multiplied by `gravity.scale`.

Default: `0`

[`src/core/Engine.js:559`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22gravity.x%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22gravity.x%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`gravity.y`](https://brm.io/matter-js/docs/classes/Engine.html\#property_gravity.y)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The gravitational direction normal `y` component, to be multiplied by `gravity.scale`.

Default: `1`

[`src/core/Engine.js:567`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22gravity.y%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22gravity.y%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`grid`](https://brm.io/matter-js/docs/classes/Engine.html\#property_grid)

[Grid](https://brm.io/matter-js/docs/classes/Grid.html)

deprecated

Deprecated: replaced by \`engine.detector\`

A `Matter.Grid` instance.

Default: `a Matter.Grid instance`

[`src/core/Engine.js:512`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22grid%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22grid%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`plugin`](https://brm.io/matter-js/docs/classes/Engine.html\#property_plugin)

An object reserved for storing plugin-specific properties.

[`src/core/Engine.js:538`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`positionIterations`](https://brm.io/matter-js/docs/classes/Engine.html\#property_positionIterations)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer `Number` that specifies the number of position iterations to perform each update.
The higher the value, the higher quality the simulation will be at the expense of performance.

Default: `6`

[`src/core/Engine.js:421`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22positionIterations%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22positionIterations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`timing`](https://brm.io/matter-js/docs/classes/Engine.html\#property_timing)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An `Object` containing properties regarding the timing systems of the engine.

[`src/core/Engine.js:458`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timing%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timing%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`timing.lastDelta`](https://brm.io/matter-js/docs/classes/Engine.html\#property_timing.lastDelta)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that represents the `delta` value used in the last engine update.

Default: `0`

[`src/core/Engine.js:496`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timing.lastDelta%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timing.lastDelta%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`timing.lastElapsed`](https://brm.io/matter-js/docs/classes/Engine.html\#property_timing.lastElapsed)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that represents the total execution time elapsed during the last `Engine.update` in milliseconds.
It is updated by timing from the start of the last `Engine.update` call until it ends.

This value will also include the total execution time of all event handlers directly or indirectly triggered by the engine update.

Default: `0`

[`src/core/Engine.js:485`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timing.lastElapsed%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timing.lastElapsed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`timing.timeScale`](https://brm.io/matter-js/docs/classes/Engine.html\#property_timing.timeScale)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that specifies the global scaling factor of time for all bodies.
A value of `0` freezes the simulation.
A value of `0.1` gives a slow-motion effect.
A value of `1.2` gives a speed-up effect.

Default: `1`

[`src/core/Engine.js:465`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timing.timeScale%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timing.timeScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`timing.timestamp`](https://brm.io/matter-js/docs/classes/Engine.html\#property_timing.timestamp)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that specifies the current simulation-time in milliseconds starting from `0`.
It is incremented on every `Engine.update` by the given `delta` argument.

Default: `0`

[`src/core/Engine.js:476`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timing.timestamp%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timing.timestamp%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`velocityIterations`](https://brm.io/matter-js/docs/classes/Engine.html\#property_velocityIterations)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer `Number` that specifies the number of velocity iterations to perform each update.
The higher the value, the higher quality the simulation will be at the expense of performance.

Default: `4`

[`src/core/Engine.js:430`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22velocityIterations%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22velocityIterations%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Engine. [`world`](https://brm.io/matter-js/docs/classes/Engine.html\#property_world)

[Composite](https://brm.io/matter-js/docs/classes/Composite.html)

The root `Matter.Composite` instance that will contain all bodies, constraints and other composites to be simulated by this engine.

Default: `a Matter.Composite instance`

[`src/core/Engine.js:530`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22world%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22world%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.Engine.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(Engine, " [`afterUpdate`](https://brm.io/matter-js/docs/classes/Engine.html\#event_afterUpdate)", callback)

Fired after engine update and all collision events

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:368`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Engine, " [`beforeSolve`](https://brm.io/matter-js/docs/classes/Engine.html\#event_beforeSolve)", callback)

Fired after bodies updated based on their velocity and forces, but before any collision detection, constraints and resolving etc.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:357`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeSolve%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeSolve%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Engine, " [`beforeUpdate`](https://brm.io/matter-js/docs/classes/Engine.html\#event_beforeUpdate)", callback)

Fired just before an update

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:346`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Engine, " [`collisionActive`](https://brm.io/matter-js/docs/classes/Engine.html\#event_collisionActive)", callback)

Fired after engine update, provides a list of all pairs that are colliding in the current tick (if any)

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


    List of affected pairs

  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:391`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionActive%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionActive%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Engine, " [`collisionEnd`](https://brm.io/matter-js/docs/classes/Engine.html\#event_collisionEnd)", callback)

Fired after engine update, provides a list of all pairs that have ended collision in the current tick (if any)

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


    List of affected pairs

  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:403`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionEnd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionEnd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Engine, " [`collisionStart`](https://brm.io/matter-js/docs/classes/Engine.html\#event_collisionStart)", callback)

Fired after engine update, provides a list of all pairs that have started to collide in the current tick (if any)

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `pairs` [Pair\[\]](https://brm.io/matter-js/docs/classes/Pair.html)


    List of affected pairs

  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `delta` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The delta time in milliseconds value used in the update

  - `source` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)


    The source object of the event

  - `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


    The name of the event

[`src/core/Engine.js:379`](https://github.com/liabru/matter-js/tree/master/src/core/Engine.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionStart%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionStart%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")