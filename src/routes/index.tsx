import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useWavesurfer } from "@wavesurfer/react";
import { useRef, useState } from "react";
import { compareVoice } from "@/functions/compare";
import { join } from "@/utils/css-join";

export const Route = createFileRoute("/")({ component: App });

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function App() {
  const [selectingLetter, setSelectingLetter] = useState<string>("a");
  const comparingScore = useQuery({
    queryKey: ["compare-voice"],
    queryFn: async () => {
      return (await compareVoice({ data: { letter: selectingLetter } })).sort(
        (a, b) => a.score - b.score,
      );
    },
    enabled: false,
    initialData: alphabet.map((letter) => ({ letter, score: 0 })),
  });

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-start">
      <div className="w-full text-center text-3xl my-5">Speech recognizer</div>
      <div className="w-full flex items-center justify-center gap-4 mb-4">
        <button
          type="button"
          className="btn btn-info"
          disabled={comparingScore.isFetching}
          onClick={() => {
            comparingScore.refetch();
          }}
        >
          {comparingScore.isFetching && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
          Test now
        </button>
      </div>
      <div className="grid grid-cols-2 w-full h-full grow p-4">
        <ul className="list rounded-box shadow-md">
          {alphabet.map((letter) => (
            <AudioItem
              key={letter}
              letter={letter}
              selected={selectingLetter === letter}
              url={`scoring/${letter}.wav`}
              onClick={() => setSelectingLetter(letter)}
            ></AudioItem>
          ))}
        </ul>
        <div>
          {comparingScore.isSuccess && (
            <ul className="list">
              {comparingScore.data?.map((entry) => (
                <AudioItem
                  key={entry.letter}
                  letter={entry.letter}
                  url={`alphabet/${entry.letter}.wav`}
                  score={entry.score}
                ></AudioItem>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AudioItem(props: {
  letter: string;
  url: string;
  score?: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const wavesurferRef = useRef(null);

  const { wavesurfer } = useWavesurfer({
    container: wavesurferRef,
    url: props.url,
    height: 100,
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: This is a demo, and I don't care about accessibility here
    <li
      className={join(
        "list-row flex flex-col items-stretch gap-4 hover:shadow-2xl transition-shadow cursor-pointer",
        props.selected === true ? "border-amber-200 border-2" : "",
      )}
      onClick={props.onClick}
    >
      <div className="flex items-center justify-between">
        <h2 className="w-full text-center text-2xl">{props.letter}</h2>
        <h3 className="text-center min-w-fit text-xl text-green-700">
          {props.score?.toFixed(2)}
        </h3>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="btn"
          onMouseUp={() => {
            wavesurfer?.play();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <title>Play</title>
            <path
              fill="currentColor"
              d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712"
            />
          </svg>
        </button>
        <div ref={wavesurferRef} className="grow"></div>
      </div>
    </li>
  );
}
