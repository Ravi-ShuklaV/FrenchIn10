function useSpeech() {
  function speak(text, lang = "fr-FR") {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  return { speak };
}

export default useSpeech;