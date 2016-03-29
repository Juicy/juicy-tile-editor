function wait() { 
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(true);
        }, 50);
    });
}

function fireEvent(obj, evt, ctrl) {
    var fireOnThis = obj;

    if (document.createEvent) {
        //var evObj = document.createEvent(evt.indexOf("mouse") > -1 ? "MouseEvents" : "KeyboardEvent");
        var evObj = document.createEvent("MouseEvents", { ctrlKey: true });
        evObj.ctrlKey = !!ctrl;
        evObj.initEvent(evt, true, false);
        fireOnThis.dispatchEvent(evObj);

    } else if (document.createEventObject) {
        var evObj = document.createEventObject();
        evObj.ctrlKey = !!ctrl;
        fireOnThis.fireEvent("on" + evt, evObj);
    }
}

function click(element) {
    element.click();
}

function dblclick(element) {
    fireEvent(element, "dblclick");
}

function ctrlClick(element) {
    console.error("ctrlClick is not implemented");
}

function clickPromise(element) {
    return new Promise(function (resolve) {
        click(element);
        wait().then(function () {
            resolve(true);
        });
    });
}

function dblclickPromise(element, timeout) {
    return new Promise(function (resolve) {
        dblclick(element);
        wait().then(function () {
            resolve(true);
        });
    });
}

function getCellById(table, id) {
    return Polymer.dom(table.shadowRoot).querySelector("td[id='" + id + "']");
}

function getNthCell(table, n) {
    return Polymer.dom(table.shadowRoot).querySelector("td:nth-child(" + n + ")");
}

function getNthTile(table, n) {
    return table.querySelector("[juicytile]:nth-child(" + n + ")");
}

function getTileById(table, id) {
    return table.querySelector("[juicytile='" + id + "']");
}

function JuicyTileTableWrapper(table) {
    this.table = table;
}

JuicyTileTableWrapper.prototype.cells = function () {
    return Polymer.dom(this.table.shadowRoot).querySelectorAll("td");
};

JuicyTileTableWrapper.prototype.cell = function (id) {
    return getCellById(this.table, id);
};

JuicyTileTableWrapper.prototype.nthCell = function (n) {
    return getNthCell(this.table, n);
};

JuicyTileTableWrapper.prototype.tiles = function () {
    return this.table.querySelector("[juicytile]");
};

JuicyTileTableWrapper.prototype.tile = function (id) {
    return getTileById(this.table, id);
};

JuicyTileTableWrapper.prototype.nthTile = function (n) {
    return getNthTile(this.table, IDBCursor);
};

JuicyTileTableWrapper.prototype.setup = function (id) {
    var items = this.table.setup.items;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (item.id == id) {
            return item;
        }
    }

    return null;
};

function JuicyTileEditorWrapper(editor) {
    this.editor = editor;
    this.root = Polymer.dom(this.editor.root);

    this.tabs = {};
    this.tabs.simple = this.root.querySelectorAll(".editor-tabs button.btn-tab")[0];
    this.tabs.expert = this.root.querySelectorAll(".editor-tabs button.btn-tab")[1];
}

JuicyTileEditorWrapper.prototype.getSimpleModeForm = function () {
    return this.root.querySelector(".editor-simple-form");
};

JuicyTileEditorWrapper.prototype.getExpertModeForm = function () {
    return this.root.querySelector(".editor-expert-form");
};

JuicyTileEditorWrapper.prototype.setSimpleMode = function () {
    var simple = this.getSimpleModeForm();

    if (!simple) {
        click(this.tabs.simple);
    }
};

JuicyTileEditorWrapper.prototype.setExpertMode = function () {
    var expert = this.getExpertModeForm();

    if (!expert) {
        click(this.tabs.expert);
    }
};