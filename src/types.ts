export interface Project {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  task_id: number;
  content: string;
  parent_id?: string;
  content_with_parent?: string;
}
