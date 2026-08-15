import useAuthStore from "../store/authStore";

function Profile() {
  const name = useAuthStore((state) => state.name);

  return (
    <div>
      <h1 className="text-4xl font-bold">Profile</h1>

      <p className="mt-6 text-xl">
        Name: {name}
      </p>
    </div>
  );
}

export default Profile;