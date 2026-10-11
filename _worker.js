export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route d'authentification GitHub OAuth
    if (url.pathname === '/api/auth') {
      const client_id = env.GITHUB_CLIENT_ID;
      const redirect_uri = `${url.origin}/api/callback`;
      const scope = 'repo,user';
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`;
      return Response.redirect(authUrl, 302);
    }

    // Route de callback après autorisation GitHub
    if (url.pathname === '/api/callback') {
      const code = url.searchParams.get('code');
      const client_id = env.GITHUB_CLIENT_ID;
      const client_secret = env.GITHUB_CLIENT_SECRET;
      const redirect_uri = `${url.origin}/api/callback`;

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id, client_secret, code, redirect_uri })
      });

      const tokenData = await tokenResponse.json();
      const token = tokenData.access_token;

      const html = `
        <script>
          (function() {
            function receiveMessage(e) {
              window.opener.postMessage(
                'authorization:github:success:' + JSON.stringify({ token: '${token}', provider: 'github' }),
                e.origin
              );
            }
            window.addEventListener('message', receiveMessage, false);
            window.opener.postMessage('authorizing:github', '*');
          })();
        </script>
      `;
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    // Pour toutes les autres requêtes, servir les assets statiques
    return env.ASSETS.fetch(request);
  }
};
