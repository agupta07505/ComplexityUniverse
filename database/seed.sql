-- =====================================================================
--  ComplexityUniverse — seed data
--  Contains: site settings, AI prompt template, educational topics,
--            code examples, team member and demo user accounts,
--            user profiles, sample code analyses, and saved bookmarks.
-- =====================================================================
USE complexity_universe;

-- ---------------------------------------------------------------------
-- Site settings (Gemini API key is set from Admin -> AI settings)
-- ---------------------------------------------------------------------
INSERT INTO app_settings (setting_key, setting_value) VALUES
('gemini_api_key', ''),
('gemini_model', 'gemini-3.5-flash')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ---------------------------------------------------------------------
-- Default AI prompt (admin can edit it from the Admin page)
-- ---------------------------------------------------------------------
INSERT INTO analysis_prompts (id, name, prompt_template, is_active, version) VALUES
(1, 'default-complexity-analyst',
'You are a precise algorithms analyst inside a tool called ComplexityUniverse.

Analyze the {LANGUAGE} code below and determine its time and space complexity.

MODE: {MODE}
- detailed mode: give the core idea, walk through loops and recursion with their costs, best/average/worst cases if they differ, bottlenecks and concrete optimizations.
- short mode: keep the prose to two or three sentences, but still fill every JSON field.

Rules:
- Report complexity in Big-O notation, worst case unless the cases genuinely differ.
- Treat a sorting call as O(n log n) time. Consider recursion depth in the space cost.
- Count auxiliary structures (maps, sets, new arrays) toward space complexity.
- If the code is ambiguous, state the assumption you made inside "notes".

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "confidence": 0.0,
  "summary": "one or two sentences a human would say out loud",
  "approach": "what the code is doing and why the cost follows from it",
  "breakdown": [{"label": "outer loop", "detail": "iterates the array once", "cost": "O(n)"}],
  "cases": {"best": "O(...)", "average": "O(...)", "worst": "O(...)"},
  "bottlenecks": ["the most expensive part of the code"],
  "optimizations": ["a concrete way to make it cheaper"],
  "notes": ""
}

CODE:
"""
{CODE}
"""', 1, 1)
ON DUPLICATE KEY UPDATE prompt_template = VALUES(prompt_template);

INSERT INTO complexity_topics
  (id, topic_name, slug, category, difficulty, time_complexity, space_complexity, summary, notes_html, sort_order, is_published)
