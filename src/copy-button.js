(function init() {
    window.addEventListener('load', addCopyAsURIButton);

    function addCopyAsURIButton() {
        // add button to copy PGN
        const copyPGNButton = document.createElement('button');
        copyPGNButton.innerText = 'Copy as SAN';
        copyPGNButton.style.padding = '3px';
        copyPGNButton.style.backgroundColor = 'rgb(192, 214, 167)';
        copyPGNButton.style.marginTop = '8px';

        const pgnElem = document.querySelector('.pgn');
        pgnElem.append(copyPGNButton);

        copyPGNButton.addEventListener('click', () => {
            const pgnTextArea = document.querySelector('.pgn textarea');
            const uciMoves = pgnTextArea.value
                .split(/\d\.\s/)
                .filter((x) => x)
                .flatMap((x) => x.trim().split(' '));
            navigator.clipboard.writeText(`[${uciMoves.map((x) => `'${x}'`).join(', ')}]`);
        });
    }
})();
