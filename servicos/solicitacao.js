(function () {
    "use strict";

    var form = document.getElementById("requestForm");
    var description = document.getElementById("description");
    var counter = document.getElementById("characterCounter");
    var dateField = document.getElementById("requestDate");
    var printButton = document.getElementById("printButton");
    var clearButton = document.getElementById("clearButton");

    if (!form || !description || !counter || !dateField || !printButton || !clearButton) {
        return;
    }

    function getLocalDateValue() {
        var now = new Date();
        var offset = now.getTimezoneOffset();
        var localDate = new Date(now.getTime() - offset * 60000);
        return localDate.toISOString().slice(0, 10);
    }

    function updateCounter() {
        counter.textContent = description.value.length + "/1200";
    }

    function setInitialDate() {
        if (!dateField.value) {
            dateField.value = getLocalDateValue();
        }
    }

    function printRequest() {
        if (!form.reportValidity()) {
            return;
        }

        window.print();
    }

    function clearRequest() {
        var hasContent = Array.prototype.some.call(form.elements, function (field) {
            return field.type !== "date" && typeof field.value === "string" && field.value.trim() !== "";
        });

        if (hasContent && !window.confirm("Deseja limpar todos os campos da solicitação?")) {
            return;
        }

        form.reset();
        setInitialDate();
        updateCounter();
        document.getElementById("recipient").focus();
    }

    description.addEventListener("input", updateCounter);
    printButton.addEventListener("click", printRequest);
    clearButton.addEventListener("click", clearRequest);

    setInitialDate();
    updateCounter();
})();

