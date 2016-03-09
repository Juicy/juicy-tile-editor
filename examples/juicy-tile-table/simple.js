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
                id: "group_1",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: false,
                priority: 1,
                gutter: 0,
                height: 1,
                direction: "horizontal",
                items: [
                    { width: "225", widthFlexible: false, id: 0, hidden: false, heightDynamic: true, height: 1, priority: 0.9 },
                    { width: "225", widthFlexible: true, id: 1, hidden: false, heightDynamic: true, height: 1, priority: 0.81 },
                    { width: "100%", widthFlexible: true, id: 12, hidden: false, heightDynamic: true, height: 1, priority: 0.8 }
                ]
            },
            { width: "100%", widthFlexible: true, id: 2, hidden: false, heightDynamic: true, height: 1, priority: 0.7 },
            { width: "100%", widthFlexible: true, id: 3, hidden: false, heightDynamic: true, height: 1, priority: 0.6 },
            { width: "100%", widthFlexible: true, id: 4, hidden: false, heightDynamic: true, height: 1, priority: 0.5 },
            {
                width: "100%",
                widthFlexible: true,
                id: "group_2",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: false,
                priority: 0.41,
                gutter: 0,
                direction: "horizontal",
                items: [
                    { width: "100%", widthFlexible: true, id: 5, hidden: false, heightDynamic: true, height: 1, priority: 0.4 },
                    { width: "100%", widthFlexible: true, id: 6, hidden: false, heightDynamic: true, height: 1, priority: 0.31 }
                ]
            },
            { width: "100%", widthFlexible: true, id: 7, hidden: false, heightDynamic: true, height: 1, priority: 0.3 },
            { width: "100%", widthFlexible: true, id: 8, hidden: false, heightDynamic: true, height: 1, priority: 0.2 },
            {
                width: "100%",
                widthFlexible: true,
                id: "group_3",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: true,
                priority: 0.1,
                gutter: 0,
                direction: "horizontal",
                items: [
                    { width: "100%", widthFlexible: true, id: 9, hidden: false, heightDynamic: true, height: 1, priority: 0.09 },
                    { width: "100%", widthFlexible: true, id: 10, hidden: false, heightDynamic: true, height: 1, priority: 0.08 }
                ]
            },
            { width: "100%", widthFlexible: true, id: 11, hidden: false, heightDynamic: true, height: 1, priority: 0.07 }
        ]
    },
    nestedSetup: {
        gutter: 10,
        width: 480,
        direction: "horizontal",
        items: [
            { width: "100%", widthFlexible: true, id: 0, hidden: false, heightDynamic: true, height: 1, priority: 1 },
            { width: "100%", widthFlexible: true, id: 1, hidden: false, heightDynamic: true, height: 1, priority: 0.9 }
        ]
    }
};

model.setupLeft = JSON.parse(JSON.stringify(model.setup));
model.setupLeftCopy = JSON.parse(JSON.stringify(model.setup));
model.nestedSetupLeft = JSON.parse(JSON.stringify(model.nestedSetup));
model.nestedSetupLeftCopy = JSON.parse(JSON.stringify(model.nestedSetup));

model.setupRight = JSON.parse(JSON.stringify(model.setup));
model.setupRightCopy = JSON.parse(JSON.stringify(model.setup));
model.nestedSetupRight = JSON.parse(JSON.stringify(model.nestedSetup));
model.nestedSetupRightCopy = JSON.parse(JSON.stringify(model.nestedSetup));

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