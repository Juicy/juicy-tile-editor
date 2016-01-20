(function () {
    function isTileList(element, selectors) {
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

    function getJuicyList(event, selectors) {
        var list = null;

        for (var i = 1; i < event.path.length; i++) {
            var el = event.path[i];

            if (isTileList(el, selectors)) {
                list = el;
                break;
            }
        }

        if (!list) {
            return null;
        }

        return list.host || list;
    };

    function getJuicyTile(event, listSelectors) {
        var list = getJuicyList(event, listSelectors);

        if (list == null) {
            return null;
        }

        var target = null;

        for (var i = 0; i < event.path.length; i++) {
            target = event.path[i];

            if (target && target.classList && target.hasAttribute &&
                (target.classList.contains("juicy-tile") || target.classList.contains("containerBackground") || target.hasAttribute("juicytile"))) {
                break;
            } else if (isTileList(target, listSelectors)) {
                // Reached the top level of tile list. The selected tile is outside of current tile list.
                return null;
            }
        }

        if (!target.parentNode) {
            return null;
        }

        var id = target.id;

        if (target.hasAttribute("juicytile")) {
            id = target.getAttribute("juicytile");
        }

        // Selecting the top group if a tile packed inside.
        var setup = getSetupItem(list.setup, id);

        while (setup.container.container) {
            setup = setup.container;
        }

        // Get Shadow DOM element for this tile.id.
        return list.tiles[setup.id];
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
            selectedListItems: { type: Array, value: [] },
            message: { type: String, value: null },
            hasChanges: { type: Boolean, value: false }
        },
        observers: ["selectedTilesChanged(selectedTiles.length)"],
        attached: function () {
            this.set("mediaScreen", this.mediaScreenRanges[this.mediaScreenRanges.length - 1]);

            var lists = Array.prototype.slice.call(document.querySelectorAll(this.listSelectors.join(", ")));

            this.set("lists", lists);
            this.attachEventListeners();
            this.resetSelection();
        },
        detached: function () {
            this.detachEventListeners();
        },
        attachEventListeners: function () {
            this.onListMouseover = function (e) {
                var tile = getJuicyTile(e, this.listSelectors);

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

                var list = getJuicyList(e, this.listSelectors);
                var tile = getJuicyTile(e, this.listSelectors);

                this.toggleSelectedTile(e, list, tile);
            }.bind(this);

            this.lists.forEach(function (list) {
                var shadow = list.shadowContainer;

                list.addEventListener("mousemove", this.onListMouseover);
                shadow.addEventListener("mousemove", this.onListMouseover);

                list.addEventListener("click", this.onListClick, true);
                shadow.addEventListener("click", this.onListClick, true);
            }.bind(this));
        },
        detachEventListeners: function () {
            this.lists.forEach(function (list) {
                var shadow = list.shadowContainer;

                list.removeEventListener("mousemove", this.onListMouseover);
                shadow.removeEventListener("mousemove", this.onListMouseover);

                list.removeEventListener("click", this.onListClick, true);
                shadow.removeEventListener("click", this.onListClick, true);
            }.bind(this));

            this.onListMouseover = null;
            this.onListMouseover = null;
        },
        showMessage: function (text) {
            this.set("message", text);

            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(function () {
                this.set("message", "");
            }.bind(this), 3000);
        },
        getSelectedTilesCaption: function (length) {
            return length > 1 ? "tiles" : "tile";
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
        getCommonSetupValue: function (name) {
            var value = null;

            for (var i = 0; i < this.selectedTiles.length; i++) {
                var tile = this.selectedTiles[i];
                var id = tile.id;
                var setup = getSetupItem(this.selectedList.setup, id);
                var v = setup[name];

                if (i > 0 && value !== v) {
                    return null;
                }

                value = v;
            }

            if (value === undefined) {
                value = null;
            }

            return value;
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
        readSelectedSetup: function () {
            if (!this.selectedTiles.length) {
                return;
            }

            this.readWidth();
            this.readVisible();
        },
        touch: function () {
            this.set("hasChanges", true);
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
            this.refreshSelectedListItems();
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
            this.refreshSelectedListItems();
        },
        selectTreeItem: function (e) {
            var setup = e.currentTarget.item;
            var tile = this.selectedList.tiles[setup.id];

            this.toggleSelectedTile(e, this.selectedList, tile);
        },
        resetSelection: function () {
            this.set("selectedList", this.lists[0]);

            if (this.selectedTiles.length) {
                this.set("selectedTiles", []);
            }
        },
        toggleSelectedTile: function (e, list, tile) {
            if (!tile) {
                this.resetSelection();
                return;
            }

            if (!e.ctrlKey) {
                this.set("selectedList", list);
                this.set("selectedTiles", [tile]);
                return;
            }

            if (this.selectedTiles.length && this.selectedList != list) {
                this.showMessage("You cannnot select tiles from different tile containers!");
                return;
            }

            var index = this.selectedTiles.indexOf(tile);

            this.set("selectedList", list);

            if (index >= 0) {
                this.splice("selectedTiles", index, 1);
            } else {
                this.push("selectedTiles", tile);
            }
        },
        refreshSelectedListItems: function () {
            var items = this.selectedList.setup.items.slice();;

            items.sort(sortByPriorityDesc);

            this.set("selectedListItems", items);
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
            this.refreshSelectedListItems();
        },
        selectedTilesChanged: function () {
            this.$.highlightTileSelected.hide();
            this.readSelectedSetup();

            if (!this.selectedTiles.length) {
                this.set("width", null);
                this.resetSelection();
                return;
            }

            this.$.highlightTileSelected.show(this.selectedTiles);
        },
        selectedListChanged: function (newVal, oldVal) {
            this.readSelectedMediaScreen(newVal, oldVal);

            if (!newVal) {
                this.resetSelection();
            } else {
                this.refreshSelectedListItems();
            }

            this.$.highlightListSelected.show(this.selectedList);
        }
    });
})();