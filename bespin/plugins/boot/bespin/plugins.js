/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

require("globals");

var Promise = require("promise").Promise;
var group = require("promise").group;
var builtins = require("builtins");
var console = require("console").console;
var util = require("util/util");
var Trace = require("util/stacktrace").Trace;

var r = require;

var loader = require.loader;
var browser = loader.sources[0];

/**
 * Split an extension pointer from module/path#objectName into an object of the
 * type { modName:"module/path", objName:"objectName" } using a pluginName
 * as the base to which roots the pointer
 */
var _splitPointer = function(pluginName, pointer) {
    if (!pointer) {
        return undefined;
    }

    var parts = pointer.split("#");
    var modName;

    // this allows syntax like #foo
    // which is equivalent to PluginName:index#foo
    if (parts[0]) {
        modName = pluginName + ":" + parts[0];
    } else {
        modName = pluginName;
    }

    return {
        modName: modName,
        objName: parts[1]
    };
};

var _retrieveObject = function(pointerObj) {
    var module = r(pointerObj.modName);
    if (pointerObj.objName) {
        return module[pointerObj.objName];
    }
    return module;
};

/**
 * An Extension represents some code that can be lazy-loaded when needed.
 * @constructor
 */
exports.Extension = function(metadata) {
    this.pluginName = null;

    for (property in metadata) {
        if (metadata.hasOwnProperty(property)) {
            this[property] = metadata[property];
        }
    }

    this._observers = [];
};

exports.Extension.prototype = {
    /**
     * Asynchronously load the actual code represented by this Extension
     * @param callback Function to call when the load has finished (deprecated)
     * @param property Extension property to load (default 'pointer')
     * @returns A promise to be fulfilled on completion. Preferred over using the
     * <tt>callback</tt> parameter.
     */
    load: function(callback, property) {
        var promise = new Promise();

        var onComplete = function(func) {
            if (callback) {
                callback(func);
            }
            promise.resolve(func);
        };

        var pointerVal = this[property || 'pointer'];
        if (util.isFunction(pointerVal)) {
            onComplete(pointerVal);
            return promise;
        }

        var pointerObj = _splitPointer(this.pluginName, pointerVal);

        if (!pointerObj) {
            console.error('Extension cannot be loaded because it has no \'pointer\'');
            console.log(this);

            promise.reject(new Error('Extension has no \'pointer\' to call'));
            return promise;
        }
        
        exports.catalog.loadPlugin(this.pluginName).then(function() {
            require.ensure(pointerObj.modName, function() {
                var func = _retrieveObject(pointerObj);
                onComplete(func);

                // TODO: consider caching 'func' to save looking it up again
                // Something like: this._setPointer(property, data);
            });
        });

        return promise;
    },

    /**
     * Loads this extension and passes the result to the callback.
     * Any time this extension changes, the callback is called with the new value.
     * Note that if this extension goes away, the callback will be called with
     * undefined.
     * <p>observingPlugin is required, because if that plugin is torn down,
     * all of its observing callbacks need to be torn down as well.
     */
    observe: function(observingPlugin, callback, property) {
        this._observers.push({
            plugin: observingPlugin,
            callback: callback,
            property: property
        });
        this.load(callback, property);
    },

    /**
     * Returns the name of the plugin that provides this extension.
     */
    getPluginName: function() {
        return this.pluginName;
    },

    /**
     *
     */
    _getLoaded: function(property) {
        var pointerObj = this._getPointer(property);
        return _retrieveObject(pointerObj);
    }
};

/**
 * An ExtensionPoint is a get of Extensions grouped under the same name
 * for fast access.
 * @constructor
 */
exports.ExtensionPoint = function(name, catalog) {
    this.name = name;
    this.catalog = catalog;

    this.pluginName = undefined;
    this.indexOn = undefined;

    this.extensions = [];
    this.handlers = [];
};

/**
 * Implementation of ExtensionPoint
 */
