import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { validateRegister } from "../utils/validation";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateRegister(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await registerUser(formData);

      alert("Registration Successful");

      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration Failed");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card>
        <form onSubmit={handleSubmit} className="w-96">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Register
          </h1>

          <div className="space-y-4">
            <Input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

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
              Register
            </Button>
          </div>

          <p className="text-center mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600">
              Login
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default Register;