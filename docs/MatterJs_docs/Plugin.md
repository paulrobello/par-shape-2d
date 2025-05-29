---
url: "https://brm.io/matter-js/docs/classes/Plugin.html"
title: "Matter.Plugin Module - Matter.js Physics Engine API Docs - matter-js 0.20.0"
---

Show:

Inherited

Protected

Private

Deprecated


Defined in: [`src/core/Plugin.js:1`](https://brm.io/matter-js/docs/files/src_core_Plugin.js.html#l1)

The `Matter.Plugin` module contains functions for registering and installing plugins on modules.

## Methods

### Matter.Plugin. [dependencies](https://brm.io/matter-js/docs/classes/Plugin.html\#method_dependencies)

(module)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Recursively finds all of a module's dependencies and returns a flat dependency graph.

#### Parameters

- `module` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The module.


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

A dependency graph.

[`src/core/Plugin.js:179`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L179 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.dependencies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.dependencies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [dependencyParse](https://brm.io/matter-js/docs/classes/Plugin.html\#method_dependencyParse)

(dependency)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Parses a dependency string into its components.
The `dependency` is a string of the format `'module-name'` or `'module-name@version'`.
See documentation for `Plugin.versionParse` for a description of the format.
This function can also handle dependencies that are already resolved (e.g. a module object).

#### Parameters

- `dependency` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The dependency of the format `'module-name'` or `'module-name@version'`.


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The dependency parsed into its components.

[`src/core/Plugin.js:232`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L232 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.dependencyParse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.dependencyParse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [isFor](https://brm.io/matter-js/docs/classes/Plugin.html\#method_isFor)

(plugin, module)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns `true` if `plugin.for` is applicable to `module` by comparing against `module.name` and `module.version`.
If `plugin.for` is not specified then it is assumed to be applicable.
The value of `plugin.for` is a string of the format `'module-name'` or `'module-name@version'`.

#### Parameters

- `plugin` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The plugin.

- `module` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The module.


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

`true` if `plugin.for` is applicable to `module`, otherwise `false`.

[`src/core/Plugin.js:94`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L94 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.isFor%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.isFor%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [isPlugin](https://brm.io/matter-js/docs/classes/Plugin.html\#method_isPlugin)

(obj)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns `true` if the object meets the minimum standard to be considered a plugin.
This means it must define the following properties:

- `name`
- `version`
- `install`

#### Parameters

- `obj` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The obj to test.


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

`true` if the object can be considered a plugin otherwise `false`.

[`src/core/Plugin.js:69`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L69 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.isPlugin%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.isPlugin%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [isUsed](https://brm.io/matter-js/docs/classes/Plugin.html\#method_isUsed)

(module, name)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns `true` if a plugin with the given `name` been installed on `module`.

#### Parameters

- `module` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The module.

- `name` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The plugin name.


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

`true` if a plugin with the given `name` been installed on `module`, otherwise `false`.

[`src/core/Plugin.js:83`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L83 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.isUsed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.isUsed%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [register](https://brm.io/matter-js/docs/classes/Plugin.html\#method_register)

(plugin)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Registers a plugin object so it can be resolved later by name.

#### Parameters

- `plugin` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The plugin to register.


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The plugin.

[`src/core/Plugin.js:17`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L17 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.register%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.register%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [resolve](https://brm.io/matter-js/docs/classes/Plugin.html\#method_resolve)

(dependency)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Resolves a dependency to a plugin object from the registry if it exists.
The `dependency` may contain a version, but only the name matters when resolving.

#### Parameters

- `dependency` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The dependency.


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The plugin if resolved, otherwise `undefined`.

[`src/core/Plugin.js:48`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L48 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.resolve%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.resolve%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [toString](https://brm.io/matter-js/docs/classes/Plugin.html\#method_toString)

(plugin)

→ [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

Returns a pretty printed plugin name and version.

#### Parameters

- `plugin` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The plugin.


#### Returns

[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

Pretty printed plugin name and version.

[`src/core/Plugin.js:59`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L59 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.toString%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.toString%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [use](https://brm.io/matter-js/docs/classes/Plugin.html\#method_use)

(module, \[plugins=module.uses\])

Installs the plugins by calling `plugin.install` on each plugin specified in `plugins` if passed, otherwise `module.uses`.
For installing plugins on `Matter` see the convenience function `Matter.use`.
Plugins may be specified either by their name or a reference to the plugin object.
Plugins themselves may specify further dependencies, but each plugin is installed only once.
Order is important, a topological sort is performed to find the best resulting order of installation.
This sorting attempts to satisfy every dependency's requested ordering, but may not be exact in all cases.
This function logs the resulting status of each dependency in the console, along with any warnings.

- A green tick ✅ indicates a dependency was resolved and installed.
- An orange diamond 🔶 indicates a dependency was resolved but a warning was thrown for it or one if its dependencies.
- A red cross ❌ indicates a dependency could not be resolved.
Avoid calling this function multiple times on the same module unless you intend to manually control installation order.

#### Parameters

- `module` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


The module install plugins on.

- `[plugins=module.uses]` [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)optional


The plugins to install on module (optional, defaults to `module.uses`).


[`src/core/Plugin.js:108`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L108 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.use%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.use%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [versionParse](https://brm.io/matter-js/docs/classes/Plugin.html\#method_versionParse)

(range)

→ [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Parses a version string into its components.

Versions are strictly of the format `x.y.z` (as in [semver](http://semver.org/)).
Versions may optionally have a prerelease tag in the format `x.y.z-alpha`.
Ranges are a strict subset of [npm ranges](https://docs.npmjs.com/misc/semver#advanced-range-syntax).
Only the following range types are supported:

- Tilde ranges e.g. `~1.2.3`
- Caret ranges e.g. `^1.2.3`
- Greater than ranges e.g. `>1.2.3`
- Greater than or equal ranges e.g. `>=1.2.3`
- Exact version e.g. `1.2.3`
- Any version `*`

#### Parameters

- `range` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The version string.


#### Returns

[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

The version range parsed into its components.

[`src/core/Plugin.js:261`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L261 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.versionParse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.versionParse%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")

### Matter.Plugin. [versionSatisfies](https://brm.io/matter-js/docs/classes/Plugin.html\#method_versionSatisfies)

(version, range)

→ [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Returns `true` if `version` satisfies the given `range`.
See documentation for `Plugin.versionParse` for a description of the format.
If a version or range is not specified, then any version ( `*`) is assumed to satisfy.

#### Parameters

- `version` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The version string.

- `range` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)


The range string.


#### Returns

[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

`true` if `version` satisfies `range`, otherwise `false`.

[`src/core/Plugin.js:303`](https://github.com/liabru/matter-js/tree/master/src/core/Plugin.js#L303 "View source on GitHub")
· [Usages](https://github.com/search?l=JavaScript&q=%22Plugin.versionSatisfies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fsrc&type=Code "Find usages on GitHub")
· [Examples](https://github.com/search?l=JavaScript&q=%22Plugin.versionSatisfies%22+repo%3Aliabru%2Fmatter-js+language%3AJavaScript+path%3A%2Fexamples&type=Code "Find examples on GitHub")