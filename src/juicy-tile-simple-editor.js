(function () {
    /**
     * Checks whether an element is a juicy-tile-list.
     * @param   {HTMLElement}   element     The element to check.
     * @param   {Array}         selectors   List of valid tag names for juicy-tile-list.
     * @return  {Boolean}                   Returns true if the element is a juicy-tile-list, false otherwise.
     */
    function isList(element, selectors) {
        if (!element || !element.tagName) {
            return false;
        }

        var name = element.tagName.toLowerCase();

        for (var i = 0; i < selectors.length; i++) {
            if (selectors[i] == name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks whether an element is a juicy-tile.
     * @param   {HTMLElement}   element   The element to check.
     * @return  {Boolean}                 Returns true if the element is a Shadow DOM container of juicy-tile or a light DOM juicy-tile. Returns false otherwise.
     */
    function isTile(element) {
        return element && element.classList && element.hasAttribute &&
                (element.classList.contains("juicy-tile") || element.classList.contains("containerBackground") || element.hasAttribute("juicytile"));
    }

    /**
     * Check whether an element is a juicy-tile of a list.
     * @param   {JuicyTileList}   list      The juicy-tile-list to check.
     * @param   {HTMLElement}     element   The element to check.
     * @return  {Boolean}                   Returns true if the element is a juicy-tile and is ownded by the list. Returns false otherwise.
     */
    function isListTile(list, element) {
        if (!isTile(element)) {
            return false;
        }

        if (element.parentNode == list) {
            return true;
        }

        while (element.parentNode) {
            element = element.parentNode;
        }

        if (element.host == list) {
            return true;
        }

        return false;
    }

    /**
     * Gets tile id from Shadow DOM container, list DOM tile, or lose group setup object.
     * @param   {Object}   element   The element to get id from.
     * @return  {String}             Returns juicy-tile id of the element.
     */
    function getTileId(element) {
        var id = element.id;

        if (element.isLoseGroup) {
            id = element.id;
        } else if (element.hasAttribute("juicytile")) {
            id = element.getAttribute("juicytile");
        } else if (element.classList.contains("juicy-tile") && element.parentNode && element.parentNode.tagName == "TD") {
            id = element.parentNode.id;
        }

        return id;
    }

    /**
     * Gets top level juicy-tile HTMLElement per MouseEvent within selected list and/or scope.
     * @param   {MouseEvent}      event   Event object, for example mouse click or mouseover event.
     * @param   {JuicyTileList}   list    Selected juicy-tile-list to narrow the search.
     * @param   {Object}          scope   Not required. Selected scope to narrow the search, can be tight group juicy-tile Shadow DOM container or lose group setup object.
     * @return  {HTMLElement}             Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups.
     */
    function getTile(event, list, scope) {
        var target = null;

        for (var i = 0; i < event.path.length; i++) {
            var t = event.path[i];

            if (t == scope) {
                break;
            }

            if (isListTile(list, t)) {
                target = t;
            }
        }

        if (!target || !target.parentNode) {
            return null;
        }

        var id = getTileId(target);

        // Selecting the top group if a tile packed inside.
        var setup = getSetupItem(list.setup, id);
        var scopeSetup = null;

        if (scope) {
            var scopeSetup = getSetupItem(list.setup, getTileId(scope));

            while (setup && setup.container != scopeSetup) {
                setup = setup.container;
            }
        } else {
            while (setup.container.container) {
                setup = setup.container;
            }
        }

        if (!setup) {
            return null;
        }

        // Get Shadow DOM element for this tile.id.
        var element = list.tiles[setup.id];

        if (!element && setup.items && setup.items.length) {
            element = getGroupTiles(list, setup);
        }

        return element;
    }

    /**
     * Gets top level juicy-tile-list within selected scope.
     * @param   {MouseEvent}      event       Event object, for example mouse click or mouseover event.
     * @param   {HTMLElement}     scope       Not required. Selected scope to narrow the search. Can be any HTMLElement.
     * @param   {Array}           selectors   List of valid tag names for juicy-tile-list.
     * @return  {JuicyTileList}               Returns a juicy-tile-list if found in selected scope, null otherwise.
     */
    function getList(event, scope, selectors) {
        var list = null;
        var inScope = !scope;

        for (var i = 0; i < event.path.length; i++) {
            var el = event.path[i];

            if (el == scope) {
                inScope = true;
                break;
            }

            if (isList(el, selectors)) {
                list = el;
            }
        }

        if (!inScope) {
            return null;
        }

        return list;
    }

    /**
     * Gets array of Shadow DOM juicy-tile containers per lose group.
     * @param   {JuicyTileList}   list    The juicy-tile-list to look for tiles in.
     * @param   {Object}          setup   The setup object of a lose group, should belong to the list.
     * @return  {Array}                   Returns arra y of Shadow DOM juicy-tile containers.
     */
    function getGroupTiles(list, setup) {
        var tiles = [];

        tiles.isLoseGroup = true;
        tiles.id = setup.id;

        setup.items.forEach(function (s) {
            var el = list.tiles[s.id];

            if (el) {
                tiles.push(el);
            } else if (s.items) {
                var children = getGroupTiles(list, s);

                children.forEach(function (child) {
                    tiles.push(child);
                });
            }
        });

        return tiles;
    }

    /**
     * Gets all juicy-tile-list elements within a tile.
     * @param   {JuicyTileList}   list        The list to look for the tile in.
     * @param   {String}          tileId      The tile's id. The tile should belong to the list.
     * @param   {Array}           selectors   List of valid tag names for juicy-tile-list.
     * @return  {Array}                       Returns list of juicy-tile-list items found inside the tile.
     */
    function getNestedLists(list, tileId, selectors) {
        var selector = selectors.map(function (s) {
            return "[juicytile='" + tileId + "'] " + s;
        }).join(", ");

        var lists = list.querySelectorAll(selector);

        lists = Array.prototype.slice.call(lists);

        return lists;
    }

    /**
     * Gets setup object by tile id within parent setup.
     * @param   {Object}   setup   The parent setup object to look for the nested setup.
     * @param   {[type]}   id      The id of the setup to look for.
     * @return  {Object}           Returns setup object for the id if found within the setup. Returns null otherwise.
     */
    function getSetupItem(setup, id) {
        if (!setup.items) {
            return null;
        }

        for (var i = 0; i < setup.items.length; i++) {
            var item = setup.items[i];

            if (item.id == id) {
                return item;
            }

            var s = getSetupItem(item, id);

            if (s != null) {
                return s;
            }
        }

        return null;
    }

    /**
     * Determines which of the two tiles should be on top according to their priority.
     * @param   {Object}   a   The juicy setup object of the first tile.
     * @param   {Object}   b   The juicy setup object of the second tile.
     * @return  {Number}       Returns 1/-1/0 according to the priority comparison.
     */
    function sortByPriority(a, b) {
        a = a.priority;
        b = b.priority;

        if (a > b) {
            return 1;
        } else if (b > a) {
            return -1;
        } else {
            return 0;
        }
    }

    /**
     * Determines which of the two tiles should be on top according to their priority in descending order.
     * @param   {Object}   a   The juicy setup object of the first tile.
     * @param   {Object}   b   The juicy setup object of the second tile.
     * @return  {Number}       Returns 1/-1/0 according to the priority comparison.
     */
    function sortByPriorityDesc(a, b) {
        a = a.priority;
        b = b.priority;

        if (a > b) {
            return -1;
        } else if (b > a) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Clears all selected text on the page.
     */
    function clearSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
    }

    /**
     * Gets user friendly name for an HTMLElement which is a label, legend or contains any of those.
     * @param   {HTMLElement}   element   The element to give name to.
     * @return  {String}                  Returns user friendly name or null if the element is not supported.
     */
    function getLabelSetupName(element) {
        if (!element) {
            return null;
        }

        var tagName = element.tagName.toLowerCase();

        if ((tagName == "label" || tagName == "legend") && element.innerText) {
            return element.innerText;
        }

        element = element.querySelector("label, legend");

        return getLabelSetupName(element);
    }

    /**
     * Gets user friendly name for an HTMLElement which is an input, a select, a textarea, or contains any of those.
     * @param   {HTMLElement}   element   The element to give name to.
     * @return  {String}                  Returns user friendly name or null if the element is not supported.
     */
    function getControlSetupName(element) {
        if (!element) {
            return null;
        }

        var tagName = element.tagName.toLowerCase();

        if (["input", "select", "textarea"].indexOf(tagName) < 0) {
            return getControlSetupName(element.querySelector("input, select, textarea"));
        }

        var value = element.getAttribute("placeholder");

        if (value) {
            return value;
        }

        var value = element.getAttribute("title");

        if (value) {
            return value;
        }

        var value = element.querySelector("option");

        if (value && value.innerText) {
            return value.innerText;
        }

        if (element.value) {
            return element.value;
        }

        return null;
    }

    /**
     * Gets user friendly name for an HTMLElement which is an img or contains an img.
     * @param   {HTMLElement}   element   The element to give name to.
     * @return  {String}                  Returns user friendly name or null if the element is not supported.
     */
    function getImageSetupName(element) {
        if (!element) {
            return null;
        }

        if (element.tagName.toLowerCase() != "img") {
            return getImageSetupName(element.querySelector("img"));
        }

        var value = element.getAttribute("alt");

        if (value) {
            return value + " image";
        }

        value = element.getAttribute("title");

        if (value) {
            return value + " image";
        }

        value = element.getAttribute("src");

        if (value && value.indexOf("data:image") < 0) {
            return value;
        }

        return "Empty image";
    }

    /**
     * Gets user friendly name for an HTMLElement which contains a JuicyTileList.
     * @param   {HTMLElement}   element         The element to give name to.
     * @param   {Array}         listSelectors   List of valid tag names for juicy-tile-list.
     * @return  {String}                        Returns user friendly name or null if the element is not supported.
     */
    function getListSetupName(element, listSelectors) {
        var selector = listSelectors.join(", ");
        var list = element.querySelector(selector);

        if (list) {
            return getFullSetupName(list, list.setup, listSelectors);
        }

        return null;
    }

    /**
     * Gets user friendly name for a juicy setup object within a list. Crops the value to fit in 18 characters.
     * @param   {JuicyTileList}   list            The selected juicy-tile-list.
     * @param   {[type]}          setup           The setup object to give name to.
     * @param   {Array}           listSelectors   List of valid tag names for juicy-tile-list.
     * @return  {String}                          Returns user friendly name or "Empty tile" if the element is not supported.
     */
    function getSetupName(list, setup, listSelectors) {
        var value = getFullSetupName(list, setup, listSelectors);
        var maxLen = 18;

        if (value && value.length > maxLen) {
            var index = value.indexOf(" ", maxLen);

            if (index > 0) {
                value = value.substring(0, index);
            }
        }

        value = value.replace(/[&]$/gi, "").trim();

        if (!value) {
            value = "Empty tile";
        }

        return value;
    }

    /**
     * Gets user friendly name for a juicy setup object within a list.
     * @param   {JuicyTileList}   list            The selected juicy-tile-list.
     * @param   {[type]}          setup           The setup object to give name to.
     * @param   {Array}           listSelectors   List of valid tag names for juicy-tile-list.
     * @return  {String}                          Returns user friendly name or "Empty tile" if the element is not supported.
     */
    function getFullSetupName(list, setup, listSelectors) {
        if (setup.itemName) {
            return setup.itemName;
        }

        if (setup.items) {
            if (!setup.items.length) {
                return "Empty group";
            }

            var names = [];

            for (var i = 0; i < setup.items.length; i++) {
                names.push(getFullSetupName(list, setup.items[i], listSelectors));
            }

            names = names.join(" & ");

            if (setup.container) {
                return "Group: " + names;
            } else {
                return "Partial: " + names;
            }
        }

        var tile = list.querySelector("[juicytile='" + setup.id + "']");
        var value = getListSetupName(tile, listSelectors);

        if (value) {
            return value;
        }

        value = getLabelSetupName(tile);

        if (value) {
            return value;
        }

        value = getControlSetupName(tile);

        if (value) {
            return value;
        }

        value = getImageSetupName(tile);

        if (value) {
            return value;
        }

        if (tile.innerText) {
            return tile.innerText;
        }

        return "Empty element";
    }

    /**
     * Creates a new tight group in a list after selected setup.
     * @param   {JuicyTileList}   list            The list to create group in.
     * @param   {Object}          selectedSetup   Not required. The setup of selected tile to put group after.
     * @return  {Object}                          Returns juicy setup object of the newly created group.
     */
    function createSetupGroup(list, selectedSetup) {
        var container = list.setup;
        var priority = 1;

        if (selectedSetup) {
            container = selectedSetup.container;
            priority = selectedSetup.priority - Number.EPSILON;
        } else if (list.setup.items.length) {
            list.setup.items[0].priority = 1 - Number.EPSILON;
        }

        var setup = {
            priority: priority,
            gutter: 0,
            height: 1,
            width: "100%",
            widthFlexible: true,
            hidden: false,
            heightDynamic: true,
            tightGroup: true
        };

        var group = list.createNewContainer(null, container, setup, true);

        group.height = 1;
        group.heightDynamic = true;
        group.width = "100%";
        group.widthFlexible = true;
        group.tightGroup = true;
        group.itemName = "New Group";
        group.direction = "horizontal";
        group.content = "";

        return group;
    }

    var notAvailable = "N/A";

    Polymer({
        is: "juicy-tile-simple-editor",
        properties: {
            /** Media screen range of scoped juicy-tile-list. An item from mediaScreenRanges collection. */
            mediaScreen: { type: Object, notify: true },

            /** Predefined media screen range items collection */
            mediaScreenRanges: {
                type: Array,
                value: function () {
                    return [{ name: "Mobile", width: 320, css: "iphone" }, { name: "Tablet", width: 480, css: "ipad" },
                        { name: "Laptop", width: 960, css: "laptop" }, { name: "Desktop", width: 1200, css: "screen" }];
                }
            },

            /** Width of selected tile(s). An item from widthRanges collection. */
            widthItem: { type: Object, value: null, notify: true },

            /** Predefined width items collection. */
            widthRanges: {
                type: Array,
                value: function () {
                    return [{ name: "1", value: 100 / 12 + "%" }, { name: "2", value: 200 / 12 + "%" }, { name: "3", value: 300 / 12 + "%" }, { name: "4", value: 400 / 12 + "%" },
                        { name: "5", value: 500 / 12 + "%" }, { name: "6", value: 600 / 12 + "%" }, { name: "7", value: 700 / 12 + "%" }, { name: "8", value: 800 / 12 + "%" },
                        { name: "9", value: 900 / 12 + "%" }, { name: "10", value: 1000 / 12 + "%" }, { name: "11", value: 1100 / 12 + "%" }, { name: "12", value: 1200 / 12 + "%" }];
                }
            },

            /** Visible state of selected tile(s). */
            visible: { type: Boolean, value: null, notify: true },

            /** List of element tag names which should be treated as juicy-tile-list. */
            listSelectors: {
                type: Array,
                value: function () {
                    return ["juicy-tile-list", "juicy-tile-grid", "juicy-tile-table"];
                }
            },

            /** All juicy-tile-list elements found on the page. */
            lists: { type: Array, value: function () { return []; } },

            /** Array of setup objects of selected juicy-tile items. */
            selectedTiles: { type: Array, value: function () { return []; } },

            /** Scoped juicy-tile-list, the HTMLElement itself. */
            selectedList: { type: Object, value: null, observer: "selectedListChanged" },

            /**
             * Scoped tight group - Shadow DOM HTMLElement of the group.
             * Scoped lose group - array of Shadow DOM HTMLElements inside the group.
             * Scoped juicy-tile with juicy-tile-list inside - Shadow DOM HTMLElement of the tile.
             */
            selectedScope: { type: Object, value: null, observer: "selectedScopeChanged" },

            /** Array of setup objects of all juicy-tile items withing selected list and scope. */
            selectedScopeItems: { type: Array, value: function () { return []; } },

            /** Array of breadcrumb items. Represents scope in history. */
            breadcrumb: { type: Array, value: function () { return []; } },

            /** Dirty state indicator. */
            isModified: { type: Boolean, value: false, notify: true },

            /**
             * false - normal mode.
             * true - expert mode.
             */
            showMore: { type: Boolean, value: false },

            /**
             * false - sidebar hidden.
             * true - sidebar visible.
             */
            showTree: { type: Boolean, value: true },

            /** Background color of selected tile(s). */
            background: { type: String, observer: "backgroundChanged" },

            /** Oversize of selected tile(s). */
            oversize: { type: Number, observer: "oversizeChanged" },

            /** Outline of selected tile(s). */
            outline: { type: String, observer: "outlineChanged" },

            /** Gutter of scoped list or scope. */
            gutter: { type: Number, observer: "gutterChanged" },

            /** Direction of selected tile(s). Applicable to groups only. */
            direction: { type: String },

            /** Content of selected tile(s). Applicable to groups only. */
            content: { type: String, observer: "contentChanged" },

            /** Width of selected tile(s). */
            width: { type: String, observer: "widthChanged" },

            /** Height of selected tile(s). */
            height: { type: String, observer: "heightChanged" },

            /** Width flexible flag of selected tile(s). */
            widthFlexible: { type: Boolean, observer: "widthFlexibleChanged" },

            /** Width dynamic flag of selected tile(s). */
            widthDynamic: { type: Boolean, observer: "widthDynamicChanged" },

            /** Height flexible flag of selected tile(s). */
            heightFlexible: { type: Boolean, observer: "heightFlexibleChanged" },

            /** Height dynamic flag of selected tile(s). */
            heightDynamic: { type: Boolean, observer: "heightDynamicChanged" },

            /** Tight group flag of selected tile(s). Applicable to groups only. */
            tightGroup: { type: Boolean, observer: "tightGroupChanged" },

            /**
             * Horizontal direction of selected tile(s). Applicable to groups only.
             * false - from left to right.
             * true - from right to left.
             */
            rightToLeft: { type: Boolean },

            /**
             * Vertical direction of selected tile(s). Applicable to groups only.
             * false - from top to bottom.
             * true - from bottom to top.
             */
            bottomUp: { type: Boolean },

            /**
             * Array of predefined setup objects
             */
            predefinedSetups:{
                type: Object,
                value: function(){return [];}
            }
        },
        observers: ["selectedTilesChanged(selectedTiles.length)"],
        attached: function () {
            this.set("mediaScreen", this.mediaScreenRanges[this.mediaScreenRanges.length - 1]);

            var listsTree = [];
            var lists = [];
            var node = document.querySelector("body");
            var getNodeLists = function (node, allLists) {
                var lists = [];
                var children = node.childNodes;

                for (var i = 0; i < children.length; i++) {
                    var child = children[i];

                    if (isList(child, this.listSelectors)) {
                        var item = {
                            list: child,
                            children: getNodeLists(child, allLists)
                        };

                        allLists.push(child);
                        lists.push(item);
                    } else {
                        var items = getNodeLists(child, allLists);

                        lists = lists.concat(items);
                    }
                }

                return lists;
            }.bind(this);

            listsTree = getNodeLists(node, lists);

            this.onListMouseover = function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();

                var tile = null;

                if (this.selectedList) {
                    tile = this.getEventTile(e);
                }

                if (!tile) {
                    tile = this.getEventList(e);
                }

                if (tile) {
                    this.$.highlightTileRollover.show(tile);
                    e.stopImmediatePropagation();
                } else {
                    this.$.highlightTileRollover.hide();
                }
            }.bind(this);

            this.onListClick = function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();

                var tile = null;

                if (this.selectedList) {
                    tile = this.getEventTile(e);
                }

                if (!tile) {
                    tile = this.getEventList(e);
                }

                this.toggleSelectedTile(e.ctrlKey || e.metaKey, tile);
            }.bind(this);

            this.onListDoubleClick = function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();

                var tile = null;

                if (this.selectedList) {
                    tile = this.getEventTile(e);
                }

                if (!tile) {
                    tile = this.getEventList(e);
                }

                if (!tile) {
                    return;
                }

                var id = null;
                var setup = null;
                var isScope = false;

                if (tile.setup) {
                    id = tile.setup.id;
                    setup = tile.setup;
                    isScope = true;
                } else if (this.selectedList) {
                    id = getTileId(tile);
                    setup = getSetupItem(this.selectedList.setup, id);
                    isScope = this.getIsScopable(setup);
                } else {
                    id = tile.setup.id;
                    setup = tile.setup;
                    isScope = true;
                }

                if (isScope) {
                    clearSelection();
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    this.scopeIn(setup);
                }
            }.bind(this);

            this.onDocumentClick = function (e) {
                this.scopeOut();
            }.bind(this);

            this.onClick = function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }.bind(this);

            this.set("lists", lists);
            this.set("listsTree", listsTree);

            setTimeout(function () {
                this.resetSelection();
                this.attachEventListeners();
                this.attachedCalled = true;
                this.isReadingSetup = false;
                this.fire("attached");
            }.bind(this), 100);
        },
        detached: function () {
            this.detachEventListeners();
            this.onListMouseover = null;
            this.onListClick = null;
            this.onListDoubleClick = null;

            this.$.highlightScopeSelected.hide();
            this.$.highlightTileRollover.hide();
            this.$.highlightTileSelected.hide();
        },
        /**
         * Attaches document click, editor click, juicy-tile-list click/dblclick/mousemove event handlers.
         */
        attachEventListeners: function () {
            this.detachEventListeners();

            var lists = null;

            if (this.selectedList) {
                lists = [this.selectedList];
            } else {
                lists = this.listsTree.map(function (item) {
                    return item.list;
                });
            }

            for (var i = 0; i < lists.length; i++) {
                var list = lists[i];
                var shadow = list.shadowContainer;

                list.addEventListener("mousemove", this.onListMouseover, true);
                shadow.addEventListener("mousemove", this.onListMouseover, true);

                list.addEventListener("click", this.onListClick, true);
                shadow.addEventListener("click", this.onListClick, true);

                list.addEventListener("dblclick", this.onListDoubleClick, true);
                shadow.addEventListener("dblclick", this.onListDoubleClick, true);
            }

            document.addEventListener("click", this.onDocumentClick);
            this.addEventListener("click", this.onClick);
        },
        /**
         * Removes document click, editor click, juicy-tile-list click/dblclick/mousemove event handlers.
         */
        detachEventListeners: function () {
            this.lists.forEach(function (list) {
                var shadow = list.shadowContainer;

                list.removeEventListener("mousemove", this.onListMouseover, true);
                shadow.removeEventListener("mousemove", this.onListMouseover, true);

                list.removeEventListener("click", this.onListClick, true);
                shadow.removeEventListener("click", this.onListClick, true);

                list.removeEventListener("dblclick", this.onListDoubleClick, true);
                shadow.removeEventListener("dblclick", this.onListDoubleClick, true);
            }.bind(this));

            document.removeEventListener("click", this.onDocumentClick);
            this.removeEventListener("click", this.onClick);
        },
        /**
         * Polymer binding helper. Gets css class value for a media range button.
         * @param   {Object}   selected   The selected media range item.
         * @param   {Object}   item       The media range item to get class for.
         * @return  {String}              Returns css class for the item.
         */
        getMediaButtonCss: function (selected, item) {
            var css = ["btn"];

            if (selected == item && this.selectedList) {
                css.push("active");
            }

            if (item.css) {
                css.push(item.css);
            }

            return css.join(" ");
        },
        /**
         * Polymer binding helper. Gets css class value for a width button.
         * @param   {Object}   selected   The selected width item.
         * @param   {Object}   item       The width item to get class for.
         * @return  {String}              Returns css class for the item.
         */
        getWidthButtonCss: function (selected, item) {
            var css = ["btn"];

            if (selected) {
                var v = parseFloat(selected.value);
                var i = parseFloat(item.value);

                if (i <= v) {
                    css.push("active");
                }
            }

            return css.join(" ");
        },
        /**
         * Polymer binding helper. Gets css class value for a width button.
         * @param   {Object}   selected   The number of selected tiles.
         * @param   {Object}   item       The tree item to get class for.
         * @return  {String}              Returns css class for the item.
         */
        getTreeItemCss: function (selected, item) {
            var css = ["editor-tree-item"];
            var tiles = this.selectedTiles;

            for (var i = 0; i < tiles.length; i++) {
                var tile = tiles[i];

                if (tile.id == item.id || tile.setup == item) {
                    css.push("selected");
                    break;
                }
            }

            return css.join(" ");
        },
        /**
         * Polymer binding helper. Gets css class value for a mode tab button.
         * @param   {String}   name   The name of the mode to get class for.
         * @return  {String}          Returns css class for the name.
         */
        getTabButtonCss: function (name) {
            var v = (name == "expert");

            v = (!!this.showMore === v) ? "btn-tab active" : "btn-tab";

            return v;
        },
        /**
         * Polymer binding helper. Gets css style value for a background color.
         * @param   {String}   background   The color to get style for.
         * @return  {String}                Returns css style for the name.
         */
        getBackgroundStyle: function (background) {
            if (background === notAvailable) {
                return "";
            }

            return background ? ["background-color: ", background, ";"].join("") : "";
        },
        /**
         * Polymer binding helper. Gets css style value for an outline.
         * @param   {String}   outline   The outline value to get style for.
         * @return  {String}             Returns css style for the value.
         */
        getOutlineStyle: function (outline) {
            if (outline === notAvailable) {
                return "";
            }

            return outline ? ["outline: ", outline, ";"].join("") : "";
        },
        /**
         * Polymer binding helper.
         * @return  {Boolean}      Returns true if the two items are equal.
         */
        getIsChecked: function (a, b) {
            return a == b;
        },
        /**
         * Gets whether a juicy setup item is scopable.
         * @param   {Object}    item   The juicy setup item to check.
         * @return  {Boolean}          Returns true if the item is a jucy-tile-list, is a tight group, is a lose group, or contains juicy-tile-list. Returns false otherwise.
         */
        getIsScopable: function (item) {
            if (item.items && item.items.length) {
                return true;
            }

            return getNestedLists(this.selectedList, item.id, this.listSelectors).length;
        },
        /**
         * Polymer binding helper. Gets whether a list and/or scope is able to apply gutter.
         * @param   {JuicyTileList}   list    Not required. The list to check.
         * @param   {Object}          scope   Not required. The juicy tile group setup object to check.
         * @return  {Boolean}                 Returns true if the scope is a not empty group. Returns true if scope is null and list is not null. Returns false otherwise.
         */
        getIsGutterable: function (list, scope) {
            if (!scope) {
                return !!list;
            }

            return !!scope.items;
        },
        /**
         * Polymer binding helper. Gets whether all of the selected tiles are groups.
         * @param   {Array}     tiles   Array of tiles to check.
         * @return  {Boolean}           Returns true if all of the selected tiles are groups. Returns false otherwise.
         */
        getIsGroupSelection: function (tiles) {
            for (var i = 0; i < tiles.length; i++) {
                var setup = this.getSetupItem(tiles[i]);

                if (!setup || !setup.items) {
                    return false;
                }
            }

            return tiles.length > 0;
        },
        /**
         * Polymer binding helper.
         * @param   {Boolean}   visible   The setup value to check.
         * @return  {Boolean}             Returns true if the value is set and equals to true. Returns false otherwise.
         */
        getIsVisible: function (visible) {
            return visible === true;
        },
        /**
         * Polymer binding helper.
         * @param   {Boolean}   visible   The setup value to check.
         * @return  {Boolean}             Returns true if the value is set and equals to false. Returns false otherwise.
         */
        getIsHidden: function (visible) {
            return visible === false;
        },
        /**
         * Gets user friendly name for a setup object in scope of selected list.
         * @param   {Object}   setup   The setup object to give name to.
         * @return  {String}           Returns user friendly name. See the global getSetupName function for more details.
         */
        getSetupName: function (setup) {
            if (this.selectedList) {
                return getSetupName(this.selectedList, setup, this.listSelectors);
            }

            var list = this.getListPerSetup(setup);

            return getSetupName(list, setup, this.listSelectors);
        },
        /**
         * Polymer binding helper. Gets user friendly name for a breadcrumb item.
         * @param   {Object}   item   The breadcrumb item to give name to.
         * @return  {String}          Returns user friendly name.
         */
        getCrumbName: function (item) {
            if (item.scope) {
                var id = getTileId(item.scope);
                var setup = getSetupItem(item.list.setup, id);

                return getSetupName(item.list, setup, this.listSelectors);
            } else {
                return this.getSetupName(item.list.setup, this.listSelectors);
            }
        },
        /**
         * Polymer binding helper. Gets user friendly name for a selected list and/or scope.
         * @param   {JuicyTileList}   list    Not required. The selected list to give name to.
         * @param   {JuicyTileList}   scope   Not required. The juicy setup object of selected group.
         * @return  {String}                  Returns user friendly name of the scope if set. Returns user friendly name of the list if set. Returns empty string otherwise.
         */
        getSelectedScopeName: function (list, scope) {
            if (scope) {
                return getSetupName(list, getSetupItem(list.setup, getTileId(scope)), this.listSelectors);
            } else if(list) {
                return getSetupName(list, list.setup, this.listSelectors);
            }

            return "";
        },
        /**
         * Gets common setup value of all selected tiles.
         * @param   {String}   name   The name of the setup property to get value.
         * @return  {Object}          Returns setup's value if all the selected tiles has the same value. Returns N/A otherwise.
         */
        getCommonSetupValue: function (name) {
            var value = null;

            if (this.selectedList && this.selectedTiles.length) {
                for (var i = 0; i < this.selectedTiles.length; i++) {
                    var tile = this.selectedTiles[i];
                    var id = tile.id;
                    var setup = tile.setup || getSetupItem(this.selectedList.setup, id);
                    var v = setup[name];

                    if (i > 0 && value !== v) {
                        return notAvailable;
                    }

                    value = v;
                }
            } else if (this.selectedScope) {
                var id = getTileId(this.selectedScope);
                var setup = getSetupItem(this.selectedList.setup, id);

                value = setup[name];
            } else if (this.selectedList) {
                value = this.selectedList.setup[name];
            } else if (this.selectedTiles.length) {
                for (var i = 0; i < this.selectedTiles.length; i++) {
                    var tile = this.selectedTiles[i];
                    var setup = tile.setup;
                    var v = setup[name];

                    if (i > 0 && value !== v) {
                        return notAvailable;
                    }

                    value = v;
                }
            }

            if (value === undefined) {
                value = null;
            }

            return value;
        },
        /**
         * Polymer binding helper. Gets user friendly width value as a string.
         * @param   {JuicyTileList}   list            The selected juicy-tile-list.
         * @param   {String}          width           The width value to convert into user friendly format.
         * @param   {Boolean}         widthFlexible   The flexible flag.
         * @param   {Boolean}         widthDynamic    The dynamic flag.
         * @return  {String}                          The generated value.
         */
        getWidthString: function (list, width, widthFlexible, widthDynamic) {
            if (!width) {
                return "Width:"
            }

            width = width.toString();

            var s = [width];

            if (width.indexOf("%") > 0) {
                if (widthFlexible) {
                    s.push(" of parent");
                } else {
                    s.push(" of ", list.setup.width, "px");
                }
            } else {
                if (widthFlexible) {
                    s.push(" / ", list.setup.width, " of parent");
                } else {
                    s.push(" pixels");
                }
            }

            if (widthDynamic) {
                s.push(" or more");
            }

            return s.join("");
        },
        /**
         * Gets tile by id within a list.
         * @param   {JuicyTileList}   list   The list to look for the tile in, this.selectedList by default. This parameter becames `id` if only one parameter passed.
         * @param   {String}          id     The id of the tile to look for.
         * @return  {HTMLElement}            Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups.
         */
        getTile: function () {
            var id;
            var list;
            
            if (arguments.length == 1) {
                id = arguments[0];
                list = this.selectedList;
            } else {
                id = arguments[1];
                list = arguments[0];
            }

            var tile = list.tiles[id];

            if (tile) {
                return tile;
            }

            var setup = getSetupItem(list.setup, id);
            
            tile = getGroupTiles(list, setup);

            return tile;
        },
        /**
         * Gets top level juicy-tile HTMLElement per MouseEvent within selected list and/or scope.
         * @param   {MouseEvent}    e   Event object, for example mouse click or mouseover event.
         * @return  {HTMLElement}       Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups. See the getTile global function for more details.
         */
        getEventTile: function (e) {
            return getTile(e, this.selectedList, this.selectedScope);
        },
        /**
         * Gets top level juicy-tile-list within selected scope.
         * @return  {JuicyTileList}      Returns a juicy-tile-list if found in selected scope, null otherwise. See the global function getList for more details.
         */
        getEventList: function (e) {
            return getList(e, this.selectedScope || this.selectedList, this.listSelectors);
        },
        /**
         * Gets setup object per tile within selected scope.
         * @param   {Object}   tile   The tile's HTMLElement or JuicyTileList to get setup fro.
         * @return  {Object}          Returns setup object for the tile if found within the scope. Returns null otherwise.
         */
        getSetupItem: function (tile) {
            // juicy-tile-list/grid/table
            if (tile.setup) {
                return tile.setup;
            }

            var id = getTileId(tile);
            var setup = getSetupItem(this.selectedList.setup, id);

            return setup;
        },
        /**
         * Gets juicy-tile-list by its setup object.
         * @param   {Object}          setup   The juicy setup object to look for a list.
         * @return  {JuicyTileList}           Returns juicy-tile-list if found, undefined otherwise.
         */
        getListPerSetup: function (setup) {
            for (var i = 0; i < this.lists.length; i++) {
                if (this.lists[i].setup == setup) {
                    return this.lists[i];
                }
            }
        },
        /**
         * Sets the same setup value to all selected tiles.
         * @param   {String}   name    Name of the setup property to set.
         * @param   {Object}   value   Value to set.
         */
        setCommonSetupValue: function (name, value) {
            if (value === notAvailable || this.isReadingSetup) {
                return;
            }

            if (this.selectedTiles.length) {
                this.selectedTiles.forEach(function (tile) {
                    var id = tile.id;
                    var setup = getSetupItem(this.selectedList.setup, id);

                    setup[name] = value;
                }.bind(this));
            } else if (this.selectedScope) {
                var setup = this.getSetupItem(this.selectedScope);
                setup[name] = value;
            } else if (this.selectedList) {
                this.selectedList.setup[name] = value;
            }

            this.touch();
            this.refreshSelectedList();
        },
        /**
         * Polymer observer. Determines media range of currently selected juicy-tile-list and updates this.mediaScreen property.
         */
        readSelectedMediaScreen: function (newVal, oldVal) {
            if (!newVal) {
                this.set("mediaScreen", null);
                return;
            }

            var w = newVal.setup.width;
            var range = null;

            this.mediaScreenRanges.forEach(function (row) {
                if (w >= row.width) {
                    range = row;
                }
            }.bind(this));

            this.set("mediaScreen", range);
        },
        /**
         * Reads width value of currently selected tiles and updates this.widthItem property.
         */
        readWidth: function () {
            var width = this.getCommonSetupValue("width");

            if (!width) {
                this.set("widthItem", null);
            } else {
                var item = null;

                this.widthRanges.forEach(function (row) {
                    if (width == row.value) {
                        item = row;
                    }
                });

                this.set("widthItem", item);
            }
        },
        /**
         * Reads hidden value of currently selected tiles and updates this.visible property.
         */
        readVisible: function () {
            var hidden = this.getCommonSetupValue("hidden");

            if (hidden === null || hidden === notAvailable) {
                this.set("visible", null);
            } else {
                this.set("visible", !hidden);
            }
        },
        /**
         * Reads gutter of currently selected list/scope and updates this.gutter property.
         */
        readGutter: function () {
            var setup;

            if (this.selectedScope) {
                setup = this.getSetupItem(this.selectedScope);
            }

            if (!setup || !setup.items) {
                setup = this.selectedList.setup;
            }

            this.set("gutter", setup.gutter || 0);
        },
        /**
         * Reads all primitive setup values and updates corresponding editor properties. The primitive values: ["background", "oversize", "outline", "direction", "content", "width", "height", "widthFlexible", "widthDynamic", "heightFlexible", "heightDynamic", "tightGroup", "rightToLeft", "bottomUp"]
         */
        readPrimitiveSetupValues: function () {
            var names = ["background", "oversize", "outline", "direction", "content", "width", "height", "widthFlexible", "widthDynamic",
                "heightFlexible", "heightDynamic", "tightGroup", "rightToLeft", "bottomUp"];

            names.forEach(function (name) {
                var value = this.getCommonSetupValue(name);

                this.set(name, value);
            }.bind(this));
        },
        /**
         * Reads all possible setup value of currently selected list/scope and tiles, updates corresponding editor properties.
         */
        readSelectedSetup: function () {
            if (!this.selectedList) {
                return;
            }

            this.isReadingSetup = true;

            this.readWidth();
            this.readVisible();
            this.readGutter();
            this.readPrimitiveSetupValues();

            this.isReadingSetup = false;
        },
        /**
         * Puts editor in the dirty state. Save button becomes enabled.
         */
        touch: function () {
            if (!this.attachedCalled || this.isReadingSetup) {
                return;
            }

            this.set("isModified", true);
        },
        /**
         * Adds 1 to a dimensional setup value.
         * @param   {String}   name   Name of the setup property to increase.
         */
        dimensionPlus: function (name) {
            var value = 1;
            var unit = "";
            var v = this[name] ? this[name].toString() : "";

            if (v) {
                value = v.replace(/[\D]/gi, "");
                unit = v.replace(/[\d]/gi, "");
                value++;
            }

            if (unit) {
                this.set(name, value + unit);
            } else {
                this.set(name, value / 1);
            }
        },
        /**
         * Deducts 1 from a dimensional setup value if the value is greater than 0.
         * @param   {String}   name   Name of the setup property to decrease.
         */
        dimensionMinus: function (name) {
            var v = this[name] ? this[name].toString() : "";
            var value = v.replace(/[\D]/gi, "");
            var unit = v.replace(/[\d]/gi, "");

            if (!value || value < 0) {
                value = 0;
            } else {
                value--;
            }

            if (unit) {
                this.set(name, value + unit);
            } else {
                this.set(name, value / 1);
            }
        },
        /**
         * Adds 1 to a numeric setup value.
         * @param   {String}   name   Name of the setup property to increase.
         */
        valuePlus: function (name) {
            var value = 1;

            if (this[name]) {
                value = this[name] / 1 + 1;
            }

            this.set(name, value);
        },
        /**
         * Deducts 1 from a numeric setup value if the value is greater than 0.
         * @param   {String}   name   Name of the setup property to decrease.
         */
        valueMinus: function (name) {
            var value = this[name] / 1 - 1;

            if (!value || value < 0) {
                value = 0;
            }

            this.set(name, value);
        },
        /**
         * Refreshsed currently selected juicy-tile-list with hard: true. Selects tile by id.
         * @param   {String}   id   The id of the tile to select after refresh.
         */
        refreshAndSelectTile: function (id) {
            this.set("selectedTiles", []);
            this.refreshSelectedList();

            var tile = this.selectedList.tiles[id];

            this.set("selectedTiles", [tile]);
            this.refreshSelectedScopeItems();
        },
        /**
         * Gets setup item of the first selected tile.
         * @return  {Objects}      Returns setup item of the first selected tile or null if nothing selected.
         */
        getFirstSelectedSetup: function () {
            if (!this.selectedTiles.length) {
                return null;
            }

            var tile = this.selectedTiles[0];
            var setup = this.getSetupItem(tile);

            return setup;
        },
        /**
         * Polymer event handler. Updates media screen range of the selected list on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectMediaScreen: function (e) {
            if (!this.selectedList) {
                return;
            }

            this.touch();
            this.set("mediaScreen", e.currentTarget.item);
            this.selectedList.setup.width = this.mediaScreen.width;
            this.refreshSelectedList();
            this.readWidth();
        },
        /**
         * Polymer event handler. Updates width setup value of the selected tiles on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectWidth: function (e) {
            this.touch();
            this.set("widthItem", e.currentTarget.item);
            this.set("width", e.currentTarget.item.value);

            this.selectedTiles.forEach(function (tile) {
                var id = tile.id;
                var setup = getSetupItem(this.selectedList.setup, id);

                setup.width = this.widthItem.value;
                setup.widthFlexible = true;
            }.bind(this));

            this.refreshSelectedList();
        },
        /**
         * Polymer event handler. Updates hidden setup value of the selected tiles on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectVisible: function (e) {
            this.touch();
            this.set("visible", e.target.dataset.value / 1);

            this.selectedTiles.forEach(function (tile) {
                var setup = getSetupItem(this.selectedList.setup, tile.id);
                var index = this.selectedScopeItems.indexOf(setup);

                setup.hidden = !this.visible;
                this.notifyPath("selectedScopeItems." + index + ".hidden", setup.hidden);
            }.bind(this));

            this.refreshSelectedList();
        },
        /**
         * Polymer event handler. Moves selected tiles up with priority property.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        moveUp: function (e) {
            this.touch();

            var setups = this.selectedTiles.map(function (tile) {
                return getSetupItem(this.selectedList.setup, tile.id);
            }.bind(this));

            setups.sort(sortByPriorityDesc);

            setups.forEach(function (setup) {
                this.selectedList.reprioritizeItem(setup, true);
            }.bind(this));

            this.refreshSelectedList();
            this.refreshSelectedScopeItems();
        },
        /**
         * Polymer event handler. Moves selected tiles down with priority property.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        moveDown: function (e) {
            this.touch();

            var setups = this.selectedTiles.map(function (tile) {
                return getSetupItem(this.selectedList.setup, tile.id);
            }.bind(this));

            setups.sort(sortByPriority);

            setups.forEach(function (setup) {
                this.selectedList.reprioritizeItem(setup, false);
            }.bind(this));

            this.refreshSelectedList();
            this.refreshSelectedScopeItems();
        },
        /**
         * Polymer event handler. Creates a new tight group and adds all selected tiles into it.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        packGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            this.selectedTiles.forEach(function (t) {
                var s = this.getSetupItem(t);

                this.selectedList.moveToContainer(s, group, true);
            }.bind(this));

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        /**
         * Polymer event handler. Creates a new emtpy group and puts it under the first selected tile.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        packEmptyGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        /**
         * Polymer event handler. Creates a new empty group with 1px in height and black background. Puts the group under the first selected tile.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        packSeparatorGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            group.heightDynamic = false;
            group.background = "#000000";
            group.itemName = "Separator";

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        /**
         * Polymer event handler.
         * @param   {MouseEvent}   e   The mouse click event object. Removes all selected groups.
         */
        unpackGroup: function (e) {
            var tiles = this.selectedTiles.slice();

            tiles.forEach(function (tile) {
                var index = this.selectedTiles.indexOf(tile);
                var setup = this.getSetupItem(tile);

                if (setup.items) {
                    this.selectedList.deleteContainer(setup);
                    this.splice("selectedTiles", index, 1);
                }
            }.bind(this));

            this.refreshSelectedList();
            this.refreshSelectedScopeItems();
            this.touch();
        },
        /**
         * Polymer event handler. Toggles tile selection on sidebar item click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;
            var list = this.getListPerSetup(setup) || this.selectedList;
            var tile = this.getTile(list, setup.id);

            this.toggleSelectedTile(e.ctrlKey || e.metaKey, tile);
        },
        /**
         * Polymer event handler. Scopes in a group or a juicy-tile-list on sidebar item dblclick.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        scopeInTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;

            if (this.getIsScopable(setup)) {
                this.scopeIn(setup);
            }
        },
        /**
         * Polymer event handler. Toggles visibility of a tile on sidebar eye button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        toggleTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;
            var index = this.selectedScopeItems.indexOf(setup);

            setup.hidden = !setup.hidden;

            this.refreshSelectedList();
            this.notifyPath("selectedScopeItems." + index + ".hidden", setup.hidden);
        },
        /**
         * Polymer event handler. Scopes in a group or a juicy-tile-list on sidebar item ... button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectScopeItem: function (e) {
            this.scopeIn(e.currentTarget.item);
        },
        /**
         * Polymer event handler. Scopes in a breadcrumb item on click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectCrumbItem: function (e) {
            this.scopeTo(e.currentTarget.item);
        },
        /**
         * Polymer event handler. Toggles editor mode on tab button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        toggleMore: function (e) {
            this.set("showMore", !this.showMore);
        },
        /**
         * Polymer event handler. Toggles sidebar visibility on tree button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        toggleTree: function (e) {
            this.set("showTree", !this.showTree);
        },
        /**
         * Polymer event handler. Fires close-click event on close button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        closeEditor: function (e) {
            this.fire("close-click");
        },
        /**
         * Polymer event handler. Increases oversize on button click.
         *
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        oversizePlus: function (e) {
            this.valuePlus("oversize");
        },
        /**
         * Polymer event handler. Decreases oversize on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        oversizeMinus: function (e) {
            this.valueMinus("oversize");
        },
        /**
         * Polymer event handler. Increases gutter on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        gutterPlus: function (e) {
            this.valuePlus("gutter");
        },
        /**
         * Polymer event handler. Decreases gutter on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        gutterMinus: function (e) {
            this.valueMinus("gutter");
        },
        /**
         * Polymer event handler. Increases width on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        widthPlus: function (e) {
            this.dimensionPlus("width");
        },
        /**
         * Polymer event handler. Decreases width on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        widthMinus: function (e) {
            this.dimensionMinus("width");
        },
        /**
         * Polymer event handler. Increases height on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        heightPlus: function (e) {
            this.dimensionPlus("height");
        },
        /**
         * Polymer event handler. Decreases height on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        heightMinus: function (e) {
            this.dimensionMinus("height");
        },
        /**
         * Polymer event handler. Calculates width or height on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        calculateDimension: function (e) {
            var dimension = e.currentTarget.dataset["dimension"];

            this.selectedTiles.forEach(function (tile) {
                var id = getTileId(tile);
                var setup = getSetupItem(this.selectedList.setup, id);
                var element = this.selectedList.querySelector("[juicytile='" + id + "']");

                if (!element) {
                    element = this.selectedList.tiles[id];
                }

                var rec = element.getBoundingClientRect();

                if (dimension == "width") {
                    setup.width = rec.width;
                    setup.widthFlexible = false;
                } else if (dimension == "height") {
                    setup.height = rec.height;
                    setup.heightDynamic = false;
                }
            }.bind(this));

            this.touch();
            this.refreshSelectedList();
        },
        /**
         * Polymer event handler. Sets juicy-tile-list direction (horizontal or vertical) on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectDirection: function (e) {
            var target = e.currentTarget;
            var value = target.value;

            this.set("direction", value);
            this.setCommonSetupValue("direction", value);
        },
        /**
         * Polymer event handler. Sets boolean setup property on button click.
         * @param   {String}       name   The name of the setup property to set.
         * @param   {MouseEvent}   e      The mouse click event object.
         */
        selectBooleanValue: function (name, e) {
            var target = e.currentTarget;
            var value = target.value / 1;

            value = value === 1;

            this.set(name, value);
            this.setCommonSetupValue(name, value);
        },
        /**
         * Polymer event handler. Sets juicy-tile-list text-alignment (rightToLeft or leftToRight) on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectRightToLeft: function (e) {
            this.selectBooleanValue("rightToLeft", e);
        },
        /**
         * Polymer event handler. Sets juicy-tile-list vertical-alignment (bottomUp or upBottom) on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        selectBottomUp: function (e) {
            this.selectBooleanValue("bottomUp", e);
        },
        /**
         * Polymer event handler. Reads JSON setup value of currently selected list on button click.
         * @param   {MouseEvent}   e   The mouse click event object.
         */
        readSource: function (e) {
            var setup = JSON.stringify(this.selectedList.setup);

            this.set("source", setup);
        },
        /**
         * Polymer event handler. Sets JSON setup value to current selected list on textarea change.
         * @param   {EventObject}   e   The textarea change event object.
         */
        writeSource: function (e) {
            var setup = JSON.parse(this.source);

            this.selectedList.setup = setup;
            this.refreshSelectedList();
            this.set("selectedScope", null);
            this.refreshSelectedScopeItems();
        },
        /**
         * Polymer event handler. Sets initial value of the juicy-tile-editor#showTree iron-localstorage.
         * @param   {EventObject}   e   The iron-localstorage-load-empty custom event object.
         */
        initShowTree: function (e) {
            this.set("showTree", true);
        },
        /**
         * Deselects all selected tiles and scopes to the root level.
         */
        resetSelection: function () {
            var lists = this.listsTree.map(function (item) {
                return item.list;
            });

            if (this.selectedTiles.length) {
                this.set("selectedTiles", []);
            }

            this.set("selectedScope", null);
            this.set("breadcrumb", []);
            this.set("selectedList", null);

            if (lists.length == 1) {
                this.set("selectedList", lists[0]);
            }

            this.refreshSelectedScopeItems();
            this.readSelectedSetup();
            this.refreshHighlightSelectedScope();
        },
        /**
         * Scopes into a group by setup object.
         * @param   {Object}   setup   The setup object of a group to scope in.
         */
        scopeIn: function (setup) {
            this.set("selectedTiles", []);

            if (!this.selectedList) {
                var list = this.getListPerSetup(setup);
                
                this.set("selectedScope", null);
                this.set("selectedList", list);
                return;
            }

            var name = getFullSetupName(this.selectedList, this.selectedList.setup, this.listSelectors);
            var tile = this.getTile(setup.id);

            if (this.selectedScope) {
                var s = this.getSetupItem(this.selectedScope);

                name = s.itemName;
            }

            this.set("selectedTiles", []);
            this.push("breadcrumb", { list: this.selectedList, scope: this.selectedScope, name: name });

            var list = this.getListPerSetup(setup);

            if (list) {
                this.set("selectedScope", null);
                this.set("selectedList", list);
            } else if (setup.items && setup.items.length) {
                this.set("selectedScope", tile);
            } else {
                var lists = getNestedLists(this.selectedList, setup.id, this.listSelectors);

                if (!lists.length) {
                    throw "Cannot scope in to this tile!";
                }

                this.set("selectedScope", tile);
            }

            this.readSelectedSetup();
        },
        /**
         * Scopes into upper level if any.
         */
        scopeOut: function () {
            if (!this.breadcrumb.length) {
                this.set("selectedTiles", []);
                this.set("selectedScope", null);
                this.set("selectedList", null);
                return;
            }

            var index = this.breadcrumb.length - 1;
            var item = this.breadcrumb[index];

            this.scopeTo(item);
        },
        /**
         * Scopes into a breadcrumb item.
         * @param   {Object}   crumb   The breadcrumb item to scope in.
         */
        scopeTo: function (crumb) {
            var index = this.breadcrumb.indexOf(crumb);
            var cut = this.breadcrumb.length - index;

            this.set("selectedTiles", []);
            this.set("selectedList", crumb.list);
            this.set("selectedScope", crumb.scope);
            this.splice("breadcrumb", index, cut);
            this.readSelectedSetup();
            this.refreshSelectedTiles();
        },
        /**
         * Toggles selection of a tile.
         * @param   {Boolean}       multiple   Indicates whether multiple selection is allowed.
         * @param   {HTMLElement}   tile       The Shadow DOM container of a tile to select or setup object of a lose group.
         */
        toggleSelectedTile: function (multiple, tile) {
            clearSelection();

            if (!tile && this.breadcrumb.length) {
                this.scopeOut();
                return;
            } else if (!tile) {
                this.resetSelection();
                return;
            }

            if (!multiple) {
                this.set("selectedTiles", [tile]);
                return;
            }

            var index = this.selectedTiles.indexOf(tile);

            if (index >= 0) {
                this.splice("selectedTiles", index, 1);
            } else {
                this.push("selectedTiles", tile);
            }
        },
        /**
         * Perfroms a hard refresh of the selected list.
         */
        refreshSelectedList: function () {
            if (!this.selectedList) {
                return;
            }

            this.selectedList.refresh(true);
            this.refreshSelectedTiles();
        },
        /**
         * Refreshes list of the sidebar items according to the selected list and/or scope.
         */
        refreshSelectedScopeItems: function () {
            var items;

            if (this.selectedScope) {
                var setup = this.getSetupItem(this.selectedScope);

                if (setup.items) {
                    items = setup.items.slice();
                    items.sort(sortByPriorityDesc);
                } else {
                    items = getNestedLists(this.selectedList, setup.id, this.listSelectors).map(function (it) {
                        return it.setup;
                    });
                }
            } else if (this.selectedList) {
                items = this.selectedList.setup.items.slice();
                items.sort(sortByPriorityDesc);
            } else if (this.listsTree) {
                items = this.listsTree.map(function (item) {
                    return item.list.setup;
                });
            } else {
                items = [];
            }

            this.set("selectedScopeItems", items);
        },
        /**
         * Refreshes this.selectedTiles array and this.selectedScope value with current Shadow DOM tile containers. Relevant after hard list refresh.
         */
        refreshSelectedTiles: function () {
            var tiles = [];

            this.selectedTiles.forEach(function (t) {
                var id = getTileId(t);
                var tile = this.getTile(id);

                tiles.push(tile);
            }.bind(this));

            this.set("selectedTiles", tiles);

            if (this.selectedScope) {
                var id = getTileId(this.selectedScope);
                var tile = this.getTile(id);

                this.set("selectedScope", tile);
            }
        },
        /**
         * Refreshes highlight svg of the selected list/scope.
         */
        refreshHighlightSelectedScope: function () {
            if (this.$.highlightScopeSelected.currentState == "shown") {
                this.$.highlightScopeSelected.hide();
            }

            if (this.selectedScope) {
                this.$.highlightScopeSelected.show(this.selectedScope);
            } else if (this.selectedList) {
                this.$.highlightScopeSelected.show(this.selectedList);
            } else if(this.listsTree) {
                var lists = this.listsTree.map(function (item) {
                    return item.list;
                });

                this.$.highlightScopeSelected.show(lists);
            }
        },
        /**
         * Calls save function of all juicy-tile-setup-sync attached to lists.
         */
        saveSetup: function () {
            this.lists.forEach(function (list) {
                if (list.sync) {
                    list.sync.save();
                }
            });

            this.set("isModified", false);
        },
        /**
         * Resets setup of all lists to list.defaultsetup or null if not available
         */
        resetSetup: function () {
            var media = this.mediaScreenRanges[this.mediaScreenRanges.length - 1];

            this.lists.forEach(function (list) {
                list.setup = list.defaultsetup ? JSON.parse(JSON.stringify(list.defaultsetup)) : null;
                list.setup.width = media.width;
            });

            // Workaround to refresh parent list when child list changes it's dimensions.
            this.lists.forEach(function (list) {
                list.refresh(true);
            });

            this.touch();
            this.resetSelection();
        },
        /**
         * Reverts all changes of all lists.
         */
        revertSetup: function () {
            this.lists.forEach(function (list) {
                if (list.sync) {
                    if (list.sync.storedValue) {
                        list.sync.revert();
                    } else {
                        list.setup = list.defaultsetup ? JSON.parse(JSON.stringify(list.defaultsetup)) : null;
                    }
                }
            });

            // Workaround to refresh parent list when child list changes it's dimensions.
            this.lists.forEach(function (list) {
                list.refresh(true);
            });

            this.set("isModified", false);
            this.resetSelection();
        },
        /**
         * Polymer observer. Refreshes highlight of the selected tiles.
         */
        selectedTilesChanged: function () {
            this.$.highlightTileSelected.hide();
            this.readSelectedSetup();

            if (this.selectedTiles.length) {
                var tiles = [];

                this.selectedTiles.forEach(function (tile) {
                    if (tile.isLoseGroup) {
                        tiles = tiles.concat(tile);
                    } else {
                        tiles.push(tile);
                    }
                });

                this.$.highlightTileSelected.show(tiles);
            }
        },
        /**
         * Polymer observer. Refreshes editor state when a new juicy-tile-list scoped.
         */
        selectedListChanged: function (newVal, oldVal) {
            if (!newVal && !this.listsTree) {
                return;
            }

            this.attachEventListeners();
            this.readSelectedMediaScreen(newVal, oldVal);
            this.refreshSelectedScopeItems();
            this.readPrimitiveSetupValues();
            this.refreshHighlightSelectedScope();
        },
        /**
         * Polymer observer. Refreshes editor state when a new group scoped.
         */
        selectedScopeChanged: function (newVal, oldVal) {
            this.refreshSelectedScopeItems();
            this.refreshHighlightSelectedScope();
        },
        /**
         * Polymer observer. Refreshes background setup property of selected tiles.
         */
        backgroundChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("background", newVal);
        },
        /**
         * Polymer observer. Refreshes oversize setup property of selected tiles.
         */
        oversizeChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("oversize", newVal);
        },
        /**
         * Polymer observer. Refreshes outline setup property of selected tiles.
         */
        outlineChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("outline", newVal);
        },
        /**
         * Polymer observer. Refreshes gutter setup property of selected scope.
         */
        gutterChanged: function (newVal, oldVal) {
            var setup;

            if (this.selectedScope) {
                setup = this.getSetupItem(this.selectedScope);
            } else {
                setup = this.selectedList.setup;
            }

            setup.gutter = newVal / 1;
            this.refreshSelectedList();
        },
        /**
         * Polymer observer. Refreshes content setup property of selected tiles.
         */
        contentChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("content", newVal);
        },
        /**
         * Polymer observer. Refreshes width setup property of selected tiles.
         */
        widthChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("width", newVal);
        },
        /**
         * Polymer observer. Refreshes height setup property of selected tiles.
         */
        heightChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("height", newVal);
        },
        /**
         * Polymer observer. Refreshes widthFlexible setup property of selected tiles.
         */
        widthFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthFlexible", newVal);
        },
        /**
         * Polymer observer. Refreshes widthDynamic setup property of selected tiles.
         */
        widthDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthDynamic", newVal);
        },
        /**
         * Polymer observer. Refreshes heightFlexible setup property of selected tiles.
         */
        heightFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightFlexible", newVal);
        },
        /**
         * Polymer observer. Refreshes heightDynamic setup property of selected tiles.
         */
        heightDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightDynamic", newVal);
        },
        /**
         * Polymer observer. Refreshes tightGroup setup property of selected tiles.
         */
        tightGroupChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("tightGroup", newVal);
        },
        /** experimental support for predefined form layouts*/
        /**
         * Applies given predefined setup constructor on selected list ~given gorup~
         * @param  {Function} predefinedSetupConstructor(elements) predefined setup constructor
         *                                             function that return a setup for given list ~group~
                                                        usually it's one of `.predefinedSetups`/
         * @return {this}                            self
         */
        applyPredefinedSetup: function(predefinedSetupConstructor){
            // for debugging
            // predefinedSetupConstructor = this.predefinedSetups["Labels on left"].apply;
            // --
            /**
             * Recursively fetches all HTML Elements of `parentElements`,
             *  that are mentioned seup given in `items`
             * @param  {[type]} items       [description]
             * @param  {[type]} allElements [description]
             * @return {[type]}             [description]
             */
            function getElementsFromSetupItems(items, parentElements){
                var elements = [];
                for(var itemNo = 0, len = items.length; itemNo < len; itemNo++){
                    var item = items[itemNo];
                    if(item.items){
                        elements.concat(getElementsFromSetupItems(item.items, parentElements));
                    } else {
                        for(var elementNo = 0, elementsLen = parentElements.length; elementNo < elementsLen; elementNo++){
                            if(parentElements[elementNo].getAttribute('juicytile') === items[itemNo].id){
                                elements.push(parentElements[elementNo]);
                            }
                        }
        }
                }
                return elements;
            }
            if(this.selectedScope){
                this.getSetupItem(this.selectedScope).items = predefinedSetupConstructor( getElementsFromSetupItems(this.selectedScopeItems, this.selectedList.elements));
            } else {
                this.selectedList.setup.items = predefinedSetupConstructor(this.selectedList.elements);
            }

            this.selectedList.setup = Object.create(this.selectedList.setup);
            this.refreshSelectedList();
            return this;
        },
        /**
         * Draft of a UI handler for applying predefined layouts
         * @param  {event} event
         */
        _choosePredefinedSetup: function(event){
            event.target.value && this.applyPredefinedSetup(this.predefinedSetups[event.target.value].apply);
        }

    });
})();
