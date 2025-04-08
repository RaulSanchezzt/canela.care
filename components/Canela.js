export default function Canela({ mood }) {
  const imageSrc =
    mood === "happy" ? "/img/canela-happy.png" : "/img/canela-neutral.png";

  return (
    <div className="flex justify-center mb-4">
      <img
        src={imageSrc}
        alt="Canela the mascot"
        className={`w-40 h-40 rounded-full border-4 border-purple-500 shadow-md transition-transform duration-300 ${
          mood === "happy" ? "scale-105 rotate-1" : ""
        }`}
      />
    </div>
  );
}
