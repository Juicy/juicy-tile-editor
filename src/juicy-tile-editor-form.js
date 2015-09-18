(function () {
    function powerIncrease(obj, property) {
        var power = 1;
        while (power <= obj[property])
            power *= 2;
        obj[property] = power;
    }

    function powerDecrease(obj, property, minimum) {
        var power = 1;
        while (power * 2 < obj[property])
            power *= 2;
        if (power < minimum) {
            power = minimum;
        }
        obj[property] = power;
    }

    Polymer({
        is: "juicy-tile-editor-form",
        properties: {
            isSelection: { type: Boolean, value: false },
            itemId: { type: String, value: null },
            itemName: { type: String, value: null },
            background: { type: String, value: null },
            outline: { type: String, value: null },
            precalculateWidth: { type: Boolean, value: null },
            widthFlexible: { type: Boolean, value: null, notify: true },
            widthDynamic: { type: Boolean, value: null, notify: true },
            precalculateHeight: { type: Boolean, value: null },
            heightFlexible: { type: Boolean, value: null },
            heightDynamic: { type: Boolean, value: null },
            gutter: { type: Number, value: 0, observer: "gutterChanged" },
            tightGroup: { type: Boolean, value: null },
            rightToLeft: { type: Boolean, value: null },
            bottomUp: { type: Boolean, value: null },
            oversize: { type: Number, value: 0 },
            priority: { type: Number, value: null },
            content: { type: String, value: null },
            actualWidth: { type: Number, value: null },
            actualHeight: { type: Number, value: null },
            isSingleSelection: { type: Boolean, value: false },
            isContainer: { type: Boolean, value: false },
            isRoot: { type: Boolean, value: false },
            isGroupable: { type: Boolean, value: false },
            selectedItems: { type: Array, value: [], observer: "selectedItemsChanged" },
            editedTiles: { type: Object, value: null },
            tileLists: { type: Array, value: null },
            modified: { type: Boolean, value: false, notify: true },
            height: { type: String, observer: "heightChanged" },
            width: { type: String, observer: "widthChanged" },
            isRemovable: { type: Boolean, value: true },
            isGroup: { type: Boolean, value: false },
            direction: { type: String, value: null }
        },
        newGroupFromSelection: function (width, isEmpty) {
            if (!this.selectedItems.length > 1) {
                return;
            }

            var current = this.selectedItems[0];
            var setup = {
                priority: current.priority,
                gutter: 0
            };

            var model = this.editedTiles;
            var newContainer = model.createNewContainer(null, current.container, setup, true);
            var dimensions = null;

            if (!isEmpty) {
                // performant heavy // may cause lots of repaints
                for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
                    model.moveToContainer(this.selectedItems[i], newContainer, true);
                }

                dimensions = model.getMinimumDimensions(this.getContainerChildElements(newContainer));
            } else {
                dimensions = {
                    width: "100%",
                    height: "36px"
                };
            }

            this.selectedItems.length = 0; //change edited item to the new container
            //this.selectedItems.push(newContainer);
            this.push("selectedItems", newContainer);

            if (width) {
                newContainer.width = width;
            } else {
                newContainer.width = dimensions.width;
            }

            newContainer.height = dimensions.height;

            this.refresh(true);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        newInlineGroupFromSelection: function () {
            this.newGroupFromSelection();
        },
        newBlockGroupFromSelection: function () {
            this.newGroupFromSelection("100%");
        },
        newBlockEmptyGroup: function () {
            this.newGroupFromSelection("100%", true);
        },
        moveSelectionToEditedItemContainer: function () {
            if (!this.selectedItems.length > 1) {
                return;
            }

            var current = this.selectedItems[0];
            var container = current.items ? current : current.container;
            var model = this.editedTiles;
            for (var i = 1, ilen = this.selectedItems.length; i < ilen; i++) {
                model.moveToContainer(this.selectedItems[i], container, true);
            }

            var dimensions = model.getMinimumDimensions(this.getContainerChildElements(container));
            container.width = dimensions.width;
            container.height = dimensions.height;

            this.refresh(true);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        getContainerChildElements: function (container) {
            //FIXME I may not work (tomalec)
            var model = this.editedTiles;
            var elements = [];
            for (var i = 0, ilen = container.items.length; i < ilen; i++) {
                var id = container.items[i].id;
                
                if (typeof id !== "undefined" && id !== null) {
                    elements.push(model.tiles[container.items[i].id]);
                }
            }
            return elements;
        },
        refreshModified: function () {
            for (var i = 0; i < this.tileLists.length; i++) {
                if (this.tileLists[i].sync && this.tileLists[i].sync.isModified()) {
                    this.set("modified", true);
                    return;
                }
            }

            this.set("modified", false);
        },
        gutterIncrease: function () {
            this.set("gutter", this.gutter + 1);
        },
        gutterDecrease: function () {
            this.set("gutter", this.gutter - 1);
        },
        oversizeIncrease: function () {
            if (this.oversize >= 1) {
                this.set("oversize", this.oversize + 1);
            } else {
                this.set("oversize", 1);
            }
        },
        oversizeDecrease: function () {
            if (this.oversize >= 1) {
                this.set("oversize", this.oversize - 1);
            }
        },
        refresh: function (hard) {
            if (this.editedTiles) {
                this.editedTiles.refresh(hard);
                this.refreshModified();
                this.getSource();
            }
        },
        widthIncrease: function () {
            powerIncrease(this, "width");
        },
        widthDecrease: function () {
            powerDecrease(this, "width");
        },
        widthCalculate: function () {
            if (!this.selectedItems.length || !this.editedTiles) {
                return;
            }

            var tile = this.getSelectedTile();
            var item = this.selectedItems[0];

            this.set("width", 1);
            this.set("precalculateWidth", true);
            item.width = 1;
            item.precalculateWidth = true;
            this.refresh(false);

            setTimeout(function () {
                var rec = tile.getBoundingClientRect();

                item.precalculateWidth = false;
                item.width = parseInt(rec.width);
                this.set("precalculateWidth", false);
                this.set("width", item.width);

                this.calculateActualSize();
            }.bind(this));
        },
        widthChanged: function () {
            this.set("width", this.toNumberOrPercentage.toModel(this.width));

            if (this.precalculateWidth) {
                this.set("precalculateWidth", false);
                this.setCommonValue("precalculateWidth", false, false);
            }
        },
        heightIncrease: function () {
            if (this.height == 'auto') { //turn off auto
                this.height = 32;
                this.set("precalculateHeight", false);
            }
            powerIncrease(this, "height");
        },
        heightDecrease: function () {
            if (this.height == 'auto') { //turn off auto
                this.height = 32;
                this.set("precalculateHeight", false);
            }
            powerDecrease(this, "height");
        },
        heightCalculate: function () {
            if (!this.selectedItems.length || !this.editedTiles) {
                return;
            }

            var tile = this.getSelectedTile();
            var item = this.selectedItems[0];

            this.set("height", 1);
            this.set("precalculateHeight", true);
            item.height = 1;
            item.precalculateHeight = true;
            this.refresh(false);

            setTimeout(function () {
                var rec = tile.getBoundingClientRect();

                item.precalculateHeight = false;
                item.height = parseInt(rec.height);
                this.set("precalculateHeight", false);
                this.height = item.height;

                this.calculateActualSize();
            }.bind(this));
        },
        heightChanged: function () {
            this.set("height", this.toNumberOrPercentage.toModel(this.height));

            if (this.precalculateHeight) {
                this.set("precalculateHeight", false);
                this.setCommonValue("precalculateHeight", false, false);
            }
        },
        priorityIncrease: function () {
            if (!this.selectedItems.length == 1) {
                return;
            }

            this.editedTiles.reprioritizeItem(this.selectedItems[0], true);
            this.set("priority", this.selectedItems[0].priority);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        priorityDecrease: function () {
            if (!this.selectedItems.length == 1) {
                return;
            }

            this.editedTiles.reprioritizeItem(this.selectedItems[0], false);
            this.set("priority", this.selectedItems[0].priority);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        deleteContainer: function () {
            var deleteElement = this.selectedItems[0];
            this.selectedItems[0] = deleteElement.container;
            this.editedTiles.deleteContainer(deleteElement, true);
            this.refresh(true);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        changeDirection: function (event, i) {
            this.selectedItems[0].direction = element.value;
            this.direction = event.currentTarget.value;
            this.refresh();
        },
        changeRightToLeft: function (event, i) {
            var value = !!(event.currentTarget.value / 1);
            this.selectedItems[0].rightToLeft = value;
            this.set("rightToLeft", value);
            this.refresh();
        },
        changeBottomUp: function (event, i) {
            var value = !!(event.currentTarget.value / 1);
            this.selectedItems[0].bottomUp = value;
            this.set("bottomUp", value);
            this.refresh();
        },
        gutterChanged: function () {
            this.set("gutter", this.toNumber.toModel(this.gutter));
        },
        isContainerInSelection: function () {
            for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
                if (this.selectedItems[i].items) {
                    return true;
                }
            }
            return false;
        },
        isRootInSelection: function () {
            for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
                if (!this.selectedItems[i].container) {
                    return true;
                }
            }
            return false;
        },
        isGroupableInSelection: function () {
            for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
                if (!this.selectedItems[i].container || !this.selectedItems[i].container.items) {
                    return false;
                }
            }
            return true;
        },
        getCommonValue: function (propName) {
            if (this.selectedItems.length) {
                var val = this.selectedItems[0][propName];
                for (var i = 1, ilen = this.selectedItems.length; i < ilen; i++) {
                    if (this.selectedItems[i][propName] !== val) {
                        return ""; //shows "multiple" in placeholder
                    }
                }
                return val;
            }
        },
        setCommonValue: function (propName, val, hard) {
            if (this.selectedItems && this.selectedItems.length) {
                for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
                    this.selectedItems[i][propName] = val;
                }
                this.refresh(hard);
            }
        },
        setValueFromButton: function (ev) {
            var node = ev.target;
            while (node) {
                if (node.dataset && node.dataset.applyvalue) {
                    this[node.dataset.applyvalue] = ev.target.value;
                    break;
                }
                node = node.parentNode;
            }
        },
        toNumber: {
            toModel: function (arg) {
                return parseInt(arg, 10) || 0;
            },
            toDOM: function (arg) {
                return arg;
            }
        },
        toNumberOrPercentage: {
            toModel: function (arg) {
                if (typeof arg === "number") {
                    return arg;
                } else if (!arg) {
                    return "";
                }

                return arg.indexOf("%") > -1 ? arg : parseInt(arg, 10) || 0;
            },
            toDOM: function (arg) {
                return arg;
            }
        },
        applyChange: function (ev) {
            var node = ev.target;

            setTimeout(function () {
                while (node) {
                    if (node.dataset && node.dataset.applyvalue) {
                        this.setCommonValue(node.dataset.applyvalue, this[node.dataset.applyvalue], !!node.dataset.hardrefresh);
                        break;
                    }
                    node = node.parentNode;
                }
            }.bind(this));
        },
        saveChanges: function () {
            for (var i = 0; i < this.tileLists.length; i++) {
                var list = this.tileLists[i];

                if (list.sync && list.sync.isModified()) {
                    list.sync.save();
                }
            }

            this.modified = false;
            this.fire('juicy-tile-editor-save');
        },
        /**
         * Reverts setup and refresh tiles
         */
        revertChanges: function () {
            for (var i = 0; i < this.tileLists.length; i++) {
                var list = this.tileLists[i];

                list.sync.revert();
            }

            this.modified = false;
            this.fire('juicy-tile-editor-revert');
            this.getSource();
        },
        clearConfig: function () {
            this.editedTiles.sync.clear();
            this.refreshModified();
            this.getSource();
            this.fire('juicy-tile-editor-clear');
        },
        getSource: function () {
            this.source = this.editedTiles ? JSON.stringify(this.editedTiles.setup) : '';
        },
        /**
         * Force tiles to apply given JSON string as setup
         */
        applySource: function () {
            if (this.editedTiles) {
                this.editedTiles.setup = JSON.parse(this.source);
                this.refreshModified();
                this.fire('juicy-tile-editor-revert');
            }
        },
        resetStyles: function () {
            var groups = [];

            for (var i = 0; i < this.selectedItems.length; i++) {
                this.resetItemStyles(this.selectedItems[i], true, groups);
            }

            for (var i = 0; i < groups.length; i++) {
                this.editedTiles.deleteContainer(groups[i], true);
            }

            this.selectedItemsChanged();
            this.refresh(true);
            this.fire('juicy-tile-editor-form-tree-changed');
        },
        resetItemStyles: function (item, isSelected, groups) {
            if (item.items) {
                for (var i = 0; i < item.items.length; i++) {
                    this.resetItemStyles(item.items[i], false, groups);
                }

                if (!isSelected) {
                    groups.push(item);
                }
            }

            for (var i in this.editedTiles.defaultTileSetup) {
                item[i] = this.editedTiles.defaultTileSetup[i];
            }

            var skip = ["id", "items", "container", "direction"];

            for (var i in item) {
                if (skip.indexOf(i) >= 0) {
                    continue;
                }

                if (i == "gutter") {
                    item[i] = 0;
                    continue;
                }

                if (typeof this.editedTiles.defaultTileSetup[i] == "undefined") {
                    delete item[i];
                }
            }
        },
        selectedItemsChanged: function () {
            this.set("itemId", this.getCommonValue("id"));
            this.set("itemName", this.getCommonValue("itemName"));
            this.set("background", this.getCommonValue("background"));
            this.set("outline", this.getCommonValue("outline"));
            this.set("width", this.getCommonValue("width"));
            this.set("precalculateWidth", this.getCommonValue("precalculateWidth") || false);
            this.set("widthFlexible", this.getCommonValue("widthFlexible") || false);
            this.set("widthDynamic", this.getCommonValue("widthDynamic") || false);
            this.set("height", this.getCommonValue("height"));
            this.set("precalculateHeight", this.getCommonValue("precalculateHeight") || false);
            this.set("heightFlexible", this.getCommonValue("heightFlexible") || false);
            this.set("heightDynamic", this.getCommonValue("heightDynamic") || false);
            this.set("gutter", this.getCommonValue("gutter"));
            this.set("tightGroup", this.getCommonValue("tightGroup") || false);
            this.set("rightToLeft", this.getCommonValue("rightToLeft") || false);
            this.set("bottomUp", this.getCommonValue("bottomUp") || false);
            this.set("oversize", this.getCommonValue("oversize"));
            this.set("priority", this.getCommonValue("priority"));
            this.set("direction", this.getCommonValue("direction"));
            this.set("content", this.getCommonValue("content") || ""); //set content to empty string if undefined is returned
            this.set("isSelection", (this.selectedItems.length > 0));
            this.set("isSingleSelection", (this.selectedItems.length == 1));
            this.set("isContainer", this.isContainerInSelection());
            this.set("isRoot", this.isRootInSelection());
            this.set("isGroupable", this.isGroupableInSelection());
            this.set("isGroup", (this.isContainer && !this.isRoot));
            this.set("isRemovable", (this.isContainer && !this.isRoot) && this.isGroupable);
            //this.getSource();
            // ??? (tomalec): why do we need this?
            this.refresh();

            Array.prototype.forEach.call(Polymer.dom(this).querySelectorAll('input[placeholder]'), function (input) {
                if (this.isSelection && !this.isSingleSelection) {
                    input.setAttribute('placeholder', 'multiple'); //display "multiple" text when getCommonValue returns empty string
                } else {
                    input.setAttribute('placeholder', '');
                }
            }.bind(this));

            this.calculateActualSize();
        },
        popoverExpand: function (ev, index, target) {
            var index = this.style.zIndex || 0;
            this.style.zIndex = parseInt(index) + 1;
        },
        popoverCollapse: function (ev, index, target) {
            var index = this.style.zIndex || 0;
            this.style.zIndex = parseInt(index) - 1;
        },
        closeClick: function (ev, index, target) {
            this.fire("juicy-tile-editor-form-close");
        },
        calculateActualSize: function () {
            var tile = null;

            if (this.selectedItems.length && this.editedTiles) {
                tile = this.getSelectedTile();
            }

            if (tile) {
                var rec = tile.getBoundingClientRect();
                this.actualWidth = parseInt(rec.width) + "px";
                this.actualHeight = parseInt(rec.height) + "px";
            } else {
                this.actualWidth = "N/A";
                this.actualHeight = "N/A";
            }
        },
        getIsHorizontalDirection: function (direction) {
            return !direction || direction == "horizontal";
        },
        getIsVerticalDirection: function (direction) {
            return direction === "vertical";
        },
        getNotOrNot: function (value1, value2) {
            return !value1 || !value2;
        },
        getBackgroundStyle: function (background) {
            return "background: " + background + ";";
        },
        getOutlineStyle: function (outline) {
            return "margin-top: -10px; width: 100%; display: inline-block; border-bottom: " + outline + ";";
        },
        getIsJuicyTileList: function (tagName) {
            return tagName == "JUICY-TILE-LIST";
        },
        getTileId: function (tile) {
            var id = tile.id;

            if (typeof id === "undefined" || id === null) {
                if (tile.node) {
                    id = tile.node.setup.id;
                } else {
                    id = tile.itemName;
                }
            }

            return id;
        },
        getSelectedTile: function () {
            var id = this.getTileId(this.selectedItems[0]);
            var tile = this.editedTiles.tiles[id];
            
            return tile;
        }
    });
})();
