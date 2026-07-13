import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import {
  Play, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  Camera, CameraOff, AlertTriangle, Terminal, Loader2, Send
} from 'lucide-react';

// ─── Problem bank ─────────────────────────────────────────────────────────────

interface TestCase { input: string; expected: string; hidden?: boolean; }
interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  testCases: TestCase[];
  starterCode: { javascript: string; python: string; java: string; cpp: string; };
}

const PROBLEM_BANK: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists.'],
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0,1]' },
      { input: '[3,2,4]\n6', expected: '[1,2]' },
      { input: '[3,3]\n6', expected: '[0,1]', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // your code here
}

// --- driver (do not remove) ---
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));`,
      python: `import sys, json

def two_sum(nums, target):
    # your code here
    pass

lines = sys.stdin.read().strip().split('\\n')
nums = json.loads(lines[0])
target = int(lines[1])
print(json.dumps(two_sum(nums, target)))`,
      java: `import java.util.*;
public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // your code here
        return new int[]{};
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // parse input manually
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    // your code here
    return {};
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 2,
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Strings',
    description: `A phrase is a **palindrome** if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 2×10⁵', 's consists only of printable ASCII characters.'],
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expected: 'true' },
      { input: 'race a car', expected: 'false' },
      { input: ' ', expected: 'true', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // your code here
}

const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
console.log(isPalindrome(s).toString());`,
      python: `import sys
def is_palindrome(s):
    # your code here
    pass

s = sys.stdin.read().strip()
print(str(is_palindrome(s)).lower())`,
      java: `import java.util.*;
public class Main {
    public static boolean isPalindrome(String s) {
        // your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(isPalindrome(sc.nextLine()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isPalindrome(string s) {
    // your code here
    return false;
}
int main() {
    string s; getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false") << endl;
}`,
    },
  },
  {
    id: 3,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description: `Given an integer array \`nums\`, find the **subarray** with the largest sum and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6' },
      { input: '[1]', expected: '1' },
      { input: '[5,4,-1,7,8]', expected: '23', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // your code here
}

const nums = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(maxSubArray(nums));`,
      python: `import sys, json
def max_sub_array(nums):
    # your code here
    pass

nums = json.loads(sys.stdin.read().strip())
print(max_sub_array(nums))`,
      java: `import java.util.*;
public class Main {
    public static int maxSubArray(int[] nums) {
        // your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int maxSubArray(vector<int>& nums) {
    // your code here
    return 0;
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 4,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is **valid**.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only.'],
    testCases: [
      { input: '()', expected: 'true' },
      { input: '()[]{}"', expected: 'true' },
      { input: '(]', expected: 'false' },
      { input: '{[]}', expected: 'true', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // your code here
}

const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
console.log(isValid(s).toString());`,
      python: `import sys
def is_valid(s):
    # your code here
    pass

s = sys.stdin.read().strip()
print(str(is_valid(s)).lower())`,
      java: `import java.util.*;
public class Main {
    public static boolean isValid(String s) {
        // your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(isValid(sc.nextLine()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isValid(string s) {
    // your code here
    return false;
}
int main() {
    string s; getline(cin, s);
    cout << (isValid(s) ? "true" : "false") << endl;
}`,
    },
  },
  {
    id: 5,
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'Binary Search',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its **index**. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums at index 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums.' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁴', 'All integers in nums are unique.', 'nums is sorted in ascending order.'],
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expected: '4' },
      { input: '[-1,0,3,5,9,12]\n2', expected: '-1' },
      { input: '[5]\n5', expected: '0', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // your code here — must be O(log n)
}

const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(search(nums, target));`,
      python: `import sys, json
def search(nums, target):
    # your code here — must be O(log n)
    pass

lines = sys.stdin.read().strip().split('\\n')
nums = json.loads(lines[0])
target = int(lines[1])
print(search(nums, target))`,
      java: `import java.util.*;
