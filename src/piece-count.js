(function init() {
    const boardContainerSelector = 'cg-helper';
    const boardWrapperSelector = '.cg-wrap';
    const formatSelector = 'aside > .mselect';
    const widgetSelectorClassName = '__lichess-pieces-widget__';
    const widgetContentClassName = '__lichess-pieces-widget-content__';

    const pieceValues = {
        king: 0,
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
    };

    const pieceNames = Object.keys(pieceValues);

    const basePieceCount = {
        king: 1,
        pawn: 8,
        knight: 2,
        bishop: 2,
        rook: 2,
        queen: 1,
    };

    const boardAppearanceObs = new MutationObserver(handleTopMutations);
    boardAppearanceObs.observe(document.body, { childList: true, subtree: true });

    function handleTopMutations(mutations) {
        const mutationsList = [...mutations];

        const shouldAddWidget = mutationsList.some(
            (mutation) =>
                mutation.type === 'childList' &&
                [...mutation.addedNodes].some(
                    (node) => node instanceof HTMLElement && node.matches(boardContainerSelector)
                )
        );

        const shouldRemoveWidget = mutationsList.some(
            (mutation) =>
                mutation.type === 'childList' &&
                [...mutation.removedNodes].some(
                    (node) => node instanceof HTMLElement && node.matches(boardContainerSelector)
                )
        );

        if (shouldAddWidget) {
            addWidgetToPage();

            // observe pieces change
            const pieceChangesObs = new MutationObserver(handlePiecesChanged);
            const boardNode = document.querySelector(boardContainerSelector);
            pieceChangesObs.observe(boardNode, { childList: true, subtree: true });

            // observe orientation change
            const orientationChangeObs = new MutationObserver(handleOrientationChange);
            const boardWrapperNode = document.querySelector(boardWrapperSelector);
            orientationChangeObs.observe(boardWrapperNode, { attributes: true });
        }

        if (shouldRemoveWidget) {
            removeWidgetFromPage();
        }
    }

    function handleOrientationChange(mutationsList) {
        const shouldUpdateWidget = [...mutationsList].some((mutation) => mutation.attributeName === 'class');

        if (shouldUpdateWidget) {
            updateWidget();
        }
    }

    function handlePiecesChanged(mutationsList) {
        const shouldExecute = [...mutationsList].some((mutation) => {
            if (mutation.type !== 'childList') return;

            const affectedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
            return affectedNodes.some((node) => node.matches('piece'));
        });

        if (!shouldExecute) return;

        updateWidget();
    }

    function addWidgetToPage() {
        const formatSelectorEl = document.querySelector(formatSelector);
        const piecesWidget = createPiecesWidget();
        formatSelectorEl.insertAdjacentElement('afterend', piecesWidget);

        return piecesWidget;

        function createPiecesWidget() {
            const widget = document.createElement('div');
            widget.classList.add(widgetSelectorClassName);
            widget.style.padding = '10px';

            return widget;
        }
    }

    function removeWidgetFromPage() {
        const widgetElement = document.querySelector(`.${widgetSelectorClassName}`);
        widgetElement.remove();
    }

    function updateWidget() {
        const whitePieceElements = [...document.querySelectorAll('piece.white:not(.ghost)')];
        const blackPieceElements = [...document.querySelectorAll('piece.black:not(.ghost)')];
        const boardWrapperElement = document.querySelector(boardWrapperSelector);
        const orientation = boardWrapperElement.classList.contains('orientation-black') ? 'black' : 'white';

        const [whitePieces, blackPieces] = [whitePieceElements, blackPieceElements].map((pieceElements) =>
            pieceElements.map((el) => pieceNames.find((piece) => el.classList.contains(piece)))
        );

        const [whitePiecesSum, blackPiecesSum] = [whitePieces, blackPieces].map((pieces) =>
            pieces.reduce((sum, currPiece) => sum + pieceValues[currPiece], 0)
        );

        const [whitePiecesCount, blackPiecesCount] = [whitePieces, blackPieces].map((pieces) =>
            countBy(pieces, identity)
        );

        const [whiteCapturedCount, blackCapturedCount] = [whitePiecesCount, blackPiecesCount].map((piecesCount) =>
            mapValues(basePieceCount, (baseCnt, name) => baseCnt - (piecesCount[name] || 0))
        );

        const whiteAdvantage = whitePiecesSum - blackPiecesSum;

        const [blackSortedCaptures, whiteSortedCaptures] = [whiteCapturedCount, blackCapturedCount].map(
            (capturedCount) => {
                const nonEmptyCaptures = Object.entries(capturedCount).filter(([, cnt]) => cnt > 0);
                const sortedCaptures = sortBy(nonEmptyCaptures, ([pieceName]) => pieceValues[pieceName]);

                return sortedCaptures;
            }
        );

        const whiteCaptureElements = whiteSortedCaptures.map(([pieceName, cnt]) =>
            getCaptureElement(pieceName, cnt, 'black')
        );

        const blackCaptureElements = blackSortedCaptures.map(([pieceName, cnt]) =>
            getCaptureElement(pieceName, cnt, 'white')
        );

        const whiteStatusElement = getPlayerStatusElement();

        const whiteAdvantageText = whiteAdvantage > 0 ? `+${whiteAdvantage}` : '';
        const whiteAdvantageElement = getAdvantageElement(whiteAdvantageText);
        whiteStatusElement.append(...whiteCaptureElements, whiteAdvantageElement);

        const blackStatusElement = getPlayerStatusElement();

        const blackAdvantageText = whiteAdvantage < 0 ? `+${-whiteAdvantage}` : '';
        const blackAdvantageElement = getAdvantageElement(blackAdvantageText);
        blackStatusElement.append(...blackCaptureElements, blackAdvantageElement);

        const statusElements =
            orientation === 'white'
                ? [blackStatusElement, whiteStatusElement]
                : [whiteStatusElement, blackStatusElement];

        const [topStatusElement, bottomStatusElement] = statusElements;
        bottomStatusElement.style.bottom = '20%';
        topStatusElement.style.top = '20%';

        // Create Element
        const widget = document.querySelector(`.${widgetSelectorClassName}`) || addWidgetToPage();

        const widgetContent = document.createElement('div');
        widgetContent.classList.add(widgetContentClassName);
        widgetContent.append(...statusElements);

        const existingContent = widget.querySelector(`.${widgetContentClassName}`);

        if (existingContent) {
            existingContent.replaceWith(widgetContent);
        } else {
            widget.append(widgetContent);
        }
    }

    function getPlayerStatusElement() {
        const statusElement = document.createElement('div');
        statusElement.style.height = '30px';
        statusElement.style.display = 'flex';
        statusElement.style.alignItems = 'flex-end';
        statusElement.style.position = 'absolute';

        return statusElement;
    }

    function getAdvantageElement(advantage) {
        const advantageElement = document.createElement('div');
        advantageElement.style.lineHeight = '1em';
        advantageElement.style.marginLeft = '5px';
        advantageElement.style.color = 'green';
        advantageElement.style.fontWeight = 'bold';
        advantageElement.innerText = advantage;

        return advantageElement;
    }

    function getCaptureElement(captureName, numCaptures, color) {
        const captureElement = document.createElement('div');
        captureElement.style.display = 'flex';
        captureElement.style.alignItems = 'flex-end';

        const pieceImg = document.createElement('img');
        pieceImg.src = chrome.extension.getURL(`assets/${captureName} - ${color}.png`);
        pieceImg.style.marginRight = '3px';

        const multiplier = document.createElement('div');
        multiplier.style.lineHeight = '1em';
        multiplier.innerText = numCaptures > 1 ? `x${numCaptures}` : '';
        multiplier.style.marginRight = '4px';

        captureElement.append(pieceImg, multiplier);

        return captureElement;
    }

    // Utils

    function countBy(arr, countFn) {
        return arr.reduce((res, item) => {
            const key = countFn(item);
            const val = res[key] ? res[key] + 1 : 1;
            return {
                ...res,
                [key]: val,
            };
        }, {});
    }

    function sortBy(arr, sortFn) {
        return arr.sort((a, b) => {
            const [aVal, bVal] = [a, b].map(sortFn);
            return aVal < bVal ? -1 : bVal < aVal ? 1 : 0;
        });
    }

    function mapValues(obj, mapFn) {
        return Object.entries(obj).reduce((res, [key, val]) => ({ ...res, [key]: mapFn(val, key) }), {});
    }

    function identity(val) {
        return val;
    }
})();
