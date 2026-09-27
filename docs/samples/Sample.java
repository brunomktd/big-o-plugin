import java.util.*;
import java.util.stream.*;

// Each method is preceded by `// @bigO <expected>`; server/test/samples.test.ts checks them.
public class Sample {

    // @bigO O(1)
    public int first(int[] a) {
        return Math.max(a[0], 0);
    }

    // @bigO O(n)
    public int sum(int[] a) {
        int total = 0;
        for (int v : a) total += v;
        return total;
    }

    // @bigO O(n²)
    public boolean hasDuplicate(List<Integer> items) {
        for (int i = 0; i < items.size(); i++) {
            if (items.subList(i + 1, items.size()).contains(items.get(i))) return true;
        }
        return false;
    }

    // @bigO O(n)
    public boolean hasDuplicateFast(List<Integer> items) {
        Set<Integer> seenSet = new HashSet<>();
        for (Integer item : items) {
            if (!seenSet.add(item)) return true;
        }
        return false;
    }

    // @bigO O(n log n)
    public List<Integer> sorted(List<Integer> items) {
        List<Integer> copy = new ArrayList<>(items);
        Collections.sort(copy);
        return copy;
    }

    // @bigO O(n)
    public List<Integer> evensDoubled(List<Integer> items) {
        return items.stream().filter(x -> x % 2 == 0).map(x -> x * 2).collect(Collectors.toList());
    }

    // @bigO O(log n)
    public int countHalvings(int n) {
        int steps = 0;
        while (n > 1) {
            n /= 2;
            steps++;
        }
        return steps;
    }

    // @bigO O(log n)
    public int search(int[] a, int x, int lo, int hi) {
        if (lo > hi) return -1;
        int mid = (lo + hi) / 2;
        if (a[mid] == x) return mid;
        return a[mid] < x ? search(a, x, mid + 1, hi) : search(a, x, lo, mid - 1);
    }

    // @bigO O(2ⁿ)
    public long fib(int n) {
        if (n < 2) return n;
        return fib(n - 1) + fib(n - 2);
    }

    // @bigO O(n)
    public long factorial(int n) {
        return n <= 1 ? 1 : n * factorial(n - 1);
    }

    // @bigO O(n²)
    public int[][] pairs(int[] a) {
        int[][] out = new int[a.length * a.length][];
        int k = 0;
        for (int i = 0; i < a.length; i++)
            for (int j = 0; j < a.length; j++) out[k++] = new int[] {a[i], a[j]};
        return out;
    }
}
