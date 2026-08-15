function SpeakerButton({ text }) {
  const handleSpeak = () => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "fr-FR";
    speech.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-lg cursor-pointer"
      title="Listen"
    >
      🔊
    </button>
  );
}

export default SpeakerButton;