const STORAGE_KEY = 'tasks'

export const getTasks = () => {
  const data = localStorage.getItem('tasks')

  if (!data) return []

  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export const saveTasks = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

export const saveTask = (task) => {
  const tasks = getTasks()

  tasks.push(task)

  saveTasks(tasks)
}

export const updateTask = (updatedTask) => {
  const tasks = getTasks()

  const index = tasks.findIndex((task) => task.id === updatedTask.id)

  if (index !== -1) {
    tasks[index] = updatedTask
  }

  saveTasks(tasks)
}
