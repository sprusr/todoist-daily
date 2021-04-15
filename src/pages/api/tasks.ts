import { endOfYesterday, format, startOfYesterday } from 'date-fns';
import type { NextApiHandler } from 'next';

import { Project, Task } from '../../types';

interface Response {
  error?: string;
  today?: Task[];
  yesterday?: Task[];
}

const getProjects = async (): Promise<Project[]> => {
  const response = await fetch('https://api.todoist.com/rest/v1/projects', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
    },
  });

  const projects = (await response.json()) as Project[];

  return projects;
};

const getTodayTasks = async (projectId: number): Promise<Task[]> => {
  const response = await fetch(
    `https://api.todoist.com/rest/v1/tasks?project_id=${projectId}&filter=today`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
      },
    }
  );

  const tasks = (await response.json()) as Task[];

  return tasks;
};

const getYesterdayTasks = async (projectId: number): Promise<Task[]> => {
  const response = await fetch(
    `https://api.todoist.com/sync/v8/completed/get_all`,
    {
      body: new URLSearchParams({
        project_id: projectId.toString(10),
        since: format(startOfYesterday(), "yyyy-MM-dd'T'HH:mm"),
        token: process.env.TODOIST_TOKEN,
        until: format(endOfYesterday(), "yyyy-MM-dd'T'HH:mm"),
      }),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TODOIST_TOKEN}`,
      },
    }
  );

  const { items: tasks } = (await response.json()) as { items: Task[] };

  return tasks;
};

const handler: NextApiHandler<Response> = async (req, res) => {
  const projects = await getProjects();
  const workProject = projects.find(project => project.name === 'Work');

  if (!workProject) {
    return res
      .status(500)
      .json({ error: 'Unable to find Todoist "Work" project' });
  }

  const today = await getTodayTasks(workProject.id);
  const yesterday = await getYesterdayTasks(workProject.id);

  res.status(200).json({ today, yesterday });
};

export default handler;
