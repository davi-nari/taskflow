
export function buildSheetRow(action) {
  return [
    new Date().toLocaleDateString('ru-RU'),
    action.type || '',
    action.category || '',
    action.taskTitle || '',
    action.actionType || '',
    action.pageTitle || '',
    action.url || ''
  ]
}
