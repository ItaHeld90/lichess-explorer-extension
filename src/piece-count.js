(function init() {
    const boardContainerSelector = 'cg-container';
    const formatSelector = 'aside > .mselect';
    const widgetSelectorClassName = '__lichess-pieces-widget__';

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

        const blackPieces = [...document.querySelectorAll('piece.black:not(.ghost)')];
        const whitePieces = [...document.querySelectorAll('piece.white:not(.ghost)')];

        const piecesValues = {
            rook: 5,
            knight: 3,
            bishop: 3,
            queen: 9,
            king: 0,
            pawn: 1,
        };

        const pieceNames = Object.keys(piecesValues);

        let resBlack = calcSumPieces(blackPieces);
        let resWhite = calcSumPieces(whitePieces);

        let whiteAdvantage = resWhite - resBlack;
        updateWidget(whiteAdvantage);

        function calcSumPieces(pieces) {
            let res = pieces.reduce(
                (sum, curr) => sum + piecesValues[pieceNames.find((piece) => curr.classList.contains(piece))],
                0
            );
            return res;
        }
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

    function updateWidget(whiteAdvantage) {
        const widget = document.querySelector(`.${widgetSelectorClassName}`) || addWidgetToPage();

        widget.textContent = `white: ${whiteAdvantage > 0 ? '+' : ''}${whiteAdvantage}`;
    }
})();
