(function () {
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
        } else if (element.classList.contains("juicy-tile") && element.parentNode && element.parentNode.tagName == "TD") {
            id = element.parentNode.id;
        }

        return id;
    }

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
        return list.tiles[setup.id];
    }

    function getNestedList(list, tileId, selectors) {
        var selector = selectors.map(function (s) {
            return "[juicytile='" + tileId + "'] " + s;
        }).join(", ");

        return list.querySelector(selector);
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
        var value = getFullSetupName(list, setup);
        var maxLen = 15;

        if (value && value.length > maxLen) {
            var index = value.indexOf(" ", maxLen);

            if (index > 0) {
                value = value.substring(0, index);
            }
        }

        return value;
    }

    function getFullSetupName(list, setup) {
        if (setup.itemName) {
            return setup.itemName;
        }

        if (setup.items) {
            if (!setup.items.length) {
                return "Empty group";
            }

            var names = [];

            for (var i = 0; i < setup.items.length; i++) {
                names.push(getFullSetupName(list, setup.items[i]));
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

    function createSetupGroup(list, selectedSetup) {
        var container = selectedSetup ? selectedSetup.container : list.setup;
        var priority = selectedSetup ? selectedSetup.priority : 1;
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
            mediaScreen: { type: Object, notify: true },
            mediaScreenRanges: {
                type: Array,
                value: [{ name: "Mobile", width: 320, css: "iphone" }, { name: "Tablet", width: 480, css: "ipad" },
                    { name: "Laptop", width: 960, css: "laptop" }, { name: "Desktop", width: 1200, css: "screen" }]
            },
            widthItem: { type: Object, value: null, notify: true },
            widthRanges: {
                type: Array,
                value: [{ name: "1", value: "8.33%" }, { name: "2", value: "16.66%" }, { name: "3", value: "25%" }, { name: "4", value: "33.33%" }, { name: "5", value: "41.66%" },
                        { name: "6", value: "50%" }, { name: "7", value: "58.33%" }, { name: "8", value: "66.66%" }, { name: "9", value: "75%" }, { name: "10", value: "83.33%" },
                        { name: "11", value: "91.66%" }, { name: "12", value: "100%" }]
            },
            visible: { type: Boolean, value: null, notify: true },
            listSelectors: { type: Array, value: ["juicy-tile-list", "juicy-tile-grid", "juicy-tile-table"] },
            defaultSelectedListSelectors: { type: Array, value: ["juicy-tile-list", "juicy-tile-grid", "juicy-tile-table"] },
            lists: { type: Array, value: [] },
            selectedTiles: { type: Array, value: [] },
            selectedList: { type: Object, value: null, observer: "selectedListChanged" },
            selectedScope: { type: Object, value: null, observer: "selectedScopeChanged" },
            selectedScopeItems: { type: Array, value: [] },
            breadcrumb: { type: Array, value: [] },
            hasChanges: { type: Boolean, value: false, notify: true },
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

                if (!tile) {
                    return;
                }

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
            this.isAttached = true;
            this.isReadingSetup = false;

            setTimeout(function () {
                this.resetSelection();
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
        attachEventListeners: function () {
            this.detachEventListeners();

            if (!this.selectedList) {
                return;
            }

            var list = this.selectedList;
            var shadow = list.shadowContainer;

            list.addEventListener("mousemove", this.onListMouseover, true);
            shadow.addEventListener("mousemove", this.onListMouseover, true);

            list.addEventListener("click", this.onListClick, true);
            shadow.addEventListener("click", this.onListClick, true);

            list.addEventListener("dblclick", this.onListDoubleClick, true);
            shadow.addEventListener("dblclick", this.onListDoubleClick, true);
        },
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
        },
        getMediaButtonCss: function (selected, item) {
            var css = ["btn"];

            if (selected == item) {
                css.push("active");
            }

            if (item.css) {
                css.push(item.css);
            }

            return css.join(" ");
        },
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
        getTabButtonCss: function (name) {
            var v = (name == "expert");

            v = (!!this.showMore === v) ? "btn-tab active" : "btn-tab";

            return v;
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
        getIsChecked: function (a, b) {
            return a == b;
        },
        getIsScopable: function (item) {
            if (item.items && item.items.length) {
                return true;
            }

            return !!getNestedList(this.selectedList, item.id, this.listSelectors);
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
        getCrumbName: function (item) {
            if (item.scope) {
                var id = getTileId(item.scope);
                var setup = getSetupItem(item.list.setup, id);

                return getSetupName(item.list, setup);
            } else {
                return this.getSetupName(item.list.setup);
            }
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
        getWidthString: function (list, width, widthFlexible, widthDynamic) {
            if (!width) {
                return "Width:"
            }

            var s = [width];

            if (width.indexOf("%") > 0) {
                if (widthFlexible) {
                    s.push(" of parent");
                } else {
                    s.push(" of ", list.setup.width, "px");
                }
            }

            if (widthDynamic) {
                s.push(" or more");
            }

            return s.join("");
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
            this.refreshSelectedList();
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
        readVisible: function () {
            var hidden = this.getCommonSetupValue("hidden");

            if (hidden === null) {
                this.set("visible", null);
            } else {
                this.set("visible", !hidden);
            }
        },
        readPrimitiveSetupValues: function () {
            var names = ["background", "oversize", "outline", "gutter", "direction", "content", "width", "height", "widthFlexible", "widthDynamic",
                "heightFlexible", "heightDynamic", "tightGroup", "rightToLeft", "bottomUp"];

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
        valuePlus: function (name) {
            var value = 1;

            if (this[name]) {
                value = this[name] / 1 + 1;
            }

            this.set(name, value);
        },
        valueMinus: function (name) {
            var value = this[name] / 1 - 1;

            if (!value || value < 0) {
                value = 0;
            }

            this.set(name, value);
        },
        refreshAndSelectTile: function (steupId) {
            this.set("selectedTiles", []);
            this.refreshSelectedList();

            var tile = this.selectedList.tiles[steupId];

            this.set("selectedTiles", [tile]);
            this.refreshSelectedScopeItems();
        },
        getFirstSelectedSetup: function () {
            if (!this.selectedTiles.length) {
                return null;
            }

            var tile = this.selectedTiles[0];
            var id = getTileId(tile);
            var setup = getSetupItem(this.selectedList.setup, id);

            return setup;
        },
        selectMediaScreen: function (e) {
            if (!this.selectedList) {
                return;
            }

            this.touch();
            this.set("mediaScreen", e.currentTarget.item);
            this.selectedList.setup.width = this.mediaScreen.width;
        },
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
        packGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            this.selectedTiles.forEach(function (t) {
                var id = getTileId(t);
                var s = getSetupItem(this.selectedList.setup, id);

                this.selectedList.moveToContainer(s, group, true);
            }.bind(this));

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        packEmptyGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            this.refreshAndSelectTile(group.id);
            this.touch();
        },
        packSeparatorGroup: function (e) {
            var setup = this.getFirstSelectedSetup();
            var group = createSetupGroup(this.selectedList, setup);

            group.heightDynamic = false;
            group.background = "#000000";
            group.itemName = "Separator";

            this.refreshAndSelectTile(group.id);
            this.touch();
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

            this.refreshSelectedList();
            this.refreshSelectedScopeItems();
            this.touch();
        },
        selectTreeItem: function (e) {
            var setup = e.currentTarget.item;
            var tile = this.selectedList.tiles[setup.id];

            this.toggleSelectedTile(e.ctrlKey, tile);
        },
        showTreeItem: function (e) {
            var setup = e.currentTarget.item;
            var index = this.selectedScopeItems.indexOf(setup);

            setup.hidden = false;

            this.refreshSelectedList();
            this.notifyPath("selectedScopeItems." + index + ".hidden", false);
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
        toggleTree: function (e) {
            this.set("showTree", !this.showTree);
        },
        closeEditor: function (e) {
            this.fire("close-click");
        },
        oversizePlus: function (e) {
            this.valuePlus("oversize");
        },
        oversizeMinus: function (e) {
            this.valueMinus("oversize");
        },
        gutterPlus: function (e) {
            this.valuePlus("gutter");
        },
        gutterMinus: function (e) {
            this.valueMinus("gutter");
        },
        widthPlus: function (e) {
            this.dimensionPlus("width");
        },
        widthMinus: function (e) {
            this.dimensionMinus("width");
        },
        heightPlus: function (e) {
            this.dimensionPlus("height");
        },
        heightMinus: function (e) {
            this.dimensionMinus("height");
        },
        selectDirection: function (e) {
            var target = e.currentTarget;
            var value = target.value;

            this.set("direction", value);
            this.setCommonSetupValue("direction", value);
        },
        selectBooleanValue: function (name, e) {
            var target = e.currentTarget;
            var value = target.value / 1;

            value = value === 1;

            this.set(name, value);
            this.setCommonSetupValue(name, value);
        },
        selectRightToLeft: function (e) {
            this.selectBooleanValue("rightToLeft", e);
        },
        selectBottomUp: function (e) {
            this.selectBooleanValue("bottomUp", e);
        },
        readSource: function (e) {
            var setup = JSON.stringify(this.selectedList.setup);

            this.set("source", setup);
        },
        writeSource: function (e) {
            var setup = JSON.parse(this.source);

            this.selectedList.setup = setup;
            this.refreshSelectedList();
            this.set("selectedScope", null);
            this.refreshSelectedScopeItems();
        },
        initShowTree: function (e) {
            this.set("showTree", true);
        },
        resetSelection: function () {
            var list = document.querySelector(this.defaultSelectedListSelectors.join(", "));

            if (this.lists.indexOf(list) < 0) {
                console.error("Invalid defaultSelectedListSelectors value. The list does not match the listSelectors.",
                    this.defaultSelectedListSelectors, this.listSelectors, list);
            }

            this.set("selectedList", null);
            this.set("selectedScope", null);
            this.set("breadcrumb", []);
            this.set("selectedList", list);
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
                var list = getNestedList(this.selectedList, setup.id, this.listSelectors);

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
            if (!tile && this.breadcrumb.length) {
                this.scopeOut();
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
        refreshSelectedList: function () {
            this.selectedList.refresh(true);
            this.refreshSelectedTiles();
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
        refreshSelectedTiles: function () {
            var tiles = [];

            this.selectedTiles.forEach(function (t) {
                var id = getTileId(t);
                var tile = this.selectedList.tiles[id];

                tiles.push(tile);
            }.bind(this));

            this.set("selectedTiles", tiles);

            if (this.selectedScope) {
                var id = getTileId(this.selectedScope);
                var tile = this.selectedList.tiles[id];

                this.set("selectedScope", tile);
            }
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
                list.setup = list.defaultsetup ? JSON.parse(JSON.stringify(list.defaultsetup)) : null;
            });

            // Workaround to refresh parent list when child list changes it's dimensions.
            this.lists.forEach(function (list) {
                list.refresh(true);
            });

            this.touch();
            this.resetSelection();
        },
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

            this.set("hasChanges", false);
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
        },
        contentChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("content", newVal);
        },
        widthChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("width", newVal);
        },
        heightChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("height", newVal);
        },
        widthFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthFlexible", newVal);
        },
        widthDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("widthDynamic", newVal);
        },
        heightFlexibleChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightFlexible", newVal);
        },
        heightDynamicChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("heightDynamic", newVal);
        },
        tightGroupChanged: function (newVal, oldVal) {
            this.setCommonSetupValue("tightGroup", newVal);
        }
    });
})();