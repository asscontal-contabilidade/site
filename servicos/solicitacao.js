(function () {
    "use strict";

    var grid =
        document.getElementById("requestGrid");

    var template =
        document.getElementById("slipTemplate");

    var printButton =
        document.getElementById("printButton");

    if (!grid || !template) {
        return;
    }

    /*
     * Cria as seis solicitações:
     * duas colunas e três linhas.
     */
    for (var index = 0; index < 6; index += 1) {
        grid.appendChild(
            template.content.cloneNode(true)
        );
    }

    /*
     * Abre a janela de impressão.
     */
    if (printButton) {
        printButton.addEventListener(
            "click",
            function () {
                window.print();
            }
        );
    }
})();
