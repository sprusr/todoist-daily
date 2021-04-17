import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

import { Task } from '../types';

interface Tasks {
  error?: string;
  today: Task[];
  yesterday: Task[];
}

const Home: NextPage<{ tasks?: Tasks }> = ({ tasks }) => {
  if (!tasks || tasks.error) {
    return <p>Error: ${tasks?.error || 'Unknown'}</p>;
  }

  return (
    tasks.today &&
    tasks.yesterday && (
      <>
        <h1>Todoist Daily</h1>
        <h2>Yesterday</h2>
        <ul>
          {tasks.yesterday.map(task => (
            <li key={task.id}>{task.content_with_parent}</li>
          ))}
        </ul>
        <h2>Today</h2>
        <ul>
          {tasks.today.map(task => (
            <li key={task.id}>{task.content_with_parent}</li>
          ))}
        </ul>
      </>
    )
  );
};

const getBaseUrl = () => {
  const basePath = process.env.BASE_PATH || '';
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}${basePath}`;
  }
  return `http://localhost:3000${basePath}`;
};

const getTasks = async () =>
  (await fetch(`${getBaseUrl()}/api/tasks`)).json() as Promise<Tasks>;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const tasks = await getTasks();

  if (tasks.error === 'No TODOIST_TOKEN cookie') {
    res.statusCode = 307;
    res.setHeader('Location', '/api/auth/start');
    return { props: {} };
  }

  return { props: { tasks } };
};

export default Home;
