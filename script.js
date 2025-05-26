function showSection(sectionId) {
  // Oculta todas las secciones
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Muestra la sección seleccionada
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add("active");
  }

  // Actualizar sombreado en nav-links
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active-link");

    const href = link.getAttribute("href");
    if (href === `#${sectionId}`) {
      link.classList.add("active-link");
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const sectionFromHash = window.location.hash.replace('#', '');
  if (sectionFromHash) {
    showSection(sectionFromHash);
  }
});





////PRODUCTOS/////////////////////


// Inicializar Swiper
const swiper = new Swiper('.swiper', {
  loop: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: false,
  autoplay: {
    delay: 3000, // 3000ms = 3 segundos
    disableOnInteraction: false, // Mantener autoplay incluso si el usuario interactúa
  },
});


// Productos de ejemplo - se paso a otra hoja js

//DECLARANDO VARIABLES 
let page = 1;
const pageSize = 100;
const btnLoadMore = document.createElement("button");
btnLoadMore.textContent = "Cargar más";



const catalog = document.getElementById("productCatalog");
const searchInput = document.getElementById("searchInput");
const carritoFlotante = document.getElementById("carritoFlotante");
const carritoProductos = document.getElementById("carritoProductos");
const btnCarrito = document.getElementById("btnCarrito");
//const btnLlamar = document.getElementById("btnLlamar");
const vendedoresFlotante = document.getElementById("vendedoresFlotante");
//const vendedoresLlamadaFlotante = document.getElementById("vendedoresLlamadaFlotante");

