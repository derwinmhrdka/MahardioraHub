import { loginAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main
      className="container"
      style={{
        maxWidth: "22rem",
        marginTop: "3rem",
        padding: "1.15rem",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        background: "var(--color-surface)",
      }}
    >
      <p
        style={{
          margin: "0 0 0.25rem",
          fontWeight: 600,
          color: "var(--color-accent)",
          letterSpacing: "-0.015em",
        }}
      >
        MahardioraHub
      </p>
      <h1 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>Admin</h1>
      {params.error ? (
        <p className="error">Invalid username or password.</p>
      ) : null}
      <form action={loginAction} className="form">
        <div className="form-row">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-block">
          Log in
        </button>
      </form>
    </main>
  );
}
