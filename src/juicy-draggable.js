(function () {
    //https://github.com/gtramontina/draggable.js/blob/master/draggable.js
    var draggable = (function definition() {
        function addEventListener(element, eventName, handler) {
            if (element.addEventListener) {
                element.addEventListener(eventName, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + eventName, handler);
            } else {
                element['on' + eventName] = handler;
            }
        }
        function removeEventListener(element, eventName, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(eventName, handler, false);
            } else if (element.detachEvent) {
                element.detachEvent('on' + eventName, handler);
            } else {
                element['on' + eventName] = null;
            }
        }
        var currentElement;
        var fairlyHighZIndex = '10';

        function draggable(element, handle) {
            handle = handle || element;
            setPositionType(element);
            setDraggableListeners(element);
            addEventListener(handle, 'mousedown', function (event) {
                startDragging(event, element);
            });
        }

        function setPositionType(element) {
            element.style.position = 'absolute';
        }

        function setDraggableListeners(element) {
            element.draggableListeners = {
                start: [],
                drag: [],
                stop: []
            };
            element.whenDragStarts = addListener(element, 'start');
            element.whenDragging = addListener(element, 'drag');
            element.whenDragStops = addListener(element, 'stop');
        }

        function startDragging(event, element) {
            currentElement && sendToBack(currentElement);
            currentElement = bringToFront(element);


            var initialPosition = getInitialPosition(currentElement);
            currentElement.style.left = inPixels(initialPosition.left);
            currentElement.style.top = inPixels(initialPosition.top);
            currentElement.lastXPosition = event.clientX;
            currentElement.lastYPosition = event.clientY;

            var okToGoOn = triggerEvent('start', { x: initialPosition.left, y: initialPosition.top, mouseEvent: event });
            if (!okToGoOn) return;

            addDocumentListeners();
        }

        function addListener(element, type) {
            return function (listener) {
                element.draggableListeners[type].push(listener);
            };
        }

        function triggerEvent(type, args) {
            var result = true;
            var listeners = currentElement.draggableListeners[type];
            for (var i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i](args) === false) result = false;
            };
            return result;
        }

        function sendToBack(element) {
            var decreasedZIndex = fairlyHighZIndex - 1;
            element.style['z-index'] = decreasedZIndex;
            element.style['zIndex'] = decreasedZIndex;
        }

        function bringToFront(element) {
            element.style['z-index'] = fairlyHighZIndex;
            element.style['zIndex'] = fairlyHighZIndex;
            return element;
        }

        function addDocumentListeners() {
            addEventListener(document, 'selectstart', cancelDocumentSelection);
            addEventListener(document, 'mousemove', repositionElement);
            addEventListener(document, 'mouseup', removeDocumentListeners);
        }

        function getInitialPosition(element) {
            var boundingClientRect = element.getBoundingClientRect();
            return {
                top: boundingClientRect.top,
                left: boundingClientRect.left
            };
        }

        function inPixels(value) {
            return value + 'px';
        }

        function cancelDocumentSelection(event) {
            event.preventDefault && event.preventDefault();
            event.stopPropagation && event.stopPropagation();
            event.returnValue = false;
            return false;
        }

        function repositionElement(event) {
            event.preventDefault && event.preventDefault();
            event.returnValue = false;
            var style = currentElement.style;
            var elementXPosition = parseInt(style.left, 10);
            var elementYPosition = parseInt(style.top, 10);

            var elementNewXPosition = elementXPosition + (event.clientX - currentElement.lastXPosition);
            var elementNewYPosition = elementYPosition + (event.clientY - currentElement.lastYPosition);

            style.left = inPixels(elementNewXPosition);
            style.top = inPixels(elementNewYPosition);

            currentElement.lastXPosition = event.clientX;
            currentElement.lastYPosition = event.clientY;

            triggerEvent('drag', { x: elementNewXPosition, y: elementNewYPosition, mouseEvent: event });
        }

        function removeDocumentListeners(event) {
            removeEventListener(document, 'selectstart', cancelDocumentSelection);
            removeEventListener(document, 'mousemove', repositionElement);
            removeEventListener(document, 'mouseup', removeDocumentListeners);

            var left = parseInt(currentElement.style.left, 10);
            var top = parseInt(currentElement.style.top, 10);
            triggerEvent('stop', { x: left, y: top, mouseEvent: event });
        }

        return draggable;
    })();

    function getElementInsideContainer(container, childID) {
        var elm = {};
        var elms = container.getElementsByTagName("*");
        for (var i = 0; i < elms.length; i++) {
            if (elms[i].id === childID) {
                elm = elms[i];
                break;
            }
        }
        return elm;
    }

    Polymer("juicy-draggable", {
        domReady: function () {
            var element = getElementInsideContainer(this, this.elementId);
            var handle = getElementInsideContainer(this, this.handleId);
            var that = this;

            draggable(element, handle);

            element.whenDragStarts(function (e) {
                that.fire("whenDragStarts", e);
            });

            element.whenDragging(function (e) {
                that.fire("whenDragging", e);
            });

            element.whenDragStops(function (e) {
                that.fire("whenDragStops", e);
            });

            element.style.position = this.position || "absolute";
        },
        getScreenSize: function () {
            var w = window;
            var d = document;
            var e = d.documentElement;
            var g = d.getElementsByTagName('body')[0];
            var x = w.innerWidth || e.clientWidth || g.clientWidth;
            var y = w.innerHeight || e.clientHeight || g.clientHeight;

            return { x: x, y: y };
        }
    });
})();