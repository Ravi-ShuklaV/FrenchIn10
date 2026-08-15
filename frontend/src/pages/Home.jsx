import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-5xl font-bold">
        Learn French in Real Situations
      </h1>

      <p className="text-gray-600 mt-5 text-lg">
        Practice conversations, pronunciation, vocabulary,
        and reviews every day.
      </p>

      <div className="mt-10">
        <Link
          to="/register"
          className="bg-green-500 text-white px-6 py-3 rounded-lg"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}

export default Home;