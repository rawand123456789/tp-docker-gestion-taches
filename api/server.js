
import http from "node:http";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prioritesValides = ["Basse", "Moyenne", "Haute"];

function envoyer(res, status, data) {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

async function lireBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  return JSON.parse(body || "{}");
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = new URL(req.url, "http://localhost").pathname;

  try {
    // GET /health
    if (pathname === "/health" && req.method === "GET") {
      await pool.query("SELECT 1");

      envoyer(res, 200, {
        status: "UP",
        database: "UP"
      });
      return;
    }

    // GET /tasks
    if (pathname === "/tasks" && req.method === "GET") {
      const result = await pool.query(
        `SELECT id, titre, fait, priorite, date_creation
         FROM taches
         ORDER BY id`
      );

      envoyer(res, 200, result.rows);
      return;
    }

    // POST /tasks
    if (pathname === "/tasks" && req.method === "POST") {
      const { titre, priorite = "Moyenne" } = await lireBody(req);

      if (typeof titre !== "string" || !titre.trim()) {
        envoyer(res, 400, {
          error: "Le titre est obligatoire"
        });
        return;
      }

      if (!prioritesValides.includes(priorite)) {
        envoyer(res, 400, {
          error: "Priorité invalide : Basse, Moyenne ou Haute"
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO taches (titre, fait, priorite)
         VALUES ($1, false, $2)
         RETURNING id, titre, fait, priorite, date_creation`,
        [titre.trim(), priorite]
      );

      envoyer(res, 201, result.rows[0]);
      return;
    }

    // PUT /tasks/:id
    if (req.method === "PUT" && /^\/tasks\/\d+$/.test(pathname)) {
      const id = Number(pathname.split("/")[2]);
      const body = await lireBody(req);

      const champs = [];

      if ("titre" in body) {
        if (typeof body.titre !== "string" || !body.titre.trim()) {
          envoyer(res, 400, {
            error: "Le titre est invalide"
          });
          return;
        }

        champs.push({
          colonne: "titre",
          valeur: body.titre.trim()
        });
      }

      if ("priorite" in body) {
        if (!prioritesValides.includes(body.priorite)) {
          envoyer(res, 400, {
            error: "Priorité invalide"
          });
          return;
        }

        champs.push({
          colonne: "priorite",
          valeur: body.priorite
        });
      }

      if ("fait" in body) {
        if (typeof body.fait !== "boolean") {
          envoyer(res, 400, {
            error: "La valeur fait doit être true ou false"
          });
          return;
        }

        champs.push({
          colonne: "fait",
          valeur: body.fait
        });
      }

      if (champs.length === 0) {
        envoyer(res, 400, {
          error: "Aucune modification fournie"
        });
        return;
      }

      const valeurs = champs.map((champ) => champ.valeur);

      const assignments = champs.map(
        (champ, index) => `${champ.colonne} = $${index + 1}`
      );

      valeurs.push(id);

      const result = await pool.query(
        `UPDATE taches
         SET ${assignments.join(", ")}
         WHERE id = $${valeurs.length}
         RETURNING id, titre, fait, priorite, date_creation`,
        valeurs
      );

      if (result.rows.length === 0) {
        envoyer(res, 404, {
          error: "Tâche introuvable"
        });
        return;
      }

      envoyer(res, 200, result.rows[0]);
      return;
    }

    // DELETE /tasks/:id
    if (req.method === "DELETE" && /^\/tasks\/\d+$/.test(pathname)) {
      const id = Number(pathname.split("/")[2]);

      const result = await pool.query(
        "DELETE FROM taches WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rows.length === 0) {
        envoyer(res, 404, {
          error: "Tâche introuvable"
        });
        return;
      }

      envoyer(res, 200, {
        message: "Tâche supprimée avec succès",
        id: result.rows[0].id
      });
      return;
    }

    // Route introuvable
    envoyer(res, 404, {
      error: "Route introuvable"
    });

  } catch (error) {
    console.error("Erreur API :", error);

    envoyer(res, 500, {
      error: "Erreur serveur"
    });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

