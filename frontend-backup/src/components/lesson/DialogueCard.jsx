import { useEffect, useState } from "react";

import { calculateSimilarity } from "../../utils/calculateSimilarity";
import { addReview } from "../../services/reviewService";

import PronunciationButton from "./PronunciationButton";
import MicrophoneButton from "./MicrophoneButton";

import useSpeechRecognition from "../../hooks/useSpeechRecognition";

function DialogueCard({
  lessonId,
  line,
  onScoreChange,
}) {
  const [score, setScore] = useState(null);

  const {
    transcript,
    listening,
    startListening,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!transcript) return;

    async function processSpeech() {
      const similarity = calculateSimilarity(
        line.french,
        transcript
      );

      setScore(similarity);

      onScoreChange(similarity);

      if (similarity < 80) {
        try {
          await addReview({
            lessonId,
            french: line.french,
            english: line.english,
            score: similarity,
            type: "dialogue",
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    processSpeech();
  }, [
    transcript,
    line,
    onScoreChange,
  ]);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-bold text-green-600">
        {line.speaker}
      </h3>

      <p className="mt-3 text-xl">
        {line.french}
      </p>

      <p className="mt-2 text-gray-600">
        {line.english}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <PronunciationButton
          text={line.french}
        />

        <MicrophoneButton
          listening={listening}
          onClick={startListening}
        />
      </div>

      {transcript && (
        <div className="mt-4 rounded-lg bg-gray-100 p-3">
          <p className="text-sm text-gray-500">
            You said:
          </p>

          <p className="font-medium">
            {transcript}
          </p>

          <p className="mt-2 font-semibold">
            Accuracy: {score}%
          </p>
        </div>
      )}
    </div>
  );
}

export default DialogueCard;