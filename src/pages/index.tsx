import { NextPage } from 'next';
import React from 'react';
import useSWR from 'swr';

import { Task } from '../types';

const getTasks = async (path: string) => (await fetch(`api/${path}`)).json();

const Home: NextPage = () => {
  const { data } = useSWR<{ today: Task[]; yesterday: Task[] }>(
    'tasks',
    getTasks
  );
  return (
    !!data?.today &&
    !!data?.yesterday && (
      <>
        <h1>Todoist Daily</h1>
        <h2>Yesterday</h2>
        <ul>
          {data.yesterday.map(task => (
            <li key={task.id}>{task.content}</li>
          ))}
        </ul>
        <h2>Today</h2>
        <ul>
          {data.today.map(task => (
            <li key={task.id}>{task.content}</li>
          ))}
        </ul>
      </>
    )
  );
};

export default Home;
