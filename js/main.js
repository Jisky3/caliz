const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#nav");
const storageKey = "caliz-interes-v2";

const closeNav = () => {
  nav.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "Menú";
};

toggle.addEventListener("click", () => {
  const open = !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Cerrar" : "Menú";
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    closeNav();
    toggle.focus();
  }
});

const paintHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
paintHeader();
window.addEventListener("scroll", paintHeader, { passive: true });

document.querySelectorAll(".acordeon button").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });
});

const note = document.querySelector("#interes-nota");
const form = document.querySelector("#interes-form");
const names = {
  kit: "Kit completo",
  plenitud: "Plenitud",
  foco: "Foco",
  ligereza: "Ligereza"
};
const legacy = {
  "01-manana": "plenitud",
  "02-tarde": "foco",
  "03-noche": "ligereza"
};

const readInterest = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch (error) {
    return null;
  }
};

const clampQty = (value) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, n);
};

const rows = () => [...form.querySelectorAll(".opcion")];

const setRow = (row, on, qty) => {
  const box = row.querySelector('input[type="checkbox"]');
  const qtyInput = row.querySelector(".qty-valor");
  const minus = row.querySelector(".qty-menos");
  const plus = row.querySelector(".qty-mas");
  const amount = clampQty(qty);
  box.checked = on;
  qtyInput.value = String(on ? amount : 1);
  qtyInput.disabled = !on;
  minus.disabled = !on || amount <= 1;
  plus.disabled = !on || amount >= 99;
  row.classList.toggle("is-on", on);
};

const collect = () => rows()
  .filter((row) => row.querySelector('input[type="checkbox"]').checked)
  .map((row) => ({
    id: row.dataset.id,
    qty: clampQty(row.querySelector(".qty-valor").value)
  }));

const showSaved = (items) => {
  const text = items.map((item) => `${names[item.id]} × ${item.qty}`).join(", ");
  note.textContent = `Tu interés se guardó en este navegador. ${text}.`;
};

const applyRecord = (data) => {
  rows().forEach((row) => setRow(row, false, 1));
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.items)) {
    const items = data.items
      .filter((item) => item && names[item.id])
      .map((item) => ({ id: item.id, qty: clampQty(item.qty) }));
    items.forEach((item) => setRow(form.querySelector(`.opcion[data-id="${item.id}"]`), true, item.qty));
    return items;
  }
  const legacyId = names[data.producto] ? data.producto : legacy[data.momento];
  if (!legacyId) return [];
  setRow(form.querySelector(`.opcion[data-id="${legacyId}"]`), true, 1);
  return [{ id: legacyId, qty: 1 }];
};

rows().forEach((row) => {
  const box = row.querySelector('input[type="checkbox"]');
  const qtyInput = row.querySelector(".qty-valor");
  box.addEventListener("change", () => setRow(row, box.checked, 1));
  row.querySelector(".qty-menos").addEventListener("click", () => {
    setRow(row, true, clampQty(qtyInput.value) - 1);
  });
  row.querySelector(".qty-mas").addEventListener("click", () => {
    setRow(row, true, clampQty(qtyInput.value) + 1);
  });
  qtyInput.addEventListener("input", () => {
    qtyInput.value = qtyInput.value.replace(/\D/g, "").slice(0, 2);
    const amount = qtyInput.value === "" ? 0 : clampQty(qtyInput.value);
    row.querySelector(".qty-menos").disabled = amount <= 1;
    row.querySelector(".qty-mas").disabled = amount >= 99;
  });
  qtyInput.addEventListener("blur", () => {
    if (box.checked) setRow(row, true, clampQty(qtyInput.value));
  });
});

const restored = applyRecord(readInterest());
if (restored.length) showSaved(restored);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const items = collect();
  if (!items.length) {
    note.textContent = "Elige al menos un producto para guardar tu interés.";
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify({ items, guardado: new Date().toISOString() }));
    const saved = applyRecord(readInterest());
    if (saved.length) showSaved(saved);
  } catch (error) {
    note.textContent = "No se pudo guardar en este navegador.";
  }
});

const pasos = [
  { x: "40%", c: "rgba(226, 179, 64, 0.48)", frase: "Tu primera taza del día." },
  { x: "63%", c: "rgba(213, 114, 45, 0.5)", frase: "Una infusión a mitad de jornada." },
  { x: "84%", c: "rgba(62, 111, 147, 0.5)", frase: "La última taza de tu ritual." }
];
const cicloBtns = [...document.querySelectorAll(".ciclo-btn")];
const fraseEl = document.querySelector("#ciclo-frase");
const luz = document.querySelector(".foco-luz");
let cicloTl = null;

const marcarPaso = (index) => {
  const paso = pasos[index];
  if (!paso) return;
  cicloBtns.forEach((btn, i) => {
    const on = i === index;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  if (fraseEl) fraseEl.textContent = paso.frase;
};

const ponerLuz = (index) => {
  const paso = pasos[index];
  if (!luz || !paso) return;
  luz.style.setProperty("--luz-x", paso.x);
  luz.style.setProperty("--luz-c", paso.c);
};

cicloBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const index = Number(btn.dataset.moment);
    if (cicloTl) cicloTl.pause();
    marcarPaso(index);
    ponerLuz(index);
  });
});

const quiet = new URLSearchParams(location.search).has("quiet");

if (window.gsap && !quiet) {
  const mountMotion = () => {
    document.documentElement.classList.add("motion");

    const abrir = gsap.timeline({
      id: "hero-abre",
      defaults: { ease: "power3.out" },
      onComplete() {
        gsap.set(".line span, .hero .kicker, .hero .lede, .hero .actions a", {
          clearProps: "transform,opacity,visibility"
        });
        document.documentElement.classList.add("motion-done");
      }
    });
    abrir
      .from(".hero .kicker", { autoAlpha: 0, y: 22, duration: 0.7 }, 0.05)
      .from(".line span", { yPercent: 120, duration: 1.05, stagger: 0.16, immediateRender: true }, 0.12)
      .from(".hero .lede", { autoAlpha: 0, y: 18, duration: 0.75 }, 0.5)
      .from(".hero .actions a", { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.1 }, 0.72);

    if (luz && cicloBtns.length === pasos.length) {
      ponerLuz(0);
      cicloTl = gsap.timeline({
        id: "ciclo-luz",
        repeat: -1,
        defaults: { duration: 1.7, ease: "sine.inOut" }
      });
      pasos.forEach((paso, index) => {
        cicloTl.to(luz, {
          "--luz-x": paso.x,
          "--luz-c": paso.c,
          onStart() { marcarPaso(index); }
        }, index === 0 ? 0 : "+=2.2");
      });
    }

    gsap.to(".ico-sol", {
      rotation: 360,
      duration: 28,
      repeat: -1,
      ease: "none",
      transformOrigin: "50% 50%"
    });

    return () => {
      cicloTl = null;
      document.documentElement.classList.remove("motion", "motion-done");
    };
  };

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => mountMotion());
}
