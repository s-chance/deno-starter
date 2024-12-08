import { Database } from "@db/sqlite";
import { toKebabCase } from "@std/text";

const db = new Database("horses.db");

db.exec(`
  DROP TABLE IF EXISTS horses;
  CREATE TABLE horses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    permalink TEXT
  );
  INSERT INTO horses (name, age) VALUES 
  ('twilight sparkle', 22),
  ('rarity', 22),
  ('pink pie', 22);
`);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const id = path.split("/")[2];

  if (!path.startsWith("/horse")) {
    return new Response("Not Found", { status: 404 });
  }

  if (req.method === "GET" && !id) {
    const horses = db.prepare("SELECT * FROM horses").all();
    return new Response(JSON.stringify(horses), {
      headers: { "Content-Type": "application/json" },
      status: horses.length ? 200 : 404,
    });
  }

  if (req.method === "GET" && id) {
    const horse = db.prepare("SELECT * FROM horses WHERE id = :id").get({ id });
    return new Response(JSON.stringify(horse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  if (req.method === "POST") {
    try {
      const { name, age } = await req.json();

      const permalink = "little.pony/" + toKebabCase(name);

      const horse = db
        .prepare(
          "INSERT INTO horses (name, age, permalink) VALUES (?,?,?) RETURNING *",
        )
        .get([name, age, permalink]);
      return new Response(JSON.stringify(horse), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (e) {
      console.log(e);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});

console.log("Server runing on http://localhost:8000");
console.log("HomePage: http://localhost:8000/horse");
