// 관리자(/admin) GitHub 로그인 1단계: GitHub 로그인 화면으로 보내요.
// Cloudflare Pages 설정의 환경 변수 GITHUB_CLIENT_ID 를 써요.
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response('GITHUB_CLIENT_ID 가 설정되지 않았어요.', { status: 500 });
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/callback`,
    scope: url.searchParams.get('scope') || 'repo,user',
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      'Set-Cookie': `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
