import { FaMicrophone } from "react-icons/fa";

function MicrophoneButton({
  listening,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full p-2 transition ${
        listening
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white"
      }`}
      title="Speak"
    >
      <FaMicrophone />
    </button>
  );
}

export default MicrophoneButton;