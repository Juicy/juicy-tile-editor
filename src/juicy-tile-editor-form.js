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

  Polymer('juicy-tile-editor-form', {
    modified: false,
    isSelection: false,
    isSingleSelection: false,
    selectedItems: [],
    editedTiles: null,
    itemName: null,
    background: null,
    width: null,
    widthAuto: null,
    height: null,
    heightAuto: null,
    heightDynamic: null,
    heightAdaptive: null,
    gap: null,
    oversize: 0,
    priority: null,
    innerHTML: null,
    layout: null,
    newGroupFromSelection: function () {
      if (!this.selectedItems.length > 1) {
        return;
      }

      var current = this.selectedItems[0];
      var setup = {
        priority: current.priority,
        gap: 0,
        index: current.index
      }

      var model = this.editedTiles;
      var newContainer = model.createNewContainer(null, current.container, setup, true);
      for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
        model.moveToContainer(this.selectedItems[i], newContainer, true);
      }

      this.selectedItems.length = 0; //change edited item to the new container
      this.selectedItems.push(newContainer);

      var dimensions = model.getMinimumDimensions(this.getContainerChildElements(newContainer));
      newContainer.width = dimensions.width;
      newContainer.height = dimensions.height;

      this.refresh();
      this.fire('juicy-tile-editor-form-tree-changed');
    },
    moveSelectionToEditedItemContainer: function () {
      if (!this.selectedItems.length > 1) {
        return;
      }

      var current = this.selectedItems[0];
      var model = this.editedTiles;
      for (var i = 1, ilen = this.selectedItems.length; i < ilen; i++) {
        model.moveToContainer(this.selectedItems[i], current.container, true);
      }

      var dimensions = model.getMinimumDimensions(this.getContainerChildElements(current.container));
      this.selectedItems[0].container.width = dimensions.width;
      this.selectedItems[0].container.height = dimensions.height;

      this.refresh();
      this.fire('juicy-tile-editor-form-tree-changed');
    },
    getContainerChildElements: function (container) {
    	//FIXME I may not work (tomalec)
      var model = this.editedTiles;
      var elements = [];
      for (var i = 0, ilen = container.items.length; i < ilen; i++) {
        if (container.items[i].index != void 0) {
          elements.push(model.elements[container.items[i].index])
        }
        else if (container.items[i].name != void 0) {
          elements.push(model.elements[container.items[i].name])
        }
      }
      return elements;
    },
    gapIncrease: function () {
      this.gap++;
    },
    gapDecrease: function () {
      if (this.gap >= 1) {
        this.gap--;
      }
    },
    oversizeIncrease: function () {
      if (this.oversize >= 1) {
        this.oversize++;
      }
      else{
        this.oversize = 1;
      }
    },
    oversizeDecrease: function () {
      if (this.oversize >= 1) {
        this.oversize--;
      }
    },
    refresh: function () {
      if (this.editedTiles) {
        this.editedTiles.refresh();
        this.modified = this.editedTiles.isModified();
        this.getSource();
      }
    },
    widthIncrease: function () {
      powerIncrease(this, "width");
    },
    widthDecrease: function () {
      powerDecrease(this, "width");
    },
    heightIncrease: function () {
      if (this.height == 'auto') { //turn off auto
        this.height = 32;
        this.heightAuto = false;
      }
      powerIncrease(this, "height");
    },
    heightDecrease: function () {
      if (this.height == 'auto') { //turn off auto
        this.height = 32;
        this.heightAuto = false;
      }
      powerDecrease(this, "height");
    },
    priorityIncrease: function () {
      if (!this.selectedItems.length == 1) {
        return;
      }

      this.editedTiles
        .reprioritizeItem(this.selectedItems[0], true);
      this.priority = this.selectedItems[0].priority;
    },
    priorityDecrease: function () {
      if (!this.selectedItems.length == 1) {
        return;
      }

      this.editedTiles
        .reprioritizeItem(this.selectedItems[0], false);
      this.priority = this.selectedItems[0].priority;
    },
    deleteContainer: function () {
      var deleteElement = this.selectedItems[0];
      this.selectedItems[0] = deleteElement.container;
      this.editedTiles.deleteContainer(deleteElement, true);
      this.refresh();
      this.fire('juicy-tile-editor-form-tree-changed');
    },
    changeDirection: function(){
      this.selectedItems[0].direction = this.selectedItems[0].direction == "downRight" ? "rightDown" : "downRight";
      this.refresh();
    },
    stackItems: function () {
      for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
        if (this.selectedItems[i].items) {
          this.selectedItems[i].direction = "rightDown";
          this.selectedItems[i].heightAuto = true;
          for (var j = 0, jlen = this.selectedItems[i].items.length; j < jlen; j++) {
            this.selectedItems[i].items[j].width = "100%";
          }
        }
      }
      this.refresh();
    },
    isContainerInSelection: function() {
      for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
        if (this.selectedItems[i].items) {
          return true;
        }
      }
      return false;
    },
    isRootInSelection: function() {
      for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
        if (!this.selectedItems[i].container) {
          return true;
        }
      }
      return false;
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
    setCommonValue: function (propName, val) {
      if (val !== "" && this.selectedItems.length) {
        for (var i = 0, ilen = this.selectedItems.length; i < ilen; i++) {
          this.selectedItems[i][propName] = val;
        }
        this.refresh();
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
    applyChange: function (ev) {
      var node = ev.target;
      while (node) {
        if (node.dataset && node.dataset.applyvalue) {
          this.setCommonValue(node.dataset.applyvalue, this[node.dataset.applyvalue]);
          break;
        }
        node = node.parentNode;
      }
    },
    saveChanges: function () {
      this.editedTiles.saveToStorage();
      this.modified = this.editedTiles.isModified();
      this.fire('juicy-tile-editor-save');
    },
    /**
     * Reverts setup from local storage
     */
    revertChanges: function () {
      this.editedTiles.loadFromStorage();
      this.modified = this.editedTiles.isModified();
      this.fire('juicy-tile-editor-revert');
      this.getSource();
    },
    applyLayout: function () {
      this.editedTiles.setAttribute('layout', this.layout);
      this.editedTiles.refresh();
    },
    getSource: function () {
      this.source = this.editedTiles ? JSON.stringify(this.editedTiles.setup) : '';
    },
    /**
     * Force tiles to apply given JSON string as setup
     */
    applySource: function () {
      if (this.editedTiles) {
        this.editedTiles.loadFromString(this.source);
        this.modified = this.editedTiles.isModified();
        this.fire('juicy-tile-editor-revert');
      }
    },
    selectedItemsChanged: function () {
      this.itemName = this.getCommonValue("itemName");
      this.background = this.getCommonValue("background");
      this.width = this.getCommonValue("width");
      this.widthAuto = this.getCommonValue("widthAuto") || false;
      this.height = this.getCommonValue("height");
      this.heightAuto = this.getCommonValue("heightAuto") || false;
      this.heightDynamic = this.getCommonValue("heightDynamic") || false;
      this.heightAdaptive = this.getCommonValue("heightAdaptive") || false;
      this.gap = this.getCommonValue("gap");
      this.oversize = this.getCommonValue("oversize");
      this.priority = this.getCommonValue("priority");
      this.innerHTML = this.getCommonValue("innerHTML") || ""; //set innerHTML to empty string if undefined is returned
      this.layout = this.editedTiles ? this.editedTiles.getAttribute('layout') : '';
      this.isSelection = (this.selectedItems.length > 0);
      this.isSingleSelection = (this.selectedItems.length == 1);
      this.isContainer = this.isContainerInSelection();
      this.isRoot = this.isRootInSelection();
      this.getSource();

      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('input[placeholder]'), function (input) {
        if (this.isSelection && !this.isSingleSelection) {
          input.setAttribute('placeholder', 'multiple'); //display "multiple" text when getCommonValue returns empty string
        }
        else {
          input.setAttribute('placeholder', '');
        }
      }.bind(this));
    }
  });
})();