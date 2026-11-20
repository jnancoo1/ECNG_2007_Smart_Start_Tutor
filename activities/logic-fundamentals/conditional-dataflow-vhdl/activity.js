"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const byId = (id) => document.getElementById(id);


    // =====================================
    // 1. TWO-BIT VECTOR READER
    // =====================================

    const vectorPicker = byId("vector-picker");
    const vectorReading = byId("vector-reading");

    function updateVectorReading() {

        const value = vectorPicker.value;

        vectorReading.textContent =
            `I(1) = '${value[0]}' and I(0) = '${value[1]}'.`;
    }

    vectorPicker.addEventListener(
        "change",
        updateVectorReading
    );

    updateVectorReading();


    // =====================================
    // 2. EQUALITY DETECTOR SIMULATOR
    // =====================================

    const equalityInput = byId("equality-input");
    const equalityOutput = byId("equality-output");
    const equalityExplanation =
        byId("equality-explanation");

    function updateEqualityOutput() {

        const value = equalityInput.value;

        if (value === "000" || value === "111") {

            equalityOutput.textContent = "'1'";

            equalityExplanation.textContent =
                `All three inputs in ${value} are equal.`;

        }

        else if (/^[01]{3}$/.test(value)) {

            equalityOutput.textContent = "'0'";

            equalityExplanation.textContent =
                `The inputs in ${value} are not all equal.`;

        }

        else {

            equalityOutput.textContent = "'X'";

            equalityExplanation.textContent =
                "The input contains a non-binary state. " +
                "The example architecture assigns 'X'.";

        }
    }

    equalityInput.addEventListener(
        "change",
        updateEqualityOutput
    );

    updateEqualityOutput();


    // =====================================
    // 3. EXAMPLE VHDL ANSWERS
    // =====================================

    const selectAnswer = `architecture conditional_with_select of equality_detector is
begin
    with I select
        Y <= '1' when "000",
             '0' when "001",
             '0' when "010",
             '0' when "011",
             '0' when "100",
             '0' when "101",
             '0' when "110",
             '1' when "111",
             'X' when others;
end architecture conditional_with_select;`;


    const elseAnswer = `architecture conditional_when_else of equality_detector is
begin
    Y <= '1' when I = "000" or I = "111" else
         '0' when I = "001" or I = "010" or
                  I = "011" or I = "100" or
                  I = "101" or I = "110" else
         'X';
end architecture conditional_when_else;`;


    // =====================================
    // 4. NORMALISE STUDENT CODE
    // =====================================

    function normalise(source) {

        return source
            .toLowerCase()
            .replace(/--[^\n]*/g, " ")
            .replace(/\s+/g, " ")
            .replace(/\s*([(),;=])\s*/g, "$1")
            .trim();

    }


    // =====================================
    // 5. CHECK WITH SELECT ARCHITECTURE
    // =====================================

    function checkSelectedCode() {

        const source = normalise(
            byId("select-code").value
        );

        const feedback = byId("select-feedback");

        if (!source) {

            feedback.textContent =
                "Enter your VHDL architecture first.";

            return;
        }

        const vectors = [
            "000", "001", "010", "011",
            "100", "101", "110", "111"
        ];

        const missing = vectors.filter(
            value => !source.includes(`"${value}"`)
        );

        const hasSelect =
            source.includes("with i select");

        const hasOthers =
            source.includes("when others");

        const hasCorrectOnes =
            /'1'\s+when\s+"000"/.test(source) &&
            /'1'\s+when\s+"111"/.test(source);

        const hasCorrectZeros = [
            "001", "010", "011",
            "100", "101", "110"
        ].every(value =>
            new RegExp(
                `'0'\\s+when\\s+"${value}"`
            ).test(source)
        );

        const hasOutput =
            source.includes("y <=");

        const noProcess =
            !/\bprocess\b/.test(source);

        const noForbidden =
            !/\b(if|case|and|or|xor|not)\b/.test(source);


        const problems = [];

        if (!hasSelect)
            problems.push("Start with with I select.");

        if (!hasOutput)
            problems.push("Assign the selected values to Y.");

        if (missing.length > 0)
            problems.push(
                "Missing vectors: " + missing.join(", ")
            );

        if (!hasCorrectOnes)
            problems.push(
                'Only "000" and "111" should produce \'1\'.'
            );

        if (!hasCorrectZeros)
            problems.push(
                "Check the six remaining binary outputs."
            );

        if (!hasOthers)
            problems.push("Include when others.");

        if (!noProcess)
            problems.push("Do not use a process.");

        if (!noForbidden)
            problems.push(
                "Remove prohibited keywords."
            );


        if (problems.length === 0) {

            feedback.textContent =
                "Excellent! Your architecture includes " +
                "all eight binary inputs, the correct outputs, " +
                "and when others.";

            feedback.dataset.status = "success";

        }

        else {

            feedback.textContent =
                "Not quite yet: " + problems.join(" ");

            feedback.dataset.status = "warning";

        }

    }


    // =====================================
    // 6. CHECK WHEN ELSE ARCHITECTURE
    // =====================================

    function checkElseCode() {

        const source = normalise(
            byId("else-code").value
        );

        const feedback = byId("else-feedback");

        if (!source) {

            feedback.textContent =
                "Enter your conditional assignment first.";

            return;
        }

        const hasBothOnes =
            source.includes('i="000"') &&
            source.includes('i="111"');

        const hasElse =
            source.includes(" else");

        const hasFinalX =
            /else\s*'x'\s*;/.test(source);

        const hasZeroCases = [
            "001", "010", "011",
            "100", "101", "110"
        ].every(value =>
            source.includes(`i="${value}"`)
        );

        const noProcess =
            !/\bprocess\b/.test(source);

        const noForbidden =
            !/\b(if|case|and|xor|not)\b/.test(source);


        const problems = [];

        if (!hasBothOnes)
            problems.push(
                'Include I = "000" and I = "111".'
            );

        if (!hasElse)
            problems.push(
                "Use the when ... else form."
            );

        if (!hasZeroCases)
            problems.push(
                "Include all six other binary combinations."
            );

        if (!hasFinalX)
            problems.push(
                "Use 'X' as the final value."
            );

        if (!noProcess)
            problems.push(
                "Do not use a process."
            );

        if (!noForbidden)
            problems.push(
                "Remove prohibited keywords."
            );


        if (problems.length === 0) {

            feedback.textContent =
                "Good work! Both equal vectors, the other " +
                "six binary vectors, and non-binary values " +
                "are accounted for.";

            feedback.dataset.status = "success";

        }

        else {

            feedback.textContent =
                "Review these points: " +
                problems.join(" ");

            feedback.dataset.status = "warning";

        }

    }


    // =====================================
    // 7. SELECTED ASSIGNMENT BUTTONS
    // =====================================

    byId("check-select").addEventListener(
        "click",
        checkSelectedCode
    );

    byId("show-select").addEventListener(
        "click",
        () => {

            byId("select-code").value = selectAnswer;

            byId("select-feedback").textContent =
                "Example answer displayed. Compare each choice with the truth table.";

        }
    );

    byId("reset-select").addEventListener(
        "click",
        () => {

            byId("select-code").value = "";

            byId("select-feedback").textContent =
                "Editor cleared. Try again.";

        }
    );


    // =====================================
    // 8. WHEN ELSE BUTTONS
    // =====================================

    byId("check-else").addEventListener(
        "click",
        checkElseCode
    );

    byId("show-else").addEventListener(
        "click",
        () => {

            byId("else-code").value = elseAnswer;

            byId("else-feedback").textContent =
                "Example answer displayed. Notice how the two '1' cases are grouped.";

        }
    );

    byId("reset-else").addEventListener(
        "click",
        () => {

            byId("else-code").value = "";

            byId("else-feedback").textContent =
                "Editor cleared. Try the extension again.";

        }
    );


    // =====================================
    // 9. KNOWLEDGE CHECK
    // =====================================

    const quiz = byId("knowledge-check");

    quiz.addEventListener("submit", (event) => {

        event.preventDefault();

        const questions = [
            ...quiz.querySelectorAll(
                "fieldset[data-answer]"
            )
        ];

        let correct = 0;
        let unanswered = 0;

        questions.forEach(question => {

            const selected =
                question.querySelector(
                    "input[type=radio]:checked"
                );

            if (!selected) {

                unanswered++;

                question.dataset.result =
                    "unanswered";

            }

            else if (
                selected.value === question.dataset.answer
            ) {

                correct++;

                question.dataset.result =
                    "correct";

            }

            else {

                question.dataset.result =
                    "incorrect";

            }

        });


        const feedback = byId("quiz-feedback");

        if (unanswered > 0) {

            feedback.textContent =
                `You have answered ${
                    questions.length - unanswered
                } out of ${questions.length}. ` +
                `Complete the remaining ${unanswered} questions.`;

        }

        else {

            feedback.textContent =
                `Your score: ${correct} / ${questions.length}. ` +
                (
                    correct === questions.length
                    ? "Excellent work! All answers are correct."
                    : "Review the questions and try again."
                );

        }

    });

});