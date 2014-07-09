(function () {
  Polymer('juicy-tile-tree', {
    tree: [],
    highlightedBranches: [],
    /**
     * Converts branch object to a display name string. Can be overloaded
     * @param branch
     * @returns {String}
     * @todo not used, as it is overwritten in juicy-tile-editor
     */
    toDisplayName: function (branch) {
      if (branch.name != void 0) {
        return branch.name
      }
      else {
        return "Unnamed element"
      }
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
    isNestedTilesLabel: function(elem) {
      var model = elem.templateInstance.model;
      var proto = Object.getPrototypeOf(model);

      if (model.item === proto.item) { //a nested tiles (item is inherited from prototype)
        return true;
      }
      return false; //a branch of a leaf (branch is inherited from prototype)
    },
    highlightBranch: function (branch, expand) {
      if (!expand) {
        this.highlightedBranches.length = 0;
      }
      this.highlightedBranches.push(branch);

      //I need to refresh span classes imperatively because Polymer only observes on filter parameter changes [warpech]
      Array.prototype.forEach.call(this.$.root.querySelectorAll('span'), function (span) {
        var isNestedTiles = this.isNestedTilesLabel(span);
        if (isNestedTiles && span.templateInstance.model.branch.node.setup == branch) {
          span.classList.add("highlight");
        }
        else if (!isNestedTiles && span.templateInstance.model.item == branch) {
          span.classList.add("highlight");
        }
        else if (!expand) {
          span.classList.remove("highlight");
        }
      }.bind(this));
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
    }
  });
})();