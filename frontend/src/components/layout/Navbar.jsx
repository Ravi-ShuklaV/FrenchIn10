import { NavLink, Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

function Navbar() {
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const name = useAuthStore((state) => state.name);
  const logout = useAuthStore((state) => state.logout);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-emerald-300 font-semibold"
      : "text-white/80 hover:text-white transition";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold"
        >
          FrenchIn10
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6 text-sm sm:text-base">

          {token ? (
            <>
              <NavLink
                to="/dashboard"
                className={linkClass}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/lessons"
                className={linkClass}
              >
                Lessons
              </NavLink>

              <NavLink
                to="/review"
                className={linkClass}
              >
                Review
              </NavLink>

              <span className="text-white/70">
                Hello, {name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="text-white/80 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white/80 hover:text-white transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Register
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;