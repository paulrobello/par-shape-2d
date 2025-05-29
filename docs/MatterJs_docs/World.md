---
url: "https://brm.io/matter-js/docs/classes/World.html"
title: "Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/body/World.js:1`](https://brm.io/matter-js/docs/files/src_body_World.js.html#l1)

This module has now been replaced by `Matter.Composite`.

All usage should be migrated to the equivalent functions found on `Matter.Composite`.
For example `World.add(world, body)` now becomes `Composite.add(world, body)`.

The property `world.gravity` has been moved to `engine.gravity`.

For back-compatibility purposes this module will remain as a direct alias to `Matter.Composite` in the short term during migration.
Eventually this alias module will be marked as deprecated and then later removed in a future release.