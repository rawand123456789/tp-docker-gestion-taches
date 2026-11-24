
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tâches");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setError("Veuillez saisir le nom de la tâche.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titre: taskName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }

      setTaskName("");
      setSuccess("Tâche ajoutée avec succès !");
      await loadTasks();
    } catch (err) {
      setError("Impossible d'ajouter la tâche.");
    } finally {
      setAdding(false);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.fait === true
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="app">

      <nav className="navbar">
        <div className="nav-container">
          <div className="brand">
            <div className="brand-icon">✓</div>
            <span>TaskManager</span>
          </div>

          <div className="nav-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#tasks">Mes tâches</a>
            <a href="#add-task">Ajouter</a>
          </div>

          <div className="nav-badge">
            <span className="online-dot"></span>
            Docker Project
          </div>
        </div>
      </nav>

      <main className="container">

        <section className="hero" id="dashboard">
          <div className="hero-content">
            <span className="hero-label">
              ISET GAFSA · TP DOCKER 03
            </span>

            <h1>
              Gestion des <span>tâches</span>
            </h1>

            <p>
              Organisez votre travail, suivez votre progression
              et gérez vos tâches facilement.
            </p>

            <a href="#add-task" className="hero-button">
              + Nouvelle tâche
            </a>
          </div>

          <div className="hero-illustration">
            <div className="illustration-card">
              <div className="illustration-check">✓</div>
              <div className="illustration-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="floating-icon">✦</div>
          </div>
        </section>

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon purple">▤</div>
            <div>
              <p>Total des tâches</p>
              <h2>{tasks.length}</h2>
              <span className="stat-description">
                Toutes les tâches
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <p>Tâches terminées</p>
              <h2>{completedTasks}</h2>
              <span className="stat-description">
                Travail accompli
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◷</div>
            <div>
              <p>En cours</p>
              <h2>{pendingTasks}</h2>
              <span className="stat-description">
                À réaliser
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">↗</div>
            <div>
              <p>Progression</p>
              <h2>{completionRate}%</h2>
              <span className="stat-description">
                Taux de réalisation
              </span>
            </div>
          </div>

        </section>

        <section className="progress-section">
          <div className="progress-header">
            <div>
              <h3>Progression globale</h3>
              <p>Suivez votre avancement</p>
            </div>
            <strong>{completionRate}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </section>

        <section className="content-grid">

          <div className="tasks-section" id="tasks">
            <div className="section-heading">
              <div>
                <span className="section-label">ORGANISATION</span>
                <h2>Mes tâches</h2>
                <p>Consultez toutes vos tâches</p>
              </div>

              <button
                className="refresh-button"
                onClick={loadTasks}
              >
                ↻ Actualiser
              </button>
            </div>

            {error && (
              <div className="message error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="message success-message">
                {success}
              </div>
            )}

            {loading ? (
              <div className="empty-state">
                <div className="loader"></div>
                <p>Chargement des tâches...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>Aucune tâche disponible</h3>
                <p>Ajoutez votre première tâche pour commencer.</p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => {
                  const isCompleted = task.fait === true;

                  return (
                    <div className="task-item" key={task.id}>
                      <div className={`task-check ${isCompleted ? "checked" : ""}`}>
                        {isCompleted ? "✓" : ""}
                      </div>

                      <div className="task-info">
                        <h3 className={isCompleted ? "completed-title" : ""}>
                          {task.titre}
                        </h3>

                        <div className="task-meta">
                          <span>
                            Priorité : {task.priorite || "Moyenne"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`task-status ${
                          isCompleted ? "status-completed" : "status-pending"
                        }`}
                      >
                        {isCompleted ? "Terminée" : "En cours"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="add-section" id="add-task">
            <div className="add-icon">+</div>

            <span className="section-label">NOUVEAU PROJET</span>
            <h2>Ajouter une tâche</h2>

            <p>
              Créez une nouvelle tâche et ajoutez-la à votre liste.
            </p>

            <form onSubmit={addTask}>
              <label htmlFor="taskName">
                Nom de la tâche
              </label>

              <input
                id="taskName"
                type="text"
                placeholder="Ex : Apprendre React..."
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />

              <button
                type="submit"
                className="submit-button"
                disabled={adding}
              >
                {adding ? "Ajout en cours..." : "+ Ajouter la tâche"}
              </button>
            </form>

            <div className="add-tip">
              <span>💡</span>
              <p>
                Conseil : utilisez des titres courts et précis
                pour mieux organiser votre travail.
              </p>
            </div>
          </aside>

        </section>

        <footer className="footer">
          <div className="footer-brand">
            <span>✓</span> TaskManager
          </div>

          <p>
            Réalisé dans le cadre du TP Docker 3
          </p>

          <span className="footer-school">
            ISET GAFSA © 2026
          </span>
        </footer>

      </main>
    </div>
  );
}

export default App;

