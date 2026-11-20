document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------
  // Helper functions
  // ----------------------------------------

  function setBit(button, value) {
    button.setAttribute("aria-checked", String(value === 1));
    button.querySelector("span").textContent = String(value);
  }

  function getBit(button) {
    return button.getAttribute("aria-checked") === "true" ? 1 : 0;
  }

  function calculateGate(gate, a, b) {
    if (gate === "and") return a && b ? 1 : 0;
    if (gate === "or") return a || b ? 1 : 0;
    if (gate === "xor") return a !== b ? 1 : 0;
    return 0;
  }

  // ----------------------------------------
  // Inverter simulator
  // ----------------------------------------

  const notInput = document.getElementById("not-input");
  const notOutput = document.getElementById("not-output");
  const notStatus = document.getElementById("not-status");

  if (notInput) {
    function updateInverter() {
      const input = getBit(notInput);
      const output = input === 0 ? 1 : 0;

      notOutput.textContent = output;
      notStatus.textContent =
        `Input I is ${input}, so output O is ${output}.`;
    }

    notInput.addEventListener("click", () => {
      setBit(notInput, getBit(notInput) === 0 ? 1 : 0);
      updateInverter();
    });

    updateInverter();
  }

  // ----------------------------------------
  // AND, OR and XOR gate simulator
  // ----------------------------------------

  const gateChoice = document.getElementById("gate-choice");
  const gateA = document.getElementById("gate-a");
  const gateB = document.getElementById("gate-b");
  const gateOutput = document.getElementById("gate-output");
  const gateExpression = document.getElementById("gate-expression");
  const gateStatus = document.getElementById("gate-status");

  if (gateChoice && gateA && gateB) {
    function updateGate() {
      const gate = gateChoice.value;
      const a = getBit(gateA);
      const b = getBit(gateB);
      const output = calculateGate(gate, a, b);

      gateOutput.textContent = output;
      gateExpression.textContent = `Y <= A ${gate} B;`;

      gateStatus.textContent =
        `Input A is ${a} and input B is ${b}. ` +
        `The ${gate.toUpperCase()} gate produces an output of ${output}.`;
    }

    gateA.addEventListener("click", () => {
      setBit(gateA, getBit(gateA) === 0 ? 1 : 0);
      updateGate();
    });

    gateB.addEventListener("click", () => {
      setBit(gateB, getBit(gateB) === 0 ? 1 : 0);
      updateGate();
    });

    gateChoice.addEventListener("change", updateGate);

    updateGate();
  }

  // ----------------------------------------
  // VHDL code editor and basic code checker
  // ----------------------------------------

  const codeGate = document.getElementById("code-gate");
  const vhdlEditor = document.getElementById("vhdl-editor");
  const checkCode = document.getElementById("check-code");
  const resetCode = document.getElementById("reset-code");
  const codeFeedback = document.getElementById("code-feedback");

  const codeExamples = {
    and: `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity and_gate is
    port (
        A : in std_logic;
        B : in std_logic;
        Y : out std_logic
    );
end entity and_gate;

architecture dataflow of and_gate is
begin
    Y <= A and B;
end architecture dataflow;`,

    or: `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity or_gate is
    port (
        A : in std_logic;
        B : in std_logic;
        Y : out std_logic
    );
end entity or_gate;

architecture dataflow of or_gate is
begin
    Y <= A or B;
end architecture dataflow;`,

    xor: `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity xor_gate is
    port (
        A : in std_logic;
        B : in std_logic;
        Y : out std_logic
    );
end entity xor_gate;

architecture dataflow of xor_gate is
begin
    Y <= A xor B;
end architecture dataflow;`
  };

  if (codeGate && vhdlEditor) {
    codeGate.addEventListener("change", () => {
      vhdlEditor.value = codeExamples[codeGate.value];
      codeFeedback.textContent = "Example loaded. You can now edit the code.";
    });

    resetCode.addEventListener("click", () => {
      vhdlEditor.value = codeExamples[codeGate.value];
      codeFeedback.textContent = "The example code has been restored.";
    });

    checkCode.addEventListener("click", () => {
      const code = vhdlEditor.value.toLowerCase();
      const selectedGate = codeGate.value;

      const checks = [
        {
          name: "IEEE library included",
          passed: /library\s+ieee\s*;/i.test(code)
        },
        {
          name: "STD_LOGIC_1164 package included",
          passed: /use\s+ieee\.std_logic_1164\.all\s*;/i.test(code)
        },
        {
          name: "Entity declared",
          passed: /entity\s+\w+\s+is/i.test(code)
        },
        {
          name: "Inputs A and B declared",
          passed:
            /a\s*:\s*in\s+std_logic/i.test(code) &&
            /b\s*:\s*in\s+std_logic/i.test(code)
        },
        {
          name: "Output Y declared",
          passed: /y\s*:\s*out\s+std_logic/i.test(code)
        },
        {
          name: "Dataflow architecture declared",
          passed: /architecture\s+dataflow\s+of\s+\w+\s+is/i.test(code)
        },
        {
          name: "Correct gate assignment",
          passed: new RegExp(
            `y\\s*<=\\s*a\\s+${selectedGate}\\s+b\\s*;`,
            "i"
          ).test(code)
        },
        {
          name: "Architecture is closed",
          passed: /end\s+architecture\s+dataflow\s*;/i.test(code)
        }
      ];

      const passed = checks.filter(check => check.passed).length;
      const failed = checks.filter(check => !check.passed);

      if (passed === checks.length) {
        codeFeedback.textContent =
          `Excellent! ${passed}/${checks.length} checks passed. ` +
          "Your code contains the expected direct dataflow structure.";
      } else {
        codeFeedback.textContent =
          `${passed}/${checks.length} checks passed. ` +
          "Review these items: " +
          failed.map(check => check.name).join("; ") + ".";
      }
    });
  }

  // ----------------------------------------
  // Checklist progress
  // ----------------------------------------

  const checklist = document.getElementById("vhdl-checklist");
  const checklistFeedback = document.getElementById("checklist-feedback");

  if (checklist) {
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');

    function updateChecklist() {
      const completed = [...checkboxes].filter(box => box.checked).length;

      checklistFeedback.textContent =
        `${completed} of ${checkboxes.length} checklist items completed.`;

      if (completed === checkboxes.length) {
        checklistFeedback.textContent =
          "Great work! You have completed the entire checklist.";
      }
    }

    checkboxes.forEach(box => {
      box.addEventListener("change", updateChecklist);
    });
  }

  // ----------------------------------------
  // Knowledge check quiz
  // ----------------------------------------

  const quizForm = document.getElementById("quiz-form");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizClear = document.getElementById("quiz-clear");

  const correctAnswers = {
    q1: "b",
    q2: "c",
    q3: "a",
    q4: "b",
    q5: "a"
  };

  if (quizForm) {
    quizForm.addEventListener("submit", event => {
      event.preventDefault();

      let score = 0;
      let answered = 0;

      Object.keys(correctAnswers).forEach(question => {
        const selected = quizForm.querySelector(
          `input[name="${question}"]:checked`
        );

        if (selected) {
          answered++;

          if (selected.value === correctAnswers[question]) {
            score++;
          }
        }
      });

      if (answered < Object.keys(correctAnswers).length) {
        quizFeedback.textContent =
          `You have answered ${answered} of 5 questions. ` +
          "Please answer every question before checking.";
        return;
      }

      quizFeedback.textContent =
        `You scored ${score} out of 5. ` +
        (score === 5
          ? "Excellent work! You understand the key concepts."
          : "Review the explanations and try again.");
    });

    quizClear.addEventListener("click", () => {
      quizForm.reset();
      quizFeedback.textContent =
        "Your answers have been cleared. Try again!";
    });
  }
});