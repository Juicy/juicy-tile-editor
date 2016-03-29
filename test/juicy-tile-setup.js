var pageSize = {
    width: 1000,
    tileHeight: 500
};

var getJuicyTileSetup = function () {
    return JSON.parse(JSON.stringify({
        gutter: 0,
        width: 480,
        direction: "horizontal",
        items: [
            { width: "100%", widthFlexible: true, id: 0, hidden: false, heightDynamic: true, height: 1, priority: 1 },
            { width: "100%", widthFlexible: true, id: 1, hidden: false, heightDynamic: true, height: 1, priority: 0.9 },
            {
                width: "100%",
                widthFlexible: true,
                id: "group_0",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: true,
                priority: 0.8,
                gutter: 0,
                height: 1,
                direction: "horizontal",
                items: [
                    { width: "100%", widthFlexible: true, id: 2, hidden: false, heightDynamic: true, height: 1, priority: 0.79 },
                    { width: "100%", widthFlexible: true, id: 3, hidden: false, heightDynamic: true, height: 1, priority: 0.78 }
                ]
            },
            {
                width: "100%",
                widthFlexible: true,
                id: "group_1",
                hidden: false,
                heightDynamic: true,
                height: 1,
                tightGroup: false,
                priority: 0.7,
                gutter: 0,
                height: 1,
                direction: "horizontal",
                items: [
                    { width: "100%", widthFlexible: true, id: 4, hidden: false, heightDynamic: true, height: 1, priority: 0.69 },
                    { width: "100%", widthFlexible: true, id: 5, hidden: false, heightDynamic: true, height: 1, priority: 0.68 }
                ]
            }
        ]
    }));
};