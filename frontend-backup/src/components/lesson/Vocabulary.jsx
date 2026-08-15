import PronunciationButton from "./PronunciationButton";

function Vocabulary({ vocabulary }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">
        Vocabulary
      </h2>

      <div className="space-y-3">
        {vocabulary.map((word) => (
          <div
            key={word.french}
            className="flex justify-between items-center bg-white rounded-lg shadow p-4"
          >
            <div>
              <h3 className="font-semibold text-lg">
                {word.french}
              </h3>

              <p className="text-gray-600">
                {word.english}
              </p>
            </div>

            <PronunciationButton text={word.french} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Vocabulary;