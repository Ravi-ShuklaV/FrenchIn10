import { FaVolumeUp } from "react-icons/fa";

import useSpeech from "../../hooks/useSpeech";

function PronunciationButton({ text }) {
  const { speak } = useSpeech();

  return (
    <button
      onClick={() => speak(text)}
      className="text-green-600 hover:text-green-800 transition"
      title="Listen"
    >
      <FaVolumeUp />
    </button>
  );
}

export default PronunciationButton;