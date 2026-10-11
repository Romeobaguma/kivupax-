export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route 1 : lancement de l'authentification GitHub
    if (url.pathname === '/api/auth') {
      const client_id = env.GITHUB_CLIENT_ID;
      const redirect_uri = `${url.origin}/api/callback`;
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=repo,user`;
      return Response.redirect(authUrl, 302);
    }

    // Route 2 : callback après autorisation GitHub
    if (url.pathname === '/api/callback') {
      const code = url.searchParams.get('code');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/api/callback`
        })
      });
      const tokenData = await tokenResponse.json();
      const token = tokenData.access_token;

      // Renvoie le token à Decap CMS
      return new Response(`
        <script>
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
            '*'
          );
        </script>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Toutes les autres routes : 404
    return new Response('Not Found', { status: 404 });
  }
};
