function Button({
  children,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;