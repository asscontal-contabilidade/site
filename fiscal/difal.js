(function () {
    "use strict";

    var valorOpInput = document.getElementById("valorOp");
    var aliqInterSelect = document.getElementById("aliqInter");
    var aliqIntraInput = document.getElementById("aliqIntra");
    var validationMessage =
        document.getElementById("validationMessage");

    function parseNumeroBR(valor) {
        if (valor === null || valor === undefined) {
            return 0;
        }

        var texto = String(valor)
            .trim()
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
            .replace(/[^\d.-]/g, "");

        var numero = Number(texto);

        return Number.isFinite(numero) ? numero : 0;
    }

    function formatarNumeroBR(numero) {
        return Number(numero).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatarPercentual(numero) {
        return formatarNumeroBR(numero) + "%";
    }

    function formatarCampoMoeda(elemento) {
        var somenteNumeros =
            elemento.value.replace(/\D/g, "");

        if (somenteNumeros === "") {
            elemento.value = "";
            return;
        }

        elemento.value = formatarNumeroBR(
            Number(somenteNumeros) / 100
        );
    }

    function limparCampoPercentual(elemento) {
        var valor = elemento.value
            .replace(/[^\d,.]/g, "")
            .replace(/\./g, ",");

        var partes = valor.split(",");

        if (partes.length > 2) {
            valor = partes.shift() + "," + partes.join("");
        }

        elemento.value = valor;
    }

    function mostrarErro(mensagem) {
        if (!validationMessage) {
            return;
        }

        validationMessage.textContent = mensagem;
        validationMessage.hidden = false;
    }

    function esconderErro() {
        if (!validationMessage) {
            return;
        }

        validationMessage.textContent = "";
        validationMessage.hidden = true;
    }

    function atualizarCelula(id, valor) {
        var elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function calcularDIFAL() {
        var valorOp = parseNumeroBR(valorOpInput.value);
        var aliqInter =
            Number(aliqInterSelect.value) || 0;
        var aliqIntra =
            parseNumeroBR(aliqIntraInput.value);

        esconderErro();

        if (valorOp <= 0) {
            mostrarErro(
                "Informe um valor de operação maior que zero."
            );
            return;
        }

        if (aliqIntra <= 0 || aliqIntra >= 100) {
            mostrarErro(
                "Informe uma alíquota interna entre 0 e 100%."
            );
            return;
        }

        var icmsOrigem =
            valorOp * (aliqInter / 100);

        var valorSemIcms =
            valorOp - icmsOrigem;

        var fatorDivisor =
            1 - (aliqIntra / 100);

        var baseCalculoDupla =
            valorSemIcms / fatorDivisor;

        var icmsDestino =
            baseCalculoDupla * (aliqIntra / 100);

        var difal =
            icmsDestino - icmsOrigem;

        document.getElementById("tituloTabela").textContent =
            "DIFAL ES - " +
            formatarNumeroBR(aliqInter) +
            "%";

        atualizarCelula(
            "r1c1",
            formatarNumeroBR(valorOp)
        );

        atualizarCelula(
            "r1c2",
            formatarPercentual(aliqInter)
        );

        atualizarCelula(
            "r1c3",
            formatarNumeroBR(icmsOrigem)
        );

        atualizarCelula(
            "r2c1",
            formatarNumeroBR(valorSemIcms)
        );

        atualizarCelula(
            "r3c1",
            formatarNumeroBR(valorSemIcms)
        );

        atualizarCelula(
            "r3c2",
            fatorDivisor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        );

        atualizarCelula(
            "r3c3",
            formatarNumeroBR(baseCalculoDupla)
        );

        atualizarCelula(
            "r4c1",
            formatarNumeroBR(baseCalculoDupla)
        );

        atualizarCelula(
            "r4c2",
            formatarPercentual(aliqIntra)
        );

        atualizarCelula(
            "r4c3",
            formatarNumeroBR(icmsDestino)
        );

        atualizarCelula(
            "r5c1",
            formatarNumeroBR(icmsDestino)
        );

        atualizarCelula(
            "r5c2",
            formatarNumeroBR(icmsOrigem)
        );

        atualizarCelula(
            "r5c3",
            formatarNumeroBR(difal)
        );
    }

    valorOpInput.addEventListener("input", function () {
        formatarCampoMoeda(valorOpInput);
        calcularDIFAL();
    });

    aliqInterSelect.addEventListener(
        "change",
        calcularDIFAL
    );

    aliqIntraInput.addEventListener(
        "input",
        function () {
            limparCampoPercentual(aliqIntraInput);
            calcularDIFAL();
        }
    );

    aliqIntraInput.addEventListener(
        "blur",
        function () {
            var percentual =
                parseNumeroBR(aliqIntraInput.value);

            if (percentual > 0 && percentual < 100) {
                aliqIntraInput.value =
                    formatarNumeroBR(percentual);
            }

            calcularDIFAL();
        }
    );

    calcularDIFAL();
})();