exports.ExtensionPoint.prototype = {
    /**
    * Retrieves the list of plugins which provide extensions
    * for this extension point.
    */
    getImplementingPlugins: function() {
        var pluginSet = {};
        this.extensions.forEach(function(ext) {
            pluginSet[ext.pluginName] = true;
        });
        var matches = Object.keys(pluginSet);
        matches.sort();
        return matches;
    },

    /**
     * Get the name of the plugin that defines this extension point.
     */
    getDefiningPluginName: function() {
        return this.pluginName;
    },

    /**
     * If we are keeping an index (an indexOn property is set on the
     * extension point), you can look up an extension by key.
     */
    getByKey: function(key) {
        var indexOn = this.indexOn;

        if (!indexOn) {
            return undefined;
        }

        for (var i = 0; i < this.extensions.length; i++) {
            if (this.extensions[i][indexOn] == key) {
                return this.extensions[i];
            }
        }
        return undefined;
    },

    register: function(extension) {
        this.extensions.push(extension);
        this.handlers.forEach(function(handler) {
            if (handler.register) {
                handler.load(function(register) {
                    if (!register) {
                        console.error('missing register function for pluginName=', extension.pluginName, ", extension=", extension.name);
                    } else {
                         register(extension);
                    }
                }, "register");
            }
        });
    },

    unregister: function(extension) {
        this.extensions.splice(this.extensions.indexOf(extension), 1);
        this.handlers.forEach(function(handler) {
            if (handler.unregister) {
                handler.load(function(unregister) {
                    if (!unregister) {
                        console.error('missing unregister function for pluginName=', extension.pluginName, ", extension=", extension.name);
                    } else {
                         unregister(extension);
                    }
                }, "unregister");
            }
        });
    },

    /**
     * Order the extensions by a plugin order.
     */
    orderExtensions: function(pluginOrder) {
        var orderedExt = [];

        for (var i = 0; i < pluginOrder.length; i++) {
            var n = 0;
            while (n != this.extensions.length) {
                if (this.extensions[n].pluginName === pluginOrder[i]) {
                    orderedExt.push(this.extensions[n]);
                    this.extensions.splice(n, 1);
                } else {
                    n ++;
                }
            }
        }

        this.extensions = orderedExt.concat(this.extensions);
    }
};

/**
 * A Plugin is a set of Extensions that are loaded as a unit
 * @constructor
 */
exports.Plugin = function(metadata) {
    // Should be provided in the metadata
    this.catalog = null;
    this.name = null;
    this.provides = [];
    this.stylesheets = [];
    this.reloadURL = null;
    this.reloadPointer = null;

    for (property in metadata) {
        if (metadata.hasOwnProperty(property)) {
            this[property] = metadata[property];
        }
    }
};

/**
 * Implementation of Plugin
 */
