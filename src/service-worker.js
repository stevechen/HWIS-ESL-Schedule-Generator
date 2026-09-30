/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

/**
 * Pathname of the printed answer sheet. Requests for it are cache-keyed on the
 * full URL (query string included) so a regenerated sheet is never served from
 * a stale cache entry; see the fetch handler.
 */
const SHEET_PATHNAME = '/ZipGrade.svg';

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// The answer-sheet image is regenerated whenever the printed template
		// changes. It is precached like any other static file, but a stale copy
		// would silently misalign every answer bubble, so match it on the FULL
		// URL (including the ?v= content-hash query written by
		// scripts/build-sheet.mjs). A new hash is a new cache key, which misses
		// and falls through to the network below.
		const isSheet = url.pathname === SHEET_PATHNAME;
		const cacheKey = isSheet ? url.pathname + url.search : url.pathname;

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(cacheKey);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});
