// 관리자(/admin) GitHub 로그인 2단계: GitHub가 돌려준 코드를 로그인 토큰으로 바꿔서 관리자 창에 넘겨요.
// Cloudflare Pages 설정의 환경 변수 GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET 을 써요 (비밀 값은 코드에 넣지 않아요).
const page = (origin, status, content) => {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  return new Response(
    `<!doctype html><html><body><p>로그인 중…</p><script>
(function () {
  var origin = ${JSON.stringify(origin)};
  var message = ${JSON.stringify(message)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(message, origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': 'decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      },
    },
  );
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)decap_oauth_state=([^;]+)/);
  if (!code || !state || !cookie || cookie[1] !== state) {
    return page(url.origin, 'error', { message: '로그인 요청이 만료됐거나 올바르지 않아요. 다시 시도해 주세요.' });
  }
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'photo-archive-admin' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/api/callback` }),
    });
    const data = await res.json();
    if (!data.access_token) throw new Error(data.error_description || data.error || 'no token');
    return page(url.origin, 'success', { token: data.access_token, provider: 'github' });
  } catch (err) {
    return page(url.origin, 'error', { message: `GitHub 로그인에 실패했어요: ${err.message}` });
  }
}
