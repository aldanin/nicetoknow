
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        for (const key in attributes) {
            if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key in node) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFoundation = /** @class */ (function () {
        function MDCFoundation(adapter) {
            if (adapter === void 0) { adapter = {}; }
            this.adapter_ = adapter;
        }
        Object.defineProperty(MDCFoundation, "cssClasses", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports every
                // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "strings", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "numbers", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "defaultAdapter", {
            get: function () {
                // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
                // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
                // validation.
                return {};
            },
            enumerable: true,
            configurable: true
        });
        MDCFoundation.prototype.init = function () {
            // Subclasses should override this method to perform initialization routines (registering events, etc.)
        };
        MDCFoundation.prototype.destroy = function () {
            // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
        };
        return MDCFoundation;
    }());
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCComponent = /** @class */ (function () {
        function MDCComponent(root, foundation) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.root_ = root;
            this.initialize.apply(this, __spread(args));
            // Note that we initialize foundation here and not within the constructor's default param so that
            // this.root_ is defined and can be used within the foundation class.
            this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
            this.foundation_.init();
            this.initialSyncWithDOM();
        }
        MDCComponent.attachTo = function (root) {
            // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
            // returns an instantiated component with its root set to that element. Also note that in the cases of
            // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
            // from getDefaultFoundation().
            return new MDCComponent(root, new MDCFoundation({}));
        };
        /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
        MDCComponent.prototype.initialize = function () {
            var _args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _args[_i] = arguments[_i];
            }
            // Subclasses can override this to do any additional setup work that would be considered part of a
            // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
            // initialized. Any additional arguments besides root and foundation will be passed in here.
        };
        MDCComponent.prototype.getDefaultFoundation = function () {
            // Subclasses must override this method to return a properly configured foundation class for the
            // component.
            throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
                'foundation class');
        };
        MDCComponent.prototype.initialSyncWithDOM = function () {
            // Subclasses should override this method if they need to perform work to synchronize with a host DOM
            // object. An example of this would be a form control wrapper that needs to synchronize its internal state
            // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
            // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
        };
        MDCComponent.prototype.destroy = function () {
            // Subclasses may implement this method to release any resources / deregister any listeners they have
            // attached. An example of this might be deregistering a resize event from the window object.
            this.foundation_.destroy();
        };
        MDCComponent.prototype.listen = function (evtType, handler, options) {
            this.root_.addEventListener(evtType, handler, options);
        };
        MDCComponent.prototype.unlisten = function (evtType, handler, options) {
            this.root_.removeEventListener(evtType, handler, options);
        };
        /**
         * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
         */
        MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
            if (shouldBubble === void 0) { shouldBubble = false; }
            var evt;
            if (typeof CustomEvent === 'function') {
                evt = new CustomEvent(evtType, {
                    bubbles: shouldBubble,
                    detail: evtData,
                });
            }
            else {
                evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(evtType, shouldBubble, false, evtData);
            }
            this.root_.dispatchEvent(evt);
        };
        return MDCComponent;
    }());
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from applyPassive to avoid redundant processing to detect
     * passive event listener support.
     */
    var supportsPassive_;
    /**
     * Determine whether the current browser supports passive event listeners, and
     * if so, use them.
     */
    function applyPassive(globalObj, forceRefresh) {
        if (globalObj === void 0) { globalObj = window; }
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (supportsPassive_ === undefined || forceRefresh) {
            var isSupported_1 = false;
            try {
                globalObj.document.addEventListener('test', function () { return undefined; }, {
                    get passive() {
                        isSupported_1 = true;
                        return isSupported_1;
                    },
                });
            }
            catch (e) {
            } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
            supportsPassive_ = isSupported_1;
        }
        return supportsPassive_ ? { passive: true } : false;
    }
    //# sourceMappingURL=events.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
     * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
     */
    function closest(element, selector) {
        if (element.closest) {
            return element.closest(selector);
        }
        var el = element;
        while (el) {
            if (matches(el, selector)) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }
    function matches(element, selector) {
        var nativeMatches = element.matches
            || element.webkitMatchesSelector
            || element.msMatchesSelector;
        return nativeMatches.call(element, selector);
    }
    //# sourceMappingURL=ponyfill.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses = {
        // Ripple is a special case where the "root" component is really a "mixin" of sorts,
        // given that it's an 'upgrade' to an existing component. That being said it is the root
        // CSS class that all other CSS classes derive from.
        BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
        FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
        FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
        ROOT: 'mdc-ripple-upgraded',
        UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
    };
    var strings = {
        VAR_FG_SCALE: '--mdc-ripple-fg-scale',
        VAR_FG_SIZE: '--mdc-ripple-fg-size',
        VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
        VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
        VAR_LEFT: '--mdc-ripple-left',
        VAR_TOP: '--mdc-ripple-top',
    };
    var numbers = {
        DEACTIVATION_TIMEOUT_MS: 225,
        FG_DEACTIVATION_MS: 150,
        INITIAL_ORIGIN_SCALE: 0.6,
        PADDING: 10,
        TAP_DELAY_MS: 300,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * Stores result from supportsCssVariables to avoid redundant processing to
     * detect CSS custom variable support.
     */
    var supportsCssVariables_;
    function detectEdgePseudoVarBug(windowObj) {
        // Detect versions of Edge with buggy var() support
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
        var document = windowObj.document;
        var node = document.createElement('div');
        node.className = 'mdc-ripple-surface--test-edge-var-bug';
        // Append to head instead of body because this script might be invoked in the
        // head, in which case the body doesn't exist yet. The probe works either way.
        document.head.appendChild(node);
        // The bug exists if ::before style ends up propagating to the parent element.
        // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
        // but Firefox is known to support CSS custom properties correctly.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        var computedStyle = windowObj.getComputedStyle(node);
        var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return hasPseudoVarBug;
    }
    function supportsCssVariables(windowObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        var CSS = windowObj.CSS;
        var supportsCssVars = supportsCssVariables_;
        if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
            return supportsCssVariables_;
        }
        var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
        if (!supportsFunctionPresent) {
            return false;
        }
        var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
        // See: https://bugs.webkit.org/show_bug.cgi?id=154669
        // See: README section on Safari
        var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
            CSS.supports('color', '#00000000'));
        if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
            supportsCssVars = !detectEdgePseudoVarBug(windowObj);
        }
        else {
            supportsCssVars = false;
        }
        if (!forceRefresh) {
            supportsCssVariables_ = supportsCssVars;
        }
        return supportsCssVars;
    }
    function getNormalizedEventCoords(evt, pageOffset, clientRect) {
        if (!evt) {
            return { x: 0, y: 0 };
        }
        var x = pageOffset.x, y = pageOffset.y;
        var documentX = x + clientRect.left;
        var documentY = y + clientRect.top;
        var normalizedX;
        var normalizedY;
        // Determine touch point relative to the ripple container.
        if (evt.type === 'touchstart') {
            var touchEvent = evt;
            normalizedX = touchEvent.changedTouches[0].pageX - documentX;
            normalizedY = touchEvent.changedTouches[0].pageY - documentY;
        }
        else {
            var mouseEvent = evt;
            normalizedX = mouseEvent.pageX - documentX;
            normalizedY = mouseEvent.pageY - documentY;
        }
        return { x: normalizedX, y: normalizedY };
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    // Activation events registered on the root element of each instance for activation
    var ACTIVATION_EVENT_TYPES = [
        'touchstart', 'pointerdown', 'mousedown', 'keydown',
    ];
    // Deactivation events registered on documentElement when a pointer-related down event occurs
    var POINTER_DEACTIVATION_EVENT_TYPES = [
        'touchend', 'pointerup', 'mouseup', 'contextmenu',
    ];
    // simultaneous nested activations
    var activatedTargets = [];
    var MDCRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCRippleFoundation, _super);
        function MDCRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
            _this.activationAnimationHasEnded_ = false;
            _this.activationTimer_ = 0;
            _this.fgDeactivationRemovalTimer_ = 0;
            _this.fgScale_ = '0';
            _this.frame_ = { width: 0, height: 0 };
            _this.initialSize_ = 0;
            _this.layoutFrame_ = 0;
            _this.maxRadius_ = 0;
            _this.unboundedCoords_ = { left: 0, top: 0 };
            _this.activationState_ = _this.defaultActivationState_();
            _this.activationTimerCallback_ = function () {
                _this.activationAnimationHasEnded_ = true;
                _this.runDeactivationUXLogicIfReady_();
            };
            _this.activateHandler_ = function (e) { return _this.activate_(e); };
            _this.deactivateHandler_ = function () { return _this.deactivate_(); };
            _this.focusHandler_ = function () { return _this.handleFocus(); };
            _this.blurHandler_ = function () { return _this.handleBlur(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "strings", {
            get: function () {
                return strings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "numbers", {
            get: function () {
                return numbers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    browserSupportsCssVars: function () { return true; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    containsEventTarget: function () { return true; },
                    deregisterDocumentInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                    isSurfaceActive: function () { return true; },
                    isSurfaceDisabled: function () { return true; },
                    isUnbounded: function () { return true; },
                    registerDocumentInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    updateCssVariable: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRippleFoundation.prototype.init = function () {
            var _this = this;
            var supportsPressRipple = this.supportsPressRipple_();
            this.registerRootHandlers_(supportsPressRipple);
            if (supportsPressRipple) {
                var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.addClass(ROOT_1);
                    if (_this.adapter_.isUnbounded()) {
                        _this.adapter_.addClass(UNBOUNDED_1);
                        // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                        _this.layoutInternal_();
                    }
                });
            }
        };
        MDCRippleFoundation.prototype.destroy = function () {
            var _this = this;
            if (this.supportsPressRipple_()) {
                if (this.activationTimer_) {
                    clearTimeout(this.activationTimer_);
                    this.activationTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
                }
                if (this.fgDeactivationRemovalTimer_) {
                    clearTimeout(this.fgDeactivationRemovalTimer_);
                    this.fgDeactivationRemovalTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
                }
                var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.removeClass(ROOT_2);
                    _this.adapter_.removeClass(UNBOUNDED_2);
                    _this.removeCssVars_();
                });
            }
            this.deregisterRootHandlers_();
            this.deregisterDeactivationHandlers_();
        };
        /**
         * @param evt Optional event containing position information.
         */
        MDCRippleFoundation.prototype.activate = function (evt) {
            this.activate_(evt);
        };
        MDCRippleFoundation.prototype.deactivate = function () {
            this.deactivate_();
        };
        MDCRippleFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
            var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
            if (unbounded) {
                this.adapter_.addClass(UNBOUNDED);
            }
            else {
                this.adapter_.removeClass(UNBOUNDED);
            }
        };
        MDCRippleFoundation.prototype.handleFocus = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        MDCRippleFoundation.prototype.handleBlur = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        /**
         * We compute this property so that we are not querying information about the client
         * until the point in time where the foundation requests it. This prevents scenarios where
         * client-side feature-detection may happen too early, such as when components are rendered on the server
         * and then initialized at mount time on the client.
         */
        MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
            return this.adapter_.browserSupportsCssVars();
        };
        MDCRippleFoundation.prototype.defaultActivationState_ = function () {
            return {
                activationEvent: undefined,
                hasDeactivationUXRun: false,
                isActivated: false,
                isProgrammatic: false,
                wasActivatedByPointer: false,
                wasElementMadeActive: false,
            };
        };
        /**
         * supportsPressRipple Passed from init to save a redundant function call
         */
        MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
            var _this = this;
            if (supportsPressRipple) {
                ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
                });
                if (this.adapter_.isUnbounded()) {
                    this.adapter_.registerResizeHandler(this.resizeHandler_);
                }
            }
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
        };
        MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
            var _this = this;
            if (evt.type === 'keydown') {
                this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
            }
            else {
                POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
                });
            }
        };
        MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
            var _this = this;
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
            });
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            if (this.adapter_.isUnbounded()) {
                this.adapter_.deregisterResizeHandler(this.resizeHandler_);
            }
        };
        MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
            var _this = this;
            this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        };
        MDCRippleFoundation.prototype.removeCssVars_ = function () {
            var _this = this;
            var rippleStrings = MDCRippleFoundation.strings;
            var keys = Object.keys(rippleStrings);
            keys.forEach(function (key) {
                if (key.indexOf('VAR_') === 0) {
                    _this.adapter_.updateCssVariable(rippleStrings[key], null);
                }
            });
        };
        MDCRippleFoundation.prototype.activate_ = function (evt) {
            var _this = this;
            if (this.adapter_.isSurfaceDisabled()) {
                return;
            }
            var activationState = this.activationState_;
            if (activationState.isActivated) {
                return;
            }
            // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
            var previousActivationEvent = this.previousActivationEvent_;
            var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
            if (isSameInteraction) {
                return;
            }
            activationState.isActivated = true;
            activationState.isProgrammatic = evt === undefined;
            activationState.activationEvent = evt;
            activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
            var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
            if (hasActivatedChild) {
                // Immediately reset activation state, while preserving logic that prevents touch follow-on events
                this.resetActivationState_();
                return;
            }
            if (evt !== undefined) {
                activatedTargets.push(evt.target);
                this.registerDeactivationHandlers_(evt);
            }
            activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
            if (activationState.wasElementMadeActive) {
                this.animateActivation_();
            }
            requestAnimationFrame(function () {
                // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
                activatedTargets = [];
                if (!activationState.wasElementMadeActive
                    && evt !== undefined
                    && (evt.key === ' ' || evt.keyCode === 32)) {
                    // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                    // active states inconsistently when they're called within event handling code:
                    // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                    // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                    // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                    // variable is set within a rAF callback for a submit button interaction (#2241).
                    activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                    if (activationState.wasElementMadeActive) {
                        _this.animateActivation_();
                    }
                }
                if (!activationState.wasElementMadeActive) {
                    // Reset activation state immediately if element was not made active.
                    _this.activationState_ = _this.defaultActivationState_();
                }
            });
        };
        MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
            return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
        };
        MDCRippleFoundation.prototype.animateActivation_ = function () {
            var _this = this;
            var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
            var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
            var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
            this.layoutInternal_();
            var translateStart = '';
            var translateEnd = '';
            if (!this.adapter_.isUnbounded()) {
                var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
                translateStart = startPoint.x + "px, " + startPoint.y + "px";
                translateEnd = endPoint.x + "px, " + endPoint.y + "px";
            }
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
            // Cancel any ongoing activation/deactivation animations
            clearTimeout(this.activationTimer_);
            clearTimeout(this.fgDeactivationRemovalTimer_);
            this.rmBoundedActivationClasses_();
            this.adapter_.removeClass(FG_DEACTIVATION);
            // Force layout in order to re-trigger the animation.
            this.adapter_.computeBoundingRect();
            this.adapter_.addClass(FG_ACTIVATION);
            this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
        };
        MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
            var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
            var startPoint;
            if (wasActivatedByPointer) {
                startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
            }
            else {
                startPoint = {
                    x: this.frame_.width / 2,
                    y: this.frame_.height / 2,
                };
            }
            // Center the element around the start point.
            startPoint = {
                x: startPoint.x - (this.initialSize_ / 2),
                y: startPoint.y - (this.initialSize_ / 2),
            };
            var endPoint = {
                x: (this.frame_.width / 2) - (this.initialSize_ / 2),
                y: (this.frame_.height / 2) - (this.initialSize_ / 2),
            };
            return { startPoint: startPoint, endPoint: endPoint };
        };
        MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
            var _this = this;
            // This method is called both when a pointing device is released, and when the activation animation ends.
            // The deactivation animation should only run after both of those occur.
            var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
            var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
            var activationHasEnded = hasDeactivationUXRun || !isActivated;
            if (activationHasEnded && this.activationAnimationHasEnded_) {
                this.rmBoundedActivationClasses_();
                this.adapter_.addClass(FG_DEACTIVATION);
                this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                    _this.adapter_.removeClass(FG_DEACTIVATION);
                }, numbers.FG_DEACTIVATION_MS);
            }
        };
        MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
            var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
            this.adapter_.removeClass(FG_ACTIVATION);
            this.activationAnimationHasEnded_ = false;
            this.adapter_.computeBoundingRect();
        };
        MDCRippleFoundation.prototype.resetActivationState_ = function () {
            var _this = this;
            this.previousActivationEvent_ = this.activationState_.activationEvent;
            this.activationState_ = this.defaultActivationState_();
            // Touch devices may fire additional events for the same interaction within a short time.
            // Store the previous event until it's safe to assume that subsequent events are for new interactions.
            setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
        };
        MDCRippleFoundation.prototype.deactivate_ = function () {
            var _this = this;
            var activationState = this.activationState_;
            // This can happen in scenarios such as when you have a keyup event that blurs the element.
            if (!activationState.isActivated) {
                return;
            }
            var state = __assign({}, activationState);
            if (activationState.isProgrammatic) {
                requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
                this.resetActivationState_();
            }
            else {
                this.deregisterDeactivationHandlers_();
                requestAnimationFrame(function () {
                    _this.activationState_.hasDeactivationUXRun = true;
                    _this.animateDeactivation_(state);
                    _this.resetActivationState_();
                });
            }
        };
        MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
            var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
            if (wasActivatedByPointer || wasElementMadeActive) {
                this.runDeactivationUXLogicIfReady_();
            }
        };
        MDCRippleFoundation.prototype.layoutInternal_ = function () {
            var _this = this;
            this.frame_ = this.adapter_.computeBoundingRect();
            var maxDim = Math.max(this.frame_.height, this.frame_.width);
            // Surface diameter is treated differently for unbounded vs. bounded ripples.
            // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
            // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
            // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
            // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
            // `overflow: hidden`.
            var getBoundedRadius = function () {
                var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
                return hypotenuse + MDCRippleFoundation.numbers.PADDING;
            };
            this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
            // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
            this.initialSize_ = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
            this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
            this.updateLayoutCssVars_();
        };
        MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
            var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
            this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
            this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
            if (this.adapter_.isUnbounded()) {
                this.unboundedCoords_ = {
                    left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                    top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
                };
                this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
                this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
            }
        };
        return MDCRippleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRipple = /** @class */ (function (_super) {
        __extends(MDCRipple, _super);
        function MDCRipple() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.disabled = false;
            return _this;
        }
        MDCRipple.attachTo = function (root, opts) {
            if (opts === void 0) { opts = { isUnbounded: undefined }; }
            var ripple = new MDCRipple(root);
            // Only override unbounded behavior if option is explicitly specified
            if (opts.isUnbounded !== undefined) {
                ripple.unbounded = opts.isUnbounded;
            }
            return ripple;
        };
        MDCRipple.createAdapter = function (instance) {
            return {
                addClass: function (className) { return instance.root_.classList.add(className); },
                browserSupportsCssVars: function () { return supportsCssVariables(window); },
                computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
                containsEventTarget: function (target) { return instance.root_.contains(target); },
                deregisterDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    return instance.root_.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
                isSurfaceActive: function () { return matches(instance.root_, ':active'); },
                isSurfaceDisabled: function () { return Boolean(instance.disabled); },
                isUnbounded: function () { return Boolean(instance.unbounded); },
                registerDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.addEventListener(evtType, handler, applyPassive());
                },
                registerInteractionHandler: function (evtType, handler) {
                    return instance.root_.addEventListener(evtType, handler, applyPassive());
                },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                removeClass: function (className) { return instance.root_.classList.remove(className); },
                updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
            };
        };
        Object.defineProperty(MDCRipple.prototype, "unbounded", {
            get: function () {
                return Boolean(this.unbounded_);
            },
            set: function (unbounded) {
                this.unbounded_ = Boolean(unbounded);
                this.setUnbounded_();
            },
            enumerable: true,
            configurable: true
        });
        MDCRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        MDCRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        MDCRipple.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCRipple.prototype.getDefaultFoundation = function () {
            return new MDCRippleFoundation(MDCRipple.createAdapter(this));
        };
        MDCRipple.prototype.initialSyncWithDOM = function () {
            var root = this.root_;
            this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
        };
        /**
         * Closure Compiler throws an access control error when directly accessing a
         * protected or private property inside a getter/setter, like unbounded above.
         * By accessing the protected property inside a method, we solve that problem.
         * That's why this function exists.
         */
        MDCRipple.prototype.setUnbounded_ = function () {
            this.foundation_.setUnbounded(Boolean(this.unbounded_));
        };
        return MDCRipple;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$1 = {
        ICON_BUTTON_ON: 'mdc-icon-button--on',
        ROOT: 'mdc-icon-button',
    };
    var strings$1 = {
        ARIA_PRESSED: 'aria-pressed',
        CHANGE_EVENT: 'MDCIconButtonToggle:change',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCIconButtonToggleFoundation = /** @class */ (function (_super) {
        __extends(MDCIconButtonToggleFoundation, _super);
        function MDCIconButtonToggleFoundation(adapter) {
            return _super.call(this, __assign({}, MDCIconButtonToggleFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCIconButtonToggleFoundation, "cssClasses", {
            get: function () {
                return cssClasses$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggleFoundation, "strings", {
            get: function () {
                return strings$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    notifyChange: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    setAttr: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCIconButtonToggleFoundation.prototype.init = function () {
            this.adapter_.setAttr(strings$1.ARIA_PRESSED, "" + this.isOn());
        };
        MDCIconButtonToggleFoundation.prototype.handleClick = function () {
            this.toggle();
            this.adapter_.notifyChange({ isOn: this.isOn() });
        };
        MDCIconButtonToggleFoundation.prototype.isOn = function () {
            return this.adapter_.hasClass(cssClasses$1.ICON_BUTTON_ON);
        };
        MDCIconButtonToggleFoundation.prototype.toggle = function (isOn) {
            if (isOn === void 0) { isOn = !this.isOn(); }
            if (isOn) {
                this.adapter_.addClass(cssClasses$1.ICON_BUTTON_ON);
            }
            else {
                this.adapter_.removeClass(cssClasses$1.ICON_BUTTON_ON);
            }
            this.adapter_.setAttr(strings$1.ARIA_PRESSED, "" + isOn);
        };
        return MDCIconButtonToggleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$2 = MDCIconButtonToggleFoundation.strings;
    var MDCIconButtonToggle = /** @class */ (function (_super) {
        __extends(MDCIconButtonToggle, _super);
        function MDCIconButtonToggle() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ripple_ = _this.createRipple_();
            return _this;
        }
        MDCIconButtonToggle.attachTo = function (root) {
            return new MDCIconButtonToggle(root);
        };
        MDCIconButtonToggle.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.handleClick_ = function () { return _this.foundation_.handleClick(); };
            this.listen('click', this.handleClick_);
        };
        MDCIconButtonToggle.prototype.destroy = function () {
            this.unlisten('click', this.handleClick_);
            this.ripple_.destroy();
            _super.prototype.destroy.call(this);
        };
        MDCIconButtonToggle.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                notifyChange: function (evtData) { return _this.emit(strings$2.CHANGE_EVENT, evtData); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setAttr: function (attrName, attrValue) { return _this.root_.setAttribute(attrName, attrValue); },
            };
            return new MDCIconButtonToggleFoundation(adapter);
        };
        Object.defineProperty(MDCIconButtonToggle.prototype, "ripple", {
            get: function () {
                return this.ripple_;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCIconButtonToggle.prototype, "on", {
            get: function () {
                return this.foundation_.isOn();
            },
            set: function (isOn) {
                this.foundation_.toggle(isOn);
            },
            enumerable: true,
            configurable: true
        });
        MDCIconButtonToggle.prototype.createRipple_ = function () {
            var ripple = new MDCRipple(this.root_);
            ripple.unbounded = true;
            return ripple;
        };
        return MDCIconButtonToggle;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    function forwardEventsBuilder(component, additionalEvents = []) {
      const events = [
        'focus', 'blur',
        'fullscreenchange', 'fullscreenerror', 'scroll',
        'cut', 'copy', 'paste',
        'keydown', 'keypress', 'keyup',
        'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
        'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
        'touchcancel', 'touchend', 'touchmove', 'touchstart',
        'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
        ...additionalEvents
      ];

      function forward(e) {
        bubble(component, e);
      }

      return node => {
        const destructors = [];

        for (let i = 0; i < events.length; i++) {
          destructors.push(listen(node, events[i], forward));
        }

        return {
          destroy: () => {
            for (let i = 0; i < destructors.length; i++) {
              destructors[i]();
            }
          }
        }
      };
    }

    function exclude(obj, keys) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cashIndex = name.indexOf('$');
        if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
          continue;
        }
        if (keys.indexOf(name) !== -1) {
          continue;
        }
        newObj[name] = obj[name];
      }

      return newObj;
    }

    function useActions(node, actions) {
      let objects = [];

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          const isArray = Array.isArray(actions[i]);
          const action = isArray ? actions[i][0] : actions[i];
          if (isArray && actions[i].length > 1) {
            objects.push(action(node, actions[i][1]));
          } else {
            objects.push(action(node));
          }
        }
      }

      return {
        update(actions) {
          if ((actions && actions.length || 0) != objects.length) {
            throw new Error('You must not change the length of an actions array.');
          }

          if (actions) {
            for (let i = 0; i < actions.length; i++) {
              if (objects[i] && 'update' in objects[i]) {
                const isArray = Array.isArray(actions[i]);
                if (isArray && actions[i].length > 1) {
                  objects[i].update(actions[i][1]);
                } else {
                  objects[i].update();
                }
              }
            }
          }
        },

        destroy() {
          for (let i = 0; i < objects.length; i++) {
            if (objects[i] && 'destroy' in objects[i]) {
              objects[i].destroy();
            }
          }
        }
      }
    }

    function Ripple(node, props = {ripple: false, unbounded: false, color: null, classForward: () => {}}) {
      let instance = null;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;
      let classList = [];

      function addClass(className) {
        const idx = classList.indexOf(className);
        if (idx === -1) {
          node.classList.add(className);
          classList.push(className);
          if (props.classForward) {
            props.classForward(classList);
            console.log('addClass', className, classList);
          }
        }
      }

      function removeClass(className) {
        const idx = classList.indexOf(className);
        if (idx !== -1) {
          node.classList.remove(className);
          classList.splice(idx, 1);
          if (props.classForward) {
            props.classForward(classList);
            console.log('removeClass', className, classList);
          }
        }
      }

      function handleProps() {
        if (props.ripple && !instance) {
          // Override the Ripple component's adapter, so that we can forward classes
          // to Svelte components that overwrite Ripple's classes.
          const _createAdapter = MDCRipple.createAdapter;
          MDCRipple.createAdapter = function(...args) {
            const adapter = _createAdapter.apply(this, args);
            adapter.addClass = function(className) {
              return addClass(className);
            };
            adapter.removeClass = function(className) {
              return removeClass(className);
            };
            return adapter;
          };
          instance = new MDCRipple(node);
          MDCRipple.createAdapter = _createAdapter;
        } else if (instance && !props.ripple) {
          instance.destroy();
          instance = null;
        }
        if (props.ripple) {
          instance.unbounded = !!props.unbounded;
          switch (props.color) {
            case 'surface':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'primary':
              addClass('mdc-ripple-surface');
              addClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'secondary':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              addClass('mdc-ripple-surface--accent');
              return;
          }
        }
        removeClass('mdc-ripple-surface');
        removeClass('mdc-ripple-surface--primary');
        removeClass('mdc-ripple-surface--accent');
      }

      handleProps();

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      function layout() {
        if (instance) {
          instance.layout();
        }
      }

      return {
        update(newProps = {ripple: false, unbounded: false, color: null, classForward: []}) {
          props = newProps;
          handleProps();
        },

        destroy() {
          if (instance) {
            instance.destroy();
            instance = null;
            removeClass('mdc-ripple-surface');
            removeClass('mdc-ripple-surface--primary');
            removeClass('mdc-ripple-surface--accent');
          }

          if (removeLayoutListener) {
            removeLayoutListener();
          }
        }
      }
    }

    /* node_modules\@smui\icon-button\IconButton.svelte generated by Svelte v3.9.1 */

    const file = "node_modules\\@smui\\icon-button\\IconButton.svelte";

    // (23:0) {:else}
    function create_else_block(ctx) {
    	var button, useActions_action, forwardEvents_action, Ripple_action, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var button_levels = [
    		{ class: "\n      mdc-icon-button\n      " + ctx.className + "\n      " + (ctx.pressed ? 'mdc-icon-button--on' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--icon' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__dismiss' : '') + "\n    " },
    		{ "aria-hidden": "true" },
    		{ "aria-pressed": ctx.pressed },
    		ctx.props
    	];

    	var button_data = {};
    	for (var i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			set_attributes(button, button_data);
    			add_location(button, file, 23, 2, 769);
    			dispose = listen(button, "MDCIconButtonToggle:change", ctx.handleChange);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			ctx.button_binding(button);
    			useActions_action = useActions.call(null, button, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, button) || {};
    			Ripple_action = Ripple.call(null, button, {ripple: ctx.ripple && !ctx.toggle, unbounded: true, color: ctx.color}) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				(changed.className || changed.pressed || changed.context) && { class: "\n      mdc-icon-button\n      " + ctx.className + "\n      " + (ctx.pressed ? 'mdc-icon-button--on' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--icon' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__dismiss' : '') + "\n    " },
    				{ "aria-hidden": "true" },
    				(changed.pressed) && { "aria-pressed": ctx.pressed },
    				(changed.props) && ctx.props
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}

    			if (typeof Ripple_action.update === 'function' && (changed.ripple || changed.toggle || changed.color)) {
    				Ripple_action.update.call(null, {ripple: ctx.ripple && !ctx.toggle, unbounded: true, color: ctx.color});
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.button_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    			if (Ripple_action && typeof Ripple_action.destroy === 'function') Ripple_action.destroy();
    			dispose();
    		}
    	};
    }

    // (1:0) {#if href}
    function create_if_block(ctx) {
    	var a, useActions_action, forwardEvents_action, Ripple_action, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var a_levels = [
    		{ class: "\n      mdc-icon-button\n      " + ctx.className + "\n      " + (ctx.pressed ? 'mdc-icon-button--on' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--icon' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__dismiss' : '') + "\n    " },
    		{ "aria-hidden": "true" },
    		{ "aria-pressed": ctx.pressed },
    		{ href: ctx.href },
    		ctx.props
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			set_attributes(a, a_data);
    			add_location(a, file, 1, 2, 13);
    			dispose = listen(a, "MDCIconButtonToggle:change", ctx.handleChange);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			ctx.a_binding(a);
    			useActions_action = useActions.call(null, a, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, a) || {};
    			Ripple_action = Ripple.call(null, a, {ripple: ctx.ripple && !ctx.toggle, unbounded: true, color: ctx.color}) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.className || changed.pressed || changed.context) && { class: "\n      mdc-icon-button\n      " + ctx.className + "\n      " + (ctx.pressed ? 'mdc-icon-button--on' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--icon' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__dismiss' : '') + "\n    " },
    				{ "aria-hidden": "true" },
    				(changed.pressed) && { "aria-pressed": ctx.pressed },
    				(changed.href) && { href: ctx.href },
    				(changed.props) && ctx.props
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}

    			if (typeof Ripple_action.update === 'function' && (changed.ripple || changed.toggle || changed.color)) {
    				Ripple_action.update.call(null, {ripple: ctx.ripple && !ctx.toggle, unbounded: true, color: ctx.color});
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.a_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    			if (Ripple_action && typeof Ripple_action.destroy === 'function') Ripple_action.destroy();
    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.href) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component, ['MDCIconButtonToggle:change']);

      let { use = [], class: className = '', ripple = true, color = null, toggle = false, pressed = false, href = null } = $$props;

      let element;
      let toggleButton;
      let context = getContext('SMUI:icon-button:context');

      setContext('SMUI:icon:context', 'icon-button');

      let oldToggle = null;

      onDestroy(() => {
        toggleButton && toggleButton.destroy();
      });

      function handleChange(e) {
        $$invalidate('pressed', pressed = e.detail.isOn);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function a_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('ripple' in $$new_props) $$invalidate('ripple', ripple = $$new_props.ripple);
    		if ('color' in $$new_props) $$invalidate('color', color = $$new_props.color);
    		if ('toggle' in $$new_props) $$invalidate('toggle', toggle = $$new_props.toggle);
    		if ('pressed' in $$new_props) $$invalidate('pressed', pressed = $$new_props.pressed);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	let props;

    	$$self.$$.update = ($$dirty = { $$props: 1, element: 1, toggle: 1, oldToggle: 1, ripple: 1, toggleButton: 1, pressed: 1 }) => {
    		$$invalidate('props', props = exclude($$props, ['use', 'class', 'ripple', 'color', 'toggle', 'pressed', 'href']));
    		if ($$dirty.element || $$dirty.toggle || $$dirty.oldToggle || $$dirty.ripple || $$dirty.toggleButton || $$dirty.pressed) { if (element && toggle !== oldToggle) {
            if (toggle) {
              $$invalidate('toggleButton', toggleButton = new MDCIconButtonToggle(element));
              if (!ripple) {
                toggleButton.ripple.destroy();
              }
              toggleButton.on = pressed; $$invalidate('toggleButton', toggleButton), $$invalidate('element', element), $$invalidate('toggle', toggle), $$invalidate('oldToggle', oldToggle), $$invalidate('ripple', ripple), $$invalidate('pressed', pressed);
            } else if (oldToggle) {
              toggleButton && toggleButton.destroy();
              $$invalidate('toggleButton', toggleButton = null);
            }
            $$invalidate('oldToggle', oldToggle = toggle);
          } }
    		if ($$dirty.toggleButton || $$dirty.pressed) { if (toggleButton && toggleButton.on !== pressed) {
            toggleButton.on = pressed; $$invalidate('toggleButton', toggleButton), $$invalidate('element', element), $$invalidate('toggle', toggle), $$invalidate('oldToggle', oldToggle), $$invalidate('ripple', ripple), $$invalidate('pressed', pressed);
          } }
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		color,
    		toggle,
    		pressed,
    		href,
    		element,
    		context,
    		handleChange,
    		props,
    		a_binding,
    		button_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class IconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["use", "class", "ripple", "color", "toggle", "pressed", "href"]);
    	}

    	get use() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pressed() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pressed(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Icon.svelte generated by Svelte v3.9.1 */

    const file$1 = "node_modules\\@smui\\common\\Icon.svelte";

    function create_fragment$1(ctx) {
    	var i, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var i_levels = [
    		{ class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__icon' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__icon' : '') + "\n    " + (ctx.context === 'icon-button' ? 'mdc-icon-button__icon' : '') + "\n    " + ((ctx.context === 'icon-button' && ctx.on) ? 'mdc-icon-button__icon--on' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__icon' : '') + "\n    " + ((ctx.context === 'chip' && ctx.leading) ? 'mdc-chip__icon--leading' : '') + "\n    " + ((ctx.context === 'chip' && ctx.leadingHidden) ? 'mdc-chip__icon--leading-hidden' : '') + "\n    " + ((ctx.context === 'chip' && ctx.trailing) ? 'mdc-chip__icon--trailing' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__icon' : '') + "\n  " },
    		{ "aria-hidden": "true" },
    		exclude(ctx.$$props, ['use', 'class', 'on', 'leading', 'leadingHidden', 'trailing'])
    	];

    	var i_data = {};
    	for (var i_1 = 0; i_1 < i_levels.length; i_1 += 1) {
    		i_data = assign(i_data, i_levels[i_1]);
    	}

    	return {
    		c: function create() {
    			i = element("i");

    			if (default_slot) default_slot.c();

    			set_attributes(i, i_data);
    			add_location(i, file$1, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(i_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, i, anchor);

    			if (default_slot) {
    				default_slot.m(i, null);
    			}

    			useActions_action = useActions.call(null, i, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, i) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(i, get_spread_update(i_levels, [
    				(changed.className || changed.context || changed.on || changed.leading || changed.leadingHidden || changed.trailing) && { class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__icon' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__icon' : '') + "\n    " + (ctx.context === 'icon-button' ? 'mdc-icon-button__icon' : '') + "\n    " + ((ctx.context === 'icon-button' && ctx.on) ? 'mdc-icon-button__icon--on' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__icon' : '') + "\n    " + ((ctx.context === 'chip' && ctx.leading) ? 'mdc-chip__icon--leading' : '') + "\n    " + ((ctx.context === 'chip' && ctx.leadingHidden) ? 'mdc-chip__icon--leading-hidden' : '') + "\n    " + ((ctx.context === 'chip' && ctx.trailing) ? 'mdc-chip__icon--trailing' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__icon' : '') + "\n  " },
    				{ "aria-hidden": "true" },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'on', 'leading', 'leadingHidden', 'trailing'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(i);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', on = false, leading = false, leadingHidden = false, trailing = false } = $$props;

      const context = getContext('SMUI:icon:context');

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('on' in $$new_props) $$invalidate('on', on = $$new_props.on);
    		if ('leading' in $$new_props) $$invalidate('leading', leading = $$new_props.leading);
    		if ('leadingHidden' in $$new_props) $$invalidate('leadingHidden', leadingHidden = $$new_props.leadingHidden);
    		if ('trailing' in $$new_props) $$invalidate('trailing', trailing = $$new_props.trailing);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		on,
    		leading,
    		leadingHidden,
    		trailing,
    		context,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["use", "class", "on", "leading", "leadingHidden", "trailing"]);
    	}

    	get use() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get on() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set on(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leading() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leading(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get leadingHidden() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leadingHidden(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get trailing() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set trailing(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\MyIconButton.svelte generated by Svelte v3.9.1 */

    // (20:0) <IconButton class="material-icons"              on:click={onClick}              title={title}>
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text(ctx.icon);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.icon) {
    				set_data(t, ctx.icon);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var current;

    	var iconbutton = new IconButton({
    		props: {
    		class: "material-icons",
    		title: ctx.title,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton.$on("click", ctx.onClick);

    	return {
    		c: function create() {
    			iconbutton.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconbutton_changes = {};
    			if (changed.title) iconbutton_changes.title = ctx.title;
    			if (changed.$$scope || changed.icon) iconbutton_changes.$$scope = { changed, ctx };
    			iconbutton.$set(iconbutton_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	
        const dispatch = createEventDispatcher();

        let { title='', icon } = $$props;
        function onClick(e) {
            dispatch('click', e);

        }

    	const writable_props = ['title', 'icon'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<MyIconButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    	};

    	return { title, icon, onClick };
    }

    class MyIconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["title", "icon"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.icon === undefined && !('icon' in props)) {
    			console.warn("<MyIconButton> was created without expected prop 'icon'");
    		}
    	}

    	get title() {
    		throw new Error("<MyIconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MyIconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<MyIconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<MyIconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var O = 'object';
    var check = function (it) {
      return it && it.Math == Math && it;
    };

    // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
    var global_1 =
      // eslint-disable-next-line no-undef
      check(typeof globalThis == O && globalThis) ||
      check(typeof window == O && window) ||
      check(typeof self == O && self) ||
      check(typeof commonjsGlobal == O && commonjsGlobal) ||
      // eslint-disable-next-line no-new-func
      Function('return this')();

    var fails = function (exec) {
      try {
        return !!exec();
      } catch (error) {
        return true;
      }
    };

    // Thank's IE8 for his funny defineProperty
    var descriptors = !fails(function () {
      return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
    });

    var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

    // Nashorn ~ JDK8 bug
    var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

    // `Object.prototype.propertyIsEnumerable` method implementation
    // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
    var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
      var descriptor = getOwnPropertyDescriptor(this, V);
      return !!descriptor && descriptor.enumerable;
    } : nativePropertyIsEnumerable;

    var objectPropertyIsEnumerable = {
    	f: f
    };

    var createPropertyDescriptor = function (bitmap, value) {
      return {
        enumerable: !(bitmap & 1),
        configurable: !(bitmap & 2),
        writable: !(bitmap & 4),
        value: value
      };
    };

    var toString = {}.toString;

    var classofRaw = function (it) {
      return toString.call(it).slice(8, -1);
    };

    var split = ''.split;

    // fallback for non-array-like ES3 and non-enumerable old V8 strings
    var indexedObject = fails(function () {
      // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
      // eslint-disable-next-line no-prototype-builtins
      return !Object('z').propertyIsEnumerable(0);
    }) ? function (it) {
      return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
    } : Object;

    // `RequireObjectCoercible` abstract operation
    // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
    var requireObjectCoercible = function (it) {
      if (it == undefined) throw TypeError("Can't call method on " + it);
      return it;
    };

    // toObject with fallback for non-array-like ES3 strings



    var toIndexedObject = function (it) {
      return indexedObject(requireObjectCoercible(it));
    };

    var isObject = function (it) {
      return typeof it === 'object' ? it !== null : typeof it === 'function';
    };

    // `ToPrimitive` abstract operation
    // https://tc39.github.io/ecma262/#sec-toprimitive
    // instead of the ES6 spec version, we didn't implement @@toPrimitive case
    // and the second argument - flag - preferred type is a string
    var toPrimitive = function (input, PREFERRED_STRING) {
      if (!isObject(input)) return input;
      var fn, val;
      if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
      if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
      if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
      throw TypeError("Can't convert object to primitive value");
    };

    var hasOwnProperty = {}.hasOwnProperty;

    var has = function (it, key) {
      return hasOwnProperty.call(it, key);
    };

    var document$1 = global_1.document;
    // typeof document.createElement is 'object' in old IE
    var EXISTS = isObject(document$1) && isObject(document$1.createElement);

    var documentCreateElement = function (it) {
      return EXISTS ? document$1.createElement(it) : {};
    };

    // Thank's IE8 for his funny defineProperty
    var ie8DomDefine = !descriptors && !fails(function () {
      return Object.defineProperty(documentCreateElement('div'), 'a', {
        get: function () { return 7; }
      }).a != 7;
    });

    var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
    var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
      O = toIndexedObject(O);
      P = toPrimitive(P, true);
      if (ie8DomDefine) try {
        return nativeGetOwnPropertyDescriptor(O, P);
      } catch (error) { /* empty */ }
      if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
    };

    var objectGetOwnPropertyDescriptor = {
    	f: f$1
    };

    var anObject = function (it) {
      if (!isObject(it)) {
        throw TypeError(String(it) + ' is not an object');
      } return it;
    };

    var nativeDefineProperty = Object.defineProperty;

    // `Object.defineProperty` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperty
    var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
      anObject(O);
      P = toPrimitive(P, true);
      anObject(Attributes);
      if (ie8DomDefine) try {
        return nativeDefineProperty(O, P, Attributes);
      } catch (error) { /* empty */ }
      if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
      if ('value' in Attributes) O[P] = Attributes.value;
      return O;
    };

    var objectDefineProperty = {
    	f: f$2
    };

    var hide = descriptors ? function (object, key, value) {
      return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
    } : function (object, key, value) {
      object[key] = value;
      return object;
    };

    var setGlobal = function (key, value) {
      try {
        hide(global_1, key, value);
      } catch (error) {
        global_1[key] = value;
      } return value;
    };

    var isPure = false;

    var shared = createCommonjsModule(function (module) {
    var SHARED = '__core-js_shared__';
    var store = global_1[SHARED] || setGlobal(SHARED, {});

    (module.exports = function (key, value) {
      return store[key] || (store[key] = value !== undefined ? value : {});
    })('versions', []).push({
      version: '3.2.1',
      mode:  'global',
      copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
    });
    });

    var functionToString = shared('native-function-to-string', Function.toString);

    var WeakMap = global_1.WeakMap;

    var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(functionToString.call(WeakMap));

    var id = 0;
    var postfix = Math.random();

    var uid = function (key) {
      return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
    };

    var keys = shared('keys');

    var sharedKey = function (key) {
      return keys[key] || (keys[key] = uid(key));
    };

    var hiddenKeys = {};

    var WeakMap$1 = global_1.WeakMap;
    var set, get, has$1;

    var enforce = function (it) {
      return has$1(it) ? get(it) : set(it, {});
    };

    var getterFor = function (TYPE) {
      return function (it) {
        var state;
        if (!isObject(it) || (state = get(it)).type !== TYPE) {
          throw TypeError('Incompatible receiver, ' + TYPE + ' required');
        } return state;
      };
    };

    if (nativeWeakMap) {
      var store = new WeakMap$1();
      var wmget = store.get;
      var wmhas = store.has;
      var wmset = store.set;
      set = function (it, metadata) {
        wmset.call(store, it, metadata);
        return metadata;
      };
      get = function (it) {
        return wmget.call(store, it) || {};
      };
      has$1 = function (it) {
        return wmhas.call(store, it);
      };
    } else {
      var STATE = sharedKey('state');
      hiddenKeys[STATE] = true;
      set = function (it, metadata) {
        hide(it, STATE, metadata);
        return metadata;
      };
      get = function (it) {
        return has(it, STATE) ? it[STATE] : {};
      };
      has$1 = function (it) {
        return has(it, STATE);
      };
    }

    var internalState = {
      set: set,
      get: get,
      has: has$1,
      enforce: enforce,
      getterFor: getterFor
    };

    var redefine = createCommonjsModule(function (module) {
    var getInternalState = internalState.get;
    var enforceInternalState = internalState.enforce;
    var TEMPLATE = String(functionToString).split('toString');

    shared('inspectSource', function (it) {
      return functionToString.call(it);
    });

    (module.exports = function (O, key, value, options) {
      var unsafe = options ? !!options.unsafe : false;
      var simple = options ? !!options.enumerable : false;
      var noTargetGet = options ? !!options.noTargetGet : false;
      if (typeof value == 'function') {
        if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
        enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
      }
      if (O === global_1) {
        if (simple) O[key] = value;
        else setGlobal(key, value);
        return;
      } else if (!unsafe) {
        delete O[key];
      } else if (!noTargetGet && O[key]) {
        simple = true;
      }
      if (simple) O[key] = value;
      else hide(O, key, value);
    // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
    })(Function.prototype, 'toString', function toString() {
      return typeof this == 'function' && getInternalState(this).source || functionToString.call(this);
    });
    });

    var path = global_1;

    var aFunction = function (variable) {
      return typeof variable == 'function' ? variable : undefined;
    };

    var getBuiltIn = function (namespace, method) {
      return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
        : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
    };

    var ceil = Math.ceil;
    var floor = Math.floor;

    // `ToInteger` abstract operation
    // https://tc39.github.io/ecma262/#sec-tointeger
    var toInteger = function (argument) {
      return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
    };

    var min = Math.min;

    // `ToLength` abstract operation
    // https://tc39.github.io/ecma262/#sec-tolength
    var toLength = function (argument) {
      return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
    };

    var max = Math.max;
    var min$1 = Math.min;

    // Helper for a popular repeating case of the spec:
    // Let integer be ? ToInteger(index).
    // If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
    var toAbsoluteIndex = function (index, length) {
      var integer = toInteger(index);
      return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
    };

    // `Array.prototype.{ indexOf, includes }` methods implementation
    var createMethod = function (IS_INCLUDES) {
      return function ($this, el, fromIndex) {
        var O = toIndexedObject($this);
        var length = toLength(O.length);
        var index = toAbsoluteIndex(fromIndex, length);
        var value;
        // Array#includes uses SameValueZero equality algorithm
        // eslint-disable-next-line no-self-compare
        if (IS_INCLUDES && el != el) while (length > index) {
          value = O[index++];
          // eslint-disable-next-line no-self-compare
          if (value != value) return true;
        // Array#indexOf ignores holes, Array#includes - not
        } else for (;length > index; index++) {
          if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
        } return !IS_INCLUDES && -1;
      };
    };

    var arrayIncludes = {
      // `Array.prototype.includes` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.includes
      includes: createMethod(true),
      // `Array.prototype.indexOf` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
      indexOf: createMethod(false)
    };

    var indexOf = arrayIncludes.indexOf;


    var objectKeysInternal = function (object, names) {
      var O = toIndexedObject(object);
      var i = 0;
      var result = [];
      var key;
      for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
      // Don't enum bug & hidden keys
      while (names.length > i) if (has(O, key = names[i++])) {
        ~indexOf(result, key) || result.push(key);
      }
      return result;
    };

    // IE8- don't enum bug keys
    var enumBugKeys = [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toLocaleString',
      'toString',
      'valueOf'
    ];

    var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

    // `Object.getOwnPropertyNames` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
      return objectKeysInternal(O, hiddenKeys$1);
    };

    var objectGetOwnPropertyNames = {
    	f: f$3
    };

    var f$4 = Object.getOwnPropertySymbols;

    var objectGetOwnPropertySymbols = {
    	f: f$4
    };

    // all object keys, includes non-enumerable and symbols
    var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
      var keys = objectGetOwnPropertyNames.f(anObject(it));
      var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
      return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
    };

    var copyConstructorProperties = function (target, source) {
      var keys = ownKeys(source);
      var defineProperty = objectDefineProperty.f;
      var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
      }
    };

    var replacement = /#|\.prototype\./;

    var isForced = function (feature, detection) {
      var value = data[normalize(feature)];
      return value == POLYFILL ? true
        : value == NATIVE ? false
        : typeof detection == 'function' ? fails(detection)
        : !!detection;
    };

    var normalize = isForced.normalize = function (string) {
      return String(string).replace(replacement, '.').toLowerCase();
    };

    var data = isForced.data = {};
    var NATIVE = isForced.NATIVE = 'N';
    var POLYFILL = isForced.POLYFILL = 'P';

    var isForced_1 = isForced;

    var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






    /*
      options.target      - name of the target object
      options.global      - target is the global object
      options.stat        - export as static methods of target
      options.proto       - export as prototype methods of target
      options.real        - real prototype method for the `pure` version
      options.forced      - export even if the native feature is available
      options.bind        - bind methods to the target, required for the `pure` version
      options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
      options.unsafe      - use the simple assignment of property instead of delete + defineProperty
      options.sham        - add a flag to not completely full polyfills
      options.enumerable  - export as enumerable property
      options.noTargetGet - prevent calling a getter on target
    */
    var _export = function (options, source) {
      var TARGET = options.target;
      var GLOBAL = options.global;
      var STATIC = options.stat;
      var FORCED, target, key, targetProperty, sourceProperty, descriptor;
      if (GLOBAL) {
        target = global_1;
      } else if (STATIC) {
        target = global_1[TARGET] || setGlobal(TARGET, {});
      } else {
        target = (global_1[TARGET] || {}).prototype;
      }
      if (target) for (key in source) {
        sourceProperty = source[key];
        if (options.noTargetGet) {
          descriptor = getOwnPropertyDescriptor$1(target, key);
          targetProperty = descriptor && descriptor.value;
        } else targetProperty = target[key];
        FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
        // contained in target
        if (!FORCED && targetProperty !== undefined) {
          if (typeof sourceProperty === typeof targetProperty) continue;
          copyConstructorProperties(sourceProperty, targetProperty);
        }
        // add a flag to not completely full polyfills
        if (options.sham || (targetProperty && targetProperty.sham)) {
          hide(sourceProperty, 'sham', true);
        }
        // extend global
        redefine(target, key, sourceProperty, options);
      }
    };

    var aFunction$1 = function (it) {
      if (typeof it != 'function') {
        throw TypeError(String(it) + ' is not a function');
      } return it;
    };

    // optional / simple context binding
    var bindContext = function (fn, that, length) {
      aFunction$1(fn);
      if (that === undefined) return fn;
      switch (length) {
        case 0: return function () {
          return fn.call(that);
        };
        case 1: return function (a) {
          return fn.call(that, a);
        };
        case 2: return function (a, b) {
          return fn.call(that, a, b);
        };
        case 3: return function (a, b, c) {
          return fn.call(that, a, b, c);
        };
      }
      return function (/* ...args */) {
        return fn.apply(that, arguments);
      };
    };

    // `ToObject` abstract operation
    // https://tc39.github.io/ecma262/#sec-toobject
    var toObject = function (argument) {
      return Object(requireObjectCoercible(argument));
    };

    // `IsArray` abstract operation
    // https://tc39.github.io/ecma262/#sec-isarray
    var isArray = Array.isArray || function isArray(arg) {
      return classofRaw(arg) == 'Array';
    };

    var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
      // Chrome 38 Symbol has incorrect toString conversion
      // eslint-disable-next-line no-undef
      return !String(Symbol());
    });

    var Symbol$1 = global_1.Symbol;
    var store$1 = shared('wks');

    var wellKnownSymbol = function (name) {
      return store$1[name] || (store$1[name] = nativeSymbol && Symbol$1[name]
        || (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name));
    };

    var SPECIES = wellKnownSymbol('species');

    // `ArraySpeciesCreate` abstract operation
    // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
    var arraySpeciesCreate = function (originalArray, length) {
      var C;
      if (isArray(originalArray)) {
        C = originalArray.constructor;
        // cross-realm fallback
        if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
        else if (isObject(C)) {
          C = C[SPECIES];
          if (C === null) C = undefined;
        }
      } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
    };

    var push = [].push;

    // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
    var createMethod$1 = function (TYPE) {
      var IS_MAP = TYPE == 1;
      var IS_FILTER = TYPE == 2;
      var IS_SOME = TYPE == 3;
      var IS_EVERY = TYPE == 4;
      var IS_FIND_INDEX = TYPE == 6;
      var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
      return function ($this, callbackfn, that, specificCreate) {
        var O = toObject($this);
        var self = indexedObject(O);
        var boundFunction = bindContext(callbackfn, that, 3);
        var length = toLength(self.length);
        var index = 0;
        var create = specificCreate || arraySpeciesCreate;
        var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
        var value, result;
        for (;length > index; index++) if (NO_HOLES || index in self) {
          value = self[index];
          result = boundFunction(value, index, O);
          if (TYPE) {
            if (IS_MAP) target[index] = result; // map
            else if (result) switch (TYPE) {
              case 3: return true;              // some
              case 5: return value;             // find
              case 6: return index;             // findIndex
              case 2: push.call(target, value); // filter
            } else if (IS_EVERY) return false;  // every
          }
        }
        return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
      };
    };

    var arrayIteration = {
      // `Array.prototype.forEach` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
      forEach: createMethod$1(0),
      // `Array.prototype.map` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.map
      map: createMethod$1(1),
      // `Array.prototype.filter` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.filter
      filter: createMethod$1(2),
      // `Array.prototype.some` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.some
      some: createMethod$1(3),
      // `Array.prototype.every` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.every
      every: createMethod$1(4),
      // `Array.prototype.find` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.find
      find: createMethod$1(5),
      // `Array.prototype.findIndex` method
      // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
      findIndex: createMethod$1(6)
    };

    // `Object.keys` method
    // https://tc39.github.io/ecma262/#sec-object.keys
    var objectKeys = Object.keys || function keys(O) {
      return objectKeysInternal(O, enumBugKeys);
    };

    // `Object.defineProperties` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperties
    var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
      anObject(O);
      var keys = objectKeys(Properties);
      var length = keys.length;
      var index = 0;
      var key;
      while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
      return O;
    };

    var html = getBuiltIn('document', 'documentElement');

    var IE_PROTO = sharedKey('IE_PROTO');

    var PROTOTYPE = 'prototype';
    var Empty = function () { /* empty */ };

    // Create object with fake `null` prototype: use iframe Object with cleared prototype
    var createDict = function () {
      // Thrash, waste and sodomy: IE GC bug
      var iframe = documentCreateElement('iframe');
      var length = enumBugKeys.length;
      var lt = '<';
      var script = 'script';
      var gt = '>';
      var js = 'java' + script + ':';
      var iframeDocument;
      iframe.style.display = 'none';
      html.appendChild(iframe);
      iframe.src = String(js);
      iframeDocument = iframe.contentWindow.document;
      iframeDocument.open();
      iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
      iframeDocument.close();
      createDict = iframeDocument.F;
      while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
      return createDict();
    };

    // `Object.create` method
    // https://tc39.github.io/ecma262/#sec-object.create
    var objectCreate = Object.create || function create(O, Properties) {
      var result;
      if (O !== null) {
        Empty[PROTOTYPE] = anObject(O);
        result = new Empty();
        Empty[PROTOTYPE] = null;
        // add "__proto__" for Object.getPrototypeOf polyfill
        result[IE_PROTO] = O;
      } else result = createDict();
      return Properties === undefined ? result : objectDefineProperties(result, Properties);
    };

    hiddenKeys[IE_PROTO] = true;

    var UNSCOPABLES = wellKnownSymbol('unscopables');
    var ArrayPrototype = Array.prototype;

    // Array.prototype[@@unscopables]
    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    if (ArrayPrototype[UNSCOPABLES] == undefined) {
      hide(ArrayPrototype, UNSCOPABLES, objectCreate(null));
    }

    // add a key to Array.prototype[@@unscopables]
    var addToUnscopables = function (key) {
      ArrayPrototype[UNSCOPABLES][key] = true;
    };

    var $find = arrayIteration.find;


    var FIND = 'find';
    var SKIPS_HOLES = true;

    // Shouldn't skip holes
    if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    _export({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
      find: function find(callbackfn /* , that = undefined */) {
        return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
      }
    });

    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables(FIND);

    /* node_modules\@smui\card\Card.svelte generated by Svelte v3.9.1 */

    const file$2 = "node_modules\\@smui\\card\\Card.svelte";

    function create_fragment$3(ctx) {
    	var div, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		{ class: "\n    mdc-card\n    " + ctx.className + "\n    " + (ctx.variant === 'outlined' ? 'mdc-card--outlined' : '') + "\n    " + (ctx.padded ? 'smui-card--padded' : '') + "\n  " },
    		exclude(ctx.$$props, ['use', 'class', 'variant', 'padded'])
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$2, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			useActions_action = useActions.call(null, div, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.className || changed.variant || changed.padded) && { class: "\n    mdc-card\n    " + ctx.className + "\n    " + (ctx.variant === 'outlined' ? 'mdc-card--outlined' : '') + "\n    " + (ctx.padded ? 'smui-card--padded' : '') + "\n  " },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'variant', 'padded'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', variant = 'raised', padded = false } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
    		if ('padded' in $$new_props) $$invalidate('padded', padded = $$new_props.padded);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		variant,
    		padded,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["use", "class", "variant", "padded"]);
    	}

    	get use() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padded() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padded(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\ClassAdder.svelte generated by Svelte v3.9.1 */

    // (1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class="{smuiClass} {className}"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >
    function create_default_slot$1(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var switch_instance_anchor, current;

    	var switch_instance_spread_levels = [
    		{ use: [ctx.forwardEvents, ...ctx.use] },
    		{ class: "" + ctx.smuiClass + " " + ctx.className },
    		exclude(ctx.$$props, ['use', 'class', 'component', 'forwardEvents'])
    	];

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot$1] },
    			$$scope: { ctx }
    		};
    		for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}
    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = (changed.forwardEvents || changed.use || changed.smuiClass || changed.className || changed.exclude || changed.$$props) ? get_spread_update(switch_instance_spread_levels, [
    									(changed.forwardEvents || changed.use) && { use: [ctx.forwardEvents, ...ctx.use] },
    			(changed.smuiClass || changed.className) && { class: "" + ctx.smuiClass + " " + ctx.className },
    			(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'component', 'forwardEvents'])
    								]) : {};
    			if (changed.$$scope) switch_instance_changes.$$scope = { changed, ctx };

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    const internals = {
      component: null,
      smuiClass: null,
      contexts: {}
    };

    function instance$4($$self, $$props, $$invalidate) {
    	

      let { use = [], class: className = '', component = internals.component, forwardEvents: smuiForwardEvents = [] } = $$props;

      const smuiClass = internals.class;
      const contexts = internals.contexts;

      const forwardEvents = forwardEventsBuilder(current_component, smuiForwardEvents);

      for (let context in contexts) {
        if (contexts.hasOwnProperty(context)) {
          setContext(context, contexts[context]);
        }
      }

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('component' in $$new_props) $$invalidate('component', component = $$new_props.component);
    		if ('forwardEvents' in $$new_props) $$invalidate('smuiForwardEvents', smuiForwardEvents = $$new_props.forwardEvents);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		use,
    		className,
    		component,
    		smuiForwardEvents,
    		smuiClass,
    		forwardEvents,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class ClassAdder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["use", "class", "component", "forwardEvents"]);
    	}

    	get use() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function classAdderBuilder(props) {
      function Component(...args) {
        Object.assign(internals, props);
        return new ClassAdder(...args);
      }

      Component.prototype = ClassAdder;

      // SSR support
      if (ClassAdder.$$render) {
        Component.$$render = (...args) => Object.assign(internals, props) && ClassAdder.$$render(...args);
      }
      if (ClassAdder.render) {
        Component.render = (...args) => Object.assign(internals, props) && ClassAdder.render(...args);
      }

      return Component;
    }

    /* node_modules\@smui\common\Div.svelte generated by Svelte v3.9.1 */

    const file$3 = "node_modules\\@smui\\common\\Div.svelte";

    function create_fragment$5(ctx) {
    	var div, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		exclude(ctx.$$props, ['use'])
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$3, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			useActions_action = useActions.call(null, div, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [] } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Div extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["use"]);
    	}

    	get use() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'smui-card__content',
      component: Div,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-card__media-content',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\card\Actions.svelte generated by Svelte v3.9.1 */

    const file$4 = "node_modules\\@smui\\card\\Actions.svelte";

    function create_fragment$6(ctx) {
    	var div, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		{ class: "\n    mdc-card__actions\n    " + ctx.className + "\n    " + (ctx.fullBleed ? 'mdc-card__actions--full-bleed' : '') + "\n  " },
    		exclude(ctx.$$props, ['use', 'class', 'fullBleed'])
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$4, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			useActions_action = useActions.call(null, div, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.className || changed.fullBleed) && { class: "\n    mdc-card__actions\n    " + ctx.className + "\n    " + (ctx.fullBleed ? 'mdc-card__actions--full-bleed' : '') + "\n  " },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'fullBleed'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', fullBleed = false } = $$props;

      setContext('SMUI:button:context', 'card:action');
      setContext('SMUI:icon-button:context', 'card:action');

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('fullBleed' in $$new_props) $$invalidate('fullBleed', fullBleed = $$new_props.fullBleed);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		fullBleed,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["use", "class", "fullBleed"]);
    	}

    	get use() {
    		throw new Error("<Actions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Actions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Actions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Actions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fullBleed() {
    		throw new Error("<Actions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fullBleed(value) {
    		throw new Error("<Actions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ActionButtons = classAdderBuilder({
      class: 'mdc-card__action-buttons',
      component: Div,
      contexts: {}
    });

    var ActionIcons = classAdderBuilder({
      class: 'mdc-card__action-icons',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\common\A.svelte generated by Svelte v3.9.1 */

    const file$5 = "node_modules\\@smui\\common\\A.svelte";

    function create_fragment$7(ctx) {
    	var a, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var a_levels = [
    		{ href: ctx.href },
    		exclude(ctx.$$props, ['use', 'href'])
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			set_attributes(a, a_data);
    			add_location(a, file$5, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			useActions_action = useActions.call(null, a, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, a) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.href) && { href: ctx.href },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'href'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], href = 'javascript:void(0);' } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		href,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class A extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["use", "href"]);
    	}

    	get use() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Button.svelte generated by Svelte v3.9.1 */

    const file$6 = "node_modules\\@smui\\common\\Button.svelte";

    function create_fragment$8(ctx) {
    	var button, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var button_levels = [
    		exclude(ctx.$$props, ['use'])
    	];

    	var button_data = {};
    	for (var i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			set_attributes(button, button_data);
    			add_location(button, file$6, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			useActions_action = useActions.call(null, button, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, button) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [] } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["use"]);
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\button\Button.svelte generated by Svelte v3.9.1 */

    // (1:0) <svelte:component   this={component}   use={[[Ripple, {ripple, unbounded: false, classForward: classes => rippleClasses = classes}], forwardEvents, ...use]}   class="     mdc-button     {className}     {rippleClasses.join(' ')}     {variant === 'raised' ? 'mdc-button--raised' : ''}     {variant === 'unelevated' ? 'mdc-button--unelevated' : ''}     {variant === 'outlined' ? 'mdc-button--outlined' : ''}     {dense ? 'mdc-button--dense' : ''}     {color === 'secondary' ? 'smui-button--color-secondary' : ''}     {context === 'card:action' ? 'mdc-card__action' : ''}     {context === 'card:action' ? 'mdc-card__action--button' : ''}     {context === 'dialog:action' ? 'mdc-dialog__button' : ''}     {context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : ''}     {context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : ''}     {context === 'snackbar' ? 'mdc-snackbar__action' : ''}   "   {...actionProp}   {...defaultProp}   {...exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', ...dialogExcludes])} >
    function create_default_slot$2(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	var switch_instance_anchor, current;

    	var switch_instance_spread_levels = [
    		{ use: [[Ripple, {ripple: ctx.ripple, unbounded: false, classForward: ctx.func}], ctx.forwardEvents, ...ctx.use] },
    		{ class: "\n    mdc-button\n    " + ctx.className + "\n    " + ctx.rippleClasses.join(' ') + "\n    " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n    " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n    " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n    " + (ctx.dense ? 'mdc-button--dense' : '') + "\n    " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n    " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n    " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n    " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n    " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n    " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n  " },
    		ctx.actionProp,
    		ctx.defaultProp,
    		exclude(ctx.$$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', ...ctx.dialogExcludes])
    	];

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot$2] },
    			$$scope: { ctx }
    		};
    		for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}
    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = (changed.Ripple || changed.ripple || changed.rippleClasses || changed.forwardEvents || changed.use || changed.className || changed.variant || changed.dense || changed.color || changed.context || changed.actionProp || changed.defaultProp || changed.exclude || changed.$$props || changed.dialogExcludes) ? get_spread_update(switch_instance_spread_levels, [
    									(changed.Ripple || changed.ripple || changed.rippleClasses || changed.forwardEvents || changed.use) && { use: [[Ripple, {ripple: ctx.ripple, unbounded: false, classForward: ctx.func}], ctx.forwardEvents, ...ctx.use] },
    			(changed.className || changed.rippleClasses || changed.variant || changed.dense || changed.color || changed.context) && { class: "\n    mdc-button\n    " + ctx.className + "\n    " + ctx.rippleClasses.join(' ') + "\n    " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n    " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n    " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n    " + (ctx.dense ? 'mdc-button--dense' : '') + "\n    " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n    " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n    " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n    " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n    " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n    " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n  " },
    			(changed.actionProp) && ctx.actionProp,
    			(changed.defaultProp) && ctx.defaultProp,
    			(changed.exclude || changed.$$props || changed.dialogExcludes) && exclude(ctx.$$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', ...ctx.dialogExcludes])
    								]) : {};
    			if (changed.$$scope) switch_instance_changes.$$scope = { changed, ctx };

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', ripple = true, color = 'primary', variant = 'text', dense = false, href = null, action = 'close', default: defaultAction = false, component = href == null ? Button : A } = $$props;

      let context = getContext('SMUI:button:context');
      let rippleClasses = [];

      setContext('SMUI:label:context', 'button');
      setContext('SMUI:icon:context', 'button');

    	let { $$slots = {}, $$scope } = $$props;

    	function func(classes) {
    		const $$result = rippleClasses = classes;
    		$$invalidate('rippleClasses', rippleClasses);
    		return $$result;
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('ripple' in $$new_props) $$invalidate('ripple', ripple = $$new_props.ripple);
    		if ('color' in $$new_props) $$invalidate('color', color = $$new_props.color);
    		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
    		if ('dense' in $$new_props) $$invalidate('dense', dense = $$new_props.dense);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('action' in $$new_props) $$invalidate('action', action = $$new_props.action);
    		if ('default' in $$new_props) $$invalidate('defaultAction', defaultAction = $$new_props.default);
    		if ('component' in $$new_props) $$invalidate('component', component = $$new_props.component);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	let dialogExcludes, actionProp, defaultProp;

    	$$self.$$.update = ($$dirty = { context: 1, action: 1, defaultAction: 1 }) => {
    		if ($$dirty.context) { $$invalidate('dialogExcludes', dialogExcludes = (context === 'dialog:action') ? ['action', 'default'] : []); }
    		if ($$dirty.context || $$dirty.action) { $$invalidate('actionProp', actionProp = (context === 'dialog:action' && action !== null) ? {'data-mdc-dialog-action': action} : {}); }
    		if ($$dirty.context || $$dirty.defaultAction) { $$invalidate('defaultProp', defaultProp = (context === 'dialog:action' && defaultAction) ? {'data-mdc-dialog-button-default': ''} : {}); }
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		color,
    		variant,
    		dense,
    		href,
    		action,
    		defaultAction,
    		component,
    		context,
    		rippleClasses,
    		dialogExcludes,
    		actionProp,
    		defaultProp,
    		$$props,
    		func,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Button_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["use", "class", "ripple", "color", "variant", "dense", "href", "action", "default", "component"]);
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get default() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set default(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\Label.svelte generated by Svelte v3.9.1 */

    const file$7 = "node_modules\\@smui\\common\\Label.svelte";

    function create_fragment$a(ctx) {
    	var span, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var span_levels = [
    		{ class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__label' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__label' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__text' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__text-label' : '') + "\n    " + (ctx.context === 'image-list' ? 'mdc-image-list__label' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__label' : '') + "\n  " },
    		((ctx.context === 'snackbar') ? {role: 'status', 'aria-live': 'polite'} : {}),
    		exclude(ctx.$$props, ['use', 'class'])
    	];

    	var span_data = {};
    	for (var i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	return {
    		c: function create() {
    			span = element("span");

    			if (default_slot) default_slot.c();

    			set_attributes(span, span_data);
    			add_location(span, file$7, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			useActions_action = useActions.call(null, span, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, span) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				(changed.className || changed.context) && { class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__label' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__label' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__text' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__text-label' : '') + "\n    " + (ctx.context === 'image-list' ? 'mdc-image-list__label' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__label' : '') + "\n  " },
    				(changed.context) && ((ctx.context === 'snackbar') ? {role: 'status', 'aria-live': 'polite'} : {}),
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '' } = $$props;

      const context = getContext('SMUI:label:context');

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		context,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["use", "class"]);
    	}

    	get use() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\Avatar.svelte generated by Svelte v3.9.1 */
    const { console: console_1 } = globals;

    const file$8 = "src\\common\\Avatar.svelte";

    function create_fragment$b(ctx) {
    	var div, img;

    	return {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			attr(img, "src", ctx.imageUrl);
    			attr(img, "class", "svelte-wq6y7q");
    			add_location(img, file$8, 21, 4, 1189);
    			attr(div, "class", "avatar svelte-wq6y7q");
    			add_location(div, file$8, 20, 0, 1163);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, img);
    		},

    		p: function update(changed, ctx) {
    			if (changed.imageUrl) {
    				attr(img, "src", ctx.imageUrl);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { imageUrl = './media/download.png' } = $$props;

    	const writable_props = ['imageUrl'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Avatar> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('imageUrl' in $$props) $$invalidate('imageUrl', imageUrl = $$props.imageUrl);
    	};

    	$$self.$$.update = ($$dirty = { imageUrl: 1 }) => {
    		if ($$dirty.imageUrl) { console.log('avatar', imageUrl); }
    	};

    	return { imageUrl };
    }

    class Avatar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["imageUrl"]);
    	}

    	get imageUrl() {
    		throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageUrl(value) {
    		throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\ToggleButton.svelte generated by Svelte v3.9.1 */

    // (26:4) <Icon              class="material-icons toggle-button {isMarked ? 'active' : ''}">
    function create_default_slot_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text(ctx.markedIcon);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.markedIcon) {
    				set_data(t, ctx.markedIcon);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (28:4) <Icon              class="material-icons toggle-button {!isMarked ? 'active' :                            ''}">
    function create_default_slot_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text(ctx.unmarkedIcon);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.unmarkedIcon) {
    				set_data(t, ctx.unmarkedIcon);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (25:0) <IconButton on:click={onClick}  aria-label="Add to favorites" title="{title}">
    function create_default_slot$3(ctx) {
    	var t, current;

    	var icon0 = new Icon({
    		props: {
    		class: "material-icons toggle-button " + (ctx.isMarked ? 'active' : ''),
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var icon1 = new Icon({
    		props: {
    		class: "material-icons toggle-button " + (!ctx.isMarked ? 'active' :
                              ''),
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			icon0.$$.fragment.c();
    			t = space();
    			icon1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(icon0, target, anchor);
    			insert(target, t, anchor);
    			mount_component(icon1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon0_changes = {};
    			if (changed.isMarked) icon0_changes.class = "material-icons toggle-button " + (ctx.isMarked ? 'active' : '');
    			if (changed.$$scope || changed.markedIcon) icon0_changes.$$scope = { changed, ctx };
    			icon0.$set(icon0_changes);

    			var icon1_changes = {};
    			if (changed.isMarked) icon1_changes.class = "material-icons toggle-button " + (!ctx.isMarked ? 'active' :
                              '');
    			if (changed.$$scope || changed.unmarkedIcon) icon1_changes.$$scope = { changed, ctx };
    			icon1.$set(icon1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);

    			transition_in(icon1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(icon0, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(icon1, detaching);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	var current;

    	var iconbutton = new IconButton({
    		props: {
    		"aria-label": "Add to favorites",
    		title: ctx.title,
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton.$on("click", ctx.onClick);

    	return {
    		c: function create() {
    			iconbutton.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconbutton_changes = {};
    			if (changed.title) iconbutton_changes.title = ctx.title;
    			if (changed.$$scope || changed.isMarked || changed.unmarkedIcon || changed.markedIcon) iconbutton_changes.$$scope = { changed, ctx };
    			iconbutton.$set(iconbutton_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(iconbutton, detaching);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	
        const dispatch = createEventDispatcher();

        let { isMarked = false, markedIcon, unmarkedIcon, title } = $$props;

        function onClick() {
            dispatch('click');
        }

    	const writable_props = ['isMarked', 'markedIcon', 'unmarkedIcon', 'title'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ToggleButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('isMarked' in $$props) $$invalidate('isMarked', isMarked = $$props.isMarked);
    		if ('markedIcon' in $$props) $$invalidate('markedIcon', markedIcon = $$props.markedIcon);
    		if ('unmarkedIcon' in $$props) $$invalidate('unmarkedIcon', unmarkedIcon = $$props.unmarkedIcon);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    	};

    	return {
    		isMarked,
    		markedIcon,
    		unmarkedIcon,
    		title,
    		onClick
    	};
    }

    class ToggleButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["isMarked", "markedIcon", "unmarkedIcon", "title"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.markedIcon === undefined && !('markedIcon' in props)) {
    			console.warn("<ToggleButton> was created without expected prop 'markedIcon'");
    		}
    		if (ctx.unmarkedIcon === undefined && !('unmarkedIcon' in props)) {
    			console.warn("<ToggleButton> was created without expected prop 'unmarkedIcon'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<ToggleButton> was created without expected prop 'title'");
    		}
    	}

    	get isMarked() {
    		throw new Error("<ToggleButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMarked(value) {
    		throw new Error("<ToggleButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get markedIcon() {
    		throw new Error("<ToggleButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set markedIcon(value) {
    		throw new Error("<ToggleButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unmarkedIcon() {
    		throw new Error("<ToggleButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unmarkedIcon(value) {
    		throw new Error("<ToggleButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ToggleButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ToggleButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\NTKCard.svelte generated by Svelte v3.9.1 */
    const { console: console_1$1 } = globals;

    const file$9 = "src\\common\\NTKCard.svelte";

    // (107:20) {#if ntkPerson.ntkDetails.age}
    function create_if_block_2(ctx) {
    	var h5, span0, t1, span1, t2_value = ctx.ntkPerson.ntkDetails.age + "", t2;

    	return {
    		c: function create() {
    			h5 = element("h5");
    			span0 = element("span");
    			span0.textContent = "Age:";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			add_location(span0, file$9, 108, 24, 6725);
    			add_location(span1, file$9, 109, 24, 6768);
    			attr(h5, "class", "ntk-age svelte-wtp07c");
    			add_location(h5, file$9, 107, 20, 6679);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h5, anchor);
    			append(h5, span0);
    			append(h5, t1);
    			append(h5, span1);
    			append(span1, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.ntkPerson) && t2_value !== (t2_value = ctx.ntkPerson.ntkDetails.age + "")) {
    				set_data(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h5);
    			}
    		}
    	};
    }

    // (127:20) <Label>
    function create_default_slot_8(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Action");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (126:16) <Button on:click={() => clicked++}>
    function create_default_slot_7(ctx) {
    	var current;

    	var label = new Label({
    		props: {
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			label.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var label_changes = {};
    			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
    			label.$set(label_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};
    }

    // (125:12) <ActionButtons>
    function create_default_slot_6(ctx) {
    	var current;

    	var button = new Button_1({
    		props: {
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.click_handler);

    	return {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    }

    // (131:16) {#if !isApproval}
    function create_if_block_1(ctx) {
    	var current;

    	var togglebutton = new ToggleButton({
    		props: {
    		markedIcon: "favorite",
    		unmarkedIcon: "favorite_border",
    		isMarked: ctx.ntkPerson.isMarked,
    		title: "Mark as potential nice-to-know"
    	},
    		$$inline: true
    	});
    	togglebutton.$on("click", ctx.click_handler_1);

    	return {
    		c: function create() {
    			togglebutton.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(togglebutton, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var togglebutton_changes = {};
    			if (changed.ntkPerson) togglebutton_changes.isMarked = ctx.ntkPerson.isMarked;
    			togglebutton.$set(togglebutton_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(togglebutton.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(togglebutton.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(togglebutton, detaching);
    		}
    	};
    }

    // (140:16) {#if isApproval}
    function create_if_block$1(ctx) {
    	var t, current;

    	var iconbutton0 = new IconButton({
    		props: {
    		class: "material-icons up",
    		title: "approve",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton0.$on("click", ctx.click_handler_2);

    	var iconbutton1 = new IconButton({
    		props: {
    		class: "material-icons down",
    		title: "disapprove",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton1.$on("click", ctx.click_handler_3);

    	return {
    		c: function create() {
    			iconbutton0.$$.fragment.c();
    			t = space();
    			iconbutton1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(iconbutton0, target, anchor);
    			insert(target, t, anchor);
    			mount_component(iconbutton1, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton0.$$.fragment, local);

    			transition_in(iconbutton1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton0.$$.fragment, local);
    			transition_out(iconbutton1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(iconbutton0, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(iconbutton1, detaching);
    		}
    	};
    }

    // (141:20) <IconButton class="material-icons up" on:click={() => setApproval(true)}                                  title="approve">
    function create_default_slot_5(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("thumb_up_alt");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (143:20) <IconButton class="material-icons down" on:click={() => setApproval(false)}                                  title="disapprove">
    function create_default_slot_4(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("thumb_down_alt");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (146:16) <IconButton class="material-icons" on:click={() => clicked++} title="More options">
    function create_default_slot_3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("more_vert");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (130:12) <ActionIcons>
    function create_default_slot_2$1(ctx) {
    	var t0, t1, current;

    	var if_block0 = (!ctx.isApproval) && create_if_block_1(ctx);

    	var if_block1 = (ctx.isApproval) && create_if_block$1(ctx);

    	var iconbutton = new IconButton({
    		props: {
    		class: "material-icons",
    		title: "More options",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton.$on("click", ctx.click_handler_4);

    	return {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			iconbutton.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, t1, anchor);
    			mount_component(iconbutton, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.isApproval) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.isApproval) {
    				if (!if_block1) {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				} else {
    									transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			var iconbutton_changes = {};
    			if (changed.$$scope) iconbutton_changes.$$scope = { changed, ctx };
    			iconbutton.$set(iconbutton_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);

    			transition_in(iconbutton.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(iconbutton, detaching);
    		}
    	};
    }

    // (124:8) <Actions>
    function create_default_slot_1$1(ctx) {
    	var t, current;

    	var actionbuttons = new ActionButtons({
    		props: {
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var actionicons = new ActionIcons({
    		props: {
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			actionbuttons.$$.fragment.c();
    			t = space();
    			actionicons.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(actionbuttons, target, anchor);
    			insert(target, t, anchor);
    			mount_component(actionicons, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var actionbuttons_changes = {};
    			if (changed.$$scope) actionbuttons_changes.$$scope = { changed, ctx };
    			actionbuttons.$set(actionbuttons_changes);

    			var actionicons_changes = {};
    			if (changed.$$scope || changed.isApproval || changed.ntkPerson) actionicons_changes.$$scope = { changed, ctx };
    			actionicons.$set(actionicons_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(actionbuttons.$$.fragment, local);

    			transition_in(actionicons.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(actionbuttons.$$.fragment, local);
    			transition_out(actionicons.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(actionbuttons, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(actionicons, detaching);
    		}
    	};
    }

    // (99:4) <Card class="card-theme {ntkPerson.isApproved ? 'is-approved' : ''}" style="width: 360px;">
    function create_default_slot$4(ctx) {
    	var div6, div1, t0, div0, h3, t1_value = ctx.ntkPerson.ntkDetails.name + "", t1, t2, t3, div5, div4, div2, t5, div3, t6_value = ctx.ntkPerson.ntkDetails.moreDetails.hobbies + "", t6, t7, current, dispose;

    	var avatar = new Avatar({
    		props: { imageUrl: ctx.ntkPerson.ntkDetails.imageUrl },
    		$$inline: true
    	});

    	var if_block = (ctx.ntkPerson.ntkDetails.age) && create_if_block_2(ctx);

    	var actions = new Actions({
    		props: {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			avatar.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Hobbies";
    			t5 = space();
    			div3 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			actions.$$.fragment.c();
    			attr(h3, "class", "ntk-name svelte-wtp07c");
    			add_location(h3, file$9, 103, 20, 6504);
    			attr(div0, "class", "person-details svelte-wtp07c");
    			add_location(div0, file$9, 102, 16, 6454);
    			attr(div1, "class", "avatar-container svelte-wtp07c");
    			add_location(div1, file$9, 100, 12, 6338);
    			attr(div2, "class", "caption svelte-wtp07c");
    			add_location(div2, file$9, 117, 20, 7030);
    			attr(div3, "class", "details svelte-wtp07c");
    			add_location(div3, file$9, 118, 20, 7086);
    			attr(div4, "class", "ntk-details-row");
    			add_location(div4, file$9, 116, 16, 6979);
    			attr(div5, "class", "ntk-details-rows-container svelte-wtp07c");
    			add_location(div5, file$9, 115, 12, 6921);
    			attr(div6, "class", "card-details svelte-wtp07c");
    			add_location(div6, file$9, 99, 8, 6269);
    			dispose = listen(div6, "dblclick", ctx.onCardDblclick);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div1);
    			mount_component(avatar, div1, null);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, h3);
    			append(h3, t1);
    			append(div0, t2);
    			if (if_block) if_block.m(div0, null);
    			append(div6, t3);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, div2);
    			append(div4, t5);
    			append(div4, div3);
    			append(div3, t6);
    			insert(target, t7, anchor);
    			mount_component(actions, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var avatar_changes = {};
    			if (changed.ntkPerson) avatar_changes.imageUrl = ctx.ntkPerson.ntkDetails.imageUrl;
    			avatar.$set(avatar_changes);

    			if ((!current || changed.ntkPerson) && t1_value !== (t1_value = ctx.ntkPerson.ntkDetails.name + "")) {
    				set_data(t1, t1_value);
    			}

    			if (ctx.ntkPerson.ntkDetails.age) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || changed.ntkPerson) && t6_value !== (t6_value = ctx.ntkPerson.ntkDetails.moreDetails.hobbies + "")) {
    				set_data(t6, t6_value);
    			}

    			var actions_changes = {};
    			if (changed.$$scope || changed.isApproval || changed.ntkPerson) actions_changes.$$scope = { changed, ctx };
    			actions.$set(actions_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(actions.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div6);
    			}

    			destroy_component(avatar);

    			if (if_block) if_block.d();

    			if (detaching) {
    				detach(t7);
    			}

    			destroy_component(actions, detaching);

    			dispose();
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	var div, current;

    	var card = new Card({
    		props: {
    		class: "card-theme " + (ctx.ntkPerson.isApproved ? 'is-approved' : ''),
    		style: "width: 360px;",
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			card.$$.fragment.c();
    			attr(div, "class", "my-card");
    			add_location(div, file$9, 97, 0, 6141);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(card, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.ntkPerson) card_changes.class = "card-theme " + (ctx.ntkPerson.isApproved ? 'is-approved' : '');
    			if (changed.$$scope || changed.isApproval || changed.ntkPerson) card_changes.$$scope = { changed, ctx };
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(card);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	

        let clicked=0;
        const dispatch = createEventDispatcher();

        let { ntkPerson, isApproval=false } = $$props;

        function onMarkedChanged() {
            dispatch('markedChanged', {id: ntkPerson.ntkDetails.id});
        }

        function onCardDblclick() {
            dispatch('ntkPersonSelected', ntkPerson);
        }

        function setApproval(isApproved) {
            dispatch('approvalChanged', {id: ntkPerson.ntkDetails.id, isApproved});
        }

    	const writable_props = ['ntkPerson', 'isApproval'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<NTKCard> was created with unknown prop '${key}'`);
    	});

    	function click_handler() {
    		const $$result = clicked++;
    		$$invalidate('clicked', clicked);
    		return $$result;
    	}

    	function click_handler_1() {
    		return onMarkedChanged();
    	}

    	function click_handler_2() {
    		return setApproval(true);
    	}

    	function click_handler_3() {
    		return setApproval(false);
    	}

    	function click_handler_4() {
    		const $$result = clicked++;
    		$$invalidate('clicked', clicked);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('ntkPerson' in $$props) $$invalidate('ntkPerson', ntkPerson = $$props.ntkPerson);
    		if ('isApproval' in $$props) $$invalidate('isApproval', isApproval = $$props.isApproval);
    	};

    	$$self.$$.update = ($$dirty = { ntkPerson: 1 }) => {
    		if ($$dirty.ntkPerson) { console.log('ntkPerson', ntkPerson); }
    	};

    	return {
    		clicked,
    		ntkPerson,
    		isApproval,
    		onMarkedChanged,
    		onCardDblclick,
    		setApproval,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	};
    }

    class NTKCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, ["ntkPerson", "isApproval"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.ntkPerson === undefined && !('ntkPerson' in props)) {
    			console_1$1.warn("<NTKCard> was created without expected prop 'ntkPerson'");
    		}
    	}

    	get ntkPerson() {
    		throw new Error("<NTKCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ntkPerson(value) {
    		throw new Error("<NTKCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isApproval() {
    		throw new Error("<NTKCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isApproval(value) {
    		throw new Error("<NTKCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var candidateSelectors = [
      'input',
      'select',
      'textarea',
      'a[href]',
      'button',
      '[tabindex]',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
    ];
    var candidateSelector = candidateSelectors.join(',');

    var matches$1 = typeof Element === 'undefined'
      ? function () {}
      : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

    function tabbable(el, options) {
      options = options || {};

      var regularTabbables = [];
      var orderedTabbables = [];

      var candidates = el.querySelectorAll(candidateSelector);

      if (options.includeContainer) {
        if (matches$1.call(el, candidateSelector)) {
          candidates = Array.prototype.slice.apply(candidates);
          candidates.unshift(el);
        }
      }

      var i, candidate, candidateTabindex;
      for (i = 0; i < candidates.length; i++) {
        candidate = candidates[i];

        if (!isNodeMatchingSelectorTabbable(candidate)) continue;

        candidateTabindex = getTabindex(candidate);
        if (candidateTabindex === 0) {
          regularTabbables.push(candidate);
        } else {
          orderedTabbables.push({
            documentOrder: i,
            tabIndex: candidateTabindex,
            node: candidate,
          });
        }
      }

      var tabbableNodes = orderedTabbables
        .sort(sortOrderedTabbables)
        .map(function(a) { return a.node })
        .concat(regularTabbables);

      return tabbableNodes;
    }

    tabbable.isTabbable = isTabbable;
    tabbable.isFocusable = isFocusable;

    function isNodeMatchingSelectorTabbable(node) {
      if (
        !isNodeMatchingSelectorFocusable(node)
        || isNonTabbableRadio(node)
        || getTabindex(node) < 0
      ) {
        return false;
      }
      return true;
    }

    function isTabbable(node) {
      if (!node) throw new Error('No node provided');
      if (matches$1.call(node, candidateSelector) === false) return false;
      return isNodeMatchingSelectorTabbable(node);
    }

    function isNodeMatchingSelectorFocusable(node) {
      if (
        node.disabled
        || isHiddenInput(node)
        || isHidden(node)
      ) {
        return false;
      }
      return true;
    }

    var focusableCandidateSelector = candidateSelectors.concat('iframe').join(',');
    function isFocusable(node) {
      if (!node) throw new Error('No node provided');
      if (matches$1.call(node, focusableCandidateSelector) === false) return false;
      return isNodeMatchingSelectorFocusable(node);
    }

    function getTabindex(node) {
      var tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);
      if (!isNaN(tabindexAttr)) return tabindexAttr;
      // Browsers do not return `tabIndex` correctly for contentEditable nodes;
      // so if they don't have a tabindex attribute specifically set, assume it's 0.
      if (isContentEditable(node)) return 0;
      return node.tabIndex;
    }

    function sortOrderedTabbables(a, b) {
      return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
    }

    function isContentEditable(node) {
      return node.contentEditable === 'true';
    }

    function isInput(node) {
      return node.tagName === 'INPUT';
    }

    function isHiddenInput(node) {
      return isInput(node) && node.type === 'hidden';
    }

    function isRadio(node) {
      return isInput(node) && node.type === 'radio';
    }

    function isNonTabbableRadio(node) {
      return isRadio(node) && !isTabbableRadio(node);
    }

    function getCheckedRadio(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].checked) {
          return nodes[i];
        }
      }
    }

    function isTabbableRadio(node) {
      if (!node.name) return true;
      // This won't account for the edge case where you have radio groups with the same
      // in separate forms on the same page.
      var radioSet = node.ownerDocument.querySelectorAll('input[type="radio"][name="' + node.name + '"]');
      var checked = getCheckedRadio(radioSet);
      return !checked || checked === node;
    }

    function isHidden(node) {
      // offsetParent being null will allow detecting cases where an element is invisible or inside an invisible element,
      // as long as the element does not use position: fixed. For them, their visibility has to be checked directly as well.
      return node.offsetParent === null || getComputedStyle(node).visibility === 'hidden';
    }

    var tabbable_1 = tabbable;

    var immutable = extend;

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

    function extend() {
        var target = {};

        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
                if (hasOwnProperty$1.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target
    }

    var activeFocusDelay;

    var activeFocusTraps = (function() {
      var trapQueue = [];
      return {
        activateTrap: function(trap) {
          if (trapQueue.length > 0) {
            var activeTrap = trapQueue[trapQueue.length - 1];
            if (activeTrap !== trap) {
              activeTrap.pause();
            }
          }

          var trapIndex = trapQueue.indexOf(trap);
          if (trapIndex === -1) {
            trapQueue.push(trap);
          } else {
            // move this existing trap to the front of the queue
            trapQueue.splice(trapIndex, 1);
            trapQueue.push(trap);
          }
        },

        deactivateTrap: function(trap) {
          var trapIndex = trapQueue.indexOf(trap);
          if (trapIndex !== -1) {
            trapQueue.splice(trapIndex, 1);
          }

          if (trapQueue.length > 0) {
            trapQueue[trapQueue.length - 1].unpause();
          }
        }
      };
    })();

    function focusTrap(element, userOptions) {
      var doc = document;
      var container =
        typeof element === 'string' ? doc.querySelector(element) : element;

      var config = immutable(
        {
          returnFocusOnDeactivate: true,
          escapeDeactivates: true
        },
        userOptions
      );

      var state = {
        firstTabbableNode: null,
        lastTabbableNode: null,
        nodeFocusedBeforeActivation: null,
        mostRecentlyFocusedNode: null,
        active: false,
        paused: false
      };

      var trap = {
        activate: activate,
        deactivate: deactivate,
        pause: pause,
        unpause: unpause
      };

      return trap;

      function activate(activateOptions) {
        if (state.active) return;

        updateTabbableNodes();

        state.active = true;
        state.paused = false;
        state.nodeFocusedBeforeActivation = doc.activeElement;

        var onActivate =
          activateOptions && activateOptions.onActivate
            ? activateOptions.onActivate
            : config.onActivate;
        if (onActivate) {
          onActivate();
        }

        addListeners();
        return trap;
      }

      function deactivate(deactivateOptions) {
        if (!state.active) return;

        clearTimeout(activeFocusDelay);

        removeListeners();
        state.active = false;
        state.paused = false;

        activeFocusTraps.deactivateTrap(trap);

        var onDeactivate =
          deactivateOptions && deactivateOptions.onDeactivate !== undefined
            ? deactivateOptions.onDeactivate
            : config.onDeactivate;
        if (onDeactivate) {
          onDeactivate();
        }

        var returnFocus =
          deactivateOptions && deactivateOptions.returnFocus !== undefined
            ? deactivateOptions.returnFocus
            : config.returnFocusOnDeactivate;
        if (returnFocus) {
          delay(function() {
            tryFocus(getReturnFocusNode(state.nodeFocusedBeforeActivation));
          });
        }

        return trap;
      }

      function pause() {
        if (state.paused || !state.active) return;
        state.paused = true;
        removeListeners();
      }

      function unpause() {
        if (!state.paused || !state.active) return;
        state.paused = false;
        updateTabbableNodes();
        addListeners();
      }

      function addListeners() {
        if (!state.active) return;

        // There can be only one listening focus trap at a time
        activeFocusTraps.activateTrap(trap);

        // Delay ensures that the focused element doesn't capture the event
        // that caused the focus trap activation.
        activeFocusDelay = delay(function() {
          tryFocus(getInitialFocusNode());
        });

        doc.addEventListener('focusin', checkFocusIn, true);
        doc.addEventListener('mousedown', checkPointerDown, {
          capture: true,
          passive: false
        });
        doc.addEventListener('touchstart', checkPointerDown, {
          capture: true,
          passive: false
        });
        doc.addEventListener('click', checkClick, {
          capture: true,
          passive: false
        });
        doc.addEventListener('keydown', checkKey, {
          capture: true,
          passive: false
        });

        return trap;
      }

      function removeListeners() {
        if (!state.active) return;

        doc.removeEventListener('focusin', checkFocusIn, true);
        doc.removeEventListener('mousedown', checkPointerDown, true);
        doc.removeEventListener('touchstart', checkPointerDown, true);
        doc.removeEventListener('click', checkClick, true);
        doc.removeEventListener('keydown', checkKey, true);

        return trap;
      }

      function getNodeForOption(optionName) {
        var optionValue = config[optionName];
        var node = optionValue;
        if (!optionValue) {
          return null;
        }
        if (typeof optionValue === 'string') {
          node = doc.querySelector(optionValue);
          if (!node) {
            throw new Error('`' + optionName + '` refers to no known node');
          }
        }
        if (typeof optionValue === 'function') {
          node = optionValue();
          if (!node) {
            throw new Error('`' + optionName + '` did not return a node');
          }
        }
        return node;
      }

      function getInitialFocusNode() {
        var node;
        if (getNodeForOption('initialFocus') !== null) {
          node = getNodeForOption('initialFocus');
        } else if (container.contains(doc.activeElement)) {
          node = doc.activeElement;
        } else {
          node = state.firstTabbableNode || getNodeForOption('fallbackFocus');
        }

        if (!node) {
          throw new Error(
            'Your focus-trap needs to have at least one focusable element'
          );
        }

        return node;
      }

      function getReturnFocusNode(previousActiveElement) {
        var node = getNodeForOption('setReturnFocus');
        return node ? node : previousActiveElement;
      }

      // This needs to be done on mousedown and touchstart instead of click
      // so that it precedes the focus event.
      function checkPointerDown(e) {
        if (container.contains(e.target)) return;
        if (config.clickOutsideDeactivates) {
          deactivate({
            returnFocus: !tabbable_1.isFocusable(e.target)
          });
          return;
        }
        // This is needed for mobile devices.
        // (If we'll only let `click` events through,
        // then on mobile they will be blocked anyways if `touchstart` is blocked.)
        if (config.allowOutsideClick && config.allowOutsideClick(e)) {
          return;
        }
        e.preventDefault();
      }

      // In case focus escapes the trap for some strange reason, pull it back in.
      function checkFocusIn(e) {
        // In Firefox when you Tab out of an iframe the Document is briefly focused.
        if (container.contains(e.target) || e.target instanceof Document) {
          return;
        }
        e.stopImmediatePropagation();
        tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
      }

      function checkKey(e) {
        if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
          e.preventDefault();
          deactivate();
          return;
        }
        if (isTabEvent(e)) {
          checkTab(e);
          return;
        }
      }

      // Hijack Tab events on the first and last focusable nodes of the trap,
      // in order to prevent focus from escaping. If it escapes for even a
      // moment it can end up scrolling the page and causing confusion so we
      // kind of need to capture the action at the keydown phase.
      function checkTab(e) {
        updateTabbableNodes();
        if (e.shiftKey && e.target === state.firstTabbableNode) {
          e.preventDefault();
          tryFocus(state.lastTabbableNode);
          return;
        }
        if (!e.shiftKey && e.target === state.lastTabbableNode) {
          e.preventDefault();
          tryFocus(state.firstTabbableNode);
          return;
        }
      }

      function checkClick(e) {
        if (config.clickOutsideDeactivates) return;
        if (container.contains(e.target)) return;
        if (config.allowOutsideClick && config.allowOutsideClick(e)) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      function updateTabbableNodes() {
        var tabbableNodes = tabbable_1(container);
        state.firstTabbableNode = tabbableNodes[0] || getInitialFocusNode();
        state.lastTabbableNode =
          tabbableNodes[tabbableNodes.length - 1] || getInitialFocusNode();
      }

      function tryFocus(node) {
        if (node === doc.activeElement) return;
        if (!node || !node.focus) {
          tryFocus(getInitialFocusNode());
          return;
        }
        node.focus();
        state.mostRecentlyFocusedNode = node;
        if (isSelectableInput(node)) {
          node.select();
        }
      }
    }

    function isSelectableInput(node) {
      return (
        node.tagName &&
        node.tagName.toLowerCase() === 'input' &&
        typeof node.select === 'function'
      );
    }

    function isEscapeEvent(e) {
      return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
    }

    function isTabEvent(e) {
      return e.key === 'Tab' || e.keyCode === 9;
    }

    function delay(fn) {
      return setTimeout(fn, 0);
    }

    var focusTrap_1 = focusTrap;

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    function createFocusTrapInstance(surfaceEl, focusTrapFactory, initialFocusEl) {
        if (focusTrapFactory === void 0) { focusTrapFactory = focusTrap_1; }
        return focusTrapFactory(surfaceEl, {
            clickOutsideDeactivates: true,
            escapeDeactivates: false,
            initialFocus: initialFocusEl,
        });
    }
    function isScrollable(el) {
        return el ? el.scrollHeight > el.offsetHeight : false;
    }
    function areTopsMisaligned(els) {
        var tops = new Set();
        [].forEach.call(els, function (el) { return tops.add(el.offsetTop); });
        return tops.size > 1;
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$2 = {
        CLOSING: 'mdc-dialog--closing',
        OPEN: 'mdc-dialog--open',
        OPENING: 'mdc-dialog--opening',
        SCROLLABLE: 'mdc-dialog--scrollable',
        SCROLL_LOCK: 'mdc-dialog-scroll-lock',
        STACKED: 'mdc-dialog--stacked',
    };
    var strings$3 = {
        ACTION_ATTRIBUTE: 'data-mdc-dialog-action',
        BUTTON_DEFAULT_ATTRIBUTE: 'data-mdc-dialog-button-default',
        BUTTON_SELECTOR: '.mdc-dialog__button',
        CLOSED_EVENT: 'MDCDialog:closed',
        CLOSE_ACTION: 'close',
        CLOSING_EVENT: 'MDCDialog:closing',
        CONTAINER_SELECTOR: '.mdc-dialog__container',
        CONTENT_SELECTOR: '.mdc-dialog__content',
        DESTROY_ACTION: 'destroy',
        INITIAL_FOCUS_ATTRIBUTE: 'data-mdc-dialog-initial-focus',
        OPENED_EVENT: 'MDCDialog:opened',
        OPENING_EVENT: 'MDCDialog:opening',
        SCRIM_SELECTOR: '.mdc-dialog__scrim',
        SUPPRESS_DEFAULT_PRESS_SELECTOR: [
            'textarea',
            '.mdc-menu .mdc-list-item',
        ].join(', '),
        SURFACE_SELECTOR: '.mdc-dialog__surface',
    };
    var numbers$1 = {
        DIALOG_ANIMATION_CLOSE_TIME_MS: 75,
        DIALOG_ANIMATION_OPEN_TIME_MS: 150,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCDialogFoundation = /** @class */ (function (_super) {
        __extends(MDCDialogFoundation, _super);
        function MDCDialogFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCDialogFoundation.defaultAdapter, adapter)) || this;
            _this.isOpen_ = false;
            _this.animationFrame_ = 0;
            _this.animationTimer_ = 0;
            _this.layoutFrame_ = 0;
            _this.escapeKeyAction_ = strings$3.CLOSE_ACTION;
            _this.scrimClickAction_ = strings$3.CLOSE_ACTION;
            _this.autoStackButtons_ = true;
            _this.areButtonsStacked_ = false;
            return _this;
        }
        Object.defineProperty(MDCDialogFoundation, "cssClasses", {
            get: function () {
                return cssClasses$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "strings", {
            get: function () {
                return strings$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "numbers", {
            get: function () {
                return numbers$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialogFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addBodyClass: function () { return undefined; },
                    addClass: function () { return undefined; },
                    areButtonsStacked: function () { return false; },
                    clickDefaultButton: function () { return undefined; },
                    eventTargetMatches: function () { return false; },
                    getActionFromEvent: function () { return ''; },
                    getInitialFocusEl: function () { return null; },
                    hasClass: function () { return false; },
                    isContentScrollable: function () { return false; },
                    notifyClosed: function () { return undefined; },
                    notifyClosing: function () { return undefined; },
                    notifyOpened: function () { return undefined; },
                    notifyOpening: function () { return undefined; },
                    releaseFocus: function () { return undefined; },
                    removeBodyClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    reverseButtons: function () { return undefined; },
                    trapFocus: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCDialogFoundation.prototype.init = function () {
            if (this.adapter_.hasClass(cssClasses$2.STACKED)) {
                this.setAutoStackButtons(false);
            }
        };
        MDCDialogFoundation.prototype.destroy = function () {
            if (this.isOpen_) {
                this.close(strings$3.DESTROY_ACTION);
            }
            if (this.animationTimer_) {
                clearTimeout(this.animationTimer_);
                this.handleAnimationTimerEnd_();
            }
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
                this.layoutFrame_ = 0;
            }
        };
        MDCDialogFoundation.prototype.open = function () {
            var _this = this;
            this.isOpen_ = true;
            this.adapter_.notifyOpening();
            this.adapter_.addClass(cssClasses$2.OPENING);
            // Wait a frame once display is no longer "none", to establish basis for animation
            this.runNextAnimationFrame_(function () {
                _this.adapter_.addClass(cssClasses$2.OPEN);
                _this.adapter_.addBodyClass(cssClasses$2.SCROLL_LOCK);
                _this.layout();
                _this.animationTimer_ = setTimeout(function () {
                    _this.handleAnimationTimerEnd_();
                    _this.adapter_.trapFocus(_this.adapter_.getInitialFocusEl());
                    _this.adapter_.notifyOpened();
                }, numbers$1.DIALOG_ANIMATION_OPEN_TIME_MS);
            });
        };
        MDCDialogFoundation.prototype.close = function (action) {
            var _this = this;
            if (action === void 0) { action = ''; }
            if (!this.isOpen_) {
                // Avoid redundant close calls (and events), e.g. from keydown on elements that inherently emit click
                return;
            }
            this.isOpen_ = false;
            this.adapter_.notifyClosing(action);
            this.adapter_.addClass(cssClasses$2.CLOSING);
            this.adapter_.removeClass(cssClasses$2.OPEN);
            this.adapter_.removeBodyClass(cssClasses$2.SCROLL_LOCK);
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = 0;
            clearTimeout(this.animationTimer_);
            this.animationTimer_ = setTimeout(function () {
                _this.adapter_.releaseFocus();
                _this.handleAnimationTimerEnd_();
                _this.adapter_.notifyClosed(action);
            }, numbers$1.DIALOG_ANIMATION_CLOSE_TIME_MS);
        };
        MDCDialogFoundation.prototype.isOpen = function () {
            return this.isOpen_;
        };
        MDCDialogFoundation.prototype.getEscapeKeyAction = function () {
            return this.escapeKeyAction_;
        };
        MDCDialogFoundation.prototype.setEscapeKeyAction = function (action) {
            this.escapeKeyAction_ = action;
        };
        MDCDialogFoundation.prototype.getScrimClickAction = function () {
            return this.scrimClickAction_;
        };
        MDCDialogFoundation.prototype.setScrimClickAction = function (action) {
            this.scrimClickAction_ = action;
        };
        MDCDialogFoundation.prototype.getAutoStackButtons = function () {
            return this.autoStackButtons_;
        };
        MDCDialogFoundation.prototype.setAutoStackButtons = function (autoStack) {
            this.autoStackButtons_ = autoStack;
        };
        MDCDialogFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        /** Handles click on the dialog root element. */
        MDCDialogFoundation.prototype.handleClick = function (evt) {
            var isScrim = this.adapter_.eventTargetMatches(evt.target, strings$3.SCRIM_SELECTOR);
            // Check for scrim click first since it doesn't require querying ancestors.
            if (isScrim && this.scrimClickAction_ !== '') {
                this.close(this.scrimClickAction_);
            }
            else {
                var action = this.adapter_.getActionFromEvent(evt);
                if (action) {
                    this.close(action);
                }
            }
        };
        /** Handles keydown on the dialog root element. */
        MDCDialogFoundation.prototype.handleKeydown = function (evt) {
            var isEnter = evt.key === 'Enter' || evt.keyCode === 13;
            if (!isEnter) {
                return;
            }
            var action = this.adapter_.getActionFromEvent(evt);
            if (action) {
                // Action button callback is handled in `handleClick`,
                // since space/enter keydowns on buttons trigger click events.
                return;
            }
            var isDefault = !this.adapter_.eventTargetMatches(evt.target, strings$3.SUPPRESS_DEFAULT_PRESS_SELECTOR);
            if (isEnter && isDefault) {
                this.adapter_.clickDefaultButton();
            }
        };
        /** Handles keydown on the document. */
        MDCDialogFoundation.prototype.handleDocumentKeydown = function (evt) {
            var isEscape = evt.key === 'Escape' || evt.keyCode === 27;
            if (isEscape && this.escapeKeyAction_ !== '') {
                this.close(this.escapeKeyAction_);
            }
        };
        MDCDialogFoundation.prototype.layoutInternal_ = function () {
            if (this.autoStackButtons_) {
                this.detectStackedButtons_();
            }
            this.detectScrollableContent_();
        };
        MDCDialogFoundation.prototype.handleAnimationTimerEnd_ = function () {
            this.animationTimer_ = 0;
            this.adapter_.removeClass(cssClasses$2.OPENING);
            this.adapter_.removeClass(cssClasses$2.CLOSING);
        };
        /**
         * Runs the given logic on the next animation frame, using setTimeout to factor in Firefox reflow behavior.
         */
        MDCDialogFoundation.prototype.runNextAnimationFrame_ = function (callback) {
            var _this = this;
            cancelAnimationFrame(this.animationFrame_);
            this.animationFrame_ = requestAnimationFrame(function () {
                _this.animationFrame_ = 0;
                clearTimeout(_this.animationTimer_);
                _this.animationTimer_ = setTimeout(callback, 0);
            });
        };
        MDCDialogFoundation.prototype.detectStackedButtons_ = function () {
            // Remove the class first to let us measure the buttons' natural positions.
            this.adapter_.removeClass(cssClasses$2.STACKED);
            var areButtonsStacked = this.adapter_.areButtonsStacked();
            if (areButtonsStacked) {
                this.adapter_.addClass(cssClasses$2.STACKED);
            }
            if (areButtonsStacked !== this.areButtonsStacked_) {
                this.adapter_.reverseButtons();
                this.areButtonsStacked_ = areButtonsStacked;
            }
        };
        MDCDialogFoundation.prototype.detectScrollableContent_ = function () {
            // Remove the class first to let us measure the natural height of the content.
            this.adapter_.removeClass(cssClasses$2.SCROLLABLE);
            if (this.adapter_.isContentScrollable()) {
                this.adapter_.addClass(cssClasses$2.SCROLLABLE);
            }
        };
        return MDCDialogFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$4 = MDCDialogFoundation.strings;
    var MDCDialog = /** @class */ (function (_super) {
        __extends(MDCDialog, _super);
        function MDCDialog() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(MDCDialog.prototype, "isOpen", {
            get: function () {
                return this.foundation_.isOpen();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "escapeKeyAction", {
            get: function () {
                return this.foundation_.getEscapeKeyAction();
            },
            set: function (action) {
                this.foundation_.setEscapeKeyAction(action);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "scrimClickAction", {
            get: function () {
                return this.foundation_.getScrimClickAction();
            },
            set: function (action) {
                this.foundation_.setScrimClickAction(action);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCDialog.prototype, "autoStackButtons", {
            get: function () {
                return this.foundation_.getAutoStackButtons();
            },
            set: function (autoStack) {
                this.foundation_.setAutoStackButtons(autoStack);
            },
            enumerable: true,
            configurable: true
        });
        MDCDialog.attachTo = function (root) {
            return new MDCDialog(root);
        };
        MDCDialog.prototype.initialize = function (focusTrapFactory) {
            var e_1, _a;
            var container = this.root_.querySelector(strings$4.CONTAINER_SELECTOR);
            if (!container) {
                throw new Error("Dialog component requires a " + strings$4.CONTAINER_SELECTOR + " container element");
            }
            this.container_ = container;
            this.content_ = this.root_.querySelector(strings$4.CONTENT_SELECTOR);
            this.buttons_ = [].slice.call(this.root_.querySelectorAll(strings$4.BUTTON_SELECTOR));
            this.defaultButton_ = this.root_.querySelector("[" + strings$4.BUTTON_DEFAULT_ATTRIBUTE + "]");
            this.focusTrapFactory_ = focusTrapFactory;
            this.buttonRipples_ = [];
            try {
                for (var _b = __values(this.buttons_), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var buttonEl = _c.value;
                    this.buttonRipples_.push(new MDCRipple(buttonEl));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        MDCDialog.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.focusTrap_ = createFocusTrapInstance(this.container_, this.focusTrapFactory_, this.getInitialFocusEl_() || undefined);
            this.handleClick_ = this.foundation_.handleClick.bind(this.foundation_);
            this.handleKeydown_ = this.foundation_.handleKeydown.bind(this.foundation_);
            this.handleDocumentKeydown_ = this.foundation_.handleDocumentKeydown.bind(this.foundation_);
            this.handleLayout_ = this.layout.bind(this);
            var LAYOUT_EVENTS = ['resize', 'orientationchange'];
            this.handleOpening_ = function () {
                LAYOUT_EVENTS.forEach(function (evtType) { return window.addEventListener(evtType, _this.handleLayout_); });
                document.addEventListener('keydown', _this.handleDocumentKeydown_);
            };
            this.handleClosing_ = function () {
                LAYOUT_EVENTS.forEach(function (evtType) { return window.removeEventListener(evtType, _this.handleLayout_); });
                document.removeEventListener('keydown', _this.handleDocumentKeydown_);
            };
            this.listen('click', this.handleClick_);
            this.listen('keydown', this.handleKeydown_);
            this.listen(strings$4.OPENING_EVENT, this.handleOpening_);
            this.listen(strings$4.CLOSING_EVENT, this.handleClosing_);
        };
        MDCDialog.prototype.destroy = function () {
            this.unlisten('click', this.handleClick_);
            this.unlisten('keydown', this.handleKeydown_);
            this.unlisten(strings$4.OPENING_EVENT, this.handleOpening_);
            this.unlisten(strings$4.CLOSING_EVENT, this.handleClosing_);
            this.handleClosing_();
            this.buttonRipples_.forEach(function (ripple) { return ripple.destroy(); });
            _super.prototype.destroy.call(this);
        };
        MDCDialog.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCDialog.prototype.open = function () {
            this.foundation_.open();
        };
        MDCDialog.prototype.close = function (action) {
            if (action === void 0) { action = ''; }
            this.foundation_.close(action);
        };
        MDCDialog.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                addBodyClass: function (className) { return document.body.classList.add(className); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                areButtonsStacked: function () { return areTopsMisaligned(_this.buttons_); },
                clickDefaultButton: function () { return _this.defaultButton_ && _this.defaultButton_.click(); },
                eventTargetMatches: function (target, selector) { return target ? matches(target, selector) : false; },
                getActionFromEvent: function (evt) {
                    if (!evt.target) {
                        return '';
                    }
                    var element = closest(evt.target, "[" + strings$4.ACTION_ATTRIBUTE + "]");
                    return element && element.getAttribute(strings$4.ACTION_ATTRIBUTE);
                },
                getInitialFocusEl: function () { return _this.getInitialFocusEl_(); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                isContentScrollable: function () { return isScrollable(_this.content_); },
                notifyClosed: function (action) { return _this.emit(strings$4.CLOSED_EVENT, action ? { action: action } : {}); },
                notifyClosing: function (action) { return _this.emit(strings$4.CLOSING_EVENT, action ? { action: action } : {}); },
                notifyOpened: function () { return _this.emit(strings$4.OPENED_EVENT, {}); },
                notifyOpening: function () { return _this.emit(strings$4.OPENING_EVENT, {}); },
                releaseFocus: function () { return _this.focusTrap_.deactivate(); },
                removeBodyClass: function (className) { return document.body.classList.remove(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                reverseButtons: function () {
                    _this.buttons_.reverse();
                    _this.buttons_.forEach(function (button) {
                        button.parentElement.appendChild(button);
                    });
                },
                trapFocus: function () { return _this.focusTrap_.activate(); },
            };
            return new MDCDialogFoundation(adapter);
        };
        MDCDialog.prototype.getInitialFocusEl_ = function () {
            return document.querySelector("[" + strings$4.INITIAL_FOCUS_ATTRIBUTE + "]");
        };
        return MDCDialog;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules\@smui\dialog\Dialog.svelte generated by Svelte v3.9.1 */

    const file$a = "node_modules\\@smui\\dialog\\Dialog.svelte";

    function create_fragment$e(ctx) {
    	var div3, div1, div0, t, div2, useActions_action, forwardEvents_action, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div3_levels = [
    		{ class: "mdc-dialog " + ctx.className },
    		{ role: "alertdialog" },
    		{ "aria-modal": "true" },
    		exclude(ctx.$$props, ['use', 'class'])
    	];

    	var div3_data = {};
    	for (var i = 0; i < div3_levels.length; i += 1) {
    		div3_data = assign(div3_data, div3_levels[i]);
    	}

    	return {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			if (default_slot) default_slot.c();
    			t = space();
    			div2 = element("div");

    			attr(div0, "class", "mdc-dialog__surface");
    			add_location(div0, file$a, 11, 4, 273);
    			attr(div1, "class", "mdc-dialog__container");
    			add_location(div1, file$a, 10, 2, 233);
    			attr(div2, "class", "mdc-dialog__scrim");
    			add_location(div2, file$a, 15, 2, 349);
    			set_attributes(div3, div3_data);
    			add_location(div3, file$a, 0, 0, 0);
    			dispose = listen(div3, "MDCDialog:opened", ctx.handleDialogOpened);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div1);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append(div3, t);
    			append(div3, div2);
    			ctx.div3_binding(div3);
    			useActions_action = useActions.call(null, div3, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div3) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div3, get_spread_update(div3_levels, [
    				(changed.className) && { class: "mdc-dialog " + ctx.className },
    				{ role: "alertdialog" },
    				{ "aria-modal": "true" },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.div3_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    			dispose();
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component, ['MDCDialog:opening', 'MDCDialog:opened', 'MDCDialog:closing', 'MDCDialog:closed']);

      let { use = [], class: className = '', escapeKeyAction = 'close', scrimClickAction = 'close', autoStackButtons = true } = $$props;

      let element;
      let dialog;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;
      let layoutListeners = [];
      let addLayoutListenerFn = listener => {
        layoutListeners.push(listener);

        return () => {
          const idx = layoutListeners.indexOf(listener);
          if (idx >= 0) {
            layoutListeners.splice(idx, 1);
          }
        };
      };

      setContext('SMUI:addLayoutListener', addLayoutListenerFn);

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      onMount(() => {
        $$invalidate('dialog', dialog = new MDCDialog(element));
      });

      onDestroy(() => {
        dialog && dialog.destroy();

        if (removeLayoutListener) {
          removeLayoutListener();
        }
      });

      function handleDialogOpened() {
        layoutListeners.forEach(listener => listener());
      }

      function open(...args) {
        return dialog.open(...args);
      }

      function close(...args) {
        return dialog.close(...args);
      }

      function isOpen() {
        return dialog.isOpen;
      }

      function layout(...args) {
        return dialog.layout(...args);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('escapeKeyAction' in $$new_props) $$invalidate('escapeKeyAction', escapeKeyAction = $$new_props.escapeKeyAction);
    		if ('scrimClickAction' in $$new_props) $$invalidate('scrimClickAction', scrimClickAction = $$new_props.scrimClickAction);
    		if ('autoStackButtons' in $$new_props) $$invalidate('autoStackButtons', autoStackButtons = $$new_props.autoStackButtons);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$$.update = ($$dirty = { dialog: 1, escapeKeyAction: 1, scrimClickAction: 1, autoStackButtons: 1 }) => {
    		if ($$dirty.dialog || $$dirty.escapeKeyAction) { dialog && (dialog.escapeKeyAction = escapeKeyAction); $$invalidate('dialog', dialog), $$invalidate('escapeKeyAction', escapeKeyAction), $$invalidate('scrimClickAction', scrimClickAction), $$invalidate('autoStackButtons', autoStackButtons); }
    		if ($$dirty.dialog || $$dirty.scrimClickAction) { dialog && (dialog.scrimClickAction = scrimClickAction); $$invalidate('dialog', dialog), $$invalidate('escapeKeyAction', escapeKeyAction), $$invalidate('scrimClickAction', scrimClickAction), $$invalidate('autoStackButtons', autoStackButtons); }
    		if ($$dirty.dialog || $$dirty.autoStackButtons) { dialog && (dialog.autoStackButtons = autoStackButtons); $$invalidate('dialog', dialog), $$invalidate('escapeKeyAction', escapeKeyAction), $$invalidate('scrimClickAction', scrimClickAction), $$invalidate('autoStackButtons', autoStackButtons); }
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		escapeKeyAction,
    		scrimClickAction,
    		autoStackButtons,
    		element,
    		handleDialogOpened,
    		open,
    		close,
    		isOpen,
    		layout,
    		$$props,
    		div3_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Dialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, ["use", "class", "escapeKeyAction", "scrimClickAction", "autoStackButtons", "open", "close", "isOpen", "layout"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.open === undefined && !('open' in props)) {
    			console.warn("<Dialog> was created without expected prop 'open'");
    		}
    		if (ctx.close === undefined && !('close' in props)) {
    			console.warn("<Dialog> was created without expected prop 'close'");
    		}
    		if (ctx.isOpen === undefined && !('isOpen' in props)) {
    			console.warn("<Dialog> was created without expected prop 'isOpen'");
    		}
    		if (ctx.layout === undefined && !('layout' in props)) {
    			console.warn("<Dialog> was created without expected prop 'layout'");
    		}
    	}

    	get use() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get escapeKeyAction() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set escapeKeyAction(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrimClickAction() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrimClickAction(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoStackButtons() {
    		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoStackButtons(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx.open;
    	}

    	set open(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx.close;
    	}

    	set close(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		return this.$$.ctx.isOpen;
    	}

    	set isOpen(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx.layout;
    	}

    	set layout(value) {
    		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\common\H2.svelte generated by Svelte v3.9.1 */

    const file$b = "node_modules\\@smui\\common\\H2.svelte";

    function create_fragment$f(ctx) {
    	var h2, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var h2_levels = [
    		exclude(ctx.$$props, ['use'])
    	];

    	var h2_data = {};
    	for (var i = 0; i < h2_levels.length; i += 1) {
    		h2_data = assign(h2_data, h2_levels[i]);
    	}

    	return {
    		c: function create() {
    			h2 = element("h2");

    			if (default_slot) default_slot.c();

    			set_attributes(h2, h2_data);
    			add_location(h2, file$b, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(h2_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);

    			if (default_slot) {
    				default_slot.m(h2, null);
    			}

    			useActions_action = useActions.call(null, h2, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, h2) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(h2, get_spread_update(h2_levels, [
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$f($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [] } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class H2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, ["use"]);
    	}

    	get use() {
    		throw new Error("<H2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    classAdderBuilder({
      class: 'mdc-dialog__title',
      component: H2,
      contexts: {}
    });

    classAdderBuilder({
      class: 'mdc-dialog__content',
      component: Div,
      contexts: {}
    });

    /* node_modules\@smui\common\Footer.svelte generated by Svelte v3.9.1 */

    const file$c = "node_modules\\@smui\\common\\Footer.svelte";

    function create_fragment$g(ctx) {
    	var footer, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var footer_levels = [
    		exclude(ctx.$$props, ['use'])
    	];

    	var footer_data = {};
    	for (var i = 0; i < footer_levels.length; i += 1) {
    		footer_data = assign(footer_data, footer_levels[i]);
    	}

    	return {
    		c: function create() {
    			footer = element("footer");

    			if (default_slot) default_slot.c();

    			set_attributes(footer, footer_data);
    			add_location(footer, file$c, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(footer_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, footer, anchor);

    			if (default_slot) {
    				default_slot.m(footer, null);
    			}

    			useActions_action = useActions.call(null, footer, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, footer) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(footer, get_spread_update(footer_levels, [
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(footer);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$g($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [] } = $$props;

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		$$props,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, ["use"]);
    	}

    	get use() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Actions$1 = classAdderBuilder({
      class: 'mdc-dialog__actions',
      component: Footer,
      contexts: {
        'SMUI:button:context': 'dialog:action'
      }
    });

    /* src\common\NTKPersonPopup.svelte generated by Svelte v3.9.1 */
    const { console: console_1$2 } = globals;

    const file$d = "src\\common\\NTKPersonPopup.svelte";

    // (127:12) <Label>
    function create_default_slot_3$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Close");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (126:8) <Button on:click={onClicked}>
    function create_default_slot_2$2(ctx) {
    	var current;

    	var label = new Label({
    		props: {
    		$$slots: { default: [create_default_slot_3$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			label.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var label_changes = {};
    			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
    			label.$set(label_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};
    }

    // (125:4) <Actions>
    function create_default_slot_1$2(ctx) {
    	var current;

    	var button = new Button_1({
    		props: {
    		$$slots: { default: [create_default_slot_2$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", onClicked);

    	return {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    }

    // (97:0) <Dialog bind:this={simpleDialog}          aria-labelledby="simple-title"          aria-describedby="simple-content"          on:MDCDialog:closed={closeHandler}          on:MDCDialog:closing={onClosing}  >
    function create_default_slot$5(ctx) {
    	var div6, div1, t0, div0, h3, t1_value = ctx.ntkPerson.ntkDetails.name + "", t1, t2, h5, span0, t4, span1, t5_value = ctx.ntkPerson.ntkDetails.age + "", t5, t6, div5, div4, div2, t8, div3, t9_value = ctx.ntkPerson.ntkDetails.moreDetails.hobbies + "", t9, t10, current;

    	var avatar = new Avatar({
    		props: { imageUrl: ctx.ntkPerson.ntkDetails.imageUrl },
    		$$inline: true
    	});

    	var actions = new Actions$1({
    		props: {
    		$$slots: { default: [create_default_slot_1$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			avatar.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			h5 = element("h5");
    			span0 = element("span");
    			span0.textContent = "Age:";
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Hobbies";
    			t8 = space();
    			div3 = element("div");
    			t9 = text(t9_value);
    			t10 = space();
    			actions.$$.fragment.c();
    			attr(h3, "class", "ntk-name svelte-1a6swk3");
    			add_location(h3, file$d, 106, 16, 6207);
    			add_location(span0, file$d, 110, 20, 6360);
    			add_location(span1, file$d, 111, 20, 6399);
    			attr(h5, "class", "ntk-age svelte-1a6swk3");
    			add_location(h5, file$d, 109, 16, 6318);
    			attr(div0, "class", "person-details svelte-1a6swk3");
    			add_location(div0, file$d, 105, 12, 6161);
    			attr(div1, "class", "avatar-container svelte-1a6swk3");
    			add_location(div1, file$d, 103, 8, 6053);
    			attr(div2, "class", "caption svelte-1a6swk3");
    			add_location(div2, file$d, 118, 16, 6610);
    			attr(div3, "class", "details svelte-1a6swk3");
    			add_location(div3, file$d, 119, 16, 6662);
    			attr(div4, "class", "ntk-details-row");
    			add_location(div4, file$d, 117, 12, 6563);
    			attr(div5, "class", "ntk-details-rows-container svelte-1a6swk3");
    			add_location(div5, file$d, 116, 8, 6509);
    			attr(div6, "class", "card-details svelte-1a6swk3");
    			add_location(div6, file$d, 102, 4, 6017);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div1);
    			mount_component(avatar, div1, null);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, h3);
    			append(h3, t1);
    			append(div0, t2);
    			append(div0, h5);
    			append(h5, span0);
    			append(h5, t4);
    			append(h5, span1);
    			append(span1, t5);
    			append(div6, t6);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, div2);
    			append(div4, t8);
    			append(div4, div3);
    			append(div3, t9);
    			insert(target, t10, anchor);
    			mount_component(actions, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var avatar_changes = {};
    			if (changed.ntkPerson) avatar_changes.imageUrl = ctx.ntkPerson.ntkDetails.imageUrl;
    			avatar.$set(avatar_changes);

    			if ((!current || changed.ntkPerson) && t1_value !== (t1_value = ctx.ntkPerson.ntkDetails.name + "")) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.ntkPerson) && t5_value !== (t5_value = ctx.ntkPerson.ntkDetails.age + "")) {
    				set_data(t5, t5_value);
    			}

    			if ((!current || changed.ntkPerson) && t9_value !== (t9_value = ctx.ntkPerson.ntkDetails.moreDetails.hobbies + "")) {
    				set_data(t9, t9_value);
    			}

    			var actions_changes = {};
    			if (changed.$$scope) actions_changes.$$scope = { changed, ctx };
    			actions.$set(actions_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(actions.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div6);
    			}

    			destroy_component(avatar);

    			if (detaching) {
    				detach(t10);
    			}

    			destroy_component(actions, detaching);
    		}
    	};
    }

    function create_fragment$h(ctx) {
    	var current;

    	let dialog_props = {
    		"aria-labelledby": "simple-title",
    		"aria-describedby": "simple-content",
    		$$slots: { default: [create_default_slot$5] },
    		$$scope: { ctx }
    	};
    	var dialog = new Dialog({ props: dialog_props, $$inline: true });

    	ctx.dialog_binding(dialog);
    	dialog.$on("MDCDialog:closed", ctx.closeHandler);
    	dialog.$on("MDCDialog:closing", onClosing);

    	return {
    		c: function create() {
    			dialog.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(dialog, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var dialog_changes = {};
    			if (changed.$$scope || changed.ntkPerson) dialog_changes.$$scope = { changed, ctx };
    			dialog.$set(dialog_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialog.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(dialog.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			ctx.dialog_binding(null);

    			destroy_component(dialog, detaching);
    		}
    	};
    }

    function onClicked(e) {

      }

    function onClosing(e) {
          console.log('onClosing', e);
          e.stopPropagation();
      }

    function instance$h($$self, $$props, $$invalidate) {
    	

        let simpleDialog;
        let { ntkPerson } = $$props;

        const dispatch=createEventDispatcher();

        onMount(() => {
            simpleDialog.open();
        });


        function closeHandler(e) {
            dispatch('dialogClosed', e);
        }

    	const writable_props = ['ntkPerson'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$2.warn(`<NTKPersonPopup> was created with unknown prop '${key}'`);
    	});

    	function dialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('simpleDialog', simpleDialog = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('ntkPerson' in $$props) $$invalidate('ntkPerson', ntkPerson = $$props.ntkPerson);
    	};

    	return {
    		simpleDialog,
    		ntkPerson,
    		closeHandler,
    		dialog_binding
    	};
    }

    class NTKPersonPopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["ntkPerson"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.ntkPerson === undefined && !('ntkPerson' in props)) {
    			console_1$2.warn("<NTKPersonPopup> was created without expected prop 'ntkPerson'");
    		}
    	}

    	get ntkPerson() {
    		throw new Error("<NTKPersonPopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ntkPerson(value) {
    		throw new Error("<NTKPersonPopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\NTKList.svelte generated by Svelte v3.9.1 */

    const file$e = "src\\common\\NTKList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.ntkPerson = list[i];
    	return child_ctx;
    }

    // (35:8) {#each ntkList as ntkPerson}
    function create_each_block(ctx) {
    	var div, t, current;

    	var ntkcard = new NTKCard({
    		props: {
    		ntkPerson: ctx.ntkPerson,
    		isApproval: ctx.isApproval
    	},
    		$$inline: true
    	});
    	ntkcard.$on("markedChanged", ctx.markedChanged_handler);
    	ntkcard.$on("ntkPersonSelected", ctx.onPersonSelected);
    	ntkcard.$on("approvalChanged", ctx.approvalChanged_handler);

    	return {
    		c: function create() {
    			div = element("div");
    			ntkcard.$$.fragment.c();
    			t = space();
    			attr(div, "class", "item svelte-76k8a2");
    			add_location(div, file$e, 35, 8, 1744);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(ntkcard, div, null);
    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var ntkcard_changes = {};
    			if (changed.ntkList) ntkcard_changes.ntkPerson = ctx.ntkPerson;
    			if (changed.isApproval) ntkcard_changes.isApproval = ctx.isApproval;
    			ntkcard.$set(ntkcard_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(ntkcard.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(ntkcard.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(ntkcard);
    		}
    	};
    }

    // (49:0) {#if isNTKPersonDialogOpen}
    function create_if_block$2(ctx) {
    	var current;

    	var ntkpersonpopup = new NTKPersonPopup({
    		props: { ntkPerson: ctx.currentSelectedPerson },
    		$$inline: true
    	});
    	ntkpersonpopup.$on("dialogClosed", ctx.dialogClosed_handler);

    	return {
    		c: function create() {
    			ntkpersonpopup.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(ntkpersonpopup, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var ntkpersonpopup_changes = {};
    			if (changed.currentSelectedPerson) ntkpersonpopup_changes.ntkPerson = ctx.currentSelectedPerson;
    			ntkpersonpopup.$set(ntkpersonpopup_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(ntkpersonpopup.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(ntkpersonpopup.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(ntkpersonpopup, detaching);
    		}
    	};
    }

    function create_fragment$i(ctx) {
    	var div1, div0, t, if_block_anchor, current;

    	var each_value = ctx.ntkList;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	var if_block = (ctx.isNTKPersonDialogOpen) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(div0, "class", "card-container svelte-76k8a2");
    			add_location(div0, file$e, 33, 4, 1668);
    			attr(div1, "class", "container svelte-76k8a2");
    			add_location(div1, file$e, 32, 0, 1639);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.ntkList || changed.isApproval) {
    				each_value = ctx.ntkList;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}

    			if (ctx.isNTKPersonDialogOpen) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$i($$self, $$props, $$invalidate) {
    	

        let { ntkList=[], isApproval } = $$props;

        let currentSelectedPerson;

        let isNTKPersonDialogOpen = false;

        function onPersonSelected(event) {
            $$invalidate('currentSelectedPerson', currentSelectedPerson = event.detail);
            $$invalidate('isNTKPersonDialogOpen', isNTKPersonDialogOpen = true);
        }

    	const writable_props = ['ntkList', 'isApproval'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<NTKList> was created with unknown prop '${key}'`);
    	});

    	function markedChanged_handler(event) {
    		bubble($$self, event);
    	}

    	function approvalChanged_handler(event) {
    		bubble($$self, event);
    	}

    	function dialogClosed_handler() {
    		const $$result = isNTKPersonDialogOpen = false;
    		$$invalidate('isNTKPersonDialogOpen', isNTKPersonDialogOpen);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('ntkList' in $$props) $$invalidate('ntkList', ntkList = $$props.ntkList);
    		if ('isApproval' in $$props) $$invalidate('isApproval', isApproval = $$props.isApproval);
    	};

    	return {
    		ntkList,
    		isApproval,
    		currentSelectedPerson,
    		isNTKPersonDialogOpen,
    		onPersonSelected,
    		markedChanged_handler,
    		approvalChanged_handler,
    		dialogClosed_handler
    	};
    }

    class NTKList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, ["ntkList", "isApproval"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.isApproval === undefined && !('isApproval' in props)) {
    			console.warn("<NTKList> was created without expected prop 'isApproval'");
    		}
    	}

    	get ntkList() {
    		throw new Error("<NTKList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ntkList(value) {
    		throw new Error("<NTKList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isApproval() {
    		throw new Error("<NTKList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isApproval(value) {
    		throw new Error("<NTKList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var $findIndex = arrayIteration.findIndex;


    var FIND_INDEX = 'findIndex';
    var SKIPS_HOLES$1 = true;

    // Shouldn't skip holes
    if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES$1 = false; });

    // `Array.prototype.findIndex` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.findindex
    _export({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 }, {
      findIndex: function findIndex(callbackfn /* , that = undefined */) {
        return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
      }
    });

    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables(FIND_INDEX);

    var createProperty = function (object, key, value) {
      var propertyKey = toPrimitive(key);
      if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
      else object[propertyKey] = value;
    };

    var SPECIES$1 = wellKnownSymbol('species');

    var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
      return !fails(function () {
        var array = [];
        var constructor = array.constructor = {};
        constructor[SPECIES$1] = function () {
          return { foo: 1 };
        };
        return array[METHOD_NAME](Boolean).foo !== 1;
      });
    };

    var max$1 = Math.max;
    var min$2 = Math.min;
    var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
    var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

    // `Array.prototype.splice` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.splice
    // with adding support of @@species
    _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('splice') }, {
      splice: function splice(start, deleteCount /* , ...items */) {
        var O = toObject(this);
        var len = toLength(O.length);
        var actualStart = toAbsoluteIndex(start, len);
        var argumentsLength = arguments.length;
        var insertCount, actualDeleteCount, A, k, from, to;
        if (argumentsLength === 0) {
          insertCount = actualDeleteCount = 0;
        } else if (argumentsLength === 1) {
          insertCount = 0;
          actualDeleteCount = len - actualStart;
        } else {
          insertCount = argumentsLength - 2;
          actualDeleteCount = min$2(max$1(toInteger(deleteCount), 0), len - actualStart);
        }
        if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER) {
          throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
        }
        A = arraySpeciesCreate(O, actualDeleteCount);
        for (k = 0; k < actualDeleteCount; k++) {
          from = actualStart + k;
          if (from in O) createProperty(A, k, O[from]);
        }
        A.length = actualDeleteCount;
        if (insertCount < actualDeleteCount) {
          for (k = actualStart; k < len - actualDeleteCount; k++) {
            from = k + actualDeleteCount;
            to = k + insertCount;
            if (from in O) O[to] = O[from];
            else delete O[to];
          }
          for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
        } else if (insertCount > actualDeleteCount) {
          for (k = len - actualDeleteCount; k > actualStart; k--) {
            from = k + actualDeleteCount - 1;
            to = k + insertCount - 1;
            if (from in O) O[to] = O[from];
            else delete O[to];
          }
        }
        for (k = 0; k < insertCount; k++) {
          O[k + actualStart] = arguments[k + 2];
        }
        O.length = len - actualDeleteCount + insertCount;
        return A;
      }
    });

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }

      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }

    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
            args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);

          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }

          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }

          _next(undefined);
        });
      };
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function ownKeys$1(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys$1(source, true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys$1(source).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
    var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
    var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

    var IS_CONCAT_SPREADABLE_SUPPORT = !fails(function () {
      var array = [];
      array[IS_CONCAT_SPREADABLE] = false;
      return array.concat()[0] !== array;
    });

    var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

    var isConcatSpreadable = function (O) {
      if (!isObject(O)) return false;
      var spreadable = O[IS_CONCAT_SPREADABLE];
      return spreadable !== undefined ? !!spreadable : isArray(O);
    };

    var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

    // `Array.prototype.concat` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.concat
    // with adding support of @@isConcatSpreadable and @@species
    _export({ target: 'Array', proto: true, forced: FORCED }, {
      concat: function concat(arg) { // eslint-disable-line no-unused-vars
        var O = toObject(this);
        var A = arraySpeciesCreate(O, 0);
        var n = 0;
        var i, k, length, len, E;
        for (i = -1, length = arguments.length; i < length; i++) {
          E = i === -1 ? O : arguments[i];
          if (isConcatSpreadable(E)) {
            len = toLength(E.length);
            if (n + len > MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
            for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
          } else {
            if (n >= MAX_SAFE_INTEGER$1) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
            createProperty(A, n++, E);
          }
        }
        A.length = n;
        return A;
      }
    });

    // call something on iterator step with safe closing on error
    var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
      try {
        return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
      // 7.4.6 IteratorClose(iterator, completion)
      } catch (error) {
        var returnMethod = iterator['return'];
        if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
        throw error;
      }
    };

    var iterators = {};

    var ITERATOR = wellKnownSymbol('iterator');
    var ArrayPrototype$1 = Array.prototype;

    // check on default Array iterator
    var isArrayIteratorMethod = function (it) {
      return it !== undefined && (iterators.Array === it || ArrayPrototype$1[ITERATOR] === it);
    };

    var TO_STRING_TAG = wellKnownSymbol('toStringTag');
    // ES3 wrong here
    var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

    // fallback for IE11 Script Access Denied error
    var tryGet = function (it, key) {
      try {
        return it[key];
      } catch (error) { /* empty */ }
    };

    // getting tag from ES6+ `Object.prototype.toString`
    var classof = function (it) {
      var O, tag, result;
      return it === undefined ? 'Undefined' : it === null ? 'Null'
        // @@toStringTag case
        : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
        // builtinTag case
        : CORRECT_ARGUMENTS ? classofRaw(O)
        // ES3 arguments fallback
        : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
    };

    var ITERATOR$1 = wellKnownSymbol('iterator');

    var getIteratorMethod = function (it) {
      if (it != undefined) return it[ITERATOR$1]
        || it['@@iterator']
        || iterators[classof(it)];
    };

    // `Array.from` method implementation
    // https://tc39.github.io/ecma262/#sec-array.from
    var arrayFrom = function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
      var O = toObject(arrayLike);
      var C = typeof this == 'function' ? this : Array;
      var argumentsLength = arguments.length;
      var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
      var mapping = mapfn !== undefined;
      var index = 0;
      var iteratorMethod = getIteratorMethod(O);
      var length, result, step, iterator;
      if (mapping) mapfn = bindContext(mapfn, argumentsLength > 2 ? arguments[2] : undefined, 2);
      // if the target is not iterable or it's an array with the default iterator - use a simple case
      if (iteratorMethod != undefined && !(C == Array && isArrayIteratorMethod(iteratorMethod))) {
        iterator = iteratorMethod.call(O);
        result = new C();
        for (;!(step = iterator.next()).done; index++) {
          createProperty(result, index, mapping
            ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true)
            : step.value
          );
        }
      } else {
        length = toLength(O.length);
        result = new C(length);
        for (;length > index; index++) {
          createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
        }
      }
      result.length = index;
      return result;
    };

    var ITERATOR$2 = wellKnownSymbol('iterator');
    var SAFE_CLOSING = false;

    try {
      var called = 0;
      var iteratorWithReturn = {
        next: function () {
          return { done: !!called++ };
        },
        'return': function () {
          SAFE_CLOSING = true;
        }
      };
      iteratorWithReturn[ITERATOR$2] = function () {
        return this;
      };
      // eslint-disable-next-line no-throw-literal
      Array.from(iteratorWithReturn, function () { throw 2; });
    } catch (error) { /* empty */ }

    var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
      if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
      var ITERATION_SUPPORT = false;
      try {
        var object = {};
        object[ITERATOR$2] = function () {
          return {
            next: function () {
              return { done: ITERATION_SUPPORT = true };
            }
          };
        };
        exec(object);
      } catch (error) { /* empty */ }
      return ITERATION_SUPPORT;
    };

    var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function (iterable) {
      Array.from(iterable);
    });

    // `Array.from` method
    // https://tc39.github.io/ecma262/#sec-array.from
    _export({ target: 'Array', stat: true, forced: INCORRECT_ITERATION }, {
      from: arrayFrom
    });

    var correctPrototypeGetter = !fails(function () {
      function F() { /* empty */ }
      F.prototype.constructor = null;
      return Object.getPrototypeOf(new F()) !== F.prototype;
    });

    var IE_PROTO$1 = sharedKey('IE_PROTO');
    var ObjectPrototype = Object.prototype;

    // `Object.getPrototypeOf` method
    // https://tc39.github.io/ecma262/#sec-object.getprototypeof
    var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
      O = toObject(O);
      if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
      if (typeof O.constructor == 'function' && O instanceof O.constructor) {
        return O.constructor.prototype;
      } return O instanceof Object ? ObjectPrototype : null;
    };

    var ITERATOR$3 = wellKnownSymbol('iterator');
    var BUGGY_SAFARI_ITERATORS = false;

    var returnThis = function () { return this; };

    // `%IteratorPrototype%` object
    // https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
    var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

    if ([].keys) {
      arrayIterator = [].keys();
      // Safari 8 has buggy iterators w/o `next`
      if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
      else {
        PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
        if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
      }
    }

    if (IteratorPrototype == undefined) IteratorPrototype = {};

    // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
    if ( !has(IteratorPrototype, ITERATOR$3)) hide(IteratorPrototype, ITERATOR$3, returnThis);

    var iteratorsCore = {
      IteratorPrototype: IteratorPrototype,
      BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
    };

    var defineProperty = objectDefineProperty.f;



    var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');

    var setToStringTag = function (it, TAG, STATIC) {
      if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG$1)) {
        defineProperty(it, TO_STRING_TAG$1, { configurable: true, value: TAG });
      }
    };

    var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





    var returnThis$1 = function () { return this; };

    var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
      var TO_STRING_TAG = NAME + ' Iterator';
      IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
      setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
      iterators[TO_STRING_TAG] = returnThis$1;
      return IteratorConstructor;
    };

    var aPossiblePrototype = function (it) {
      if (!isObject(it) && it !== null) {
        throw TypeError("Can't set " + String(it) + ' as a prototype');
      } return it;
    };

    // `Object.setPrototypeOf` method
    // https://tc39.github.io/ecma262/#sec-object.setprototypeof
    // Works with __proto__ only. Old v8 can't work with null proto objects.
    /* eslint-disable no-proto */
    var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
      var CORRECT_SETTER = false;
      var test = {};
      var setter;
      try {
        setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
        setter.call(test, []);
        CORRECT_SETTER = test instanceof Array;
      } catch (error) { /* empty */ }
      return function setPrototypeOf(O, proto) {
        anObject(O);
        aPossiblePrototype(proto);
        if (CORRECT_SETTER) setter.call(O, proto);
        else O.__proto__ = proto;
        return O;
      };
    }() : undefined);

    var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
    var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
    var ITERATOR$4 = wellKnownSymbol('iterator');
    var KEYS = 'keys';
    var VALUES = 'values';
    var ENTRIES = 'entries';

    var returnThis$2 = function () { return this; };

    var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
      createIteratorConstructor(IteratorConstructor, NAME, next);

      var getIterationMethod = function (KIND) {
        if (KIND === DEFAULT && defaultIterator) return defaultIterator;
        if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
        switch (KIND) {
          case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
          case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
          case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
        } return function () { return new IteratorConstructor(this); };
      };

      var TO_STRING_TAG = NAME + ' Iterator';
      var INCORRECT_VALUES_NAME = false;
      var IterablePrototype = Iterable.prototype;
      var nativeIterator = IterablePrototype[ITERATOR$4]
        || IterablePrototype['@@iterator']
        || DEFAULT && IterablePrototype[DEFAULT];
      var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
      var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
      var CurrentIteratorPrototype, methods, KEY;

      // fix native
      if (anyNativeIterator) {
        CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
        if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
          if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
            if (objectSetPrototypeOf) {
              objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
            } else if (typeof CurrentIteratorPrototype[ITERATOR$4] != 'function') {
              hide(CurrentIteratorPrototype, ITERATOR$4, returnThis$2);
            }
          }
          // Set @@toStringTag to native iterators
          setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
        }
      }

      // fix Array#{values, @@iterator}.name in V8 / FF
      if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
        INCORRECT_VALUES_NAME = true;
        defaultIterator = function values() { return nativeIterator.call(this); };
      }

      // define iterator
      if ( IterablePrototype[ITERATOR$4] !== defaultIterator) {
        hide(IterablePrototype, ITERATOR$4, defaultIterator);
      }
      iterators[NAME] = defaultIterator;

      // export additional methods
      if (DEFAULT) {
        methods = {
          values: getIterationMethod(VALUES),
          keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
          entries: getIterationMethod(ENTRIES)
        };
        if (FORCED) for (KEY in methods) {
          if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
            redefine(IterablePrototype, KEY, methods[KEY]);
          }
        } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
      }

      return methods;
    };

    var ARRAY_ITERATOR = 'Array Iterator';
    var setInternalState = internalState.set;
    var getInternalState = internalState.getterFor(ARRAY_ITERATOR);

    // `Array.prototype.entries` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.entries
    // `Array.prototype.keys` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.keys
    // `Array.prototype.values` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.values
    // `Array.prototype[@@iterator]` method
    // https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
    // `CreateArrayIterator` internal method
    // https://tc39.github.io/ecma262/#sec-createarrayiterator
    var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
      setInternalState(this, {
        type: ARRAY_ITERATOR,
        target: toIndexedObject(iterated), // target
        index: 0,                          // next index
        kind: kind                         // kind
      });
    // `%ArrayIteratorPrototype%.next` method
    // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
    }, function () {
      var state = getInternalState(this);
      var target = state.target;
      var kind = state.kind;
      var index = state.index++;
      if (!target || index >= target.length) {
        state.target = undefined;
        return { value: undefined, done: true };
      }
      if (kind == 'keys') return { value: index, done: false };
      if (kind == 'values') return { value: target[index], done: false };
      return { value: [index, target[index]], done: false };
    }, 'values');

    // argumentsList[@@iterator] is %ArrayProto_values%
    // https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
    // https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
    iterators.Arguments = iterators.Array;

    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables('keys');
    addToUnscopables('values');
    addToUnscopables('entries');

    var $map = arrayIteration.map;


    // `Array.prototype.map` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.map
    // with adding support of @@species
    _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('map') }, {
      map: function map(callbackfn /* , thisArg */) {
        return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
      }
    });

    var defineProperty$1 = objectDefineProperty.f;

    var FunctionPrototype = Function.prototype;
    var FunctionPrototypeToString = FunctionPrototype.toString;
    var nameRE = /^\s*function ([^ (]*)/;
    var NAME = 'name';

    // Function instances `.name` property
    // https://tc39.github.io/ecma262/#sec-function-instances-name
    if (descriptors && !(NAME in FunctionPrototype)) {
      defineProperty$1(FunctionPrototype, NAME, {
        configurable: true,
        get: function () {
          try {
            return FunctionPrototypeToString.call(this).match(nameRE)[1];
          } catch (error) {
            return '';
          }
        }
      });
    }

    var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
    var test = {};

    test[TO_STRING_TAG$2] = 'z';

    // `Object.prototype.toString` method implementation
    // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
    var objectToString = String(test) !== '[object z]' ? function toString() {
      return '[object ' + classof(this) + ']';
    } : test.toString;

    var ObjectPrototype$1 = Object.prototype;

    // `Object.prototype.toString` method
    // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
    if (objectToString !== ObjectPrototype$1.toString) {
      redefine(ObjectPrototype$1, 'toString', objectToString, { unsafe: true });
    }

    var nativePromiseConstructor = global_1.Promise;

    var redefineAll = function (target, src, options) {
      for (var key in src) redefine(target, key, src[key], options);
      return target;
    };

    var SPECIES$2 = wellKnownSymbol('species');

    var setSpecies = function (CONSTRUCTOR_NAME) {
      var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
      var defineProperty = objectDefineProperty.f;

      if (descriptors && Constructor && !Constructor[SPECIES$2]) {
        defineProperty(Constructor, SPECIES$2, {
          configurable: true,
          get: function () { return this; }
        });
      }
    };

    var anInstance = function (it, Constructor, name) {
      if (!(it instanceof Constructor)) {
        throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
      } return it;
    };

    var iterate_1 = createCommonjsModule(function (module) {
    var Result = function (stopped, result) {
      this.stopped = stopped;
      this.result = result;
    };

    var iterate = module.exports = function (iterable, fn, that, AS_ENTRIES, IS_ITERATOR) {
      var boundFunction = bindContext(fn, that, AS_ENTRIES ? 2 : 1);
      var iterator, iterFn, index, length, result, step;

      if (IS_ITERATOR) {
        iterator = iterable;
      } else {
        iterFn = getIteratorMethod(iterable);
        if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
        // optimisation for array iterators
        if (isArrayIteratorMethod(iterFn)) {
          for (index = 0, length = toLength(iterable.length); length > index; index++) {
            result = AS_ENTRIES
              ? boundFunction(anObject(step = iterable[index])[0], step[1])
              : boundFunction(iterable[index]);
            if (result && result instanceof Result) return result;
          } return new Result(false);
        }
        iterator = iterFn.call(iterable);
      }

      while (!(step = iterator.next()).done) {
        result = callWithSafeIterationClosing(iterator, boundFunction, step.value, AS_ENTRIES);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    };

    iterate.stop = function (result) {
      return new Result(true, result);
    };
    });

    var SPECIES$3 = wellKnownSymbol('species');

    // `SpeciesConstructor` abstract operation
    // https://tc39.github.io/ecma262/#sec-speciesconstructor
    var speciesConstructor = function (O, defaultConstructor) {
      var C = anObject(O).constructor;
      var S;
      return C === undefined || (S = anObject(C)[SPECIES$3]) == undefined ? defaultConstructor : aFunction$1(S);
    };

    var location = global_1.location;
    var set$1 = global_1.setImmediate;
    var clear = global_1.clearImmediate;
    var process = global_1.process;
    var MessageChannel = global_1.MessageChannel;
    var Dispatch = global_1.Dispatch;
    var counter = 0;
    var queue = {};
    var ONREADYSTATECHANGE = 'onreadystatechange';
    var defer, channel, port;

    var run$1 = function (id) {
      // eslint-disable-next-line no-prototype-builtins
      if (queue.hasOwnProperty(id)) {
        var fn = queue[id];
        delete queue[id];
        fn();
      }
    };

    var runner = function (id) {
      return function () {
        run$1(id);
      };
    };

    var listener = function (event) {
      run$1(event.data);
    };

    var post = function (id) {
      // old engines have not location.origin
      global_1.postMessage(id + '', location.protocol + '//' + location.host);
    };

    // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
    if (!set$1 || !clear) {
      set$1 = function setImmediate(fn) {
        var args = [];
        var i = 1;
        while (arguments.length > i) args.push(arguments[i++]);
        queue[++counter] = function () {
          // eslint-disable-next-line no-new-func
          (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
        };
        defer(counter);
        return counter;
      };
      clear = function clearImmediate(id) {
        delete queue[id];
      };
      // Node.js 0.8-
      if (classofRaw(process) == 'process') {
        defer = function (id) {
          process.nextTick(runner(id));
        };
      // Sphere (JS game engine) Dispatch API
      } else if (Dispatch && Dispatch.now) {
        defer = function (id) {
          Dispatch.now(runner(id));
        };
      // Browsers with MessageChannel, includes WebWorkers
      } else if (MessageChannel) {
        channel = new MessageChannel();
        port = channel.port2;
        channel.port1.onmessage = listener;
        defer = bindContext(port.postMessage, port, 1);
      // Browsers with postMessage, skip WebWorkers
      // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
      } else if (global_1.addEventListener && typeof postMessage == 'function' && !global_1.importScripts && !fails(post)) {
        defer = post;
        global_1.addEventListener('message', listener, false);
      // IE8-
      } else if (ONREADYSTATECHANGE in documentCreateElement('script')) {
        defer = function (id) {
          html.appendChild(documentCreateElement('script'))[ONREADYSTATECHANGE] = function () {
            html.removeChild(this);
            run$1(id);
          };
        };
      // Rest old browsers
      } else {
        defer = function (id) {
          setTimeout(runner(id), 0);
        };
      }
    }

    var task = {
      set: set$1,
      clear: clear
    };

    var userAgent = getBuiltIn('navigator', 'userAgent') || '';

    var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;

    var macrotask = task.set;


    var MutationObserver$1 = global_1.MutationObserver || global_1.WebKitMutationObserver;
    var process$1 = global_1.process;
    var Promise$1 = global_1.Promise;
    var IS_NODE = classofRaw(process$1) == 'process';
    // Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
    var queueMicrotaskDescriptor = getOwnPropertyDescriptor$2(global_1, 'queueMicrotask');
    var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

    var flush$1, head, last, notify, toggle, node, promise, then;

    // modern engines have queueMicrotask method
    if (!queueMicrotask) {
      flush$1 = function () {
        var parent, fn;
        if (IS_NODE && (parent = process$1.domain)) parent.exit();
        while (head) {
          fn = head.fn;
          head = head.next;
          try {
            fn();
          } catch (error) {
            if (head) notify();
            else last = undefined;
            throw error;
          }
        } last = undefined;
        if (parent) parent.enter();
      };

      // Node.js
      if (IS_NODE) {
        notify = function () {
          process$1.nextTick(flush$1);
        };
      // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
      } else if (MutationObserver$1 && !/(iphone|ipod|ipad).*applewebkit/i.test(userAgent)) {
        toggle = true;
        node = document.createTextNode('');
        new MutationObserver$1(flush$1).observe(node, { characterData: true }); // eslint-disable-line no-new
        notify = function () {
          node.data = toggle = !toggle;
        };
      // environments with maybe non-completely correct, but existent Promise
      } else if (Promise$1 && Promise$1.resolve) {
        // Promise.resolve without an argument throws an error in LG WebOS 2
        promise = Promise$1.resolve(undefined);
        then = promise.then;
        notify = function () {
          then.call(promise, flush$1);
        };
      // for other environments - macrotask based on:
      // - setImmediate
      // - MessageChannel
      // - window.postMessag
      // - onreadystatechange
      // - setTimeout
      } else {
        notify = function () {
          // strange IE + webpack dev server bug - use .call(global)
          macrotask.call(global_1, flush$1);
        };
      }
    }

    var microtask = queueMicrotask || function (fn) {
      var task = { fn: fn, next: undefined };
      if (last) last.next = task;
      if (!head) {
        head = task;
        notify();
      } last = task;
    };

    var PromiseCapability = function (C) {
      var resolve, reject;
      this.promise = new C(function ($$resolve, $$reject) {
        if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
        resolve = $$resolve;
        reject = $$reject;
      });
      this.resolve = aFunction$1(resolve);
      this.reject = aFunction$1(reject);
    };

    // 25.4.1.5 NewPromiseCapability(C)
    var f$5 = function (C) {
      return new PromiseCapability(C);
    };

    var newPromiseCapability = {
    	f: f$5
    };

    var promiseResolve = function (C, x) {
      anObject(C);
      if (isObject(x) && x.constructor === C) return x;
      var promiseCapability = newPromiseCapability.f(C);
      var resolve = promiseCapability.resolve;
      resolve(x);
      return promiseCapability.promise;
    };

    var hostReportErrors = function (a, b) {
      var console = global_1.console;
      if (console && console.error) {
        arguments.length === 1 ? console.error(a) : console.error(a, b);
      }
    };

    var perform = function (exec) {
      try {
        return { error: false, value: exec() };
      } catch (error) {
        return { error: true, value: error };
      }
    };

    var task$1 = task.set;










    var SPECIES$4 = wellKnownSymbol('species');
    var PROMISE = 'Promise';
    var getInternalState$1 = internalState.get;
    var setInternalState$1 = internalState.set;
    var getInternalPromiseState = internalState.getterFor(PROMISE);
    var PromiseConstructor = nativePromiseConstructor;
    var TypeError$1 = global_1.TypeError;
    var document$2 = global_1.document;
    var process$2 = global_1.process;
    var $fetch = global_1.fetch;
    var versions = process$2 && process$2.versions;
    var v8 = versions && versions.v8 || '';
    var newPromiseCapability$1 = newPromiseCapability.f;
    var newGenericPromiseCapability = newPromiseCapability$1;
    var IS_NODE$1 = classofRaw(process$2) == 'process';
    var DISPATCH_EVENT = !!(document$2 && document$2.createEvent && global_1.dispatchEvent);
    var UNHANDLED_REJECTION = 'unhandledrejection';
    var REJECTION_HANDLED = 'rejectionhandled';
    var PENDING = 0;
    var FULFILLED = 1;
    var REJECTED = 2;
    var HANDLED = 1;
    var UNHANDLED = 2;
    var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

    var FORCED$1 = isForced_1(PROMISE, function () {
      // correct subclassing with @@species support
      var promise = PromiseConstructor.resolve(1);
      var empty = function () { /* empty */ };
      var FakePromise = (promise.constructor = {})[SPECIES$4] = function (exec) {
        exec(empty, empty);
      };
      // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
      return !((IS_NODE$1 || typeof PromiseRejectionEvent == 'function')
        && (!isPure || promise['finally'])
        && promise.then(empty) instanceof FakePromise
        // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
        // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
        // we can't detect it synchronously, so just check versions
        && v8.indexOf('6.6') !== 0
        && userAgent.indexOf('Chrome/66') === -1);
    });

    var INCORRECT_ITERATION$1 = FORCED$1 || !checkCorrectnessOfIteration(function (iterable) {
      PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
    });

    // helpers
    var isThenable = function (it) {
      var then;
      return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
    };

    var notify$1 = function (promise, state, isReject) {
      if (state.notified) return;
      state.notified = true;
      var chain = state.reactions;
      microtask(function () {
        var value = state.value;
        var ok = state.state == FULFILLED;
        var index = 0;
        // variable length - can't use forEach
        while (chain.length > index) {
          var reaction = chain[index++];
          var handler = ok ? reaction.ok : reaction.fail;
          var resolve = reaction.resolve;
          var reject = reaction.reject;
          var domain = reaction.domain;
          var result, then, exited;
          try {
            if (handler) {
              if (!ok) {
                if (state.rejection === UNHANDLED) onHandleUnhandled(promise, state);
                state.rejection = HANDLED;
              }
              if (handler === true) result = value;
              else {
                if (domain) domain.enter();
                result = handler(value); // can throw
                if (domain) {
                  domain.exit();
                  exited = true;
                }
              }
              if (result === reaction.promise) {
                reject(TypeError$1('Promise-chain cycle'));
              } else if (then = isThenable(result)) {
                then.call(result, resolve, reject);
              } else resolve(result);
            } else reject(value);
          } catch (error) {
            if (domain && !exited) domain.exit();
            reject(error);
          }
        }
        state.reactions = [];
        state.notified = false;
        if (isReject && !state.rejection) onUnhandled(promise, state);
      });
    };

    var dispatchEvent = function (name, promise, reason) {
      var event, handler;
      if (DISPATCH_EVENT) {
        event = document$2.createEvent('Event');
        event.promise = promise;
        event.reason = reason;
        event.initEvent(name, false, true);
        global_1.dispatchEvent(event);
      } else event = { promise: promise, reason: reason };
      if (handler = global_1['on' + name]) handler(event);
      else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
    };

    var onUnhandled = function (promise, state) {
      task$1.call(global_1, function () {
        var value = state.value;
        var IS_UNHANDLED = isUnhandled(state);
        var result;
        if (IS_UNHANDLED) {
          result = perform(function () {
            if (IS_NODE$1) {
              process$2.emit('unhandledRejection', value, promise);
            } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
          });
          // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
          state.rejection = IS_NODE$1 || isUnhandled(state) ? UNHANDLED : HANDLED;
          if (result.error) throw result.value;
        }
      });
    };

    var isUnhandled = function (state) {
      return state.rejection !== HANDLED && !state.parent;
    };

    var onHandleUnhandled = function (promise, state) {
      task$1.call(global_1, function () {
        if (IS_NODE$1) {
          process$2.emit('rejectionHandled', promise);
        } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
      });
    };

    var bind$1 = function (fn, promise, state, unwrap) {
      return function (value) {
        fn(promise, state, value, unwrap);
      };
    };

    var internalReject = function (promise, state, value, unwrap) {
      if (state.done) return;
      state.done = true;
      if (unwrap) state = unwrap;
      state.value = value;
      state.state = REJECTED;
      notify$1(promise, state, true);
    };

    var internalResolve = function (promise, state, value, unwrap) {
      if (state.done) return;
      state.done = true;
      if (unwrap) state = unwrap;
      try {
        if (promise === value) throw TypeError$1("Promise can't be resolved itself");
        var then = isThenable(value);
        if (then) {
          microtask(function () {
            var wrapper = { done: false };
            try {
              then.call(value,
                bind$1(internalResolve, promise, wrapper, state),
                bind$1(internalReject, promise, wrapper, state)
              );
            } catch (error) {
              internalReject(promise, wrapper, error, state);
            }
          });
        } else {
          state.value = value;
          state.state = FULFILLED;
          notify$1(promise, state, false);
        }
      } catch (error) {
        internalReject(promise, { done: false }, error, state);
      }
    };

    // constructor polyfill
    if (FORCED$1) {
      // 25.4.3.1 Promise(executor)
      PromiseConstructor = function Promise(executor) {
        anInstance(this, PromiseConstructor, PROMISE);
        aFunction$1(executor);
        Internal.call(this);
        var state = getInternalState$1(this);
        try {
          executor(bind$1(internalResolve, this, state), bind$1(internalReject, this, state));
        } catch (error) {
          internalReject(this, state, error);
        }
      };
      // eslint-disable-next-line no-unused-vars
      Internal = function Promise(executor) {
        setInternalState$1(this, {
          type: PROMISE,
          done: false,
          notified: false,
          parent: false,
          reactions: [],
          rejection: false,
          state: PENDING,
          value: undefined
        });
      };
      Internal.prototype = redefineAll(PromiseConstructor.prototype, {
        // `Promise.prototype.then` method
        // https://tc39.github.io/ecma262/#sec-promise.prototype.then
        then: function then(onFulfilled, onRejected) {
          var state = getInternalPromiseState(this);
          var reaction = newPromiseCapability$1(speciesConstructor(this, PromiseConstructor));
          reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
          reaction.fail = typeof onRejected == 'function' && onRejected;
          reaction.domain = IS_NODE$1 ? process$2.domain : undefined;
          state.parent = true;
          state.reactions.push(reaction);
          if (state.state != PENDING) notify$1(this, state, false);
          return reaction.promise;
        },
        // `Promise.prototype.catch` method
        // https://tc39.github.io/ecma262/#sec-promise.prototype.catch
        'catch': function (onRejected) {
          return this.then(undefined, onRejected);
        }
      });
      OwnPromiseCapability = function () {
        var promise = new Internal();
        var state = getInternalState$1(promise);
        this.promise = promise;
        this.resolve = bind$1(internalResolve, promise, state);
        this.reject = bind$1(internalReject, promise, state);
      };
      newPromiseCapability.f = newPromiseCapability$1 = function (C) {
        return C === PromiseConstructor || C === PromiseWrapper
          ? new OwnPromiseCapability(C)
          : newGenericPromiseCapability(C);
      };

      if ( typeof nativePromiseConstructor == 'function') {
        nativeThen = nativePromiseConstructor.prototype.then;

        // wrap native Promise#then for native async functions
        redefine(nativePromiseConstructor.prototype, 'then', function then(onFulfilled, onRejected) {
          var that = this;
          return new PromiseConstructor(function (resolve, reject) {
            nativeThen.call(that, resolve, reject);
          }).then(onFulfilled, onRejected);
        });

        // wrap fetch result
        if (typeof $fetch == 'function') _export({ global: true, enumerable: true, forced: true }, {
          // eslint-disable-next-line no-unused-vars
          fetch: function fetch(input) {
            return promiseResolve(PromiseConstructor, $fetch.apply(global_1, arguments));
          }
        });
      }
    }

    _export({ global: true, wrap: true, forced: FORCED$1 }, {
      Promise: PromiseConstructor
    });

    setToStringTag(PromiseConstructor, PROMISE, false);
    setSpecies(PROMISE);

    PromiseWrapper = path[PROMISE];

    // statics
    _export({ target: PROMISE, stat: true, forced: FORCED$1 }, {
      // `Promise.reject` method
      // https://tc39.github.io/ecma262/#sec-promise.reject
      reject: function reject(r) {
        var capability = newPromiseCapability$1(this);
        capability.reject.call(undefined, r);
        return capability.promise;
      }
    });

    _export({ target: PROMISE, stat: true, forced:  FORCED$1 }, {
      // `Promise.resolve` method
      // https://tc39.github.io/ecma262/#sec-promise.resolve
      resolve: function resolve(x) {
        return promiseResolve( this, x);
      }
    });

    _export({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION$1 }, {
      // `Promise.all` method
      // https://tc39.github.io/ecma262/#sec-promise.all
      all: function all(iterable) {
        var C = this;
        var capability = newPromiseCapability$1(C);
        var resolve = capability.resolve;
        var reject = capability.reject;
        var result = perform(function () {
          var $promiseResolve = aFunction$1(C.resolve);
          var values = [];
          var counter = 0;
          var remaining = 1;
          iterate_1(iterable, function (promise) {
            var index = counter++;
            var alreadyCalled = false;
            values.push(undefined);
            remaining++;
            $promiseResolve.call(C, promise).then(function (value) {
              if (alreadyCalled) return;
              alreadyCalled = true;
              values[index] = value;
              --remaining || resolve(values);
            }, reject);
          });
          --remaining || resolve(values);
        });
        if (result.error) reject(result.value);
        return capability.promise;
      },
      // `Promise.race` method
      // https://tc39.github.io/ecma262/#sec-promise.race
      race: function race(iterable) {
        var C = this;
        var capability = newPromiseCapability$1(C);
        var reject = capability.reject;
        var result = perform(function () {
          var $promiseResolve = aFunction$1(C.resolve);
          iterate_1(iterable, function (promise) {
            $promiseResolve.call(C, promise).then(capability.resolve, reject);
          });
        });
        if (result.error) reject(result.value);
        return capability.promise;
      }
    });

    // `String.prototype.{ codePointAt, at }` methods implementation
    var createMethod$2 = function (CONVERT_TO_STRING) {
      return function ($this, pos) {
        var S = String(requireObjectCoercible($this));
        var position = toInteger(pos);
        var size = S.length;
        var first, second;
        if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
        first = S.charCodeAt(position);
        return first < 0xD800 || first > 0xDBFF || position + 1 === size
          || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
            ? CONVERT_TO_STRING ? S.charAt(position) : first
            : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
      };
    };

    var stringMultibyte = {
      // `String.prototype.codePointAt` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
      codeAt: createMethod$2(false),
      // `String.prototype.at` method
      // https://github.com/mathiasbynens/String.prototype.at
      charAt: createMethod$2(true)
    };

    var charAt = stringMultibyte.charAt;



    var STRING_ITERATOR = 'String Iterator';
    var setInternalState$2 = internalState.set;
    var getInternalState$2 = internalState.getterFor(STRING_ITERATOR);

    // `String.prototype[@@iterator]` method
    // https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
    defineIterator(String, 'String', function (iterated) {
      setInternalState$2(this, {
        type: STRING_ITERATOR,
        string: String(iterated),
        index: 0
      });
    // `%StringIteratorPrototype%.next` method
    // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
    }, function next() {
      var state = getInternalState$2(this);
      var string = state.string;
      var index = state.index;
      var point;
      if (index >= string.length) return { value: undefined, done: true };
      point = charAt(string, index);
      state.index += point.length;
      return { value: point, done: false };
    });

    // iterable DOM collections
    // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
    var domIterables = {
      CSSRuleList: 0,
      CSSStyleDeclaration: 0,
      CSSValueList: 0,
      ClientRectList: 0,
      DOMRectList: 0,
      DOMStringList: 0,
      DOMTokenList: 1,
      DataTransferItemList: 0,
      FileList: 0,
      HTMLAllCollection: 0,
      HTMLCollection: 0,
      HTMLFormElement: 0,
      HTMLSelectElement: 0,
      MediaList: 0,
      MimeTypeArray: 0,
      NamedNodeMap: 0,
      NodeList: 1,
      PaintRequestList: 0,
      Plugin: 0,
      PluginArray: 0,
      SVGLengthList: 0,
      SVGNumberList: 0,
      SVGPathSegList: 0,
      SVGPointList: 0,
      SVGStringList: 0,
      SVGTransformList: 0,
      SourceBufferList: 0,
      StyleSheetList: 0,
      TextTrackCueList: 0,
      TextTrackList: 0,
      TouchList: 0
    };

    var ITERATOR$5 = wellKnownSymbol('iterator');
    var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
    var ArrayValues = es_array_iterator.values;

    for (var COLLECTION_NAME in domIterables) {
      var Collection = global_1[COLLECTION_NAME];
      var CollectionPrototype = Collection && Collection.prototype;
      if (CollectionPrototype) {
        // some Chrome versions have non-configurable methods on DOMTokenList
        if (CollectionPrototype[ITERATOR$5] !== ArrayValues) try {
          hide(CollectionPrototype, ITERATOR$5, ArrayValues);
        } catch (error) {
          CollectionPrototype[ITERATOR$5] = ArrayValues;
        }
        if (!CollectionPrototype[TO_STRING_TAG$3]) hide(CollectionPrototype, TO_STRING_TAG$3, COLLECTION_NAME);
        if (domIterables[COLLECTION_NAME]) for (var METHOD_NAME in es_array_iterator) {
          // some Chrome versions have non-configurable methods on DOMTokenList
          if (CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
            hide(CollectionPrototype, METHOD_NAME, es_array_iterator[METHOD_NAME]);
          } catch (error) {
            CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME];
          }
        }
      }
    }

    var runtime_1 = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    var runtime = (function (exports) {

      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined$1; // More compressible than void 0.
      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []);

        // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.
        generator._invoke = makeInvokeMethod(innerFn, self, context);

        return generator;
      }
      exports.wrap = wrap;

      // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.
      function tryCatch(fn, obj, arg) {
        try {
          return { type: "normal", arg: fn.call(obj, arg) };
        } catch (err) {
          return { type: "throw", arg: err };
        }
      }

      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed";

      // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.
      var ContinueSentinel = {};

      // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}

      // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.
      var IteratorPrototype = {};
      IteratorPrototype[iteratorSymbol] = function () {
        return this;
      };

      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
      if (NativeIteratorPrototype &&
          NativeIteratorPrototype !== Op &&
          hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype;
      }

      var Gp = GeneratorFunctionPrototype.prototype =
        Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
      GeneratorFunctionPrototype.constructor = GeneratorFunction;
      GeneratorFunctionPrototype[toStringTagSymbol] =
        GeneratorFunction.displayName = "GeneratorFunction";

      // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.
      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function(method) {
          prototype[method] = function(arg) {
            return this._invoke(method, arg);
          };
        });
      }

      exports.isGeneratorFunction = function(genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor
          ? ctor === GeneratorFunction ||
            // For the native GeneratorFunction constructor, the best we can
            // do is to check its .name property.
            (ctor.displayName || ctor.name) === "GeneratorFunction"
          : false;
      };

      exports.mark = function(genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;
          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = "GeneratorFunction";
          }
        }
        genFun.prototype = Object.create(Gp);
        return genFun;
      };

      // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.
      exports.awrap = function(arg) {
        return { __await: arg };
      };

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);
          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;
            if (value &&
                typeof value === "object" &&
                hasOwn.call(value, "__await")) {
              return Promise.resolve(value.__await).then(function(value) {
                invoke("next", value, resolve, reject);
              }, function(err) {
                invoke("throw", err, resolve, reject);
              });
            }

            return Promise.resolve(value).then(function(unwrapped) {
              // When a yielded Promise is resolved, its final value becomes
              // the .value of the Promise<{value,done}> result for the
              // current iteration.
              result.value = unwrapped;
              resolve(result);
            }, function(error) {
              // If a rejected Promise was yielded, throw the rejection back
              // into the async generator function so it can be handled there.
              return invoke("throw", error, resolve, reject);
            });
          }
        }

        var previousPromise;

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function(resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }

          return previousPromise =
            // If enqueue has been called before, then we want to wait until
            // all previous Promises have been resolved before calling invoke,
            // so that results are always delivered in the correct order. If
            // enqueue has not been called before, then it is important to
            // call invoke immediately, without waiting on a callback to fire,
            // so that the async generator function has the opportunity to do
            // any necessary setup in a predictable way. This predictability
            // is why the Promise constructor synchronously invokes its
            // executor callback, and why async functions synchronously
            // execute code before the first await. Since we implement simple
            // async functions in terms of async generators, it is especially
            // important to get this right, even though it requires care.
            previousPromise ? previousPromise.then(
              callInvokeWithMethodAndArg,
              // Avoid propagating failures to Promises returned by later
              // invocations of the iterator.
              callInvokeWithMethodAndArg
            ) : callInvokeWithMethodAndArg();
        }

        // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).
        this._invoke = enqueue;
      }

      defineIteratorMethods(AsyncIterator.prototype);
      AsyncIterator.prototype[asyncIteratorSymbol] = function () {
        return this;
      };
      exports.AsyncIterator = AsyncIterator;

      // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.
      exports.async = function(innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(
          wrap(innerFn, outerFn, self, tryLocsList)
        );

        return exports.isGeneratorFunction(outerFn)
          ? iter // If outerFn is a generator, return the full iterator.
          : iter.next().then(function(result) {
              return result.done ? result.value : iter.next();
            });
      };

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;

        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }

          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            }

            // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
            return doneResult();
          }

          context.method = method;
          context.arg = arg;

          while (true) {
            var delegate = context.delegate;
            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);
              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue;
                return delegateResult;
              }
            }

            if (context.method === "next") {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg;

            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }

              context.dispatchException(context.arg);

            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }

            state = GenStateExecuting;

            var record = tryCatch(innerFn, self, context);
            if (record.type === "normal") {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done
                ? GenStateCompleted
                : GenStateSuspendedYield;

              if (record.arg === ContinueSentinel) {
                continue;
              }

              return {
                value: record.arg,
                done: context.done
              };

            } else if (record.type === "throw") {
              state = GenStateCompleted;
              // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.
              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      }

      // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.
      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];
        if (method === undefined$1) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null;

          if (context.method === "throw") {
            // Note: ["return"] must be used for ES3 parsing compatibility.
            if (delegate.iterator["return"]) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = "return";
              context.arg = undefined$1;
              maybeInvokeDelegate(delegate, context);

              if (context.method === "throw") {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel;
              }
            }

            context.method = "throw";
            context.arg = new TypeError(
              "The iterator does not provide a 'throw' method");
          }

          return ContinueSentinel;
        }

        var record = tryCatch(method, delegate.iterator, context.arg);

        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }

        var info = record.arg;

        if (! info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value;

          // Resume execution at the desired location (see delegateYield).
          context.next = delegate.nextLoc;

          // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.
          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined$1;
          }

        } else {
          // Re-yield the result returned by the delegate method.
          return info;
        }

        // The delegate iterator is finished, so forget it and continue with
        // the outer generator.
        context.delegate = null;
        return ContinueSentinel;
      }

      // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.
      defineIteratorMethods(Gp);

      Gp[toStringTagSymbol] = "Generator";

      // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.
      Gp[iteratorSymbol] = function() {
        return this;
      };

      Gp.toString = function() {
        return "[object Generator]";
      };

      function pushTryEntry(locs) {
        var entry = { tryLoc: locs[0] };

        if (1 in locs) {
          entry.catchLoc = locs[1];
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }

        this.tryEntries.push(entry);
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{ tryLoc: "root" }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }

      exports.keys = function(object) {
        var keys = [];
        for (var key in object) {
          keys.push(key);
        }
        keys.reverse();

        // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.
        return function next() {
          while (keys.length) {
            var key = keys.pop();
            if (key in object) {
              next.value = key;
              next.done = false;
              return next;
            }
          }

          // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.
          next.done = true;
          return next;
        };
      };

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];
          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

          if (typeof iterable.next === "function") {
            return iterable;
          }

          if (!isNaN(iterable.length)) {
            var i = -1, next = function next() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next.value = iterable[i];
                  next.done = false;
                  return next;
                }
              }

              next.value = undefined$1;
              next.done = true;

              return next;
            };

            return next.next = next;
          }
        }

        // Return an iterator with no values.
        return { next: doneResult };
      }
      exports.values = values;

      function doneResult() {
        return { value: undefined$1, done: true };
      }

      Context.prototype = {
        constructor: Context,

        reset: function(skipTempReset) {
          this.prev = 0;
          this.next = 0;
          // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.
          this.sent = this._sent = undefined$1;
          this.done = false;
          this.delegate = null;

          this.method = "next";
          this.arg = undefined$1;

          this.tryEntries.forEach(resetTryEntry);

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (name.charAt(0) === "t" &&
                  hasOwn.call(this, name) &&
                  !isNaN(+name.slice(1))) {
                this[name] = undefined$1;
              }
            }
          }
        },

        stop: function() {
          this.done = true;

          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;
          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }

          return this.rval;
        },

        dispatchException: function(exception) {
          if (this.done) {
            throw exception;
          }

          var context = this;
          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = "next";
              context.arg = undefined$1;
            }

            return !! caught;
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;

            if (entry.tryLoc === "root") {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle("end");
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }

              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }

              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }

              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },

        abrupt: function(type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc <= this.prev &&
                hasOwn.call(entry, "finallyLoc") &&
                this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }

          if (finallyEntry &&
              (type === "break" ||
               type === "continue") &&
              finallyEntry.tryLoc <= arg &&
              arg <= finallyEntry.finallyLoc) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null;
          }

          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;

          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }

          return this.complete(record);
        },

        complete: function(record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }

          if (record.type === "break" ||
              record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }

          return ContinueSentinel;
        },

        finish: function(finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },

        "catch": function(tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;
              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }
              return thrown;
            }
          }

          // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.
          throw new Error("illegal catch attempt");
        },

        delegateYield: function(iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          };

          if (this.method === "next") {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined$1;
          }

          return ContinueSentinel;
        }
      };

      // Regardless of whether this script is executing as a CommonJS module
      // or not, return the runtime object so that we can declare the variable
      // regeneratorRuntime in the outer scope, which allows this module to be
      // injected easily by `bin/regenerator --include-runtime script.js`.
      return exports;

    }(
      // If this script is executing as a CommonJS module, use module.exports
      // as the regeneratorRuntime namespace. Otherwise create a new empty
      // object. Either way, the resulting object will be used to initialize
      // the regeneratorRuntime variable at the top of this file.
       module.exports 
    ));

    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      // This module should not be running in strict mode, so the above
      // assignment should always work unless something is misconfigured. Just
      // in case runtime.js accidentally runs in strict mode, we can escape
      // strict mode using a global Function call. This could conceivably fail
      // if a Content Security Policy forbids using Function, but in that case
      // the proper solution is to fix the accidental strict mode problem. If
      // you've misconfigured your bundler to force strict mode and applied a
      // CSP to forbid Function, and you're not willing to fix either of those
      // problems, please detail your unique predicament in a GitHub issue.
      Function("r", "regeneratorRuntime = r")(runtime);
    }
    });

    function getMockUsers() {
      return _getMockUsers.apply(this, arguments);
    }

    function _getMockUsers() {
      _getMockUsers = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var count,
            gender,
            res,
            data,
            ntkData,
            _args2 = arguments;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                count = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : 20;
                gender = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : '';
                _context2.next = 4;
                return fetch("https://randomuser.me/api/?results=".concat(count, "&gender={").concat(gender, "&seed=alondanin"));

              case 4:
                res = _context2.sent;
                _context2.next = 7;
                return res.json();

              case 7:
                data = _context2.sent;
                ntkData = data.results.map(function (user) {
                  var ntkPerson = {
                    ntkDetails: {
                      id: "".concat(user.login.uid),
                      name: "".concat(user.name.first, " ").concat(user.name.last),
                      age: user.dob.age,
                      imageUrl: "".concat(user.picture.large),
                      moreDetails: {
                        hobbies: [],
                        email: "".concat(user.email)
                      }
                    },
                    isMarked: false,
                    isApproved: false
                  };
                  return ntkPerson;
                });
                return _context2.abrupt("return", ntkData);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));
      return _getMockUsers.apply(this, arguments);
    }

    var IDX=36, HEX='';
    while (IDX--) HEX += IDX.toString(36);

    function uid$1 (len) {
    	var str='', num = len || 11;
    	while (num--) str += HEX[Math.random() * 36 | 0];
    	return str;
    }

    var ntkStore = writable({
      ntkPersons: []
    });
    var customNtkStore = {
      subscribe: ntkStore.subscribe,
      isEmpty: function isEmpty() {
        var store = get_store_value(ntkStore);
        return store.ntkPersons.length === 0;
      },
      setStoreAsync: function setStoreAsync() {
        getMockUsers(100).then(function (ntks) {
          ntkStore.set({
            ntkPersons: ntks
          });
        });
      },
      onMarkedChanged: function onMarkedChanged(ntkId) {
        ntkStore.update(function (state) {
          var ntkp = state.ntkPersons;
          var foundIndex = ntkp.findIndex(function (ntkPerson) {
            return ntkPerson.ntkDetails.id === ntkId;
          });

          if (foundIndex === -1) {
            throw new Error('No person was found to update');
          }

          ntkp[foundIndex].isMarked = !ntkp[foundIndex].isMarked;
          ntkp.splice(foundIndex, 1, ntkp[foundIndex]);
          return _objectSpread2({}, state);
        });
      },
      onApprovalChanged: function onApprovalChanged(ntkId, isApproved) {
        ntkStore.update(function (state) {
          var ntkp = state.ntkPersons;
          var foundIndex = ntkp.findIndex(function (ntkPerson) {
            return ntkPerson.ntkDetails.id === ntkId;
          });

          if (foundIndex === -1) {
            throw new Error('No person was found to update');
          }

          ntkp[foundIndex].isApproved = isApproved;
          ntkp.splice(foundIndex, 1, ntkp[foundIndex]);
          return _objectSpread2({}, state);
        });
      },
      registerUser: function registerUser(user) {
        ntkStore.update(function (state) {
          var ntkp = state.ntkPersons;
          var newNTK = {
            ntkDetails: _objectSpread2({}, user, {
              id: uid$1()
            }),
            isMarked: false,
            isApproved: false
          };
          ntkp.push(newNTK);
          return _objectSpread2({}, state);
        });
      } // export function getMyNtks(): NTKPerson[] {
      //     const store = get(ntkStore);
      //     const ntks = store.ntkPersons.filter((ntk: NTKPerson) => {
      //         return ntk.isMarked
      //     })
      //     return ntks
      // }
      //
      // export function getNtks(): NTKPerson[] {
      //     const store = get(ntkStore);
      //     const ntks = store.ntkPersons.filter((ntk: NTKPerson) => {
      //         return !ntk.isMarked
      //     })
      //     return ntks
      // }

    };

    /* src\components\GeneralNTKs.svelte generated by Svelte v3.9.1 */

    const file$f = "src\\components\\GeneralNTKs.svelte";

    function create_fragment$j(ctx) {
    	var div, current;

    	var ntklist = new NTKList({
    		props: {
    		ntkList: ctx.ntkList,
    		isApproval: false
    	},
    		$$inline: true
    	});
    	ntklist.$on("markedChanged", onMarkedChanged);

    	return {
    		c: function create() {
    			div = element("div");
    			ntklist.$$.fragment.c();
    			attr(div, "class", "container svelte-86kc1o");
    			add_location(div, file$f, 50, 0, 2165);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(ntklist, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var ntklist_changes = {};
    			if (changed.ntkList) ntklist_changes.ntkList = ctx.ntkList;
    			ntklist.$set(ntklist_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(ntklist.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(ntklist.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(ntklist);
    		}
    	};
    }

    function onMarkedChanged(event) {
          customNtkStore.onMarkedChanged(event.detail.id);
      }

    function instance$j($$self, $$props, $$invalidate) {
    	

        let ntkList=[];

        onMount(() => {
            if (customNtkStore.isEmpty()) {
                customNtkStore.setStoreAsync();
            }
        });

        const unsubscribe=customNtkStore.subscribe(state => {
            $$invalidate('ntkList', ntkList=state.ntkPersons);
        });

        onDestroy(() => {
            unsubscribe();
        });
        //
        // function onPersonSelected(event) {
        //     currentSelectedPerson = event.detail;
        //     isNTKPersonDialogOpen = true;
        // }

    	return { ntkList };
    }

    class GeneralNTKs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, []);
    	}
    }

    /* src\components\MyNTKs.svelte generated by Svelte v3.9.1 */

    const file$g = "src\\components\\MyNTKs.svelte";

    // (76:8) {:else}
    function create_else_block$1(ctx) {
    	var div, t, h2, current;

    	var icon = new Icon({
    		props: {
    		class: "material-icons",
    		$$slots: { default: [create_default_slot$6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			icon.$$.fragment.c();
    			t = space();
    			h2 = element("h2");
    			h2.textContent = "You havn't selected any Nice-to-Knows";
    			attr(h2, "class", "svelte-10qzlp5");
    			add_location(h2, file$g, 78, 12, 3719);
    			attr(div, "class", "no-ntks svelte-10qzlp5");
    			add_location(div, file$g, 76, 8, 3619);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			append(div, t);
    			append(div, h2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(icon);
    		}
    	};
    }

    // (70:4) {#if ntkList.length > 0}
    function create_if_block$3(ctx) {
    	var current;

    	var ntklist = new NTKList({
    		props: {
    		ntkList: ctx.ntkList,
    		isApproval: false
    	},
    		$$inline: true
    	});
    	ntklist.$on("markedChanged", onMarkedChanged$1);

    	return {
    		c: function create() {
    			ntklist.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(ntklist, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var ntklist_changes = {};
    			if (changed.ntkList) ntklist_changes.ntkList = ctx.ntkList;
    			ntklist.$set(ntklist_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(ntklist.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(ntklist.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(ntklist, detaching);
    		}
    	};
    }

    // (78:12) <Icon class="material-icons">
    function create_default_slot$6(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("favorite_border");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$k(ctx) {
    	var div, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block$3,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.ntkList.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "container svelte-10qzlp5");
    			add_location(div, file$g, 68, 0, 3384);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function onMarkedChanged$1(event) {
          customNtkStore.onMarkedChanged(event.detail.id);
      }

    function instance$k($$self, $$props, $$invalidate) {
    	

        let ntkList=[];

        const unsubscribe=customNtkStore.subscribe(state => {
            $$invalidate('ntkList', ntkList=state.ntkPersons.filter(ntkp => ntkp.isMarked));
        });

        onDestroy(() => {
            unsubscribe();
        });
        //
        // function onPersonSelected(event) {
        //     currentSelectedPerson = event.detail;
        //     isNTKPersonDialogOpen = true;
        // }

    	return { ntkList };
    }

    class MyNTKs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, []);
    	}
    }

    /* src\components\NTKsApproval.svelte generated by Svelte v3.9.1 */

    const file$h = "src\\components\\NTKsApproval.svelte";

    // (81:8) {:else}
    function create_else_block$2(ctx) {
    	var div, t, h2, current;

    	var icon = new Icon({
    		props: {
    		class: "material-icons",
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			icon.$$.fragment.c();
    			t = space();
    			h2 = element("h2");
    			h2.textContent = "No nice-to-knows to approve";
    			attr(h2, "class", "svelte-r70l8g");
    			add_location(h2, file$h, 83, 12, 3932);
    			attr(div, "class", "no-ntks svelte-r70l8g");
    			add_location(div, file$h, 81, 8, 3832);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(icon, div, null);
    			append(div, t);
    			append(div, h2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(icon);
    		}
    	};
    }

    // (74:4) {#if ntkList.length > 0}
    function create_if_block$4(ctx) {
    	var current;

    	var ntklist = new NTKList({
    		props: {
    		ntkList: ctx.ntkList,
    		isApproval: true
    	},
    		$$inline: true
    	});
    	ntklist.$on("markedChanged", onMarkedChanged$2);
    	ntklist.$on("approvalChanged", onApprovalChanged);

    	return {
    		c: function create() {
    			ntklist.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(ntklist, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var ntklist_changes = {};
    			if (changed.ntkList) ntklist_changes.ntkList = ctx.ntkList;
    			ntklist.$set(ntklist_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(ntklist.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(ntklist.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(ntklist, detaching);
    		}
    	};
    }

    // (83:12) <Icon class="material-icons">
    function create_default_slot$7(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("favorite_border");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$l(ctx) {
    	var div, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block$4,
    		create_else_block$2
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.ntkList.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "container svelte-r70l8g");
    			add_location(div, file$h, 72, 0, 3542);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function onMarkedChanged$2(event) {
          customNtkStore.onMarkedChanged(event.detail.id);
      }

    function onApprovalChanged(event) {
          customNtkStore.onApprovalChanged(event.detail.id, event.detail.isApproved);
      }

    function instance$l($$self, $$props, $$invalidate) {
    	

        let ntkList=[];

        const unsubscribe=customNtkStore.subscribe(state => {
            $$invalidate('ntkList', ntkList=state.ntkPersons.filter(ntkp => ntkp.isMarked));
        });

        onDestroy(() => {
            unsubscribe();
        });
        //
        // function onPersonSelected(event) {
        //     currentSelectedPerson = event.detail;
        //     isNTKPersonDialogOpen = true;
        // }

    	return { ntkList };
    }

    class NTKsApproval extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, []);
    	}
    }

    var viewKeys = {
      GENERAL_NTKS: 'generalNtks',
      MY_NTKS: 'myNtks',
      NTKS_APPROVAL: 'ntksApproval'
    };

    var viewsRepo = [{
      id: viewKeys.GENERAL_NTKS,
      view: GeneralNTKs,
      caption: 'All Nice-to-knows'
    }, {
      id: viewKeys.MY_NTKS,
      view: MyNTKs,
      caption: 'My Nice-to-knows'
    }, {
      id: viewKeys.NTKS_APPROVAL,
      view: NTKsApproval,
      caption: 'Nice-to-knows approval'
    }];
    function getView$1() {
      var viewId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : viewKeys.MY_NTKS;
      // @ts-ignore
      var found = viewsRepo.find(function (view) {
        return view.id === viewId;
      });
      return found;
    }

    var viewStore = writable({
      currentView: getView$1('myNtks')
    });
    var customViewStore = {
      subscribe: viewStore.subscribe,
      setView: function setView(viewId) {
        viewStore.update(function (state) {
          return {
            currentView: getView$1(viewId)
          };
        });
      }
    };

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$3 = {
        LABEL_FLOAT_ABOVE: 'mdc-floating-label--float-above',
        LABEL_SHAKE: 'mdc-floating-label--shake',
        ROOT: 'mdc-floating-label',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFloatingLabelFoundation = /** @class */ (function (_super) {
        __extends(MDCFloatingLabelFoundation, _super);
        function MDCFloatingLabelFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCFloatingLabelFoundation.defaultAdapter, adapter)) || this;
            _this.shakeAnimationEndHandler_ = function () { return _this.handleShakeAnimationEnd_(); };
            return _this;
        }
        Object.defineProperty(MDCFloatingLabelFoundation, "cssClasses", {
            get: function () {
                return cssClasses$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFloatingLabelFoundation, "defaultAdapter", {
            /**
             * See {@link MDCFloatingLabelAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    getWidth: function () { return 0; },
                    registerInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCFloatingLabelFoundation.prototype.init = function () {
            this.adapter_.registerInteractionHandler('animationend', this.shakeAnimationEndHandler_);
        };
        MDCFloatingLabelFoundation.prototype.destroy = function () {
            this.adapter_.deregisterInteractionHandler('animationend', this.shakeAnimationEndHandler_);
        };
        /**
         * Returns the width of the label element.
         */
        MDCFloatingLabelFoundation.prototype.getWidth = function () {
            return this.adapter_.getWidth();
        };
        /**
         * Styles the label to produce a shake animation to indicate an error.
         * @param shouldShake If true, adds the shake CSS class; otherwise, removes shake class.
         */
        MDCFloatingLabelFoundation.prototype.shake = function (shouldShake) {
            var LABEL_SHAKE = MDCFloatingLabelFoundation.cssClasses.LABEL_SHAKE;
            if (shouldShake) {
                this.adapter_.addClass(LABEL_SHAKE);
            }
            else {
                this.adapter_.removeClass(LABEL_SHAKE);
            }
        };
        /**
         * Styles the label to float or dock.
         * @param shouldFloat If true, adds the float CSS class; otherwise, removes float and shake classes to dock the label.
         */
        MDCFloatingLabelFoundation.prototype.float = function (shouldFloat) {
            var _a = MDCFloatingLabelFoundation.cssClasses, LABEL_FLOAT_ABOVE = _a.LABEL_FLOAT_ABOVE, LABEL_SHAKE = _a.LABEL_SHAKE;
            if (shouldFloat) {
                this.adapter_.addClass(LABEL_FLOAT_ABOVE);
            }
            else {
                this.adapter_.removeClass(LABEL_FLOAT_ABOVE);
                this.adapter_.removeClass(LABEL_SHAKE);
            }
        };
        MDCFloatingLabelFoundation.prototype.handleShakeAnimationEnd_ = function () {
            var LABEL_SHAKE = MDCFloatingLabelFoundation.cssClasses.LABEL_SHAKE;
            this.adapter_.removeClass(LABEL_SHAKE);
        };
        return MDCFloatingLabelFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFloatingLabel = /** @class */ (function (_super) {
        __extends(MDCFloatingLabel, _super);
        function MDCFloatingLabel() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCFloatingLabel.attachTo = function (root) {
            return new MDCFloatingLabel(root);
        };
        /**
         * Styles the label to produce the label shake for errors.
         * @param shouldShake If true, shakes the label by adding a CSS class; otherwise, stops shaking by removing the class.
         */
        MDCFloatingLabel.prototype.shake = function (shouldShake) {
            this.foundation_.shake(shouldShake);
        };
        /**
         * Styles the label to float/dock.
         * @param shouldFloat If true, floats the label by adding a CSS class; otherwise, docks it by removing the class.
         */
        MDCFloatingLabel.prototype.float = function (shouldFloat) {
            this.foundation_.float(shouldFloat);
        };
        MDCFloatingLabel.prototype.getWidth = function () {
            return this.foundation_.getWidth();
        };
        MDCFloatingLabel.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                getWidth: function () { return _this.root_.scrollWidth; },
                registerInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
                deregisterInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCFloatingLabelFoundation(adapter);
        };
        return MDCFloatingLabel;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$4 = {
        LINE_RIPPLE_ACTIVE: 'mdc-line-ripple--active',
        LINE_RIPPLE_DEACTIVATING: 'mdc-line-ripple--deactivating',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCLineRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCLineRippleFoundation, _super);
        function MDCLineRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCLineRippleFoundation.defaultAdapter, adapter)) || this;
            _this.transitionEndHandler_ = function (evt) { return _this.handleTransitionEnd(evt); };
            return _this;
        }
        Object.defineProperty(MDCLineRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses$4;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCLineRippleFoundation, "defaultAdapter", {
            /**
             * See {@link MDCLineRippleAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    setStyle: function () { return undefined; },
                    registerEventHandler: function () { return undefined; },
                    deregisterEventHandler: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCLineRippleFoundation.prototype.init = function () {
            this.adapter_.registerEventHandler('transitionend', this.transitionEndHandler_);
        };
        MDCLineRippleFoundation.prototype.destroy = function () {
            this.adapter_.deregisterEventHandler('transitionend', this.transitionEndHandler_);
        };
        MDCLineRippleFoundation.prototype.activate = function () {
            this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
            this.adapter_.addClass(cssClasses$4.LINE_RIPPLE_ACTIVE);
        };
        MDCLineRippleFoundation.prototype.setRippleCenter = function (xCoordinate) {
            this.adapter_.setStyle('transform-origin', xCoordinate + "px center");
        };
        MDCLineRippleFoundation.prototype.deactivate = function () {
            this.adapter_.addClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
        };
        MDCLineRippleFoundation.prototype.handleTransitionEnd = function (evt) {
            // Wait for the line ripple to be either transparent or opaque
            // before emitting the animation end event
            var isDeactivating = this.adapter_.hasClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
            if (evt.propertyName === 'opacity') {
                if (isDeactivating) {
                    this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_ACTIVE);
                    this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
                }
            }
        };
        return MDCLineRippleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCLineRipple = /** @class */ (function (_super) {
        __extends(MDCLineRipple, _super);
        function MDCLineRipple() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCLineRipple.attachTo = function (root) {
            return new MDCLineRipple(root);
        };
        /**
         * Activates the line ripple
         */
        MDCLineRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        /**
         * Deactivates the line ripple
         */
        MDCLineRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        /**
         * Sets the transform origin given a user's click location.
         * The `rippleCenter` is the x-coordinate of the middle of the ripple.
         */
        MDCLineRipple.prototype.setRippleCenter = function (xCoordinate) {
            this.foundation_.setRippleCenter(xCoordinate);
        };
        MDCLineRipple.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                setStyle: function (propertyName, value) { return _this.root_.style.setProperty(propertyName, value); },
                registerEventHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
                deregisterEventHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCLineRippleFoundation(adapter);
        };
        return MDCLineRipple;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$5 = {
        NOTCH_ELEMENT_SELECTOR: '.mdc-notched-outline__notch',
    };
    var numbers$2 = {
        // This should stay in sync with $mdc-notched-outline-padding * 2.
        NOTCH_ELEMENT_PADDING: 8,
    };
    var cssClasses$5 = {
        NO_LABEL: 'mdc-notched-outline--no-label',
        OUTLINE_NOTCHED: 'mdc-notched-outline--notched',
        OUTLINE_UPGRADED: 'mdc-notched-outline--upgraded',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCNotchedOutlineFoundation = /** @class */ (function (_super) {
        __extends(MDCNotchedOutlineFoundation, _super);
        function MDCNotchedOutlineFoundation(adapter) {
            return _super.call(this, __assign({}, MDCNotchedOutlineFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCNotchedOutlineFoundation, "strings", {
            get: function () {
                return strings$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCNotchedOutlineFoundation, "cssClasses", {
            get: function () {
                return cssClasses$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCNotchedOutlineFoundation, "numbers", {
            get: function () {
                return numbers$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCNotchedOutlineFoundation, "defaultAdapter", {
            /**
             * See {@link MDCNotchedOutlineAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    setNotchWidthProperty: function () { return undefined; },
                    removeNotchWidthProperty: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Adds the outline notched selector and updates the notch width calculated based off of notchWidth.
         */
        MDCNotchedOutlineFoundation.prototype.notch = function (notchWidth) {
            var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation.cssClasses.OUTLINE_NOTCHED;
            if (notchWidth > 0) {
                notchWidth += numbers$2.NOTCH_ELEMENT_PADDING; // Add padding from left/right.
            }
            this.adapter_.setNotchWidthProperty(notchWidth);
            this.adapter_.addClass(OUTLINE_NOTCHED);
        };
        /**
         * Removes notched outline selector to close the notch in the outline.
         */
        MDCNotchedOutlineFoundation.prototype.closeNotch = function () {
            var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation.cssClasses.OUTLINE_NOTCHED;
            this.adapter_.removeClass(OUTLINE_NOTCHED);
            this.adapter_.removeNotchWidthProperty();
        };
        return MDCNotchedOutlineFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCNotchedOutline = /** @class */ (function (_super) {
        __extends(MDCNotchedOutline, _super);
        function MDCNotchedOutline() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCNotchedOutline.attachTo = function (root) {
            return new MDCNotchedOutline(root);
        };
        MDCNotchedOutline.prototype.initialSyncWithDOM = function () {
            this.notchElement_ = this.root_.querySelector(strings$5.NOTCH_ELEMENT_SELECTOR);
            var label = this.root_.querySelector('.' + MDCFloatingLabelFoundation.cssClasses.ROOT);
            if (label) {
                label.style.transitionDuration = '0s';
                this.root_.classList.add(cssClasses$5.OUTLINE_UPGRADED);
                requestAnimationFrame(function () {
                    label.style.transitionDuration = '';
                });
            }
            else {
                this.root_.classList.add(cssClasses$5.NO_LABEL);
            }
        };
        /**
         * Updates classes and styles to open the notch to the specified width.
         * @param notchWidth The notch width in the outline.
         */
        MDCNotchedOutline.prototype.notch = function (notchWidth) {
            this.foundation_.notch(notchWidth);
        };
        /**
         * Updates classes and styles to close the notch.
         */
        MDCNotchedOutline.prototype.closeNotch = function () {
            this.foundation_.closeNotch();
        };
        MDCNotchedOutline.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setNotchWidthProperty: function (width) { return _this.notchElement_.style.setProperty('width', width + 'px'); },
                removeNotchWidthProperty: function () { return _this.notchElement_.style.removeProperty('width'); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCNotchedOutlineFoundation(adapter);
        };
        return MDCNotchedOutline;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$6 = {
        ROOT: 'mdc-text-field-character-counter',
    };
    var strings$6 = {
        ROOT_SELECTOR: "." + cssClasses$6.ROOT,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextFieldCharacterCounterFoundation = /** @class */ (function (_super) {
        __extends(MDCTextFieldCharacterCounterFoundation, _super);
        function MDCTextFieldCharacterCounterFoundation(adapter) {
            return _super.call(this, __assign({}, MDCTextFieldCharacterCounterFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "cssClasses", {
            get: function () {
                return cssClasses$6;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "strings", {
            get: function () {
                return strings$6;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTextFieldCharacterCounterAdapter} for typing information on parameters and return types.
             */
            get: function () {
                return {
                    setContent: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldCharacterCounterFoundation.prototype.setCounterValue = function (currentLength, maxLength) {
            currentLength = Math.min(currentLength, maxLength);
            this.adapter_.setContent(currentLength + " / " + maxLength);
        };
        return MDCTextFieldCharacterCounterFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextFieldCharacterCounter = /** @class */ (function (_super) {
        __extends(MDCTextFieldCharacterCounter, _super);
        function MDCTextFieldCharacterCounter() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTextFieldCharacterCounter.attachTo = function (root) {
            return new MDCTextFieldCharacterCounter(root);
        };
        Object.defineProperty(MDCTextFieldCharacterCounter.prototype, "foundation", {
            get: function () {
                return this.foundation_;
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldCharacterCounter.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                setContent: function (content) {
                    _this.root_.textContent = content;
                },
            };
            return new MDCTextFieldCharacterCounterFoundation(adapter);
        };
        return MDCTextFieldCharacterCounter;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$7 = {
        ARIA_CONTROLS: 'aria-controls',
        ICON_SELECTOR: '.mdc-text-field__icon',
        INPUT_SELECTOR: '.mdc-text-field__input',
        LABEL_SELECTOR: '.mdc-floating-label',
        LINE_RIPPLE_SELECTOR: '.mdc-line-ripple',
        OUTLINE_SELECTOR: '.mdc-notched-outline',
    };
    var cssClasses$7 = {
        DENSE: 'mdc-text-field--dense',
        DISABLED: 'mdc-text-field--disabled',
        FOCUSED: 'mdc-text-field--focused',
        FULLWIDTH: 'mdc-text-field--fullwidth',
        HELPER_LINE: 'mdc-text-field-helper-line',
        INVALID: 'mdc-text-field--invalid',
        NO_LABEL: 'mdc-text-field--no-label',
        OUTLINED: 'mdc-text-field--outlined',
        ROOT: 'mdc-text-field',
        TEXTAREA: 'mdc-text-field--textarea',
        WITH_LEADING_ICON: 'mdc-text-field--with-leading-icon',
        WITH_TRAILING_ICON: 'mdc-text-field--with-trailing-icon',
    };
    var numbers$3 = {
        DENSE_LABEL_SCALE: 0.923,
        LABEL_SCALE: 0.75,
    };
    /**
     * Whitelist based off of https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
     * under the "Validation-related attributes" section.
     */
    var VALIDATION_ATTR_WHITELIST = [
        'pattern', 'min', 'max', 'required', 'step', 'minlength', 'maxlength',
    ];
    /**
     * Label should always float for these types as they show some UI even if value is empty.
     */
    var ALWAYS_FLOAT_TYPES = [
        'color', 'date', 'datetime-local', 'month', 'range', 'time', 'week',
    ];
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var POINTERDOWN_EVENTS = ['mousedown', 'touchstart'];
    var INTERACTION_EVENTS = ['click', 'keydown'];
    var MDCTextFieldFoundation = /** @class */ (function (_super) {
        __extends(MDCTextFieldFoundation, _super);
        /**
         * @param adapter
         * @param foundationMap Map from subcomponent names to their subfoundations.
         */
        function MDCTextFieldFoundation(adapter, foundationMap) {
            if (foundationMap === void 0) { foundationMap = {}; }
            var _this = _super.call(this, __assign({}, MDCTextFieldFoundation.defaultAdapter, adapter)) || this;
            _this.isFocused_ = false;
            _this.receivedUserInput_ = false;
            _this.isValid_ = true;
            _this.useNativeValidation_ = true;
            _this.helperText_ = foundationMap.helperText;
            _this.characterCounter_ = foundationMap.characterCounter;
            _this.leadingIcon_ = foundationMap.leadingIcon;
            _this.trailingIcon_ = foundationMap.trailingIcon;
            _this.inputFocusHandler_ = function () { return _this.activateFocus(); };
            _this.inputBlurHandler_ = function () { return _this.deactivateFocus(); };
            _this.inputInputHandler_ = function () { return _this.handleInput(); };
            _this.setPointerXOffset_ = function (evt) { return _this.setTransformOrigin(evt); };
            _this.textFieldInteractionHandler_ = function () { return _this.handleTextFieldInteraction(); };
            _this.validationAttributeChangeHandler_ = function (attributesList) { return _this.handleValidationAttributeChange(attributesList); };
            return _this;
        }
        Object.defineProperty(MDCTextFieldFoundation, "cssClasses", {
            get: function () {
                return cssClasses$7;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation, "strings", {
            get: function () {
                return strings$7;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation, "numbers", {
            get: function () {
                return numbers$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldAlwaysFloat_", {
            get: function () {
                var type = this.getNativeInput_().type;
                return ALWAYS_FLOAT_TYPES.indexOf(type) >= 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldFloat", {
            get: function () {
                return this.shouldAlwaysFloat_ || this.isFocused_ || Boolean(this.getValue()) || this.isBadInput_();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldShake", {
            get: function () {
                return !this.isFocused_ && !this.isValid() && Boolean(this.getValue());
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTextFieldAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return true; },
                    registerTextFieldInteractionHandler: function () { return undefined; },
                    deregisterTextFieldInteractionHandler: function () { return undefined; },
                    registerInputInteractionHandler: function () { return undefined; },
                    deregisterInputInteractionHandler: function () { return undefined; },
                    registerValidationAttributeChangeHandler: function () { return new MutationObserver(function () { return undefined; }); },
                    deregisterValidationAttributeChangeHandler: function () { return undefined; },
                    getNativeInput: function () { return null; },
                    isFocused: function () { return false; },
                    activateLineRipple: function () { return undefined; },
                    deactivateLineRipple: function () { return undefined; },
                    setLineRippleTransformOrigin: function () { return undefined; },
                    shakeLabel: function () { return undefined; },
                    floatLabel: function () { return undefined; },
                    hasLabel: function () { return false; },
                    getLabelWidth: function () { return 0; },
                    hasOutline: function () { return false; },
                    notchOutline: function () { return undefined; },
                    closeOutline: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldFoundation.prototype.init = function () {
            var _this = this;
            if (this.adapter_.isFocused()) {
                this.inputFocusHandler_();
            }
            else if (this.adapter_.hasLabel() && this.shouldFloat) {
                this.notchOutline(true);
                this.adapter_.floatLabel(true);
            }
            this.adapter_.registerInputInteractionHandler('focus', this.inputFocusHandler_);
            this.adapter_.registerInputInteractionHandler('blur', this.inputBlurHandler_);
            this.adapter_.registerInputInteractionHandler('input', this.inputInputHandler_);
            POINTERDOWN_EVENTS.forEach(function (evtType) {
                _this.adapter_.registerInputInteractionHandler(evtType, _this.setPointerXOffset_);
            });
            INTERACTION_EVENTS.forEach(function (evtType) {
                _this.adapter_.registerTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
            });
            this.validationObserver_ =
                this.adapter_.registerValidationAttributeChangeHandler(this.validationAttributeChangeHandler_);
            this.setCharacterCounter_(this.getValue().length);
        };
        MDCTextFieldFoundation.prototype.destroy = function () {
            var _this = this;
            this.adapter_.deregisterInputInteractionHandler('focus', this.inputFocusHandler_);
            this.adapter_.deregisterInputInteractionHandler('blur', this.inputBlurHandler_);
            this.adapter_.deregisterInputInteractionHandler('input', this.inputInputHandler_);
            POINTERDOWN_EVENTS.forEach(function (evtType) {
                _this.adapter_.deregisterInputInteractionHandler(evtType, _this.setPointerXOffset_);
            });
            INTERACTION_EVENTS.forEach(function (evtType) {
                _this.adapter_.deregisterTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
            });
            this.adapter_.deregisterValidationAttributeChangeHandler(this.validationObserver_);
        };
        /**
         * Handles user interactions with the Text Field.
         */
        MDCTextFieldFoundation.prototype.handleTextFieldInteraction = function () {
            var nativeInput = this.adapter_.getNativeInput();
            if (nativeInput && nativeInput.disabled) {
                return;
            }
            this.receivedUserInput_ = true;
        };
        /**
         * Handles validation attribute changes
         */
        MDCTextFieldFoundation.prototype.handleValidationAttributeChange = function (attributesList) {
            var _this = this;
            attributesList.some(function (attributeName) {
                if (VALIDATION_ATTR_WHITELIST.indexOf(attributeName) > -1) {
                    _this.styleValidity_(true);
                    return true;
                }
                return false;
            });
            if (attributesList.indexOf('maxlength') > -1) {
                this.setCharacterCounter_(this.getValue().length);
            }
        };
        /**
         * Opens/closes the notched outline.
         */
        MDCTextFieldFoundation.prototype.notchOutline = function (openNotch) {
            if (!this.adapter_.hasOutline()) {
                return;
            }
            if (openNotch) {
                var isDense = this.adapter_.hasClass(cssClasses$7.DENSE);
                var labelScale = isDense ? numbers$3.DENSE_LABEL_SCALE : numbers$3.LABEL_SCALE;
                var labelWidth = this.adapter_.getLabelWidth() * labelScale;
                this.adapter_.notchOutline(labelWidth);
            }
            else {
                this.adapter_.closeOutline();
            }
        };
        /**
         * Activates the text field focus state.
         */
        MDCTextFieldFoundation.prototype.activateFocus = function () {
            this.isFocused_ = true;
            this.styleFocused_(this.isFocused_);
            this.adapter_.activateLineRipple();
            if (this.adapter_.hasLabel()) {
                this.notchOutline(this.shouldFloat);
                this.adapter_.floatLabel(this.shouldFloat);
                this.adapter_.shakeLabel(this.shouldShake);
            }
            if (this.helperText_) {
                this.helperText_.showToScreenReader();
            }
        };
        /**
         * Sets the line ripple's transform origin, so that the line ripple activate
         * animation will animate out from the user's click location.
         */
        MDCTextFieldFoundation.prototype.setTransformOrigin = function (evt) {
            var touches = evt.touches;
            var targetEvent = touches ? touches[0] : evt;
            var targetClientRect = targetEvent.target.getBoundingClientRect();
            var normalizedX = targetEvent.clientX - targetClientRect.left;
            this.adapter_.setLineRippleTransformOrigin(normalizedX);
        };
        /**
         * Handles input change of text input and text area.
         */
        MDCTextFieldFoundation.prototype.handleInput = function () {
            this.autoCompleteFocus();
            this.setCharacterCounter_(this.getValue().length);
        };
        /**
         * Activates the Text Field's focus state in cases when the input value
         * changes without user input (e.g. programmatically).
         */
        MDCTextFieldFoundation.prototype.autoCompleteFocus = function () {
            if (!this.receivedUserInput_) {
                this.activateFocus();
            }
        };
        /**
         * Deactivates the Text Field's focus state.
         */
        MDCTextFieldFoundation.prototype.deactivateFocus = function () {
            this.isFocused_ = false;
            this.adapter_.deactivateLineRipple();
            var isValid = this.isValid();
            this.styleValidity_(isValid);
            this.styleFocused_(this.isFocused_);
            if (this.adapter_.hasLabel()) {
                this.notchOutline(this.shouldFloat);
                this.adapter_.floatLabel(this.shouldFloat);
                this.adapter_.shakeLabel(this.shouldShake);
            }
            if (!this.shouldFloat) {
                this.receivedUserInput_ = false;
            }
        };
        MDCTextFieldFoundation.prototype.getValue = function () {
            return this.getNativeInput_().value;
        };
        /**
         * @param value The value to set on the input Element.
         */
        MDCTextFieldFoundation.prototype.setValue = function (value) {
            // Prevent Safari from moving the caret to the end of the input when the value has not changed.
            if (this.getValue() !== value) {
                this.getNativeInput_().value = value;
            }
            this.setCharacterCounter_(value.length);
            var isValid = this.isValid();
            this.styleValidity_(isValid);
            if (this.adapter_.hasLabel()) {
                this.notchOutline(this.shouldFloat);
                this.adapter_.floatLabel(this.shouldFloat);
                this.adapter_.shakeLabel(this.shouldShake);
            }
        };
        /**
         * @return The custom validity state, if set; otherwise, the result of a native validity check.
         */
        MDCTextFieldFoundation.prototype.isValid = function () {
            return this.useNativeValidation_
                ? this.isNativeInputValid_() : this.isValid_;
        };
        /**
         * @param isValid Sets the custom validity state of the Text Field.
         */
        MDCTextFieldFoundation.prototype.setValid = function (isValid) {
            this.isValid_ = isValid;
            this.styleValidity_(isValid);
            var shouldShake = !isValid && !this.isFocused_;
            if (this.adapter_.hasLabel()) {
                this.adapter_.shakeLabel(shouldShake);
            }
        };
        /**
         * Enables or disables the use of native validation. Use this for custom validation.
         * @param useNativeValidation Set this to false to ignore native input validation.
         */
        MDCTextFieldFoundation.prototype.setUseNativeValidation = function (useNativeValidation) {
            this.useNativeValidation_ = useNativeValidation;
        };
        MDCTextFieldFoundation.prototype.isDisabled = function () {
            return this.getNativeInput_().disabled;
        };
        /**
         * @param disabled Sets the text-field disabled or enabled.
         */
        MDCTextFieldFoundation.prototype.setDisabled = function (disabled) {
            this.getNativeInput_().disabled = disabled;
            this.styleDisabled_(disabled);
        };
        /**
         * @param content Sets the content of the helper text.
         */
        MDCTextFieldFoundation.prototype.setHelperTextContent = function (content) {
            if (this.helperText_) {
                this.helperText_.setContent(content);
            }
        };
        /**
         * Sets the aria label of the leading icon.
         */
        MDCTextFieldFoundation.prototype.setLeadingIconAriaLabel = function (label) {
            if (this.leadingIcon_) {
                this.leadingIcon_.setAriaLabel(label);
            }
        };
        /**
         * Sets the text content of the leading icon.
         */
        MDCTextFieldFoundation.prototype.setLeadingIconContent = function (content) {
            if (this.leadingIcon_) {
                this.leadingIcon_.setContent(content);
            }
        };
        /**
         * Sets the aria label of the trailing icon.
         */
        MDCTextFieldFoundation.prototype.setTrailingIconAriaLabel = function (label) {
            if (this.trailingIcon_) {
                this.trailingIcon_.setAriaLabel(label);
            }
        };
        /**
         * Sets the text content of the trailing icon.
         */
        MDCTextFieldFoundation.prototype.setTrailingIconContent = function (content) {
            if (this.trailingIcon_) {
                this.trailingIcon_.setContent(content);
            }
        };
        /**
         * Sets character counter values that shows characters used and the total character limit.
         */
        MDCTextFieldFoundation.prototype.setCharacterCounter_ = function (currentLength) {
            if (!this.characterCounter_) {
                return;
            }
            var maxLength = this.getNativeInput_().maxLength;
            if (maxLength === -1) {
                throw new Error('MDCTextFieldFoundation: Expected maxlength html property on text input or textarea.');
            }
            this.characterCounter_.setCounterValue(currentLength, maxLength);
        };
        /**
         * @return True if the Text Field input fails in converting the user-supplied value.
         */
        MDCTextFieldFoundation.prototype.isBadInput_ = function () {
            // The badInput property is not supported in IE 11 💩.
            return this.getNativeInput_().validity.badInput || false;
        };
        /**
         * @return The result of native validity checking (ValidityState.valid).
         */
        MDCTextFieldFoundation.prototype.isNativeInputValid_ = function () {
            return this.getNativeInput_().validity.valid;
        };
        /**
         * Styles the component based on the validity state.
         */
        MDCTextFieldFoundation.prototype.styleValidity_ = function (isValid) {
            var INVALID = MDCTextFieldFoundation.cssClasses.INVALID;
            if (isValid) {
                this.adapter_.removeClass(INVALID);
            }
            else {
                this.adapter_.addClass(INVALID);
            }
            if (this.helperText_) {
                this.helperText_.setValidity(isValid);
            }
        };
        /**
         * Styles the component based on the focused state.
         */
        MDCTextFieldFoundation.prototype.styleFocused_ = function (isFocused) {
            var FOCUSED = MDCTextFieldFoundation.cssClasses.FOCUSED;
            if (isFocused) {
                this.adapter_.addClass(FOCUSED);
            }
            else {
                this.adapter_.removeClass(FOCUSED);
            }
        };
        /**
         * Styles the component based on the disabled state.
         */
        MDCTextFieldFoundation.prototype.styleDisabled_ = function (isDisabled) {
            var _a = MDCTextFieldFoundation.cssClasses, DISABLED = _a.DISABLED, INVALID = _a.INVALID;
            if (isDisabled) {
                this.adapter_.addClass(DISABLED);
                this.adapter_.removeClass(INVALID);
            }
            else {
                this.adapter_.removeClass(DISABLED);
            }
            if (this.leadingIcon_) {
                this.leadingIcon_.setDisabled(isDisabled);
            }
            if (this.trailingIcon_) {
                this.trailingIcon_.setDisabled(isDisabled);
            }
        };
        /**
         * @return The native text input element from the host environment, or an object with the same shape for unit tests.
         */
        MDCTextFieldFoundation.prototype.getNativeInput_ = function () {
            // this.adapter_ may be undefined in foundation unit tests. This happens when testdouble is creating a mock object
            // and invokes the shouldShake/shouldFloat getters (which in turn call getValue(), which calls this method) before
            // init() has been called from the MDCTextField constructor. To work around that issue, we return a dummy object.
            var nativeInput = this.adapter_ ? this.adapter_.getNativeInput() : null;
            return nativeInput || {
                disabled: false,
                maxLength: -1,
                type: 'input',
                validity: {
                    badInput: false,
                    valid: true,
                },
                value: '',
            };
        };
        return MDCTextFieldFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$8 = {
        HELPER_TEXT_PERSISTENT: 'mdc-text-field-helper-text--persistent',
        HELPER_TEXT_VALIDATION_MSG: 'mdc-text-field-helper-text--validation-msg',
        ROOT: 'mdc-text-field-helper-text',
    };
    var strings$8 = {
        ARIA_HIDDEN: 'aria-hidden',
        ROLE: 'role',
        ROOT_SELECTOR: "." + cssClasses$8.ROOT,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextFieldHelperTextFoundation = /** @class */ (function (_super) {
        __extends(MDCTextFieldHelperTextFoundation, _super);
        function MDCTextFieldHelperTextFoundation(adapter) {
            return _super.call(this, __assign({}, MDCTextFieldHelperTextFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCTextFieldHelperTextFoundation, "cssClasses", {
            get: function () {
                return cssClasses$8;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldHelperTextFoundation, "strings", {
            get: function () {
                return strings$8;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldHelperTextFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTextFieldHelperTextAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    setAttr: function () { return undefined; },
                    removeAttr: function () { return undefined; },
                    setContent: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Sets the content of the helper text field.
         */
        MDCTextFieldHelperTextFoundation.prototype.setContent = function (content) {
            this.adapter_.setContent(content);
        };
        /**
         * @param isPersistent Sets the persistency of the helper text.
         */
        MDCTextFieldHelperTextFoundation.prototype.setPersistent = function (isPersistent) {
            if (isPersistent) {
                this.adapter_.addClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
            }
            else {
                this.adapter_.removeClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
            }
        };
        /**
         * @param isValidation True to make the helper text act as an error validation message.
         */
        MDCTextFieldHelperTextFoundation.prototype.setValidation = function (isValidation) {
            if (isValidation) {
                this.adapter_.addClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
            }
            else {
                this.adapter_.removeClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
            }
        };
        /**
         * Makes the helper text visible to the screen reader.
         */
        MDCTextFieldHelperTextFoundation.prototype.showToScreenReader = function () {
            this.adapter_.removeAttr(strings$8.ARIA_HIDDEN);
        };
        /**
         * Sets the validity of the helper text based on the input validity.
         */
        MDCTextFieldHelperTextFoundation.prototype.setValidity = function (inputIsValid) {
            var helperTextIsPersistent = this.adapter_.hasClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
            var helperTextIsValidationMsg = this.adapter_.hasClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
            var validationMsgNeedsDisplay = helperTextIsValidationMsg && !inputIsValid;
            if (validationMsgNeedsDisplay) {
                this.adapter_.setAttr(strings$8.ROLE, 'alert');
            }
            else {
                this.adapter_.removeAttr(strings$8.ROLE);
            }
            if (!helperTextIsPersistent && !validationMsgNeedsDisplay) {
                this.hide_();
            }
        };
        /**
         * Hides the help text from screen readers.
         */
        MDCTextFieldHelperTextFoundation.prototype.hide_ = function () {
            this.adapter_.setAttr(strings$8.ARIA_HIDDEN, 'true');
        };
        return MDCTextFieldHelperTextFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextFieldHelperText = /** @class */ (function (_super) {
        __extends(MDCTextFieldHelperText, _super);
        function MDCTextFieldHelperText() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTextFieldHelperText.attachTo = function (root) {
            return new MDCTextFieldHelperText(root);
        };
        Object.defineProperty(MDCTextFieldHelperText.prototype, "foundation", {
            get: function () {
                return this.foundation_;
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldHelperText.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                setAttr: function (attr, value) { return _this.root_.setAttribute(attr, value); },
                removeAttr: function (attr) { return _this.root_.removeAttribute(attr); },
                setContent: function (content) {
                    _this.root_.textContent = content;
                },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCTextFieldHelperTextFoundation(adapter);
        };
        return MDCTextFieldHelperText;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$9 = {
        ICON_EVENT: 'MDCTextField:icon',
        ICON_ROLE: 'button',
    };
    var cssClasses$9 = {
        ROOT: 'mdc-text-field__icon',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var INTERACTION_EVENTS$1 = ['click', 'keydown'];
    var MDCTextFieldIconFoundation = /** @class */ (function (_super) {
        __extends(MDCTextFieldIconFoundation, _super);
        function MDCTextFieldIconFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCTextFieldIconFoundation.defaultAdapter, adapter)) || this;
            _this.savedTabIndex_ = null;
            _this.interactionHandler_ = function (evt) { return _this.handleInteraction(evt); };
            return _this;
        }
        Object.defineProperty(MDCTextFieldIconFoundation, "strings", {
            get: function () {
                return strings$9;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldIconFoundation, "cssClasses", {
            get: function () {
                return cssClasses$9;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextFieldIconFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTextFieldIconAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    getAttr: function () { return null; },
                    setAttr: function () { return undefined; },
                    removeAttr: function () { return undefined; },
                    setContent: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    notifyIconAction: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldIconFoundation.prototype.init = function () {
            var _this = this;
            this.savedTabIndex_ = this.adapter_.getAttr('tabindex');
            INTERACTION_EVENTS$1.forEach(function (evtType) {
                _this.adapter_.registerInteractionHandler(evtType, _this.interactionHandler_);
            });
        };
        MDCTextFieldIconFoundation.prototype.destroy = function () {
            var _this = this;
            INTERACTION_EVENTS$1.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.interactionHandler_);
            });
        };
        MDCTextFieldIconFoundation.prototype.setDisabled = function (disabled) {
            if (!this.savedTabIndex_) {
                return;
            }
            if (disabled) {
                this.adapter_.setAttr('tabindex', '-1');
                this.adapter_.removeAttr('role');
            }
            else {
                this.adapter_.setAttr('tabindex', this.savedTabIndex_);
                this.adapter_.setAttr('role', strings$9.ICON_ROLE);
            }
        };
        MDCTextFieldIconFoundation.prototype.setAriaLabel = function (label) {
            this.adapter_.setAttr('aria-label', label);
        };
        MDCTextFieldIconFoundation.prototype.setContent = function (content) {
            this.adapter_.setContent(content);
        };
        MDCTextFieldIconFoundation.prototype.handleInteraction = function (evt) {
            var isEnterKey = evt.key === 'Enter' || evt.keyCode === 13;
            if (evt.type === 'click' || isEnterKey) {
                this.adapter_.notifyIconAction();
            }
        };
        return MDCTextFieldIconFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextFieldIcon = /** @class */ (function (_super) {
        __extends(MDCTextFieldIcon, _super);
        function MDCTextFieldIcon() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTextFieldIcon.attachTo = function (root) {
            return new MDCTextFieldIcon(root);
        };
        Object.defineProperty(MDCTextFieldIcon.prototype, "foundation", {
            get: function () {
                return this.foundation_;
            },
            enumerable: true,
            configurable: true
        });
        MDCTextFieldIcon.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                getAttr: function (attr) { return _this.root_.getAttribute(attr); },
                setAttr: function (attr, value) { return _this.root_.setAttribute(attr, value); },
                removeAttr: function (attr) { return _this.root_.removeAttribute(attr); },
                setContent: function (content) {
                    _this.root_.textContent = content;
                },
                registerInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
                deregisterInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
                notifyIconAction: function () { return _this.emit(MDCTextFieldIconFoundation.strings.ICON_EVENT, {} /* evtData */, true /* shouldBubble */); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCTextFieldIconFoundation(adapter);
        };
        return MDCTextFieldIcon;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTextField = /** @class */ (function (_super) {
        __extends(MDCTextField, _super);
        function MDCTextField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTextField.attachTo = function (root) {
            return new MDCTextField(root);
        };
        MDCTextField.prototype.initialize = function (rippleFactory, lineRippleFactory, helperTextFactory, characterCounterFactory, iconFactory, labelFactory, outlineFactory) {
            if (rippleFactory === void 0) { rippleFactory = function (el, foundation) { return new MDCRipple(el, foundation); }; }
            if (lineRippleFactory === void 0) { lineRippleFactory = function (el) { return new MDCLineRipple(el); }; }
            if (helperTextFactory === void 0) { helperTextFactory = function (el) { return new MDCTextFieldHelperText(el); }; }
            if (characterCounterFactory === void 0) { characterCounterFactory = function (el) { return new MDCTextFieldCharacterCounter(el); }; }
            if (iconFactory === void 0) { iconFactory = function (el) { return new MDCTextFieldIcon(el); }; }
            if (labelFactory === void 0) { labelFactory = function (el) { return new MDCFloatingLabel(el); }; }
            if (outlineFactory === void 0) { outlineFactory = function (el) { return new MDCNotchedOutline(el); }; }
            this.input_ = this.root_.querySelector(strings$7.INPUT_SELECTOR);
            var labelElement = this.root_.querySelector(strings$7.LABEL_SELECTOR);
            this.label_ = labelElement ? labelFactory(labelElement) : null;
            var lineRippleElement = this.root_.querySelector(strings$7.LINE_RIPPLE_SELECTOR);
            this.lineRipple_ = lineRippleElement ? lineRippleFactory(lineRippleElement) : null;
            var outlineElement = this.root_.querySelector(strings$7.OUTLINE_SELECTOR);
            this.outline_ = outlineElement ? outlineFactory(outlineElement) : null;
            // Helper text
            var helperTextStrings = MDCTextFieldHelperTextFoundation.strings;
            var nextElementSibling = this.root_.nextElementSibling;
            var hasHelperLine = (nextElementSibling && nextElementSibling.classList.contains(cssClasses$7.HELPER_LINE));
            var helperTextEl = hasHelperLine && nextElementSibling && nextElementSibling.querySelector(helperTextStrings.ROOT_SELECTOR);
            this.helperText_ = helperTextEl ? helperTextFactory(helperTextEl) : null;
            // Character counter
            var characterCounterStrings = MDCTextFieldCharacterCounterFoundation.strings;
            var characterCounterEl = this.root_.querySelector(characterCounterStrings.ROOT_SELECTOR);
            // If character counter is not found in root element search in sibling element.
            if (!characterCounterEl && hasHelperLine && nextElementSibling) {
                characterCounterEl = nextElementSibling.querySelector(characterCounterStrings.ROOT_SELECTOR);
            }
            this.characterCounter_ = characterCounterEl ? characterCounterFactory(characterCounterEl) : null;
            this.leadingIcon_ = null;
            this.trailingIcon_ = null;
            var iconElements = this.root_.querySelectorAll(strings$7.ICON_SELECTOR);
            if (iconElements.length > 0) {
                if (iconElements.length > 1) { // Has both icons.
                    this.leadingIcon_ = iconFactory(iconElements[0]);
                    this.trailingIcon_ = iconFactory(iconElements[1]);
                }
                else {
                    if (this.root_.classList.contains(cssClasses$7.WITH_LEADING_ICON)) {
                        this.leadingIcon_ = iconFactory(iconElements[0]);
                    }
                    else {
                        this.trailingIcon_ = iconFactory(iconElements[0]);
                    }
                }
            }
            this.ripple = this.createRipple_(rippleFactory);
        };
        MDCTextField.prototype.destroy = function () {
            if (this.ripple) {
                this.ripple.destroy();
            }
            if (this.lineRipple_) {
                this.lineRipple_.destroy();
            }
            if (this.helperText_) {
                this.helperText_.destroy();
            }
            if (this.characterCounter_) {
                this.characterCounter_.destroy();
            }
            if (this.leadingIcon_) {
                this.leadingIcon_.destroy();
            }
            if (this.trailingIcon_) {
                this.trailingIcon_.destroy();
            }
            if (this.label_) {
                this.label_.destroy();
            }
            if (this.outline_) {
                this.outline_.destroy();
            }
            _super.prototype.destroy.call(this);
        };
        /**
         * Initializes the Text Field's internal state based on the environment's
         * state.
         */
        MDCTextField.prototype.initialSyncWithDOM = function () {
            this.disabled = this.input_.disabled;
        };
        Object.defineProperty(MDCTextField.prototype, "value", {
            get: function () {
                return this.foundation_.getValue();
            },
            /**
             * @param value The value to set on the input.
             */
            set: function (value) {
                this.foundation_.setValue(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "disabled", {
            get: function () {
                return this.foundation_.isDisabled();
            },
            /**
             * @param disabled Sets the Text Field disabled or enabled.
             */
            set: function (disabled) {
                this.foundation_.setDisabled(disabled);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "valid", {
            get: function () {
                return this.foundation_.isValid();
            },
            /**
             * @param valid Sets the Text Field valid or invalid.
             */
            set: function (valid) {
                this.foundation_.setValid(valid);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "required", {
            get: function () {
                return this.input_.required;
            },
            /**
             * @param required Sets the Text Field to required.
             */
            set: function (required) {
                this.input_.required = required;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "pattern", {
            get: function () {
                return this.input_.pattern;
            },
            /**
             * @param pattern Sets the input element's validation pattern.
             */
            set: function (pattern) {
                this.input_.pattern = pattern;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "minLength", {
            get: function () {
                return this.input_.minLength;
            },
            /**
             * @param minLength Sets the input element's minLength.
             */
            set: function (minLength) {
                this.input_.minLength = minLength;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "maxLength", {
            get: function () {
                return this.input_.maxLength;
            },
            /**
             * @param maxLength Sets the input element's maxLength.
             */
            set: function (maxLength) {
                // Chrome throws exception if maxLength is set to a value less than zero
                if (maxLength < 0) {
                    this.input_.removeAttribute('maxLength');
                }
                else {
                    this.input_.maxLength = maxLength;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "min", {
            get: function () {
                return this.input_.min;
            },
            /**
             * @param min Sets the input element's min.
             */
            set: function (min) {
                this.input_.min = min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "max", {
            get: function () {
                return this.input_.max;
            },
            /**
             * @param max Sets the input element's max.
             */
            set: function (max) {
                this.input_.max = max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "step", {
            get: function () {
                return this.input_.step;
            },
            /**
             * @param step Sets the input element's step.
             */
            set: function (step) {
                this.input_.step = step;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "helperTextContent", {
            /**
             * Sets the helper text element content.
             */
            set: function (content) {
                this.foundation_.setHelperTextContent(content);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "leadingIconAriaLabel", {
            /**
             * Sets the aria label of the leading icon.
             */
            set: function (label) {
                this.foundation_.setLeadingIconAriaLabel(label);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "leadingIconContent", {
            /**
             * Sets the text content of the leading icon.
             */
            set: function (content) {
                this.foundation_.setLeadingIconContent(content);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "trailingIconAriaLabel", {
            /**
             * Sets the aria label of the trailing icon.
             */
            set: function (label) {
                this.foundation_.setTrailingIconAriaLabel(label);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "trailingIconContent", {
            /**
             * Sets the text content of the trailing icon.
             */
            set: function (content) {
                this.foundation_.setTrailingIconContent(content);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTextField.prototype, "useNativeValidation", {
            /**
             * Enables or disables the use of native validation. Use this for custom validation.
             * @param useNativeValidation Set this to false to ignore native input validation.
             */
            set: function (useNativeValidation) {
                this.foundation_.setUseNativeValidation(useNativeValidation);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Focuses the input element.
         */
        MDCTextField.prototype.focus = function () {
            this.input_.focus();
        };
        /**
         * Recomputes the outline SVG path for the outline element.
         */
        MDCTextField.prototype.layout = function () {
            var openNotch = this.foundation_.shouldFloat;
            this.foundation_.notchOutline(openNotch);
        };
        MDCTextField.prototype.getDefaultFoundation = function () {
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = __assign({}, this.getRootAdapterMethods_(), this.getInputAdapterMethods_(), this.getLabelAdapterMethods_(), this.getLineRippleAdapterMethods_(), this.getOutlineAdapterMethods_());
            // tslint:enable:object-literal-sort-keys
            return new MDCTextFieldFoundation(adapter, this.getFoundationMap_());
        };
        MDCTextField.prototype.getRootAdapterMethods_ = function () {
            var _this = this;
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                registerTextFieldInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
                deregisterTextFieldInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
                registerValidationAttributeChangeHandler: function (handler) {
                    var getAttributesList = function (mutationsList) {
                        return mutationsList
                            .map(function (mutation) { return mutation.attributeName; })
                            .filter(function (attributeName) { return attributeName; });
                    };
                    var observer = new MutationObserver(function (mutationsList) { return handler(getAttributesList(mutationsList)); });
                    var config = { attributes: true };
                    observer.observe(_this.input_, config);
                    return observer;
                },
                deregisterValidationAttributeChangeHandler: function (observer) { return observer.disconnect(); },
            };
            // tslint:enable:object-literal-sort-keys
        };
        MDCTextField.prototype.getInputAdapterMethods_ = function () {
            var _this = this;
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                getNativeInput: function () { return _this.input_; },
                isFocused: function () { return document.activeElement === _this.input_; },
                registerInputInteractionHandler: function (evtType, handler) {
                    return _this.input_.addEventListener(evtType, handler, applyPassive());
                },
                deregisterInputInteractionHandler: function (evtType, handler) {
                    return _this.input_.removeEventListener(evtType, handler, applyPassive());
                },
            };
            // tslint:enable:object-literal-sort-keys
        };
        MDCTextField.prototype.getLabelAdapterMethods_ = function () {
            var _this = this;
            return {
                floatLabel: function (shouldFloat) { return _this.label_ && _this.label_.float(shouldFloat); },
                getLabelWidth: function () { return _this.label_ ? _this.label_.getWidth() : 0; },
                hasLabel: function () { return Boolean(_this.label_); },
                shakeLabel: function (shouldShake) { return _this.label_ && _this.label_.shake(shouldShake); },
            };
        };
        MDCTextField.prototype.getLineRippleAdapterMethods_ = function () {
            var _this = this;
            return {
                activateLineRipple: function () {
                    if (_this.lineRipple_) {
                        _this.lineRipple_.activate();
                    }
                },
                deactivateLineRipple: function () {
                    if (_this.lineRipple_) {
                        _this.lineRipple_.deactivate();
                    }
                },
                setLineRippleTransformOrigin: function (normalizedX) {
                    if (_this.lineRipple_) {
                        _this.lineRipple_.setRippleCenter(normalizedX);
                    }
                },
            };
        };
        MDCTextField.prototype.getOutlineAdapterMethods_ = function () {
            var _this = this;
            return {
                closeOutline: function () { return _this.outline_ && _this.outline_.closeNotch(); },
                hasOutline: function () { return Boolean(_this.outline_); },
                notchOutline: function (labelWidth) { return _this.outline_ && _this.outline_.notch(labelWidth); },
            };
        };
        /**
         * @return A map of all subcomponents to subfoundations.
         */
        MDCTextField.prototype.getFoundationMap_ = function () {
            return {
                characterCounter: this.characterCounter_ ? this.characterCounter_.foundation : undefined,
                helperText: this.helperText_ ? this.helperText_.foundation : undefined,
                leadingIcon: this.leadingIcon_ ? this.leadingIcon_.foundation : undefined,
                trailingIcon: this.trailingIcon_ ? this.trailingIcon_.foundation : undefined,
            };
        };
        MDCTextField.prototype.createRipple_ = function (rippleFactory) {
            var _this = this;
            var isTextArea = this.root_.classList.contains(cssClasses$7.TEXTAREA);
            var isOutlined = this.root_.classList.contains(cssClasses$7.OUTLINED);
            if (isTextArea || isOutlined) {
                return null;
            }
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = __assign({}, MDCRipple.createAdapter(this), { isSurfaceActive: function () { return matches(_this.input_, ':active'); }, registerInteractionHandler: function (evtType, handler) { return _this.input_.addEventListener(evtType, handler, applyPassive()); }, deregisterInteractionHandler: function (evtType, handler) {
                    return _this.input_.removeEventListener(evtType, handler, applyPassive());
                } });
            // tslint:enable:object-literal-sort-keys
            return rippleFactory(this.root_, new MDCRippleFoundation(adapter));
        };
        return MDCTextField;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    function prefixFilter(obj, prefix) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name.substring(0, prefix.length) === prefix) {
          newObj[name.substring(prefix.length)] = obj[name];
        }
      }

      return newObj;
    }

    /* node_modules\@smui\floating-label\FloatingLabel.svelte generated by Svelte v3.9.1 */

    const file$i = "node_modules\\@smui\\floating-label\\FloatingLabel.svelte";

    // (9:0) {:else}
    function create_else_block$3(ctx) {
    	var label, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var label_levels = [
    		{ class: "mdc-floating-label " + ctx.className },
    		((ctx.forId || ctx.inputProps && ctx.inputProps.id) ? {'for': ctx.forId || ctx.inputProps && ctx.inputProps.id} : {}),
    		exclude(ctx.$$props, ['use', 'class', 'for', 'wrapped'])
    	];

    	var label_data = {};
    	for (var i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	return {
    		c: function create() {
    			label = element("label");

    			if (default_slot) default_slot.c();

    			set_attributes(label, label_data);
    			add_location(label, file$i, 9, 2, 225);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(label_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			ctx.label_binding(label);
    			useActions_action = useActions.call(null, label, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, label) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(label, get_spread_update(label_levels, [
    				(changed.className) && { class: "mdc-floating-label " + ctx.className },
    				(changed.forId || changed.inputProps) && ((ctx.forId || ctx.inputProps && ctx.inputProps.id) ? {'for': ctx.forId || ctx.inputProps && ctx.inputProps.id} : {}),
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'for', 'wrapped'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.label_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    // (1:0) {#if wrapped}
    function create_if_block$5(ctx) {
    	var span, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var span_levels = [
    		{ class: "mdc-floating-label " + ctx.className },
    		exclude(ctx.$$props, ['use', 'class', 'wrapped'])
    	];

    	var span_data = {};
    	for (var i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	return {
    		c: function create() {
    			span = element("span");

    			if (default_slot) default_slot.c();

    			set_attributes(span, span_data);
    			add_location(span, file$i, 1, 2, 16);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			ctx.span_binding(span);
    			useActions_action = useActions.call(null, span, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, span) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				(changed.className) && { class: "mdc-floating-label " + ctx.className },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'wrapped'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.span_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function create_fragment$m(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$5,
    		create_else_block$3
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.wrapped) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$m($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', for: forId = '', wrapped = false } = $$props;

      let element;
      let floatingLabel;
      let inputProps = getContext('SMUI:generic:input:props') || {};

      onMount(() => {
        floatingLabel = new MDCFloatingLabel(element);
      });

      onDestroy(() => {
        floatingLabel && floatingLabel.destroy();
      });

      function shake(shouldShake, ...args) {
        return floatingLabel.shake(shouldShake, ...args);
      }

      function float(shouldFloat, ...args) {
        return floatingLabel.float(shouldFloat, ...args);
      }

      function getWidth(...args) {
        return floatingLabel.getWidth(...args);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function span_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	function label_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('for' in $$new_props) $$invalidate('forId', forId = $$new_props.for);
    		if ('wrapped' in $$new_props) $$invalidate('wrapped', wrapped = $$new_props.wrapped);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		forId,
    		wrapped,
    		element,
    		inputProps,
    		shake,
    		float,
    		getWidth,
    		$$props,
    		span_binding,
    		label_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class FloatingLabel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, ["use", "class", "for", "wrapped", "shake", "float", "getWidth"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.shake === undefined && !('shake' in props)) {
    			console.warn("<FloatingLabel> was created without expected prop 'shake'");
    		}
    		if (ctx.float === undefined && !('float' in props)) {
    			console.warn("<FloatingLabel> was created without expected prop 'float'");
    		}
    		if (ctx.getWidth === undefined && !('getWidth' in props)) {
    			console.warn("<FloatingLabel> was created without expected prop 'getWidth'");
    		}
    	}

    	get use() {
    		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get for() {
    		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set for(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrapped() {
    		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrapped(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shake() {
    		return this.$$.ctx.shake;
    	}

    	set shake(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get float() {
    		return this.$$.ctx.float;
    	}

    	set float(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getWidth() {
    		return this.$$.ctx.getWidth;
    	}

    	set getWidth(value) {
    		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\line-ripple\LineRipple.svelte generated by Svelte v3.9.1 */

    const file$j = "node_modules\\@smui\\line-ripple\\LineRipple.svelte";

    function create_fragment$n(ctx) {
    	var div, useActions_action, forwardEvents_action;

    	var div_levels = [
    		{ class: "\n    mdc-line-ripple\n    " + ctx.className + "\n    " + (ctx.active ? 'mdc-line-ripple--active' : '') + "\n  " },
    		exclude(ctx.$$props, ['use', 'class', 'active'])
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			set_attributes(div, div_data);
    			add_location(div, file$j, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			ctx.div_binding(div);
    			useActions_action = useActions.call(null, div, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
    		},

    		p: function update(changed, ctx) {
    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.className || changed.active) && { class: "\n    mdc-line-ripple\n    " + ctx.className + "\n    " + (ctx.active ? 'mdc-line-ripple--active' : '') + "\n  " },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'active'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			ctx.div_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$n($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', active = false } = $$props;

      let element;
      let lineRipple;

      onMount(() => {
        lineRipple = new MDCLineRipple(element);
      });

      onDestroy(() => {
        lineRipple && lineRipple.destroy();
      });

      function activate(...args) {
        return lineRipple.activate(...args);
      }

      function deactivate(...args) {
        return lineRipple.deactivate(...args);
      }

      function setRippleCenter(xCoordinate, ...args) {
        return lineRipple.setRippleCenter(xCoordinate, ...args);
      }

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		active,
    		element,
    		activate,
    		deactivate,
    		setRippleCenter,
    		$$props,
    		div_binding,
    		$$props: $$props = exclude_internal_props($$props)
    	};
    }

    class LineRipple extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, ["use", "class", "active", "activate", "deactivate", "setRippleCenter"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.activate === undefined && !('activate' in props)) {
    			console.warn("<LineRipple> was created without expected prop 'activate'");
    		}
    		if (ctx.deactivate === undefined && !('deactivate' in props)) {
    			console.warn("<LineRipple> was created without expected prop 'deactivate'");
    		}
    		if (ctx.setRippleCenter === undefined && !('setRippleCenter' in props)) {
    			console.warn("<LineRipple> was created without expected prop 'setRippleCenter'");
    		}
    	}

    	get use() {
    		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activate() {
    		return this.$$.ctx.activate;
    	}

    	set activate(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deactivate() {
    		return this.$$.ctx.deactivate;
    	}

    	set deactivate(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setRippleCenter() {
    		return this.$$.ctx.setRippleCenter;
    	}

    	set setRippleCenter(value) {
    		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\notched-outline\NotchedOutline.svelte generated by Svelte v3.9.1 */

    const file$k = "node_modules\\@smui\\notched-outline\\NotchedOutline.svelte";

    // (14:2) {#if !noLabel}
    function create_if_block$6(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "mdc-notched-outline__notch");
    			add_location(div, file$k, 14, 4, 367);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$o(ctx) {
    	var div2, div0, t0, t1, div1, useActions_action, forwardEvents_action, current;

    	var if_block = (!ctx.noLabel) && create_if_block$6(ctx);

    	var div2_levels = [
    		{ class: "\n    mdc-notched-outline\n    " + ctx.className + "\n    " + (ctx.notched ? 'mdc-notched-outline--notched' : '') + "\n    " + (ctx.noLabel ? 'mdc-notched-outline--no-label' : '') + "\n  " },
    		exclude(ctx.$$props, ['use', 'class', 'notched', 'noLabel'])
    	];

    	var div2_data = {};
    	for (var i = 0; i < div2_levels.length; i += 1) {
    		div2_data = assign(div2_data, div2_levels[i]);
    	}

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div1 = element("div");
    			attr(div0, "class", "mdc-notched-outline__leading");
    			add_location(div0, file$k, 12, 2, 297);
    			attr(div1, "class", "mdc-notched-outline__trailing");
    			add_location(div1, file$k, 16, 2, 437);
    			set_attributes(div2, div2_data);
    			add_location(div2, file$k, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t0);
    			if (if_block) if_block.m(div2, null);
    			append(div2, t1);
    			append(div2, div1);
    			ctx.div2_binding(div2);
    			useActions_action = useActions.call(null, div2, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div2) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.noLabel) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, t1);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}

    			set_attributes(div2, get_spread_update(div2_levels, [
    				(changed.className || changed.notched || changed.noLabel) && { class: "\n    mdc-notched-outline\n    " + ctx.className + "\n    " + (ctx.notched ? 'mdc-notched-outline--notched' : '') + "\n    " + (ctx.noLabel ? 'mdc-notched-outline--no-label' : '') + "\n  " },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'notched', 'noLabel'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			if (if_block) if_block.d();
    			ctx.div2_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    function instance$o($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', notched = false, noLabel = false } = $$props;

      let element;
      let notchedOutline;

      onMount(() => {
        notchedOutline = new MDCNotchedOutline(element);
      });

      onDestroy(() => {
        notchedOutline && notchedOutline.destroy();
      });

      function notch(notchWidth, ...args) {
        return notchedOutline.notch(notchWidth, ...args);
      }

      function closeNotch(...args) {
        return notchedOutline.closeNotch(...args);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('notched' in $$new_props) $$invalidate('notched', notched = $$new_props.notched);
    		if ('noLabel' in $$new_props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		notched,
    		noLabel,
    		element,
    		notch,
    		closeNotch,
    		$$props,
    		div2_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class NotchedOutline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, ["use", "class", "notched", "noLabel", "notch", "closeNotch"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.notch === undefined && !('notch' in props)) {
    			console.warn("<NotchedOutline> was created without expected prop 'notch'");
    		}
    		if (ctx.closeNotch === undefined && !('closeNotch' in props)) {
    			console.warn("<NotchedOutline> was created without expected prop 'closeNotch'");
    		}
    	}

    	get use() {
    		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notched() {
    		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notched(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noLabel() {
    		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noLabel(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notch() {
    		return this.$$.ctx.notch;
    	}

    	set notch(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeNotch() {
    		return this.$$.ctx.closeNotch;
    	}

    	set closeNotch(value) {
    		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\textfield\Input.svelte generated by Svelte v3.9.1 */

    const file$l = "node_modules\\@smui\\textfield\\Input.svelte";

    function create_fragment$p(ctx) {
    	var input, useActions_action, forwardEvents_action, dispose;

    	var input_levels = [
    		{ class: "mdc-text-field__input " + ctx.className },
    		{ type: ctx.type },
    		ctx.valueProp,
    		exclude(ctx.$$props, ['use', 'class', 'type', 'value', 'files', 'dirty', 'invalid', 'updateInvalid'])
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	return {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$l, 0, 0, 0);

    			dispose = [
    				listen(input, "change", ctx.change_handler),
    				listen(input, "input", ctx.input_handler),
    				listen(input, "change", ctx.changeHandler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);
    			ctx.input_binding(input);
    			useActions_action = useActions.call(null, input, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, input) || {};
    		},

    		p: function update(changed, ctx) {
    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.className) && { class: "mdc-text-field__input " + ctx.className },
    				(changed.type) && { type: ctx.type },
    				(changed.valueProp) && ctx.valueProp,
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'type', 'value', 'files', 'dirty', 'invalid', 'updateInvalid'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    			}

    			ctx.input_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    			run_all(dispose);
    		}
    	};
    }

    function toNumber(value) {
      if (value === '') {
        const nan = new Number(Number.NaN);
        nan.length = 0;
        return nan;
      }
      return +value;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component, ['change', 'input']);

      let { use = [], class: className = '', type = 'text', value = '', files = undefined, dirty = false, invalid = false, updateInvalid = true } = $$props;

      let element;
      let valueProp = {};

      onMount(() => {
        if (updateInvalid) {
          $$invalidate('invalid', invalid = element.matches(':invalid'));
        }
      });

      function valueUpdater(e) {
        switch (type) {
          case 'number':
          case 'range':
            $$invalidate('value', value = toNumber(e.target.value));
            break;
          case 'file':
            $$invalidate('files', files = e.target.files);
            // Fall through.
          default:
            $$invalidate('value', value = e.target.value);
            break;
        }
      }

      function changeHandler(e) {
        $$invalidate('dirty', dirty = true);
        if (updateInvalid) {
          $$invalidate('invalid', invalid = element.matches(':invalid'));
        }
      }

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	function change_handler(e) {
    		return (type === 'file' || type === 'range') && valueUpdater(e);
    	}

    	function input_handler(e) {
    		return type !== 'file' && valueUpdater(e);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
    		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
    		if ('files' in $$new_props) $$invalidate('files', files = $$new_props.files);
    		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
    		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
    		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
    	};

    	$$self.$$.update = ($$dirty = { type: 1, valueProp: 1, value: 1 }) => {
    		if ($$dirty.type || $$dirty.valueProp || $$dirty.value) { if (type === 'file') {
            delete valueProp.value;
          } else {
            valueProp.value = value === undefined ? '' : value; $$invalidate('valueProp', valueProp), $$invalidate('type', type), $$invalidate('value', value);
          } }
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		type,
    		value,
    		files,
    		dirty,
    		invalid,
    		updateInvalid,
    		element,
    		valueProp,
    		valueUpdater,
    		changeHandler,
    		$$props,
    		input_binding,
    		change_handler,
    		input_handler,
    		$$props: $$props = exclude_internal_props($$props)
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, ["use", "class", "type", "value", "files", "dirty", "invalid", "updateInvalid"]);
    	}

    	get use() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dirty() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dirty(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateInvalid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateInvalid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\textfield\Textarea.svelte generated by Svelte v3.9.1 */

    const file$m = "node_modules\\@smui\\textfield\\Textarea.svelte";

    function create_fragment$q(ctx) {
    	var textarea, useActions_action, forwardEvents_action, dispose;

    	var textarea_levels = [
    		{ class: "mdc-text-field__input " + ctx.className },
    		exclude(ctx.$$props, ['use', 'class', 'value', 'dirty', 'invalid', 'updateInvalid'])
    	];

    	var textarea_data = {};
    	for (var i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	return {
    		c: function create() {
    			textarea = element("textarea");
    			set_attributes(textarea, textarea_data);
    			add_location(textarea, file$m, 0, 0, 0);

    			dispose = [
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(textarea, "change", ctx.changeHandler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, textarea, anchor);

    			set_input_value(textarea, ctx.value);

    			ctx.textarea_binding(textarea);
    			useActions_action = useActions.call(null, textarea, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, textarea) || {};
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(textarea, ctx.value);

    			set_attributes(textarea, get_spread_update(textarea_levels, [
    				(changed.className) && { class: "mdc-text-field__input " + ctx.className },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'value', 'dirty', 'invalid', 'updateInvalid'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(textarea);
    			}

    			ctx.textarea_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    			run_all(dispose);
    		}
    	};
    }

    function instance$q($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component, ['change', 'input']);

      let { use = [], class: className = '', value = '', dirty = false, invalid = false, updateInvalid = true } = $$props;

      let element;

      onMount(() => {
        if (updateInvalid) {
          $$invalidate('invalid', invalid = element.matches(':invalid'));
        }
      });

      function changeHandler() {
        $$invalidate('dirty', dirty = true);
        if (updateInvalid) {
          $$invalidate('invalid', invalid = element.matches(':invalid'));
        }
      }

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
    		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
    		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
    		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		value,
    		dirty,
    		invalid,
    		updateInvalid,
    		element,
    		changeHandler,
    		$$props,
    		textarea_input_handler,
    		textarea_binding,
    		$$props: $$props = exclude_internal_props($$props)
    	};
    }

    class Textarea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, ["use", "class", "value", "dirty", "invalid", "updateInvalid"]);
    	}

    	get use() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dirty() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dirty(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateInvalid() {
    		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateInvalid(value) {
    		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\textfield\Textfield.svelte generated by Svelte v3.9.1 */

    const file$n = "node_modules\\@smui\\textfield\\Textfield.svelte";

    const get_label_slot_changes_1 = () => ({});
    const get_label_slot_context_1 = () => ({});

    const get_label_slot_changes = () => ({});
    const get_label_slot_context = () => ({});

    // (65:0) {:else}
    function create_else_block_1(ctx) {
    	var div, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		{ class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
    		ctx.props
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$n, 65, 2, 2082);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			ctx.div_binding(div);
    			useActions_action = useActions.call(null, div, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.className || changed.disabled || changed.fullwidth || changed.textarea || changed.variant || changed.dense || changed.noLabel || changed.withLeadingIcon || changed.withTrailingIcon || changed.invalid) && { class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
    				(changed.props) && ctx.props
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.div_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    // (1:0) {#if valued}
    function create_if_block$7(ctx) {
    	var label_1, t0, current_block_type_index, if_block0, t1, t2, useActions_action, forwardEvents_action, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var if_block_creators = [
    		create_if_block_6,
    		create_else_block$4
    	];

    	var if_blocks = [];

    	function select_block_type_1(changed, ctx) {
    		if (ctx.textarea) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(null, ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	var if_block1 = (!ctx.textarea && ctx.variant !== 'outlined') && create_if_block_3(ctx);

    	var if_block2 = (ctx.textarea || (ctx.variant === 'outlined' && !ctx.fullwidth)) && create_if_block_1$1(ctx);

    	var label_1_levels = [
    		{ class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel || ctx.label == null ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
    		ctx.props
    	];

    	var label_1_data = {};
    	for (var i = 0; i < label_1_levels.length; i += 1) {
    		label_1_data = assign(label_1_data, label_1_levels[i]);
    	}

    	return {
    		c: function create() {
    			label_1 = element("label");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();

    			set_attributes(label_1, label_1_data);
    			add_location(label_1, file$n, 1, 2, 15);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(label_1_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, label_1, anchor);

    			if (default_slot) {
    				default_slot.m(label_1, null);
    			}

    			append(label_1, t0);
    			if_blocks[current_block_type_index].m(label_1, null);
    			append(label_1, t1);
    			if (if_block1) if_block1.m(label_1, null);
    			append(label_1, t2);
    			if (if_block2) if_block2.m(label_1, null);
    			ctx.label_1_binding(label_1);
    			useActions_action = useActions.call(null, label_1, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, label_1) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block0 = if_blocks[current_block_type_index];
    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}
    				transition_in(if_block0, 1);
    				if_block0.m(label_1, t1);
    			}

    			if (!ctx.textarea && ctx.variant !== 'outlined') {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(label_1, t2);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (ctx.textarea || (ctx.variant === 'outlined' && !ctx.fullwidth)) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(label_1, null);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}

    			set_attributes(label_1, get_spread_update(label_1_levels, [
    				(changed.className || changed.disabled || changed.fullwidth || changed.textarea || changed.variant || changed.dense || changed.noLabel || changed.label || changed.withLeadingIcon || changed.withTrailingIcon || changed.invalid) && { class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel || ctx.label == null ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
    				(changed.props) && ctx.props
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label_1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			ctx.label_1_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
    		}
    	};
    }

    // (34:4) {:else}
    function create_else_block$4(ctx) {
    	var updating_value, updating_files, updating_dirty, updating_invalid, current;

    	var input_spread_levels = [
    		{ type: ctx.type },
    		{ disabled: ctx.disabled },
    		{ updateInvalid: ctx.updateInvalid },
    		((ctx.fullwidth && ctx.label) ? {placeholder: ctx.label} : {}),
    		prefixFilter(ctx.$$props, 'input$')
    	];

    	function input_value_binding(value_1) {
    		ctx.input_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	function input_files_binding(value_2) {
    		ctx.input_files_binding.call(null, value_2);
    		updating_files = true;
    		add_flush_callback(() => updating_files = false);
    	}

    	function input_dirty_binding(value_3) {
    		ctx.input_dirty_binding.call(null, value_3);
    		updating_dirty = true;
    		add_flush_callback(() => updating_dirty = false);
    	}

    	function input_invalid_binding(value_4) {
    		ctx.input_invalid_binding.call(null, value_4);
    		updating_invalid = true;
    		add_flush_callback(() => updating_invalid = false);
    	}

    	let input_props = {};
    	for (var i = 0; i < input_spread_levels.length; i += 1) {
    		input_props = assign(input_props, input_spread_levels[i]);
    	}
    	if (ctx.value !== void 0) {
    		input_props.value = ctx.value;
    	}
    	if (ctx.files !== void 0) {
    		input_props.files = ctx.files;
    	}
    	if (ctx.dirty !== void 0) {
    		input_props.dirty = ctx.dirty;
    	}
    	if (ctx.invalid !== void 0) {
    		input_props.invalid = ctx.invalid;
    	}
    	var input = new Input({ props: input_props, $$inline: true });

    	binding_callbacks.push(() => bind(input, 'value', input_value_binding));
    	binding_callbacks.push(() => bind(input, 'files', input_files_binding));
    	binding_callbacks.push(() => bind(input, 'dirty', input_dirty_binding));
    	binding_callbacks.push(() => bind(input, 'invalid', input_invalid_binding));
    	input.$on("change", ctx.change_handler_1);
    	input.$on("input", ctx.input_handler_1);

    	return {
    		c: function create() {
    			input.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input_changes = (changed.type || changed.disabled || changed.updateInvalid || changed.fullwidth || changed.label || changed.prefixFilter || changed.$$props) ? get_spread_update(input_spread_levels, [
    									(changed.type) && { type: ctx.type },
    			(changed.disabled) && { disabled: ctx.disabled },
    			(changed.updateInvalid) && { updateInvalid: ctx.updateInvalid },
    			(changed.fullwidth || changed.label) && ((ctx.fullwidth && ctx.label) ? {placeholder: ctx.label} : {}),
    			(changed.prefixFilter || changed.$$props) && prefixFilter(ctx.$$props, 'input$')
    								]) : {};
    			if (!updating_value && changed.value) {
    				input_changes.value = ctx.value;
    			}
    			if (!updating_files && changed.files) {
    				input_changes.files = ctx.files;
    			}
    			if (!updating_dirty && changed.dirty) {
    				input_changes.dirty = ctx.dirty;
    			}
    			if (!updating_invalid && changed.invalid) {
    				input_changes.invalid = ctx.invalid;
    			}
    			input.$set(input_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};
    }

    // (23:4) {#if textarea}
    function create_if_block_6(ctx) {
    	var updating_value, updating_dirty, updating_invalid, current;

    	var textarea_1_spread_levels = [
    		{ disabled: ctx.disabled },
    		{ updateInvalid: ctx.updateInvalid },
    		prefixFilter(ctx.$$props, 'input$')
    	];

    	function textarea_1_value_binding(value_1) {
    		ctx.textarea_1_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	function textarea_1_dirty_binding(value_2) {
    		ctx.textarea_1_dirty_binding.call(null, value_2);
    		updating_dirty = true;
    		add_flush_callback(() => updating_dirty = false);
    	}

    	function textarea_1_invalid_binding(value_3) {
    		ctx.textarea_1_invalid_binding.call(null, value_3);
    		updating_invalid = true;
    		add_flush_callback(() => updating_invalid = false);
    	}

    	let textarea_1_props = {};
    	for (var i = 0; i < textarea_1_spread_levels.length; i += 1) {
    		textarea_1_props = assign(textarea_1_props, textarea_1_spread_levels[i]);
    	}
    	if (ctx.value !== void 0) {
    		textarea_1_props.value = ctx.value;
    	}
    	if (ctx.dirty !== void 0) {
    		textarea_1_props.dirty = ctx.dirty;
    	}
    	if (ctx.invalid !== void 0) {
    		textarea_1_props.invalid = ctx.invalid;
    	}
    	var textarea_1 = new Textarea({ props: textarea_1_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea_1, 'value', textarea_1_value_binding));
    	binding_callbacks.push(() => bind(textarea_1, 'dirty', textarea_1_dirty_binding));
    	binding_callbacks.push(() => bind(textarea_1, 'invalid', textarea_1_invalid_binding));
    	textarea_1.$on("change", ctx.change_handler);
    	textarea_1.$on("input", ctx.input_handler);

    	return {
    		c: function create() {
    			textarea_1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(textarea_1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textarea_1_changes = (changed.disabled || changed.updateInvalid || changed.prefixFilter || changed.$$props) ? get_spread_update(textarea_1_spread_levels, [
    									(changed.disabled) && { disabled: ctx.disabled },
    			(changed.updateInvalid) && { updateInvalid: ctx.updateInvalid },
    			(changed.prefixFilter || changed.$$props) && prefixFilter(ctx.$$props, 'input$')
    								]) : {};
    			if (!updating_value && changed.value) {
    				textarea_1_changes.value = ctx.value;
    			}
    			if (!updating_dirty && changed.dirty) {
    				textarea_1_changes.dirty = ctx.dirty;
    			}
    			if (!updating_invalid && changed.invalid) {
    				textarea_1_changes.invalid = ctx.invalid;
    			}
    			textarea_1.$set(textarea_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textarea_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textarea_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(textarea_1, detaching);
    		}
    	};
    }

    // (49:4) {#if !textarea && variant !== 'outlined'}
    function create_if_block_3(ctx) {
    	var t, if_block1_anchor, current;

    	var if_block0 = (!ctx.noLabel && ctx.label != null && !ctx.fullwidth) && create_if_block_5(ctx);

    	var if_block1 = (ctx.ripple) && create_if_block_4(ctx);

    	return {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.noLabel && ctx.label != null && !ctx.fullwidth) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.ripple) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(if_block1_anchor);
    			}
    		}
    	};
    }

    // (50:6) {#if !noLabel && label != null && !fullwidth}
    function create_if_block_5(ctx) {
    	var current;

    	var floatinglabel_spread_levels = [
    		{ wrapped: true },
    		prefixFilter(ctx.$$props, 'label$')
    	];

    	let floatinglabel_props = {
    		$$slots: { default: [create_default_slot_2$3] },
    		$$scope: { ctx }
    	};
    	for (var i = 0; i < floatinglabel_spread_levels.length; i += 1) {
    		floatinglabel_props = assign(floatinglabel_props, floatinglabel_spread_levels[i]);
    	}
    	var floatinglabel = new FloatingLabel({
    		props: floatinglabel_props,
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			floatinglabel.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(floatinglabel, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var floatinglabel_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(floatinglabel_spread_levels, [
    									floatinglabel_spread_levels[0],
    			prefixFilter(ctx.$$props, 'label$')
    								]) : {};
    			if (changed.$$scope || changed.label) floatinglabel_changes.$$scope = { changed, ctx };
    			floatinglabel.$set(floatinglabel_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(floatinglabel.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(floatinglabel.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(floatinglabel, detaching);
    		}
    	};
    }

    // (51:8) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
    function create_default_slot_2$3(ctx) {
    	var t, current;

    	const label_slot_template = ctx.$$slots.label;
    	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context);

    	return {
    		c: function create() {
    			t = text(ctx.label);

    			if (label_slot) label_slot.c();
    		},

    		l: function claim(nodes) {
    			if (label_slot) label_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);

    			if (label_slot) {
    				label_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.label) {
    				set_data(t, ctx.label);
    			}

    			if (label_slot && label_slot.p && changed.$$scope) {
    				label_slot.p(
    					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes),
    					get_slot_context(label_slot_template, ctx, get_label_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			if (label_slot) label_slot.d(detaching);
    		}
    	};
    }

    // (53:6) {#if ripple}
    function create_if_block_4(ctx) {
    	var current;

    	var lineripple_spread_levels = [
    		prefixFilter(ctx.$$props, 'ripple$')
    	];

    	let lineripple_props = {};
    	for (var i = 0; i < lineripple_spread_levels.length; i += 1) {
    		lineripple_props = assign(lineripple_props, lineripple_spread_levels[i]);
    	}
    	var lineripple = new LineRipple({ props: lineripple_props, $$inline: true });

    	return {
    		c: function create() {
    			lineripple.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(lineripple, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var lineripple_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(lineripple_spread_levels, [
    									prefixFilter(ctx.$$props, 'ripple$')
    								]) : {};
    			lineripple.$set(lineripple_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(lineripple.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(lineripple.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(lineripple, detaching);
    		}
    	};
    }

    // (57:4) {#if textarea || (variant === 'outlined' && !fullwidth)}
    function create_if_block_1$1(ctx) {
    	var current;

    	var notchedoutline_spread_levels = [
    		{ noLabel: ctx.noLabel || ctx.label == null },
    		prefixFilter(ctx.$$props, 'outline$')
    	];

    	let notchedoutline_props = {
    		$$slots: { default: [create_default_slot$8] },
    		$$scope: { ctx }
    	};
    	for (var i = 0; i < notchedoutline_spread_levels.length; i += 1) {
    		notchedoutline_props = assign(notchedoutline_props, notchedoutline_spread_levels[i]);
    	}
    	var notchedoutline = new NotchedOutline({
    		props: notchedoutline_props,
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			notchedoutline.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(notchedoutline, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var notchedoutline_changes = (changed.noLabel || changed.label || changed.prefixFilter || changed.$$props) ? get_spread_update(notchedoutline_spread_levels, [
    									(changed.noLabel || changed.label) && { noLabel: ctx.noLabel || ctx.label == null },
    			(changed.prefixFilter || changed.$$props) && prefixFilter(ctx.$$props, 'outline$')
    								]) : {};
    			if (changed.$$scope || changed.noLabel || changed.label) notchedoutline_changes.$$scope = { changed, ctx };
    			notchedoutline.$set(notchedoutline_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(notchedoutline.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(notchedoutline.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(notchedoutline, detaching);
    		}
    	};
    }

    // (59:8) {#if !noLabel && label != null}
    function create_if_block_2$1(ctx) {
    	var current;

    	var floatinglabel_spread_levels = [
    		{ wrapped: true },
    		prefixFilter(ctx.$$props, 'label$')
    	];

    	let floatinglabel_props = {
    		$$slots: { default: [create_default_slot_1$3] },
    		$$scope: { ctx }
    	};
    	for (var i = 0; i < floatinglabel_spread_levels.length; i += 1) {
    		floatinglabel_props = assign(floatinglabel_props, floatinglabel_spread_levels[i]);
    	}
    	var floatinglabel = new FloatingLabel({
    		props: floatinglabel_props,
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			floatinglabel.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(floatinglabel, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var floatinglabel_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(floatinglabel_spread_levels, [
    									floatinglabel_spread_levels[0],
    			prefixFilter(ctx.$$props, 'label$')
    								]) : {};
    			if (changed.$$scope || changed.label) floatinglabel_changes.$$scope = { changed, ctx };
    			floatinglabel.$set(floatinglabel_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(floatinglabel.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(floatinglabel.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(floatinglabel, detaching);
    		}
    	};
    }

    // (60:10) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
    function create_default_slot_1$3(ctx) {
    	var t, current;

    	const label_slot_template = ctx.$$slots.label;
    	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context_1);

    	return {
    		c: function create() {
    			t = text(ctx.label);

    			if (label_slot) label_slot.c();
    		},

    		l: function claim(nodes) {
    			if (label_slot) label_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);

    			if (label_slot) {
    				label_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.label) {
    				set_data(t, ctx.label);
    			}

    			if (label_slot && label_slot.p && changed.$$scope) {
    				label_slot.p(
    					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes_1),
    					get_slot_context(label_slot_template, ctx, get_label_slot_context_1)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			if (label_slot) label_slot.d(detaching);
    		}
    	};
    }

    // (58:6) <NotchedOutline noLabel={noLabel || label == null} {...prefixFilter($$props, 'outline$')}>
    function create_default_slot$8(ctx) {
    	var if_block_anchor, current;

    	var if_block = (!ctx.noLabel && ctx.label != null) && create_if_block_2$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.noLabel && ctx.label != null) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$r(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$7,
    		create_else_block_1
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.valued) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$r($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);
      let uninitializedValue = () => {};

      let { use = [], class: className = '', ripple = true, disabled = false, fullwidth = false, textarea = false, variant = 'standard', dense = false, withLeadingIcon = false, withTrailingIcon = false, noLabel = false, label = null, type = 'text', value = uninitializedValue, files = uninitializedValue, dirty = false, invalid = uninitializedValue, updateInvalid = invalid === uninitializedValue, useNativeValidation = updateInvalid } = $$props;

      let element;
      let textField;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      onMount(() => {
        $$invalidate('textField', textField = new MDCTextField(element));

        if (!ripple) {
          textField.ripple && textField.ripple.destroy();
        }
      });

      onDestroy(() => {
        textField && textField.destroy();

        if (removeLayoutListener) {
          removeLayoutListener();
        }
      });

      function focus(...args) {
        return textField.focus(...args);
      }

      function layout(...args) {
        return textField.layout(...args);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function textarea_1_value_binding(value_1) {
    		value = value_1;
    		$$invalidate('value', value);
    	}

    	function textarea_1_dirty_binding(value_2) {
    		dirty = value_2;
    		$$invalidate('dirty', dirty);
    	}

    	function textarea_1_invalid_binding(value_3) {
    		invalid = value_3;
    		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation);
    	}

    	function input_value_binding(value_1) {
    		value = value_1;
    		$$invalidate('value', value);
    	}

    	function input_files_binding(value_2) {
    		files = value_2;
    		$$invalidate('files', files);
    	}

    	function input_dirty_binding(value_3) {
    		dirty = value_3;
    		$$invalidate('dirty', dirty);
    	}

    	function input_invalid_binding(value_4) {
    		invalid = value_4;
    		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation);
    	}

    	function label_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('ripple' in $$new_props) $$invalidate('ripple', ripple = $$new_props.ripple);
    		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('fullwidth' in $$new_props) $$invalidate('fullwidth', fullwidth = $$new_props.fullwidth);
    		if ('textarea' in $$new_props) $$invalidate('textarea', textarea = $$new_props.textarea);
    		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
    		if ('dense' in $$new_props) $$invalidate('dense', dense = $$new_props.dense);
    		if ('withLeadingIcon' in $$new_props) $$invalidate('withLeadingIcon', withLeadingIcon = $$new_props.withLeadingIcon);
    		if ('withTrailingIcon' in $$new_props) $$invalidate('withTrailingIcon', withTrailingIcon = $$new_props.withTrailingIcon);
    		if ('noLabel' in $$new_props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
    		if ('label' in $$new_props) $$invalidate('label', label = $$new_props.label);
    		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
    		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
    		if ('files' in $$new_props) $$invalidate('files', files = $$new_props.files);
    		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
    		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
    		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
    		if ('useNativeValidation' in $$new_props) $$invalidate('useNativeValidation', useNativeValidation = $$new_props.useNativeValidation);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	let props, valued;

    	$$self.$$.update = ($$dirty = { $$props: 1, value: 1, uninitializedValue: 1, files: 1, textField: 1, disabled: 1, invalid: 1, updateInvalid: 1, useNativeValidation: 1 }) => {
    		$$invalidate('props', props = exclude($$props, ['use', 'class', 'ripple', 'disabled', 'fullwidth', 'textarea', 'variant', 'dense', 'withLeadingIcon', 'withTrailingIcon', 'noLabel', 'label', 'type', 'value', 'dirty', 'invalid', 'updateInvalid', 'useNativeValidation', 'input$', 'label$', 'ripple$', 'outline$']));
    		if ($$dirty.value || $$dirty.uninitializedValue || $$dirty.files) { $$invalidate('valued', valued = value !== uninitializedValue || files !== uninitializedValue); }
    		if ($$dirty.textField || $$dirty.value || $$dirty.uninitializedValue) { if (textField && value !== uninitializedValue && textField.value !== value) {
            textField.value = value; $$invalidate('textField', textField), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('invalid', invalid), $$invalidate('updateInvalid', updateInvalid), $$invalidate('useNativeValidation', useNativeValidation);
          } }
    		if ($$dirty.textField || $$dirty.disabled) { if (textField && textField.disabled !== disabled) {
            textField.disabled = disabled; $$invalidate('textField', textField), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('invalid', invalid), $$invalidate('updateInvalid', updateInvalid), $$invalidate('useNativeValidation', useNativeValidation);
          } }
    		if ($$dirty.textField || $$dirty.invalid || $$dirty.updateInvalid) { if (textField && textField.valid !== !invalid) {
            if (updateInvalid) {
              $$invalidate('invalid', invalid = !textField.valid);
            } else {
              textField.valid = !invalid; $$invalidate('textField', textField), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('invalid', invalid), $$invalidate('updateInvalid', updateInvalid), $$invalidate('useNativeValidation', useNativeValidation);
            }
          } }
    		if ($$dirty.textField || $$dirty.useNativeValidation) { if (textField && textField.useNativeValidation !== useNativeValidation) {
            textField.useNativeValidation = useNativeValidation; $$invalidate('textField', textField), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('invalid', invalid), $$invalidate('updateInvalid', updateInvalid), $$invalidate('useNativeValidation', useNativeValidation);
          } }
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		disabled,
    		fullwidth,
    		textarea,
    		variant,
    		dense,
    		withLeadingIcon,
    		withTrailingIcon,
    		noLabel,
    		label,
    		type,
    		value,
    		files,
    		dirty,
    		invalid,
    		updateInvalid,
    		useNativeValidation,
    		element,
    		focus,
    		layout,
    		props,
    		$$props,
    		valued,
    		change_handler,
    		input_handler,
    		change_handler_1,
    		input_handler_1,
    		textarea_1_value_binding,
    		textarea_1_dirty_binding,
    		textarea_1_invalid_binding,
    		input_value_binding,
    		input_files_binding,
    		input_dirty_binding,
    		input_invalid_binding,
    		label_1_binding,
    		div_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Textfield extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, ["use", "class", "ripple", "disabled", "fullwidth", "textarea", "variant", "dense", "withLeadingIcon", "withTrailingIcon", "noLabel", "label", "type", "value", "files", "dirty", "invalid", "updateInvalid", "useNativeValidation", "focus", "layout"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.focus === undefined && !('focus' in props)) {
    			console.warn("<Textfield> was created without expected prop 'focus'");
    		}
    		if (ctx.layout === undefined && !('layout' in props)) {
    			console.warn("<Textfield> was created without expected prop 'layout'");
    		}
    	}

    	get use() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fullwidth() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fullwidth(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textarea() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textarea(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withLeadingIcon() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withLeadingIcon(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get withTrailingIcon() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set withTrailingIcon(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noLabel() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noLabel(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dirty() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dirty(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateInvalid() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateInvalid(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useNativeValidation() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useNativeValidation(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		return this.$$.ctx.focus;
    	}

    	set focus(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx.layout;
    	}

    	set layout(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\@smui\textfield\helper-text\HelperText.svelte generated by Svelte v3.9.1 */

    const file$o = "node_modules\\@smui\\textfield\\helper-text\\HelperText.svelte";

    const get_character_counter_slot_changes = () => ({});
    const get_character_counter_slot_context = () => ({});

    function create_fragment$s(ctx) {
    	var div1, div0, useActions_action, forwardEvents_action, t, useActions_action_1, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div0_levels = [
    		{ class: "\n      mdc-text-field-helper-text\n      " + ctx.className + "\n      " + (ctx.persistent ? 'mdc-text-field-helper-text--persistent' : '') + "\n      " + (ctx.validationMsg ? 'mdc-text-field-helper-text--validation-msg' : '') + "\n    " },
    		{ "aria-hidden": "true" },
    		exclude(ctx.$$props, ['use', 'class', 'persistent', 'validationMsg'])
    	];

    	var div0_data = {};
    	for (var i = 0; i < div0_levels.length; i += 1) {
    		div0_data = assign(div0_data, div0_levels[i]);
    	}

    	const character_counter_slot_template = ctx.$$slots["character-counter"];
    	const character_counter_slot = create_slot(character_counter_slot_template, ctx, get_character_counter_slot_context);

    	var div1_levels = [
    		{ class: "mdc-text-field-helper-line " + ctx.line$class },
    		exclude(prefixFilter(ctx.$$props, 'line$'), ['use', 'class'])
    	];

    	var div1_data = {};
    	for (var i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			if (default_slot) default_slot.c();
    			t = space();

    			if (character_counter_slot) character_counter_slot.c();

    			set_attributes(div0, div0_data);
    			add_location(div0, file$o, 5, 2, 152);

    			set_attributes(div1, div1_data);
    			add_location(div1, file$o, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);

    			if (character_counter_slot) character_counter_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			useActions_action = useActions.call(null, div0, ctx.use) || {};
    			forwardEvents_action = ctx.forwardEvents.call(null, div0) || {};
    			append(div1, t);

    			if (character_counter_slot) {
    				character_counter_slot.m(div1, null);
    			}

    			useActions_action_1 = useActions.call(null, div1, ctx.line$use) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div0, get_spread_update(div0_levels, [
    				(changed.className || changed.persistent || changed.validationMsg) && { class: "\n      mdc-text-field-helper-text\n      " + ctx.className + "\n      " + (ctx.persistent ? 'mdc-text-field-helper-text--persistent' : '') + "\n      " + (ctx.validationMsg ? 'mdc-text-field-helper-text--validation-msg' : '') + "\n    " },
    				{ "aria-hidden": "true" },
    				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'persistent', 'validationMsg'])
    			]));

    			if (typeof useActions_action.update === 'function' && changed.use) {
    				useActions_action.update.call(null, ctx.use);
    			}

    			if (character_counter_slot && character_counter_slot.p && changed.$$scope) {
    				character_counter_slot.p(
    					get_slot_changes(character_counter_slot_template, ctx, changed, get_character_counter_slot_changes),
    					get_slot_context(character_counter_slot_template, ctx, get_character_counter_slot_context)
    				);
    			}

    			set_attributes(div1, get_spread_update(div1_levels, [
    				(changed.line$class) && { class: "mdc-text-field-helper-line " + ctx.line$class },
    				(changed.exclude || changed.prefixFilter || changed.$$props) && exclude(prefixFilter(ctx.$$props, 'line$'), ['use', 'class'])
    			]));

    			if (typeof useActions_action_1.update === 'function' && changed.line$use) {
    				useActions_action_1.update.call(null, ctx.line$use);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(character_counter_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(character_counter_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.div0_binding(null);
    			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
    			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();

    			if (character_counter_slot) character_counter_slot.d(detaching);
    			if (useActions_action_1 && typeof useActions_action_1.destroy === 'function') useActions_action_1.destroy();
    		}
    	};
    }

    function instance$s($$self, $$props, $$invalidate) {
    	

      const forwardEvents = forwardEventsBuilder(current_component);

      let { use = [], class: className = '', persistent = false, validationMsg = false, line$use = [], line$class = '' } = $$props;

      let element;
      let helperText;

      onMount(() => {
        helperText = new MDCTextFieldHelperText(element);
      });

      onDestroy(() => {
        helperText && helperText.destroy();
      });

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('element', element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('persistent' in $$new_props) $$invalidate('persistent', persistent = $$new_props.persistent);
    		if ('validationMsg' in $$new_props) $$invalidate('validationMsg', validationMsg = $$new_props.validationMsg);
    		if ('line$use' in $$new_props) $$invalidate('line$use', line$use = $$new_props.line$use);
    		if ('line$class' in $$new_props) $$invalidate('line$class', line$class = $$new_props.line$class);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	return {
    		forwardEvents,
    		use,
    		className,
    		persistent,
    		validationMsg,
    		line$use,
    		line$class,
    		element,
    		$$props,
    		div0_binding,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class HelperText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, ["use", "class", "persistent", "validationMsg", "line$use", "line$class"]);
    	}

    	get use() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persistent() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persistent(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validationMsg() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validationMsg(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get line$use() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set line$use(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get line$class() {
    		throw new Error("<HelperText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set line$class(value) {
    		throw new Error("<HelperText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\common\TextBox.svelte generated by Svelte v3.9.1 */

    // (23:0) <Textfield type="{type}"             withTrailingIcon={value !== ''}             bind:dirty={dirty}             bind:invalid={invalid}             updateInvalid             bind:value={value}             label="{label}"             style="min-width: {minWidth ? `${minWidth}px`: '250px'}"    >
    function create_default_slot_1$4(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		d: noop
    	};
    }

    // (34:0) <HelperText validationMsg>
    function create_default_slot$9(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text(ctx.errorMessage);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.errorMessage) {
    				set_data(t, ctx.errorMessage);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$t(ctx) {
    	var updating_dirty, updating_invalid, updating_value, t, current;

    	function textfield_dirty_binding(value_1) {
    		ctx.textfield_dirty_binding.call(null, value_1);
    		updating_dirty = true;
    		add_flush_callback(() => updating_dirty = false);
    	}

    	function textfield_invalid_binding(value_2) {
    		ctx.textfield_invalid_binding.call(null, value_2);
    		updating_invalid = true;
    		add_flush_callback(() => updating_invalid = false);
    	}

    	function textfield_value_binding(value_3) {
    		ctx.textfield_value_binding.call(null, value_3);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textfield_props = {
    		type: ctx.type,
    		withTrailingIcon: ctx.value !== '',
    		updateInvalid: true,
    		label: ctx.label,
    		style: "min-width: " + (ctx.minWidth ? `${ctx.minWidth}px`: '250px'),
    		$$slots: { default: [create_default_slot_1$4] },
    		$$scope: { ctx }
    	};
    	if (ctx.dirty !== void 0) {
    		textfield_props.dirty = ctx.dirty;
    	}
    	if (ctx.invalid !== void 0) {
    		textfield_props.invalid = ctx.invalid;
    	}
    	if (ctx.value !== void 0) {
    		textfield_props.value = ctx.value;
    	}
    	var textfield = new Textfield({ props: textfield_props, $$inline: true });

    	binding_callbacks.push(() => bind(textfield, 'dirty', textfield_dirty_binding));
    	binding_callbacks.push(() => bind(textfield, 'invalid', textfield_invalid_binding));
    	binding_callbacks.push(() => bind(textfield, 'value', textfield_value_binding));

    	var helpertext = new HelperText({
    		props: {
    		validationMsg: true,
    		$$slots: { default: [create_default_slot$9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			textfield.$$.fragment.c();
    			t = space();
    			helpertext.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(textfield, target, anchor);
    			insert(target, t, anchor);
    			mount_component(helpertext, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textfield_changes = {};
    			if (changed.type) textfield_changes.type = ctx.type;
    			if (changed.value) textfield_changes.withTrailingIcon = ctx.value !== '';
    			if (changed.label) textfield_changes.label = ctx.label;
    			if (changed.minWidth) textfield_changes.style = "min-width: " + (ctx.minWidth ? `${ctx.minWidth}px`: '250px');
    			if (changed.$$scope) textfield_changes.$$scope = { changed, ctx };
    			if (!updating_dirty && changed.dirty) {
    				textfield_changes.dirty = ctx.dirty;
    			}
    			if (!updating_invalid && changed.invalid) {
    				textfield_changes.invalid = ctx.invalid;
    			}
    			if (!updating_value && changed.value) {
    				textfield_changes.value = ctx.value;
    			}
    			textfield.$set(textfield_changes);

    			var helpertext_changes = {};
    			if (changed.$$scope || changed.errorMessage) helpertext_changes.$$scope = { changed, ctx };
    			helpertext.$set(helpertext_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);

    			transition_in(helpertext.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			transition_out(helpertext.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(textfield, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(helpertext, detaching);
    		}
    	};
    }

    function instance$t($$self, $$props, $$invalidate) {
    	

        let { errorMessage='', label = '', minWidth, type, value='', dirty=false, invalid=false } = $$props;

    	const writable_props = ['errorMessage', 'label', 'minWidth', 'type', 'value', 'dirty', 'invalid'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextBox> was created with unknown prop '${key}'`);
    	});

    	function textfield_dirty_binding(value_1) {
    		dirty = value_1;
    		$$invalidate('dirty', dirty);
    	}

    	function textfield_invalid_binding(value_2) {
    		invalid = value_2;
    		$$invalidate('invalid', invalid);
    	}

    	function textfield_value_binding(value_3) {
    		value = value_3;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('errorMessage' in $$props) $$invalidate('errorMessage', errorMessage = $$props.errorMessage);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('minWidth' in $$props) $$invalidate('minWidth', minWidth = $$props.minWidth);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('dirty' in $$props) $$invalidate('dirty', dirty = $$props.dirty);
    		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$props.invalid);
    	};

    	return {
    		errorMessage,
    		label,
    		minWidth,
    		type,
    		value,
    		dirty,
    		invalid,
    		textfield_dirty_binding,
    		textfield_invalid_binding,
    		textfield_value_binding
    	};
    }

    class TextBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, ["errorMessage", "label", "minWidth", "type", "value", "dirty", "invalid"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.minWidth === undefined && !('minWidth' in props)) {
    			console.warn("<TextBox> was created without expected prop 'minWidth'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<TextBox> was created without expected prop 'type'");
    		}
    	}

    	get errorMessage() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorMessage(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minWidth() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dirty() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dirty(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\RegistrationPopup.svelte generated by Svelte v3.9.1 */

    const file$p = "src\\components\\RegistrationPopup.svelte";

    // (141:12) <Label>
    function create_default_slot_3$2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Submit");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (140:8) <Button variant="raised" on:click={submit}>
    function create_default_slot_2$4(ctx) {
    	var current;

    	var label = new Label({
    		props: {
    		$$slots: { default: [create_default_slot_3$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			label.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var label_changes = {};
    			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
    			label.$set(label_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};
    }

    // (139:4) <Actions>
    function create_default_slot_1$5(ctx) {
    	var current;

    	var button = new Button_1({
    		props: {
    		variant: "raised",
    		$$slots: { default: [create_default_slot_2$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.submit);

    	return {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    }

    // (102:0) <Dialog bind:this={simpleDialog}          aria-labelledby="simple-title"          aria-describedby="simple-content"          on:MDCDialog:closed={closeHandler}          on:MDCDialog:closing={onClosing}  >
    function create_default_slot$a(ctx) {
    	var header, t1, div3, div1, t2, div0, updating_value, t3, div2, updating_value_1, t4, updating_value_2, t5, updating_value_3, t6, current;

    	var avatar = new Avatar({ $$inline: true });

    	function textbox0_value_binding(value) {
    		ctx.textbox0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textbox0_props = {
    		label: "Name",
    		minWidth: 250,
    		errorMessage: "This field is required"
    	};
    	if (ctx.name !== void 0) {
    		textbox0_props.value = ctx.name;
    	}
    	var textbox0 = new TextBox({ props: textbox0_props, $$inline: true });

    	binding_callbacks.push(() => bind(textbox0, 'value', textbox0_value_binding));

    	function textbox1_value_binding(value_1) {
    		ctx.textbox1_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let textbox1_props = {
    		type: "number",
    		label: "Age",
    		minWidth: 150,
    		errorMessage: "Please enter a number for your age"
    	};
    	if (ctx.age !== void 0) {
    		textbox1_props.value = ctx.age;
    	}
    	var textbox1 = new TextBox({ props: textbox1_props, $$inline: true });

    	binding_callbacks.push(() => bind(textbox1, 'value', textbox1_value_binding));

    	function textbox2_value_binding(value_2) {
    		ctx.textbox2_value_binding.call(null, value_2);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let textbox2_props = {
    		type: "email",
    		label: "Email",
    		minWidth: 350,
    		errorMessage: "Please enter a valid email address"
    	};
    	if (ctx.email !== void 0) {
    		textbox2_props.value = ctx.email;
    	}
    	var textbox2 = new TextBox({ props: textbox2_props, $$inline: true });

    	binding_callbacks.push(() => bind(textbox2, 'value', textbox2_value_binding));

    	function textbox3_value_binding(value_3) {
    		ctx.textbox3_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let textbox3_props = {
    		label: "Hobbies",
    		minWidth: 350
    	};
    	if (ctx.hobbies !== void 0) {
    		textbox3_props.value = ctx.hobbies;
    	}
    	var textbox3 = new TextBox({ props: textbox3_props, $$inline: true });

    	binding_callbacks.push(() => bind(textbox3, 'value', textbox3_value_binding));

    	var actions = new Actions$1({
    		props: {
    		$$slots: { default: [create_default_slot_1$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			header = element("header");
    			header.textContent = "register";
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			avatar.$$.fragment.c();
    			t2 = space();
    			div0 = element("div");
    			textbox0.$$.fragment.c();
    			t3 = space();
    			div2 = element("div");
    			textbox1.$$.fragment.c();
    			t4 = space();
    			textbox2.$$.fragment.c();
    			t5 = space();
    			textbox3.$$.fragment.c();
    			t6 = space();
    			actions.$$.fragment.c();
    			attr(header, "class", "header svelte-hnu7pg");
    			add_location(header, file$p, 107, 4, 5719);
    			attr(div0, "class", "name-tb");
    			add_location(div0, file$p, 111, 12, 5868);
    			attr(div1, "class", "avatar-container svelte-hnu7pg");
    			add_location(div1, file$p, 109, 8, 5801);
    			attr(div2, "class", "form-details");
    			add_location(div2, file$p, 120, 8, 6167);
    			attr(div3, "class", "card-details svelte-hnu7pg");
    			add_location(div3, file$p, 108, 4, 5765);
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			insert(target, t1, anchor);
    			insert(target, div3, anchor);
    			append(div3, div1);
    			mount_component(avatar, div1, null);
    			append(div1, t2);
    			append(div1, div0);
    			mount_component(textbox0, div0, null);
    			append(div3, t3);
    			append(div3, div2);
    			mount_component(textbox1, div2, null);
    			append(div2, t4);
    			mount_component(textbox2, div2, null);
    			append(div2, t5);
    			mount_component(textbox3, div2, null);
    			insert(target, t6, anchor);
    			mount_component(actions, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textbox0_changes = {};
    			if (!updating_value && changed.name) {
    				textbox0_changes.value = ctx.name;
    			}
    			textbox0.$set(textbox0_changes);

    			var textbox1_changes = {};
    			if (!updating_value_1 && changed.age) {
    				textbox1_changes.value = ctx.age;
    			}
    			textbox1.$set(textbox1_changes);

    			var textbox2_changes = {};
    			if (!updating_value_2 && changed.email) {
    				textbox2_changes.value = ctx.email;
    			}
    			textbox2.$set(textbox2_changes);

    			var textbox3_changes = {};
    			if (!updating_value_3 && changed.hobbies) {
    				textbox3_changes.value = ctx.hobbies;
    			}
    			textbox3.$set(textbox3_changes);

    			var actions_changes = {};
    			if (changed.$$scope) actions_changes.$$scope = { changed, ctx };
    			actions.$set(actions_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(textbox0.$$.fragment, local);

    			transition_in(textbox1.$$.fragment, local);

    			transition_in(textbox2.$$.fragment, local);

    			transition_in(textbox3.$$.fragment, local);

    			transition_in(actions.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(textbox0.$$.fragment, local);
    			transition_out(textbox1.$$.fragment, local);
    			transition_out(textbox2.$$.fragment, local);
    			transition_out(textbox3.$$.fragment, local);
    			transition_out(actions.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    				detach(t1);
    				detach(div3);
    			}

    			destroy_component(avatar);

    			destroy_component(textbox0);

    			destroy_component(textbox1);

    			destroy_component(textbox2);

    			destroy_component(textbox3);

    			if (detaching) {
    				detach(t6);
    			}

    			destroy_component(actions, detaching);
    		}
    	};
    }

    function create_fragment$u(ctx) {
    	var current;

    	let dialog_props = {
    		"aria-labelledby": "simple-title",
    		"aria-describedby": "simple-content",
    		$$slots: { default: [create_default_slot$a] },
    		$$scope: { ctx }
    	};
    	var dialog = new Dialog({ props: dialog_props, $$inline: true });

    	ctx.dialog_binding(dialog);
    	dialog.$on("MDCDialog:closed", ctx.closeHandler);
    	dialog.$on("MDCDialog:closing", onClosing$1);

    	return {
    		c: function create() {
    			dialog.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(dialog, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var dialog_changes = {};
    			if (changed.$$scope || changed.hobbies || changed.email || changed.age || changed.name) dialog_changes.$$scope = { changed, ctx };
    			dialog.$set(dialog_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialog.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(dialog.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			ctx.dialog_binding(null);

    			destroy_component(dialog, detaching);
    		}
    	};
    }

    function onClosing$1(e) {
          console.log('onClosing', e);
          e.stopPropagation();
      }

    function instance$u($$self, $$props, $$invalidate) {
    	

        let simpleDialog;
        let name;
        let email;
        let hobbies;
        let age;

        const dispatch=createEventDispatcher();

        onMount(() => {
            simpleDialog.open();
        });

        function closeHandler(e) {
            dispatch('popupClosed', {
                value: {
                    name,
                    age,
                    email,
                    moreDetails: {
                        hobbies
                    }
                }
            });
        }

        function submit(e) {
            console.log('name, email', name, email, hobbies, e);
        }

    	function textbox0_value_binding(value) {
    		name = value;
    		$$invalidate('name', name);
    	}

    	function textbox1_value_binding(value_1) {
    		age = value_1;
    		$$invalidate('age', age);
    	}

    	function textbox2_value_binding(value_2) {
    		email = value_2;
    		$$invalidate('email', email);
    	}

    	function textbox3_value_binding(value_3) {
    		hobbies = value_3;
    		$$invalidate('hobbies', hobbies);
    	}

    	function dialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('simpleDialog', simpleDialog = $$value);
    		});
    	}

    	return {
    		simpleDialog,
    		name,
    		email,
    		hobbies,
    		age,
    		closeHandler,
    		submit,
    		textbox0_value_binding,
    		textbox1_value_binding,
    		textbox2_value_binding,
    		textbox3_value_binding,
    		dialog_binding
    	};
    }

    class RegistrationPopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, []);
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.9.1 */

    const file$q = "src\\components\\Header.svelte";

    // (75:0) {#if isRegistrationPopupOpen}
    function create_if_block$8(ctx) {
    	var current;

    	var registrationpopup = new RegistrationPopup({ $$inline: true });
    	registrationpopup.$on("popupClosed", ctx.registrationPopupClosed);

    	return {
    		c: function create() {
    			registrationpopup.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(registrationpopup, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(registrationpopup.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(registrationpopup.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(registrationpopup, detaching);
    		}
    	};
    }

    function create_fragment$v(ctx) {
    	var header, div0, span, t1, div1, t2, t3, t4, t5, if_block_anchor, current;

    	var myiconbutton0 = new MyIconButton({
    		props: {
    		icon: "favorite_border",
    		title: "My Nice-to-know's"
    	},
    		$$inline: true
    	});
    	myiconbutton0.$on("click", onMyNtksClicked);

    	var myiconbutton1 = new MyIconButton({
    		props: {
    		icon: "favorite",
    		title: "Nice-to-know's to approve"
    	},
    		$$inline: true
    	});
    	myiconbutton1.$on("click", onNtksApprovalClicked);

    	var myiconbutton2 = new MyIconButton({
    		props: { icon: "face", title: "Show more" },
    		$$inline: true
    	});
    	myiconbutton2.$on("click", onShowMoreClicked);

    	var myiconbutton3 = new MyIconButton({
    		props: { icon: "how_to_reg", title: "Show more" },
    		$$inline: true
    	});
    	myiconbutton3.$on("click", ctx.showRegistrationForm);

    	var if_block = (ctx.isRegistrationPopupOpen) && create_if_block$8(ctx);

    	return {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Nice to know";
    			t1 = space();
    			div1 = element("div");
    			myiconbutton0.$$.fragment.c();
    			t2 = space();
    			myiconbutton1.$$.fragment.c();
    			t3 = space();
    			myiconbutton2.$$.fragment.c();
    			t4 = space();
    			myiconbutton3.$$.fragment.c();
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(span, "class", "logo-inner svelte-1yysrkk");
    			add_location(span, file$q, 64, 8, 3174);
    			attr(div0, "class", "logo svelte-1yysrkk");
    			add_location(div0, file$q, 63, 4, 3146);
    			attr(div1, "class", "controls svelte-1yysrkk");
    			add_location(div1, file$q, 66, 4, 3236);
    			attr(header, "class", "container svelte-1yysrkk");
    			add_location(header, file$q, 62, 0, 3114);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, div0);
    			append(div0, span);
    			append(header, t1);
    			append(header, div1);
    			mount_component(myiconbutton0, div1, null);
    			append(div1, t2);
    			mount_component(myiconbutton1, div1, null);
    			append(div1, t3);
    			mount_component(myiconbutton2, div1, null);
    			append(div1, t4);
    			mount_component(myiconbutton3, div1, null);
    			insert(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.isRegistrationPopupOpen) {
    				if (!if_block) {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    									transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(myiconbutton0.$$.fragment, local);

    			transition_in(myiconbutton1.$$.fragment, local);

    			transition_in(myiconbutton2.$$.fragment, local);

    			transition_in(myiconbutton3.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(myiconbutton0.$$.fragment, local);
    			transition_out(myiconbutton1.$$.fragment, local);
    			transition_out(myiconbutton2.$$.fragment, local);
    			transition_out(myiconbutton3.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}

    			destroy_component(myiconbutton0);

    			destroy_component(myiconbutton1);

    			destroy_component(myiconbutton2);

    			destroy_component(myiconbutton3);

    			if (detaching) {
    				detach(t5);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function onMyNtksClicked() {
          customViewStore.setView(viewKeys.MY_NTKS);
      }

    function onShowMoreClicked() {
          customViewStore.setView(viewKeys.GENERAL_NTKS);
      }

    function onNtksApprovalClicked() {
          customViewStore.setView(viewKeys.NTKS_APPROVAL);
      }

    function instance$v($$self, $$props, $$invalidate) {
    	

        let isRegistrationPopupOpen = false;

        function showRegistrationForm() {
            $$invalidate('isRegistrationPopupOpen', isRegistrationPopupOpen = true);
        }

        function registrationPopupClosed(e){
            $$invalidate('isRegistrationPopupOpen', isRegistrationPopupOpen = false);
            customNtkStore.registerUser(e.detail.value);
        }

    	return {
    		isRegistrationPopupOpen,
    		showRegistrationForm,
    		registrationPopupClosed
    	};
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, []);
    	}
    }

    /* src\AppDesktop.svelte generated by Svelte v3.9.1 */

    const file$r = "src\\AppDesktop.svelte";

    function create_fragment$w(ctx) {
    	var div, t, current;

    	var header = new Header({ $$inline: true });

    	var switch_value = ctx.currentView.view;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			header.$$.fragment.c();
    			t = space();
    			if (switch_instance) switch_instance.$$.fragment.c();
    			attr(div, "class", "container-flex svelte-1t29fi9");
    			add_location(div, file$r, 18, 0, 985);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(header, div, null);
    			append(div, t);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (switch_value !== (switch_value = ctx.currentView.view)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(header);

    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};
    }

    function instance$w($$self, $$props, $$invalidate) {
    	

        let currentView;
        const unsubscribe = customViewStore.subscribe(state => {
            $$invalidate('currentView', currentView = state.currentView ? state.currentView : getView(viewKeys.MY_NTKS));
        });

    	return { currentView };
    }

    class AppDesktop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.9.1 */

    const file$s = "src\\App.svelte";

    function create_fragment$x(ctx) {
    	var main, current;

    	var desktop = new AppDesktop({ $$inline: true });

    	return {
    		c: function create() {
    			main = element("main");
    			desktop.$$.fragment.c();
    			attr(main, "class", "container");
    			add_location(main, file$s, 8, 0, 289);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(desktop, main, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(desktop.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(desktop.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			destroy_component(desktop);
    		}
    	};
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, ["name"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var app = new App({
      target: document.body,
      props: {
        name: "world"
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
