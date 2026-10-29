const KEY = import.meta.env.VITE_PIXABAY_API_KEY;
export const hasPixabay = Boolean(KEY && !KEY.startsWith('여기에'));

const TTL = 24 * 60 * 60 * 1000; // Pixabay 약관: API 결과는 24시간 캐시

/** Pixabay 에서 사진을 검색해 화면에 쓰기 좋은 모양으로 돌려준다. 실패하면 빈 배열. */
export async function searchImages(query, perPage = 12) {
  if (!hasPixabay) return [];
  const cacheKey = `pixabay:${query}:${perPage}`;
  try {
    const hit = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (hit && Date.now() - hit.t < TTL) return hit.data;
  } catch { /* 캐시를 못 읽어도 계속 진행 */ }

  const params = new URLSearchParams({ key: KEY, q: query, image_type: 'photo', per_page: String(perPage), safesearch: 'true', order: 'popular' });
  try {
    const res = await fetch(`https://pixabay.com/api/?${params}`);
    if (!res.ok) throw new Error(`Pixabay ${res.status}`);
    const json = await res.json();
    const data = (json.hits || []).map(h => ({
      id: h.id, preview: h.webformatURL, large: h.largeImageURL, page: h.pageURL, user: h.user, tags: h.tags,
    }));
    try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })); } catch { /* 용량 초과 등 */ }
    return data;
  } catch (e) {
    console.warn('Pixabay 요청 실패', e);
    return [];
  }
}
