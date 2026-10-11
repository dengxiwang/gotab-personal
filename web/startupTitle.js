/* Restore the tab title synchronously, independently of the larger IDB page. */
(() => {
	const marker = document.getElementById("gotab-default-title");
	const templateTitle = marker?.content.querySelector("title")?.textContent;
	const defaultTitle = templateTitle && !/^\{\{\s*\.\w+\s*\}\}$/.test(templateTitle.trim())
		? templateTitle : document.title || "GoTab 新标签页";
	const script = document.currentScript;
	let basePath;
	try {
		basePath = new URL(".", new URL(script.src || script.dataset.src, location.href)).pathname;
	} catch {
		if (!document.title) document.title = defaultTitle;
		return;
	}
	const extension = /^(?:chrome|moz)-extension:$/.test(location.protocol);
	const isHomePage = () =>
		[basePath, `${basePath}index.html`, ...(extension ? [`${basePath}newtab.html`] : [])].includes(location.pathname) &&
		(!extension || ["", "#", "#/"].includes(location.hash));
	const normalize = title => typeof title === "string" ? title.trim() : "";
	const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
	const key = "gotab:startup-title";
	const epochKey = "gotab:startup-page-epoch";
	// This small record shares the page's reset/session boundary, but deliberately
	// not its viewport, mode, build or DOM readiness. None changes a user's title.
	const identity = context => Array.isArray(context?.scope) && context.scope.length === 3 &&
		typeof context.server === "string" && typeof context.session === "string"
		? JSON.stringify([context.scope[0], String(context.scope[1]), context.scope[2], context.server, context.session]) : undefined;
	const getContext = () => {
		const user = parse(localStorage.getItem("persist:user"), {});
		const info = parse(user.userInfo, {});
		const token = String(parse(user.token, "") || "");
		let first = 2166136261, second = 5381;
		for (const char of token) {
			first = Math.imul(first ^ char.charCodeAt(0), 16777619);
			second = Math.imul(second, 33) ^ char.charCodeAt(0);
		}
		const customServer = localStorage.getItem("gotab:customServerUrl");
		return {
			scope: [customServer || location.origin, info.userId ?? info.id ?? info.user_id ?? info.username ?? "", Boolean(token)],
			server: customServer || (extension ? globalThis.siteConfig?.server_url || script.dataset.server || "" : location.origin),
			session: `${token.length}:${first >>> 0}:${second >>> 0}`,
		};
	};
	const canRestore = () => {
		const switching = localStorage.getItem("gotab:serverSwitching");
		return localStorage.getItem("initOver") === "1" && !localStorage.getItem("gotab:defaultDataRefreshServerUrl") &&
			!(switching && (!Number.isFinite(Number(switching)) || Date.now() - Number(switching) <= 30000));
	};
	let liveTitle;
	let snapshotTitle;
	let cachedCustomTitle;
	let fallbackTitle = defaultTitle;
	if (isHomePage()) {
		try {
			const cached = parse(localStorage.getItem(key), null);
			const epoch = localStorage.getItem(epochKey);
			if (epoch && cached?.version === 1 && cached.epoch === epoch && cached.origin === location.origin &&
				cached.base === basePath && typeof cached.customTitle === "string" && cached.customTitle.length <= 4096 &&
				cached.identity === identity(getContext()) && canRestore()) cachedCustomTitle = normalize(cached.customTitle);
		} catch { /* Storage may be unavailable. The HTML default is still ready. */ }
	}
	// Put the chosen title BEFORE the parser's later fallback <title>. That
	// fallback also provides a real title when scripting is blocked or disabled.
	if (!document.querySelector("title")) {
		const title = document.createElement("title");
		document.head.insertBefore(title, marker || script);
	}
	const apply = () => {
		if (!isHomePage()) return;
		const nextTitle = liveTitle !== undefined ? liveTitle || fallbackTitle
			: cachedCustomTitle !== undefined ? cachedCustomTitle || fallbackTitle : snapshotTitle ?? fallbackTitle;
		if (document.title !== nextTitle) document.title = nextTitle;
	};
	window.gotabTitle = {
		setHomeTitle(title) {
			liveTitle = normalize(title);
			apply();
		},
		setDefaultTitle(title) {
			fallbackTitle = normalize(title) || defaultTitle;
			apply();
		},
		restoreSnapshotTitle(title, customTitle) {
			if (liveTitle !== undefined || cachedCustomTitle !== undefined) return;
			// Older snapshots did not record whether the title was customized.
			if (typeof customTitle === "string") cachedCustomTitle = normalize(customTitle);
			else snapshotTitle = typeof title === "string" ? title : undefined;
			apply();
		},
		// Called only with a live-session-validated context, after a committed
		// snapshot or a real settings update. Never derive ownership from DOM.
		saveSnapshotTitle(customTitle, context) {
			if (!isHomePage() || typeof customTitle !== "string" || customTitle.length > 4096) return;
			try {
				const epoch = localStorage.getItem(epochKey);
				const currentIdentity = identity(getContext());
				if (!epoch || !canRestore() || !currentIdentity || identity(parse(context, null)) !== currentIdentity) return;
				const raw = JSON.stringify({ version: 1, epoch, origin: location.origin, base: basePath,
					identity: currentIdentity, customTitle: normalize(customTitle) });
				if (localStorage.getItem(key) !== raw) localStorage.setItem(key, raw);
			} catch { /* Optional metadata must never block startup or settings. */ }
		},
		finishRestore: apply,
		clearSnapshotTitle() {
			if (!isHomePage()) return;
			try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
			cachedCustomTitle = snapshotTitle = undefined;
			apply();
		},
	};
	if (isHomePage()) apply();
	else if (!document.title) document.title = defaultTitle;
	// Only remove the parser fallback next to this script, not titles owned by
	// later route components. Stop observing as soon as it has been parsed.
	const stop = () => { observer.disconnect(); document.removeEventListener("DOMContentLoaded", stop); };
	const observer = new MutationObserver(() => {
		const fallback = script.nextElementSibling;
		if (fallback?.localName === "title" && fallback !== document.querySelector("title")) {
			fallback.remove();
			stop();
		}
	});
	observer.observe(document.head, { childList: true });
	document.addEventListener("DOMContentLoaded", stop, { once: true });
})();
