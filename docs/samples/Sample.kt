// Each function is preceded by `// @bigO <expected>`; server/test/samples.test.ts checks them.
class Sample {

    // @bigO O(1)
    fun first(items: List<Int>): Int = items[0] + maxOf(1, 2)

    // @bigO O(n)
    fun total(items: List<Int>): Int {
        var total = 0
        for (item in items) total += item
        return total
    }

    // @bigO O(1)
    fun fixed(): Int {
        var x = 0
        for (i in 1..10) x += i
        return x
    }

    // @bigO O(n²)
    fun hasDuplicate(items: List<Int>): Boolean {
        for (i in items.indices) {
            for (j in i + 1 until items.size) {
                if (items[i] == items[j]) return true
            }
        }
        return false
    }

    // @bigO O(n²)
    fun commonSlow(a: List<Int>, b: List<Int>): List<Int> = a.filter { b.contains(it) }

    // @bigO O(n)
    fun commonFast(a: List<Int>, b: List<Int>): List<Int> {
        val bSet = b.toSet()
        return a.filter { bSet.contains(it) }
    }

    // @bigO O(n log n)
    fun byName(people: List<String>): List<String> = people.sortedBy { it.lowercase() }

    // @bigO O(n²)
    fun grid(n: Int) {
        repeat(n) { i ->
            repeat(n) { j -> println(i * j) }
        }
    }

    // @bigO O(log n)
    fun digits(value: Int): Int {
        var x = value
        var count = 0
        while (x > 0) {
            x /= 10
            count++
        }
        return count
    }

    // @bigO O(2ⁿ)
    fun fib(n: Int): Long = if (n < 2) n.toLong() else fib(n - 1) + fib(n - 2)

    // @bigO O(n)
    fun countDown(n: Int) {
        if (n == 0) return
        println(n)
        countDown(n - 1)
    }
}