exports.Plugin.prototype = {
    register: function() {
        this.provides.forEach(function(extension) {
            var ep = this.catalog.getExtensionPoint(extension.ep, true);
            ep.register(extension);
        }, this);
    },

    unregister: function() {
        this.provides.forEach(function(extension) {
            var ep = this.catalog.getExtensionPoint(extension.ep, true);
            ep.unregister(extension);
        }, this);
    },

    _getObservers: function() {
        var result = {};
        this.provides.forEach(function(extension) {
            console.log('ep: ', extension.ep);
            console.log(extension._observers);
            result[extension.ep] = extension._observers;
        });
        return result;
    },

    /**
     * Figure out which plugins depend on a given plugin. This
     * will allow the reload behavior to unregister/reregister
     * all of the plugins that depend on the one being reloaded.
     */
    _findDependents: function(pluginList, dependents) {
        var pluginName = this.name;
        var self = this;
        pluginList.forEach(function(testPluginName) {
            if (testPluginName == pluginName) {
                return;
            }
            var plugin = self.catalog.plugins[testPluginName];
            if (plugin && plugin.dependencies) {
                for (dependName in plugin.dependencies) {
                    if (dependName == pluginName && !dependents[testPluginName]) {
                        dependents[testPluginName] = {
                            keepModule: false
                        };
                        plugin._findDependents(pluginList, dependents);
                    }
                }
            }
        });
    },

    /**
     * removes the plugin from Tiki's registries.
     */
    _cleanup: function() {
        // Remove the css files.
        this.stylesheets.forEach(function(stylesheet) {
            var links = document.getElementsByTagName('link');
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.indexOf(stylesheet.url) != -1) {
                    links[i].parentNode.removeChild(links[i]);
                    break;
                }
            }
        });

        // Remove all traces of the plugin.
        var pluginName = this.name;

        var nameMatch = new RegExp("^" + pluginName + '$');
        var moduleMatch = new RegExp('^::' + pluginName + ':');
        var packageMatch = new RegExp("^::" + pluginName + '$');

        var sandbox = require.sandbox;
        var loader = require.loader;
        var source = browser;

        // Clear the loader.
        _removeFromObject(moduleMatch, loader.factories);
        _removeFromObject(packageMatch, loader.canonicalIds);
        _removeFromObject(packageMatch, loader.canonicalPackageIds);
        _removeFromObject(packageMatch, loader.packageSources);
        _removeFromObject(packageMatch, loader.packages);

        // Clear the sandbox.
        _removeFromObject(moduleMatch, sandbox.exports);
        _removeFromObject(moduleMatch, sandbox.modules);
        _removeFromObject(moduleMatch, sandbox.usedExports);

        // Clear the source.
        _removeFromObject(nameMatch, source.packageInfoByName);
        _removeFromObject(moduleMatch, source.factories);
        _removeFromObject(moduleMatch, source.scriptActions);
        _removeFromObject(moduleMatch, source.stylesheetActions);
        _removeFromObject(packageMatch, source.packages);
        _removeFromObject(packageMatch, source.ensureActions);
        _removeFromObject(packageMatch, source.packageInfoById);
    },

    /**
     * reloads the plugin and reinitializes all
     * dependent plugins
     */
    reload: function(callback) {
        // TODO: Broken. Needs to be updated to the latest Tiki.

        // All reloadable plugins will have a reloadURL
        if (!this.reloadURL) {
            return;
        }

        if (this.reloadPointer) {
            var pointer = _splitPointer(this.name, this.reloadPointer);
            func = _retrieveObject(pointer);
            if (func) {
                func();
            } else {
                console.error("Reload function could not be loaded. Aborting reload.");
                return;
            }
        }

        // find all of the dependents recursively so that
        // they can all be unregistered
        var dependents = {};

        var pluginList = Object.keys(this.catalog.plugins);

        this._findDependents(pluginList, dependents);

        var reloadDescription = {
            pluginName: this.name,
            dependents: dependents
        };

        for (var dependName in dependents) {
            var plugin = this.catalog.plugins[dependName];
            if (plugin.preRefresh) {
                var parts = _splitPointer(dependName, plugin.preRefresh);
                func = _retrieveObject(parts);
                if (func) {
                    // the preRefresh call can return an object
                    // that includes attributes:
                    // keepModule (true to keep the module object)
                    // callPointer (pointer to call at the end of reloading)
                    dependents[dependName] = func(reloadDescription);
                }
            }
        }

        // notify everyone that this plugin is going away
        this.unregister();

        for (dependName in dependents) {
            this.catalog.plugins[dependName].unregister();
        }

        this._cleanup(this.name);

        // clear the sandbox of modules from all of the dependent plugins
        var fullModList = [];
        var sandbox = require.sandbox;

        var modulesKey = Object.keys(sandbox.modules);
        var i = modulesKey.length;
        var dependRegexes = [];
        for (dependName in dependents) {
            // check to see if the module stated that it shouldn't be
            // refreshed
            if (!dependents[dependName].keepModule) {
                dependRegexes.push(new RegExp("^::" + dependName + ":"));
            }
        }

        var nameMatch = new RegExp("^::" + this.name + ":");

        while (--i >= 0) {
            var item = modulesKey[i];
            if (nameMatch.exec(item)) {
                fullModList.push(item);
            } else {
                var j = dependRegexes.length;
                while (--j >= 0) {
                    if (dependRegexes[j].exec(item)) {
                        fullModList.push(item);
                        break;
                    }
                }
            }
        }

        // Remove the modules of the dependent plugins from the sandbox.
        fullModList.forEach(function(item) {
            delete sandbox.exports[item];
            delete sandbox.modules[item];
            delete sandbox.usedExports[item];
        });

        // reload the plugin metadata
        var onLoad = function() {
            // actually load the plugin, so that it's ready
            // for any dependent plugins
            this.catalog.loadPlugin(this.name).then(function() {
                // re-register all of the dependent plugins
                for (dependName in dependents) {
                    this.catalog.plugins[dependName].register();
                }

                for (dependName in dependents) {
                    if (dependents[dependName].callPointer) {
                        var parts = _splitPointer(dependName,
                            dependents[dependName].callPointer);
                        var func = _retrieveObject(parts);
                        if (func) {
                            func(reloadDescription);
                        }
                    }
                }

                if (callback) {
                    // at long last, reloading is done.
                    callback();
                }
            }.bind(this));
        }.bind(this);

        // TODO: There should be more error handling then just logging
        // to the command line.
        var onError = function() {
            console.error('Failed to load metadata from ' + this.reloadURL);
        }.bind(this);

        this.catalog.loadMetadataFromURL(this.reloadURL).then(onLoad, onError);
    }
};

