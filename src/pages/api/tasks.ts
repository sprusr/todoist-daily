import { endOfYesterday, format, startOfYesterday } from 'date-fns';
import type { NextApiHandler } from 'next';

import { Project, Task } from '../../types';

interface Response {
  error?: string;
  today?: Task[];
  yesterday?: Task[];
}

const getProjects = async (accessToken: string): Promise<Project[]> => {
  const response = await fetch('https://api.todoist.com/rest/v1/projects', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const projects = (await response.json()) as Project[];

  return projects;
};

const getFullTask = async (
  task: { task_id: number },
  accessToken: string
): Promise<Task> => {
  const response = await fetch(`https://api.todoist.com/sync/v8/items/get`, {
    body: new URLSearchParams({
      item_id: task.task_id.toString(),
      token: accessToken,
    }),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as { item: Task };

  return data.item;
};

const resolveTaskParents = async (
  task: Task,
  accessToken: string
): Promise<Task> => {
  if (task?.parent_id) {
    const response = await fetch(`https://api.todoist.com/sync/v8/items/get`, {
      body: new URLSearchParams({
        item_id: task.parent_id.toString(),
        token: accessToken,
      }),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { item: parent } = (await response.json()) as { item: Task };

    if (parent.parent_id) {
      return resolveTaskParents(parent, accessToken);
    }

    return {
      ...task,
      content_with_parent: `${parent.content} 👉 ${task.content}`,
    };
  }

  return { ...task, content_with_parent: task.content };
};

const getTodayTasks = async (
  projectId: number,
  accessToken: string
): Promise<Task[]> => {
  const response = await fetch(
    `https://api.todoist.com/rest/v1/tasks?project_id=${projectId}&filter=today`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const tasks = (await response.json()) as Task[];

  return tasks;
};

const getYesterdayTasks = async (
  projectId: number,
  accessToken: string
): Promise<Task[]> => {
  const response = await fetch(
    `https://api.todoist.com/sync/v8/completed/get_all`,
    {
      body: new URLSearchParams({
        project_id: projectId.toString(10),
        since: format(startOfYesterday(), "yyyy-MM-dd'T'HH:mm"),
        token: accessToken,
        until: format(endOfYesterday(), "yyyy-MM-dd'T'HH:mm"),
      }),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const { items: tasks } = (await response.json()) as { items: Task[] };

  return tasks;
};

const handler: NextApiHandler<Response> = async (req, res) => {
  const { TODOIST_TOKEN: accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(403).json({ error: 'No TODOIST_TOKEN cookie' });
  }

  const projects = await getProjects(accessToken);
  const workProject = projects.find(project => project.name === 'Work');

  if (!workProject) {
    return res
      .status(500)
      .json({ error: 'Unable to find Todoist "Work" project' });
  }

  const today = await Promise.all(
    (await getTodayTasks(workProject.id, accessToken)).map(task =>
      resolveTaskParents(task, accessToken)
    )
  );

  const yesterday = await Promise.all(
    (await getYesterdayTasks(workProject.id, accessToken)).map(async task => {
      const fullTask = await getFullTask(task, accessToken);
      const taskWithParents = await resolveTaskParents(fullTask, accessToken);
      return taskWithParents;
    })
  );

  res.status(200).json({ today, yesterday });
};

export default handler;
