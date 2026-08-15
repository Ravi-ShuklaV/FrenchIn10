import SpeakerButton from "../common/SpeakerButton";

function Vocabulary({ vocabulary = [] }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">
        Vocabulary
      </h2>

      <div className="space-y-3">
        {vocabulary.map((word) => (
          <div
            key={word.french}
            className="bg-white rounded-lg shadow p-4"
          >
            {/* French word + speaker */}
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-2xl text-slate-800">
                {word.french}
              </h3>

              <SpeakerButton text={word.french} />
            </div>

            {/* English meaning */}
            <p className="text-gray-600 mt-1">
              {word.english}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Vocabulary;