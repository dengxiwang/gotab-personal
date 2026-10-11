(() => {
const startupScript = document.currentScript;
const share = window.gotabShareStartup;
let bodyReady;
let backgroundRestorationClosed = false;
// Begin cache reads in <head>, before application stylesheets. Mount only into
// the real parser-created body; DOMContentLoaded also waits for the module graph.
const waitForBody = () => {
	if (document.body) return Promise.resolve();
	return bodyReady ||= new Promise(resolve => {
		const observer = new MutationObserver(() => {
			if (!document.body) return;
			observer.disconnect();
			resolve();
		});
		observer.observe(document.documentElement, { childList: true });
	});
};
// One bounded record per mode, shared by the early script and the live app.
// The small epoch also prevents a cleared local profile from reviving old IDB data.
function createPageStorage() {
	const legacyKey = "gotab:startup-page";
	const epochKey = "gotab:startup-page-epoch";
	const pageKey = (mode) => mode === "normal" || mode === "simple" ? `page:${mode}` : "page";
	let opening;
	let generation = 0;
	const writes = new Set();
	const readLocal = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
	const epoch = () => readLocal(epochKey);
	const ensureEpoch = () => {
		let value = epoch();
		if (!value) {
			value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
			try { localStorage.setItem(epochKey, value); } catch { return null; }
		}
		return value;
	};
	const open = () => {
		if (opening) return opening;
		const promise = new Promise((resolve) => {
			let settled = false;
			const finish = (db) => {
				if (settled) { db?.close(); return; }
				settled = true;
				clearTimeout(timer);
				resolve(db);
			};
			const timer = setTimeout(() => finish(null), 1500);
			try {
				const request = indexedDB.open("gotab-startup", 1);
				request.onupgradeneeded = () => {
					if (settled) { request.transaction.abort(); return; }
					if (!request.result.objectStoreNames.contains("snapshots")) request.result.createObjectStore("snapshots");
				};
				request.onerror = request.onblocked = () => finish(null);
				request.onsuccess = () => {
					const db = request.result;
					db.onversionchange = () => { db.close(); opening = undefined; };
					db.onclose = () => { opening = undefined; };
					finish(db);
				};
			} catch { finish(null); }
		});
		opening = promise;
		void promise.then((db) => { if (!db && opening === promise) opening = undefined; });
		return promise;
	};
	const read = async (mode) => {
		const expected = epoch();
		const started = generation;
		// No marker means first use (or a reset). Never revive an orphaned record.
		if (!expected) return null;
		const db = await open();
		if (!db || generation !== started || epoch() !== expected) return null;
		return new Promise((resolve) => {
			let done = false;
			let transaction;
			let raw = null;
			const finish = (raw = null) => {
				if (done) return;
				done = true;
				clearTimeout(timer);
				resolve(generation === started && epoch() === expected ? raw : null);
			};
			const timer = setTimeout(() => { finish(); try { transaction?.abort(); } catch { /* Already finished. */ } }, 1500);
			try {
				transaction = db.transaction("snapshots", "readonly");
				const store = transaction.objectStore("snapshots");
				const key = pageKey(mode);
				const request = store.get(key);
				request.onsuccess = () => {
					raw = request.result?.epoch === expected ? request.result.raw : null;
					if (raw === null && key !== "page") {
						// Old releases saved one shared page. Its context is validated by
						// the caller before display or migration into a mode partition.
						const legacy = store.get("page");
						legacy.onsuccess = () => { raw = legacy.result?.epoch === expected ? legacy.result.raw : null; };
					}
				};
				transaction.oncomplete = () => finish(raw);
				transaction.onabort = transaction.onerror = () => finish();
			} catch { finish(); }
		});
	};
	const write = async (raw, isCurrent = () => true, migrate = false, mode) => {
		if (!isCurrent()) return "skipped";
		const legacy = readLocal(legacyKey);
		const expected = ensureEpoch();
		const started = generation;
		if (!expected) return "unavailable";
		const current = () => generation === started && epoch() === expected && isCurrent();
		const db = await open();
		if (!current()) return "skipped";
		if (!db) return "retryable";
		return new Promise((resolve) => {
			let done = false;
			let transaction;
			let wrote = false;
			const finish = (result) => {
				if (done) return;
				done = true;
				clearTimeout(timer);
				writes.delete(transaction);
				// Remove legacy content only after the entire transaction committed.
				if (result === "saved" && current() && readLocal(legacyKey) === legacy && (!migrate || legacy === raw)) {
					try { localStorage.removeItem(legacyKey); } catch { /* Retry on the next successful save. */ }
				}
				resolve(current() ? result : "skipped");
			};
			const failure = error => error?.name === "QuotaExceededError" ? "unavailable" : "retryable";
			const timer = setTimeout(() => { try { transaction?.abort(); } catch { /* Already finished. */ } finish("retryable"); }, 5000);
			try {
				transaction = db.transaction("snapshots", "readwrite");
				writes.add(transaction);
				transaction.oncomplete = () => finish(wrote ? "saved" : "skipped");
				transaction.onabort = transaction.onerror = event => finish(failure(transaction.error || event?.target?.error));
				const store = transaction.objectStore("snapshots");
				const key = pageKey(mode);
				const put = () => {
					if (!current()) { transaction.abort(); return; }
					store.put({ epoch: expected, raw }, key);
					wrote = true;
				};
				if (migrate) {
					// Another tab/live capture may already have a newer page in this mode.
					const request = store.get(key);
					request.onsuccess = () => {
						if (!current()) { transaction.abort(); return; }
						if (request.result?.epoch === expected) wrote = true;
						else put();
						if (key !== "page") {
							const legacy = store.get("page");
							legacy.onsuccess = () => {
								if (!current()) { transaction.abort(); return; }
								// Do not discard the other mode or another tab's newer page.
								if (legacy.result?.epoch === expected && legacy.result.raw === raw) store.delete("page");
							};
						}
					};
				} else put();
				if (key !== "page") {
					const other = store.get(pageKey(mode === "normal" ? "simple" : "normal"));
					other.onsuccess = () => {
						if (!current()) { transaction.abort(); return; }
						// Once both modes are saved, no legacy fallback is needed.
						// Until then keep it without reparsing its potentially large raw HTML.
						if (other.result?.epoch === expected) store.delete("page");
					};
				}
			} catch (error) { try { transaction?.abort(); } catch { /* Already finished. */ } finish(failure(error)); }
		});
	};
	const clear = () => {
		generation++;
		for (const transaction of writes) { try { transaction.abort(); } catch { /* Already finished. */ } }
		try { localStorage.removeItem(epochKey); localStorage.removeItem(legacyKey); } catch { /* Storage is optional. */ }
		const started = generation;
		// The epoch invalidates immediately; deletion is best-effort and cannot
		// delete a newly saved page if another tab/session has already advanced.
		void open().then((db) => {
			if (!db || generation !== started || epoch()) return;
			try {
				const transaction = db.transaction("snapshots", "readwrite");
				const store = transaction.objectStore("snapshots");
				const request = store.get("page");
				request.onsuccess = () => {
					if (generation === started && !epoch()) {
						for (const key of ["page", "page:normal", "page:simple"]) store.delete(key);
					}
				};
			} catch { /* Invalidated records are never restored even if deletion fails. */ }
		});
	};
	return { read, write, clear, legacy: () => readLocal(legacyKey) };
}
const bundledConfig = { ...(globalThis.siteConfig || {}) };
const configSource = () => {
	const server = localStorage.getItem("gotab:customServerUrl") || "";
	const raw = server ? localStorage.getItem(`gotab:siteConfig:${server}`) || "" : "";
	if (!raw) return "";
	try {
		return JSON.stringify(JSON.parse(raw), (_key, value) =>
			value && typeof value === "object" && !Array.isArray(value)
				? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]])) : value);
	} catch { return raw; }
};
let appliedConfigSource;
const canPreview = () => {
	if (share) return share.isCurrent();
	try {
		const raw = JSON.parse(configSource() || "{}");
		const remote = raw.siteConfig || raw.config || raw.data?.siteConfig || raw.data?.config || raw.data || raw;
		const limit = remote.homePageLimit ?? bundledConfig.homePageLimit;
		return ![true, 1, "true", "1", "on", "enabled", "uselogin"].includes(typeof limit === "string" ? limit.trim().toLowerCase() : limit);
	} catch { return false; }
};
// Read the same absolute-source keys as the live wallpaper cache. Startup must
// never create/upgrade this database or hold a connection across the handoff.
const readCachedWallpaper = (source, signal) => new Promise(resolve => {
	let done = false, database, transaction;
	let fallbackBlob = null;
	const finish = blob => {
		if (done) return;
		done = true;
		clearTimeout(timer);
		signal.removeEventListener("abort", cancel);
		if (!blob) { try { transaction?.abort(); } catch { /* Already completed. */ } }
		database?.close();
		resolve(blob);
	};
	const cancel = () => finish(null);
	const timer = setTimeout(() => finish(fallbackBlob), 150);
	if (signal.aborted) { cancel(); return; }
	signal.addEventListener("abort", cancel, { once: true });
	try {
		const request = indexedDB.open("wallpaperCacheDB");
		request.onupgradeneeded = () => { request.transaction?.abort(); finish(null); };
		request.onerror = request.onblocked = () => finish(null);
		request.onsuccess = () => {
			if (done) { request.result.close(); return; }
			database = request.result;
			database.onversionchange = () => finish(fallbackBlob);
			try {
				if (!database.objectStoreNames.contains("wallpapers")) { finish(null); return; }
				transaction = database.transaction("wallpapers", "readonly");
				transaction.onerror = transaction.onabort = () => finish(fallbackBlob);
				const entry = transaction.objectStore("wallpapers").get(`static_v2_${source}`);
				entry.onerror = () => finish(null);
				entry.onsuccess = () => {
					const original = entry.result;
					const blob = original?.blob;
					if (!(blob instanceof Blob) || !blob.size) { finish(null); return; }
					fallbackBlob = blob;
					const width = Math.ceil(innerWidth * (devicePixelRatio || 1) * 1.1);
					const height = Math.ceil(innerHeight * (devicePixelRatio || 1) * 1.1);
					const variant = (Array.isArray(original.displayVariants) ? original.displayVariants : [])
						.filter(item => item && Number.isSafeInteger(item.width) && Number.isSafeInteger(item.height) &&
							item.width >= width && item.height >= height &&
							item.key === `display_v1_${JSON.stringify([source, original.timestamp, item.width, item.height])}`)
						.sort((left, right) => left.width * left.height - right.width * right.height)[0];
					if (!variant) { finish(blob); return; }
					const display = transaction.objectStore("wallpapers").get(variant.key);
					display.onerror = event => { event.preventDefault(); event.stopPropagation(); finish(blob); };
					display.onsuccess = () => {
						const value = display.result;
						finish(value?.type === "display" && value.src === source &&
							value.sourceTimestamp === original.timestamp && value.width === variant.width &&
							value.height === variant.height && value.blob instanceof Blob && value.blob.size > 0
							? value.blob : blob);
					};
				};
			} catch { finish(null); }
		};
	} catch { finish(null); }
});
const decodeCachedWallpaper = (source, signal) => new Promise(resolve => {
	const image = new Image();
	let done = false;
	const finish = ready => {
		if (done) return;
		done = true;
		clearTimeout(timer);
		image.onload = image.onerror = null;
		signal.removeEventListener("abort", cancel);
		if (!ready) image.src = "";
		resolve(ready);
	};
	const cancel = () => finish(false);
	const timer = setTimeout(cancel, 1500);
	if (signal.aborted) { cancel(); return; }
	signal.addEventListener("abort", cancel, { once: true });
	image.decoding = "async";
	image.onload = () => {
		if (typeof image.decode !== "function") { finish(image.naturalWidth > 0); return; }
		void image.decode().then(() => finish(true), () => finish(image.naturalWidth > 0));
	};
	image.onerror = cancel;
	image.src = source;
});
const startupWallpaper = (() => {
	const resources = new Map();
	let current, observer;
	const isCurrent = () => {
		try {
			return Boolean(current?.layer.isConnected && canPreview() &&
				current.server === localStorage.getItem("gotab:customServerUrl") &&
				current.path === location.pathname && current.hash === location.hash);
		} catch { return false; }
	};
	const owns = resource => isCurrent() && resources.get(resource.source) === resource &&
		current.bindings.some(binding => binding.resource === resource);
	const dispose = resource => {
		resource.controller.abort();
		if (resource.url) URL.revokeObjectURL(resource.url);
		resource.url = "";
		resources.delete(resource.source);
	};
	const paint = resource => {
		if (!owns(resource)) return;
		for (const binding of current.bindings) {
			if (binding.resource === resource) {
				const source = resource.url || (resource.fallback ? resource.source : "");
				binding.element.style.backgroundImage = source ? `url(${JSON.stringify(source)})` : "";
			}
		}
	};
	const create = source => {
		const resource = { source, url: "", fallback: false, controller: new AbortController(),
			width: Math.ceil(innerWidth * (devicePixelRatio || 1) * 1.1),
			height: Math.ceil(innerHeight * (devicePixelRatio || 1) * 1.1) };
		resources.set(source, resource);
		resource.promise = (async () => {
			try {
				const blob = await readCachedWallpaper(source, resource.controller.signal);
				if (!owns(resource)) return null;
				if (blob) {
					resource.url = URL.createObjectURL(blob);
					// Start the CSS image immediately; decoding validates the Blob for
					// React without delaying the independent DOM snapshot restoration.
					paint(resource);
					const ready = await decodeCachedWallpaper(resource.url, resource.controller.signal);
					if (!owns(resource)) return null;
					if (ready) return blob;
				}
			} catch { /* Unavailable or invalid cache uses the original image. */ }
			if (owns(resource)) {
				if (resource.url) URL.revokeObjectURL(resource.url);
				resource.url = "";
				resource.fallback = true;
				paint(resource);
			}
			return null;
		})();
		return resource;
	};
	const prune = () => {
		if (isCurrent()) return;
		for (const resource of resources.values()) dispose(resource);
		current = undefined;
		observer?.disconnect();
		observer = undefined;
	};
	const attach = (layer, server, bindings) => {
		if (current?.server !== server) {
			for (const resource of resources.values()) dispose(resource);
		}
		const retained = new Set(bindings.filter(binding => binding.cacheEnabled).map(binding => binding.source));
		for (const resource of resources.values()) {
			if (!retained.has(resource.source)) dispose(resource);
		}
		current = { layer, server, bindings, path: location.pathname, hash: location.hash };
		for (const binding of bindings) {
			if (!binding.cacheEnabled) continue;
			binding.resource = resources.get(binding.source) || create(binding.source);
			const source = binding.resource.url || (binding.resource.fallback ? binding.source : "");
			// An already decoded URL is assigned before the old layer is removed.
			binding.element.style.backgroundImage = source ? `url(${JSON.stringify(source)})` : "";
		}
		if (!observer) {
			observer = new MutationObserver(prune);
			observer.observe(document.body, { childList: true });
		}
	};
	window.gotabStartupWallpaper = {
		get(source) {
			const resource = resources.get(source);
			if (!resource || !owns(resource)) { prune(); return null; }
			const fits = () => resource.width >= Math.ceil(innerWidth * (devicePixelRatio || 1) * 1.1) &&
				resource.height >= Math.ceil(innerHeight * (devicePixelRatio || 1) * 1.1);
			if (!fits()) return null;
			return resource.promise.then(blob => owns(resource) && fits() ? blob : null);
		},
	};
	return { attach };
})();
// Keep this a small classic script: it paints before the application's module
// graph executes, and works under extension CSP without an inline script.
const renderBackground = (override, view) => {
	if (backgroundRestorationClosed) return;
	if (!document.body) {
		void waitForBody().then(() => renderBackground(override, view));
		return;
	}
	try {
		const script = startupScript;
		const base = new URL(".", script.src).pathname;
		const path = window.location.pathname;
		const extension = /^(?:chrome|moz)-extension:$/.test(window.location.protocol);
		if (
			(!share && path !== base &&
				path !== `${base}index.html` &&
				!(extension && path === `${base}newtab.html`)) ||
			(extension && !["", "#", "#/"].includes(window.location.hash)) ||
			!canPreview()
		) {
			return;
		}

		const snapshot = JSON.parse(override || (!share && localStorage.getItem("gotab:startup-background")) || "null");
		if (
			!snapshot ||
			snapshot.version !== 1 ||
			snapshot.customServer !== localStorage.getItem("gotab:customServerUrl")
		) {
			return;
		}

		const home = share ? {} : JSON.parse(localStorage.getItem("persist:home") || "{}");
		const startupMode = JSON.parse(home.homeStartupShowMode || '"default"');
		const lastMode = JSON.parse(
			localStorage.getItem("gotabShowMode") || home.showMode || '"normal"',
		);
		const simple = (view?.mode || (startupMode === "default" ? lastMode : startupMode)) === "simple";
		let previews = simple && snapshot.openDoubleWallpaper
			? [snapshot.normal, snapshot.simple]
			: [simple ? snapshot.simple : snapshot.normal];
		if (Array.isArray(snapshot.carousel)) {
			const index = Number(view?.carousel ?? localStorage.getItem("carouselIndex") ?? "0");
			previews = [snapshot.carousel[index]];
		}
		if (previews.some((preview) => !preview || typeof preview.value !== "string")) {
			return;
		}

		const layer = document.createElement("div");
		const backgroundBindings = [];
		layer.id = "gotab-startup-background";
		layer.setAttribute("aria-hidden", "true");
		Object.assign(layer.style, {
			position: "fixed",
			inset: "0",
			zIndex: "0",
			pointerEvents: "none",
			overflow: "hidden",
			transform: "scale(1.1)",
		});
		for (const preview of previews) {
			const background = document.createElement("div");
			Object.assign(background.style, {
				position: "absolute",
				inset: "0",
				backgroundPosition: "center",
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
			});
			if (preview.type === "static") {
				const url = new URL(preview.value, window.location.href);
				if (
					!["http:", "https:", "chrome-extension:", "moz-extension:"].includes(
						url.protocol,
					)
				) {
					return;
				}
				if (preview.cacheEnabled !== true) {
					background.style.backgroundImage = `url(${JSON.stringify(url.href)})`;
				}
				backgroundBindings.push({ element: background, source: url.href, cacheEnabled: preview.cacheEnabled === true });
			} else if (preview.type === "color") {
				background.style.backgroundColor = preview.value;
			} else if (
				preview.type === "gradient" &&
				preview.value.startsWith("linear-gradient(")
			) {
				background.style.backgroundImage = preview.value;
			} else {
				return;
			}
			layer.appendChild(background);
		}
		const brightness = Number(
			simple ? snapshot.simpleBrightness : snapshot.standardBrightness,
		);
		const blur = Number(simple ? snapshot.simpleBlur : snapshot.standardBlur);
		if (!Number.isFinite(brightness) || !Number.isFinite(blur)) return;
		// Match the live wallpaper's compositing path, including the no-filter case.
		if (brightness !== 100 || blur !== 0) {
			layer.style.filter = `brightness(${brightness / 100}) blur(${blur / 5}px)`;
		}
		startupWallpaper.attach(layer, snapshot.customServer, backgroundBindings);
		document.getElementById("gotab-startup-background")?.remove();
		// The preview can outlive React's handoff while its wallpaper loads.
		// Keep it behind the live root: appending another fixed z-index:0
		// sibling after #root would cover the newly revealed cards and clock.
		document.body.insertBefore(layer, document.getElementById("root"));
		// Keep the last background until the live wallpaper is actually painted.
		// A slow module download or failed startup must not expose an empty page.
	} catch {
		// Missing, old or malformed cache leaves the normal startup untouched.
	}
};
renderBackground();

