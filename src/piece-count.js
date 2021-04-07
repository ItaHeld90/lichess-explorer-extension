(function init() {
    const boardContainerSelector = 'cg-container';
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

    const pieceSymbols = {
        king: 'K',
        pawn: 'P',
        knight: 'N',
        bishop: 'B',
        rook: 'R',
        queen: 'Q',
    };

    const boardAppearanceObs = new MutationObserver(handleTopMutations);
    boardAppearanceObs.observe(document.body, { childList: true, subtree: true });

    function handleTopMutations(mutationsList) {
        const shouldExecute = [...mutationsList].some(
            (mutation) =>
                mutation.type === 'childList' &&
                [...mutation.addedNodes].some(
                    (node) => node instanceof HTMLElement && node.matches(boardContainerSelector)
                )
        );

        if (shouldExecute) {
            addWidgetToPage();
            const pieceChangesObs = new MutationObserver(handlePiecesChanged);
            const boardNode = document.querySelector(boardContainerSelector);
            pieceChangesObs.observe(boardNode, { childList: true, subtree: true });
        }
    }

    function handlePiecesChanged(mutationsList) {
        const shouldExecute = [...mutationsList].some((mutation) => {
            if (mutation.type !== 'childList') return;

            const affectedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
            return affectedNodes.some((node) => node.matches('piece'));
        });

        if (!shouldExecute) return;

        const whitePieceElements = [...document.querySelectorAll('piece.white:not(.ghost)')];
        const blackPieceElements = [...document.querySelectorAll('piece.black:not(.ghost)')];

        const [whitePieces, blackPieces] = [whitePieceElements, blackPieceElements].map((pieceElements) =>
            pieceElements.map((el) => pieceNames.find((piece) => el.classList.contains(piece)))
        );

        updateWidget(whitePieces, blackPieces);
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

    function updateWidget(whitePieces, blackPieces) {
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

        const whiteStatusElement = document.createElement('div');
        whiteStatusElement.style.display = "flex";
        whiteStatusElement.style.alignItems = "center";
        whiteStatusElement.style.marginTop = '20px';

        const whiteAdvantageElement = document.createElement('div');
        whiteAdvantageElement.innerText =
            whiteAdvantage > 0 ? `+${whiteAdvantage}` : '';
        whiteStatusElement.append(...whiteCaptureElements, whiteAdvantageElement);

        const blackStatusElement = document.createElement('div');
        blackStatusElement.style.display = "flex";
        blackStatusElement.style.alignItems = "center";

        const blackAdvantageElement = document.createElement('div');
        blackAdvantageElement.innerText =
            whiteAdvantage < 0 ? `+${-whiteAdvantage}` : '';
        blackStatusElement.append(...blackCaptureElements, blackAdvantageElement);

        // Create Element
        const widget = document.querySelector(`.${widgetSelectorClassName}`) || addWidgetToPage();

        const widgetContent = document.createElement('div');
        widgetContent.classList.add(widgetContentClassName);
        widgetContent.append(blackStatusElement, whiteStatusElement);

        const existingContent = widget.querySelector(`.${widgetContentClassName}`);

        if (existingContent) {
            existingContent.replaceWith(widgetContent);
        } else {
            widget.append(widgetContent);
        }
    }

    function getCaptureElement(captureName, numCaptures, color) {
        const captureElement = document.createElement('div');
        captureElement.style.display = "inline-flex";
        captureElement.style.alignItems = "end";

        const pieceImg = document.createElement('img');
        pieceImg.src = chrome.extension.getURL(`assets/${captureName} - ${color}.png`);

        const multiplier = document.createElement('span');
        multiplier.innerText = numCaptures > 1 ? `${numCaptures} x` : '';

        captureElement.append(multiplier, pieceImg);

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
