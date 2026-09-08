/*
 * Problem 4: calculate the sum from 1 to n.
 *
 * For positive n, the expected result is:
 *   1 + 2 + 3 + ... + n
 *
 * Negative integers are converted to their positive equivalents before the
 * calculation. For example, -5 becomes 5 and produces 15.
 * Non-integer values are rejected.
 */

function normalizeInput(n) {
  // Number.isInteger rejects strings, decimal numbers, NaN, and Infinity.
  if (!Number.isInteger(n)) {
    console.log(n, "is not an integer");
    return false;
  }

  // Convert a negative integer to its positive equivalent.
  return Math.abs(n);
}

// Solution A: iterative approach using a loop.
// Time complexity: O(|n|), because the loop visits each value up to n.
// Space complexity: O(1), because only the running total is stored.
function sum_to_n_a(n) {
  const normalizedN = normalizeInput(n);
  if (normalizedN === false) {
    return false;
  }
  n = normalizedN;

  let total = 0;

  // Add every integer from 1 through n.
  for (let current = 1; current <= n; current += 1) {
    total += current;
  }

  return total;
}

// Solution B: recursive approach.
// Time complexity: O(n), because the function is called once per value.
// Space complexity: O(n), because every recursive call uses the call stack.
function sum_to_n_b(n) {
  const normalizedN = normalizeInput(n);
  if (normalizedN === false) {
    return false;
  }
  n = normalizedN;

  // Base case: the sum up to zero is zero. Without this condition, the
  // recursive calls would never stop.
  if (n === 0) {
    return 0;
  }

  // Reduce n until it reaches zero, then add the values while returning.
  return n + sum_to_n_b(n - 1);
}

// Solution C: arithmetic-series formula.
// Time complexity: O(1), because it performs a fixed number of operations.
// Space complexity: O(1), because it uses only a few variables.
function sum_to_n_c(n) {
  const normalizedN = normalizeInput(n);
  if (normalizedN === false) {
    return false;
  }
  n = normalizedN;

  // The arithmetic-series formula is n * (n + 1) / 2.
  // Divide the even factor first to reduce the intermediate result.
  if (n % 2 === 0) {
    return (n / 2) * (n + 1);
  }

  // If n is odd, n + 1 is even, so divide n + 1 by 2 first.
  const total = n * ((n + 1) / 2);

  // Multiplying -1 by 0 produces JavaScript's -0. Return regular 0 instead.
  return total === 0 ? 0 : total;
}

// Example calls for Solution A.
console.log(sum_to_n_a(5));
console.log(sum_to_n_a(-5));
console.log(sum_to_n_a("test"));

// Example calls for Solution B.
console.log(sum_to_n_b(5));
console.log(sum_to_n_b(-5));
console.log(sum_to_n_b("test"));

// Example calls for Solution C.
console.log(sum_to_n_c(5));
console.log(sum_to_n_c(-5));
console.log(sum_to_n_c("test"));
