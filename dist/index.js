import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";
import { cors } from "hono/cors";
import pg from "pg";
const { Pool } = pg;
config();
const pool = new Pool({ ssl: { rejectUnauthorized: false } });
const app = new Hono();
app.use("*", cors());
app.post("/compounds", async (c) => {
    const requestCompounds = await c.req.json(); // c(=context) ist parameter, wenn ich ne route definiere, gibt body vom request
    const text = `INSERT INTO "Gehege"(name, groesse, kosten) VALUES ($1,$2,$3) RETURNING *`; //sql statement "gehege"-> name der tabelle
    const values = [
        requestCompounds.name,
        requestCompounds.groesse,
        requestCompounds.kosten,
    ];
    const response = await pool.query(text, values); // pool: repräsentiert die datenbank, query führt aus, was in text und values steht
    return c.json(response.rows); // um im browser oder postman zu kommunzieren und es ans frontend weiterzugeben
});
// async c, weil hono, bei express wäre das async (res, req) =>..
app.patch("/compounds/:id", async (c) => {
    // suche mit param nach /:id
    const { id } = c.req.param();
    // das sind die sachen im body
    const { name, groesse, kosten } = await c.req.json();
    // suche nach id und speichere in gehege
    const gehege = await pool.query(`SELECT * FROM "Gehege" WHERE id = $1`, [id]);
    if (!gehege)
        return console.error("Compound not found, dulli.");
    const text = `UPDATE "Gehege" SET name = $1, groesse = $2, kosten = $3 WHERE id = $4`; //sql statement "gehege"-> name der tabelle
    const values = [name, groesse, kosten, id];
    // führen ja sql befehl aus und der gibt response zurück
    const response = await pool.query(text, values);
    return c.json({
        message: ` Gehege mit ID: ${id} wurde geupdatet. `,
        data: response.rows[0], // was ist das?
    });
});
app.get("/compounds", async (c) => {
    const queryResult = await pool.query('SELECT * FROM "Compounds"');
    return c.json(queryResult.rows);
});
app.get("/compounds/:id", async (c) => {
    const { id } = c.req.param();
    const queryResult = await pool.query('SELECT * FROM "Gehege" WHERE id = $1', [
        id,
    ]);
    return c.json(queryResult.rows[0]);
});
app.get("/animals", async (c) => {
    const queryResult = await pool.query('SELECT * FROM "Tier"');
    return c.json(queryResult.rows);
});
app.patch("/animals/:id", async (c) => {
    const { id } = c.req.param();
    const { verpflegungskosten, name, geburtsdatum, geschlecht, art, tierarzt_id, gehege_id, } = await c.req.json();
    const tier = await pool.query(`SELECT * FROM "Tier" WHERE id = $1`, [id]);
    if (!tier)
        return console.error("Compound not found, dulli.");
    const text = `UPDATE "Tier" SET verpflegungskosten = $1, name = $2, geburtsdatum = $3, geschlecht = $4,art = $5, tierarzt_id = $6, gehege_id = $7, WHERE id = $4`; //sql statement "gehege"-> name der tabelle
    const values = [
        verpflegungskosten,
        name,
        geburtsdatum,
        geschlecht,
        art,
        tierarzt_id,
        gehege_id,
        id,
    ];
    const response = await pool.query(text, values);
    return c.json({
        message: ` Tier mit ID: ${id} wurde geupdatet. `,
        data: response.rows[0], // was ist das?
    });
});
app.post("/animals", async (c) => {
    const requestAnimal = await c.req.json();
    const text = `INSERT INTO "Tier"(verpflegungskosten, name, geburtsdatum, geschlecht, art, tierarzt_id, gehege_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [
        requestAnimal.verpflegungskosten,
        requestAnimal.name,
        requestAnimal.geburtsdatum,
        requestAnimal.geschlecht,
        requestAnimal.art,
        requestAnimal.tierarzt_id,
        requestAnimal.gehege_id,
    ];
    const response = await pool.query(text, values);
    return c.json(response.rows);
});
app.delete("/animals/:id", async (c) => {
    const { id } = c.req.param();
    const tier = await pool.query(`SELECT * FROM "Tier" WHERE id = $1`, [id]);
    if (!tier)
        return console.error("Tier nicht vorhanden.");
    const response = await pool.query(`DELETE FROM "Tier" WHERE id = $1`, [id]);
    return c.json({ message: "Tier gelöscht." });
});
app.post("/stand", async (c) => {
    const requestCompounds = await c.req.json();
    const text = `INSERT INTO "Verkaufsstand"(produktart, profit, verkaufer_id) VALUES ($1,$2,$3) RETURNING *`; //sql statement "gehege"-> name der tabelle
    const values = [
        requestCompounds.produktart,
        requestCompounds.profit,
        requestCompounds.verkaufer_id,
    ];
    const response = await pool.query(text, values);
    return c.json(response.rows);
});
serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Server is running on http://${info.address}:${info.port}`);
});
