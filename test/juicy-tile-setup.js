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
            { width: "100%", widthFlexible: true, id: 1, hidden: false, heightDynamic: true, height: 1, priority: 0.9 }
        ]
    }));
};