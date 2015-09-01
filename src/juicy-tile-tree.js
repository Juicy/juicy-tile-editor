(function () {
    Polymer({
        is: "juicy-tile-tree",
        properties: {
            expanded: { type: Object, value: {} },
            tree: { type: Array, value: [] },
            editItem: { type: Object, value: null },
            editBranch: { type: Object, value: null },
            highlightedBranches: { type: Array, value: [] },
            that: { type: Object }
        },
        ready: function () {
            this.set("that", this);
        },
        /**
         * Converts branch object to a display name string. Can be overloaded
         * @param {Object} branch {node: {branchnode} [, item: branchnode.node.setup.items[n]]}
         * @returns {String}
         */
        toRootName: function (node, short) {
            var name = node.id || node.getAttribute("name");

            if (short && /[/]/gi.test(name)) {
                name = name.split("/");
                name = name[name.length - 1];
            }

            return name;
        },
        tapAction: function (ev, index) {
            var eventName;
            var branch = ev.currentTarget.branch;
            var item = ev.currentTarget.item;
            var isNestedTiles = this.isNestedTilesLabel(ev.currentTarget);
            if (ev.ctrlKey || ev.metaKey || ev.shiftKey) {
                if (this.isBranchHighlighted(item)) {
                    eventName = 'juicy-tile-tree-highlight-remove';
                    this.unhighlightBranch(item);
                }
                else {
                    eventName = 'juicy-tile-tree-highlight-extend';
                    this.highlightBranch(item, true);
                }
            }
            else {
                eventName = 'juicy-tile-tree-highlight';
                if (isNestedTiles) {
                    this.highlightBranch(branch.node.setup);
                }
                else {
                    this.highlightBranch(item);
                }
            }
            if (isNestedTiles) {
                this.fire(eventName, { branch: branch.node.setup, tiles: branch.node });
            }
            else {
                this.fire(eventName, { branch: item, tiles: branch.node });
            }
        },
        nameDblclickAction: function (property, ev, index) {
            var target = ev.currentTarget;

            if (target.classList.contains("active")) {
                return;
            }

            var branch = ev.currentTarget.branch;
            var item = ev.currentTarget.item;

            if (property == "item") {
                this.editItem = model.item;
                this.editBranch = null;
            } else {
                this.editItem = null;
                this.editBranch = model.branch;
            }

            target.focus();
            target.selectionStart = 0;
            target.selectionEnd = target.value.length;
        },
        itemNameDblclickAction: function (ev, index) {
            this.nameDblclickAction("item", ev, index);
        },
        branchNameDblclickAction: function (ev, index) {
            this.nameDblclickAction("branch", ev, index);
        },
        nameBlurAction: function (ev, index) {
            this.editItem = null;
            this.editBranch = null;
            this.fire("juicy-tile-tree-item-name-changed");
        },
        nameKeypressAction: function (ev, index) {
            if (ev.which == 13) {
                ev.currentTarget.blur();
            }
        },
        hoverBlurAction: function (eventName, ev, index) {
            var branch = ev.currentTarget.branch;
            var item = ev.currentTarget.item;
            var isNestedTiles = this.isNestedTilesLabel(ev.currentTarget);

            if (isNestedTiles) {
                this.fire(eventName, { branch: branch.node.setup, tiles: branch.node });
            } else {
                this.fire(eventName, { branch: item, tiles: branch.node });
            }
        },
        hoverAction: function (ev, index) {
            this.hoverBlurAction("juicy-tile-tree-hover", ev, index);
        },
        blurAction: function (ev, index) {
            this.hoverBlurAction("juicy-tile-tree-blur", ev, index);
        },
        isNestedTilesLabel: function (elem) {
            var branch = elem.branch;
            var item = elem.item;

            //if (branch && branch.node && branch.node.setup) {
            if (branch.items) {
                return true;
            } else {
                return false;
            }

            /*var model = elem.templateInstance.model;
            var proto = Object.getPrototypeOf(model);

            if (model.item === proto.item) { //a nested tiles (item is inherited from prototype)
                return true;
            }
            return false; //a branch of a leaf (branch is inherited from prototype)*/
        },
        highlightElement: function (elem) {
            var top = 0;

            elem.classList.add("highlight");

            while (elem != null && elem != this.$.root) {
                if (elem.tagName == "LI") {
                    top += (elem.offsetTop || 0);
                }

                elem = elem.parentNode;
            }

            if (top > (this.scrollTop + this.clientHeight) || top < this.scrollTop) {
                this.scrollTop = top;
            }
        },
        highlightBranch: function (branch, expand) {
            var that = this;
            if (!expand) {
                //this.highlightedBranches.length = 0;
                this.splice("highlightedBranches", this.highlightedBranches.length);
            }
            //this.highlightedBranches.push(branch);
            this.push("highlightedBranches", branch);

            setTimeout(function () {
                //I need to refresh element classes imperatively because Polymer only observes on filter parameter changes [warpech]
                Array.prototype.forEach.call(that.$.root.querySelectorAll('.element-label'), function (elem) {
                    var isNestedTiles = this.isNestedTilesLabel(elem);

                    if (isNestedTiles && elem.branch.node.setup == branch) {
                        that.highlightElement(elem);
                    } else if (!isNestedTiles && elem.item == branch) {
                        that.highlightElement(elem);
                    } else if (!expand) {
                        elem.classList.remove("highlight");
                    }
                }.bind(that));
            });
        },
        openBranch: function (branch) {
            var that = this;
            var element = null;

            Array.prototype.forEach.call(that.$.root.querySelectorAll('.element-label'), function (elem) {
                var isNestedTiles = this.isNestedTilesLabel(elem);
                var branch = elem.branch;
                var item = elem.item;

                if (isNestedTiles && branch.node.setup == branch) {
                    element = elem;
                } else if (!isNestedTiles && item == branch) {
                    element = elem;
                }
            }.bind(that));

            while (element) {
                if (element.tagName == "LI") {
                    var btn = element.querySelector(".expand");

                    if (btn) {
                        btn.setAttribute("checked", "checked");
                    }
                }

                element = element.parentNode;
            }
        },
        unhighlightBranch: function (branch) {
            //this.highlightedBranches.splice(this.highlightedBranches.indexOf(branch), 1);
            this.splice("highlightedBranches", this.highlightedBranches.indexOf(branch), 1);

            //I need to refresh element classes imperatively because Polymer only observes on filter parameter changes [warpech]
            Array.prototype.forEach.call(this.$.root.querySelectorAll('.element-label.highlight'), function (elem) {
                if (elem.item === branch) {
                    elem.classList.remove("highlight");
                }
            });
        },
        isBranchHighlighted: function (branch) {
            return this.highlightedBranches.indexOf(branch) > -1;
        },
        getBranchClassName: function (branch) {
            var css = ["element-label"];

            if (this.isBranchHighlighted(branch)) {
                css.push("highlight");
            }

            return css.join(" ");
        },
        /*preventTextSelection: function(ev) {
          ev.preventDefault();
        },*/
        refreshTileList: function (ev) {
            // this.fire('juicy-tile-tree-refresh-tile-list', ev.target.value);
            this.fire('juicy-tile-tree-refresh-tile-list');
        },
        itemDragStop: function (e, index) {
            if (!e.detail.dropElement) {
                return;
            }

            var branch = null;
            var item = e.currentTarget.item;

            if (this.isNestedTilesLabel(e.detail.dropElement)) {
                branch = e.detail.dropElement.branch.node.setup;
            } else {
                branch = e.detail.dropElement.item;
            }

            if (item == branch) {
                return;
            }

            this.tapAction(e, index);
            this.fire("juicy-tile-tree-drag-item-stop", { item: item, branch: branch });
        },
        getFullId: function (item) {
            var r = [];

            while (item) {
                r.push(item.id);
                item = item.container;
            }

            return r.join("-");
        }
    });
})();