var _setPath = function(root, path, value) {
    var segments = path.split('.');
    var current = root;
    var top = segments.length - 1;
    if (top > 0) {
        for (var i = 0; i < top; i++) {
            current = current[segments[i]];
        }
    }
    current[top] = value;
};

exports.Catalog = function() {
    this.points = {};
    this.plugins = {};
    this.deactivatedPlugins = {};
    this._extensionsOrdering = [];
    this.instances = {};
    this.instancesLoadPromises = {};
    this._objectDescriptors = {};

    // set up the "extensionpoint" extension point.
    // it indexes on name.
    var ep = this.getExtensionPoint("extensionpoint", true);
    ep.indexOn = "name";
    this.loadMetadata(builtins.metadata);
};

exports.Catalog.prototype = {
    /**
     * Registers information about an instance that will be tracked
     * by the catalog. The first parameter is the name used for looking up
     * the object. The descriptor should contain:
     * - factory (optional): name of the factory extension used to create the
     *                       object. defaults to the same value as the name
     *                       property.
     * - arguments (optional): array that is passed in if the factory is a
     *                      function.
     * - objects (optional): object that describes other objects that are
     *                      required when constructing this one (see below)
     *
     * The objects object defines objects that must be created before this
     * one and how they should be passed in. The key defines how they
     * are passed in, and the value is the name of the object to pass in.
     * You define how they are passed in relative to the arguments
     * array, using a very simple interface of dot separated keys.
     * For example, if you have an arguments array of [null, {foo: null}, "bar"]
     * you can have an object array like this:
     * {
     *  "0": "myCoolObject",
     *  "1.foo": "someOtherObject"
     * }
     *
     * which will result in arguments like this:
     * [myCoolObject, {foo: someOtherObject}, "bar"]
     * where myCoolObject and someOtherObject are the actual objects
     * created elsewhere.
     *
     * If the plugin containing the factory is reloaded, the object will
     * be recreated. The object will also be recreated if objects passed in
     * are reloaded.
     *
     * This method returns nothing and does not actually create the objects.
     * The objects are created via the createObject method and retrieved
     * via the getObject method.
     */
    registerObject: function(name, descriptor) {
        this._objectDescriptors[name] = descriptor;
    },

    /**
     * Stores an object directly in the instance cache. This should
     * not generally be used because reloading cannot work with
     * these objects.
     */
    _setObject: function(name, obj) {
        this.instances[name] = obj;
    },

    /**
     * Creates an object with a previously registered descriptor.
     *
     * Returns a promise that will be resolved (with the created object)
     * once the object has been made. The promise will be resolved
     * immediately if the instance is already there.
     *
     * throws an exception if the object is not registered or if
     * the factory cannot be found.
     */
    createObject: function(name) {
        // console.log("Creating", name);

        // If there is already a loading promise for this instance, then
        // return this one.
        if (this.instancesLoadPromises[name] !== undefined) {
            // console.log("Already have one (it's very nice)");
            return this.instancesLoadPromises[name];
        }
        // Otherwise create a new loading promise (which is returned at the
        // end of the function) and create the instance.
        var pr = this.instancesLoadPromises[name] = new Promise();

        var descriptor = this._objectDescriptors[name];
        if (descriptor === undefined) {
            throw new Error('Tried to create object "' + name +
                '" but that object is not registered.');
        }

        var factoryName = descriptor.factory || name;
        var ext = this.getExtensionByKey("factory", factoryName);
        if (ext === undefined) {
            throw new Error('When creating object "' + name +
                '", there is no factory called "' + factoryName +
                '" available."');
        }
        var factoryArguments = descriptor.arguments || [];
        var argumentPromises = [];
        if (descriptor.objects) {
            var objects = descriptor.objects;
            for (var key in objects) {
                var objectName = objects[key];
                var ropr = this.createObject(objectName);
                argumentPromises.push(ropr);
                // key is changing, so we need to hang onto the
                // current value
                ropr.location = key;
                ropr.then(function(obj) {
                    _setPath(factoryArguments, ropr.location, obj);
                });
            }
        }

        group(argumentPromises).then(function() {
            ext.load().then(function(factory) {
                // console.log("Got factory for ", name);
                var action = ext.action;
                var obj;

                if (action === "call") {
                    obj = factory.apply(factory, factoryArguments);
                } else if (action === "new") {
                    if (factoryArguments.length > 1) {
                        pr.reject(new Error('For object ' + name + ', create a simple factory function and change the action to call because JS cannot handle this case.'));
                        return;
                    }
                    obj = new factory(factoryArguments[0]);
                } else if (action === "value") {
                    obj = factory;
                } else {
                    pr.reject(new Error("Create action must be call|new|value. " +
                            "Found" + action));
                    return;
                }

                this.instances[name] = obj;
                pr.resolve(obj);
            }.bind(this));
        }.bind(this));

        return pr;
    },

    /**
     * Retrieve a registered object. Returns undefined
     * if the instance has not been created.
     */
    getObject: function(name) {
        return this.instances[name];
    },

    /** Retrieve an extension point object by name, optionally creating it if it
    * does not exist.
    */
    getExtensionPoint: function(name, create) {
        if (create && this.points[name] === undefined) {
            this.points[name] = new exports.ExtensionPoint(name, this);
        }
        return this.points[name];
    },

    /**
     * Retrieve the list of extensions for the named extension point.
     * If none are defined, this will return an empty array.
     */
    getExtensions: function(name) {
        var ep = this.getExtensionPoint(name);
        if (ep === undefined) {
            return [];
        }
        return ep.extensions;
    },

    /**
     * Sets the order of the plugin's extensions. Note that this orders *only*
     * Extensions and nothing else (load order of CSS files e.g.)
     */
    orderExtensions: function(pluginOrder) {
        pluginOrder = pluginOrder || this._extensionsOrdering;

        for (name in this.points) {
            this.points[name].orderExtensions(pluginOrder);
        }
        this._extensionsOrdering = pluginOrder;
    },

    /**
     * Returns the current plugin exentions ordering.
     */
    getExtensionsOrdering: function() {
        return this._extensionsOrdering;
    },

    /**
     * Look up an extension in an indexed extension point by the given key. If
     * the extension point or the key are unknown, undefined will be returned.
     */
    getExtensionByKey: function(name, key) {
        var ep = this.getExtensionPoint(name);
        if (ep === undefined) {
            return undefined;
        }

        return ep.getByKey(key);
    },

    _registerExtensionPoint: function(extension) {
        var ep = this.getExtensionPoint(extension.name, true);
        ep.description = extension.description;
        ep.pluginName = extension.pluginName;
        ep.params = extension.params;
        if (extension.indexOn) {
            ep.indexOn = extension.indexOn;
        }

        if (extension.register || extension.unregister) {
            this._registerExtensionHandler(extension);
        }
    },

    _registerExtensionHandler: function(extension) {
        var ep = this.getExtensionPoint(extension.name, true);
        ep.handlers.push(extension);
        if (extension.register) {
            // Store the current extensions to this extension point. We can't
            // use the ep.extensions array within the load-callback-function, as
            // the array at that point in time also contains extensions that got
            // registered by calling the handler.register function directly.
            // As such, using the ep.extensions in the load-callback-function
            // would result in calling the handler's register function on a few
            // extensions twice.
            var extensions = util.clone(ep.extensions);

            extension.load(function(register) {
                if (!register) {
                    throw extension.name + " is not ready";
                }
                extensions.forEach(function(ext) {
                    // console.log('call register on:', ext)
                    register(ext);
                });
            }, "register");
        }

    },

    // Topological sort algorithm from Wikipedia, credited to Tarjan 1976.
    //     http://en.wikipedia.org/wiki/Topological_sort
    _toposort: function(metadata) {
        var sorted = [];
        var visited = {};
        var visit = function(key) {
            if (key in visited || !(key in metadata)) {
                return;
            }

            visited[key] = true;
            var depends = metadata[key].dependencies;
            if (!util.none(depends)) {
                for (var dependName in depends) {
                    visit(dependName);
                }
            }

            sorted.push(key);
        };

        for (var key in metadata) {
            visit(key);
        }

        return sorted;
    },

    loadMetadata: function(metadata) {
        var plugins = this.plugins;
        
        var pluginName;

        for (pluginName in metadata) {
            // Skip if the plugin is not activated.
            if (this.deactivatedPlugins[pluginName]) {
                continue;
            }

            var md = metadata[pluginName];
            if (md.errors) {
                console.error("Plugin ", pluginName, " has errors:");
                md.errors.forEach(function(error) {
                    console.error(error);
                });
                delete metadata[pluginName];
                continue;
            }

            if (md.dependencies) {
                md.depends = Object.keys(md.dependencies);
            }

            md.name = pluginName;
            md.version = null;
            // console.log("loading metadata for", pluginName, " -> ", md);

            var packageId = browser.canonicalPackageId(pluginName);
            if (packageId === null) {
                browser.register('::' + pluginName, md);
                continue;
            }
        }

        this._toposort(metadata).forEach(function(name) {
            var md = metadata[name];
            var activated = !(this.deactivatedPlugins[name]);

            md.catalog = this;
            md.name = name;
            var plugin = new exports.Plugin(md);
            plugins[name] = plugin;

            // Skip if the plugin is not activated.
            if (md.provides && activated) {
                var provides = md.provides;
                for (var i = 0; i < provides.length; i++) {
                    var extension = new exports.Extension(provides[i]);
                    extension.pluginName = name;
                    provides[i] = extension;
                    var epname = extension.ep;
                    if (epname == "extensionpoint") {
                        this._registerExtensionPoint(extension);
                    } else if (epname == "extensionhandler") {
                        this._registerExtensionHandler(extension);
                    }
                    var ep = this.getExtensionPoint(extension.ep, true);
                    ep.register(extension);
                }
            } else {
                md.provides = [];
            }
        }, this);

        for (pluginName in metadata) {
            this._checkLoops(pluginName, plugins, []);
        }

        this.orderExtensions();
    },

    /**
     * Loads the named plugin, returning a promise called
     * when the plugin is loaded. This function is a convenience
     * for unusual situations and debugging only. Generally,
     * you should load plugins by calling load() on an Extension
     * object.
     */
    loadPlugin: function(pluginName) {
        var pr = new Promise();
        var plugin = this.plugins[pluginName];
        if (plugin.objects) {
            var objectPromises = [];
            plugin.objects.forEach(function(objectName) {
                objectPromises.push(this.createObject(objectName));
            }.bind(this));
            group(objectPromises).then(function() {
                require.ensurePackage(pluginName, function() {
                    pr.resolve();
                });
            });
        } else {
            require.ensurePackage(pluginName, function() {
                pr.resolve();
            });
        }
        return pr;
    },

    /**
     * Retrieve metadata from the server. Returns a promise that is
     * resolved when the metadata has been loaded.
     */
    loadMetadataFromURL: function(url, type) {
        var pr = new Promise();
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState !== 4) {
                return;
            }

            var status = req.status;
            if (status !== 0 && status !== 200) {
                pr.reject("XHR error: " + req.statusText);
                return;
            }

            this.loadMetadata(JSON.parse(req.responseText));
            pr.resolve();
        }.bind(this);

        req.open("GET", url, true);
        req.send();

        return pr;
    },

    deactivatePlugin: function(pluginName) {
        var plugin = this.plugins[pluginName];
        if (plugin !== undefined) {
            plugin.unregister();
            plugin._cleanup();
        }

        this.deactivatedPlugins[pluginName] = true;
    },

    /**
     * Removes a plugin, unregistering it and cleaning up.
     */
    removePlugin: function(pluginName) {
        var plugin = this.plugins[pluginName];
        if (plugin == undefined) {
            throw new Error("Attempted to remove plugin " + pluginName
                                            + " which does not exist.");
        }

        plugin.unregister();
        plugin._cleanup();
        delete this.plugins[pluginName];
    },

    /**
     * for the given plugin, get the first part of the URL required to
     * get at that plugin's resources (images, etc.).
     */
    getResourceURL: function(pluginName) {
        var link = document.getElementById("bespin_base");
        var base = "";
        if (link) {
            base += link.href;
            if (!util.endsWith(base, "/")) {
                base += "/";
            }
        }
        var plugin = this.plugins[pluginName];
        if (plugin == undefined) {
            return undefined;
        }
        return base + plugin.resourceURL;
    },

    /**
     * Check the dependency graph to ensure we don't have cycles.
     */
    _checkLoops: function(pluginName, data, trail) {
        var circular = false;
        trail.forEach(function(node) {
            if (pluginName === node) {
                console.error("Circular dependency", pluginName, trail);
                circular = true;
            }
        });
        if (circular) {
            return true;
        }
        trail.push(pluginName);
        if (!data[pluginName]) {
            console.error("Missing metadata for ", pluginName);
        } else {
            if (data[pluginName].dependencies) {
                for (var dependency in data[pluginName].dependencies) {
                    var trailClone = trail.slice();
                    var errors = this._checkLoops(dependency, data, trailClone);
                    if (errors) {
                        console.error("Errors found when looking at ", pluginName);
                        return true;
                    }
                }
            }
        }
        return false;
    },

    /**
     * Retrieve an array of the plugin objects.
     * The opts object can include the following options:
     * onlyType (string): only include plugins of this type
     * sortBy (array): list of keys to sort by (the primary sort is first).
     *                 default is sorted alphabetically by name.
     */
    getPlugins: function(opts) {
        var result = [];
        var onlyType = opts.onlyType;

        for (var key in this.plugins) {
            var plugin = this.plugins[key];

            // apply the filter
            if ((onlyType && plugin.type && plugin.type != onlyType)
                || plugin.name == "bespin") {
                continue;
            }

            result.push(plugin);
        }

        var sortBy = opts.sortBy;
        if (!sortBy) {
            sortBy = ["name"];
        }

        var sortfunc = function(a, b) {
            for (var i = 0; i < sortBy.length; i++) {
                key = sortBy[i];
                if (a[key] < b[key]) {
                    return -1;
                } else if (b[key] < a[key]) {
                    return 1;
                }
            }
            return 0;
        };

        result.sort(sortfunc);
        return result;
    },

    /**
     * Returns a promise to retrieve the object at the given property path,
     * loading the plugin if necessary.
     */
    loadObjectForPropertyPath: function(path, context) {
        var promise = new Promise();
        var parts = /^([^:]+):([^#]+)#(.*)$/.exec(path);
        if (parts === null) {
            throw new Error("loadObjectForPropertyPath: malformed path: '" +
                path + "'");
        }

        var pluginName = parts[1];
        if (pluginName === "") {
            if (util.none(context)) {
                throw new Error("loadObjectForPropertyPath: no plugin name " +
                    "supplied and no context is present");
            }

            pluginName = context;
        }

        require.ensurePackage(pluginName, function() {
            promise.resolve(this.objectForPropertyPath(path));
        }.bind(this));

        return promise;
    },

    /**
     * Finds the object for the passed path or array of path components.  This is
     * the standard method used in SproutCore to traverse object paths.
     * @param path {String} the path
     * @param root {Object} optional root object.  window is used otherwise
     * @param stopAt {Integer} optional point to stop searching the path.
     * @returns {Object} the found object or undefined.
     */
    objectForPropertyPath: function(path, root, stopAt) {
        stopAt = (stopAt == undefined) ? path.length : stopAt;
        if (!root) {
            root = window;
        }

        var hashed = path.split("#");
        if (hashed.length !== 1) {
            var module = require(hashed[0]);
            if (module === undefined) {
                return undefined;
            }

            path = hashed[1];
            root = module;
            stopAt = stopAt - hashed[0].length;
        }

        var loc = 0;
        while (root && loc < stopAt) {
            var nextDotAt = path.indexOf('.', loc);
            if (nextDotAt < 0 || nextDotAt > stopAt) {
                nextDotAt = stopAt;
            }
            var key = path.slice(loc, nextDotAt);
            root = root[key];
            loc = nextDotAt + 1;
        }

        if (loc < stopAt) {
            root = undefined; // hit a dead end. :(
        }

        return root;
    },

    /**
     * Publish <tt>value</tt> to all plugins that match both <tt>ep</tt> and
     * <tt>key</tt>.
     * @param source {object} The source calling the publish function.
     * @param ep {string} An extension point (indexed by the catalog) to which
     * we publish the information.
     * @param key {string} A key to which we publish (linearly searched, allowing
     * for regex matching).
     * @param value {object} The data to be passed to the subscribing function.
     */
    publish: function(source, ep, key, value) {
        var subscriptions = this.getExtensions(ep);
        subscriptions.forEach(function(sub) {
            // compile regexes only once
            if (sub.match && !sub.regexp) {
                sub.regexp = new RegExp(sub.match);
            }
            if (sub.regexp && sub.regexp.test(key)
                    || sub.key === key
                    || (util.none(sub.key) && util.none(key))) {
                sub.load().then(function(handler) {
                    handler(source, key, value);
                });
            }
        });
    },

    /**
     * The subscribe side of #publish for use when the object which will
     * publishes is created dynamically.
     * @param ep The extension point name to subscribe to
     * @param metadata An object containing:
     * <ul>
     * <li>pointer: A function which should be called on matching publish().
     * This can also be specified as a pointer string, however if you can do
     * that, you should be placing the metadata in package.json.
     * <li>key: A string that exactly matches the key passed to the publish()
     * function. For smarter matching, you can use 'match' instead...
     * <li>match: A regexp to be used in place of key
     * </ul>
     */
    registerExtension: function(ep, metadata) {
        var extension = new exports.Extension(metadata);
        extension.pluginName = '__dynamic';
        this.getExtensionPoint(ep).register(extension);
    }
};

exports.catalog = new exports.Catalog();

var _removeFromList = function(regex, array, matchFunc) {
    var i = 0;
    while (i < array.length) {
        if (regex.exec(array[i])) {
            var item = array.splice(i, 1);
            if (matchFunc) {
                matchFunc(item);
            }
            continue;
        }
        i++;
    }
};

var _removeFromObject = function(regex, obj) {
    var keys = Object.keys(obj);
    var i = keys.length;
    while (--i > 0) {
        if (regex.exec(keys[i])) {
            delete obj[keys[i]];
        }
    }
};

exports.getUserPlugins = function() {
    return exports.catalog.getPlugins({ onlyType: 'user' });
};
