﻿(function () {
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

    function isTile(element) {
        return element && element.classList && element.hasAttribute &&
                (element.classList.contains("juicy-tile") || element.classList.contains("containerBackground") || element.hasAttribute("juicytile"));
    }

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

    function getTileId(element) {
        var id = element.id;

        if (element.hasAttribute("juicytile")) {
            id = element.getAttribute("juicytile");
        }

        return id;
    }

    function getTile(event, list, scope) {
        var target = null;

        for (var i = 0; i < event.path.length; i++) {
            var t = event.path[i];

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
        return list.tiles[setup.id];
    }

    function getNestedList(tileId, selectors) {
        var selector = selectors.map(function (s) {
            return "[juicytile='" + tileId + "'] > " + s;
        }).join(", ");

        return document.querySelector(selector);
    }

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

    function clearSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else if (document.selection) {
            document.selection.empty();
        }
    }

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

    function getSetupName(list, setup) {
        if (setup.itemName) {
            return setup.itemName;
        }

        if (setup.items) {
            if (!setup.items.length) {
                return "Empty group";
            }

            var names = [];

            for (var i = 0; i < setup.items.length; i++) {
                names.push(getSetupName(list, setup.items[i]));
            }

            return names.join(" & ");
        }

        var tile = list.querySelector("[juicytile='" + setup.id + "']");
        var value = getLabelSetupName(tile);

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

    var notAvailable = "N/A";

    Polymer({
        is: "juicy-tile-simple-editor",
        properties: {
            mediaScreen: { type: Object, notify: true },
            mediaScreenRanges: { type: Array, value: [{ name: "Mobile", width: 300 }, { name: "Tablet", width: 700 }, { name: "Laptop", width: 900 }, { name: "Desktop", width: 1100 }] },
            width: { type: Object, value: null, notify: true },
            widthRanges: {
                type: Array,
                value: [{ name: "1", value: "10%" }, { name: "2", value: "20%" }, { name: "3", value: "30%" }, { name: "4", value: "40%" }, { name: "5", value: "50%" },
                        { name: "6", value: "60%" }, { name: "7", value: "70%" }, { name: "8", value: "80%" }, { name: "9", value: "90%" }, { name: "10", value: "100%" }]
            },
            visible: { type: Boolean, value: null, notify: true },
            listSelectors: { type: Array, value: ["juicy-tile-list", "juicy-tile-grid"] },
            lists: { type: Array, value: [] },
            selectedTiles: { type: Array, value: [] },
            selectedList: { type: Object, value: null, observer: "selectedListChanged" },
            selectedScope: { type: Object, value: null, observer: "selectedScopeChanged" },
            selectedScopeItems: { type: Array, value: [] },
            breadcrumb: { type: Array, value: [] },
            message: { type: String, value: null },
            hasChanges: { type: Boolean, value: false },
            showMore: { type: Boolean, value: false },
            showAdvanced: { type: Boolean, value: false },
            background: { type: String, observer: "backgroundChanged" },
            oversize: { type: Number, observer: "oversizeChanged" },
            outline: { type: String, observer: "outlineChanged" },
            gutter: { type: Number, observer: "gutterChanged" }
        },
        observers: ["selectedTilesChanged(selectedTiles.length)"],
        attached: function () {
            this.set("mediaScreen", this.mediaScreenRanges[this.mediaScreenRanges.length - 1]);

            var lists = Array.prototype.slice.call(document.querySelectorAll(this.listSelectors.join(", ")));

            this.onListMouseover = function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();

                var tile = getTile(e, this.selectedList, this.selectedScope);

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

                var tile = getTile(e, this.selectedList, this.selectedScope);

                this.toggleSelectedTile(e.ctrlKey, tile);
            }.bind(this);

            this.onListDoubleClick = function (e) {
                var tile = getTile(e, this.selectedList, this.selectedScope);
                var id = getTileId(tile);
                var setup = getSetupItem(this.selectedList.setup, id);
                var isScope = this.getIsScopable(setup);

                if (isScope) {
                    clearSelection();
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    this.scopeIn(setup);
                }
            }.bind(this);

            this.set("lists", lists);
            this.resetSelection();
            this.isAttached = true;
            this.isReadingSetup = false;
        },
        detached: function () {
            this.detachEventListeners();
            this.onListMouseover = null;
            this.onListClick = null;
            this.onListDoubleClick = null;
        },
        attachEventListeners: function () {
            this.detachEventListeners();

            if (!this.selectedList) {
                return;
            }

            var list = this.selectedList;
            var shadow = list.shadowContainer;

            list.addEventListener("mousemove", this.onListMouseover);
            shadow.addEventListener("mousemove", this.onListMouseover);

            list.addEventListener("click", this.onListClick, true);
            shadow.addEventListener("click", this.onListClick, true);

            list.addEventListener("dblclick", this.onListDoubleClick, true);
            shadow.addEventListener("dblclick", this.onListDoubleClick, true);
        },
        detachEventListeners: function () {
            this.lists.forEach(function (list) {
                var shadow = list.shadowContainer;

                list.removeEventListener("mousemove", this.onListMouseover);
                shadow.removeEventListener("mousemove", this.onListMouseover);

                list.removeEventListener("click", this.onListClick);
                shadow.removeEventListener("click", this.onListClick);

                list.removeEventListener("dblclick", this.onListDoubleClick);
                shadow.removeEventListener("dblclick", this.onListDoubleClick);
            }.bind(this));
        },
        showMessage: function (text) {
            this.set("message", text);

            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(function () {
                this.set("message", "");
            }.bind(this), 3000);
        },
        getSelectedTilesCaption: function (length) {
            return length > 1 ? "elements" : "element";
        },
        getRadioButtonCss: function (selected, item) {
            if (selected == item) {
                return "btn btn-radio active";
            }

            return "btn btn-radio";
        },
        getTreeItemCss: function (selected, item) {
            var css = ["editor-tree-item"];
            var tiles = this.selectedTiles;

            for (var i = 0; i < tiles.length; i++) {
                var tile = tiles[i];

                if (tile.id == item.id) {
                    css.push("selected");
                    break;
                }
            }

            return css.join(" ");
        },
        getBackgroundStyle: function (background) {
            if (background === notAvailable) {
                return "";
            }

            return background ? ["background-color: ", background, ";"].join("") : "";
        },
        getOutlineStyle: function (outline) {
            if (outline === notAvailable) {
                return "";
            }

            return outline ? ["outline: ", outline, ";"].join("") : "";
        },
        getIsScopable: function (item) {
            if (item.items && item.items.length) {
                return true;
            }

            return !!getNestedList(item.id, this.listSelectors);
        },
        getIsGroupSelection: function (tiles) {
            for (var i = 0; i < tiles.length; i++) {
                var id = getTileId(tiles[i]);
                var setup = getSetupItem(this.selectedList.setup, id);

                if (!setup.items) {
                    return false;
                }
            }

            return tiles.length > 0;
        },
        getSetupName: function (setup) {
            return getSetupName(this.selectedList, setup);
        },
        getCommonSetupValue: function (name) {
            var value = null;

            for (var i = 0; i < this.selectedTiles.length; i++) {
                var tile = this.selectedTiles[i];
                var id = tile.id;
                var setup = getSetupItem(this.selectedList.setup, id);
                var v = setup[name];

                if (i > 0 && value !== v) {
                    return notAvailable;
                }

                value = v;
            }

            if (value === undefined) {
                value = null;
            }

            return value;
        },
        setCommonSetupValue: function (name, value) {
            if (!this.selectedTiles.length || value === notAvailable || this.isReadingSetup) {
                return;
            }

            this.selectedTiles.forEach(function (tile) {
                var id = tile.id;
                var setup = getSetupItem(this.selectedList.setup, id);

                setup[name] = value;
            }.bind(this));

            this.touch();
            this.selectedList.refresh();
        },
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
        readWidth: function () {
            var width = this.getCommonSetupValue("width");

            if (!width) {
                this.set("width", null);
            } else {
                var item = null;

                this.widthRanges.forEach(function (row) {
                    if (width == row.value) {
                        item = row;
                    }
                });

                this.set("width", item);
            }
        },
        readVisible: function () {
            var hidden = this.getCommonSetupValue("hidden");

            if (hidden === null) {
                this.set("visible", null);
            } else {
                this.set("visible", !hidden);
            }
        },
        readPrimitiveSetupValues: function () {
            var names = ["background", "oversize", "outline", "gutter"];

            this.isReadingSetup = true;

            names.forEach(function (name) {
                var value = this.getCommonSetupValue(name);

                this.set(name, value);
            }.bind(this));

            this.isReadingSetup = false;
        },
        readSelectedSetup: function () {
            if (!this.selectedList) {
                return;
            }

            this.readWidth();
            this.readVisible();
            this.readPrimitiveSetupValues();
        },
        touch: function () {
            if (this.isAttached && !this.isReadingSetup) {
                this.set("hasChanges", true);
            }
        },
        selectMediaScreen: function (e) {
            if (!this.selectedList) {
                return;
            }

            this.touch();
            this.set("mediaScreen", e.target.item);
            this.selectedList.setup.width = this.mediaScreen.width;
        },
        selectWidth: function (e) {
            this.touch();
            this.set("width", e.target.item);

            this.selectedTiles.forEach(function (tile) {
                var id = tile.id;
                var setup = getSetupItem(this.selectedList.setup, id);

                setup.width = this.width.value;
                setup.widthFlexible = true;
            }.bind(this));

            this.selectedList.refresh();
        },
        selectVisible: function (e) {
            this.touch();
            this.set("visible", e.target.dataset.value / 1);

            this.selectedTiles.forEach(function (tile) {
                var setup = getSetupItem(this.selectedList.setup, tile.id);

                setup.hidden = !this.visible;
            }.bind(this));

            this.selectedList.refresh(true);
        },
        moveUp: function (e) {
            this.touch();

            var setups = this.selectedTiles.map(function (tile) {
                return getSetupItem(this.selectedList.setup, tile.id);
            }.bind(this));

            setups.sort(sortByPriorityDesc);

            setups.forEach(function (setup) {
                this.selectedList.reprioritizeItem(setup, true);
            }.bind(this));

            this.selectedList.refresh();
            this.refreshSelectedScopeItems();
        },
        moveDown: function (e) {
            this.touch();

            var setups = this.selectedTiles.map(function (tile) {
                return getSetupItem(this.selectedList.setup, tile.id);
            }.bind(this));

            setups.sort(sortByPriority);

            setups.forEach(function (setup) {
                this.selectedList.reprioritizeItem(setup, false);
            }.bind(this));

            this.selectedList.refresh();
            this.refreshSelectedScopeItems();
        },
        packGroup: function (e) {
            var first = this.selectedTiles[0];
            var firstId = getTileId(first);
            var firstSetup = getSetupItem(this.selectedList.setup, firstId);
            var setup = {
                priority: firstSetup.priority,
                gutter: 0,
                height: 1,
                width: "100%",
                widthFlexible: true,
                hidden: false,
                heightDynamic: true,
                precalculateHeight: true,
                tightGroup: true
            };

            var group = this.selectedList.createNewContainer(null, firstSetup.container, setup, true);

            group.height = 1;
            group.heightDynamic = true;
            group.width = "100%";
            group.widthFlexible = true;
            group.precalculateHeight = true;
            group.tightGroup = true;
            group.itemName = "New Group";

            this.selectedTiles.forEach(function (t) {
                var id = getTileId(t);
                var s = getSetupItem(this.selectedList.setup, id);

                this.selectedList.moveToContainer(s, group, true);
            }.bind(this));

            this.set("selectedTiles", []);
            this.selectedList.refresh(true);

            var tile = this.selectedList.tiles[group.id];

            this.set("selectedTiles", [tile]);
            this.refreshSelectedScopeItems();
        },
        unpackGroup: function (e) {
            var tiles = this.selectedTiles.slice();

            tiles.forEach(function (tile) {
                var index = this.selectedTiles.indexOf(tile);
                var id = getTileId(tile);
                var setup = getSetupItem(this.selectedList.setup, id);

                if (setup.items) {
                    this.selectedList.deleteContainer(setup);
                    this.splice("selectedTiles", index, 1);
                }
            }.bind(this));

            this.selectedList.refresh(true);
            this.refreshSelectedScopeItems();
        },
        selectTreeItem: function (e) {
            var setup = e.currentTarget.item;
            var tile = this.selectedList.tiles[setup.id];

            this.toggleSelectedTile(e.ctrlKey, tile);
        },
        selectScopeItem: function (e) {
            this.scopeIn(e.currentTarget.item);
        },
        selectCrumbItem: function (e) {
            this.scopeTo(e.currentTarget.item);
        },
        toggleMore: function (e) {
            this.set("showMore", !this.showMore);
        },
        toggleAdvanced: function (e) {
            this.set("showAdvanced", !this.showAdvanced);
        },
        oversizePlus: function (e) {
            var value = 1;

            if (this.oversize) {
                value = this.oversize + 1;
            }

            this.set("oversize", value);
        },
        oversizeMinus: function (e) {
            var value = this.oversize - 1;

            if (!value || value < 0) {
                value = 0;
            }

            this.set("oversize", value);
        },
        gutterPlus: function (e) {
            var value = 1;

            if (this.gutter) {
                value = this.gutter + 1;
            }

            this.set("gutter", value);
        },
        gutterMinus: function (e) {
            var value = this.gutter - 1;

            if (!value || value < 0) {
                value = 0;
            }

            this.set("gutter", value);
        },
        resetSelection: function () {
            this.set("selectedList", null);
            this.set("selectedList", this.lists[0]);
            this.set("selectedScope", null);
            this.set("breadcrumb", []);
            this.refreshSelectedScopeItems();

            if (this.selectedTiles.length) {
                this.set("selectedTiles", []);
            }

            this.readSelectedSetup();
        },
        scopeIn: function (setup) {
            var name = this.selectedList.setup.itemName;

            if (this.selectedScope) {
                var id = getTileId(this.selectedScope);
                var s = getSetupItem(this.selectedList.setup, id);

                name = s.itemName;
            }

            this.push("breadcrumb", { list: this.selectedList, scope: this.selectedScope, name: name });

            if (setup.items && setup.items.length) {
                var tile = this.selectedList.tiles[setup.id];

                this.set("selectedScope", tile);
            } else {
                var list = getNestedList(setup.id, this.listSelectors);

                if (!list) {
                    throw "Cannot scope in to this tile!";
                }

                this.set("selectedScope", null);
                this.set("selectedList", list);
            }
        },
        scopeOut: function () {
            if (!this.breadcrumb.length) {
                return;
            }

            var index = this.breadcrumb.length - 1;
            var item = this.breadcrumb[index];

            this.scopeTo(item);
        },
        scopeTo: function (crumb) {
            var index = this.breadcrumb.indexOf(crumb);
            var cut = this.breadcrumb.length - index;

            this.set("selectedTiles", []);
            this.set("selectedList", crumb.list);
            this.set("selectedScope", crumb.scope);
            this.splice("breadcrumb", index, cut);
        },
        toggleSelectedTile: function (multiple, tile) {
            if (!tile) {
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
        refreshSelectedScopeItems: function () {
            var items;

            if (this.selectedScope) {
                var id = getTileId(this.selectedScope);
                var setup = getSetupItem(this.selectedList.setup, id);

                items = setup.items.slice();
            } else if (this.selectedList) {
                items = this.selectedList.setup.items.slice();
            } else {
                items = [];
            }

            items.sort(sortByPriorityDesc);

            this.set("selectedScopeItems", items);
        },
        refreshHighlightSelectedScope: function () {
            if (this.selectedScope) {
                this.$.highlightScopeSelected.show(this.selectedScope);
            } else if (this.selectedList) {
                this.$.highlightScopeSelected.show(this.selectedList);
            } else if (this.$.highlightScopeSelected.currentState == "shown") {
                this.$.highlightScopeSelected.hide();
            }
        },
        saveSetup: function () {
            this.lists.forEach(function (list) {
                if (list.sync) {
                    list.sync.save();
                }
            });

            this.set("hasChanges", false);
        },
        resetSetup: function () {
            this.lists.forEach(function (list) {
                list.setup = list.defaultsetup || null;
            });

            // Workaround to refresh parent list when child list changes it's dimensions.
            this.lists.forEach(function (list) {
                list.refresh(true);
            });

            this.touch();
            this.resetSelection();
        },
        selectedTilesChanged: function () {
            this.$.highlightTileSelected.hide();
            this.readSelectedSetup();

            if (this.selectedTiles.length) {
                this.$.highlightTileSelected.show(this.selectedTiles);
            }
        },
        selectedListChanged: function (newVal, oldVal) {
            if (!newVal) {
                return;
            }

            this.attachEventListeners();
            this.readSelectedMediaScreen(newVal, oldVal);
            this.refreshSelectedScopeItems();
            this.refreshHighlightSelectedScope();
        },
        selectedScopeChanged: function (newVal, oldVal) {
            this.refreshSelectedScopeItems();
            this.refreshHighlightSelectedScope();
        },
        backgroundChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("background", newVal);
        },
        oversizeChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("oversize", newVal);
        },
        outlineChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("outline", newVal);
        },
        gutterChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("gutter", newVal);
        }
    });
})();