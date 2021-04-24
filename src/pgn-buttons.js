(function init() {
    const pgnContainerSelector = '.pgn';
    const pgnTextAreaSelector = '.pgn textarea';
    const copyablesSelector = '.copyables';
    const importButtonSelector = '.pgn button.button.action'
    const buttonsContainerClassName = '__lichess-pgn-buttons-widget__';

    window.addEventListener('load', addButtons);

    const copyablesAddedObserver = new MutationObserver(handleTopMutations);
    copyablesAddedObserver.observe(document.body, { childList: true, subtree: true });

    function handleTopMutations(mutations) {
        const mutationsList = [...mutations];

        const shouldAddButtons = mutationsList.some((mutation) =>
            [...mutation.addedNodes].some(isCopyablesNode)
        );

        if (shouldAddButtons) {
            addButtons();
        }
    }

    function isCopyablesNode(node) {
        return node instanceof HTMLElement && node.matches(copyablesSelector);
    }

    function addButtons() {
        const pgnElem = document.querySelector(pgnContainerSelector);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add(buttonsContainerClassName);
        buttonsContainer.style.marginTop = '8px';
        buttonsContainer.style.display = 'flex';

        const copyPGNButton = createCopyPGNButton();
        copyPGNButton.style.marginRight = '5px';

        const uploadPGNButton = createUploadPGNButton();

        buttonsContainer.append(copyPGNButton, uploadPGNButton);

        pgnElem.after(buttonsContainer);
    }

    function createUploadPGNButton() {
        const uploadPGNButton = document.createElement('button');
        uploadPGNButton.innerText = 'Upload PGN';
        uploadPGNButton.style.padding = '3px';
        uploadPGNButton.style.marginTop = '8px';

        const fileUploader = document.createElement('input');
        fileUploader.type = 'file';
        fileUploader.accept = '.pgn';

        fileUploader.addEventListener('change', function handleFiles() {
            const file = this.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                const pgnTextAreaElem = document.querySelector(pgnTextAreaSelector);
                const importButton = document.querySelector(importButtonSelector);
                pgnTextAreaElem.value = reader.result;
                importButton.click();
            };

            reader.readAsText(file);
        });

        uploadPGNButton.addEventListener('click', () => {
            fileUploader.click();
        });

        return uploadPGNButton;
    }

    function createCopyPGNButton() {
        const copyPGNButton = document.createElement('button');
        copyPGNButton.innerText = 'Copy as SAN';
        copyPGNButton.style.padding = '3px';
        copyPGNButton.style.backgroundColor = 'rgb(192, 214, 167)';
        copyPGNButton.style.marginTop = '8px';

        copyPGNButton.addEventListener('click', () => {
            const pgnTextArea = document.querySelector(pgnTextAreaSelector);
            const uciMoves = pgnTextArea.value
                .split(/\d\.\s/)
                .filter((x) => x)
                .flatMap((x) => x.trim().split(' '));
            navigator.clipboard.writeText(`[${uciMoves.map((x) => `'${x}'`).join(', ')}]`);
        });

        return copyPGNButton;
    }
})();
