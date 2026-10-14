/* Restore a session-validated tab title before the application loads. */
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
	const readServer = () => {
		const customServer = localStorage.getItem("gotab:customServerUrl");
		return {
			scope: customServer || location.origin,
			server: customServer || (extension ? globalThis.siteConfig?.server_url || script.dataset.server || "" : location.origin),
		};
	};
	// Pin the server before another tab can switch shared storage. A stale tab
	// must never save its current title as belonging to the replacement server.
	let initialServer;
	try { initialServer = readServer(); } catch { /* Storage is optional. */ }
	const identity = (user, server = initialServer) => {
		if (!server) return;
		const token = String(user?.token || "");
		const info = user?.userInfo || {};
		let first = 2166136261, second = 5381;
		for (const char of token) {
			first = Math.imul(first ^ char.charCodeAt(0), 16777619);
			second = Math.imul(second, 33) ^ char.charCodeAt(0);
		}
		return JSON.stringify([server.scope, String(info.userId ?? info.id ?? info.user_id ?? info.username ?? ""),
			Boolean(token), server.server, `${token.length}:${first >>> 0}:${second >>> 0}`]);
	};
	const storedIdentity = () => {
		const server = readServer();
		if (!initialServer || server.scope !== initialServer.scope || server.server !== initialServer.server) return;
		const user = parse(localStorage.getItem("persist:user"), {});
		return identity({ userInfo: parse(user.userInfo, {}), token: parse(user.token, "") }, server);
	};
	const record = (customTitle, owner) => JSON.stringify({ version: 2, origin: location.origin, base: basePath,
		identity: owner, customTitle: normalize(customTitle) });
	const canRestore = () => {
		const switching = localStorage.getItem("gotab:serverSwitching");
		return localStorage.getItem("initOver") === "1" && !localStorage.getItem("gotab:defaultDataRefreshServerUrl") &&
			!(switching && (!Number.isFinite(Number(switching)) || Date.now() - Number(switching) <= 30000));
	};
	let liveTitle;
	let cachedCustomTitle;
	let cachedIdentity;
	let fallbackTitle = defaultTitle;
	if (isHomePage()) {
		try {
			const cached = parse(localStorage.getItem(key), null);
			const owner = storedIdentity();
			// Migrate only a fully validated old title record. The page-cache epoch
			// is read solely for this one-time migration and is absent from v2.
			const supported = cached?.version === 2 || (cached?.version === 1 && cached.epoch &&
				cached.epoch === localStorage.getItem("gotab:startup-page-epoch"));
			if (supported && cached.origin === location.origin && cached.base === basePath &&
				typeof cached.customTitle === "string" && cached.customTitle.length <= 4096 &&
				owner && cached.identity === owner && canRestore()) {
				cachedCustomTitle = normalize(cached.customTitle);
				cachedIdentity = owner;
				if (cached.version === 1) localStorage.setItem(key, record(cachedCustomTitle, owner));
			}
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
			: cachedCustomTitle !== undefined ? cachedCustomTitle || fallbackTitle : fallbackTitle;
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
		// The caller supplies the rehydrated Redux user. Matching only shared
		// storage would let an older tab overwrite a newer account's title.
		cacheHomeTitle(customTitle, user) {
			if (!isHomePage() || typeof customTitle !== "string" || customTitle.length > 4096) return false;
			try {
				const owner = storedIdentity();
				if (!owner || identity(user) !== owner || !canRestore()) return false;
				const raw = record(customTitle, owner);
				if (localStorage.getItem(key) !== raw) localStorage.setItem(key, raw);
				cachedCustomTitle = normalize(customTitle);
				cachedIdentity = owner;
				return true;
			} catch { return false; }
		},
		clearHomeTitleCache(user) {
			if (!isHomePage()) return;
			const owner = identity(user);
			if (!owner) return;
			try {
				const cached = parse(localStorage.getItem(key), null);
				if (cached?.identity === owner && cached.origin === location.origin && cached.base === basePath) localStorage.removeItem(key);
			} catch { /* Storage is optional. */ }
			if (cachedIdentity === owner) cachedCustomTitle = cachedIdentity = undefined;
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
