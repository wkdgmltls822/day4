// Vercel 서버리스 함수 (배포 시 /api/odcloud 로 호출) + 로컬 개발 서버에서도 같은 코드를 씁니다.
// 공공데이터포털 인증키가 브라우저(소스 보기)에 노출되지 않도록 서버에서만 키를 붙여요.
// 데이터: 제주특별자치도 서귀포시 직영관광지 관람객수 추이 (odcloud 15125100)
const ENDPOINT = 'https://api.odcloud.kr/api/15125100/v1/uddi:32a1b877-af20-4505-a76a-fd389ebd30ca';

export default async function handler(req, res) {
  const send = (code, body, cache) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (cache) res.setHeader('Cache-Control', cache);
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  const raw = process.env.ODCLOUD_SERVICE_KEY;
  if (!raw) return send(503, { error: 'ODCLOUD_SERVICE_KEY 환경변수가 없어요.' });
  // 포털의 "Encoding" 키(이미 % 로 인코딩됨)와 "Decoding" 키 둘 다 받을 수 있게 처리
  const key = raw.includes('%') ? raw : encodeURIComponent(raw);
  try {
    const r = await fetch(`${ENDPOINT}?page=1&perPage=200&returnType=JSON&serviceKey=${key}`);
    const text = await r.text();
    if (!r.ok) return send(r.status, { error: `odcloud 응답 오류 ${r.status}`, detail: text.slice(0, 200) });
    return send(200, text, 's-maxage=3600, stale-while-revalidate=86400');
  } catch (e) {
    return send(502, { error: String(e && e.message ? e.message : e) });
  }
}
