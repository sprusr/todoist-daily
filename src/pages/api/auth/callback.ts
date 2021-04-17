import Cookies from 'cookies';
import type { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
  const { code, error } = req.query as {
    code?: string;
    error?: string;
    state?: string;
  };

  if (error) {
    res.status(500).send(error);
  }

  if (!code) {
    return res.status(401).send('Bad request');
  }

  const response = await fetch('https://todoist.com/oauth/access_token', {
    body: new URLSearchParams({
      client_id: process.env.TODOIST_CLIENT_ID,
      client_secret: process.env.TODOIST_CLIENT_SECRET,
      code,
    }),
    method: 'POST',
  });

  const { access_token: accessToken } = (await response.json()) as {
    access_token: string;
    token_type: string;
  };

  const cookies = new Cookies(req, res);
  cookies.set('TODOIST_TOKEN', accessToken, { sameSite: 'strict' });

  res.redirect(process.env.BASE_PATH || '/');
};

export default handler;
