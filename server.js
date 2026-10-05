const express = require("express");
const db = require("./db");
const cors = require("cors"); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`Request: ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(
      `Response: ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
    );
  });

  next();
});

app.use(express.json());
app.use(cors()); // Enable CORS for all routes
const FIELDS = ["name", "onboarding_status", "city", "phone"];

// Pick only allowed fields from the request body
const pick = (body) =>
  FIELDS.reduce((acc, f) => {
    if (body[f] !== undefined) acc[f] = body[f];
    return acc;
  }, {});

// Validate field types; returns an error string or null
function validate(data, { requireAll }) {
  if (requireAll && (typeof data.name !== "string" || !data.name.trim()))
    return "name is required and must be a non-empty string";
  for (const f of FIELDS) {
    if (data[f] !== undefined && typeof data[f] !== "string")
      return `${f} must be a string`;
  }
  return null;
}

// CREATE
app.post("/users", (req, res) => {
  const data = pick(req.body);
  const error = validate(data, { requireAll: true });
  if (error) return res.status(400).json({ error });

  const store = db.read();
  const id = store.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const user = {
    name: data.name.trim(),
    id,
    onboarding_status: data.onboarding_status ?? "",
    city: data.city ?? "",
    phone: data.phone ?? "",
  };
  store.users.push(user);
  db.write(store);
  res.status(201).json(user);
});

// READ ALL (supports ?city=, ?onboarding_status=, ?search=)
app.get("/users", (req, res) => {
  let users = db.read().users;
  const { city, onboarding_status, search } = req.query;
  if (city) users = users.filter((u) => u.city.toLowerCase() === city.toLowerCase());
  if (onboarding_status !== undefined)
    users = users.filter((u) => u.onboarding_status === onboarding_status);
  if (search)
    users = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));
  res.json(users);
});

// READ ONE
app.get("/users/:id", (req, res) => {
  const user = db.read().users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// UPDATE (full replace of editable fields)
app.put("/users/:id", (req, res) => {
  const data = pick(req.body);
  const error = validate(data, { requireAll: true });
  if (error) return res.status(400).json({ error });

  const store = db.read();
  const idx = store.users.findIndex((u) => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  store.users[idx] = {
    name: data.name.trim(),
    id: store.users[idx].id,
    onboarding_status: data.onboarding_status ?? "",
    city: data.city ?? "",
    phone: data.phone ?? "",
  };
  db.write(store);
  res.json(store.users[idx]);
});

// PARTIAL UPDATE
app.patch("/users/:id", (req, res) => {
  const data = pick(req.body);
  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: "No valid fields provided" });
  const error = validate(data, { requireAll: false });
  if (error) return res.status(400).json({ error });

  const store = db.read();
  const idx = store.users.findIndex((u) => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  store.users[idx] = { ...store.users[idx], ...data, id: store.users[idx].id };
  db.write(store);
  res.json(store.users[idx]);
});

// DELETE
app.delete("/users/:id", (req, res) => {
  const store = db.read();
  const idx = store.users.findIndex((u) => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const [removed] = store.users.splice(idx, 1);
  db.write(store);
  res.json({ message: "User deleted", user: removed });
});

// Invalid JSON body / unexpected errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
