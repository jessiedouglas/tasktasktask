// The main entry point for the back end

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

function getTasks() {
  return new TaskManager().getTasks();
}

function saveTask(task) {
  new TaskManager().saveTask(task);
}
