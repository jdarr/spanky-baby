import "./style.css";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

const valueEl = document.getElementById("value");
const statusEl = document.getElementById("status");
const incBtn = document.getElementById("inc");
const decBtn = document.getElementById("dec");
const setInput = document.getElementById("setValue");
const setBtn = document.getElementById("setBtn");

const socket = io(SERVER_URL, { transports: ["websocket"] });

socket.on("connect", () => (statusEl.textContent = "Connected"));
socket.on("disconnect", () => (statusEl.textContent = "Disconnected"));

socket.on("counter:value", ({ value }) => {
  valueEl.textContent = String(value);
});

incBtn.addEventListener("click", () => socket.emit("counter:inc"));
decBtn.addEventListener("click", () => socket.emit("counter:dec"));

setBtn.addEventListener("click", () => {
  const n = Number(setInput.value);
  if (!Number.isFinite(n)) return;
  socket.emit("counter:set", { value: n });
});