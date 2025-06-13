// productos.js
import { cargarProductosDesdeFirebase } from "./firebase.js";
import { addToCart, getCarrito, removeFromCart } from "./carrito.js";

const catalog = document.getElementById("productCatalog");
const carritoProductos = document.getElementById("carritoProductos");
const loadingIndicator = document.getElementById("loadingIndicator");
const btnLoadMore = document.createElement("button");
btnLoadMore.textContent = "Cargar más";

let products = [];
let page = 1;
const pageSize = 100;

function cacheExpirado(horas = 12) {
  const ts = localStorage.getItem("productos_timestamp");
  return !ts || (Date.now() - parseInt(ts)) > horas * 3600000;
}

export async function cargarProductos() {
  try {
    loadingIndicator.style.display = 'block';
    const productosGuardados = localStorage.getItem("productos_light");

    if (productosGuardados && !cacheExpirado()) {
      const light = JSON.parse(productosGuardados);
      products = light.map(p => ({ ...p, image: "img/cargando.jpg" }));
      renderProducts();

      const data = await cargarProductosDesdeFirebase();
      products.forEach(p => { p.image = data[p.code]?.image || "img/sinimagen.jpg"; });
      renderProducts();
    } else {
      const data = await cargarProductosDesdeFirebase();
      products = Object.keys(data).map(k => ({
        name: data[k].name,
        category: data[k].category,
        code: k,
        image: data[k].image || "img/sinimagen.jpg"
      }));
      const light = products.map(p => ({ name: p.name, category: p.category, code: p.code }));
      localStorage.setItem("productos_light", JSON.stringify(light));
      localStorage.setItem("productos_timestamp", Date.now().toString());
      renderProducts();
    }
    loadingIndicator.style.display = 'none';
  } catch (err) {
    loadingIndicator.style.display = 'none';
    console.error("Error cargando productos:", err);
  }
}

export function renderProducts(filter = "") {
  catalog.innerHTML = "";
  page = 1;
  btnLoadMore.remove();

  const terms = filter.toLowerCase().split(" ").filter(Boolean);
  const filtered = products.filter(p =>
    terms.every(t =>
      p.name.toLowerCase().includes(t) ||
      p.category.toLowerCase().includes(t) ||
      p.code.toLowerCase().includes(t)
    )
  );

  if (!filtered.length) {
    catalog.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  renderPage(filtered);
}

function renderPage(list) {
  const chunk = list.slice((page - 1) * pageSize, page * pageSize);

  chunk.forEach(p => {
    const cleanName = p.name.replace(/\s+/g, " ").trim();
    const card = document.createElement("div");
    card.className = "card";
    card.style.display = "none";
    card.innerHTML = `
      <img src="${p.image}" alt="${cleanName}" loading="lazy">
      <h3>${cleanName}</h3>
      <p>Categoría: ${p.category}</p>
      <p>Código: ${p.code}</p>
      <button>+</button>`;

    card.querySelector("button").onclick = () => {
      addToCart(cleanName, p.code, renderCarrito, showCustomAlert);
    };

    const img = card.querySelector("img");
    img.onload = () => { card.style.display = ""; catalog.appendChild(card); };
    img.onerror = () => { img.src = "img/sinimagen.jpg"; card.style.display = ""; catalog.appendChild(card); };

    if (img.complete && img.naturalHeight !== 0) {
      requestAnimationFrame(() => { card.style.display = ""; catalog.appendChild(card); });
    }
  });

  if (page < Math.ceil(list.length / pageSize)) {
    catalog.after(btnLoadMore);
    btnLoadMore.onclick = () => {
      page++;
      renderPage(list);
      if (page * pageSize >= list.length) btnLoadMore.remove();
    };
  }
}

export function renderCarrito() {
  const carrito = getCarrito();
  carritoProductos.innerHTML = "";
  carrito.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "carrito-producto";
    div.innerHTML = `<span>${p.code} - ${p.name}</span><button>Eliminar</button>`;
    div.querySelector("button").onclick = () => {
      removeFromCart(i, renderCarrito);
    };
    carritoProductos.appendChild(div);
  });
}

export function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  alertBox.querySelector("p")?.remove();
  const p = document.createElement("p");
  p.textContent = message;
  alertBox.insertBefore(p, alertBox.firstChild);
  alertBox.style.display = "block";
  setTimeout(() => alertBox.style.display = "none", 5000);
}



function mostrarSeccion(id) {
  const secciones = document.querySelectorAll('.section');
  secciones.forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '') || 'productos';
  mostrarSeccion(hash);
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'productos';
  mostrarSeccion(hash);
});

function cerrarSesion() {
  localStorage.removeItem("rucRegistrado");
  localStorage.removeItem("usernameRegistrado");
  window.location.href = "index.html";
}

const ruc = localStorage.getItem("rucRegistrado");
const username = localStorage.getItem("usernameRegistrado");
document.getElementById("rucMostrado").textContent = ruc || "No disponible";
document.getElementById("usernameMostrado").textContent = username || "No disponible";

function forzarActualizacion() {
  alert("Función de actualización del catálogo activada");
}

cargarProductos();
renderCarrito();