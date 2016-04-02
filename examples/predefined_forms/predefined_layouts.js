(function () {
    /**
     * Matches control-label pairs.
     * Currently it's pretty naive, as it assumes that label precedes applicable control.
     * @param  {Array<HTMLElement>} elements array of elements to match
     * @return {Array}          array of sets [control, controlId, label, labelId], label could be undefined.
     */
    function matchPairs(elements){
        // match pairs
        var elementNo = 0, label, len, element;
        // array of pairs (element, element.juicy-id, label, label.juicy-id) of (element, labale) pairs
        var pairs = [], pair;
        for(elementNo = 0, len = elements.length; elementNo < len; elementNo++){
            element = elements[elementNo];
            // naive pair matching by just preceding siblings
            if(element.tagName === 'LABEL'){
                label = element;
            } else {
                pairs.push([element, element.getAttribute('juicytile'), label, label && label.getAttribute('juicytile')]);
                label = undefined;
            }
        }
        return pairs;
    }

    var editor = (document._currentScript || document.currentScript).previousElementSibling;
    editor.predefinedSetups = [
        {
            id: "labelsOnLeft",
            description: "Original labels will be placed on the left column, all controlls on right",
            apply: function labelsOnLeft (elements){
                var pairs = matchPairs(elements);

                // create the setup for picked pairs
                var items = [];
                for(var pairNo = 0, pairsLength = pairs.length; pairNo < pairsLength; pairNo++){
                    pair = pairs[pairNo];


                    // naive pair matching by just preceding siblings
                    items.push({
                        "items": [{
                            "width": "25%",
                            "widthFlexible": true,
                            // type 1, 2
                            "id": pair[2] !== undefined ? pair[3] : pair[1] +'_fake-label',
                            // type 3
                            // "id": pair[1] +'_fake-label',
                            "heightDynamic": true,
                            "height": 1,
                            // type 1,2
                            // "content": pair[2] !== undefined ? '' : '<label for="'+ controlId +'" juicy-for>fake label</label>',
                            // type 3
                            // "content": '<label for="'+ controlId +'" juicy-for>fake label:</label>',
                            "priority": 0.8,
                        },{
                            "width": "75%",
                            "widthFlexible": true,
                            "id": pair[1],
                            "heightDynamic": true,
                            "height": 1,
                            "priority": 0.4
                        }],
                        "id": "input_label_pair_" + pairNo,
                        "priority": 1 - pairNo / pairsLength,
                        "width": "100%",
                        "height": 1,
                        "heightDynamic": true,
                        "widthFlexible": true,
                        "tightGroup": false,
                        "itemName": "Input, label pair " + pairNo,
                        "content": ""
                    });
                }
                return items;
            }

        },
        {
            id: "unifiedLabelsOnLeft",
            description: "Unified labels will be placed on the left column, all controlls on right",
            apply: function unifiedLabelsOnLeft (elements){
                var pairs = matchPairs(elements);

                // create the setup for picked pairs
                var items = [], setupEntry;
                for(var pairNo = 0, pairsLength = pairs.length; pairNo < pairsLength; pairNo++){
                    pair = pairs[pairNo];


                    // naive pair matching by just preceding siblings
                    setupEntry = {
                        "items": [{
                            "width": "25%",
                            "widthFlexible": true,
                            // type 1, 2
                            "id": pair[1] +'_fake-label',
                            // type 3
                            // "id": pair[1] +'_fake-label',
                            "heightDynamic": true,
                            "height": 1,
                            "content": pair[2] !== undefined ? '<label for="'+ pair[2].htmlFor +'" class="juicy-for">'+ pair[2].innerHTML +'</label>' : undefined,
                            "priority": 0.8,
                        },{
                            "width": "75%",
                            "widthFlexible": true,
                            "id": pair[1],
                            "heightDynamic": true,
                            "height": 1,
                            "priority": 0.4
                        }],
                        "id": "input_label_pair_" + pairNo,
                        "priority": 1 - pairNo / pairsLength,
                        "width": "100%",
                        "height": 1,
                        "heightDynamic": true,
                        "widthFlexible": true,
                        "tightGroup": false,
                        "itemName": "Input, label pair " + pairNo,
                        "content": ""
                    };
                    // add entry to hideexisting label
                    if(pair[2] !== undefined){
                        setupEntry.items.push({
                            "id": pair[3],
                            "hidden": true,
                            "priority": 0.7,
                        })
                    }
                    items.push(setupEntry);
                }
                return items;
            }

        }
    ];

}());
