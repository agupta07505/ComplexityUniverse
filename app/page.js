import HomeAnalyzer from '@/components/HomeAnalyzer';

export const metadata = {
  title: 'ComplexityUniverse — Time & space complexity analyzer',
};

const SAMPLES = {
  binary: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
  nested: `function pairSum(values, target) {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] + values[j] === target) {
        return [values[i], values[j]];
      }
    }
  }
  return null;
}`,
  recursion: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
  sort: `function sortNames(names) {
  return names.sort((a, b) => a.localeCompare(b));
}`,
};

export default function HomePage() {
  return <HomeAnalyzer samples={SAMPLES} />;
}
