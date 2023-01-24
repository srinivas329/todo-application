const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
var format = require("date-fns/format");

app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

const haveStatusOnly = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const havePriorityOnly = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const haveSearchOnly = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const haveCategoryOnly = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const havePriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const haveCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const haveCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const pascalToCamel = (word) => {
  return {
    id: word.id,
    todo: word.todo,
    category: word.category,
    priority: word.priority,
    status: word.status,
    dueDate: word.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, category, priority, search_q = "" } = request.query;
  let sqlQuery = "";
  switch (true) {
    case havePriorityAndStatus(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}'`;
      break;
    case haveCategoryAndStatus(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND category = '${category}'`;
      break;
    case haveCategoryAndPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND category = '${category}'`;
      break;
    case haveStatusOnly(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'`;
      break;
    case haveCategoryOnly(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}'`;
      break;
    case havePriorityOnly(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'`;
      break;
    case haveSearchOnly(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  const result = await db.all(sqlQuery);
  console.log(result);
  if (result.priority !== undefined) {
    if (
      result.priority !== "HIGH" &&
      result.priority !== "MEDIUM" &&
      result.priority !== "LOW"
    ) {
      response.status(400);
      response.status("Invalid Todo Priority");
    } else {
      response.send(result.map((each) => pascalToCamel(each)));
    }
  } else if (result.status !== undefined) {
    if (
      result.status !== "TO DO" &&
      result.status !== "IN PROGRESS" &&
      result.status !== "DONE"
    ) {
      response.status(400);
      response.status("Invalid Todo Status");
    } else {
      response.send(result.map((each) => pascalToCamel(each)));
    }
  } else if (result.category !== undefined) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      response.status(400);
      response.status("Invalid Todo Category");
    } else {
      response.send(result.map((each) => pascalToCamel(each)));
    }
  } else if (result.dueDate !== undefined) {
    if (isValid(new Date(result.dueDate)) === false) {
      response.status(400);
      response.status("Invalid Due Date");
    } else {
      response.send(result.map((each) => pascalToCamel(each)));
    }
  } else {
    response.send(result.map((each) => pascalToCamel(each)));
  }
});

//API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `SELECT * FROM todo WHERE id = '${todoId}'`;
  const result = await db.get(sqlQuery);
  response.send(pascalToCamel(result));
});

//API-3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateFormatted = format(new Date(date), "yyyy-MM-dd");
  const sqlQuery = `SELECT * FROM todo WHERE due_date = '${dateFormatted}'`;
  const result = await db.all(sqlQuery);
  response.send(result.map((each) => pascalToCamel(each)));
});

//API-4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const sqlQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES ('${id}','${todo}','${priority}','${status}','${category}','${dueDate}')`;
    const result = await db.run(sqlQuery);
    response.send("Todo Successfully Added");
  }
});

//API-5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updatedColumn = "Due Date";
      break;
  }
  const previousTodo = `SELECT * FROM todo WHERE id = '${todoId}'`;
  const result = await db.get(previousTodo);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  if (request.body.priority !== undefined) {
    if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'`;
      await db.run(updateTodo);
      response.send(`${updatedColumn} Updated`);
    }
  } else if (request.body.status !== undefined) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'`;
      await db.run(updateTodo);
      response.send(`${updatedColumn} Updated`);
    }
  } else if (request.body.category !== undefined) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'`;
      await db.run(updateTodo);
      response.send(`${updatedColumn} Updated`);
    }
  } else if (request.body.dueDate !== undefined) {
    if (isValid(new Date(request.body.dueDate)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'`;
      await db.run(updateTodo);
      response.send(`${updatedColumn} Updated`);
    }
  } else {
    const updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}'`;
    await db.run(updateTodo);
    response.send(`${updatedColumn} Updated`);
  }
});

//API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `DELETE FROM todo WHERE id = '${todoId}'`;
  await db.run(sqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
