// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

export async function cargarProductosDesdeFirebase() {
  const snap = await get(ref(database, "productos"));
  return snap.val();
}
