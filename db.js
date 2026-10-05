const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");

function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return { users: [] };
    throw err;
  }
}

// Write to temp file then rename, so a crash never leaves a half-written db
function write(data) {
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

module.exports = { read, write };
