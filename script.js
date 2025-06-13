// IMPORTS MODULARES (solo funciona con <script type="module"> en HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Elementos globales
const catalog = document.getElementById("productCatalog");
const carritoFlotante = document.getElementById("carritoFlotante");
const carritoProductos = document.getElementById("carritoProductos");
const btnCarrito = document.getElementById("btnCarrito");
const vendedoresFlotante = document.getElementById("vendedoresFlotante");
const btnLoadMore = document.createElement("button");
btnLoadMore.textContent = "Cargar más";
const loadingIndicator = document.getElementById('loadingIndicator');

// Swiper
const swiper = new Swiper('.swiper', {
  loop: true,
  pagination: { el: '.swiper-pagination', clickable: true },
  autoplay: { delay: 3000, disableOnInteraction: false },
});

// Secciones SPA
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.remove("active-link");
    if (link.getAttribute("href") === `#${sectionId}`) link.classList.add("active-link");
  });
}

// Carrito
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function addToCart(name, code) {
  if (carrito.some(p => p.code === code)) return showCustomAlert(`El producto "${name}" ya está en el carrito.`);
  carrito.push({ name, code });
  localStorage.setItem("carrito", JSON.stringify(carrito));
  showCustomAlert(`Producto "${name}" agregado al carrito.`);
  renderCarrito();
}

function renderCarrito() {
  carritoProductos.innerHTML = "";
  carrito.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "carrito-producto";
    div.innerHTML = `<span>${p.code} - ${p.name}</span><button onclick="removeFromCart(${i})">Eliminar</button>`;
    carritoProductos.appendChild(div);
  });
}

function removeFromCart(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
}

// Otros paneles
function cerrarCarrito() { carritoFlotante.style.display = "none"; }
function mostrarVendedores() { vendedoresFlotante.style.display = "block"; }
function cerrarVendedores() { vendedoresFlotante.style.display = "none"; }

function enviarPorWhatsApp(numero) {
  const mensaje = `👋 Hola, he visto tu *Catálogo virtual.*\n🛍️ Productos:\n${carrito.map(p => `${p.code} - ${p.name}`).join("\n")}`;
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
}

// Alertas
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  alertBox.querySelector("p")?.remove();
  const p = document.createElement("p");
  p.textContent = message;
  alertBox.insertBefore(p, alertBox.firstChild);
  alertBox.style.display = "block";
  setTimeout(() => alertBox.style.display = "none", 5000);
}
function closeAlert() {
  document.getElementById("customAlert").style.display = "none";
}

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCEwHQQwivIG_s0hJoTddVmXGzgABhUsG8",
  authDomain: "catalogoproductos-a2ab0.firebaseapp.com",
  databaseURL: "https://catalogoproductos-a2ab0-default-rtdb.firebaseio.com",
  projectId: "catalogoproductos-a2ab0",
  storageBucket: "catalogoproductos-a2ab0.appspot.com",
  messagingSenderId: "998590972541",
  appId: "1:998590972541:web:6c3a56d94a4e39b6822714",
  measurementId: "G-BBN29KMY8Z"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let products = [];
let page = 1;
const pageSize = 100;

function cacheExpirado(horas = 12) {
  const ts = localStorage.getItem("productos_timestamp");
  return !ts || (Date.now() - parseInt(ts)) > horas * 3600000;
}

// Carga de productos optimizada
async function cargarProductos() {
  try {
    loadingIndicator.style.display = 'block';
    const productosGuardados = localStorage.getItem("productos_light");

    if (productosGuardados && !cacheExpirado()) {
      const light = JSON.parse(productosGuardados);
      products = light.map(p => ({ ...p, image: "img/cargando.jpg" }));
      renderProducts();

      // Cargar imágenes reales en segundo plano
      const snap = await get(ref(database, "productos"));
      const data = snap.val();
      products.forEach(p => { p.image = data[p.code]?.image || "img/sinimagen.jpg"; });
      renderProducts();
    } else {
      const snap = await get(ref(database, "productos"));
      const data = snap.val();
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

// Renderizado de productos con paginación
function renderProducts(filter = "") {
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
      <button onclick="addToCart('${cleanName}','${p.code}')">+</button>`;

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

// Navegación SPA
function setupSpaNavigation() {
  window.addEventListener("hashchange", () => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      showSection(hash);
      if (hash === "productos") renderProducts(document.getElementById("searchInput")?.value || "");
    }
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      window.location.hash = link.getAttribute("href").replace("#", "");
    });
  });
}

// Swiper images refresher
function refreshSwiperImages(swiper) {
  const now = Date.now();
  swiper.slides.forEach(slide => {
    const img = slide.querySelector("img");
    if (img?.src) img.src = new URL(img.src).toString() + `?t=${now}`;
  });
}

// Debounce para búsqueda
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Init app
window.addEventListener("DOMContentLoaded", () => {
  setupSpaNavigation();
  const hash = location.hash.replace("#", "");
  showSection(hash || "inicio");

  if (hash === "productos") {
    renderProducts(document.getElementById("searchInput")?.value || "");
  }

  if (!products.length) cargarProductos();
  renderCarrito();

  document.getElementById("searchInput")?.addEventListener("input", debounce(() => {
    renderProducts(searchInput.value);
  }, 300));

  btnCarrito.addEventListener("click", () => carritoFlotante.style.display = "block");

  window.mySwiper = new Swiper('.swiper', {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
  });

  refreshSwiperImages(window.mySwiper);
});

// Exponer funciones globales
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.cerrarCarrito = cerrarCarrito;
window.mostrarVendedores = mostrarVendedores;
window.cerrarVendedores = cerrarVendedores;
window.enviarPorWhatsApp = enviarPorWhatsApp;
window.closeAlert = closeAlert;


