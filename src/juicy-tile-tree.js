(function () {
  Polymer('juicy-tile-tree', {
    tree: [],
    highlightedBranches: [],
    /**
     * Converts branch object to a display name string. Can be overloaded
     * @param {Object} branch {node: {branchnode} [, item: branchnode.node.setup.items[n]]}
     * @returns {String}
     */
    toRootName: function(node) {
      return node.id || node.getAttribute("name");
    },
    toDisplayName: function(item, branch) {
      var txt = "";
      //TODO: use some kind of this.elements (which will not contain groups)
      var elem = branch.node.querySelector('[juicytile="'+item.id+'"]');
      if(!elem){
        return item.id;
      }
      var header = elem.querySelector("h1, h2, h3, h4, h5, h6");
      if(header) {
        txt = header.textContent;
      }
      else {
        txt = elem.textContent;
      }
      txt = txt.trim().replace(/\s+/gi, " ");
      if(!txt) {
        txt = "<" + elem.nodeName.toLowerCase() + ">";
      }
      if(txt.length > 23) {
        txt = txt.substr(0, 20) + " \u2026"; //'HORIZONTAL ELLIPSIS' (U+2026)
      }
      return txt;
    },
    tapAction: function (ev, index, target) {
      var eventName;
      var model = target.templateInstance.model;
      var isNestedTiles = this.isNestedTilesLabel(target);
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey) {
        if (this.isBranchHighlighted(model.item)) {
          eventName = 'juicy-tile-tree-highlight-remove';
          this.unhighlightBranch(model.item);
        }
        else {
          eventName = 'juicy-tile-tree-highlight-extend';
          this.highlightBranch(model.item, true);
        }
      }
      else {
        eventName = 'juicy-tile-tree-highlight';
        if (isNestedTiles) {
          this.highlightBranch(model.branch.node.setup);
        }
        else {
          this.highlightBranch(model.item);
        }
      }
      if (isNestedTiles) {
        this.fire(eventName, {branch: model.branch.node.setup, tiles: model.branch.node});
      }
      else {
        this.fire(eventName, {branch: model.item, tiles: model.branch.node});
      }
    },
    hoverBlurAction: function (eventName, ev, index, target) {
        var model = target.templateInstance.model;
        var isNestedTiles = this.isNestedTilesLabel(target);

        if (isNestedTiles) {
            this.fire(eventName, { branch: model.branch.node.setup, tiles: model.branch.node });
        } else {
            this.fire(eventName, { branch: model.item, tiles: model.branch.node });
        }
    },
    hoverAction: function (ev, index, target) {
        this.hoverBlurAction("juicy-tile-tree-hover", ev, index, target);
    },
    blurAction: function (ev, index, target) {
        this.hoverBlurAction("juicy-tile-tree-blur", ev, index, target);
    },
    isNestedTilesLabel: function(elem) {
      var model = elem.templateInstance.model;
      var proto = Object.getPrototypeOf(model);

      if (model.item === proto.item) { //a nested tiles (item is inherited from prototype)
        return true;
      }
      return false; //a branch of a leaf (branch is inherited from prototype)
    },
    highlightElement: function (span) {
        var top = span.offsetTop;

        if (top > (this.scrollTop + this.clientHeight) || top < this.scrollTop) {
            this.scrollTop = top;
        }

        span.classList.add("highlight");
    },
    highlightBranch: function (branch, expand) {
      var that = this;
      if (!expand) {
        this.highlightedBranches.length = 0;
      }
      this.highlightedBranches.push(branch);

      setTimeout(function () {
          //I need to refresh span classes imperatively because Polymer only observes on filter parameter changes [warpech]
          Array.prototype.forEach.call(that.$.root.querySelectorAll('span'), function (span) {
              var isNestedTiles = this.isNestedTilesLabel(span);
              if (isNestedTiles && span.templateInstance.model.branch.node.setup == branch) {
                  that.highlightElement(span);
              }
              else if (!isNestedTiles && span.templateInstance.model.item == branch) {
                  that.highlightElement(span);
              }
              else if (!expand) {
                  span.classList.remove("highlight");
              }
          }.bind(that));
      });
    },
    openBranch: function (branch) {
        var that = this;
        var element = null;

        Array.prototype.forEach.call(that.$.root.querySelectorAll('span'), function (span) {
            var isNestedTiles = this.isNestedTilesLabel(span);

            if (isNestedTiles && span.templateInstance.model.branch.node.setup == branch) {
                element = span;
            } else if (!isNestedTiles && span.templateInstance.model.item == branch) {
                element = span;
            }
        }.bind(that));

        while (element) {
            if (element.tagName == "LI") {
                var btn = element.querySelector(".expand");

                if (btn) {
                    btn.removeAttribute("checked");
                }
            }

            element = element.parentNode;
        }
    },
    unhighlightBranch: function (branch) {
      this.highlightedBranches.splice(this.highlightedBranches.indexOf(branch), 1);

      //I need to refresh span classes imperatively because Polymer only observes on filter parameter changes [warpech]
      Array.prototype.forEach.call(this.$.root.querySelectorAll('span.highlight'), function (span) {
        if (span.templateInstance.model.item === branch) {
          span.classList.remove("highlight");
        }
      });
    },
    isBranchHighlighted: function (branch) {
      return this.highlightedBranches.indexOf(branch) > -1;
    },
    getBranchClassName: function (branch) {
      if (this.isBranchHighlighted(branch)) {
        return "highlight";
      }
      else {
        return "";
      }
    },
    preventTextSelection: function(ev) {
      ev.preventDefault();
    },
    refreshTileList: function(ev){
      // this.fire('juicy-tile-tree-refresh-tile-list', ev.target.value);
      this.fire('juicy-tile-tree-refresh-tile-list');
    }
  });
})();