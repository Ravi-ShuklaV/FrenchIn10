function Input({
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full border rounded-lg px-4 py-2 outline-none transition
          ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-green-500"
          }`}
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;