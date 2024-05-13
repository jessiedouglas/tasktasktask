const Status = {
  TODO: "TODO",
  UP_NEXT: "UP_NEXT",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
};

const Column = {
  ID: "id",
  TITLE: "task",
  STATUS: "status",
  LAST_STATUS_UPDATE: "last_status_update",
}

class TaskManager {

  constructor() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Task Data DO NOT EDIT");
    this.rangesByName_ = this.getRangesByName_(sheet);
  }

  getTasks() {
    return this.getAllTasks_().filter(task => task.status !== Status.ARCHIVED);
  }

  saveTask(task) {
    const row = this.getRowForTask_(task.id);
    const oldStatus = this.getValueForRowInColumn_(row, Column.STATUS);
    this.saveValueForTask_(row, Column.ID, task.id);
    this.saveValueForTask_(row, Column.TITLE, task.title);
    this.saveValueForTask_(row, Column.STATUS, task.status);
    if (oldStatus !== task.status) {
      this.saveValueForTask_(row, Column.LAST_STATUS_UPDATE, Date.now());
    }
  }

  getAllTasks_() {
    const idRange = this.rangesByName_[Column.ID];
    const displayMatrix = idRange.getDisplayValues();
    const tasks = [];
    for (let i = 0; i < displayMatrix.length; i++) {
      if (!!displayMatrix[i][0]) {
        tasks.push(this.createTaskFromRow_(i + 1)); // rows are 1-indexed
      } else {
        // If there isn't a value in the cell, don't create a task and stop iterating
        break;
      }
    }
    return tasks;
  }

  createTaskFromRow_(row) {
    const lastStatusUpdateTimestamp = Number(this.getValueForRowInColumn_(row, Column.LAST_STATUS_UPDATE));
    const daysSinceStatusChange = this.getDaysPastSinceTimestamp_(lastStatusUpdateTimestamp);
    return createTaskObject(
      this.getValueForRowInColumn_(row, Column.ID),
      this.getValueForRowInColumn_(row, Column.TITLE),
      this.getValueForRowInColumn_(row, Column.STATUS),
      daysSinceStatusChange);
  }

  getDaysPastSinceTimestamp_(timestamp) {
    const millisDifference = Date.now() - timestamp;
    const oneDayInMillis = 1000 * 60 * 60 * 24;
    return Math.floor(millisDifference / oneDayInMillis);
  }

  getRowForTask_(taskId) {
    const idRange = this.rangesByName_[Column.ID];
    const displayMatrix = idRange.getDisplayValues();
    for (let i = 0; i < displayMatrix.length; i++) {
      if (!displayMatrix[i][0] || displayMatrix[i][0] === taskId) {
        // Return this row if either there isn't a value there (assume rows are filled in without gaps), or
        // if the task ID is in this row
        return i + 1;  // rows are 1-indexed
      }
    }
    throw 'Error: no available rows';
  }

  getValueForRowInColumn_(row, columnName) {
    return this.rangesByName_[columnName].getCell(row, 1).getValue();
  }

  saveValueForTask_(row, columnName, value) {
    this.rangesByName_[columnName].getCell(row, 1).setValue(value);
  }

  getRangesByName_(sheet) {
    const namedRanges = sheet.getNamedRanges();
    const rangesByName = {};
    for (let namedRange of namedRanges) {
      rangesByName[namedRange.getName()] = namedRange.getRange();
    }
    return rangesByName;
  }
}

function createTaskObject(taskId, title, status, daysSinceStatusChange) {
  return {
    id: taskId,
    title,
    status,
    daysSinceStatusChange,
  };
}
