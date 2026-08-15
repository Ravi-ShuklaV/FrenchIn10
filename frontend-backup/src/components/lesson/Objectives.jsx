function Objectives({ objectives }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">
        Learning Objectives
      </h2>

      <ul className="space-y-3">
        {objectives.map((objective, index) => (
          <li
            key={index}
            className="bg-white rounded-lg shadow p-4 flex items-center gap-3"
          >
            <span className="text-green-600 text-xl">
              ✓
            </span>

            <span>{objective}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Objectives;