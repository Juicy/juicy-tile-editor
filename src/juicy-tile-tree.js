(function () {
  Polymer('juicy-tile-tree', {
    tree: [],
    highlightedBranches: [],
    /**
     * Converts branch object to a display name string. Can be overloaded
     * @param {Object} branch {node: {branchnode} [, item: branchnode.node.setup.items[n]]}
     * @returns {String}
     */
    toDisplayName: function(branch) {
        if (branch.item && branch.item.items != void 0) { //container
          return branch.item.id;
        }
        else if (branch.item) { //element
          var txt = "";
          //TODO: use some kind of this.elements (which will not contain groups)
          var elem = branch.node.querySelector('[juicytile="'+branch.item.id+'"]');
          if(!elem){
            return branch.item.id;
          }
          var header = elem.querySelector("h1, h2, h3, h4, h5, h6");
          if(header) {
            txt = header.textContent;
          }
          else {
            txt = elem.textContent;
          }
          txt = txt.trim();
          if(!txt) {
            txt = "<" + elem.nodeName.toLowerCase() + ">";
          }
          if(txt.length > 23) {
            txt = txt.substr(0, 20) + " \u2026"; //'HORIZONTAL ELLIPSIS' (U+2026)
          }
          return txt;
        }
        else if(branch.node) { //juicy-tile-list root
          return branch.node.id;
        }
        else { //error
          return "Unnamed element";
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
    },
    refreshTiles: function(){
      // debugger
    }
  });
})();