VALUES
(1, 'Big-O Notation', 'big-o-notation', 'Fundamentals', 'Beginner', '—', '—',
 'The vocabulary we use to describe how code scales as the input grows.',
 '<h2>What Big-O actually measures</h2>
<p>Big-O describes how the <em>cost</em> of an algorithm grows when the input size <code>n</code> grows. It deliberately ignores constants and lower-order terms: a loop that runs <code>3n + 12</code> steps is still <code>O(n)</code>, because at scale the shape of the curve is what matters.</p>
<h3>The rules of thumb</h3>
<ul>
  <li><strong>Drop constants:</strong> <code>O(2n)</code> is written <code>O(n)</code>.</li>
  <li><strong>Drop lower-order terms:</strong> <code>O(n^2 + n)</code> is written <code>O(n^2)</code>.</li>
  <li><strong>Two inputs, two variables:</strong> <code>O(a + b)</code> or <code>O(a * b)</code> — never collapse them into one <code>n</code> unless they are the same size.</li>
  <li><strong>Sequential work adds, nested work multiplies.</strong></li>
</ul>
<h3>Why worst case is the default</h3>
<p>When we say <em>the</em> complexity without qualification we mean the worst case: the most work the algorithm can ever do on an input of size <code>n</code>. For binary search the worst case is <code>O(log n)</code> — the element might be found immediately (best case <code>O(1)</code>), but planning around luck is how systems fall over.</p>
<h3>Complexity is not the same as speed</h3>
<p>An <code>O(n)</code> algorithm can beat an <code>O(log n)</code> one on tiny inputs because constants and cache behaviour matter at small scale. Complexity classes tell you about <em>growth</em>, and growth is what bites in production.</p>', 10, 1),

(2, 'Constant Time — O(1)', 'constant-time-o1', 'Common Complexities', 'Beginner', 'O(1)', 'O(1)',
 'Work that does not care how big the input is: array indexing, hash lookups, arithmetic.',
 '<h2>The shape of O(1)</h2>
<p>An <code>O(1)</code> operation takes the same number of steps whether <code>n</code> is ten or ten million. Reading <code>arr[5]</code> is one pointer jump. Appending to a well-designed dynamic array is <em>amortised</em> <code>O(1)</code> — most appends are one write, and the occasional resize is spread across many cheap appends.</p>
<h3>Classic O(1) operations</h3>
<ul>
  <li>Array index read/write</li>
  <li>Hash map get/set (average case — collisions can degrade this)</li>
  <li>Push and pop at one end of a stack or queue</li>
  <li>Arithmetic on fixed-size integers</li>
</ul>
<h3>A trap: "O(1) per call" is not O(1) overall</h3>
<p>Calling an <code>O(1)</code> operation <code>n</code> times inside a loop is <code>O(n)</code>. Complexity composes: the cost of a routine multiplied by how often you run it.</p>', 20, 1),

(3, 'Logarithmic Time — O(log n)', 'logarithmic-time-ologn', 'Common Complexities', 'Beginner', 'O(log n)', 'O(1)',
 'Halving the problem every step — binary search, balanced tree operations.',
 '<h2>Why halving is so cheap</h2>
<p>When each step throws away half of what is left, the number of steps is the number of times you can halve <code>n</code> before reaching 1 — that is exactly <code>log2(n)</code>. One million elements need about 20 steps. One billion needs about 30.</p>
<h3>Binary search, the canonical example</h3>
<p>Keep a window <code>[lo, hi]</code>, look at the middle element, and discard the half that cannot contain the target. The loop runs <code>O(log n)</code> times and uses <code>O(1)</code> extra space.</p>
<h3>The price of logarithms</h3>
<p>Logarithmic structures usually need the data to be <em>ordered</em> (sorted array, BST, heap). Maintaining that order is where your <code>O(log n)</code> insert or delete cost comes from. In a hash map you trade the ordering for <code>O(1)</code> average lookup and lose the ability to ask "what is the next key?" cheaply.</p>', 30, 1),

(4, 'Linear Time — O(n)', 'linear-time-on', 'Common Complexities', 'Beginner', 'O(n)', 'O(1)',
 'Touching every element once — scans, sums, filters, map over an array.',
 '<h2>The shape of O(n)</h2>
<p>If the work grows in a straight line with the input — one pass over the array, one pass over the string — the cost is <code>O(n)</code>. Double the input, double the time.</p>
<h3>What counts as O(n)</h3>
<ul>
  <li>Finding the maximum of an unsorted array</li>
  <li>Summing a list, computing averages</li>
  <li>Checking whether every value has a property (a single early-exit scan is still <code>O(n)</code> worst case)</li>
  <li>Copying an array or building a frequency map from it</li>
</ul>
<h3>Two passes are still O(n)</h3>
<p>Scanning the input twice is <code>O(2n)</code>, which is <code>O(n)</code> after dropping constants. What changes the class is <em>nesting</em>: a scan inside a scan multiplies instead of adding.</p>', 40, 1),

(5, 'Linearithmic Time — O(n log n)', 'linearithmic-time-onlogn', 'Common Complexities', 'Intermediate', 'O(n log n)', 'O(n)',
 'The cost of efficient comparison sorting — mergesort, heapsort, timsort, quicksort average case.',
 '<h2>Where n log n comes from</h2>
<p>Comparison sorts cannot do better than <code>O(n log n)</code> in the worst case — there are <code>n!</code> possible orderings and each comparison splits the possibilities in half, so you need at least <code>log2(n!) ≈ n log n</code> decisions. Mergesort achieves this by splitting the array in half (<code>log n</code> levels) and merging each level in <code>O(n)</code>.</p>
<h3>What this means in practice</h3>
<ul>
  <li>Sorting an array, then doing linear work, is dominated by the sort: <code>O(n log n)</code>.</li>
  <li>Sorting an already sorted array in a good library sort (timsort) is <code>O(n)</code> best case.</li>
  <li>Quicksort averages <code>O(n log n)</code> but degrades to <code>O(n^2)</code> on bad pivots — which is why libraries use introsort hybrids.</li>
</ul>
<h3>Space is not free</h3>
<p>Mergesort needs <code>O(n)</code> scratch space. Heapsort sorts in place at <code>O(1)</code> extra space but with worse cache behaviour. Choosing a sort is a space and constant-factor decision as much as a complexity one.</p>', 50, 1),

(6, 'Quadratic Time — O(n^2)', 'quadratic-time-on2', 'Common Complexities', 'Intermediate', 'O(n^2)', 'O(1)',
 'Nested loops over the same input — the classic "it works on my laptop" trap.',
 '<h2>The shape of O(n^2)</h2>
<p>Every element paired with every other element: a loop inside a loop over the same input. Ten items means a hundred inner steps; ten thousand items means a hundred million.</p>
<h3>Where it hides</h3>
<ul>
  <li>Checking every pair for duplicates (without a set)</li>
  <li>Bubble sort, selection sort, insertion sort</li>
  <li>Naive string matching that restarts the inner scan on each position</li>
  <li>Comparing every point with every other point (closest pair, naive clustering)</li>
</ul>
<h3>When quadratic is actually fine</h3>
<p>If <code>n</code> is genuinely tiny and bounded (say, 30 columns in a config), <code>O(n^2)</code> is 900 operations and nobody cares. The danger is assuming <code>n</code> stays small. Before optimising, measure; before shipping, ask what <code>n</code> will be in a year.</p>', 60, 1),

(7, 'Exponential Time — O(2^n)', 'exponential-time-o2n', 'Common Complexities', 'Advanced', 'O(2^n)', 'O(n)',
 'Recursion that explores every subset — brute-force subsets, naive Fibonacci, backtracking.',
 '<h2>The shape of O(2^n)</h2>
<p>Each extra input element <em>doubles</em> the work. This is the class of "try every combination" algorithms. <code>n = 20</code> is already about a million steps; <code>n = 40</code> is a trillion.</p>
<h3>Why naive Fibonacci is exponential</h3>
<p><code>fib(n) = fib(n-1) + fib(n-2)</code> builds a recursion tree where almost every call re-computes the same values. The number of nodes in that tree is about <code>1.618^n</code> — exponential in <code>n</code>.</p>
<h3>The escape hatches</h3>
<ul>
  <li><strong>Memoisation:</strong> cache each <code>fib(k)</code> and the tree collapses to <code>O(n)</code> time.</li>
  <li><strong>Bottom-up DP:</strong> fill a table from small subproblems up — same <code>O(n)</code> without recursion depth issues.</li>
  <li><strong>Prune the search:</strong> backtracking with a good bound can cut whole branches.</li>
</ul>
<p>Some problems (exact travelling salesman, subset sum) are believed to have no polynomial algorithms at all — then the goal is clever pruning or accepting heuristics.</p>', 70, 1),

(8, 'Recursion and Space Complexity', 'recursion-and-space', 'Fundamentals', 'Intermediate', 'varies', 'O(depth)',
 'The call stack is memory too — how recursion depth feeds directly into space cost.',
 '<h2>Time and space tell different stories</h2>
<p>Recursive code often looks elegant while quietly reserving a stack frame per call. A linear recursion over <code>n</code> elements uses <code>O(n)</code> stack space even if each frame does constant work. Deep recursion on large inputs can exhaust the call stack before the time cost ever matters.</p>
<h3>Reading a recursive function</h3>
<ul>
  <li><strong>Number of self-calls per frame:</strong> one call usually gives linear time; two gives exponential unless work is shared.</li>
  <li><strong>Input shrink per call:</strong> <code>n - 1</code> gives depth <code>n</code>; halving gives depth <code>log n</code>.</li>
  <li><strong>Work per frame outside the recursion:</strong> adding <code>O(n)</code> copying per frame of an <code>n</code>-deep recursion gives <code>O(n^2)</code>.</li>
</ul>
<h3>The master theorem, informally</h3>
<p>If a problem of size <code>n</code> becomes <code>a</code> subproblems of size <code>n/b</code> plus <code>O(n^k)</code> merging work, the total is dominated by whichever of <code>log_b(a)</code> and <code>k</code> is larger. Mergesort is <code>a=2, b=2, k=1</code>: <code>n log n</code>.</p>', 80, 1),

(9, 'Sorting Algorithms', 'sorting-algorithms', 'Data Structures & Algorithms', 'Intermediate', 'O(n log n)', 'varies',
 'Bubble, merge and quicksort side by side — the same goal, very different costs.',
 '<h2>One problem, three price tags</h2>
<p>Sorting is the standard textbook for comparing complexities because the same problem admits clear winners and losers.</p>
<h3>Bubble sort — O(n^2)</h3>
<p>Repeatedly swap adjacent out-of-order pairs. Every pass walks the whole array, and there are <code>n</code> passes. Simple to write, hopelessly slow on large data — but it is the fastest thing to type for 8 items.</p>
<h3>Mergesort — O(n log n) time, O(n) space</h3>
<p>Split in half, sort each half recursively, merge the sorted halves. The recursion depth is <code>log n</code> and every level merges <code>n</code> items in total. Stable, predictable, needs scratch space.</p>
<h3>Quicksort — O(n log n) average, O(n^2) worst</h3>
<p>Pick a pivot, partition smaller left and larger right, recurse. With good pivots the depth is <code>log n</code>; with a consistently terrible pivot (already-sorted input, naive first-element pivot) it becomes <code>n</code>. In-place at <code>O(log n)</code> stack space on average.</p>', 90, 1),

(10, 'Searching', 'searching', 'Searching', 'Beginner', 'varies', 'varies',
 'Linear scan versus binary search — the difference between reading everything and halving.',
 '<h2>Linear search — O(n)</h2>
<p>Check elements one at a time. Works on unsorted data, needs no preparation, and is optimal for small or unsorted inputs. On 10 million items it may take 10 million comparisons.</p>
<h2>Binary search — O(log n)</h2>
<p>Requires sorted data. Compare against the middle, discard half, repeat. On 10 million sorted items it takes at most about 24 comparisons. The preprocessing sort costs <code>O(n log n)</code> — worth it if you search more than <code>log n</code> times.</p>
<h3>Choosing between them</h3>
<ul>
  <li>Search once over unsorted data → linear scan.</li>
  <li>Search many times → sort once, then binary search (or build a hash map for <code>O(1)</code> average).</li>
  <li>Need the closest value, range queries, or ordered traversal → binary search over a sorted structure; hash maps cannot help.</li>
</ul>', 100, 1),

(11, 'Hash Tables', 'hash-tables', 'Data Structures & Algorithms', 'Intermediate', 'O(1) avg', 'O(n)',
 'Maps and sets — constant-time lookups on average, and what you give up for them.',
 '<h2>The deal a hash table makes</h2>
<p>Hash the key to a bucket index, then look inside only that bucket. With a decent hash function and a reasonable load factor, each bucket holds a constant number of entries — so lookup, insert and delete are <code>O(1)</code> on average.</p>
<h3>When the average betrays you</h3>
<ul>
  <li><strong>Pathological keys:</strong> if many keys hash to the same bucket, operations degrade toward <code>O(n)</code>. Modern implementations use randomised seeds to make this hard to trigger.</li>
  <li><strong>Resizing:</strong> when the table grows past its load factor it rehashes everything — an <code>O(n)</code> spike, amortised back to <code>O(1)</code> per insert.</li>
  <li><strong>Ordering:</strong> keys come back in an unpredictable order. No "next larger key" without sorting.</li>
</ul>
<h3>Complexity in practice</h3>
<p>Counting frequencies with a map is <code>O(n)</code> time and <code>O(n)</code> space — the fastest possible for that problem. Using a map to de-duplicate a list is the classic fix for a quadratic pair-checking loop.</p>', 110, 1),

(12, 'Two Pointers and Sliding Window', 'two-pointers-sliding-window', 'Techniques', 'Intermediate', 'O(n)', 'O(1)',
 'Turn nested loops into a single coordinated pass — pairs, subarrays and substrings.',
 '<h2>The idea</h2>
<p>Instead of restarting an inner scan for every position, keep two indices that only move forward. Each element is visited a constant number of times, so the whole algorithm is <code>O(n)</code>.</p>
<h3>Two pointers (pairs)</h3>
<p>Sorted array, find a pair summing to a target: one pointer at each end. Too small → advance the left; too large → retreat the right. Both pointers cross at most once: <code>O(n)</code> after the sort.</p>
<h3>Sliding window (subarrays)</h3>
<p>Maintain a window <code>[left, right]</code> that always satisfies your condition, extending <code>right</code> and shrinking <code>left</code> as needed. Longest substring without repeats, smallest subarray over a sum — all single-pass once the invariant is right.</p>
<h3>Why it beats brute force</h3>
<p>Brute force considers every subarray: <code>O(n^2)</code> or <code>O(n^3)</code>. The window turns "consider all subarrays" into "slide one subarray", because the condition is monotone as the window grows or shrinks.</p>', 120, 1),

(13, 'Dynamic Programming Complexity', 'dynamic-programming', 'Techniques', 'Advanced', 'O(n * states)', 'O(states)',
 'Memoised recursion and table filling — how states and transitions set the price.',
 '<h2>Counting states and transitions</h2>
<p>A DP has two multipliers: how many <em>states</em> you fill and how expensive each <em>transition</em> is. Total time is roughly <code>states × transition cost</code>. For the classic knapsack there are <code>O(nW)</code> states with <code>O(1)</code> transitions, so <code>O(nW)</code> time.</p>
<h3>From exponential to polynomial</h3>
<p>Subset sum by brute force is <code>O(2^n)</code>. With a DP table keyed on <code>(index, running sum)</code> it becomes <code>O(n * sum)</code> — pseudo-polynomial, and worlds faster when <code>sum</code> is reasonable.</p>
<h3>Trimming the space</h3>
<ul>
  <li>When state <code>k</code> only depends on <code>k-1</code>, two rows suffice: <code>O(W)</code> space instead of <code>O(nW)</code>.</li>
  <li>Memoised recursion allocates only reachable states — better when the state graph is sparse.</li>
  <li>Reconstruction (printing the actual solution) usually needs the full table or parent pointers.</li>
</ul>', 130, 1),

(14, 'Graph Traversal — BFS and DFS', 'graph-traversal', 'Data Structures & Algorithms', 'Advanced', 'O(V + E)', 'O(V)',
 'Visiting every vertex and edge exactly once — the baseline cost of any graph algorithm.',
 '<h2>The complexity floor</h2>
<p>Breadth-first and depth-first traversal both touch each vertex once and each edge once: <code>O(V + E)</code> time. For an adjacency list this is optimal — you cannot know a graph is connected without looking at its edges.</p>
<h3>BFS — queue, shortest unweighted path</h3>
<p>Explore level by level. The queue holds at most one frontier: <code>O(V)</code> space. The first time BFS reaches a node is via a shortest path in edges.</p>
<h3>DFS — stack (or recursion), structure discovery</h3>
<p>Go deep, backtrack. Uses <code>O(V)</code> stack space (recursion depth can hit <code>V</code> on a line-shaped graph). Finds connected components, topological order, and cycles.</p>
<h3>When graphs make things worse</h3>
<p>A grid of <code>n</code> cells is a graph with <code>O(n)</code> edges — traversal stays linear. But "all simple paths" is exponential: traversal is cheap, exhaustive enumeration never is.</p>', 140, 1),

(15, 'Big-O Cheat Sheet', 'big-o-cheat-sheet', 'Fundamentals', 'Beginner', '—', '—',
 'The classes from fastest to slowest, with typical operations at each level.',
 '<h2>The ladder of complexity classes</h2>
<table class="cu-table">
  <thead><tr><th>Big-O</th><th>Name</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>O(1)</code></td><td>Constant</td><td>Hash map lookup, array index</td></tr>
    <tr><td><code>O(log n)</code></td><td>Logarithmic</td><td>Binary search</td></tr>
    <tr><td><code>O(n)</code></td><td>Linear</td><td>Single scan, linear search</td></tr>
    <tr><td><code>O(n log n)</code></td><td>Linearithmic</td><td>Mergesort, heapsort</td></tr>
    <tr><td><code>O(n^2)</code></td><td>Quadratic</td><td>Nested loops, bubble sort</td></tr>
    <tr><td><code>O(n^3)</code></td><td>Cubic</td><td>Triple nested loops, naive matrix multiply</td></tr>
    <tr><td><code>O(2^n)</code></td><td>Exponential</td><td>Subsets, naive recursive Fibonacci</td></tr>
    <tr><td><code>O(n!)</code></td><td>Factorial</td><td>Generating all permutations</td></tr>
  </tbody>
</table>
<h3>Practical sizes at one nanosecond per operation</h3>
<ul>
  <li><code>n = 20</code>: <code>2^n</code> is about a million — fine. <code>n!</code> is already hopeless.</li>
  <li><code>n = 10,000</code>: <code>O(n^2)</code> is 100 million steps — borderline. <code>O(n log n)</code> is ~130 thousand.</li>
  <li><code>n = 10,000,000</code>: only <code>O(n)</code> and better survive.</li>
</ul>
<p>Print this table next to your desk. Most production performance bugs are an accidental <code>O(n^2)</code> hiding inside a loop that "only runs on small data".</p>', 150, 1);

-- ---------------------------------------------------------------------


INSERT INTO topic_examples
  (topic_id, title, language, code_text, analysis_html, time_complexity, space_complexity, sort_order)
VALUES
(2, 'Array index read', 'javascript',
'function firstItem(arr) {
  return arr[0];
}',
'<p>One pointer jump from the array base — the classic constant-time operation. No matter how long the array is, this is a single step. <code>O(1)</code> time, <code>O(1)</code> space.</p>',
'O(1)', 'O(1)', 1),

(3, 'Binary search', 'javascript',
'function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}',
'<p>Each iteration halves the search window: <code>n, n/2, n/4, ... 1</code> takes <code>log2(n)</code> steps. Only two integer variables are kept — <code>O(1)</code> space. This is the algorithm that turns "search a million rows" into "search 20 rows".</p>',
'O(log n)', 'O(1)', 1),

(4, 'Summing an array', 'javascript',
'function total(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}',
'<p>Every element is read exactly once and combined with a running total: <code>O(n)</code> time. The loop carries one accumulator — <code>O(1)</code> extra space.</p>',
'O(n)', 'O(1)', 1),

(5, 'Mergesort', 'javascript',
'function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}',
'<p>The array is split in half <code>log n</code> times; each level of the recursion tree merges a total of <code>n</code> items — so <code>O(n log n)</code> time. The <code>slice</code> calls copy the input at every level, giving <code>O(n)</code> auxiliary space (a standard in-place merge variant still needs <code>O(n)</code> scratch, plus <code>O(log n)</code> stack).</p>',
'O(n log n)', 'O(n)', 1),

(6, 'Duplicate pair check', 'javascript',
'function hasDuplicatePair(values) {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] === values[j]) return true;
    }
  }
  return false;
}',
'<p>The inner loop runs roughly <code>n/2</code> times per outer iteration — the familiar <code>n(n-1)/2</code> pair count, which is <code>O(n^2)</code> time and <code>O(1)</code> space. A <code>Set</code> of seen values collapses this to <code>O(n)</code> time at the cost of <code>O(n)</code> space.</p>',
'O(n^2)', 'O(1)', 1),

(7, 'Naive Fibonacci', 'javascript',
'function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}',
'<p>Each call spawns two more calls until <code>n</code> hits 0 or 1. The recursion tree holds about <code>1.618^n</code> nodes — exponential time. The depth of the tree is <code>O(n)</code>, so the call stack is <code>O(n)</code>. Memoising with a map brings the time down to <code>O(n)</code>.</p>',
'O(2^n)', 'O(n)', 1),

(9, 'Bubble sort', 'javascript',
'function bubbleSort(arr) {
  const a = arr.slice();
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  }
  return a;
}',
'<p>Two nested loops over the same array: the outer runs <code>n</code> times and the inner up to <code>n</code> times — <code>O(n^2)</code> time worst and average case (best case is <code>O(n)</code> if you early-exit on a clean pass). The copy costs <code>O(n)</code> space; the swaps themselves are <code>O(1)</code>.</p>',
'O(n^2)', 'O(n)', 1),

(10, 'Linear vs binary search', 'javascript',
'function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}',
'<p>Unsorted data forces a scan: <code>O(n)</code> time, <code>O(1)</code> space. If the same array will be searched repeatedly, sort it once and switch to binary search — total cost then approaches <code>O(log n)</code> per query.</p>',
'O(n)', 'O(1)', 1),

(11, 'Frequency counting with a map', 'javascript',
'function mostFrequent(items) {
  const counts = new Map();
  let best = null, bestCount = 0;
  for (const item of items) {
    const next = (counts.get(item) || 0) + 1;
    counts.set(item, next);
    if (next > bestCount) {
      bestCount = next;
      best = item;
    }
  }
  return best;
}',
'<p>One pass over the input, each map operation is <code>O(1)</code> on average — total <code>O(n)</code> time. The map can hold up to <code>n</code> distinct keys: <code>O(n)</code> space. This is the standard fix when a quadratic "count for each element" loop shows up in review.</p>',
'O(n)', 'O(n)', 1),

(12, 'Longest substring without repeats', 'javascript',
'function longestUnique(s) {
  const seen = new Set();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}',
'<p>The window <code>[left, right]</code> only moves forward: each character is added and removed from the set at most once — <code>O(n)</code> time despite the nested <code>while</code>. The set holds at most the alphabet in play, <code>O(min(n, alphabet))</code> space.</p>',
'O(n)', 'O(min(n, k))', 1),

(14, 'BFS shortest path', 'javascript',
'function bfs(graph, start) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node] || []) {
      if (!dist.has(next)) {
        dist.set(next, dist.get(node) + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}',
'<p>Every vertex enters the queue once and every edge is inspected once: <code>O(V + E)</code> time. The distance map and queue hold at most all vertices — <code>O(V)</code> space. (A real queue would use a deque or ring buffer; <code>shift()</code> on a plain array is <code>O(n)</code> per call in isolation, but the traversal total stays linear with a proper queue.)</p>',
'O(V + E)', 'O(V)', 1);


-- ---------------------------------------------------------------------
-- Users (Team Members from Project Report Table 8.1 + Platform Accounts)
-- ---------------------------------------------------------------------
-- Password for admin accounts: admin123  (bcrypt hash: $2a$10$qRYyzlERsAxYh1.p7vEINO8Vt163nFb2UPjLaHc8o9TouO4kINhf6)
-- Password for student accounts: user123 (bcrypt hash: $2a$10$327b15N5pf7xdPMsjRHPY.eqPsU4O56.Zg2uVZ8JG0xPgovgV133C)
-- Password for demo accounts: demo1234  (bcrypt hash: $2a$10$4p9iYYZeXfZ1mKS4k22TauMAOJl0IQcJzZJj3Kh8PDu.XKUozSBlu)
INSERT INTO users (id, name, email, password_hash, role, status, analysis_count) VALUES
(1, 'System Administrator', 'admin@complexity.io', '$2a$10$qRYyzlERsAxYh1.p7vEINO8Vt163nFb2UPjLaHc8o9TouO4kINhf6', 'admin', 'active', 12),
(2, 'Animesh Gupta', 'animesh@iiitbhopal.ac.in', '$2a$10$327b15N5pf7xdPMsjRHPY.eqPsU4O56.Zg2uVZ8JG0xPgovgV133C', 'user', 'active', 28),
(3, 'Aditya Chaudhary', 'aditya@iiitbhopal.ac.in', '$2a$10$327b15N5pf7xdPMsjRHPY.eqPsU4O56.Zg2uVZ8JG0xPgovgV133C', 'user', 'active', 19),
(4, 'Ritik Raj', 'ritik@iiitbhopal.ac.in', '$2a$10$327b15N5pf7xdPMsjRHPY.eqPsU4O56.Zg2uVZ8JG0xPgovgV133C', 'user', 'active', 15),
(5, 'Gaurav Kumar Singh', 'gaurav@iiitbhopal.ac.in', '$2a$10$327b15N5pf7xdPMsjRHPY.eqPsU4O56.Zg2uVZ8JG0xPgovgV133C', 'user', 'active', 22),
(6, 'Site Admin', 'admin@complexityuniverse.dev', '$2a$10$qRYyzlERsAxYh1.p7vEINO8Vt163nFb2UPjLaHc8o9TouO4kINhf6', 'admin', 'active', 8),
(7, 'Demo Analyst', 'demo@complexityuniverse.dev', '$2a$10$4p9iYYZeXfZ1mKS4k22TauMAOJl0IQcJzZJj3Kh8PDu.XKUozSBlu', 'user', 'active', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  status = VALUES(status),
  analysis_count = VALUES(analysis_count);

-- ---------------------------------------------------------------------
-- User Profiles (1 : 1 with users, provisions bios, headlines, locations)
-- ---------------------------------------------------------------------
INSERT INTO user_profiles (user_id, headline, bio, location, avatar_seed) VALUES
(1, 'Lead Platform Administrator', 'Overseeing AI prompt templates, system telemetry, and platform governance.', 'Cloud HQ', 'admin_corp'),
(2, 'Full-Stack & Systems Engineer', 'Founder of ComplexityUniverse. Specializing in asymptotic analysis and Next.js systems.', 'Bhopal, India', 'animesh_gupta'),
(3, 'Algorithms & Theory Researcher', 'Focusing on asymptotic notation, recurrence trees, and dynamic programming.', 'Bhopal, India', 'aditya_chaudhary'),
(4, 'Database Architecture Specialist', 'Designing BCNF relational schemas, SQL triggers, and indexing strategies.', 'Bhopal, India', 'ritik_raj'),
(5, 'Performance & Systems Engineer', 'Profiling time-space trade-offs in distributed and high-concurrency systems.', 'Bhopal, India', 'gaurav_singh'),
(6, 'Site Administrator', 'Administrator console operator.', 'Remote', 'site_admin'),
(7, 'Curious about the cost of code', 'Exploring algorithmic efficiency and Big-O badging.', 'Bengaluru, India', 'demo_analyst')
ON DUPLICATE KEY UPDATE
  headline = VALUES(headline),
  bio = VALUES(bio),
  location = VALUES(location),
  avatar_seed = VALUES(avatar_seed);

-- ---------------------------------------------------------------------
-- Code Analyses (Matches Project Report Table 8.2 and SQL Query Suite)
-- Note: code_lines is computed automatically by MySQL stored expression
-- ---------------------------------------------------------------------
INSERT INTO code_analyses
  (id, user_id, title, language, code_text, time_complexity, space_complexity, summary, detailed_analysis, detail_mode, engine, prompt_version)
VALUES
(1, 2, 'Two-Sum Hash Map Lookup', 'javascript',
'function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test case execution
const nums = [2, 7, 11, 15];
const target = 9;
const result = twoSum(nums, target);
console.log(result);
',
'O(n)', 'O(n)',
'Single pass with a hash map achieves linear time complexity.',
'{"approach":"Hash table lookup for complement complements in O(1) average time.","breakdown":[{"label":"for loop","detail":"traverses array of size n","cost":"O(n)"},{"label":"map lookup","detail":"hash map search","cost":"O(1)"}],"cases":{"best":"O(1)","average":"O(n)","worst":"O(n)"},"bottlenecks":["memory allocation for hash map"],"optimizations":["already optimal time complexity"],"notes":""}',
'detailed', 'gemini', 1),

(2, 2, 'Merge Sort Recursive', 'javascript',
'// Function to merge two sorted sub-arrays
function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  while (i < left.length) {
    result.push(left[i++]);
  }
  while (j < right.length) {
    result.push(right[j++]);
  }
  return result;
}

// Main recursive divide-and-conquer function
function mergeSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

// Sample test case
const unsorted = [38, 27, 43, 3, 9, 82, 10];
const sorted = mergeSort(unsorted);
console.log(sorted);
',
'O(n log n)', 'O(n)',
'Divide-and-conquer sorting algorithm with logarithmic recursion levels.',
'{"approach":"Divide and conquer splits array into halves and merges in linear time.","breakdown":[{"label":"recursion depth","detail":"halves array each step","cost":"O(log n)"},{"label":"merge step","detail":"scans two halves","cost":"O(n)"}],"cases":{"best":"O(n log n)","average":"O(n log n)","worst":"O(n log n)"},"bottlenecks":["auxiliary array slice allocations"],"optimizations":["in-place buffer allocation"],"notes":""}',
'detailed', 'gemini', 1),

(3, 3, 'Fibonacci Recursive (Naive)', 'javascript',
'function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

// Compute 10th Fibonacci number
console.log(fib(10));',
'O(2^n)', 'O(n)',
'Exponential recursion tree with redundant recalculations.',
'{"approach":"Binary recursion tree causes exponential branching factor of ~1.618.","breakdown":[{"label":"recursive branching","detail":"two calls per non-base case","cost":"O(2^n)"},{"label":"call stack","detail":"depth reaches n frames","cost":"O(n)"}],"cases":{"best":"O(1)","average":"O(2^n)","worst":"O(2^n)"},"bottlenecks":["repeated subproblem evaluation"],"optimizations":["memoization or bottom-up tabulation reduces time to O(n)"],"notes":""}',
'detailed', 'gemini', 1),

(4, 4, 'Bubble Sort In-Place', 'javascript',
'// In-place bubble sort algorithm
function bubbleSort(arr) {
  const n = arr.length;
  let swapped = false;
  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) {
      break;
    }
  }
  return arr;
}

// Sample execution
const data = [64, 34, 25, 12, 22, 11, 90];
console.log(bubbleSort(data));',
'O(n^2)', 'O(1)',
'Nested pairwise comparisons in adjacent elements.',
'{"approach":"Iterative adjacent bubble comparisons with early exit flag.","breakdown":[{"label":"outer pass","detail":"runs n times","cost":"O(n)"},{"label":"inner comparison","detail":"compares adjacent elements","cost":"O(n)"}],"cases":{"best":"O(n)","average":"O(n^2)","worst":"O(n^2)"},"bottlenecks":["quadratic comparison count on reverse sorted data"],"optimizations":["switch to quicksort or mergesort"],"notes":""}',
'detailed', 'gemini', 1),

(5, 1, 'Binary Search Divide & Conquer', 'javascript',
'function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const sorted = [1, 3, 5, 7, 9, 11];
console.log(binarySearch(sorted, 7));',
'O(log n)', 'O(1)',
'Halves search space each iteration on sorted array.',
'{"approach":"Iterative window halving on sorted array.","breakdown":[{"label":"while loop","detail":"halves window range [left, right]","cost":"O(log n)"}],"cases":{"best":"O(1)","average":"O(log n)","worst":"O(log n)"},"bottlenecks":["requires pre-sorted array"],"optimizations":["optimal search complexity"],"notes":""}',
'detailed', 'gemini', 1),

(6, 5, 'Quick Sort with Hoare Partition', 'python',
'def quicksort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi)
        quicksort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[low]
    i = low - 1
    j = high + 1
    while True:
        i += 1
        while arr[i] < pivot:
            i += 1
        j -= 1
        while arr[j] > pivot:
            j -= 1
        if i >= j:
            return j
        arr[i], arr[j] = arr[j], arr[i]

# Sample execution
nums = [10, 7, 8, 9, 1, 5]
quicksort(nums, 0, len(nums) - 1)
print(nums)',
'O(n log n)', 'O(log n)',
'Efficient divide-and-conquer sorting with in-place partition.',
'{"approach":"In-place two-pointer partitioning around pivot element.","breakdown":[{"label":"recursion depth","detail":"average partition split","cost":"O(log n)"},{"label":"partition scan","detail":"linear two-pointer scan","cost":"O(n)"}],"cases":{"best":"O(n log n)","average":"O(n log n)","worst":"O(n^2)"},"bottlenecks":["unbalanced partition on sorted arrays"],"optimizations":["randomized or median-of-three pivot"],"notes":""}',
'detailed', 'gemini', 1),

(7, 2, 'Constant-Time Hash Set Membership', 'typescript',
'function hasItem(set: Set<string>, key: string): boolean {
  return set.has(key);
}

const lookup = new Set(["apple", "banana", "cherry"]);
console.log(hasItem(lookup, "banana"));
console.log(hasItem(lookup, "dragonfruit"));
console.log(hasItem(lookup, "elderberry"));
console.log(hasItem(lookup, "fig"));
console.log(hasItem(lookup, "grape"));
console.log(hasItem(lookup, "honeydew"));',
'O(1)', 'O(1)',
'Direct hash bucket lookup delivers constant time guarantees.',
'{"approach":"Direct hash calculation and bucket pointer dereference.","breakdown":[{"label":"set.has","detail":"computes hash code and probes bucket","cost":"O(1)"}],"cases":{"best":"O(1)","average":"O(1)","worst":"O(n)"},"bottlenecks":["hash collision handling"],"optimizations":["well-distributed hash function"],"notes":""}',
'detailed', 'gemini', 1),

(8, 3, 'Matrix Multiplication (Naive)', 'cpp',
'#include <vector>
#include <iostream>

using namespace std;

vector<vector<int>> multiply(const vector<vector<int>>& A, const vector<vector<int>>& B, int n) {
    vector<vector<int>> C(n, vector<int>(n, 0));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            for (int k = 0; k < n; ++k) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
}

int main() {
    int n = 2;
    vector<vector<int>> A = {{1, 2}, {3, 4}};
    vector<vector<int>> B = {{5, 6}, {7, 8}};
    auto C = multiply(A, B, n);
    cout << C[0][0] << endl;
    return 0;
}',
'O(n^3)', 'O(1)',
'Triple nested loops calculating dot products across row-column pairs.',
'{"approach":"Standard cubic matrix multiplication algorithm.","breakdown":[{"label":"triple nested loops","detail":"iterates i, j, k over dimension n","cost":"O(n^3)"}],"cases":{"best":"O(n^3)","average":"O(n^3)","worst":"O(n^3)"},"bottlenecks":["cubic arithmetic operations"],"optimizations":["Strassen algorithm or tiled memory access"],"notes":""}',
'detailed', 'gemini', 1),

(9, 4, 'Linear Scan Unsorted Search', 'javascript',
'function findTarget(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

// Sample test
const items = [4, 9, 2, 7, 1, 8];
console.log(findTarget(items, 7));
console.log(findTarget(items, 99));',
'O(n)', 'O(1)',
'Single sequential pass over unsorted elements.',
'{"approach":"Sequential comparison until target element is located.","breakdown":[{"label":"for loop","detail":"traverses up to n elements","cost":"O(n)"}],"cases":{"best":"O(1)","average":"O(n)","worst":"O(n)"},"bottlenecks":["linear scan on large collections"],"optimizations":["sort array and use binary search"],"notes":""}',
'detailed', 'gemini', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  time_complexity = VALUES(time_complexity),
  space_complexity = VALUES(space_complexity),
  summary = VALUES(summary);

-- ---------------------------------------------------------------------
-- Synchronize Historical Analysis Counts (Table 8.1 in Project Report)
-- ---------------------------------------------------------------------
UPDATE users SET analysis_count = 12 WHERE id = 1;
UPDATE users SET analysis_count = 28 WHERE id = 2;
UPDATE users SET analysis_count = 19 WHERE id = 3;
UPDATE users SET analysis_count = 15 WHERE id = 4;
UPDATE users SET analysis_count = 22 WHERE id = 5;

-- ---------------------------------------------------------------------
-- Bookmarks (user_saved_topics — satisfies Queries 5, 7, 8 and Views)
-- ---------------------------------------------------------------------
INSERT INTO user_saved_topics (id, user_id, topic_id, note) VALUES
(1, 1, 3, 'Core reference for logarithmic divide-and-conquer bounds.'),
(2, 2, 5, 'Review sorting invariants and recurrence relations before technical interviews.'),
(3, 2, 12, 'Sliding window optimization pattern for linear subarray passes.'),
(4, 3, 7, 'Exponential recursion tree and dynamic programming memoization transitions.'),
(5, 4, 11, 'Hash map bucket collisions and amortized constant-time lookup guarantees.'),
(6, 5, 14, 'Adjacency list traversal complexity and topological sorting prerequisites.'),
(7, 7, 3, 'Revise before interviews'),
(8, 7, 5, 'Sorting is everywhere'),
(9, 7, 12, 'Window trick is neat')
ON DUPLICATE KEY UPDATE note = VALUES(note);
