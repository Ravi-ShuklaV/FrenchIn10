import useSessionStore from "../../store/sessionStore";

function HandwritingSection() {
  const nextSection = useSessionStore(
    (state) => state.nextSection
  );

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <button
        type="button"
        onClick={nextSection}
        className="rounded-2xl bg-emerald-600 px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700"
      >
        Next →
      </button>
    </div>
  );
}

export default HandwritingSection;