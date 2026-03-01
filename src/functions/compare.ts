import { readFile } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

type DistanceList = { letter: string; score: number }[];
type Result = {
  dtwDistance: DistanceList;
  euclideanDistance: DistanceList;
};

export const compareVoice = createServerFn()
  .inputValidator((data: { letter: string }) => data)
  .handler(async ({ data }) => {
    const { WaveFile } = await import("wavefile");

    const alphabetMapping: Map<string, Float64Array> = new Map();
    for (const letter of alphabet) {
      const file = await readFile(`public/alphabet/${letter}.wav`);
      const wavFile = new WaveFile();
      wavFile.fromBuffer(file);
      wavFile.toSampleRate(4000);
      alphabetMapping.set(letter, normalizeSoundWave(wavFile.getSamples()));
    }

    const mono = await readFile(`public/scoring/${data.letter}.wav`);
    const monoFile = new WaveFile();
    monoFile.fromBuffer(mono);
    monoFile.toSampleRate(4000);
    const comparingSamples = monoFile.getSamples();
    const monoSamples: Float64Array = Array.isArray(comparingSamples)
      ? comparingSamples[0]
      : comparingSamples;
    const incomingA = normalizeSoundWave(monoSamples);

    const dtwDistances: DistanceList = new Array(alphabet.length);
    for (const [letter, soundWave] of alphabetMapping) {
      dtwDistances.push({
        letter: letter,
        score: calculateDTW2(incomingA, soundWave),
      });
    }

    const euclideanDistances: DistanceList = new Array(alphabet.length);
    for (const [letter, soundWave] of alphabetMapping) {
      euclideanDistances.push({
        letter: letter,
        score: euclideanDistance(incomingA, soundWave),
      });
    }
    const result: Result = {
      dtwDistance: dtwDistances,
      euclideanDistance: euclideanDistances,
    };
    return result;
  });

export const euclideanDistance = (arr1: Float64Array, arr2: Float64Array) => {
  const expectedLen = Math.max(arr1.length, arr2.length);
  const paddedArr1 = padToMatch(arr1, expectedLen);
  const paddedArr2 = padToMatch(arr2, expectedLen);

  let sum = 0;
  for (let i = 0; i < expectedLen; i++) {
    sum += (paddedArr1[i] - paddedArr2[i]) ** 2;
  }
  return Math.sqrt(sum);
};

// 1. Pad shorter array with zeros (common for audio)
function padToMatch(arr: Float64Array, length: number): Float64Array {
  const padded = new Float64Array(length);
  padded.set(arr, 0);
  return padded;
}

/**
 * Normalizes a sound wave to the range [0, 1]. https://en.wikipedia.org/wiki/Feature_scaling#Rescaling_(min-max_normalization)
 * @param soundWave
 * @returns
 */
export const normalizeSoundWave = (soundWave: Float64Array) => {
  const min = Math.min(...soundWave);
  const max = Math.max(...soundWave);

  return soundWave.map((value) => (value - min) / (max - min));
};

/**
 * My quick dynamic programming take
 * @param ser1
 * @param ser2
 * @returns
 */
export const calculateDTW2 = (ser1: Float64Array, ser2: Float64Array) => {
  let previousCosts = new Array(ser2.length).fill(Infinity);
  previousCosts[0] = Math.abs(ser1[0] - ser2[0]);

  for (let i = 1; i < ser1.length; i++) {
    const currentCosts = new Array(ser2.length);

    currentCosts[0] = previousCosts[0] + Math.abs(ser1[i] - ser2[0]);
    for (let j = 1; j < ser2.length; j++) {
      const cost = Math.abs(ser1[i] - ser2[j]);
      currentCosts[j] =
        cost +
        Math.min(currentCosts[j - 1], previousCosts[j], previousCosts[j - 1]);
    }
    previousCosts = currentCosts;
  }
  return previousCosts[ser2.length - 1];
};

// const calculateDTW = (ser1: Float64Array, ser2: Float64Array) => {
//   const matrix: number[][] = [];

//   for (let i = 0; i < ser1.length; i++) {
//     matrix[i] = [];
//     for (let j = 0; j < ser2.length; j++) {
//       let cost = Infinity;
//       if (i > 0) {
//         cost = Math.min(cost, matrix[i - 1][j]);
//         if (j > 0) {
//           cost = Math.min(cost, matrix[i - 1][j - 1]);
//           cost = Math.min(cost, matrix[i][j - 1]);
//         }
//       } else {
//         if (j > 0) {
//           cost = Math.min(cost, matrix[i][j - 1]);
//         } else {
//           cost = 0;
//         }
//       }
//       matrix[i][j] = cost + Math.abs(ser1[i] - ser2[j]);
//     }
//   }
//   return matrix[ser1.length - 1][ser2.length - 1];
// };