function renderProducts(filter = "") {
  catalog.innerHTML = "";
  page = 1;
  btnLoadMore.remove();

  const terms = filter.toLowerCase().split(" ").filter(t => t);
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

//CARGA LO FILTRADO 
function renderPage(list) {
  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const chunk = list.slice(start, end);

  chunk.forEach(product => {
    const cleanName = product.name.replace(/\s+/g, " ").trim();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <h3>${cleanName}</h3>
      <p>Categoría: ${product.category}</p>
      <p>Código: ${product.code}</p>
      <button onclick="addToCart('${product.name}','${product.code}')">+</button>
    `;
    catalog.appendChild(card);
  });

  const totalPages = Math.ceil(list.length / pageSize);
  if (page < totalPages) {
    if (!document.getElementById("btnLoadMore")) {
      catalog.after(btnLoadMore);
      btnLoadMore.addEventListener("click", () => {
        page++;
        renderPage(list);
        if (page >= totalPages) btnLoadMore.remove();
      });
    }
  }
}


// Inicializar carrito desde localStorage o vacío
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Renderizar carrito al cargar la página
document.addEventListener("DOMContentLoaded", renderCarrito);

// Evento para agregar producto al carrito
function addToCart(productName, productCode) {
  // Verificar si el producto ya existe en el carrito
  const productExists = carrito.some(product => product.code === productCode);
  if (productExists) {
    showCustomAlert(`El producto "${productName}" ya está en el carrito.`);
    return; // Detener la ejecución si ya existe
  }

  // Agregar el producto al carrito
  carrito.push({
    name: productName,
    code: productCode
  });

  // Guardar el carrito en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));

  // Mostrar la notificación personalizada
  showCustomAlert(`Producto "${productName}" agregado al carrito.`);
  renderCarrito();
}

// Mostrar la notificación personalizada
function showCustomAlert(message) {
  const alertBox = document.getElementById("customAlert");
  alertBox.querySelector("p")?.remove(); // elimina mensaje anterior si existe

  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  alertBox.insertBefore(messageElement, alertBox.firstChild);

  alertBox.style.display = "block";

  // Ocultar automáticamente después de 5 segundos (opcional)
  setTimeout(() => {
    if (alertBox.style.display === "block") {
      alertBox.style.display = "none";
    }
  }, 5000);
}
// Cerrar la notificación personalizada

function closeAlert() {
  document.getElementById("customAlert").style.display = "none";
}




// Renderizar carrito
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

// Eliminar producto del carrito
function removeFromCart(index) {
  carrito.splice(index, 1);

  // Guardar el carrito actualizado en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));

  renderCarrito();
}

// Abrir carrito
btnCarrito.addEventListener("click", () => {
  carritoFlotante.style.display = "block";
});

// Cerrar carrito
function cerrarCarrito() {
  carritoFlotante.style.display = "none";
}

// Mostrar lista de vendedores para WhatsApp
function mostrarVendedores() {
  vendedoresFlotante.style.display = "block";
}

// Cerrar lista de vendedores para WhatsApp
function cerrarVendedores() {
  vendedoresFlotante.style.display = "none";
}



// Enviar por WhatsApp
function enviarPorWhatsApp(numeroVendedor) {
  const mensaje = `👋 Hola, he visto tu *Catálogo virtual.*
¿Podrías brindarme más detalles, por favor?
🛍️ Productos que me interesan:\n\n` +
    carrito.map(product => `${product.code} - ${product.name}`).join('\n');
  const url = `https://wa.me/${numeroVendedor}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}




////FIREBASEE////


// Verifica si el caché expiró
function cacheExpirado(horas = 12) {
  const timestampGuardado = localStorage.getItem("productos_timestamp");
  if (!timestampGuardado) return true;

  const ahora = Date.now();
  const vencimiento = horas * 60 * 60 * 1000;

  return (ahora - parseInt(timestampGuardado)) > vencimiento;
}

// Forzar actualización manual del catálogo
function forzarActualizacion() {
  localStorage.removeItem("productos_timestamp");

  const db = firebase.database();
  const ref = db.ref("productos");

  ref.once("value")
    .then(snapshot => {
      const data = snapshot.val();

      products = Object.keys(data).map(key => ({
        name: data[key].name,
        category: data[key].category,
        code: key,
        image: data[key].image,
      }));

      // Guarda productos en caché para futuras visitas (12 horas)

      // Guardar versión liviana sin imágenes para evitar saturar localStorage
      // Guardar solo datos livianos sin imágenes para evitar exceder localStorage
      const productosLight = products.map(p => ({
        name: p.name,
        category: p.category,
        code: p.code
      }));
      localStorage.setItem("productos_light", JSON.stringify(productosLight));
      localStorage.setItem("productos_timestamp", Date.now().toString());


      renderProducts(); // Solo renderiza una vez, al

    })

    .catch(console.error);
}


// Productos
let products = [];

// Carga productos desde Firebase o caché
document.addEventListener("DOMContentLoaded", () => {

  const productosGuardados = localStorage.getItem("productos_light");

  if (productosGuardados && !cacheExpirado(12)) {
    const productosLight = JSON.parse(productosGuardados);

    // Como esta versión no tiene imágenes, debes volver a cargarlas desde Firebase
    const db = firebase.database();
    const ref = db.ref("productos");

    ref.once("value").then(snapshot => {
      const data = snapshot.val();
      products = productosLight.map(p => ({
        ...p,
        image: data[p.code]?.image || "img/sinimagen.jpg"
      }));

      renderProducts();
    }).catch(console.error);
  }


  else {
    const db = firebase.database();
    const ref = db.ref("productos");

    ref.once("value")
      .then(snapshot => {
        const data = snapshot.val();

        // Guardar versión liviana sin imágenes
        const productosLight = products.map(p => ({
          name: p.name,
          category: p.category,
          code: p.code
        }));
        localStorage.setItem("productos_light", JSON.stringify(productosLight));
        localStorage.setItem("productos_timestamp", Date.now().toString());


        renderProducts(); // Cargar productos visibles
      })
      .catch(console.error);
  }

  renderCarrito();

  searchInput.addEventListener("input", debounce((e) => {
    renderProducts(e.target.value);
  }, 300));
});



// Función debounce para mejorar búsqueda
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

