// Buscador del índice de la enciclopedia (sin dependencias): por nombre o marca y, si no hay ninguno, por familia. Sin tildes.
const q = document.querySelector("#q"), cuenta = document.querySelector("#cuenta"), items = [...document.querySelectorAll("ul.indice li")];
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const propio = items.map((li) => norm(li.dataset.b || li.textContent)), familia = items.map((li) => norm(li.dataset.f || ""));
function filtrar() {
  const t = norm(q.value.trim()); let n = 0;
  const porNombre = !!t && propio.some((x) => x.includes(t));
  items.forEach((li, i) => { const ok = !t || (porNombre ? propio[i].includes(t) : familia[i].includes(t)); li.hidden = !ok; if (ok) n++; });
  document.querySelectorAll("section.grupo").forEach((s) => { s.hidden = !s.querySelector("li:not([hidden])"); });
  document.querySelector(".letras").hidden = !!t;
  cuenta.textContent = t ? (n ? n + (n === 1 ? " resultado" : " resultados") : "Sin resultados: pruebe con otro nombre o con la marca.") : "";
}
q.addEventListener("input", filtrar);
if (q.value) filtrar();
