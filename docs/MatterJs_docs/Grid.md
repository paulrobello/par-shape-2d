---
url: "https://brm.io/matter-js/docs/classes/Grid.html"
title: "Matter.Grid Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/collision/Grid.js:1`](https://brm.io/matter-js/docs/files/src_collision_Grid.js.html#l1)

This class is deprecated.


This module has now been replaced by `Matter.Detector`.

All usage should be migrated to `Matter.Detector` or another alternative.
For back-compatibility purposes this module will remain for a short term and then later removed in a future release.

The `Matter.Grid` module contains methods for creating and manipulating collision broadphase grid structures.

## Methods

### Matter.Grid. [\_bucketAddBody](https://brm.io/matter-js/docs/classes/Grid.html\#method__bucketAddBody)

(grid, bucket, body)

deprecatedprivate

Deprecated: replaced by Matter.Detector

Adds a body to a bucket.

#### Parameters

- `grid` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `bucket` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `body` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


[`src/collision/Grid.js:240`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L240 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._bucketAddBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._bucketAddBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_bucketRemoveBody](https://brm.io/matter-js/docs/classes/Grid.html\#method__bucketRemoveBody)

(grid, bucket, body)

deprecatedprivate

Deprecated: replaced by Matter.Detector

Removes a body from a bucket.

#### Parameters

- `grid` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `bucket` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `body` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


[`src/collision/Grid.js:278`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L278 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._bucketRemoveBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._bucketRemoveBody%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_createActivePairsList](https://brm.io/matter-js/docs/classes/Grid.html\#method__createActivePairsList)

(grid)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)deprecatedprivate

Deprecated: replaced by Matter.Detector

Generates a list of the active pairs in the grid.

#### Parameters

- `grid` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

\[\] pairs

[`src/collision/Grid.js:308`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L308 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._createActivePairsList%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._createActivePairsList%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_createBucket](https://brm.io/matter-js/docs/classes/Grid.html\#method__createBucket)

(buckets, bucketId)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)deprecatedprivate

Deprecated: replaced by Matter.Detector

Creates a bucket.

#### Parameters

- `buckets` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `bucketId` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

bucket

[`src/collision/Grid.js:226`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L226 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._createBucket%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._createBucket%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_createRegion](https://brm.io/matter-js/docs/classes/Grid.html\#method__createRegion)

(startCol, endCol, startRow, endRow)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)deprecatedprivate

Deprecated: replaced by Matter.Detector

Creates a region.

#### Parameters

- `startCol` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `endCol` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `startRow` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `endRow` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

region

[`src/collision/Grid.js:192`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L192 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._createRegion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._createRegion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_getBucketId](https://brm.io/matter-js/docs/classes/Grid.html\#method__getBucketId)

(column, row)

→ [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)deprecatedprivate

Deprecated: replaced by Matter.Detector

Gets the bucket id at the given position.

#### Parameters

- `column` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `row` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

bucket id

[`src/collision/Grid.js:213`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L213 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._getBucketId%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._getBucketId%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_getRegion](https://brm.io/matter-js/docs/classes/Grid.html\#method__getRegion)

(grid, body)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)deprecatedprivate

Deprecated: replaced by Matter.Detector

Gets the region a given body falls in for a given grid.

#### Parameters

- `grid` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `body` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

region

[`src/collision/Grid.js:173`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L173 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._getRegion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._getRegion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [\_regionUnion](https://brm.io/matter-js/docs/classes/Grid.html\#method__regionUnion)

(regionA, regionB)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)deprecatedprivate

Deprecated: replaced by Matter.Detector

Finds the union of two regions.

#### Parameters

- `regionA` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

- `regionB` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

region

[`src/collision/Grid.js:155`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L155 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid._regionUnion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid._regionUnion%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [clear](https://brm.io/matter-js/docs/classes/Grid.html\#method_clear)

(grid)

deprecated

Deprecated: replaced by Matter.Detector

Clears the grid.

#### Parameters

- `grid` [Grid](https://brm.io/matter-js/docs/classes/Grid.html)


[`src/collision/Grid.js:141`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L141 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid.clear%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [create](https://brm.io/matter-js/docs/classes/Grid.html\#method_create)

(options)

→ [Grid](https://brm.io/matter-js/docs/classes/Grid.html)deprecated

Deprecated: replaced by Matter.Detector

Creates a new grid.

#### Parameters

- `options` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


#### Returns

[Grid](https://brm.io/matter-js/docs/classes/Grid.html)

A new grid

[`src/collision/Grid.js:23`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L23 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid.create%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Grid. [update](https://brm.io/matter-js/docs/classes/Grid.html\#method_update)

(grid, bodies, engine, forceUpdate)

deprecated

Deprecated: replaced by Matter.Detector

Updates the grid.

#### Parameters

- `grid` [Grid](https://brm.io/matter-js/docs/classes/Grid.html)

- `bodies` [Body\[\]](https://brm.io/matter-js/docs/classes/Body.html)

- `engine` [Engine](https://brm.io/matter-js/docs/classes/Engine.html)

- `forceUpdate` [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)


[`src/collision/Grid.js:58`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L58 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Grid.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Grid.update%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

## Properties / Options

The following properties if specified below are for objects created by `Matter.Grid.create` and may be passed to it as `options`.

### Grid. [`bucketHeight`](https://brm.io/matter-js/docs/classes/Grid.html\#property_bucketHeight)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The height of a single grid bucket.

Default: `48`

[`src/collision/Grid.js:50`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bucketHeight%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bucketHeight%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Grid. [`bucketWidth`](https://brm.io/matter-js/docs/classes/Grid.html\#property_bucketWidth)

[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The width of a single grid bucket.

Default: `48`

[`src/collision/Grid.js:42`](https://github.com/liabru/matter-js/tree/master/src/collision/Grid.js#L1 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22bucketWidth%22+repo%3Aliabru%2Fmatter-js+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22bucketWidth%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")