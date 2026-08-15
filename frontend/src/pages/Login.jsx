import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import useAuthStore from "../store/authStore";

import { validateLogin } from "../utils/validation";
import { loginUser } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateLogin(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const data = await loginUser(formData);

      login(data.token, data.name);

      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card>
        <form onSubmit={handleSubmit} className="w-96">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Login
          </h1>

          <div className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>

          <p className="text-center mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-600">
              Register
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default Login;