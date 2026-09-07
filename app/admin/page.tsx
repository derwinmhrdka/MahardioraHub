import { loginAction } from "./actions";
import styles from "./login.module.css";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.brand}>MahardioraHub</p>
        <h1 className={styles.title}>Admin Login</h1>
        {params.error ? (
          <p className="error">Username atau Password salah.</p>
        ) : null}
        <form action={loginAction} className="form admin-form">
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
            />
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
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
