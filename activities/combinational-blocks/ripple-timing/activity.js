"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const bit = (x, i) => (x >>> i) & 1;
  const parseHex = (text, n) => {
    let v = parseInt(text, 16);
    if (Number.isNaN(v)) v = 0;
    const mask = n >= 32 ? 0xFFFFFFFF : (1 << n) - 1;
    return (v & mask) >>> 0;
  };

  const done = { challenge: false, quiz: false };
  function maybeComplete() {
    if (done.challenge && done.quiz) globalThis.SmartStartProgress?.complete("ripple-timing");
  }

  // ---------------------------------------------- Part 1: carry-chain explorer
  let cin = 0, last = null, timer = null;
  const cinSwitch = $("#rt-cin");
  cinSwitch.addEventListener("click", () => {
    cin = Number(!cin);
    cinSwitch.textContent = String(cin);
    cinSwitch.classList.toggle("on", Boolean(cin));
    run();
  });

  // Model: every input changes at t = 0 and each stage takes one delay.
  // A Generate or Kill stage settles its carry locally (time 1);
  // a Propagate stage passes the carry on one delay after it arrives.
  function model(a, b, c, n) {
    const rows = [];
    let carry = c, tin = 0;
    for (let i = 0; i < n; i += 1) {
      const A = bit(a, i), B = bit(b, i);
      const g = A & B, p = A ^ B;
      const sum = p ^ carry, cout = g | (p & carry);
      const tout = p ? tin + 1 : 1;
      rows.push({ A, B, cin: carry, sum, cout, tin, tsum: tin + 1, tout, type: g ? "G" : p ? "P" : "K" });
      carry = cout; tin = tout;
    }
    return rows;
  }

  function draw(now) {
    $("#rt-now-value").textContent = String(now);
    $("#rt-stages").innerHTML = last.rows.map((x, i) => {
      const state = now >= x.tout ? " settled" : (now >= x.tin ? " active" : "");
      return `<div class="output-card${state}"><strong>${i}</strong><div class="rt-type rt-${x.type}">${x.type}</div>` +
        `<div>a${x.A} b${x.B}</div><div>cin ${x.cin}</div><div>cout ${x.cout}</div><div>sum ${x.sum}</div></div>`;
    }).join("");
  }

  function run() {
    const n = Number($("#rt-n").value), T = Number($("#rt-t").value);
    $("#rt-n-value").textContent = String(n);
    $("#rt-t-value").textContent = T.toFixed(1);
    const a = parseHex($("#rt-a").value, n), b = parseHex($("#rt-b").value, n);
    const rows = model(a, b, cin, n);
    const settle = rows.reduce((m, x) => Math.max(m, x.tsum, x.tout), 0);
    last = { rows, n, a, b, settle };
    const slider = $("#rt-now");
    slider.max = String(settle);
    draw(Math.min(Number(slider.value), settle));
    const total = rows.reduce((t, x, i) => t + x.sum * 2 ** i, 0);
    $("#rt-result").textContent = `${total.toString(16).toUpperCase().padStart(Math.ceil(n / 4), "0")}, carry out ${rows[n - 1].cout}`;
    $("#rt-valid").textContent = `${settle} delays = ${(settle * T).toFixed(1)} ns`;
    $("#rt-worst").textContent = `${n} delays = ${(n * T).toFixed(1)} ns`;
  }

  ["#rt-n", "#rt-t", "#rt-a", "#rt-b"].forEach(id => $(id).addEventListener("input", run));
  $("#rt-now").addEventListener("input", () => draw(Number($("#rt-now").value)));
  $("#rt-play").addEventListener("click", () => {
    clearInterval(timer);
    let v = 0;
    $("#rt-now").value = "0"; draw(0);
    timer = setInterval(() => {
      v += 0.5;
      $("#rt-now").value = String(v); draw(v);
      if (v >= last.settle) clearInterval(timer);
    }, 120);
  });

  const presets = { best: ["0001", "0000", 0], worst: ["FFFFFFFF", "1", 0], alt: ["AAAAAAAA", "55555555", 1] };
  document.querySelectorAll("[data-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const [a, b, c] = presets[button.dataset.preset];
      $("#rt-a").value = a; $("#rt-b").value = b;
      if (cin !== c) cinSwitch.click(); else run();
      $("#rt-now").value = "0"; run();
    });
  });
  run();

  // -------------------------------------------------------- Part 2: challenge
  const chalFeedback = $("#rt-chal-feedback");
  $("#rt-chal-check").addEventListener("click", () => {
    if (last.n !== 16) {
      chalFeedback.className = "feedback incorrect";
      chalFeedback.textContent = "Set the width to 16 bits first.";
    } else if (last.a === 0xFFFF) {
      chalFeedback.className = "feedback incorrect";
      chalFeedback.textContent = "That uses A = FFFF. Find a different pair of operands.";
    } else if (last.settle === 16) {
      done.challenge = true;
      chalFeedback.className = "feedback correct";
      chalFeedback.textContent = done.quiz
        ? "Correct: the carry ripples through all sixteen stages. Ripple-Carry Timing is complete."
        : "Correct: the carry ripples through all sixteen stages. Answer the Part 4 questions to finish this activity.";
      maybeComplete();
    } else {
      chalFeedback.className = "feedback incorrect";
      chalFeedback.textContent = `These inputs settle in ${last.settle} of 16 stage delays. You need a Generate stage at bit 0 with Propagate stages above it, or a carry in with every stage propagating.`;
    }
  });

  // ---------------------------------------------------------- Part 4: quiz
  const quizFeedback = $("#rt-quiz-feedback");
  $("#rt-quiz-check").addEventListener("click", () => {
    const q1 = document.querySelector("input[name=q1]:checked")?.value;
    const q2 = document.querySelector("input[name=q2]:checked")?.value;
    if (!q1 || !q2) {
      quizFeedback.className = "feedback incorrect";
      quizFeedback.textContent = "Answer both questions before checking.";
      return;
    }
    if (q1 === "path" && q2 === "cout") {
      done.quiz = true;
      quizFeedback.className = "feedback correct";
      quizFeedback.textContent = done.challenge
        ? "Both correct. Ripple-Carry Timing is complete."
        : "Both correct. Complete the Part 2 challenge to finish this activity.";
      maybeComplete();
      return;
    }
    quizFeedback.className = "feedback incorrect";
    if (q1 !== "path" && q2 !== "cout") quizFeedback.textContent = "Neither is right yet. Each stage waits for the carry from the stage before it, and the shared carry wire links one block to the next.";
    else if (q1 !== "path") quizFeedback.textContent = "The second answer is right. For the first, consider what each stage must wait for.";
    else quizFeedback.textContent = "The first answer is right. For the second, which output of stage i is the input of stage i+1?";
  });
})();
