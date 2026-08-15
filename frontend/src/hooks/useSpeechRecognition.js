import { useState } from "react";

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "fr-FR";
    recognition.interimResults = false;
recognition.maxAlternatives = 5;
recognition.continuous = false;

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {
      setTranscript(event.results[0][0].transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  return {
    transcript,
    listening,
    startListening,
  };
}

export default useSpeechRecognition;