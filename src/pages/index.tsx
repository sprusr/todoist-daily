import { NextPage } from 'next';
import { useRouter } from 'next/dist/client/router';
import React from 'react';
import useSWR from 'swr';

import { Task } from '../types';

interface Tasks {
  error?: string;
  today: Task[];
  yesterday: Task[];
}

const getTasks = async () =>
  (
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/tasks`)
  ).json() as Promise<Tasks>;

const Home: NextPage = () => {
  const router = useRouter();
  const { data: tasks, isValidating } = useSWR<Tasks>('tasks', getTasks);

  if (isValidating) {
    return <p>Loading</p>;
  }

  if (tasks?.error === 'No TODOIST_TOKEN cookie') {
    void router.push(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth/start`
    );
    return <p>Redirecting to auth</p>;
  }

  if (!tasks || tasks.error) {
    return <p>Error: {tasks?.error || 'unknown'}</p>;
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

export default Home;
