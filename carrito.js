// carrito.js
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

export function getCarrito() {
  return carrito;
}

export function addToCart(name, code, renderCarritoCallback, showCustomAlert) {
  if (carrito.some(p => p.code === code)) {
    showCustomAlert(`El producto "${name}" ya está en el carrito.`);
    return;
  }
  carrito.push({ name, code });
  localStorage.setItem("carrito", JSON.stringify(carrito));
  showCustomAlert(`Producto "${name}" agregado al carrito.`);
  renderCarritoCallback();
}

export function removeFromCart(index, renderCarritoCallback) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarritoCallback();
}
