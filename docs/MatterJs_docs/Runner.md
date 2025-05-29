---
url: "https://brm.io/matter-js/docs/classes/Runner.html"
title: "Matter.Runner Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Runner.js:1`](https://brm.io/matter-js/docs/files/src_core_Runner.js.html#l1)

The `Matter.Runner` module is an optional utility that provides a game loop for running a `Matter.Engine` inside a browser environment.
A runner will continuously update a `Matter.Engine` whilst synchronising engine updates with the browser frame rate.
This runner favours a smoother user experience over perfect time keeping.
This runner is optional and is used for development and debugging but could be useful as a starting point for implementing some games and experiences.
Alternatively see `Engine.update` to step the engine directly inside your own game loop implementation as may be needed inside other environments.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Runner. [\_cancelNextFrame](https://brm.io/matter-js/docs/classes/Runner.html\#method__cancelNextFrame)

(runner)

private

Cancels the last callback scheduled by `Runner._onNextFrame` on this `runner`.

#### Parameters

- `runner` [Runner](https://brm.io/matter-js/docs/classes/Runner.html)


[`src/core/Runner.js:240`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L240 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner._cancelNextFrame%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner._cancelNextFrame%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [\_mean](https://brm.io/matter-js/docs/classes/Runner.html\#method__mean)

(values)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)private

Returns the mean of the given numbers.

#### Parameters

- `values` [Number\[\]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

the mean of given values.

[`src/core/Runner.js:254`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L254 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner._mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner._mean%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [\_onNextFrame](https://brm.io/matter-js/docs/classes/Runner.html\#method__onNextFrame)

(runner, callback)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)private

Schedules the `callback` on this `runner` for the next animation frame.

#### Parameters

- `runner` [Runner](https://brm.io/matter-js/docs/classes/Runner.html)

- `callback` [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

frameRequestId

[`src/core/Runner.js:222`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L222 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner._onNextFrame%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner._onNextFrame%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [create](https://brm.io/matter-js/docs/classes/Runner.html\#method_create)

(options)

Creates a new Runner.
See the properties section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


[`src/core/Runner.js:30`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L30 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [run](https://brm.io/matter-js/docs/classes/Runner.html\#method_run)

(runner, \[engine\])

→ [Runner](https://brm.io/matter-js/docs/classes/Runner.html)

Runs a `Matter.Engine` whilst synchronising engine updates with the browser frame rate.
See module and properties descriptions for more information on this runner.
Alternatively see `Engine.update` to step the engine directly inside your own game loop implementation.

#### Parameters

- `runner` [Runner](https://brm.io/matter-js/docs/classes/Runner.html)

- `[engine]` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)optional


#### Returns

[Runner](https://brm.io/matter-js/docs/classes/Runner.html)

runner

[`src/core/Runner.js:61`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L61 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner.run%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [stop](https://brm.io/matter-js/docs/classes/Runner.html\#method_stop)

(runner)

Ends execution of `Runner.run` on the given `runner` by canceling the frame loop.
Alternatively to temporarily pause the runner, see `runner.enabled`.

#### Parameters

- `runner` [Runner](https://brm.io/matter-js/docs/classes/Runner.html)


[`src/core/Runner.js:212`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L212 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner.stop%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner.stop%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Runner. [tick](https://brm.io/matter-js/docs/classes/Runner.html\#method_tick)

(runner, engine, time)

Performs a single runner tick as used inside `Runner.run`.
See module and properties descriptions for more information on this runner.
Alternatively see `Engine.update` to step the engine directly inside your own game loop implementation.

#### Parameters

- `runner` [Runner](https://brm.io/matter-js/docs/classes/Runner.html)

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

- `time` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/core/Runner.js:85`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L85 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Runner.tick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Runner.tick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Runner.create` and may be passed to it as `options`.

### Runner. [`delta`](https://brm.io/matter-js/docs/classes/Runner.html\#property_delta)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The fixed timestep size used for `Engine.update` calls in milliseconds, known as `delta`.

This value is recommended to be `1000 / 60` ms or smaller (i.e. equivalent to at least 60hz).

Smaller `delta` values provide higher quality results at the cost of performance.

You should usually avoid changing `delta` during running, otherwise quality may be affected.

For smoother frame pacing choose a `delta` that is an even multiple of each display FPS you target, i.e. `1000 / (n * fps)` as this helps distribute an equal number of updates over each display frame.

For example with a 60 Hz `delta` i.e. `1000 / 60` the runner will on average perform one update per frame on displays running 60 FPS and one update every two frames on displays running 120 FPS, etc.

Where as e.g. using a 240 Hz `delta` i.e. `1000 / 240` the runner will on average perform four updates per frame on displays running 60 FPS and two updates per frame on displays running 120 FPS, etc.

Therefore `Runner.run` will call multiple engine updates (or none) as needed to simulate the time elapsed between browser frames.

In practice the number of updates in any particular frame may be restricted to respect the runner's performance budgets. These are specified by `runner.maxFrameTime` and `runner.maxUpdates`, see those properties for details.

Default: `1000 / 60`

[`src/core/Runner.js:336`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22delta%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22delta%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`enabled`](https://brm.io/matter-js/docs/classes/Runner.html\#property_enabled)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that can be toggled to enable or disable tick calls on this runner, therefore pausing engine updates and events while the runner loop remains running.

Default: `true`

[`src/core/Runner.js:360`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22enabled%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22enabled%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`frameDelta`](https://brm.io/matter-js/docs/classes/Runner.html\#property_frameDelta)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The measured time elapsed between the last two browser frames measured in milliseconds.
This is useful e.g. to estimate the current browser FPS using `1000 / runner.frameDelta`.

[`src/core/Runner.js:378`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frameDelta%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frameDelta%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`frameDeltaSmoothing`](https://brm.io/matter-js/docs/classes/Runner.html\#property_frameDeltaSmoothing)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Enables averaging to smooth frame rate measurements and therefore stabilise play rate.

Default: `true`

[`src/core/Runner.js:387`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frameDeltaSmoothing%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frameDeltaSmoothing%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`frameDeltaSnapping`](https://brm.io/matter-js/docs/classes/Runner.html\#property_frameDeltaSnapping)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Rounds measured browser frame delta to the nearest 1 Hz.
This option can help smooth frame rate measurements and simplify handling hardware timing differences e.g. 59.94Hz and 60Hz displays.
For best results you should also round your `runner.delta` equivalent to the nearest 1 Hz.

Default: `true`

[`src/core/Runner.js:395`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frameDeltaSnapping%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frameDeltaSnapping%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`frameRequestId`](https://brm.io/matter-js/docs/classes/Runner.html\#property_frameRequestId)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

private

The id of the last call to `Runner._onNextFrame`.

Default: `null`

[`src/core/Runner.js:444`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frameRequestId%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frameRequestId%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`maxFrameTime`](https://brm.io/matter-js/docs/classes/Runner.html\#property_maxFrameTime)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A performance budget that limits execution time allowed for this runner per browser frame in milliseconds.

To calculate the effective browser FPS at which this throttle is applied use `1000 / runner.maxFrameTime`.

This performance budget is intended to help maintain browser interactivity and help improve framerate recovery during temporary high CPU usage.

This budget only covers the measured time elapsed executing the functions called in the scope of the runner tick, including `Engine.update` and its related user event callbacks.

You may also reduce this budget to allow for any significant additional processing you perform on the same thread outside the scope of this runner tick, e.g. rendering time.

See also `runner.maxUpdates`.

Default: `1000 / 30`

[`src/core/Runner.js:405`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22maxFrameTime%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22maxFrameTime%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`maxUpdates`](https://brm.io/matter-js/docs/classes/Runner.html\#property_maxUpdates)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An optional limit for maximum engine update count allowed per frame tick in addition to `runner.maxFrameTime`.

Unless you set a value it is automatically chosen based on `runner.delta` and `runner.maxFrameTime`.

See also `runner.maxFrameTime`.

Default: `null`

[`src/core/Runner.js:423`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22maxUpdates%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22maxUpdates%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`timeBuffer`](https://brm.io/matter-js/docs/classes/Runner.html\#property_timeBuffer)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

private

The accumulated time elapsed that has yet to be simulated in milliseconds.
This value is clamped within certain limits (see `Runner.tick` code).

Default: `0`

[`src/core/Runner.js:368`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timeBuffer%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timeBuffer%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Runner. [`timeLastTick`](https://brm.io/matter-js/docs/classes/Runner.html\#property_timeLastTick)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

private

The timestamp of the last call to `Runner.tick` used to measure `frameDelta`.

Default: `0`

[`src/core/Runner.js:435`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timeLastTick%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timeLastTick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.Runner.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(Runner, " [`afterTick`](https://brm.io/matter-js/docs/classes/Runner.html\#event_afterTick)", callback)

Fired once at the end of the browser frame, after `beforeTick`, `tick` and after any engine updates.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/core/Runner.js:298`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterTick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterTick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Runner, " [`afterUpdate`](https://brm.io/matter-js/docs/classes/Runner.html\#event_afterUpdate)", callback)

Fired after each and every engine update in this browser frame (if any).
There may be multiple engine update calls per browser frame (or none) depending on framerate and timestep delta.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/core/Runner.js:319`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22afterUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22afterUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Runner, " [`beforeTick`](https://brm.io/matter-js/docs/classes/Runner.html\#event_beforeTick)", callback)

Fired once at the start of the browser frame, before any engine updates.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/core/Runner.js:278`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeTick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeTick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Runner, " [`beforeUpdate`](https://brm.io/matter-js/docs/classes/Runner.html\#event_beforeUpdate)", callback)

Fired before each and every engine update in this browser frame (if any).
There may be multiple engine update calls per browser frame (or none) depending on framerate and timestep delta.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/core/Runner.js:308`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22beforeUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22beforeUpdate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Runner, " [`tick`](https://brm.io/matter-js/docs/classes/Runner.html\#event_tick)", callback)

Fired once at the start of the browser frame, after `beforeTick`.

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `timestamp` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


    The engine.timing.timestamp of the event

  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/core/Runner.js:288`](https://github.com/liabru/matter-js/tree/master/src/core/Runner.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22tick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22tick%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")