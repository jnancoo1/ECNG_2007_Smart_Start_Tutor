"use strict";

(function initialiseSmartStartShell(globalObject) {
  const body = document.body;
  const root = body.dataset.root || "";
  const section = body.dataset.section || "home";
  const title = body.dataset.title || "SmartStart Digital Electronics Tutor";

  const modules = [
    { id: "digital-foundations", number: "1", label: "Digital Foundations", status: "available" },
    { id: "logic-fundamentals", number: "2", label: "Logic Fundamentals", status: "available" },
    { id: "hardware-practice", number: "3", label: "Digital Hardware Practice", status: "available" },
    { id: "boolean-design", number: "4", label: "Boolean Design", status: "available" },
    { id: "combinational-blocks", number: "5", label: "Combinational Building Blocks", status: "available" },
    { id: "data-representation", number: "6", label: "Data Representation", status: "available" },
    { id: "arithmetic-comparison", number: "7", label: "Arithmetic and Comparison", status: "available" },
    { id: "sequential-logic", number: "8", label: "Sequential Logic", status: "available" }
  ];

  // Activity manifest, used to expand the open module in the sidebar.
  const activities = {
    "digital-foundations": [
      { n: "1.1", t: "Analogue and Digital Values", s: "analogue-digital" },
      { n: "1.2", t: "Integrated Circuits, Families and Packaging", s: "integrated-circuits" },
      { n: "1.3", t: "Logic Levels and Noise Margins", s: "logic-levels" },
      { n: "1.4", t: "Representing Two States", s: "two-state-representations" },
      { n: "1.5", t: "Bits", s: "bits" }
    ],
    "logic-fundamentals": [
      { n: "2.1", t: "The Three Basic Gates", s: "basic-gates" },
      { n: "2.2", t: "The Gate Family and De Morgan", s: "gate-family" },
      { n: "2.3", t: "Complete the Gate Truth Tables", s: "gate-truth-tables" },
      { n: "2.4", t: "Signal Flow Through a Circuit", s: "signal-flow" },
      { n: "2.5", t: "Using Digital Dataflow VHDL", s: "direct-dataflow-vhdl" },
      { n: "2.6", t: "Using Conditional Dataflow VHDL", s: "conditional-dataflow-vhdl" }
    ],
    "hardware-practice": [
      { n: "3.1", t: "MOSFETs and CMOS Logic", s: "mosfet-cmos" },
      { n: "3.2", t: "Diodes and Diode Elements", s: "diodes" },
      { n: "3.3", t: "TTL, CMOS and Interfacing", s: "logic-families" },
      { n: "3.4", t: "Unused and Floating Inputs", s: "floating-inputs" },
      { n: "3.5", t: "Shared Buses, Open Outputs and Tri-State Logic", s: "buses" },
      { n: "3.6", t: "Decoupling Capacitors and Breadboarding", s: "decoupling-breadboard" },
      { n: "3.7", t: "Schmitt Triggers, Protection Diodes and LEDs", s: "schmitt-protection-leds" }
    ],
    "boolean-design": [
      { n: "4.1", t: "Boolean Algebra and Duality", s: "algebra" },
      { n: "4.2", t: "Compound Truth Tables", s: "truth-tables" },
      { n: "4.3", t: "Minterms, Maxterms, SOP and POS", s: "canonical-forms" },
      { n: "4.4", t: "Karnaugh Maps", s: "karnaugh-maps" },
      { n: "4.5", t: "Logic Hazards", s: "hazards" },
      { n: "4.6", t: "Petrick’s Method", s: "petrick" },
      { n: "4.7", t: "Synthesis with Gates", s: "synthesis-with-gates" }
    ],
    "combinational-blocks": [
      { n: "5.1", t: "Binary Decoders", s: "decoder" },
      { n: "5.2", t: "Binary Encoders", s: "encoder" },
      { n: "5.3", t: "Multiplexers", s: "multiplexer" },
      { n: "5.4", t: "Demultiplexers", s: "demultiplexer" },
      { n: "5.5", t: "Decoder Applications", s: "decoder-applications" },
      { n: "5.6", t: "Logic Synthesis with Multiplexers", s: "mux-synthesis" },
      { n: "5.7", t: "3-bit Parity Generator", s: "parity" }
    ],
    "data-representation": [
      { n: "6.1", t: "Binary Values and Place Value", s: "binary-values" },
      { n: "6.2", t: "Number Systems and Base Conversion", s: "number-systems" },
      { n: "6.3", t: "Signed Number Representations", s: "signed-numbers" },
      { n: "6.4", t: "Fixed Point and Floating Point", s: "fixed-floating" },
      { n: "6.5", t: "IEEE 754 Floating-Point", s: "ieee754" },
      { n: "6.6", t: "Binary-Coded Decimal", s: "bcd" },
      { n: "6.7", t: "Gray Code and Rotary Encoding", s: "gray-code" },
      { n: "6.8", t: "ASCII Character Codes", s: "ascii" }
    ],
    "arithmetic-comparison": [
      { n: "7.1", t: "BCD and Hexadecimal Seven-Segment Displays", s: "seven-segment" },
      { n: "7.2", t: "Binary Comparators", s: "comparator" },
      { n: "7.3", t: "Half and Full Adders", s: "adders" },
      { n: "7.4", t: "Four-Bit Ripple-Carry Addition", s: "ripple-adder" },
      { n: "7.5", t: "Subtractors", s: "subtractor" },
      { n: "7.6", t: "Comparators Revisited", s: "comparator-internals" },
      { n: "7.7", t: "A Simple ALU", s: "alu" }
    ],
    "sequential-logic": [
      { n: "8.1", t: "Sequential Systems and Bistability", s: "bistability" },
      { n: "8.2", t: "The SR Latch", s: "sr-latch" },
      { n: "8.3", t: "D Latches, Enables and Clock Signals", s: "d-latch-clock" },
      { n: "8.4", t: "D and JK Flip-Flops", s: "flip-flops" },
      { n: "8.5", t: "Registers and the Two-Bit Counter", s: "registers-counter" },
      { n: "8.6", t: "Moore and Mealy State Machines", s: "moore-mealy" },
      { n: "8.7", t: "State Diagrams and Tables", s: "state-diagrams" },
      { n: "8.8", t: "Obtaining a State Diagram", s: "derive-state-diagram" },
      { n: "8.9", t: "Finite String Recogniser", s: "string-recognizer" },
      { n: "8.10", t: "Synthesis with Lookup Tables", s: "lut-synthesis" }
    ]
  };

  // Which activity is open, if any. Set explicitly by activity pages; otherwise
  // inferred from the last path segment so the sidebar still highlights correctly.
  const currentActivity = body.dataset.activity
    || (location.pathname.replace(/\/(index\.html)?$/, "").split("/").pop() || "");

  const sidebar = document.getElementById("site-sidebar");
  if (sidebar) {
    const moduleLinks = modules.map(module => {
      const open = section === module.id;
      const list = open && activities[module.id]
        ? `<div class="nav-sublist">` + activities[module.id].map(item => `
          <a class="nav-sublink ${item.s === currentActivity ? "current" : ""}" href="${root}activities/${module.id}/${item.s}/">
            <span class="nav-subnumber">${item.n}</span><span>${item.t}</span>
          </a>`).join("") + `</div>`
        : "";
      return `
      <a class="nav-link ${open ? "active" : ""}" href="${root}modules/${module.id}/"${open ? ' aria-current="true"' : ""}>
        <span class="nav-number">${module.number}</span>
        <span>${module.label}</span>
        <span class="nav-status ${module.status}" aria-label="${module.status}"></span>
      </a>${list}`;
    }).join("");

    sidebar.innerHTML = `
      <a class="sidebar-brand" href="${root}">
        <span class="sidebar-kicker">IEEE EDS Trinidad and Tobago</span>
        <span class="sidebar-title">SmartStart Digital Electronics Tutor</span>
        <span class="sidebar-edition">Interactive digital electronics</span>
      </a>
      <nav class="site-nav" aria-label="Tutor sections">
        <a class="nav-link ${section === "home" ? "active" : ""}" href="${root}">
          <span class="nav-number">⌂</span><span>Home</span><span></span>
        </a>
        <p class="nav-heading">Learning modules</p>
        ${moduleLinks}
        <p class="nav-heading">Tutor resources</p>
        <a class="nav-link ${section === "glossary" ? "active" : ""}" href="${root}glossary/"><span class="nav-number">A–Z</span><span>Glossary</span><span></span></a>
        <a class="nav-link ${section === "references" ? "active" : ""}" href="${root}references/"><span class="nav-number">↗</span><span>References</span><span></span></a>
        <a class="nav-link ${section === "about" ? "active" : ""}" href="${root}about/"><span class="nav-number">i</span><span>About &amp; credits</span><span></span></a>
      </nav>`;
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `SmartStart Digital Electronics Tutor · Neela Seegobin, original author · Azim Abdool, web edition · <a href="${root}about/">About &amp; credits</a>`;
  }

  const toolbarTitle = document.getElementById("toolbar-title");
  if (toolbarTitle) toolbarTitle.textContent = title;

  const menuButton = document.getElementById("menu-toggle");
  const scrim = document.getElementById("sidebar-scrim");
  const closeMenu = () => {
    sidebar?.classList.remove("open");
    scrim?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  };
  menuButton?.addEventListener("click", () => {
    const opening = !sidebar?.classList.contains("open");
    sidebar?.classList.toggle("open", opening);
    scrim?.classList.toggle("open", opening);
    menuButton.setAttribute("aria-expanded", String(opening));
  });
  scrim?.addEventListener("click", closeMenu);
  sidebar?.addEventListener("click", event => {
    if (event.target.closest("a") && window.matchMedia("(max-width: 980px)").matches) closeMenu();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

  const PROGRESS_KEY = "smartstart.tutor.progress.v1";

  // This tutor is normally embedded in an iframe on the chapter website. Browsers
  // partition or block third-party storage, so localStorage can silently fail.
  // Fall back to an in-memory store and tell the student what that means.
  let memoryStore = {};
  let durable = (() => {
    try {
      const probe = PROGRESS_KEY + ".probe";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch { return false; }
  })();

  // Activity ids that have been renamed. A student who completed the old
  // activity keeps credit for the one that replaced it.
  const RENAMED = {
    "bits-bytes": "bits",
    "hw-integrated-circuits": "integrated-circuits",
    "hw-electrical-limits": "logic-levels"
  };

  function applyRenames(progress) {
    Object.entries(RENAMED).forEach(([from, to]) => {
      if (progress[from] && !progress[to]) progress[to] = true;
    });
    return progress;
  }

  function loadProgress() {
    if (!durable) return applyRenames({ ...memoryStore });
    try { return applyRenames(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}")); }
    catch { durable = false; return applyRenames({ ...memoryStore }); }
  }
  function saveProgress(progress) {
    memoryStore = { ...progress };
    if (durable) {
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }
      catch { durable = false; }
    }
    document.dispatchEvent(new CustomEvent("smartstart:progress", { detail: progress }));
  }

  const Progress = {
    get(id) { return Boolean(loadProgress()[id]); },
    set(id, completed = true) { const p = loadProgress(); p[id] = Boolean(completed); saveProgress(p); },
    complete(id) { this.set(id, true); },
    all() { return loadProgress(); },
    count(ids) { const p = loadProgress(); return ids.filter(id => p[id]).length; },
    isDurable() { return durable; },
    export() { return JSON.stringify(loadProgress()); },
    import(text) {
      try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
        const clean = {};
        Object.keys(parsed).forEach(k => { if (parsed[k]) clean[k] = true; });
        saveProgress({ ...loadProgress(), ...clean });
        return true;
      } catch { return false; }
    },
    reset() { memoryStore = {}; saveProgress({}); }
  };
  globalObject.SmartStartProgress = Progress;

  function updateProgressViews() {
    const ids = [
      // Module 1. "digital-values" is retained as the id of activity 1.1 so
      // that progress saved before the module was split still counts.
      "digital-values", "integrated-circuits", "logic-levels", "two-state-representations", "bits",
      // Module 2. "logic-gates" likewise stays on activity 2.1.
      "logic-gates", "gate-family", "gate-truth-tables", "signal-flow", "direct-dataflow-vhdl", "conditional-dataflow-vhdl",
      "boolean-algebra", "boolean-truth-tables", "canonical-forms", "karnaugh-maps", "logic-hazards", "petrick-method", "synthesis-with-gates",
      "binary-values", "number-systems", "signed-numbers", "fixed-floating", "ieee754", "bcd", "gray-code", "ascii",
      "decoder", "encoder", "multiplexer", "demultiplexer", "decoder-applications", "mux-synthesis",
      "seven-segment", "comparator", "adders", "ripple-adder", "subtractor", "comparator-internals", "alu",
      "seq-bistable", "sr-latch", "d-latch-clock", "flip-flops", "registers-counter", "moore-mealy", "state-diagrams", "derive-state-diagram", "string-recognizer", "lut-synthesis",
      "hw-mosfet-cmos", "hw-diodes", "hw-logic-families", "hw-floating-inputs", "hw-buses", "hw-decoupling-breadboard", "hw-schmitt-protection-leds"
    ];
    const count = Progress.count(ids);
    document.querySelectorAll("[data-global-progress]").forEach(progress => {
      progress.max = ids.length;
      progress.value = count;
    });
    document.querySelectorAll("[data-global-progress-text]").forEach(node => {
      node.textContent = `${count} of ${ids.length} activities completed`;
    });
    document.querySelectorAll("[data-progress-id]").forEach(node => {
      const complete = Progress.get(node.dataset.progressId);
      node.textContent = complete ? "Completed" : node.dataset.incompleteLabel || "Available";
      node.classList.toggle("available", complete);
      node.classList.toggle("partial", !complete);
    });
    const toolbarProgress = document.getElementById("toolbar-progress");
    if (toolbarProgress) {
      toolbarProgress.hidden = false;
      toolbarProgress.textContent = `${count} of ${ids.length} activities complete`;
    }
    document.querySelectorAll("[data-storage-warning]").forEach(node => {
      node.hidden = Progress.isDurable();
    });
  }
  document.addEventListener("smartstart:progress", updateProgressViews);
  updateProgressViews();
})(globalThis);