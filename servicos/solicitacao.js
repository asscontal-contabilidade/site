(function () {
    "use strict";

    var grid = document.getElementById("requestGrid");
    var template = document.getElementById("slipTemplate");
    var printButton = document.getElementById("printButton");

    if (!grid || !template) return;

    for (var index = 0; index < 6; index += 1) {
        grid.appendChild(template.content.cloneNode(true));
    }

    if (printButton) {
        printButton.addEventListener("click", function () {
            window.print();
        });
    }
})();
