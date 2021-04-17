import type { NextApiHandler } from 'next';

const handler: NextApiHandler = (req, res) => {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const scope = 'data:read';
  const state = '';
  res.redirect(
    `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`
  );
};

export default handler;
