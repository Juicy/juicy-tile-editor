var template = document.querySelector("template#root");
var model = {
    editingMode: true,
    setup: {
        gutter: 10,
        width: 480,
        direction: "horizontal",
        items: [
            {
                width: "100%",
                widthFlexible: true,
                id: "products/group_1",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: false,
                priority: 1,
                gutter: 0,
                height: 1,
                direction: "horizontal",
                items: [
                    { width: "225", widthFlexible: false, id: "products/0", hidden: false, heightDynamic: true, height: 1, priority: 0.9 },
                    { width: "225", widthFlexible: true, id: "products/1", hidden: false, heightDynamic: true, height: 1, priority: 0.81 }
                ]
            },
            { width: "100%", widthFlexible: true, id: "products/2", hidden: false, heightDynamic: true, height: 1, priority: 0.7 },
            { width: "100%", widthFlexible: true, id: "products/3", hidden: false, heightDynamic: true, height: 1, priority: 0.6 },
            { width: "100%", widthFlexible: true, id: "products/4", hidden: false, heightDynamic: true, height: 1, priority: 0.5 },
            {
                width: "100%",
                widthFlexible: true,
                id: "products/group_2",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: false,
                priority: 0.41,
                gutter: 0,
                direction: "horizontal",
                items: [
                    { width: "100%", widthFlexible: true, id: "products/5", hidden: false, heightDynamic: true, height: 1, priority: 0.4 }
                ]
            }
        ]
    }
};

model.setupLeft = JSON.parse(JSON.stringify(model.setup));
model.setupLeftCopy = JSON.parse(JSON.stringify(model.setup));

template.model = model;

template.closeEditor = function () {
    template.set("model.editingMode", false);
};

function blockme() {
    alert("I should get blocked when editor is opened");
}

setTimeout(function () {
    window.editor = document.querySelector("juicy-tile-simple-editor");

    // Hack to recalculate nested juicy-tile-list height.
    document.querySelector("juicy-tile-table").refresh(true);
}, 1000);