// Shadow DOM keeps preview IDs and styles separate from the live React tree.
let titleRestorePending = false;
(() => {
	try {
		const script = startupScript;
		const base = new URL(".", script.src).pathname;
		const extension = /^(?:chrome|moz)-extension:$/.test(location.protocol);
		if (
			(!share && ![base, `${base}index.html`, ...(extension ? [`${base}newtab.html`] : [])].includes(location.pathname)) ||
			(extension && !["", "#", "#/"].includes(location.hash)) ||
			!canPreview()
		) return;

		const keys = [
			"appData", "home", "card", "swiper", "wallpaperTheme", "openType",
			"clockAndDate", "searchBar", "searchEngineData", "simpleMode",
			"bottomArea", "dock", "user",
		];
		const parse = (value, fallback) => {
			try { return JSON.parse(value); } catch { return fallback; }
		};
		const sessionKey = (token) => {
			let first = 2166136261, second = 5381;
			for (const char of token) {
				first = Math.imul(first ^ char.charCodeAt(0), 16777619);
				second = Math.imul(second, 33) ^ char.charCodeAt(0);
			}
			return `${token.length}:${first >>> 0}:${second >>> 0}`;
		};
		const getContext = (withRevision = true, liveMode) => {
			if (share) return JSON.stringify({
				scope: [share.server, share.code, true], server: share.server, session: share.scope,
				share: share.code, shareScope: share.scope,
				mode: liveMode || share.getView().mode, index: String(share.getView().index), carousel: "0",
				internalLinkMode: Boolean(share.getView().internalLinkMode),
				width: innerWidth, height: innerHeight, ratio: devicePixelRatio,
				dark: matchMedia("(prefers-color-scheme: dark)").matches,
				revision: withRevision ? share.getRevision() : 0,
			});
			const home = parse(localStorage.getItem("persist:home"), {}) || {};
			const swiper = parse(localStorage.getItem("persist:swiper"), {}) || {};
			const configured = parse(home.homeStartupShowMode, "default");
			// Captures describe the live DOM; restores follow the startup preference.
			const mode = liveMode || (configured === "default"
				? parse(localStorage.getItem("gotabShowMode") || home.showMode, "normal")
				: configured);
			let stamp = 2166136261;
			const values = withRevision ? [
				...keys.map((key) => localStorage.getItem(`persist:${key}`) || ""),
				localStorage.getItem("gotab:customServerUrl") || "",
				localStorage.getItem("gotab:defaultDataRefreshServerUrl") || "",
				localStorage.getItem("initOver") || "",
				localStorage.getItem("internalLinkMode") || "",
				localStorage.getItem("gotab:startup-widget-state") || "",
				JSON.stringify(bundledConfig),
				(appliedConfigSource ?? configSource()),
			] : [];
			for (const value of values) {
				for (let i = 0; i < value.length; i++) {
					stamp = Math.imul(stamp ^ value.charCodeAt(i), 16777619);
				}
			}
			const user = parse(localStorage.getItem("persist:user"), {}) || {};
			const info = parse(user.userInfo, {}) || {};
			return JSON.stringify({
				scope: [localStorage.getItem("gotab:customServerUrl") || location.origin,
					info.userId ?? info.id ?? info.user_id ?? info.username ?? "", Boolean(parse(user.token, ""))],
				build: script.dataset.build || "development",
				server: localStorage.getItem("gotab:customServerUrl") || (extension ? bundledConfig.server_url || script.dataset.server || "" : location.origin),
				session: sessionKey(String(parse(user.token, "") || "")),
				width: innerWidth, height: innerHeight, ratio: devicePixelRatio,
				dark: matchMedia("(prefers-color-scheme: dark)").matches,
				mode,
				index: parse(swiper.rememberLastIndex, true) ? localStorage.getItem("gotabActiveIndex") || "0" : "0",
				carousel: localStorage.getItem("carouselIndex") || "0",
				stamp: stamp >>> 0,
			});
		};
		// Browser chrome/scrollbar rounding can briefly change the viewport by
		// one CSS pixel during navigation. This is still the same layout, while
		// real resizing and zoom changes must continue to reject the preview.
		const matchesViewport = (saved, width, height, ratio) =>
			Number.isFinite(saved.width) && Number.isFinite(saved.height) &&
			Math.abs(saved.width - width) <= 1 && Math.abs(saved.height - height) <= 1 &&
			saved.ratio === ratio;
		const canRestoreContext = (value, liveMode) => {
			const saved = parse(value, null);
			if (share) {
				const view = share.getView();
				return share.isCurrent() && saved?.share === share.code && saved.shareScope === share.scope &&
					saved.server === share.server && saved.mode === (liveMode || view.mode) && Number(saved.index) === view.index &&
					Boolean(saved.internalLinkMode) === Boolean(view.internalLinkMode) &&
					matchesViewport(saved, innerWidth, innerHeight, devicePixelRatio) &&
					saved.dark === matchMedia("(prefers-color-scheme: dark)").matches;
			}
			// Modern previews only need a small identity/layout check. Do not read
			// and hash every bookmark and setting before their first paint.
			const current = parse(getContext(saved?.session === undefined || (extension && saved?.server === undefined), liveMode), null);
			if (!saved || !Array.isArray(saved.scope) || saved.scope.length !== 3) return false;
			if (saved.scope[0] !== current.scope[0] || String(saved.scope[1]) !== String(current.scope[1]) || saved.scope[2] !== current.scope[2]) return false;
			if (extension && (saved.server === undefined
				? saved.stamp !== current.stamp || saved.build !== current.build
				: saved.server !== current.server)) return false;
			// Older snapshots have no independent session fingerprint. Keep their
			// original data check until a newly captured snapshot replaces them.
			if (saved.session === undefined ? saved.stamp !== current.stamp : saved.session !== current.session) return false;
			if (localStorage.getItem("initOver") !== "1" || localStorage.getItem("gotab:defaultDataRefreshServerUrl")) return false;
			const switching = localStorage.getItem("gotab:serverSwitching");
			if (switching && (!Number.isFinite(Number(switching)) || Date.now() - Number(switching) <= 30000)) return false;
			// Freshness can be relaxed, but displaying another mode creates a visible
			// normal -> simple flash. Keep each mode's last complete page separately.
			return saved.mode === current.mode && ["normal", "simple"].includes(saved.mode) &&
				matchesViewport(saved, current.width, current.height, current.ratio);
		};
		const safeUrl = (value, image = false) => {
			if (typeof value !== "string" || !value.trim()) return false;
			// SVG is safe in an img source (never as inline HTML or a link).
			if (image && /^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml)[;,]/i.test(value)) return true;
			try {
				const url = new URL(value, location.href);
				return (image ? ["http:", "https:", "chrome-extension:", "moz-extension:"]
					: ["http:", "https:", "mailto:", "tel:", "chrome-extension:", "moz-extension:"]).includes(url.protocol);
			} catch { return false; }
		};
		const getInternalHref = (href) => extension
			? `${location.pathname}#${base.replace(/\/$/, "")}${href}`
			: `${base.replace(/\/$/, "")}${href}`;
		const tags = new Set(("div span a p h1 h2 h3 h4 h5 h6 ul ol li main section header footer nav article aside time button input label img br hr strong b i em small sup sub pre code blockquote u s abbr del table thead tbody tr td th svg path g rect circle ellipse line polyline polygon text defs symbol lineargradient radialgradient stop clippath mask use").split(" "));
		const attributes = new Set(("id class style title role hidden inert placeholder href target rel src alt loading decoding width height colspan rowspan viewbox d fill stroke stroke-width stroke-linecap stroke-linejoin x y x1 y1 x2 y2 cx cy r rx ry points transform opacity fill-rule clip-rule focusable offset stop-color stop-opacity clip-path mask stroke-dasharray stroke-dashoffset preserveaspectratio").split(" "));
		const packedAttributes = [["data-startup-class-ref", "class"], ["data-startup-style-ref", "style"]];
		const packedImageAttributes = [["data-startup-src-ref", "src"], ["data-startup-source-ref", "data-startup-image-source"]];
		const excludedNodes = '[role="dialog"], [data-startup-exclude], #wallpaper-area, .ant-modal-root, .ant-drawer';
		const nextElement = (node, root, skipChildren = false) => {
			if (!skipChildren && node.firstElementChild) return node.firstElementChild;
			while (node && node !== root) {
				if (node.nextElementSibling) return node.nextElementSibling;
				node = node.parentElement;
			}
			return null;
		};
		function* sanitizeInChunks(root, fallbackImage, options) {
			const snapshot = options?.snapshot;
			const nodes = options?.nodes;
			const imageUrls = new Map();
			const safeImageUrl = (value) => {
				if (!imageUrls.has(value)) imageUrls.set(value, safeUrl(value, true));
				return imageUrls.get(value);
			};
			const fallback = safeImageUrl(fallbackImage) ? fallbackImage : "";
			let processed = 0;
			let node = root;
			while (node) {
				if (++processed % 32 === 0) yield;
				// Decode before checking excluded classes. One walk handles packed
				// attributes, validation and preview metadata without retaining a full
				// node array or visiting descendants of an excluded subtree.
				if (snapshot) {
					for (const [reference, attribute] of packedAttributes) {
						const id = node.getAttribute(reference);
						if (id === null) continue;
						const value = snapshot.attributeValues?.[attribute]?.[Number(id)];
						if (typeof value === "string") node.setAttribute(attribute, value);
						node.removeAttribute(reference);
					}
				}
				const tag = node.localName.toLowerCase();
				if (!tags.has(tag) || node.matches(excludedNodes)) {
					const next = nextElement(node, root, true);
					node.remove();
					node = next;
					continue;
				}
				if (snapshot && tag === "img") {
					for (const [reference, attribute] of packedImageAttributes) {
						const id = node.getAttribute(reference);
						if (id === null) continue;
						const source = snapshot.imageSources?.[Number(id)];
						if (safeImageUrl(source)) node.setAttribute(attribute, source);
						node.removeAttribute(reference);
					}
				}
				// Iterate the live attribute list backwards so removals need no copy.
				for (let i = node.attributes.length - 1; i >= 0; i--) {
					const attribute = node.attributes[i];
					const name = attribute.name.toLowerCase();
					if (!attributes.has(name) && !name.startsWith("aria-") && !name.startsWith("data-")) {
						node.removeAttribute(attribute.name);
						continue;
					}
					if (nodes) {
						switch (name) {
							case "id": if (attribute.value === "search-input" && !nodes.searchInput) nodes.searchInput = node; break;
							case "data-startup-action": if (attribute.value === "search") nodes.searchButtons.push(node); break;
							case "data-startup-clock": nodes.clock.push(node); break;
							case "data-startup-date-solar": nodes.solar.push(node); break;
							case "data-startup-date-week": nodes.week.push(node); break;
							case "data-startup-date-lunar": nodes.lunar.push(node); break;
							case "data-startup-countdown-part": nodes.countdown.push(node); break;
							case "data-startup-scroll-id": nodes.groups.push(node); break;
							case "data-startup-scroll-top": nodes.scrolls.push(node); break;
						}
					}
				}
				if (tag === "a") {
					const href = node.getAttribute("href");
					if (!href || href.startsWith("#") || !safeUrl(href) || node.dataset.startupDeferred === "true") {
						node.removeAttribute("href");
						node.setAttribute("aria-disabled", "true");
					} else node.setAttribute("rel", "noopener noreferrer");
				}
				if (tag === "use" && !node.getAttribute("href")?.startsWith("#")) node.removeAttribute("href");
				if (tag === "img") {
					if (!safeImageUrl(node.getAttribute("src"))) {
						if (fallback) node.setAttribute("src", fallback);
						else { node.removeAttribute("src"); node.style.visibility = "hidden"; }
						node.dataset.startupImageStatus = "fallback";
					}
					if (node.getAttribute("alt") !== "") node.setAttribute("alt", "");
					const loading = node.getAttribute("loading");
					if (loading !== "lazy" && loading !== "eager") node.setAttribute("loading", "eager");
					if (options?.imageStates) {
						const source = node.dataset.startupImageSource;
						const status = node.dataset.startupImageStatus;
						const src = node.getAttribute("src");
						if (safeImageUrl(source) && safeImageUrl(src) && (status === "ready" || status === "fallback")) {
							options.imageStates.set(source, { src, status });
						}
					}
				}
				if (tag === "button" || tag === "input") {
					node.setAttribute("tabindex", "-1");
					node.style.pointerEvents = "none";
					if (tag === "input") node.setAttribute("readonly", "");
				}
				node.removeAttribute("data-card-hover-active");
				node = nextElement(node, root);
			}
		}
		const bindImageErrors = (root, fallbackImage, imageStates) => {
			const fallback = safeUrl(fallbackImage, true) ? fallbackImage : "";
			// Error does not bubble. One capture listener replaces per-image closures
			// and updates the displayed fallback and React handoff state together.
			root.addEventListener("error", (event) => {
				const node = event.target;
				if (node?.localName !== "img") return;
				if (fallback && node.getAttribute("src") !== fallback) {
					node.setAttribute("src", fallback);
					node.dataset.startupImageStatus = "fallback";
					node.style.opacity = "1";
				} else node.style.visibility = "hidden";
				const source = node.dataset.startupImageSource;
				if (imageStates && fallback && safeUrl(source, true)) imageStates.set(source, { src: fallback, status: "fallback" });
			}, true);
		};
		const sanitize = (root, fallbackImage, options) => {
			const steps = sanitizeInChunks(root, fallbackImage, options);
			while (!steps.next().done) { /* Restore synchronously before the first paint. */ }
			bindImageErrors(root, fallbackImage, options?.imageStates);
		};
		let page;
		let restored;
		let previewRoot;
		const scrollNodes = new Map();
		const widgetScrolls = new Map();
		const widgetScrollNodes = new Map();
		const widgetSelector = (node) => {
			if (!node || node === previewRoot) return;
			if (node.dataset?.startupScrollSelector) return node.dataset.startupScrollSelector;
			const parts = [];
			for (let current = node; current && current !== previewRoot; current = current.parentElement) {
				if (current.id) { parts.unshift(`#${CSS.escape(current.id)}`); return parts.join(" > "); }
				const parent = current.parentElement;
				if (!parent) return;
				parts.unshift(`:nth-child(${Array.from(parent.children).indexOf(current) + 1})`);
				if (parent === previewRoot) return ":scope > " + parts.join(" > ");
			}
		};
		const syncWidgetScroll = (node) => {
			if (!page || node?.dataset?.startupScrollId) return;
			const selector = widgetScrollNodes.get(node) || widgetSelector(node);
			if (!selector) return;
			widgetScrollNodes.set(node, selector);
			const previous = widgetScrolls.get(selector);
			if (previous?.top === node.scrollTop && previous?.left === node.scrollLeft) return;
			widgetScrolls.set(selector, { selector, top: node.scrollTop, left: node.scrollLeft });
		};
		const readPreviewScroll = (id) => {
			if (!page) return;
			const node = scrollNodes.get(id);
			// A hidden group can have zero scroll geometry. Keep its saved value.
			return node?.clientHeight > 0
				? { top: node.scrollTop, left: node.scrollLeft }
				: restored?.scrollStates?.[id];
		};
		const syncPreviewScroll = (id, force = false) => {
			const next = readPreviewScroll(id);
			if (!next || !restored) return;
			const previous = restored.scrollStates?.[id];
			if (!force && previous?.top === next.top && previous?.left === next.left) return;
			(restored.scrollStates ||= {})[id] = next;
			window.dispatchEvent(new CustomEvent("gotab:startup-scroll", { detail: { id, ...next } }));
		};
		let requestedMode;
		let modeHandler;
		let searchInput;
		let composing = false;
		let searchHandler;
		let pendingSearch;
		let searchFeedback;
		let searchRevision = 0;
		const searchSubmission = (value, revision) => ({
			revision,
			clear: () => {
				if (!searchInput || composing || revision !== searchRevision || value !== searchInput.value) return false;
				searchRevision++;
				searchInput.value = "";
				searchInput.blur();
				pendingSearch = undefined;
				if (searchFeedback) searchFeedback.textContent = "";
				return true;
			},
		});
		const setSearchHandler = (handler) => {
			searchHandler = handler;
			if (!handler || pendingSearch === undefined) return;
			const open = share?.getData()?.shareData.openType || parse(localStorage.getItem("persist:openType"), {}) || {};
			const search = share?.getData()?.shareData.searchBar || parse(localStorage.getItem("persist:searchBar"), {}) || {};
			// A deferred web popup has lost its user activation. Keep the text
			// ready instead of opening a blocked popup (or changing its target).
			if (extension || ((share ? open.searchEngineOpenMode : parse(open.searchEngineOpenMode, "_blank")) === "_self" && !(share ? search.batchSearch : parse(search.batchSearch, false)))) {
				const { value, revision } = pendingSearch;
				pendingSearch = undefined;
				handler(value, searchSubmission(value, revision));
			} else if (searchFeedback) searchFeedback.textContent = "搜索已就绪";
		};
		const getSearchState = () => searchInput ? {
			value: searchInput.value,
			focused: searchInput.getRootNode().activeElement === searchInput,
			selectionStart: searchInput.selectionStart, selectionEnd: searchInput.selectionEnd,
			composing, revision: searchRevision,
		} : undefined;
		const getRequestedMode = () => requestedMode;
		const setModeHandler = (handler) => {
			modeHandler = handler;
			if (handler && requestedMode) {
				const mode = requestedMode;
				handler(mode);
			}
		};
		const images = new Map();
		const icons = new Map();
		let clockTimer;
		let recoveryTimer;
		let recoveryNotice;
		let recoveryPending = false;
		let loadFailed = false;
		let gatedRoot;
		let rootAttributes;
		let rootObserver;
		let dismissed = false;
		let restorationClosed = false;
		let restorationPending = true;
		let liveReady;
		const gateLiveRoot = () => {
			const root = document.getElementById("root");
			if (!root || gatedRoot) return;
			gatedRoot = root;
			rootAttributes = { inert: root.getAttribute("inert"), ariaHidden: root.getAttribute("aria-hidden") };
			root.setAttribute("inert", "");
			root.setAttribute("aria-hidden", "true");
			rootObserver?.disconnect();
		};
		const holdLiveRoot = () => {
			// Preserve layout/lazy loading underneath, without painting two copies.
			if (!document.getElementById("gotab-startup-gate")) {
				const gate = document.createElement("style");
				gate.id = "gotab-startup-gate";
				gate.textContent = "body > #root { opacity: 0 !important; pointer-events: none !important; } body > #root *, body > #root *::before, body > #root *::after { animation: none !important; transition: none !important; }";
				document.head.appendChild(gate);
			}
			gateLiveRoot();
			if (!gatedRoot && !rootObserver) {
				rootObserver = new MutationObserver(gateLiveRoot);
				rootObserver.observe(document.body, { childList: true });
			}
		};
		const releaseLiveRoot = () => {
			rootObserver?.disconnect();
			rootObserver = undefined;
			if (gatedRoot) {
				for (const [name, value] of [["inert", rootAttributes.inert], ["aria-hidden", rootAttributes.ariaHidden]]) {
					if (value === null) gatedRoot.removeAttribute(name);
					else gatedRoot.setAttribute(name, value);
				}
				gatedRoot = undefined;
			}
			document.getElementById("gotab-startup-gate")?.remove();
			if (document.querySelector('#wallpaper-area[data-startup-wallpaper-ready="true"], #wallpaper-area[data-startup-wallpaper-changed="true"]')) {
				document.getElementById("gotab-startup-background")?.remove();
			}
		};
		const beginHandoff = (isLiveReady) => {
			if (dismissed || restorationClosed) return;
			// The React shell can mount before Swiper's active portal. Keep a
			// pending IDB preview eligible until the actual foreground is ready.
			// Hide that incomplete shell so a winning preview never covers a
			// foreground the user has already seen or started interacting with.
			if (isLiveReady && restorationPending && !page && !isLiveReady()) {
				liveReady = isLiveReady;
				holdLiveRoot();
				return;
			}
			liveReady = undefined;
			restorationClosed = true;
			backgroundRestorationClosed = true;
			if (!page) releaseLiveRoot();
		};
		const showRecovery = () => {
			if (!page || dismissed) return;
			if (composing && !loadFailed) { recoveryPending = true; return; }
			recoveryPending = false;
			if (!recoveryNotice) {
				recoveryNotice = document.createElement("div");
				recoveryNotice.dataset.startupRecovery = "true";
				recoveryNotice.setAttribute("role", "status");
				recoveryNotice.style.cssText = "position:fixed;bottom:72px;left:50%;transform:translateX(-50%);max-width:calc(100% - 32px);display:flex;align-items:center;gap:12px;padding:8px 16px;border-radius:20px;background:rgba(0,0,0,.75);color:white;font:14px/1.5 sans-serif";
				const message = document.createElement("span");
				const retry = document.createElement("button");
				retry.textContent = "重新加载";
				retry.style.cssText = "color:white;background:transparent;border:1px solid #ffffff80;border-radius:12px;padding:2px 10px;cursor:pointer;white-space:nowrap";
				retry.addEventListener("click", () => { if (!retry.disabled) { retry.disabled = true; location.reload(); } });
				recoveryNotice.append(message, retry);
				page.shadowRoot.appendChild(recoveryNotice);
			}
			recoveryNotice.firstElementChild.textContent = loadFailed ? "页面加载失败，已保留上次内容" : "页面仍在加载，可重试";
		};
		const onStartupError = (event) => {
			if (event.type !== "vite:preloadError" && !(event.target?.localName === "script" && event.target.type === "module")) return;
			loadFailed = true;
			showRecovery();
		};
		window.addEventListener("error", onStartupError, true);
		window.addEventListener("vite:preloadError", onStartupError);
		const dismissPage = () => {
			dismissed = true;
			liveReady = undefined;
			backgroundRestorationClosed = true;
			// Read synchronously: the final native scroll event may still be queued.
			for (const id of scrollNodes.keys()) syncPreviewScroll(id, true);
			page?.remove();
			page = undefined;
			restored = undefined;
			previewRoot = undefined;
			scrollNodes.clear();
			widgetScrolls.clear();
			widgetScrollNodes.clear();
			requestedMode = undefined;
			searchInput = undefined;
			searchFeedback = undefined;
			pendingSearch = undefined;
			clearInterval(clockTimer);
			clearTimeout(recoveryTimer);
			recoveryNotice = undefined;
			window.removeEventListener("error", onStartupError, true);
			window.removeEventListener("vite:preloadError", onStartupError);
			releaseLiveRoot();
			document.getElementById("gotab-startup-fonts")?.remove();
		};
		const getImageState = (source) => images.get(source);
		const getScrollState = readPreviewScroll;
		const restoreScroll = (root) => {
			for (const id of scrollNodes.keys()) syncPreviewScroll(id);
			// Read offsets at handoff too: native scroll events may still be queued.
			for (const node of widgetScrollNodes.keys()) syncWidgetScroll(node);
			for (const item of widgetScrolls.values()) {
				try {
					const node = root.querySelector(item.selector);
					if (!node || node.hasAttribute("data-startup-scroll-id")) continue;
					// Preview owns input until handoff. A widget's deferred layout
					// restore must not put its older offset over a new preview scroll.
					if (Math.abs(node.scrollTop - item.top) >= 1) node.scrollTop = item.top;
					if (Math.abs(node.scrollLeft - item.left) >= 1) node.scrollLeft = item.left;
				} catch { /* An updated widget may have a different tree. */ }
			}
		};
		const maxPageLength = 8000000;
		const storage = createPageStorage();
		window.gotabStartup = { maxPageLength, writeSnapshot: (raw, isCurrent, mode) => share ? share.writeSnapshot(raw, isCurrent) : storage.write(raw, isCurrent, false, mode), clearSnapshot: () => { if (share) share.clear(); else storage.clear(); window.gotabTitle?.clearSnapshotTitle(); dismissPage(); }, getInternalHref, setSiteConfigSource: () => { appliedConfigSource = configSource(); }, getContext, canRestoreContext, sanitize, sanitizeInChunks, beginHandoff, dismissPage, restoreScroll, getImageState, getIconState: name => icons.get(name), getScrollState, getRequestedMode, setModeHandler, getSearchState, setSearchHandler };
		// Keep the detached preview tree out of the long-lived API closure once
		// React has taken over (only decoded icon metadata needs to survive).
		const restorePage = (raw) => {
		// The portal may have committed since the previous animation frame.
		// Check synchronously before letting an asynchronous result cover it.
		if (liveReady?.()) { beginHandoff(); return; }
		if (dismissed || restorationClosed || !canPreview() || (!share && ![base, `${base}index.html`, ...(extension ? [`${base}newtab.html`] : [])].includes(location.pathname)) ||
			(extension && !["", "#", "#/"].includes(location.hash)) || typeof raw !== "string" || !raw || raw.length > maxPageLength) return;
		const snapshot = parse(raw, null);
		// Keep the last complete page while the application loads fresher data.
		if (
			!snapshot || snapshot.version !== 5 || !canRestoreContext(snapshot.context) ||
			typeof snapshot.html !== "string" || typeof snapshot.css !== "string" ||
			!Number.isFinite(snapshot.savedAt)
		) return;
		const context = JSON.parse(snapshot.context);
		page = document.createElement("div");
		page.id = "gotab-startup-page";
		page.setAttribute("aria-label", "首页");
		page.dataset.startupGroup = context.index;
		page.dataset.startupMode = context.mode;
		for (const [property, value] of Object.entries(snapshot.hostStyle || {})) {
			// Older captures froze body line-height to pixels. Let the copied
			// :host rule keep its unitless value so child font sizes lay out alike.
			if (property === "lineHeight" || property === "line-height") continue;
			if (property.startsWith("--")) page.style.setProperty(property, value);
			else page.style[property] = value;
		}
		Object.assign(page.style, {
			position: "fixed", inset: "0", zIndex: "2147480000",
			overflow: "hidden", background: "transparent",
		});
		const shadow = page.attachShadow({ mode: "open" });
		const style = document.createElement("style");
		style.textContent = snapshot.css + "\n*, *::before, *::after { animation: none !important; transition: none !important; }";
		// Font-face rules in a shadow stylesheet do not register document fonts.
		// This also covers Vite dev mode, where app CSS arrives after this script.
		if (typeof snapshot.fontCss === "string") {
			const fonts = document.createElement("style");
			fonts.id = "gotab-startup-fonts";
			fonts.textContent = snapshot.fontCss;
			document.head.appendChild(fonts);
		}
		const content = document.createElement("div");
		content.style.cssText = "width:100%;height:100%";
		content.innerHTML = snapshot.html;
		previewRoot = content.querySelector("#root") || content;
		const nodes = { searchInput: undefined, searchButtons: [], clock: [], solar: [], week: [], lunar: [], countdown: [], groups: [], scrolls: [] };
		sanitize(content, snapshot.fallbackImage, { snapshot, nodes, imageStates: images });
		// Reuse only SVG that has already passed the same sanitizer as the preview.
		for (const svg of content.querySelectorAll('svg[data-startup-icon-name]')) {
			const name = svg.dataset.startupIconName;
			const box = (svg.getAttribute("viewBox") || svg.getAttribute("viewbox") || "").trim().split(/\s+/).map(Number);
			if (name && box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) {
				icons.set(name, { body: svg.innerHTML, left: box[0], top: box[1], width: box[2], height: box[3] });
			}
		}
		searchInput = nodes.searchInput;
		if (searchInput) {
			searchInput.removeAttribute("readonly");
			searchInput.removeAttribute("tabindex");
			searchInput.style.pointerEvents = "auto";
			searchInput.addEventListener("input", () => { searchRevision++; });
			searchInput.addEventListener("compositionstart", () => { composing = true; searchRevision++; });
			searchInput.addEventListener("compositionend", () => {
				composing = false; searchRevision++;
				// Allow an IME-delayed handoff to finish before suggesting a retry.
				if (recoveryPending) recoveryTimer = setTimeout(showRecovery, 1000);
			});
		}
		const submitSearch = () => {
			if (!searchInput || composing) return;
			const value = searchInput.value;
			const revision = ++searchRevision;
			if (searchHandler) { pendingSearch = undefined; searchHandler(value, searchSubmission(value, revision)); return; }
			pendingSearch = { value, revision };
			if (!searchFeedback) {
				searchFeedback = document.createElement("div");
				searchFeedback.setAttribute("role", "status");
				searchFeedback.style.cssText = "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:20px;background:rgba(0,0,0,.65);color:white;font-size:14px;pointer-events:none";
				content.appendChild(searchFeedback);
			}
			searchFeedback.textContent = "正在准备搜索…";
		};
		searchInput?.addEventListener("keydown", (event) => {
			if (event.key === "Enter" && !event.isComposing && !composing) { event.preventDefault(); submitSearch(); }
		});
		for (const button of nodes.searchButtons) {
			button.style.pointerEvents = "auto";
			button.addEventListener("click", submitSearch);
		}
		// Native clock/date text remains live even when the snapshot is months
		// old or the application bundle is still downloading.
		const { clock: clockNodes, solar: solarNodes, week: weekNodes, lunar: lunarNodes } = nodes;
		const countdowns = nodes.countdown.map(node => {
			const target = node.closest("[data-startup-countdown]")?.dataset.startupCountdown;
			const time = target?.split(":").map(Number);
			return time?.length === 3 && time.every(Number.isFinite) && time[0] >= 0 && time[0] < 24 && time.slice(1).every(value => value >= 0 && value < 60)
				? { node, time, part: node.dataset.startupCountdownPart } : undefined;
		}).filter(Boolean);
		let lunarFormatter;
		try { if (lunarNodes.length) lunarFormatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { year: "numeric", month: "long", day: "numeric" }); } catch { /* Keep cached lunar text until React renders. */ }
		let previousDay;
		const tick = () => {
			const now = new Date();
			const pad = (value) => String(value).padStart(2, "0");
			for (const node of clockNodes) {
				const [hours, precision] = node.dataset.startupClock.split(":");
				const hour = hours === "12" ? (now.getHours() > 12 ? now.getHours() - 12 : now.getHours()) : pad(now.getHours());
				node.textContent = `${hour}:${pad(now.getMinutes())}${precision === "seconds" ? `:${pad(now.getSeconds())}` : ""}`;
			}
			for (const { node, time, part } of countdowns) {
				const target = new Date(now);
				target.setHours(...time, 0);
				const difference = target.getTime() - now.getTime();
				const total = Math.floor(Math.abs(difference) / 1000);
				const hm = `${Math.floor(total / 3600) % 24}:${pad(Math.floor(total / 60) % 60)}`;
				const seconds = pad(total % 60);
				const value = part === "direction" ? (difference < 0 ? "以前" : "以后")
					: part === "hm" ? hm : part === "hms" ? `${hm}:${seconds}` : part === "seconds" ? `\n${seconds}` : undefined;
				if (value !== undefined && node.textContent !== value) node.textContent = value;
			}
			const day = now.toDateString();
			if (day === previousDay) return;
			previousDay = day;
			for (const node of solarNodes) {
				const fields = node.dataset.startupDateSolar;
				node.textContent = `${fields.includes("y") ? `${now.getFullYear()}年` : ""}${fields.includes("m") ? `${now.getMonth() + 1}月` : ""}${fields.includes("d") ? `${now.getDate()}日` : ""}`;
			}
			for (const node of weekNodes) node.textContent = `星期${"日一二三四五六"[now.getDay()]}`;
			if (lunarFormatter) {
				try {
					const parts = Object.fromEntries(lunarFormatter.formatToParts(now).map(({ type, value }) => [type, value]));
					const year = (parts.relatedYear || "").replace(/\d/g, (digit) => "〇一二三四五六七八九"[Number(digit)]);
					const number = Number(parts.day);
					const date = number === 10 ? "初十" : number === 20 ? "二十" : number === 30 ? "三十" : `${["初", "十", "廿"][Math.floor(number / 10)]}${"一二三四五六七八九"[(number % 10) - 1]}`;
					for (const node of lunarNodes) {
						const fields = node.dataset.startupDateLunar;
						if (year && parts.month && number >= 1 && number <= 30) node.textContent = `${fields.includes("y") ? `${year}年` : ""}${fields.includes("m") ? parts.month.replace("十一月", "冬月").replace("十二月", "腊月") : ""}${fields.includes("d") ? date : ""}`;
					}
				} catch { /* Unsupported calendar should not block the page. */ }
			}
		};
		tick();
		if (clockNodes.length || solarNodes.length || weekNodes.length || lunarNodes.length || countdowns.length) clockTimer = setInterval(tick, 1000);
		content.addEventListener("click", (event) => {
			const clock = event.target instanceof Element && event.target.closest('[data-startup-action="toggle-mode"]');
			if (!clock || event.target.closest("a[href]")) return;
			event.preventDefault();
			const mode = requestedMode || context.mode;
			requestedMode = mode === "normal" ? "simple" : "normal";
			if (modeHandler) {
				const nextMode = requestedMode;
				modeHandler(nextMode);
				return;
			}
			// Early clicks remain effective even while the application module is
			// downloading. Show immediate feedback and apply the target once ready.
			let feedback = content.querySelector("[data-startup-mode-pending]");
			if (!feedback) {
				feedback = document.createElement("div");
				feedback.dataset.startupModePending = "true";
				feedback.setAttribute("role", "status");
				feedback.style.cssText = "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:20px;background:rgba(0,0,0,.65);color:white;font-size:14px;pointer-events:none";
				content.appendChild(feedback);
			}
			feedback.textContent = requestedMode === "simple" ? "正在切换到简约模式…" : "正在切换到普通模式…";
		});
		// Finish layout-affecting writes while detached. In particular, refresh
		// must start at the top even when an older snapshot retained wheel offsets.
		const scrollStates = {};
		for (const node of nodes.groups) {
			const id = node.dataset.startupScrollId;
			node.dataset.startupScrollTop = "0";
			node.dataset.startupScrollLeft = "0";
			node.dataset.startupScrollOffset = "0";
			for (const property of ["--slide-touch-offset-x", "--slide-touch-offset-y", "--slide-touch-offset-transition"]) {
				node.style.removeProperty(property);
			}
			const scrollContent = node.querySelector(":scope > .slide-scroll-content");
			if (scrollContent) scrollContent.style.transform = "translate3d(0, 0, 0)";
			scrollStates[id] = { top: 0, left: 0 };
			scrollNodes.set(id, node);
		}
		shadow.append(style, content);
		if (typeof snapshot.background === "string") renderBackground(snapshot.background, context);
		holdLiveRoot();
		snapshot.scrollStates = scrollStates;
		restored = snapshot;
		document.body.appendChild(page);
		// Newly parsed group nodes already have zero scroll position. Only other
		// saved scroll regions need attached layout; no group geometry read here.
		// New captures carry the original live selector on the actual node.
		// Excluded siblings can shift nth-child paths in the detached preview;
		// only legacy records need to find preview nodes by those old selectors.
		const knownScrollSelectors = new Set(nodes.scrolls.map(node => node.dataset.startupScrollSelector).filter(Boolean));
		for (const item of snapshot.scrolls || []) {
			if (knownScrollSelectors.has(item.selector)) continue;
			try {
				const node = previewRoot.querySelector(item.selector);
				if (node && !node.dataset.startupScrollId) {
					node.scrollTop = item.top; node.scrollLeft = item.left;
					widgetScrollNodes.set(node, item.selector);
				}
			} catch { /* Stale selector. */ }
		}
		for (const node of nodes.scrolls) {
			if (node.dataset.startupScrollId) continue;
			node.scrollTop = Number(node.dataset.startupScrollTop) || 0;
			node.scrollLeft = Number(node.dataset.startupScrollLeft) || 0;
			syncWidgetScroll(node);
		}
		for (const node of widgetScrollNodes.keys()) syncWidgetScroll(node);
		recoveryTimer = setTimeout(showRecovery, 10000);
		if (loadFailed) showRecovery();
		const searchSettings = share?.getData()?.shareData.searchBar || parse(localStorage.getItem("persist:searchBar"), {}) || {};
		if (share ? searchSettings.autoFocus : parse(searchSettings.autoFocus, false)) searchInput?.focus({ preventScroll: true });
		// Scroll events neither bubble nor cross the shadow boundary.
		content.addEventListener("scroll", (event) => {
			const id = event.target?.dataset?.startupScrollId;
			if (id) syncPreviewScroll(id);
			else if (event.target instanceof Element) syncWidgetScroll(event.target);
		}, true);
		// Only a validated, successfully mounted preview may supply this title.
		if (!share) window.gotabTitle?.restoreSnapshotTitle(snapshot.title, snapshot.customTitle);
		};
		const legacy = share ? null : storage.legacy();
		// Start IndexedDB now, even while the HTML parser is still in <head>.
		const pendingSnapshot = share ? share.ready.then(() => share.getSnapshot()) : storage.read(JSON.parse(getContext(false)).mode);
		titleRestorePending = true;
		void (async () => {
			if (legacy) {
				await waitForBody();
				restorePage(legacy);
				if (restored) {
					void storage.write(legacy, () => canRestoreContext(JSON.parse(legacy).context), true, JSON.parse(restored.context).mode);
					return;
				}
			}
			const raw = await pendingSnapshot;
			if (!raw) return;
			await waitForBody();
			// Recheck account, mode, permissions and handoff guards after the wait.
			restorePage(raw);
		})().catch(() => dismissPage()).finally(() => {
			restorationPending = false;
			// Missing/rejected records must release the shell immediately. Do not
			// hold first visits or unsupported storage until the layout timeout.
			if (!restored && liveReady) beginHandoff();
			liveReady = undefined;
			window.gotabTitle?.finishRestore();
		});
	} catch {
		try { window.gotabStartup?.dismissPage(); } catch { /* Partially restored tree. */ }
		document.getElementById("gotab-startup-page")?.remove();
		document.getElementById("gotab-startup-gate")?.remove();
		document.getElementById("gotab-startup-fonts")?.remove();
	} finally {
		if (!titleRestorePending) window.gotabTitle?.finishRestore();
	}
})();

})();
