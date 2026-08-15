import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

function Navbar() {
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-green-400 font-semibold"
      : "hover:text-green-300 transition";

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
        <NavLink
          to="/"
          className="text-2xl font-bold text-green-400"
        >
          FrenchIn10
        </NavLink>

        <div className="flex items-center gap-6">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>

          {token ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/lessons" className={linkClass}>
                Lessons
              </NavLink>

              <NavLink to="/review" className={linkClass}>
                Review
              </NavLink>

              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>

              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;