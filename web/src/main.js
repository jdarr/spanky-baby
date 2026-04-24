import "./style.css";
import { io } from "socket.io-client";
import * as rive from "@rive-app/webgl2";

let r, socket, loaded, connected;

const SERVER_URL = "http://localhost:3001";

const world1El = document.getElementById("world1");
const world2El = document.getElementById("world2");
const current1El = document.getElementById("current1");
const current2El = document.getElementById("current2");

function init(filename) {
	
	const currentSpanks = localStorage.getItem("currentSpanks") || 0;
	current1El.textContent = current2El.textContent = formatNumber(currentSpanks);

	socket = io(SERVER_URL, { transports: ["websocket"] });

	socket.on("connect", () => {
		console.log("Connected");
		connected = true;
		if(loaded){
			transitionIn();
		}
	});
	socket.on("disconnect", () => {
		console.log("Disconnected");
	});

	socket.on("counter:value", ({ value }) => {
		world1El.textContent = world2El.textContent = formatNumber(value);
	});

	r = new rive.Rive({
		src: `/rive/${filename}`,
		layout: new rive.Layout({
				fit: rive.Fit.Contain, // The content will be contained within the view, preserving the aspect ratio.
				alignment: rive.Alignment.Center, // Optional: centers the content within the container.
		}),
		autoplay: true,
		autoBind: true,
		loop: true,
		artboard: "Artboard",
		stateMachines: "State Machine 1",
		canvas: document.getElementById("spankCanvas"),
		onLoad: handleLoad,
	})

	window.addEventListener('resize', () => {
		r.resizeDrawingSurfaceToCanvas();
	});

}

function formatNumber(n) {
	return new Intl.NumberFormat().format(999999999);
}

function handleLoad () {
	r.resizeDrawingSurfaceToCanvas();
	let vmi = r.viewModelInstance;
	const trigger = vmi.trigger("animateSpank");
	
	trigger.on(() => {
		let spanks = Number(current1El.textContent) || 0;
		spanks += 1;
		current1El.textContent = current2El.textContent = formatNumber(spanks);
		localStorage.setItem("currentSpanks", String(spanks));
		socket.emit("counter:inc")
	});

	loaded = true;
	if(connected){
		transitionIn();
	}

}

function transitionIn() {
	document.getElementById("app").style.opacity = 1;
}

window.riveInit = init;