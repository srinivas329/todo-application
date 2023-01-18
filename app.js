const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var isValid = require("date-fns/isValid");
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
  response.send(result.map((each) => pascalToCamel(each)));
});

//API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `SELECT * FROM todo WHERE id = '${todoId}'`;
  const result = await db.get(sqlQuery);
  response.send(pascalToCamel(result));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const final = isValid(new Date(date), "yyyy-MM-dd");
  const sqlQuery = `SELECT * FROM todo WHERE due_date = '${date}'`;
  const result = await db.all(sqlQuery);
  response.send(result);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const sqlQuery = `INSERT INTO todo (id, todo, priority, status, category, dueDate) VALUES ('${id}','${todo}','${priority}','${status}','${due_date}')`;
  const result = await db.run(sqlQuery);
  response.send("Todo Successfully Added");
});

module.exports = app;
