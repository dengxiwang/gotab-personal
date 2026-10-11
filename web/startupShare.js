/* Public share previews have their own storage and require fresh HTML permission. */
(() => {
	try {
		const match = location.pathname.match(/^\/s\/([a-zA-Z0-9]+)(?:\.html)?\/?$/);
		if (!match || !["http:", "https:"].includes(location.protocol)) return;
		const meta = JSON.parse(document.querySelector('meta[name="gotab-share-cache"]')?.content || "null");
		if (!meta || meta.version !== 1 || meta.code !== match[1] || ![-1, 0, 1, 2, 3].includes(meta.status)) return;
		if (meta.status === 1 && !/^[a-f0-9]{64}$/.test(meta.scope)) return;
		const server = location.origin;
		const custom = localStorage.getItem("gotab:customServerUrl");
		// This HTML cannot authorize data served by a different API origin.
		if (custom && custom.replace(/\/+$/, "") !== server) return;
		const code = meta.code;
		const scope = meta.scope || "";
		const key = JSON.stringify([server, code, scope]);
		const maxRecord = 8000000, maxTotal = 16000000, maxEntries = 6;
		let generation = 0, revision = 0, data, snapshot, view, background;
		let disabled = meta.status !== 1;
		let opening;
		const writes = new Set();
		const abortWrites = () => { for (const transaction of writes) { try { transaction.abort(); } catch { /* Settled. */ } } };
		const active = () => !disabled && location.pathname.match(/^\/s\/([a-zA-Z0-9]+)(?:\.html)?\/?$/)?.[1] === code &&
			(!localStorage.getItem("gotab:customServerUrl") || localStorage.getItem("gotab:customServerUrl").replace(/\/+$/, "") === server);
		const valid = (payload) => payload && payload.cacheScope === scope && typeof payload.shareSay === "string" &&
			payload.shareData && typeof payload.shareData === "object" && !Array.isArray(payload.shareData);
		const open = () => {
			if (opening) return opening;
			opening = new Promise((resolve) => {
				let done = false;
				const finish = db => { if (done) { db?.close(); return; } done = true; clearTimeout(timer); resolve(db); };
				const timer = setTimeout(() => finish(null), 1500);
				try {
					const request = indexedDB.open("gotab-share-startup", 1);
					request.onupgradeneeded = () => { if (done) request.transaction.abort(); else request.result.createObjectStore("pages"); };
					request.onerror = request.onblocked = () => finish(null);
					request.onsuccess = () => {
						request.result.onversionchange = () => { request.result.close(); opening = undefined; };
						finish(request.result);
					};
				} catch { finish(null); }
			});
			void opening.then(db => { if (!db) opening = undefined; });
			return opening;
		};
		const transact = async (mode, task, guarded = false, onFailure = () => {}) => {
			const db = await open();
			if (!db) return false;
			return new Promise(resolve => {
				let transaction, done = false;
				const finish = (result, error) => { if (done) return; done = true; clearTimeout(timer); writes.delete(transaction); if (!result) onFailure(error); resolve(result); };
				const timer = setTimeout(() => { try { transaction?.abort(); } catch { /* Settled. */ } finish(false); }, 1500);
				try {
					transaction = db.transaction("pages", mode);
					if (guarded) writes.add(transaction);
					transaction.oncomplete = () => finish(true);
					transaction.onerror = transaction.onabort = event => finish(false, transaction.error || event?.target?.error);
					task(transaction.objectStore("pages"), transaction);
				} catch (error) { try { transaction?.abort(); } catch { /* No transaction. */ } finish(false, error); }
			});
		};
		const clear = () => {
			generation++; disabled = true; data = snapshot = background = undefined;
			abortWrites();
			window.gotabStartup?.dismissPage();
			document.getElementById("gotab-startup-background")?.remove();
			void transact("readwrite", store => {
				const request = store.openCursor();
				request.onsuccess = () => {
					const entry = request.result;
					if (!entry) return;
					if (entry.value.server === server && entry.value.code === code) store.delete(entry.key);
					entry.continue();
				};
			});
		};
		const readGeneration = generation;
		const ready = (async () => {
			if (!active()) return;
			let record;
			const ok = await transact("readonly", store => {
				const request = store.get(key);
				request.onsuccess = () => { record = request.result; };
			});
			if (!ok || generation !== readGeneration || revision || !active() || !record || record.version !== 1 || !valid(record.data)) return;
			if (typeof record.preview !== "string" || record.preview.length > maxRecord) return;
			data = record.data; snapshot = record.preview;
			return data;
		})();
		const getView = () => {
			if (view) return view;
			const swiper = data?.shareData.swiper || {};
			const mode = "normal";
			let index = Number(swiper.activeIndex || 0);
			if (swiper.rememberLastIndex) {
				try { index = Number(JSON.parse(localStorage.getItem("sharePageActiveIndex") || "{}")[code] ?? index); } catch { /* Default index. */ }
			} else index = 0;
			const length = data?.shareData.appData?.listData?.length || 0;
			// Older exports can omit openType; match the Redux default on restore.
			let internalLinkMode = Boolean(data?.shareData.openType?.internalLinkMode ?? true);
			if (data?.shareData.home?.showChangeInternalLinkModeButton) {
				try {
					const preferred = JSON.parse(localStorage.getItem("sharePageInternalLinkMode") || "{}")[code];
					if (typeof preferred === "boolean") internalLinkMode = preferred;
				} catch { /* Use the published link mode. */ }
			}
			return { mode, index: Number.isInteger(index) && index >= 0 && index < length ? index : 0, internalLinkMode };
		};
		window.gotabShareStartup = {
			code, server, scope, status: meta.status, ready,
			isCurrent: active,
			getData: () => active() ? data : undefined,
			getSnapshot: () => active() ? snapshot : undefined,
			getRevision: () => revision,
			getView,
			setView: next => { view = next; },
			getBackground: () => background,
			setBackground: next => { background = next; },
			setData: next => {
				if (!valid(next)) { clear(); return; }
				if (!active()) return;
				data = next; revision++; abortWrites();
				window.dispatchEvent(new Event("gotab:startup-widget-change"));
			},
			clear,
			writeSnapshot: async (preview, isCurrent) => {
				if (!active() || !valid(data) || !isCurrent()) return "skipped";
				const started = generation, version = revision;
				const current = () => active() && generation === started && version === revision && isCurrent();
				const record = { version: 1, server, code, scope, data, preview, savedAt: Date.now() };
				const length = JSON.stringify(record).length;
				if (length > maxRecord) return "unavailable";
				let wrote = false;
				let failure = "retryable";
				const ok = await transact("readwrite", (store, transaction) => {
					const records = [];
					const cursor = store.openCursor();
					cursor.onsuccess = () => {
						if (!current()) { transaction.abort(); return; }
						const entry = cursor.result;
						if (entry) { records.push({ key: entry.key, ...entry.value }); entry.continue(); return; }
						const others = records.filter(item => item.key !== key).sort((a, b) => b.savedAt - a.savedAt);
						let total = length, count = 1;
						for (const item of others) {
							const size = Number(item.length) || maxRecord;
							if (count >= maxEntries || total + size > maxTotal || (item.server === server && item.code === code)) store.delete(item.key);
							else { total += size; count++; }
						}
						const put = store.put({ ...record, length }, key);
						put.onsuccess = () => { if (!current()) transaction.abort(); else wrote = true; };
					};
				}, true, error => { if (error?.name === "QuotaExceededError") failure = "unavailable"; });
				return !current() ? "skipped" : ok && wrote ? "saved" : failure;
			},
		};
	} catch { /* Old/static servers and unavailable storage use normal loading. */ }
})();
