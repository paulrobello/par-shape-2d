---
url: "https://brm.io/matter-js/docs/classes/Body.html"
title: "Matter.Body Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/body/Body.js:1`](https://brm.io/matter-js/docs/files/src_body_Body.js.html#l1)

The `Matter.Body` module contains methods for creating and manipulating rigid bodies.
For creating bodies with common configurations such as rectangles, circles and other polygons see the module `Matter.Bodies`.

See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).

## Methods

### Matter.Body. [\_initProperties](https://brm.io/matter-js/docs/classes/Body.html\#method__initProperties)

(body, \[options\])

private

Initialises body properties.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `[options]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


[`src/body/Body.js:136`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L136 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body._initProperties%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body._initProperties%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [\_totalProperties](https://brm.io/matter-js/docs/classes/Body.html\#method__totalProperties)

(body)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)private

Returns the sums of the properties of all compound parts of the parent body.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[`src/body/Body.js:839`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L839 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body._totalProperties%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body._totalProperties%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [applyForce](https://brm.io/matter-js/docs/classes/Body.html\#method_applyForce)

(body, position, force)

Applies the `force` to the `body` from the force origin `position` in world-space, over a single timestep, including applying any resulting angular torque.

Forces are useful for effects like gravity, wind or rocket thrust, but can be difficult in practice when precise control is needed. In these cases see `Body.setVelocity` and `Body.setPosition` as an alternative.

The force from this function is only applied once for the duration of a single timestep, in other words the duration depends directly on the current engine update `delta` and the rate of calls to this function.

Therefore to account for time, you should apply the force constantly over as many engine updates as equivalent to the intended duration.

If all or part of the force duration is some fraction of a timestep, first multiply the force by `duration / timestep`.

The force origin `position` in world-space must also be specified. Passing `body.position` will result in zero angular effect as the force origin would be at the centre of mass.

The `body` will take time to accelerate under a force, the resulting effect depends on duration of the force, the body mass and other forces on the body including friction combined.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `position` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


The force origin in world-space. Pass `body.position` to avoid angular torque.

- `force` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/body/Body.js:813`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L813 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.applyForce%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.applyForce%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [create](https://brm.io/matter-js/docs/classes/Body.html\#method_create)

(options)

→ [Body](https://brm.io/matter-js/docs/classes/Body.html)

Creates a new rigid body model. The options parameter is an object that specifies any properties you wish to override the defaults.
All properties have default values, and many are pre-calculated automatically based on other properties.
Vertices must be specified in clockwise order.
See the properties section below for detailed information on what you can pass via the `options` object.

#### Parameters

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Body](https://brm.io/matter-js/docs/classes/Body.html)

body

[`src/body/Body.js:30`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L30 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [getAngularSpeed](https://brm.io/matter-js/docs/classes/Body.html\#method_getAngularSpeed)

(body)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Gets the current rotational speed of the body.

Equivalent to the magnitude of its angular velocity.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

angular speed

[`src/body/Body.js:615`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L615 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.getAngularSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.getAngularSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [getAngularVelocity](https://brm.io/matter-js/docs/classes/Body.html\#method_getAngularVelocity)

(body)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Gets the current rotational velocity of the body.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

angular velocity

[`src/body/Body.js:605`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L605 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.getAngularVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.getAngularVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [getSpeed](https://brm.io/matter-js/docs/classes/Body.html\#method_getSpeed)

(body)

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Gets the current linear speed of the body.

Equivalent to the magnitude of its velocity.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

speed

[`src/body/Body.js:569`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L569 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.getSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.getSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [getVelocity](https://brm.io/matter-js/docs/classes/Body.html\#method_getVelocity)

(body)

→ [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

Gets the current linear velocity of the body.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


#### Returns

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

velocity

[`src/body/Body.js:554`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L554 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.getVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.getVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [nextCategory](https://brm.io/matter-js/docs/classes/Body.html\#method_nextCategory)

()

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the next unique category bitfield (starting after the initial default category `0x0001`).
There are 32 available. See `body.collisionFilter` for more information.

#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Unique category bitfield

[`src/body/Body.js:125`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L125 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.nextCategory%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.nextCategory%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [nextGroup](https://brm.io/matter-js/docs/classes/Body.html\#method_nextGroup)

(\[isNonColliding=false\])

→ [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Returns the next unique group index for which bodies will collide.
If `isNonColliding` is `true`, returns the next unique group index for which bodies will _not_ collide.
See `body.collisionFilter` for more information.

#### Parameters

- `[isNonColliding=false]` Booloptional


#### Returns

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Unique group index

[`src/body/Body.js:110`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L110 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.nextGroup%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.nextGroup%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [rotate](https://brm.io/matter-js/docs/classes/Body.html\#method_rotate)

(body, rotation, \[point\], \[updateVelocity=false\])

Rotates a body by a given angle relative to its current angle. By default angular velocity is unchanged.
If `updateVelocity` is `true` then angular velocity is inferred from the change in angle.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `rotation` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[point]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional

- `[updateVelocity=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Body.js:649`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L649 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.rotate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [scale](https://brm.io/matter-js/docs/classes/Body.html\#method_scale)

(body, scaleX, scaleY, \[point\])

Scales the body, including updating physical properties (mass, area, axes, inertia), from a world-space point (default is body centre).

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `scaleX` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `scaleY` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[point]` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)optional


[`src/body/Body.js:676`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L676 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.scale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [set](https://brm.io/matter-js/docs/classes/Body.html\#method_set)

(body, settings, value)

Given a property and a value (or map of), sets the property(s) on the body, using the appropriate setter functions if they exist.
Prefer to use the actual setter functions in performance critical situations.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `settings` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


A property name (or map of properties and values) to set on the body.

- `value` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The value to set if `settings` is a single property name.


[`src/body/Body.js:181`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L181 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.set%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setAngle](https://brm.io/matter-js/docs/classes/Body.html\#method_setAngle)

(body, angle, \[updateVelocity=false\])

Sets the angle of the body. By default angular velocity is unchanged.
If `updateVelocity` is `true` then angular velocity is inferred from the change in angle.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `angle` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

- `[updateVelocity=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Body.js:507`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L507 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setAngle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setAngle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setAngularSpeed](https://brm.io/matter-js/docs/classes/Body.html\#method_setAngularSpeed)

(body, speed)

Sets the current rotational speed of the body.

Direction is maintained. Affects body angular velocity.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `speed` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:626`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L626 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setAngularSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setAngularSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setAngularVelocity](https://brm.io/matter-js/docs/classes/Body.html\#method_setAngularVelocity)

(body, velocity)

Sets the current rotational velocity of the body.

Affects body angular speed.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `velocity` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:591`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L591 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setAngularVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setAngularVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setCentre](https://brm.io/matter-js/docs/classes/Body.html\#method_setCentre)

(body, centre, relative)

Set the centre of mass of the body.
The `centre` is a vector in world-space unless `relative` is set, in which case it is a translation.
The centre of mass is the point the body rotates about and can be used to simulate non-uniform density.
This is equal to moving `body.position` but not the `body.vertices`.
Invalid if the `centre` falls outside the body's convex hull.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `centre` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `relative` Bool


[`src/body/Body.js:451`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L451 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setCentre%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setCentre%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setDensity](https://brm.io/matter-js/docs/classes/Body.html\#method_setDensity)

(body, density)

Sets the density of the body. Mass and inertia are automatically updated to reflect the change.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `density` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:321`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L321 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setDensity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setDensity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setInertia](https://brm.io/matter-js/docs/classes/Body.html\#method_setInertia)

(body, inertia)

Sets the moment of inertia of the body. This is the second moment of area in two dimensions.
Inverse inertia is automatically updated to reflect the change. Mass is not changed.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `inertia` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:332`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L332 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setInertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setInertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setMass](https://brm.io/matter-js/docs/classes/Body.html\#method_setMass)

(body, mass)

Sets the mass of the body. Inverse mass, density and inertia are automatically updated to reflect the change.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `mass` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:305`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L305 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setMass%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setMass%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setParts](https://brm.io/matter-js/docs/classes/Body.html\#method_setParts)

(body, parts, \[autoHull=true\])

Sets the parts of the `body`.

See `body.parts` for details and requirements on how parts are used.

See Bodies.fromVertices for a related utility.

This function updates `body` mass, inertia and centroid based on the parts geometry.

Sets each `part.parent` to be this `body`.

The convex hull is computed and set on this `body` (unless `autoHull` is `false`).

Automatically ensures that the first part in `body.parts` is the `body`.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `parts` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `[autoHull=true]` Booloptional


[`src/body/Body.js:381`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L381 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setParts%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setParts%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setPosition](https://brm.io/matter-js/docs/classes/Body.html\#method_setPosition)

(body, position, \[updateVelocity=false\])

Sets the position of the body. By default velocity is unchanged.
If `updateVelocity` is `true` then velocity is inferred from the change in position.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `position` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[updateVelocity=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Body.js:476`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L476 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setPosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setPosition%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setSpeed](https://brm.io/matter-js/docs/classes/Body.html\#method_setSpeed)

(body, speed)

Sets the current linear speed of the body.

Direction is maintained. Affects body velocity.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `speed` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)


[`src/body/Body.js:580`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L580 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setStatic](https://brm.io/matter-js/docs/classes/Body.html\#method_setStatic)

(body, isStatic)

Sets the body as static, including isStatic flag and setting mass and inertia to Infinity.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `isStatic` Bool


[`src/body/Body.js:254`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L254 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setStatic%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setStatic%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setVelocity](https://brm.io/matter-js/docs/classes/Body.html\#method_setVelocity)

(body, velocity)

Sets the current linear velocity of the body.

Affects body speed.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `velocity` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/body/Body.js:538`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L538 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [setVertices](https://brm.io/matter-js/docs/classes/Body.html\#method_setVertices)

(body, vertices)

Sets the body's vertices and updates body properties accordingly, including inertia, area and mass (with respect to `body.density`).
Vertices will be automatically transformed to be orientated around their centre of mass as the origin.
They are then automatically translated to world space based on `body.position`.

The `vertices` argument should be passed as an array of `Matter.Vector` points (or a `Matter.Vertices` array).
Vertices must form a convex hull. Concave vertices must be decomposed into convex parts.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `vertices` [Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)


[`src/body/Body.js:344`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L344 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.setVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.setVertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [translate](https://brm.io/matter-js/docs/classes/Body.html\#method_translate)

(body, translation, \[updateVelocity=false\])

Moves a body by a given vector relative to its current position. By default velocity is unchanged.
If `updateVelocity` is `true` then velocity is inferred from the change in position.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `translation` [Vector](https://brm.io/matter-js/docs/classes/Vector.html)

- `[updateVelocity=false]` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)optional


[`src/body/Body.js:637`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L637 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.translate%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [update](https://brm.io/matter-js/docs/classes/Body.html\#method_update)

(body, \[deltaTime=16.666\])

Performs an update by integrating the equations of motion on the `body`.
This is applied every update by `Matter.Engine` automatically.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)

- `[deltaTime=16.666]` [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)optional


[`src/body/Body.js:740`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L740 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Body. [updateVelocities](https://brm.io/matter-js/docs/classes/Body.html\#method_updateVelocities)

(body)

Updates properties `body.velocity`, `body.speed`, `body.angularVelocity` and `body.angularSpeed` which are normalised in relation to `Body._baseDelta`.

#### Parameters

- `body` [Body](https://brm.io/matter-js/docs/classes/Body.html)


[`src/body/Body.js:796`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L796 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Body.updateVelocities%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Body.updateVelocities%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Body.create` and may be passed to it as `options`.

### Body. [`angle`](https://brm.io/matter-js/docs/classes/Body.html\#property_angle)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` specifying the angle of the body, in radians.

Default: `0`

[`src/body/Body.js:981`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22angle%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22angle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`angularSpeed`](https://brm.io/matter-js/docs/classes/Body.html\#property_angularSpeed)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setAngularSpeed` to set.

See `Body.getAngularSpeed` for details.

Default: `0`

[`src/body/Body.js:1068`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22angularSpeed%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22angularSpeed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`angularVelocity`](https://brm.io/matter-js/docs/classes/Body.html\#property_angularVelocity)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setAngularVelocity` to set.

See `Body.getAngularVelocity` for details.

Default: `0`

[`src/body/Body.js:1080`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22angularVelocity%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22angularVelocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`area`](https://brm.io/matter-js/docs/classes/Body.html\#property_area)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

_Read only_. Calculated automatically when vertices are set.

A `Number` that measures the area of the body's convex hull.

[`src/body/Body.js:1447`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22area%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22area%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`axes`](https://brm.io/matter-js/docs/classes/Body.html\#property_axes)

[Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

_Read only_. Calculated automatically when vertices are set.

An array of unique axis vectors (edge normals) used for collision detection.
These are automatically calculated when vertices are set.
They are constantly updated by `Body.update` during the simulation.

[`src/body/Body.js:1435`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22axes%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22axes%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`bounds`](https://brm.io/matter-js/docs/classes/Body.html\#property_bounds)

[Bounds](https://brm.io/matter-js/docs/classes/Bounds.html)

A `Bounds` object that defines the AABB region for the body.
It is automatically calculated when vertices are set and constantly updated by `Body.update` during simulation.

[`src/body/Body.js:1458`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bounds%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bounds%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`chamfer`](https://brm.io/matter-js/docs/classes/Body.html\#property_chamfer)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| Null \| Undefined

Temporarily may hold parameters to be passed to `Vertices.chamfer` where supported by external functions.

See `Vertices.chamfer` for possible parameters this object may hold.

Currently only functions inside `Matter.Bodies` provide a utility using this property as a vertices pre-processing option.

Alternatively consider using `Vertices.chamfer` directly on vertices before passing them to a body creation function.

[`src/body/Body.js:1466`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22chamfer%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22chamfer%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`collisionFilter`](https://brm.io/matter-js/docs/classes/Body.html\#property_collisionFilter)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An `Object` that specifies the collision filtering properties of this body.

Collisions between two bodies will obey the following rules:

- If the two bodies have the same non-zero value of `collisionFilter.group`,
they will always collide if the value is positive, and they will never collide
if the value is negative.
- If the two bodies have different values of `collisionFilter.group` or if one
(or both) of the bodies has a value of 0, then the category/mask rules apply as follows:

Each body belongs to a collision category, given by `collisionFilter.category`. This
value is used as a bit field and the category should have only one bit set, meaning that
the value of this property is a power of two in the range \[1, 2^31\]. Thus, there are 32
different collision categories available.

Each body also defines a collision bitmask, given by `collisionFilter.mask` which specifies
the categories it collides with (the value is the bitwise AND value of all these categories).

Using the category/mask rules, two bodies `A` and `B` collide if each includes the other's
category in its mask, i.e. `(categoryA & maskB) !== 0` and `(categoryB & maskA) !== 0`
are both true.

[`src/body/Body.js:1252`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionFilter%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionFilter%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`collisionFilter.category`](https://brm.io/matter-js/docs/classes/Body.html\#property_collisionFilter.category)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

A bit field that specifies the collision category this body belongs to.
The category value should have only one bit set, for example `0x0001`.
This means there are up to 32 unique collision categories available.
See `body.collisionFilter` for more information.

Default: `1`

[`src/body/Body.js:1287`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionFilter.category%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionFilter.category%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`collisionFilter.group`](https://brm.io/matter-js/docs/classes/Body.html\#property_collisionFilter.group)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An Integer `Number`, that specifies the collision group this body belongs to.
See `body.collisionFilter` for more information.

Default: `0`

[`src/body/Body.js:1278`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionFilter.group%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionFilter.group%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`collisionFilter.mask`](https://brm.io/matter-js/docs/classes/Body.html\#property_collisionFilter.mask)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

A bit mask that specifies the collision categories this body may collide with.
See `body.collisionFilter` for more information.

Default: `-1`

[`src/body/Body.js:1298`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22collisionFilter.mask%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22collisionFilter.mask%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`deltaTime`](https://brm.io/matter-js/docs/classes/Body.html\#property_deltaTime)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Updated during engine update.

A `Number` that records the last delta time value used to update this body.
Used to calculate speed and velocity.

Default: `1000 / 60`

[`src/body/Body.js:1327`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22deltaTime%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22deltaTime%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`density`](https://brm.io/matter-js/docs/classes/Body.html\#property_density)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setDensity` to set.

A `Number` that defines the density of the body (mass per unit area).

Mass will also be updated when set.

Default: `0.001`

[`src/body/Body.js:1143`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22density%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22density%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`force`](https://brm.io/matter-js/docs/classes/Body.html\#property_force)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

A `Vector` that accumulates the total force applied to the body for a single update.
Force is zeroed after every `Engine.update`, so constant forces should be applied for every update they are needed. See also `Body.applyForce`.

Default: `{ x: 0, y: 0 }`

[`src/body/Body.js:1022`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22force%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22force%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`friction`](https://brm.io/matter-js/docs/classes/Body.html\#property_friction)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the friction of the body. The value is always positive and is in the range `(0, 1)`.
A value of `0` means that the body may slide indefinitely.
A value of `1` means the body may come to a stop almost instantly after a force is applied.

The effects of the value may be non-linear.
High values may be unstable depending on the body.
The engine uses a Coulomb friction model including static and kinetic friction.
Note that collision response is based on _pairs_ of bodies, and that `friction` values are _combined_ with the following formula:

`Math.min(bodyA.friction, bodyB.friction)`

Default: `0.1`

[`src/body/Body.js:1213`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22friction%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22friction%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`frictionAir`](https://brm.io/matter-js/docs/classes/Body.html\#property_frictionAir)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the air friction of the body (air resistance).
A value of `0` means the body will never slow as it moves through space.
The higher the value, the faster a body slows when moving through space.
The effects of the value are non-linear.

Default: `0.01`

[`src/body/Body.js:1241`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frictionAir%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frictionAir%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`frictionStatic`](https://brm.io/matter-js/docs/classes/Body.html\#property_frictionStatic)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the static friction of the body (in the Coulomb friction model).
A value of `0` means the body will never 'stick' when it is nearly stationary and only dynamic `friction` is used.
The higher the value (e.g. `10`), the more force it will take to initially get the body moving when nearly stationary.
This value is multiplied with the `friction` property to make it easier to change `friction` and maintain an appropriate amount of static friction.

Default: `0.5`

[`src/body/Body.js:1230`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22frictionStatic%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22frictionStatic%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`id`](https://brm.io/matter-js/docs/classes/Body.html\#property_id)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

An integer `Number` uniquely identifying number generated in `Body.create` by `Common.nextId`.

[`src/body/Body.js:906`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22id%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22id%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`inertia`](https://brm.io/matter-js/docs/classes/Body.html\#property_inertia)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Automatically calculated when vertices, mass or density are set or set through `Body.setInertia`.

A `Number` that defines the moment of inertia of the body. This is the second moment of area in two dimensions.

Can be manually set to `Infinity` to prevent rotation of the body. See `Body.setInertia`.

[`src/body/Body.js:1178`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22inertia%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22inertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`inverseInertia`](https://brm.io/matter-js/docs/classes/Body.html\#property_inverseInertia)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Automatically calculated when vertices, mass or density are set or calculated by `Body.setInertia`.

A `Number` that defines the inverse moment of inertia of the body ( `1 / inertia`).

[`src/body/Body.js:1190`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22inverseInertia%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22inverseInertia%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`inverseMass`](https://brm.io/matter-js/docs/classes/Body.html\#property_inverseMass)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setMass` to set.

A `Number` that defines the inverse mass of the body ( `1 / mass`).

[`src/body/Body.js:1168`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22inverseMass%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22inverseMass%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`isSensor`](https://brm.io/matter-js/docs/classes/Body.html\#property_isSensor)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that indicates whether a body is a sensor. Sensor triggers collision events, but doesn't react with colliding body physically.

Default: `false`

[`src/body/Body.js:1103`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22isSensor%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22isSensor%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`isSleeping`](https://brm.io/matter-js/docs/classes/Body.html\#property_isSleeping)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

_Read only_. Use `Sleeping.set` to set.

A flag that indicates whether the body is considered sleeping. A sleeping body acts similar to a static body, except it is only temporary and can be awoken.

Default: `false`

[`src/body/Body.js:1111`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22isSleeping%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22isSleeping%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`isStatic`](https://brm.io/matter-js/docs/classes/Body.html\#property_isStatic)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

_Read only_. Use `Body.setStatic` to set.

A flag that indicates whether a body is considered static. A static body can never change position or angle and is completely fixed.

Default: `false`

[`src/body/Body.js:1092`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22isStatic%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22isStatic%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`label`](https://brm.io/matter-js/docs/classes/Body.html\#property_label)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

An arbitrary `String` name to help the user identify and manage bodies.

Default: `"Body"`

[`src/body/Body.js:924`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22label%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22label%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`mass`](https://brm.io/matter-js/docs/classes/Body.html\#property_mass)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setMass` to set.

A `Number` that defines the mass of the body.

Density will also be updated when set.

[`src/body/Body.js:1156`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22mass%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22mass%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`motion`](https://brm.io/matter-js/docs/classes/Body.html\#property_motion)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Calculated during engine update only when sleeping is enabled.

A `Number` that loosely measures the amount of movement a body currently has.

Derived from `body.speed^2 + body.angularSpeed^2`. See `Sleeping.update`.

Default: `0`

[`src/body/Body.js:1122`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22motion%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22motion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`parent`](https://brm.io/matter-js/docs/classes/Body.html\#property_parent)

[Body](https://brm.io/matter-js/docs/classes/Body.html)

_Read only_. Updated by `Body.setParts`.

A reference to the body that this is a part of. See `body.parts`.
This is a self reference if the body is not a part of another body.

[`src/body/Body.js:970`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22parent%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22parent%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`parts`](https://brm.io/matter-js/docs/classes/Body.html\#property_parts)

[Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

_Read only_. Use `Body.setParts` to set.

See `Bodies.fromVertices` for a related utility.

An array of bodies (the 'parts') that make up this body (the 'parent'). The first body in this array must always be a self-reference to this `body`.

The parts are fixed together and therefore perform as a single unified rigid body.

Parts in relation to each other are allowed to overlap, as well as form gaps or holes, so can be used to create complex concave bodies unlike when using a single part.

Use properties and functions on the parent `body` rather than on parts.

Outside of their geometry, most properties on parts are not considered or updated.

As such 'per-part' material properties among others are not currently considered.

Parts should be created specifically for their parent body.

Parts should not be shared or reused between bodies, only one parent is supported.

Parts should not have their own parts, they are not handled recursively.

Parts should not be added to the world directly or any other composite.

Parts own vertices must be convex and in clockwise order.

A body with more than one part is sometimes referred to as a 'compound' body.

Use `Body.setParts` when setting parts to ensure correct updates of all properties.

[`src/body/Body.js:932`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22parts%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22parts%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`plugin`](https://brm.io/matter-js/docs/classes/Body.html\#property_plugin)

An object reserved for storing plugin-specific properties.

[`src/body/Body.js:963`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22plugin%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`position`](https://brm.io/matter-js/docs/classes/Body.html\#property_position)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

_Read only_. Use `Body.setPosition` to set.

A `Vector` that specifies the current world-space position of the body.

Default: `{ x: 0, y: 0 }`

[`src/body/Body.js:1011`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22position%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22position%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render`](https://brm.io/matter-js/docs/classes/Body.html\#property_render)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.

[`src/body/Body.js:1339`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.fillStyle`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.fillStyle)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A `String` that defines the fill style to use when rendering the body (if a sprite is not defined).
It is the same as when using a canvas, so it accepts CSS style property values.

Default: `a random colour`

[`src/body/Body.js:1417`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.fillStyle%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.fillStyle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.lineWidth`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.lineWidth)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the line width to use when rendering the body outline (if a sprite is not defined).
A value of `0` means no outline will be rendered.

Default: `0`

[`src/body/Body.js:1408`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.lineWidth%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.lineWidth%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.opacity`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.opacity)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

Sets the opacity to use when rendering.

Default: `1`

[`src/body/Body.js:1354`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.opacity%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.opacity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite)

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

An `Object` that defines the sprite properties to use when rendering, if any.

[`src/body/Body.js:1362`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite.texture`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite.texture)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

An `String` that defines the path to the image to use as the sprite texture, if any.

[`src/body/Body.js:1369`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite.texture%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite.texture%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite.xOffset`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite.xOffset)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the offset in the x-axis for the sprite (normalised by texture width).

Default: `0`

[`src/body/Body.js:1392`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite.xOffset%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite.xOffset%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite.xScale`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite.xScale)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the scaling in the x-axis for the sprite, if any.

Default: `1`

[`src/body/Body.js:1376`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite.xScale%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite.xScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite.yOffset`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite.yOffset)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the offset in the y-axis for the sprite (normalised by texture height).

Default: `0`

[`src/body/Body.js:1400`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite.yOffset%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite.yOffset%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.sprite.yScale`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.sprite.yScale)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the scaling in the y-axis for the sprite, if any.

Default: `1`

[`src/body/Body.js:1384`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.sprite.yScale%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.sprite.yScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.strokeStyle`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.strokeStyle)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

A `String` that defines the stroke style to use when rendering the body outline (if a sprite is not defined).
It is the same as when using a canvas, so it accepts CSS style property values.

Default: `a random colour`

[`src/body/Body.js:1426`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.strokeStyle%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.strokeStyle%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`render.visible`](https://brm.io/matter-js/docs/classes/Body.html\#property_render.visible)

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

A flag that indicates if the body should be rendered.

Default: `true`

[`src/body/Body.js:1346`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22render.visible%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22render.visible%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`restitution`](https://brm.io/matter-js/docs/classes/Body.html\#property_restitution)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the restitution (elasticity) of the body. The value is always positive and is in the range `(0, 1)`.
A value of `0` means collisions may be perfectly inelastic and no bouncing may occur.
A value of `0.8` means the body may bounce back with approximately 80% of its kinetic energy.
Note that collision response is based on _pairs_ of bodies, and that `restitution` values are _combined_ with the following formula:

`Math.max(bodyA.restitution, bodyB.restitution)`

Default: `0`

[`src/body/Body.js:1200`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22restitution%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22restitution%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`sleepThreshold`](https://brm.io/matter-js/docs/classes/Body.html\#property_sleepThreshold)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that defines the length of time during which this body must have near-zero velocity before it is set as sleeping by the `Matter.Sleeping` module (if sleeping is enabled by the engine).

Default: `60`

[`src/body/Body.js:1135`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22sleepThreshold%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22sleepThreshold%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`slop`](https://brm.io/matter-js/docs/classes/Body.html\#property_slop)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that specifies a thin boundary around the body where it is allowed to slightly sink into other bodies.

This is required for proper collision response, including friction and restitution effects.

The default should generally suffice in most cases. You may need to decrease this value for very small bodies that are nearing the default value in scale.

Default: `0.05`

[`src/body/Body.js:1307`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22slop%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22slop%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`speed`](https://brm.io/matter-js/docs/classes/Body.html\#property_speed)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

_Read only_. Use `Body.setSpeed` to set.

See `Body.getSpeed` for details.

Equivalent to the magnitude of `body.velocity` (always positive).

Default: `0`

[`src/body/Body.js:1042`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22speed%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22speed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`timeScale`](https://brm.io/matter-js/docs/classes/Body.html\#property_timeScale)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that specifies per-body time scaling.

Default: `1`

[`src/body/Body.js:1319`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22timeScale%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22timeScale%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`torque`](https://brm.io/matter-js/docs/classes/Body.html\#property_torque)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

A `Number` that accumulates the total torque (turning force) applied to the body for a single update. See also `Body.applyForce`.
Torque is zeroed after every `Engine.update`, so constant torques should be applied for every update they are needed.

Torques result in angular acceleration on every update, which depends on body inertia and the engine update delta.

Default: `0`

[`src/body/Body.js:1031`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22torque%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22torque%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`type`](https://brm.io/matter-js/docs/classes/Body.html\#property_type)

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

_Read only_. Set by `Body.create`.

A `String` denoting the type of object.

Default: `"body"`

[`src/body/Body.js:913`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22type%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`velocity`](https://brm.io/matter-js/docs/classes/Body.html\#property_velocity)

[Vector](https://brm.io/matter-js/docs/classes/Vector.html)

_Read only_. Use `Body.setVelocity` to set.

See `Body.getVelocity` for details.

Equivalent to the magnitude of `body.angularVelocity` (always positive).

Default: `{ x: 0, y: 0 }`

[`src/body/Body.js:1055`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22velocity%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22velocity%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Body. [`vertices`](https://brm.io/matter-js/docs/classes/Body.html\#property_vertices)

[Vector\[\]](https://brm.io/matter-js/docs/classes/Vector.html)

_Read only_. Use `Body.setVertices` or `Body.setParts` to set. See also `Bodies.fromVertices`.

An array of `Vector` objects that specify the convex hull of the rigid body.
These should be provided about the origin `(0, 0)`. E.g.

`[{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]`

Vertices must always be convex, in clockwise order and must not contain any duplicate points.

Concave vertices should be decomposed into convex `parts`, see `Bodies.fromVertices` and `Body.setParts`.

When set the vertices are translated such that `body.position` is at the centre of mass.
Many other body properties are automatically calculated from these vertices when set including `density`, `area` and `inertia`.

The module `Matter.Vertices` contains useful methods for working with vertices.

[`src/body/Body.js:989`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22vertices%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22vertices%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Events

The following events are emitted by objects created by `Matter.Body.create` and received by objects that have subscribed using `Matter.Events.on`.

### Events.on(Body, " [`sleepEnd`](https://brm.io/matter-js/docs/classes/Body.html\#event_sleepEnd)", callback)

Fired when a body ends sleeping (where `this` is the body).

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Body.js:890`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22sleepEnd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22sleepEnd%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Events.on(Body, " [`sleepStart`](https://brm.io/matter-js/docs/classes/Body.html\#event_sleepStart)", callback)

Fired when a body starts sleeping (where `this` is the body).

#### Callback Parameters

- `event` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


An event object


  - `source`


    The source object of the event

  - `name`


    The name of the event

[`src/body/Body.js:880`](https://github.com/liabru/matter-js/tree/master/src/body/Body.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22sleepStart%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22sleepStart%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")