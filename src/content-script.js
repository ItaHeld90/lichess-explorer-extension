(function init() {
    const movesTableSelector = 'table.moves';

    const tableAddedObserver = new MutationObserver(generalMutationHandler);
    tableAddedObserver.observe(document.body, { childList: true, subtree: true });

    function generalMutationHandler(mutationList) {
        const shouldExecute = [...mutationList].some(
            (mutation) =>
                mutation.type === 'childList' &&
                [...mutation.addedNodes].some(
                    (node) => node instanceof HTMLElement && !!node.querySelector(movesTableSelector)
                )
        );

        if (shouldExecute) {
            handleTableAdded();
        }
    }

    function handleTableAdded() {
        const movesTable = document.querySelector(movesTableSelector);

        execute();

        const observer = new MutationObserver(handleMutation);

        observer.observe(movesTable, { childList: true, subtree: true });
    }

    function handleMutation(mutationsList) {
        const shouldExecute = [...mutationsList].some(
            (mutation) => mutation.type === 'childList' && mutation.target.tagName === 'TBODY'
        );

        console.log(mutationsList);
        if (shouldExecute) {
            execute();
        }
    }

    function execute() {
        const movesTable = document.querySelector(movesTableSelector);
        const [, ...moveRecords] = movesTable.querySelectorAll('tr');
        const occurenceElements = moveRecords.map((rec) => rec.querySelector('td:nth-of-type(2)'));
        const numOccurences = occurenceElements.map((el) => stringToNum(el.textContent));
        const sumOccurences = numOccurences.reduce((s, num) => s + num, 0);

        const percentages = numOccurences.map((x) => {
            const percentage = (x / sumOccurences) * 100;
            return Number(percentage.toFixed(2));
        });

        occurenceElements.forEach((el, idx) => {
            const percentage = percentages[idx];
            const newEl = createPercentageElement(percentage);
            el.prepend(newEl);
        });
    }

    function createPercentageElement(value) {
        const newEl = document.createElement('span');
        newEl.style.color = 'blue';
        newEl.style.fontWeight = 'bold';
        newEl.style.padding = '0 5px 0 5px';
        newEl.textContent = `${value}%`;

        return newEl;
    }

    function stringToNum(str) {
        return str.split(',').reduce((res, num, idx, arr) => res + num * 1000 ** (arr.length - 1 - idx), 0);
    }
})();
