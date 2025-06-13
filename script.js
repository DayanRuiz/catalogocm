// IMPORTS MODULARES (solo funciona con <script type="module"> en HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Referencias globales
const catalog = document.getElementById("productCatalog");
const carritoFlotante = document.getElementById("carritoFlotante");
const carritoProductos = document.getElementById("carritoProductos");
const btnCarrito = document.getElementById("btnCarrito");
const vendedoresFlotante = document.getElementById("vendedoresFlotante");
const loadingIndicator = document.getElementById('loadingIndicator');
const searchInput = document.getElementById("searchInput");

// Crear botón cargar más
const btnLoadMore = document.createElement("button");
btnLoadMore.textContent = "Cargar más";
btnLoadMore.id = "btnLoadMore";

// Firebase config
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

// Swiper config
function setupSwiper() {
  const swiperInstance = new Swiper('.swiper', {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  });
  refreshSwiperImages(swiperInstance);
}

function refreshSwiperImages(swiperInstance) {
  const now = Date.now();
  swiperInstance.slides.forEach(slide => {
    const img = slide.querySelector("img");
    if (img && img.src) {
      const url = new URL(img.src);
      url.searchParams.set("t", now);
      img.src = url.toString();
    }
  });
}

// SPA
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.remove("active-link");
    if (link.getAttribute("href") === `#${sectionId}`) {
      link.classList.add("active-link");
    }
  });
}

function setupSpaNavigation() {
  window.addEventListener("hashchange", () => {
    const section = window.location.hash.replace("#", "") || "inicio";
    showSection(section);
    if (section === "productos") renderProducts(searchInput?.value || "");
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("href").replace("#", "");
      window.location.hash = target;
    });
  });
}

// Carrito
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function addToCart(productName, productCode) {
  if (carrito.some(p => p.code === productCode)) {
    showCustomAlert(`El producto "${productName}" ya está en el carrito.`);
    return;
  }

  carrito.push({ name: productName, code: productCode });
  localStorage.setItem("carrito", JSON.stringify(carrito));
  showCustomAlert(`Producto "${productName}" agregado al carrito.`);
  renderCarrito();
}

function renderCarrito() {
  carritoProductos.innerHTML = "";
  carrito.forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "carrito-producto";
    div.innerHTML = `
      <span>${product.code} - ${product.name}</span>
      <button onclick="removeFromCart(${index})">Eliminar</button>
    `;
    carritoProductos.appendChild(div);
  });
}

function removeFromCart(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
}

function cerrarCarrito() {
  carritoFlotante.style.display = "none";
}

// Vendedores
function mostrarVendedores() {
  vendedoresFlotante.style.display = "block";
}
function cerrarVendedores() {
  vendedoresFlotante.style.display = "none";
}
function enviarPorWhatsApp(numeroVendedor) {
  const mensaje = `👋 Hola, he visto tu *Catálogo virtual.*\n¿Podrías brindarme más detalles?\n🛍️ Productos:\n\n` +
    carrito.map(p => `${p.code} - ${p.name}`).join("\n");
  const url = `https://wa.me/${numeroVendedor}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// Alerta personalizada
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  alertBox.querySelector("p")?.remove();
  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  alertBox.insertBefore(messageElement, alertBox.firstChild);
  alertBox.style.display = "block";
  setTimeout(() => alertBox.style.display = "none", 5000);
}
function closeAlert() {
  document.getElementById("customAlert").style.display = "none";
}

// Productos
let products = [];
let page = 1;
const pageSize = 100;

function cacheExpirado(horas = 12) {
  const timestamp = localStorage.getItem("productos_timestamp");
  return !timestamp || (Date.now() - parseInt(timestamp)) > horas * 3600000;
}

async function cargarProductos() {
  try {
    loadingIndicator.style.display = 'block';
    const productosGuardados = localStorage.getItem("productos_light");

    if (productosGuardados && !cacheExpirado()) {
      const productosLight = JSON.parse(productosGuardados);
      products = productosLight.map(p => ({ ...p, image: "img/cargando.jpg" }));
      renderProducts(); // primero sin imágenes

      const snapshot = await get(ref(database, "productos"));
      const data = snapshot.val();

      products = productosLight.map(p => ({
        ...p,
        image: data?.[p.code]?.image || "img/sinimagen.jpg"
      }));
      renderProducts(); // luego con imágenes
    } else {
      const snapshot = await get(ref(database, "productos"));
      const data = snapshot.val();

      products = Object.entries(data).map(([key, val]) => ({
        name: val.name,
        category: val.category,
        code: key,
        image: val.image || "img/sinimagen.jpg"
      }));

      const productosLight = products.map(p => ({
        name: p.name, category: p.category, code: p.code
      }));

      localStorage.setItem("productos_light", JSON.stringify(productosLight));
      localStorage.setItem("productos_timestamp", Date.now().toString());

      renderProducts();
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

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
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const chunk = list.slice(start, end);

  chunk.forEach(product => {
    const cleanName = product.name.trim();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${product.image}" alt="${cleanName}" loading="lazy">
      <h3>${cleanName}</h3>
      <p>Categoría: ${product.category}</p>
      <p>Código: ${product.code}</p>
      <button onclick="addToCart('${cleanName}','${product.code}')">+</button>
    `;
    catalog.appendChild(card);
  });

  if (page * pageSize < list.length) {
    catalog.after(btnLoadMore);
  }
}

btnLoadMore.addEventListener("click", () => {
  page++;
  renderPage(products);
  if (page * pageSize >= products.length) btnLoadMore.remove();
});

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function cerrarSesion() {
  localStorage.removeItem("rucRegistrado");
  localStorage.removeItem("usernameRegistrado");
  window.location.href = "index.html";
}

// Mostrar usuario
const ruc = localStorage.getItem("rucRegistrado");
const username = localStorage.getItem("usernameRegistrado");
const rucEl = document.getElementById("rucMostrado");
const userEl = document.getElementById("usernameMostrado");
if (rucEl) rucEl.textContent = ruc || "No disponible";
if (userEl) userEl.textContent = username || "No disponible";

// Evento principal
window.addEventListener("DOMContentLoaded", () => {
  setupSpaNavigation();
  setupSwiper();

  const section = window.location.hash.replace("#", "") || "inicio";
  showSection(section);
  if (section === "productos") renderProducts(searchInput?.value || "");

  cargarProductos();
  renderCarrito();

  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      renderProducts(searchInput.value);
    }, 300));
  }

  if (btnCarrito) {
    btnCarrito.addEventListener("click", () => {
      carritoFlotante.style.display = "block";
    });
  }
});

// Exponer funciones globalmente
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.cerrarCarrito = cerrarCarrito;
window.mostrarVendedores = mostrarVendedores;
window.cerrarVendedores = cerrarVendedores;
window.enviarPorWhatsApp = enviarPorWhatsApp;
window.closeAlert = closeAlert;
window.forzarActualizacion = () => {
  localStorage.removeItem("productos_light");
  localStorage.removeItem("productos_timestamp");
  cargarProductos();
};
window.cerrarSesion = cerrarSesion;


