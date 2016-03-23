// XML Documentation Comments for JavaScript IntelliSense
// https://msdn.microsoft.com/en-us/library/bb514138.aspx

(function () {
    /// <summary>Checks whether an element is a juicy-tile-list.</summary>
    /// <param name="element" type="HTMLElement">The element to check.</param>
    /// <param name="selectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="Boolean">Returns true if the element is a juicy-tile-list, false otherwise.</returns>
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

    /// <summary>Checks whether an element is a juicy-tile.</summary>
    /// <param name="element" type="HTMLElement">The element to check.</param>
    /// <returns type="Boolean">Returns true if the element is a Shadow DOM container of juicy-tile or a light DOM juicy-tile. Returns false otherwise.</returns>
    function isTile(element) {
        return element && element.classList && element.hasAttribute &&
                (element.classList.contains("juicy-tile") || element.classList.contains("containerBackground") || element.hasAttribute("juicytile"));
    }

    /// <summary>Check whether an element is a juicy-tile of a list.</summary>
    /// <param name="list" type="JuicyTileList">The juicy-tile-list to check.</param>
    /// <param name="element" type="HTMLElement">The element to check.</param>
    /// <returns type="Boolean">Returns true if the element is a juicy-tile and is ownded by the list. Returns false otherwise.</returns>
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

    /// <summary>Gets tile id from Shadow DOM container, list DOM tile, or lose group setup object.</summary>
    /// <param name="element" type="Object">The element to get id from.</param>
    /// <returns type="String">Returns juicy-tile id of the element.</returns>
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

    /// <summary>Gets top level juicy-tile HTMLElement per MouseEvent within selected list and/or scope.</summary>
    /// <param name="event" type="MouseEvent">Event object, for example mouse click or mouseover event.</param>
    /// <param name="list" type="JuicyTileList">Selected juicy-tile-list to narrow the search.</param>
    /// <param name="scope" type="Object">Not required. Selected scope to narrow the search, can be tight group juicy-tile Shadow DOM container or lose group setup object.</param>
    /// <returns type="HTMLElement">Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups.</returns>
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

    /// <summary>Gets tops level juicy-tile-list within selected scope.</summary>
    /// <param name="event" type="MouseEvent">Event object, for example mouse click or mouseover event.</param>
    /// <param name="scope" type="HTMLElement">Not required. Selected scope to narrow the search. Can be any HTMLElement.</param>
    /// <param name="selectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="JuicyTileList">Returns a juicy-tile-list if found in selected scope, null otherwise.</returns>
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

    /// <summary>Gets array of Shadow DOM juicy-tile containers per lose group.</summary>
    /// <param name="list" type="JuicyTileList">The juicy-tile-list to look for tiles in.</param>
    /// <param name="setup" type="Object">The setup object of a lose group, should belong to the list.</param>
    /// <returns type="Array">Returns arra y of Shadow DOM juicy-tile containers.</returns>
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

    /// <summary>Gets all juicy-tile-list elements within a tile.</summary>
    /// <param name="list" type="JuicyTileList">The list to look for the tile in.</param>
    /// <param name="tileId" type="String">The tile's id. The tile should belong to the list.</param>
    /// <param name="selectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="Array">Returns list of juicy-tile-list items found inside the tile.</returns>
    function getNestedLists(list, tileId, selectors) {
        var selector = selectors.map(function (s) {
            return "[juicytile='" + tileId + "'] " + s;
        }).join(", ");

        var lists = list.querySelectorAll(selector);

        lists = Array.prototype.slice.call(lists);

        return lists;
    }

    /// <summary>Gets setup object by tile id within parent setup.</summary>
    /// <param name="setup" type="Object">The parent setup object to look for the nested setup.</param>
    /// <param name="id">The id of the setup to look for.</param>
    /// <returns type="Object">Returns setup object for the id if found within the setup. Returns null otherwise.</returns>
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

    /// <summary>Determines which of the two tiles should be on top according to their priority.</summary>
    /// <param name="a" type="Object">The juicy setup object of the first tile.</param>
    /// <param name="b" type="Object">The juicy setup object of the second tile.</param>
    /// <returns type="Number">Returns 1/-1/0 according to the priority comparison.</returns>
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

    /// <summary>Determines which of the two tiles should be on top according to their priority in descending order.</summary>
    /// <param name="a" type="Object">The juicy setup object of the first tile.</param>
    /// <param name="b" type="Object">The juicy setup object of the second tile.</param>
    /// <returns type="Number">Returns 1/-1/0 according to the priority comparison.</returns>
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

    /// <summary>Clears all selected text on the page.</summary>
    function clearSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
    }

    /// <summary>Gets user friendly name for an HTMLElement which is a label, legend or contains any of those.</summary>
    /// <param name="element" type="HTMLElement">The element to give name to.</param>
    /// <returns type="String">Returns user friendly name or null if the element is not supported.</returns>
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

    /// <summary>Gets user friendly name for an HTMLElement which is an input, a select, a textarea, or contains any of those.</summary>
    /// <param name="element" type="HTMLElement">The element to give name to.</param>
    /// <returns type="String">Returns user friendly name or null if the element is not supported.</returns>
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

    /// <summary>Gets user friendly name for an HTMLElement which is an img or contains an img.</summary>
    /// <param name="element" type="HTMLElement">The element to give name to.</param>
    /// <returns type="String">Returns user friendly name or null if the element is not supported.</returns>
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

    /// <summary>Gets user friendly name for an HTMLElement which contains a JuicyTileList.</summary>
    /// <param name="element" type="HTMLElement">The element to give name to.</param>
    /// <param name="listSelectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="String">Returns user friendly name or null if the element is not supported.</returns>
    function getListSetupName(element, listSelectors) {
        var selector = listSelectors.join(", ");
        var list = element.querySelector(selector);

        if (list) {
            return getFullSetupName(list, list.setup, listSelectors);
        }

        return null;
    }

    /// <summary>Gets user friendly name for a juicy setup object within a list. Crops the value to fit in 18 characters.</summary>
    /// <param name="list" type="JuicyTileList">The selected juicy-tile-list.</param>
    /// <param name="setup">The setup object to give name to.</param>
    /// <param name="listSelectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="String">Returns user friendly name or "Empty tile" if the element is not supported.</returns>
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

    /// <summary>Gets user friendly name for a juicy setup object within a list.</summary>
    /// <param name="list" type="JuicyTileList">The selected juicy-tile-list.</param>
    /// <param name="setup">The setup object to give name to.</param>
    /// <param name="listSelectors" type="Array">List of valid tag names for juicy-tile-list.</param>
    /// <returns type="String">Returns user friendly name or "Empty tile" if the element is not supported.</returns>
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

    /// <summary>Creates a new tight group in a list after selected setup.</summary>
    /// <param name="list" type="JuicyTileList">The list to create group in.</param>
    /// <param name="selectedSetup" type="Object">Not required. The setup of selected tile to put group after.</param>
    /// <returns type="Object">Returns juicy setup object of the newly created group.</returns>
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

    /// <summary>Creates a new array and put items into it if any.</summary>
    /// <param name="items" type="Array">Not required. The items array to copy into the new array.</param>
    /// <returns type="Array">Returns new array with the items.</returns>
    function getArrayPropertyValue(items) {
        return function () {
            if (items) {
                return items.slice();
            }

            return [];
        };
    }

    var notAvailable = "N/A";
    var defaultValues = {};

    defaultValues.mediaScreenRanges = [{ name: "Mobile", width: 320, css: "iphone" }, { name: "Tablet", width: 480, css: "ipad" },
                        { name: "Laptop", width: 960, css: "laptop" }, { name: "Desktop", width: 1200, css: "screen" }];

    defaultValues.widthRanges = [{ name: "1", value: 100 / 12 + "%" }, { name: "2", value: 200 / 12 + "%" }, { name: "3", value: 300 / 12 + "%" }, { name: "4", value: 400 / 12 + "%" },
                        { name: "5", value: 500 / 12 + "%" }, { name: "6", value: 600 / 12 + "%" }, { name: "7", value: 700 / 12 + "%" }, { name: "8", value: 800 / 12 + "%" },
                        { name: "9", value: 900 / 12 + "%" }, { name: "10", value: 1000 / 12 + "%" }, { name: "11", value: 1100 / 12 + "%" }, { name: "12", value: 1200 / 12 + "%" }];
    
    defaultValues.listSelectors = ["juicy-tile-list", "juicy-tile-grid", "juicy-tile-table"];

    Polymer({
        is: "juicy-tile-simple-editor",
        properties: {
            mediaScreen: { type: Object, notify: true },
            mediaScreenRanges: {
                type: Array,
                value: getArrayPropertyValue(defaultValues.mediaScreenRanges)
            },
            widthItem: { type: Object, value: null, notify: true },
            widthRanges: {
                type: Array,
                value: getArrayPropertyValue(defaultValues.widthRanges)
            },
            visible: { type: Boolean, value: null, notify: true },
            listSelectors: {
                type: Array,
                value: getArrayPropertyValue(defaultValues.listSelectors)
            },
            lists: { type: Array, value: getArrayPropertyValue() },
            selectedTiles: { type: Array, value: getArrayPropertyValue() },
            selectedList: { type: Object, value: null, observer: "selectedListChanged" },
            selectedScope: { type: Object, value: null, observer: "selectedScopeChanged" },
            selectedScopeItems: { type: Array, value: getArrayPropertyValue() },
            breadcrumb: { type: Array, value: getArrayPropertyValue() },
            isModified: { type: Boolean, value: false, notify: true },
            showMore: { type: Boolean, value: false },
            showTree: { type: Boolean, value: true },
            background: { type: String, observer: "backgroundChanged" },
            oversize: { type: Number, observer: "oversizeChanged" },
            outline: { type: String, observer: "outlineChanged" },
            gutter: { type: Number, observer: "gutterChanged" },
            direction: { type: String },
            content: { type: String, observer: "contentChanged" },
            width: { type: String, observer: "widthChanged" },
            height: { type: String, observer: "heightChanged" },
            widthFlexible: { type: Boolean, observer: "widthFlexibleChanged" },
            widthDynamic: { type: Boolean, observer: "widthDynamicChanged" },
            heightFlexible: { type: Boolean, observer: "heightFlexibleChanged" },
            heightDynamic: { type: Boolean, observer: "heightDynamicChanged" },
            tightGroup: { type: Boolean, observer: "tightGroupChanged" },
            rightToLeft: { type: Boolean },
            bottomUp: { type: Boolean }
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
        /// <summary>Attaches document click, editor click, juicy-tile-list click/dblclick/mousemove event handlers.</summary>
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
        /// <summary>Removes document click, editor click, juicy-tile-list click/dblclick/mousemove event handlers.</summary>
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
        /// <summary>Polymer binding helper. Gets css class value for a media range button.</summary>
        /// <param name="selected" type="Object">The selected media range item.</param>
        /// <param name="item" type="Object">The media range item to get class for.</param>
        /// <returns type="String">Returns css class for the item.</returns>
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
        /// <summary>Polymer binding helper. Gets css class value for a width button.</summary>
        /// <param name="selected" type="Object">The selected width item.</param>
        /// <param name="item" type="Object">The width item to get class for.</param>
        /// <returns type="String">Returns css class for the item.</returns>
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
        /// <summary>Polymer binding helper. Gets css class value for a width button.</summary>
        /// <param name="selected" type="Object">The number of selected tiles.</param>
        /// <param name="item" type="Object">The tree item to get class for.</param>
        /// <returns type="String">Returns css class for the item.</returns>
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
        /// <summary>Polymer binding helper. Gets css class value for a mode tab button.</summary>
        /// <param name="name" type="String">The name of the mode to get class for.</param>
        /// <returns type="String">Returns css class for the name.</returns>
        getTabButtonCss: function (name) {
            var v = (name == "expert");

            v = (!!this.showMore === v) ? "btn-tab active" : "btn-tab";

            return v;
        },
        /// <summary>Polymer binding helper. Gets css style value for a background color.</summary>
        /// <param name="background" type="String">The color to get style for.</param>
        /// <returns type="String">Returns css style for the name.</returns>
        getBackgroundStyle: function (background) {
            if (background === notAvailable) {
                return "";
            }

            return background ? ["background-color: ", background, ";"].join("") : "";
        },
        /// <summary>Polymer binding helper. Gets css style value for an outline.</summary>
        /// <param name="outline" type="String">The outline value to get style for.</param>
        /// <returns type="String">Returns css style for the value.</returns>
        getOutlineStyle: function (outline) {
            if (outline === notAvailable) {
                return "";
            }

            return outline ? ["outline: ", outline, ";"].join("") : "";
        },
        /// <summary>Polymer binding helper.</summary>
        /// <returns type="Boolean">Returns true if the two items are equal.</returns>
        getIsChecked: function (a, b) {
            return a == b;
        },
        /// <summary>Gets whether a juicy setup item is scopable.</summary>
        /// <param name="item" type="Object">The juicy setup item to check.</param>
        /// <returns type="Boolean">Returns true if the item is a jucy-tile-list, is a tight group, is a lose group, or contains juicy-tile-list. Returns false otherwise.</returns>
        getIsScopable: function (item) {
            if (item.items && item.items.length) {
                return true;
            }

            return getNestedLists(this.selectedList, item.id, this.listSelectors).length;
        },
        /// <summary>Polymer binding helper. Gets whether a list and/or scope is able to apply gutter.</summary>
        /// <param name="list" type="JuicyTileList">Not required. The list to check.</param>
        /// <param name="scope" type="Object">Not required. The juicy tile group setup object to check.</param>
        /// <returns type="Boolean">Returns true if the scope is a not empty group. Returns true if scope is null and list is not null. Returns false otherwise.</returns>
        getIsGutterable: function (list, scope) {
            if (!scope) {
                return !!list;
            }

            return !!scope.items;
        },
        /// <summary>Polymer binding helper. Gets whether all of the selected tiles are groups.</summary>
        /// <param name="tiles" type="Array">Array of tiles to check.</param>
        /// <returns type="Boolean">Returns true if all of the selected tiles are groups. Returns false otherwise.</returns>
        getIsGroupSelection: function (tiles) {
            for (var i = 0; i < tiles.length; i++) {
                var setup = this.getSetupItem(tiles[i]);

                if (!setup || !setup.items) {
                    return false;
                }
            }

            return tiles.length > 0;
        },
        /// <summary>Polymer binding helper.</summary>
        /// <param name="visible" type="Boolean">The setup value to check.</param>
        /// <returns type="Boolean">Returns true if the value is set and equals to true. Returns false otherwise.</returns>
        getIsVisible: function (visible) {
            return visible === true;
        },
        /// <summary>Polymer binding helper.</summary>
        /// <param name="visible" type="Boolean">The setup value to check.</param>
        /// <returns type="Boolean">Returns true if the value is set and equals to false. Returns false otherwise.</returns>
        getIsHidden: function (visible) {
            return visible === false;
        },
        /// <summary>Gets user friendly name for a setup object in scope of selected list.</summary>
        /// <param name="setup" type="Object">The setup object to give name to.</param>
        /// <returns type="String">Returns user friendly name. See the global getSetupName function for more details.</returns>
        getSetupName: function (setup) {
            if (this.selectedList) {
                return getSetupName(this.selectedList, setup, this.listSelectors);
            }

            var list = this.getListPerSetup(setup);

            return getSetupName(list, setup, this.listSelectors);
        },
        /// <summary>Polymer binding helper. Gets user friendly name for a breadcrumb item.</summary>
        /// <param name="item" type="Object">The breadcrumb item to give name to.</param>
        /// <returns type="String">Returns user friendly name.</returns>
        getCrumbName: function (item) {
            if (item.scope) {
                var id = getTileId(item.scope);
                var setup = getSetupItem(item.list.setup, id);

                return getSetupName(item.list, setup, this.listSelectors);
            } else {
                return this.getSetupName(item.list.setup, this.listSelectors);
            }
        },
        /// <summary>Polymer binding helper. Gets user friendly name for a selected list and/or scope.</summary>
        /// <param name="list" type="JuicyTileList">Not required. The selected list to give name to.</param>
        /// <param name="scope" type="JuicyTileList">Not required. The juicy setup object of selected group.</param>
        /// <returns type="String">Returns user friendly name of the scope if set. Returns user friendly name of the list if set. Returns empty string otherwise.</returns>
        getSelectedScopeName: function (list, scope) {
            if (scope) {
                return getSetupName(list, getSetupItem(list.setup, getTileId(scope)), this.listSelectors);
            } else if(list) {
                return getSetupName(list, list.setup, this.listSelectors);
            }

            return "";
        },
        /// <summary>Gets common setup value of all selected tiles.</summary>
        /// <param name="name" type="String">The name of the setup property to get value.</param>
        /// <returns type="Object">Returns setup's value if all the selected tiles has the same value. Returns N/A otherwise.</returns>
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
        /// <summary>Polymer binding helper. Gets user friendly width value as a string.</summary>
        /// <param name="list" type="JuicyTileList">The selected juicy-tile-list.</param>
        /// <param name="width" type="String">The width value to convert into user friendly format.</param>
        /// <param name="widthFlexible" type="Boolean"></param>
        /// <param name="widthDynamic" type="Boolean"></param>
        /// <returns type="String"></returns>
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
        // function getTile(id) or getTile(list, id)
        /// <summary>Gets tile by id within a list.</summary>
        /// <param name="list" type="JuicyTileList">The list to look for the tile in, this.selectedList by default. This parameter becames `id` if only one parameter passed.</param>
        /// <param name="id" type="String">The id of the tile to look for.</param>
        /// <returns type="HTMLElement">Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups.</returns>
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
        /// <summary>Gets top level juicy-tile HTMLElement per MouseEvent within selected list and/or scope.</summary>
        /// <param name="e" type="MouseEvent">Event object, for example mouse click or mouseover event.</param>
        /// <returns type="HTMLElement">Returns juicy-tile Shadow DOM container for single tiles and tight groups. Returns array of juicy-tile Shadow DOM containers for lose groups. See the getTile global function for more details.</returns>
        getEventTile: function (e) {
            return getTile(e, this.selectedList, this.selectedScope);
        },
        /// <summary>Gets tops level juicy-tile-list within selected scope.</summary>
        /// <returns type="JuicyTileList">Returns a juicy-tile-list if found in selected scope, null otherwise. See the global function getList for more details.</returns>
        getEventList: function (e) {
            return getList(e, this.selectedScope || this.selectedList, this.listSelectors);
        },
        /// <summary>Gets setup object per tile within selected scope.</summary>
        /// <param name="tile" type="Object">The tile's HTMLElement or JuicyTileList to get setup fro.</param>
        /// <returns type="Object">Returns setup object for the tile if found within the scope. Returns null otherwise.</returns>
        getSetupItem: function (tile) {
            // juicy-tile-list/grid/table
            if (tile.setup) {
                return tile.setup;
            }

            var id = getTileId(tile);
            var setup = getSetupItem(this.selectedList.setup, id);

            return setup;
        },
        /// <summary>Gets juicy-tile-list by its setup object.</summary>
        /// <param name="setup" type="Object">The juicy setup object to look for a list.</param>
        /// <returns type="JuicyTileList">Returns juicy-tile-list if found, undefined otherwise.</returns>
        getListPerSetup: function (setup) {
            for (var i = 0; i < this.lists.length; i++) {
                if (this.lists[i].setup == setup) {
                    return this.lists[i];
                }
            }
        },
        /// <summary>Sets the same setup value to all selected tiles.</summary>
        /// <param name="name" type="String">Name of the setup property to set.</param>
        /// <param name="value" type="Object">Value to set.</param>
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
        /// <summary>Polymer observer. Determines media range of currently selected juicy-tile-list and updates this.mediaScreen property.</summary>
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
        /// <summary>Reads width value of currently selected tiles and updates this.widthItem property.</summary>
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
        /// <summary>Reads hidden value of currently selected tiles and updates this.visible property.</summary>
        readVisible: function () {
            var hidden = this.getCommonSetupValue("hidden");

            if (hidden === null || hidden === notAvailable) {
                this.set("visible", null);
            } else {
                this.set("visible", !hidden);
            }
        },
        /// <summary>Reads gutter of currently selected list/scope and updates this.gutter property.</summary>
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
        /// <summary>Reads all primitive setup values and updates corresponding editor properties. The primitive values: ["background", "oversize", "outline", "direction", "content", "width", "height", "widthFlexible", "widthDynamic", "heightFlexible", "heightDynamic", "tightGroup", "rightToLeft", "bottomUp"]</summary>
        readPrimitiveSetupValues: function () {
            var names = ["background", "oversize", "outline", "direction", "content", "width", "height", "widthFlexible", "widthDynamic",
                "heightFlexible", "heightDynamic", "tightGroup", "rightToLeft", "bottomUp"];

            names.forEach(function (name) {
                var value = this.getCommonSetupValue(name);

                this.set(name, value);
            }.bind(this));
        },
        /// <summary>Reads all possible setup value of currently selected list/scope and tiles, updates corresponding editor properties.</summary>
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
        /// <summary>Puts editor in the dirty state. Save button becomes enabled.</summary>
        touch: function () {
            if (!this.attachedCalled || this.isReadingSetup) {
                return;
            }

            this.set("isModified", true);
        },
        /// <summary>Adds 1 to a dimensional setup value.</summary>
        /// <param name="name" type="String">Name of the setup property to increase.</param>
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
        /// <summary>Removes 1 from a dimensional setup value if the value is greater than 0.</summary>
        /// <param name="name" type="String">Name of the setup property to decrease.</param>
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
        /// <summary>Adds 1 to a numeric setup value.</summary>
        /// <param name="name" type="String">Name of the setup property to increase.</param>
        valuePlus: function (name) {
            var value = 1;

            if (this[name]) {
                value = this[name] / 1 + 1;
            }

            this.set(name, value);
        },
        /// <summary>Removes 1 from a numeric setup value if the value is greater than 0.</summary>
        /// <param name="name" type="String">Name of the setup property to decrease.</param>
        valueMinus: function (name) {
            var value = this[name] / 1 - 1;

            if (!value || value < 0) {
                value = 0;
            }

            this.set(name, value);
        },
        /// <summary>Refreshsed currently selected juicy-tile-list with hard: true. Selects tile by id.</summary>
        /// <param name="id" type="String">The id of the tile to select after refresh.</param>
        refreshAndSelectTile: function (id) {
            this.set("selectedTiles", []);
            this.refreshSelectedList();

            var tile = this.selectedList.tiles[id];

            this.set("selectedTiles", [tile]);
            this.refreshSelectedScopeItems();
        },
        /// <summary>Gets setup item of the first selected tile.</summary>
        /// <returns type="Objects">Returns setup item of the first selected tile or null if nothing selected.</returns>
        getFirstSelectedSetup: function () {
            if (!this.selectedTiles.length) {
                return null;
            }

            var tile = this.selectedTiles[0];
            var setup = this.getSetupItem(tile);

            return setup;
        },
        /// <summary>Polymer event handler. Updates media screen range of the selected list on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Updates width setup value of the selected tiles on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Updates hidden setup value of the selected tiles on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Moves selected tiles up with priority property.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Moves selected tiles down with priority property.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Creates a new tight group and adds all selected tiles into it.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Creates a new emtpy group and puts it under the first selected tile.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        packEmptyGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        /// <summary>Polymer event handler. Creates a new empty group with 1px in height and black background. Puts the group under the first selected tile.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        packSeparatorGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            group.heightDynamic = false;
            group.background = "#000000";
            group.itemName = "Separator";

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        /// <summary>Polymer event handler. </summary>
        /// <param name="e" type="MouseEvent">The mouse click event object. Removes all selected groups.</param>
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
        /// <summary>Polymer event handler. Toggles tile selection on sidebar item click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;
            var list = this.getListPerSetup(setup) || this.selectedList;
            var tile = this.getTile(list, setup.id);

            this.toggleSelectedTile(e.ctrlKey || e.metaKey, tile);
        },
        /// <summary>Polymer event handler. Scopes in a group or a juicy-tile-list on sidebar item dblclick.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        scopeInTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;

            if (this.getIsScopable(setup)) {
                this.scopeIn(setup);
            }
        },
        /// <summary>Polymer event handler. Toggles visibility of a tile on sidebar eye button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        toggleTreeItem: function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var setup = e.currentTarget.item;
            var index = this.selectedScopeItems.indexOf(setup);

            setup.hidden = !setup.hidden;

            this.refreshSelectedList();
            this.notifyPath("selectedScopeItems." + index + ".hidden", setup.hidden);
        },
        /// <summary>Polymer event handler. Scopes in a group or a juicy-tile-list on sidebar item ... button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectScopeItem: function (e) {
            this.scopeIn(e.currentTarget.item);
        },
        /// <summary>Polymer event handler. Scopes in a breadcrumb item on click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectCrumbItem: function (e) {
            this.scopeTo(e.currentTarget.item);
        },
        /// <summary>Polymer event handler. Toggles editor mode on tab button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        toggleMore: function (e) {
            this.set("showMore", !this.showMore);
        },
        /// <summary>Polymer event handler. Toggles sidebar visibility on tree button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        toggleTree: function (e) {
            this.set("showTree", !this.showTree);
        },
        /// <summary>Polymer event handler. Fires close-click event on close button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        closeEditor: function (e) {
            this.fire("close-click");
        },
        /// <summary>Polymer event handler. Increases oversize on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        oversizePlus: function (e) {
            this.valuePlus("oversize");
        },
        /// <summary>Polymer event handler. Decreases oversize on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        oversizeMinus: function (e) {
            this.valueMinus("oversize");
        },
        /// <summary>Polymer event handler. Increases gutter on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        gutterPlus: function (e) {
            this.valuePlus("gutter");
        },
        /// <summary>Polymer event handler. Decreases gutter on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        gutterMinus: function (e) {
            this.valueMinus("gutter");
        },
        /// <summary>Polymer event handler. Increases width on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        widthPlus: function (e) {
            this.dimensionPlus("width");
        },
        /// <summary>Polymer event handler. Decreases width on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        widthMinus: function (e) {
            this.dimensionMinus("width");
        },
        /// <summary>Polymer event handler. Increases height on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        heightPlus: function (e) {
            this.dimensionPlus("height");
        },
        /// <summary>Polymer event handler. Decreases height on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        heightMinus: function (e) {
            this.dimensionMinus("height");
        },
        /// <summary>Polymer event handler. Calculates width or height on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
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
        /// <summary>Polymer event handler. Sets juicy-tile-list direction (horizontal or vertical) on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectDirection: function (e) {
            var target = e.currentTarget;
            var value = target.value;

            this.set("direction", value);
            this.setCommonSetupValue("direction", value);
        },
        /// <summary>Polymer event handler. Sets boolean setup property on button click.</summary>
        /// <param name="name" type="String">The name of the setup property to set.</param>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectBooleanValue: function (name, e) {
            var target = e.currentTarget;
            var value = target.value / 1;

            value = value === 1;

            this.set(name, value);
            this.setCommonSetupValue(name, value);
        },
        /// <summary>Polymer event handler. Sets juicy-tile-list text-alignment (rightToLeft or leftToRight) on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectRightToLeft: function (e) {
            this.selectBooleanValue("rightToLeft", e);
        },
        /// <summary>Polymer event handler. Sets juicy-tile-list vertical-alignment (bottomUp or upBottom) on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        selectBottomUp: function (e) {
            this.selectBooleanValue("bottomUp", e);
        },
        /// <summary>Polymer event handler. Reads JSON setup value of currently selected list on button click.</summary>
        /// <param name="e" type="MouseEvent">The mouse click event object.</param>
        readSource: function (e) {
            var setup = JSON.stringify(this.selectedList.setup);

            this.set("source", setup);
        },
        /// <summary>Polymer event handler. Sets JSON setup value to current selected list on textarea change.</summary>
        /// <param name="e" type="EventObject">The textarea change event object.</param>
        writeSource: function (e) {
            var setup = JSON.parse(this.source);

            this.selectedList.setup = setup;
            this.refreshSelectedList();
            this.set("selectedScope", null);
            this.refreshSelectedScopeItems();
        },
        /// <summary>Polymer event handler. Sets initial value of the juicy-tile-editor#showTree iron-localstorage.</summary>
        /// <param name="e" type="EventObject">The iron-localstorage-load-empty custom event object.</param>
        initShowTree: function (e) {
            this.set("showTree", true);
        },
        /// <summary>Deselects all selected tiles and scopes to the root level.</summary>
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
        /// <summary>Scopes into a group by setup object.</summary>
        /// <param name="setup" type="Object">The setup object of a group to scope in.</param>
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
        /// <summary>Scopes into upper level if any.</summary>
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
        /// <summary>Scopes into a breadcrumb item.</summary>
        /// <param name="crumb" type="Object">The breadcrumb item to scope in.</param>
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
        /// <summary>Toggles selection of a tile.</summary>
        /// <param name="multiple" type="Boolean">Indicates whether multiple selection is allowed.</param>
        /// <param name="tile" type="HTMLElement">The Shadow DOM container of a tile to select or setup object of a lose group.</param>
        /// <returns type=""></returns>
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
        /// <summary>Perfroms a hard refresh of the selected list.</summary>
        refreshSelectedList: function () {
            if (!this.selectedList) {
                return;
            }

            this.selectedList.refresh(true);
            this.refreshSelectedTiles();
        },
        /// <summary>Refreshes list of the sidebar items according to the selected list and/or scope.</summary>
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
        /// <summary>Refreshes this.selectedTiles array and this.selectedScope value with current Shadow DOM tile containers. Relevant after hard list refresh.</summary>
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
        /// <summary>Refreshes highlight svg of the selected list/scope.</summary>
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
        /// <summary>Calls save function of all juicy-tile-setup-sync attached to lists.</summary>
        saveSetup: function () {
            this.lists.forEach(function (list) {
                if (list.sync) {
                    list.sync.save();
                }
            });

            this.set("isModified", false);
        },
        /// <summary>Resets setup of all lists to list.defaultsetup or null if not available</summary>
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
        /// <summary>Reverts all changes of all lists.</summary>
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
        /// <summary>Polymer observer. Refreshes highlight of the selected tiles.</summary>
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
        /// <summary>Polymer observer. Refreshes editor state when a new juicy-tile-list scoped.</summary>
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
        /// <summary>Polymer observer. Refreshes editor state when a new group scoped.</summary>
        selectedScopeChanged: function (newVal, oldVal) {
            this.refreshSelectedScopeItems();
            this.refreshHighlightSelectedScope();
        },
        /// <summary>Polymer observer. Refreshes background setup property of selected tiles.</summary>
        backgroundChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("background", newVal);
        },
        /// <summary>Polymer observer. Refreshes oversize setup property of selected tiles.</summary>
        oversizeChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("oversize", newVal);
        },
        /// <summary>Polymer observer. Refreshes outline setup property of selected tiles.</summary>
        outlineChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("outline", newVal);
        },
        /// <summary>Polymer observer. Refreshes gutter setup property of selected scope.</summary>
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
        /// <summary>Polymer observer. Refreshes content setup property of selected tiles.</summary>
        contentChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("content", newVal);
        },
        /// <summary>Polymer observer. Refreshes width setup property of selected tiles.</summary>
        widthChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("width", newVal);
        },
        /// <summary>Polymer observer. Refreshes height setup property of selected tiles.</summary>
        heightChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("height", newVal);
        },
        /// <summary>Polymer observer. Refreshes widthFlexible setup property of selected tiles.</summary>
        widthFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthFlexible", newVal);
        },
        /// <summary>Polymer observer. Refreshes widthDynamic setup property of selected tiles.</summary>
        widthDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthDynamic", newVal);
        },
        /// <summary>Polymer observer. Refreshes heightFlexible setup property of selected tiles.</summary>
        heightFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightFlexible", newVal);
        },
        /// <summary>Polymer observer. Refreshes heightDynamic setup property of selected tiles.</summary>
        heightDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightDynamic", newVal);
        },
        /// <summary>Polymer observer. Refreshes tightGroup setup property of selected tiles.</summary>
        tightGroupChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("tightGroup", newVal);
        }
    });
})();