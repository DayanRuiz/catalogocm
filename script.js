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

// Config Swiper
const swiper = new Swiper('.swiper', {
  loop: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
});

// Mostrar secciones
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.remove("active-link");
    const href = link.getAttribute("href");
    if (href === `#${sectionId}`) {
      link.classList.add("active-link");
    }
  });
}

// Carrito
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function addToCart(productName, productCode) {
  if (carrito.some(product => product.code === productCode)) {
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

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 5000);
}

function closeAlert() {
  document.getElementById("customAlert").style.display = "none";
}

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCEwHQQwivIG_s0hJoTddVmXGzgABhUsG8",
  authDomain: "catalogoproductos-a2ab0.firebaseapp.com",
  databaseURL: "https://catalogoproductos-a2ab0-default-rtdb.firebaseio.com", // IMPORTANTE: Añadir databaseURL para RTDB
  projectId: "catalogoproductos-a2ab0",
  storageBucket: "catalogoproductos-a2ab0.appspot.com", // Corregido storageBucket (sin .firebaseapp.com)
  messagingSenderId: "998590972541",
  appId: "1:998590972541:web:6c3a56d94a4e39b6822714",
  measurementId: "G-BBN29KMY8Z"
};

// Inicializar Firebase app y base de datos
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let products = [];
let page = 1;
const pageSize = 100;

function cacheExpirado(horas = 12) {
  const timestamp = localStorage.getItem("productos_timestamp");
  if (!timestamp) return true;
  return (Date.now() - parseInt(timestamp)) > horas * 60 * 60 * 1000;
}

// Cargar productos async usando modular Firebase
async function cargarProductos() {
  try {
    const productosGuardados = localStorage.getItem("productos_light");

    if (productosGuardados && !cacheExpirado()) {
      const productosLight = JSON.parse(productosGuardados);

      // Obtener imágenes y datos desde Firebase Realtime Database
      const snapshot = await get(ref(database, "productos"));
      const data = snapshot.val();

      products = productosLight.map(p => ({
        ...p,
        image: data[p.code]?.image || "img/sinimagen.jpg"
      }));

      renderProducts();

    } else {
      const snapshot = await get(ref(database, "productos"));
      const data = snapshot.val();

      products = Object.keys(data).map(key => ({
        name: data[key].name,
        category: data[key].category,
        code: key,
        image: data[key].image || "img/sinimagen.jpg",
      }));

      const productosLight = products.map(p => ({
        name: p.name,
        category: p.category,
        code: p.code
      }));

      localStorage.setItem("productos_light", JSON.stringify(productosLight));
      localStorage.setItem("productos_timestamp", Date.now().toString());

      renderProducts();
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

function forzarActualizacion() {
  localStorage.removeItem("productos_light");
  localStorage.removeItem("productos_timestamp");
  cargarProductos();
}

// Renderizado de productos
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
    const cleanName = product.name.replace(/\s+/g, " ").trim();
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

  const totalPages = Math.ceil(list.length / pageSize);
  if (page < totalPages && !document.getElementById("btnLoadMore")) {
    catalog.after(btnLoadMore);
    btnLoadMore.addEventListener("click", () => {
      page++;
      renderPage(list);
      if (page >= totalPages) btnLoadMore.remove();
    });
  }
}

// Búsqueda con debounce
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// --- EVENTO PRINCIPAL ---
window.addEventListener('DOMContentLoaded', () => {
  cargarProductos();

  // Mostrar sección desde hash
  const sectionFromHash = window.location.hash.replace('#', '');
  if (sectionFromHash) showSection(sectionFromHash);

  // Renderizar carrito guardado
  renderCarrito();

  // Escuchar búsqueda con debounce
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      renderProducts(searchInput.value);
    }, 300));
  }

  // Mostrar carrito al hacer clic
  btnCarrito.addEventListener("click", () => {
    carritoFlotante.style.display = "block";
  });
});
