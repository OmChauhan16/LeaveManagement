import React, { useState } from "react";
import { apiClient } from "../lib/api";
import { saveToken } from "../App";
import { useNavigate } from "react-router-dom";

export default function Register({ onLogin }) {
  const params = new URLSearchParams(window.location.search);
  const preToken = params.get("token") || "";

  const [token, setToken] = useState(preToken);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // --- Validation ---
  const validate = () => {
    const errs = {};

    if (!token.trim()) {
      errs.token = "Invite token is required.";
    }

    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())
    ) {
      errs.email = "Enter a valid email address.";
    }

    if (!name.trim()) {
      errs.name = "Name is required.";
    } else if (name.trim().length < 3) {
      errs.name = "Name must be at least 3 characters.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    } else if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      errs.password = "Password must contain both letters and numbers.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Submit handler ---
  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (!validate()) return;

    try {
      const res = await apiClient().post("/auth/register-via-invite", {
        token,
        email,
        name,
        password,
      });

      saveToken(res.data.token);
      onLogin(res.data.user, res.data.token);
      navigate(res.data.user.role === "admin" ? "/admin" : "/candidate");
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Register using Invite
      </h2>

      <form onSubmit={submit} className="grid grid-cols-1 gap-4">
        {/* Invite Token */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Invite Token
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="p-2 w-full rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.token && (
            <p className="text-red-400 text-sm mt-1">{errors.token}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 w-full rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 w-full rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 w-full rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600 transition"
          >
            Register
          </button>
        </div>
      </form>

      {/* Server error msg */}
      {msg && <p className="text-red-400 mt-3">{msg}</p>}
    </div>
  );
}
