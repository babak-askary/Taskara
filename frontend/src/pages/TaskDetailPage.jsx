function TaskDetailPage() {
  return (
    <section className="task-detail-page fade-up">
      <header className="task-head card-surface">
        <div>
          <p className="eyebrow">Task Details</p>
          <h1>No task selected</h1>
          <p className="lead">Open a task to view details.</p>
        </div>
      </header>

      <article className="card-surface empty-board dashboard-empty">
        <div className="empty-badge" aria-hidden="true">⌁</div>
        <h2>Task details will appear here</h2>
        <p>Create a task first.</p>
      </article>
    </section>
  );
}

export default TaskDetailPage;