public class Main {
    public static int search(int[] nums, int target) {
        // your code here
        return -1;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int search(vector<int>& nums, int target) {
    // your code here
    return -1;
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 6,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    description: `Given the head of a singly linked list represented as a space-separated sequence of integers, reverse the list and return the reversed sequence.

For this problem, the input is a list of numbers and output is the reversed list.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    constraints: ['0 ≤ length ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    testCases: [
      { input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]' },
      { input: '[1,2]', expected: '[2,1]' },
      { input: '[1]', expected: '[1]', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} list
 * @return {number[]}
 */
function reverseList(list) {
  // your code here
}

const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(JSON.stringify(reverseList(list)));`,
      python: `import sys, json
def reverse_list(lst):
    # your code here
    pass

lst = json.loads(sys.stdin.read().strip())
print(json.dumps(reverse_list(lst)))`,
      java: `import java.util.*;
public class Main {
    public static int[] reverseList(int[] list) {
        // your code here
        return list;
    }
    public static void main(String[] args) {
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    // your code here
}`,
    },
  },
  {
    id: 7,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb **1** or **2** steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2.' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1.' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    testCases: [
      { input: '2', expected: '2' },
      { input: '3', expected: '3' },
      { input: '10', expected: '89', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  // your code here
}

const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(climbStairs(n));`,
      python: `import sys
def climb_stairs(n):
    # your code here
    pass

n = int(sys.stdin.read().strip())
print(climb_stairs(n))`,
      java: `import java.util.*;
public class Main {
    public static int climbStairs(int n) {
        // your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(climbStairs(sc.nextInt()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int climbStairs(int n) {
    // your code here
    return 0;
}
int main() {
    int n; cin >> n;
    cout << climbStairs(n) << endl;
}`,
    },
  },
  {
    id: 8,
    title: 'Merge Two Sorted Arrays',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `Given two sorted integer arrays, merge them into a single sorted array and return it.`,
    examples: [
      { input: 'nums1 = [1,3,5], nums2 = [2,4,6]', output: '[1,2,3,4,5,6]' },
      { input: 'nums1 = [1], nums2 = []', output: '[1]' },
    ],
    constraints: ['0 ≤ nums1.length, nums2.length ≤ 10³', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    testCases: [
      { input: '[1,3,5]\n[2,4,6]', expected: '[1,2,3,4,5,6]' },
      { input: '[1]\n[]', expected: '[1]' },
      { input: '[]\n[1]', expected: '[1]', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */
function mergeSorted(nums1, nums2) {
  // your code here
}

const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums1 = JSON.parse(lines[0]);
const nums2 = JSON.parse(lines[1]);
console.log(JSON.stringify(mergeSorted(nums1, nums2)));`,
      python: `import sys, json
def merge_sorted(a, b):
    # your code here
    pass

lines = sys.stdin.read().strip().split('\\n')
a = json.loads(lines[0])
b = json.loads(lines[1])
print(json.dumps(merge_sorted(a, b)))`,
      java: `import java.util.*;
public class Main {
    public static int[] merge(int[] a, int[] b) {
        // your code here
        return new int[]{};
    }
    public static void main(String[] args) {
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    // your code here
}`,
    },
  },
  {
    id: 9,
    title: 'First Non-Repeating Character',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Given a string \`s\`, find the first non-repeating character and return its **index**. If it does not exist, return \`-1\`.`,
    examples: [
      { input: 's = "leetcode"', output: '0', explanation: '"l" appears only once.' },
      { input: 's = "aabb"', output: '-1' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁵', 's consists of only lowercase English letters.'],
    testCases: [
      { input: 'leetcode', expected: '0' },
      { input: 'aabb', expected: '-1' },
      { input: 'loveleetcode', expected: '2', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function firstUniqChar(s) {
  // your code here
}

const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
console.log(firstUniqChar(s));`,
      python: `import sys
def first_uniq_char(s):
    # your code here
    pass

s = sys.stdin.read().strip()
print(first_uniq_char(s))`,
      java: `import java.util.*;
public class Main {
    public static int firstUniqChar(String s) {
        // your code here
        return -1;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(firstUniqChar(sc.nextLine()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int firstUniqChar(string s) {
    // your code here
    return -1;
}
int main() {
    string s; getline(cin, s);
    cout << firstUniqChar(s) << endl;
}`,
    },
  },
  {
    id: 10,
    title: 'Count Primes',
    difficulty: 'Medium',
    category: 'Math',
    description: `Given an integer \`n\`, return the number of prime numbers that are **strictly less than** \`n\`.`,
    examples: [
      { input: 'n = 10', output: '4', explanation: 'Primes less than 10: 2, 3, 5, 7.' },
      { input: 'n = 0', output: '0' },
    ],
    constraints: ['0 ≤ n ≤ 5×10⁶'],
    testCases: [
      { input: '10', expected: '4' },
      { input: '0', expected: '0' },
      { input: '100', expected: '25', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function countPrimes(n) {
  // your code here (Sieve of Eratosthenes recommended)
}

const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(countPrimes(n));`,
      python: `import sys
def count_primes(n):
    # your code here
    pass

n = int(sys.stdin.read().strip())
print(count_primes(n))`,
      java: `import java.util.*;
public class Main {
    public static int countPrimes(int n) {
        // your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(countPrimes(sc.nextInt()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
int countPrimes(int n) {
    // your code here
    return 0;
}
int main() {
    int n; cin >> n;
    cout << countPrimes(n) << endl;
}`,
    },
  },
  {
    id: 11,
    title: 'Longest Common Prefix',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string \`""\`.`,
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""' },
    ],
    constraints: ['1 ≤ strs.length ≤ 200', '0 ≤ strs[i].length ≤ 200'],
    testCases: [
      { input: '["flower","flow","flight"]', expected: 'fl' },
      { input: '["dog","racecar","car"]', expected: '' },
      { input: '["interview","internet","internal"]', expected: 'inter', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string[]} strs
 * @return {string}
 */
function longestCommonPrefix(strs) {
  // your code here
}

const strs = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(longestCommonPrefix(strs));`,
      python: `import sys, json
def longest_common_prefix(strs):
    # your code here
    pass

strs = json.loads(sys.stdin.read().strip())
print(longest_common_prefix(strs))`,
      java: `import java.util.*;
public class Main {
    public static String longestCommonPrefix(String[] strs) {
        // your code here
        return "";
    }
    public static void main(String[] args) {
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
string longestCommonPrefix(vector<string>& strs) {
    // your code here
    return "";
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 12,
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

You must solve it in **O(n)** time and **without using the division operator**.`,
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁵', '-30 ≤ nums[i] ≤ 30'],
    testCases: [
      { input: '[1,2,3,4]', expected: '[24,12,8,6]' },
      { input: '[2,3]', expected: '[3,2]' },
      { input: '[1,2,3,4,5]', expected: '[120,60,40,30,24]', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {
  // your code here — O(n), no division
}

const nums = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(JSON.stringify(productExceptSelf(nums)));`,
      python: `import sys, json
def product_except_self(nums):
    # your code here — O(n), no division
    pass

nums = json.loads(sys.stdin.read().strip())
print(json.dumps(product_except_self(nums)))`,
      java: `import java.util.*;
public class Main {
    public static int[] productExceptSelf(int[] nums) {
        // your code here
        return new int[]{};
    }
    public static void main(String[] args) {
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> productExceptSelf(vector<int>& nums) {
    // your code here
    return {};
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 13,
    title: 'Balanced Brackets',
    difficulty: 'Easy',
    category: 'Stack',
    description: `Given a string containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if every open bracket has a matching close bracket in the correct order.`,
    examples: [
      { input: 's = "{[()]}"', output: 'true' },
      { input: 's = "{[(])}"', output: 'false' },
    ],
    constraints: ['0 ≤ s.length ≤ 10⁴'],
    testCases: [
      { input: '{[()]}', expected: 'true' },
      { input: '{[(])}', expected: 'false' },
      { input: '', expected: 'true', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isBalanced(s) {
  // your code here
}

const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
console.log(isBalanced(s).toString());`,
      python: `import sys
def is_balanced(s):
    # your code here
    pass

s = sys.stdin.read().strip()
print(str(is_balanced(s)).lower())`,
      java: `import java.util.*;
public class Main {
    public static boolean isBalanced(String s) {
        // your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(isBalanced(sc.nextLine()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isBalanced(string s) {
    // your code here
    return false;
}
int main() {
    string s; getline(cin, s);
    cout << (isBalanced(s) ? "true" : "false") << endl;
}`,
    },
  },
  {
    id: 14,
    title: 'Find Duplicates in Array',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `Given an integer array \`nums\` of length \`n\` where each element is between 1 and n inclusive, return all the integers that appear **more than once**.

Return the duplicates in sorted order.`,
    examples: [
      { input: 'nums = [4,3,2,7,8,2,3,1]', output: '[2,3]' },
      { input: 'nums = [1,1,2]', output: '[1]' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '1 ≤ nums[i] ≤ nums.length'],
    testCases: [
      { input: '[4,3,2,7,8,2,3,1]', expected: '[2,3]' },
      { input: '[1,1,2]', expected: '[1]' },
      { input: '[1,2,3]', expected: '[]', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function findDuplicates(nums) {
  // your code here
}

const nums = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8').trim());
console.log(JSON.stringify(findDuplicates(nums)));`,
      python: `import sys, json
def find_duplicates(nums):
    # your code here
    pass

nums = json.loads(sys.stdin.read().strip())
print(json.dumps(find_duplicates(nums)))`,
      java: `import java.util.*;
public class Main {
    public static List<Integer> findDuplicates(int[] nums) {
        // your code here
        return new ArrayList<>();
    }
    public static void main(String[] args) {
        // parse input
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
vector<int> findDuplicates(vector<int>& nums) {
    // your code here
    return {};
}
int main() {
    // parse input
}`,
    },
  },
  {
    id: 15,
    title: 'Anagram Check',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An anagram is a word formed by rearranging the letters of another word.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length, t.length ≤ 5×10⁴', 's and t consist of lowercase English letters.'],
    testCases: [
      { input: 'anagram\nnagaram', expected: 'true' },
      { input: 'rat\ncar', expected: 'false' },
      { input: 'listen\nsilent', expected: 'true', hidden: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  // your code here
}

const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
console.log(isAnagram(lines[0], lines[1]).toString());`,
      python: `import sys
def is_anagram(s, t):
    # your code here
    pass

lines = sys.stdin.read().strip().split('\\n')
print(str(is_anagram(lines[0], lines[1])).lower())`,
      java: `import java.util.*;
public class Main {
    public static boolean isAnagram(String s, String t) {
        // your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(isAnagram(sc.nextLine(), sc.nextLine()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
bool isAnagram(string s, string t) {
    // your code here
    return false;
}
int main() {
    string s, t;
    getline(cin, s); getline(cin, t);
    cout << (isAnagram(s, t) ? "true" : "false") << endl;
}`,
    },
  },
];

// Pick 3 problems deterministically based on interviewId hash
function pickProblems(interviewId: string): Problem[] {
  let hash = 0;
  for (let i = 0; i < interviewId.length; i++) {
    hash = (hash * 31 + interviewId.charCodeAt(i)) >>> 0;
  }
  const start = hash % PROBLEM_BANK.length;
  const result: Problem[] = [];
  for (let i = 0; i < Math.min(3, PROBLEM_BANK.length); i++) {
    result.push(PROBLEM_BANK[(start + i) % PROBLEM_BANK.length]);
  }
  return result;
}

// ─── Language config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { label: 'JavaScript', pistonId: 'javascript', monaco: 'javascript' },
  { label: 'Python 3',   pistonId: 'python',     monaco: 'python' },
  { label: 'Java',       pistonId: 'java',        monaco: 'java' },
  { label: 'C++',        pistonId: 'cpp',         monaco: 'cpp' },
];

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Hard:   'text-red-400 bg-red-500/10 border-red-500/20',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  interviewId: string;
  onComplete: () => void;
  timeLimitSeconds?: number;
}

export const TechnicalAssessment = ({ interviewId, onComplete, timeLimitSeconds = 5400 }: Props) => {
  const problems = pickProblems(interviewId);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [selectedLang, setSelectedLang] = useState(0); // index into LANGUAGES
  const [codes, setCodes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    problems.forEach(p => { init[p.id] = p.starterCode.javascript; });
    return init;
  });

  // Timer
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Test execution state per problem
  const [runResults, setRunResults] = useState<Record<number, { passing: number; total: number; cases: Array<{ input: string; expected: string; actual: string; passed: boolean; hidden?: boolean }> } | null>>({});
  const [running, setRunning] = useState<number | null>(null);

  // Proctoring
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [tabViolations, setTabViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Overall score across problems
  const totalPassing = Object.values(runResults).reduce((sum, r) => sum + (r?.passing ?? 0), 0);
  const totalCases = problems.reduce((sum, p) => sum + p.testCases.length, 0);

  // ── Camera init ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraAllowed(true);
      })
      .catch(() => {
        if (!cancelled) setCameraAllowed(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(snapshotTimerRef.current!);
    };
  }, []);

  // ── Snapshot every 30s (fire-and-forget) ──────────────────────────────────
  useEffect(() => {
    if (!cameraAllowed) return;
    snapshotTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      canvas.width = 160;
      canvas.height = 120;
      canvas.getContext('2d')?.drawImage(video, 0, 0, 160, 120);
      // snapshot captured — extend here to POST to server if needed
    }, 30000);
    return () => clearInterval(snapshotTimerRef.current!);
  }, [cameraAllowed]);

  // ── Tab-switch detection ───────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !submitted) {
        setTabViolations(v => v + 1);
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 4000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [submitted]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [submitted]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ── Code change ────────────────────────────────────────────────────────────
  const handleCodeChange = useCallback((value: string | undefined) => {
    const prob = problems[currentProblem];
    setCodes(prev => ({ ...prev, [prob.id]: value ?? '' }));
  }, [currentProblem, problems]);

  // ── Language change resets code to starter ────────────────────────────────
  const handleLangChange = (langIdx: number) => {
    setSelectedLang(langIdx);
    const lang = LANGUAGES[langIdx].pistonId as keyof Problem['starterCode'];
    const prob = problems[currentProblem];
    if (prob.starterCode[lang]) {
      setCodes(prev => ({ ...prev, [prob.id]: prob.starterCode[lang] }));
    }
  };

  // ── Run against test cases ─────────────────────────────────────────────────
  const handleRun = async () => {
    const prob = problems[currentProblem];
    const code = codes[prob.id] || '';
    const lang = LANGUAGES[selectedLang];
    setRunning(prob.id);

    try {
      const results = await Promise.all(
        prob.testCases.map(async (tc) => {
          try {
            const res = await api.post('/interviews/execute', {
              script: code,
              language: lang.pistonId,
              stdin: tc.input,
              interviewId,
            });
            const actual = (res.data?.data?.output ?? '').trim();
            const expected = tc.expected.trim();
            return {
              input: tc.input,
              expected,
              actual,
              passed: actual === expected,
              hidden: tc.hidden,
            };
          } catch {
            return { input: tc.input, expected: tc.expected, actual: 'Error', passed: false, hidden: tc.hidden };
          }
        })
      );
      const passing = results.filter(r => r.passed).length;
      setRunResults(prev => ({ ...prev, [prob.id]: { passing, total: results.length, cases: results } }));
    } catch {
      toast.error('Failed to run code — please try again');
    } finally {
      setRunning(null);
    }
  };

  // ── Submit all ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (auto = false) => {
    if (!auto) {
      const unanswered = problems.filter(p => !runResults[p.id]);
      if (unanswered.length > 0) {
        if (!window.confirm(`You haven't run all problems yet. Submit anyway?`)) return;
      }
    }
    clearInterval(timerRef.current!);
    setSubmitting(true);
    try {
      // Normalize score: (passing visible test cases / total) * 20
      const score = Math.round((totalPassing / Math.max(totalCases, 1)) * 20);
      await api.post(`/interviews/${interviewId}/aptitude-result`, {
        score,
        total: 20,
        tab_violations: tabViolations,
      });
      setSubmitted(true);
      onComplete();
    } catch {
      toast.error('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  }, [totalPassing, totalCases, tabViolations, interviewId, onComplete, problems, runResults]);

  // ── Submitted screen ────────────────────────────────────────────────────────
  if (submitted) {
    const pct = Math.round((totalPassing / Math.max(totalCases, 1)) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d0f1a] p-8">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${pct >= 60 ? 'bg-emerald-900/40' : 'bg-emerald-900/40'}`}>
          {pct >= 60
            ? <CheckCircle2 size={44} className="text-emerald-400" />
            : <XCircle size={44} className="text-emerald-400" />}
        </div>
        <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>{pct}%</h2>
        <p className={`text-lg font-bold mb-2 ${pct >= 60 ? 'text-emerald-400' : 'text-emerald-400'}`}>
          {pct >= 60 ? 'Assessment Complete — Great Work!' : 'Assessment Submitted'}
        </p>
        <p className="text-stone-400 font-medium text-sm">
          {totalPassing} of {totalCases} test cases passed across {problems.length} problems.
        </p>
        {tabViolations > 0 && (
          <p className="text-amber-400 text-xs font-medium mt-2">{tabViolations} tab-switch violation{tabViolations > 1 ? 's' : ''} recorded.</p>
        )}
        <p className="text-stone-600 text-xs mt-4">Results submitted to your recruiter.</p>
      </div>
    );
  }

  const prob = problems[currentProblem];
  const probResult = runResults[prob.id];
  const timeWarning = timeLeft <= 300;

  return (
    <div className="flex flex-col h-full bg-[#0d0f1a] text-stone-200 font-sans">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1d2e] border-b border-[#252840] shrink-0 gap-3">
        {/* Problem tabs */}
        <div className="flex items-center gap-1">
          {problems.map((p, idx) => {
            const r = runResults[p.id];
            return (
              <button
                key={p.id}
                onClick={() => setCurrentProblem(idx)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  currentProblem === idx
                    ? 'bg-[#252840] text-white'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-[#1e2132]'
                }`}
              >
                {idx + 1}. {p.title.split(' ')[0]}
                {r && (
                  <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${r.passing === r.total ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Timer + proctoring */}
        <div className="flex items-center gap-3 shrink-0">
          {showViolationWarning && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 border border-amber-700 px-2 py-1 rounded-lg animate-pulse">
              Tab switch detected! ({tabViolations})
            </span>
          )}
          {tabViolations > 0 && !showViolationWarning && (
            <span className="text-[10px] text-amber-500 font-semibold">{tabViolations} violation{tabViolations > 1 ? 's' : ''}</span>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm ${
            timeWarning ? 'bg-red-900/30 text-red-400 border border-red-700 animate-pulse' : 'bg-[#252840] text-stone-300'
          }`}>
            <Clock size={13} />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-[11px] rounded-lg transition-colors"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Submit All
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: problem statement (40%) ── */}
        <div className="w-[42%] shrink-0 flex flex-col border-r border-[#252840] overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title + diff */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="text-base font-black text-white" style={{ fontFamily: 'Plus Jakarta Sans' }}>{prob.title}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${DIFF_COLOR[prob.difficulty]}`}>{prob.difficulty}</span>
                <span className="text-[10px] font-semibold text-stone-500 bg-[#252840] px-2 py-0.5 rounded">{prob.category}</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">{prob.title} — Problem {currentProblem + 1} of {problems.length}</p>
            </div>

            {/* Description (render markdown-ish bold/code) */}
            <div className="text-[13px] text-stone-300 leading-relaxed whitespace-pre-line">
              {prob.description.split(/(`[^`]+`)|\*\*([^*]+)\*\*/g).map((part, i) => {
                if (!part) return null;
                if (part.startsWith('`') && part.endsWith('`')) {
                  return <code key={i} className="text-emerald-400 bg-[#1a2e1f] px-1 py-0.5 rounded text-[12px] font-mono">{part.slice(1, -1)}</code>;
                }
                return <span key={i}>{part}</span>;
              })}
            </div>

            {/* Examples */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Examples</h4>
              {prob.examples.map((ex, i) => (
                <div key={i} className="bg-[#1a1d2e] rounded-xl p-4 border border-[#252840] space-y-2 font-mono text-[12px]">
                  <div><span className="text-stone-500 font-semibold">Input: </span><span className="text-stone-300">{ex.input}</span></div>
                  <div><span className="text-stone-500 font-semibold">Output: </span><span className="text-emerald-400">{ex.output}</span></div>
                  {ex.explanation && <div className="text-stone-500 text-[11px] pt-1">{ex.explanation}</div>}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Constraints</h4>
              <ul className="space-y-1">
                {prob.constraints.map((c, i) => (
                  <li key={i} className="text-[12px] text-stone-400 flex items-start gap-2">
                    <span className="text-stone-600 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Test case results */}
            {probResult && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={11} />
                  Test Results — {probResult.passing}/{probResult.total} passed
                </h4>
                {probResult.cases.map((tc, i) => (
                  <div key={i} className={`rounded-lg p-3 border text-[11px] font-mono ${tc.passed ? 'bg-emerald-900/20 border-emerald-800' : 'bg-red-900/20 border-red-900'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {tc.passed
                        ? <CheckCircle2 size={12} className="text-emerald-400" />
                        : <XCircle size={12} className="text-red-400" />}
                      <span className={`font-bold text-[10px] ${tc.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        Case {i + 1}{tc.hidden ? ' (hidden)' : ''}
                      </span>
                    </div>
                    {!tc.hidden && (
                      <>
                        <div className="text-stone-500">Input: <span className="text-stone-300">{tc.input.replace(/\n/g, ', ')}</span></div>
                        <div className="text-stone-500">Expected: <span className="text-emerald-400">{tc.expected}</span></div>
                        <div className="text-stone-500">Got: <span className={tc.passed ? 'text-emerald-400' : 'text-red-400'}>{tc.actual}</span></div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Problem navigation arrows */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#252840] shrink-0 mt-auto">
            <button
              onClick={() => setCurrentProblem(c => Math.max(0, c - 1))}
              disabled={currentProblem === 0}
              className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-200 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-[10px] text-stone-600 font-semibold">{currentProblem + 1} / {problems.length}</span>
            <button
              onClick={() => setCurrentProblem(c => Math.min(problems.length - 1, c + 1))}
              disabled={currentProblem === problems.length - 1}
              className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-200 disabled:opacity-30 transition-colors cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Right: editor + run (58%) ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#1a1d2e] border-b border-[#252840] shrink-0 gap-3">
            <div className="flex gap-1">
              {LANGUAGES.map((l, i) => (
                <button
                  key={l.pistonId}
                  onClick={() => handleLangChange(i)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    selectedLang === i ? 'bg-[#252840] text-white' : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Camera indicator */}
              {cameraAllowed === true && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <Camera size={11} />
                  Proctored
                </div>
              )}
              {cameraAllowed === false && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                  <CameraOff size={11} />
                  No Camera
                </div>
              )}

              <button
                onClick={handleRun}
                disabled={running !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252840] hover:bg-[#2e3150] disabled:opacity-60 text-emerald-400 font-bold text-[11px] rounded-lg transition-colors border border-[#353860] cursor-pointer"
              >
                {running === prob.id
                  ? <Loader2 size={12} className="animate-spin text-emerald-400" />
                  : <Play size={12} />}
                Run
              </button>
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={LANGUAGES[selectedLang].monaco}
              value={codes[prob.id] || ''}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                automaticLayout: true,
                padding: { top: 12 },
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
              }}
            />
          </div>

          {/* Camera preview (corner) + hidden canvas for snapshots */}
          <div className="shrink-0 relative">
            <canvas ref={canvasRef} className="hidden" />
            {cameraAllowed === true && (
              <div className="absolute bottom-2 right-2 w-28 h-20 rounded-lg overflow-hidden border border-[#353860] shadow-lg bg-[#0d0f1a] z-10">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[8px] text-emerald-400 font-bold">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  REC
                </div>
              </div>
            )}
          </div>

          {/* Violation banner */}
          {showViolationWarning && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-900/40 border-t border-amber-700 text-amber-300 text-xs font-bold shrink-0">
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              Tab switch detected — this violation has been recorded ({tabViolations} total).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
