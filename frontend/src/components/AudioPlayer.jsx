function AudioPlayer({ src }) {
  return (
    <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-sky-100/80">
        Audio Guide
      </p>
      <audio className="mt-4 w-full" controls src={src}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default AudioPlayer;
