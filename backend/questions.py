# insert_questions.py
from firebase_admin import credentials, firestore, initialize_app
import json

# Initialize Firebase Admin
cred = credentials.Certificate('leet_code_nitin.json')
initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Sample questions data
questions_data = [
    {
        "id" : "1",
        "title": "Two Sum",
        "description": """
            Given an array of integers `nums` and an integer `target`, return indices of the two numbers in the array such that they add up to the target.  
            You may assume that each input would have exactly one solution, and you may not use the same element twice.  
            You can return the answer in any order.

            ---

            ### Example
            **Input:**  
            `nums = [2,7,11,15]`, `target = 9`  

            **Output:**  
            `[0,1]`  

            **Explanation:**  
            Because `nums[0] + nums[1] == 9`, we return `[0, 1]`.

            ---

            ### Constraints
            1. `2 <= nums.length <= 10^4`
            2. `-10^9 <= nums[i] <= 10^9`
            3. `-10^9 <= target <= 10^9`
            4. Only one valid answer exists.
            """,

        "testCases": [
            {
                "input": {
                    "nums": [2, 7, 11, 15],
                    "target": 9
                },
                "output": [0, 1]
            },
            {
                "input": {
                    "nums": [3, 2, 4],
                    "target": 6
                },
                "output": [1, 2]
            },
            {
                "input": {
                    "nums": [3, 3],
                    "target": 6
                },
                "output": [0, 1]
            }
        ],
        "solution": """def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []"""
    },
    {
        "id" : "2",
        "title": "Valid Palindrome",
        "description": """
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.  
Alphanumeric characters include letters and numbers.  
Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

---

### Example
**Input:**  
`s = "A man, a plan, a canal: Panama"`

**Output:**  
`true`

**Explanation:**  
`"amanaplanacanalpanama"` is a palindrome.

---

### Constraints
1. `1 <= s.length <= 2 * 10^5`
2. `s` consists only of printable ASCII characters.
""",

        "testCases": [
            {
                "input": {
                    "s": "A man, a plan, a canal: Panama"
                },
                "output": True
            },
            {
                "input": {
                    "s": "race a car"
                },
                "output": False
            },
            {
                "input": {
                    "s": " "
                },
                "output": True
            }
        ],
        "solution": """def isPalindrome(s):
    # Convert to lowercase and remove non-alphanumeric characters
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    # Check if the string equals its reverse
    return cleaned == cleaned[::-1]"""
    },
    {
        "id" : "3",
        "title": "Maximum Subarray",
        "description": """ Given an integer array `nums`, find the subarray with the largest sum, and return its sum.

---

### Example
**Input:**  
`nums = [-2,1,-3,4,-1,2,1,-5,4]`

**Output:**  
`6`

**Explanation:**  
The subarray `[4,-1,2,1]` has the largest sum `6`.

---

### Constraints
1. `1 <= nums.length <= 10^5`
2. `-10^4 <= nums[i] <= 10^4`
""",

        "testCases": [
            {
                "input": {
                    "nums": [-2,1,-3,4,-1,2,1,-5,4]
                },
                "output": 6
            },
            {
                "input": {
                    "nums": [1]
                },
                "output": 1
            },
            {
                "input": {
                    "nums": [5,4,-1,7,8]
                },
                "output": 23
            }
        ],
        "solution": """def maxSubArray(nums):
    max_sum = current_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum"""
    },
    {
        "id" : "4",
        "title": "Merge Two Sorted Lists",
        "description": """
You are given the heads of two sorted linked lists `list1` and `list2`.  
Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.  
Return the head of the merged linked list.

---

### Example
**Input:**  
`list1 = [1,2,4]`, `list2 = [1,3,4]`

**Output:**  
`[1,1,2,3,4,4]`

---

### Constraints
1. The number of nodes in both lists is in the range `[0, 50]`.
2. `-100 <= Node.val <= 100`
3. Both `list1` and `list2` are sorted in non-decreasing order.
""",

        "testCases": [
            {
                "input": {
                    "list1": [1,2,4],
                    "list2": [1,3,4]
                },
                "output": [1,1,2,3,4,4]
            },
            {
                "input": {
                    "list1": [],
                    "list2": []
                },
                "output": []
            },
            {
                "input": {
                    "list1": [],
                    "list2": [0]
                },
                "output": [0]
            }
        ],
        "solution": """def mergeTwoLists(l1, l2):
    dummy = ListNode(0)
    current = dummy
    
    while l1 and l2:
        if l1.val <= l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next
    
    current.next = l1 if l1 else l2
    return dummy.next"""
    },
    {
        "id" : "5",
        "title": "Binary Tree Level Order Traversal",
        "description": """
Given the root of a binary tree, return the level order traversal of its nodes' values.  
(i.e., from left to right, level by level).

---

### Example
**Input:**  
`root = [3,9,20,null,null,15,7]`

**Output:**  
`[[3],[9,20],[15,7]]`

---

### Constraints
1. The number of nodes in the tree is in the range `[0, 2000]`.
2. `-1000 <= Node.val <= 1000`
""",
        "testCases": [
            {
                "input": json.dumps({"root": [3,9,20,None,None,15,7]}),
                "output": json.dumps([[3],[9,20],[15,7]])
            },
            {
                "input": json.dumps({"root": [1]}),
                "output": json.dumps([[1]])
            },
            {
                "input": json.dumps({"root": []}),
                "output": json.dumps([])
            }
        ],
        "solution": """def levelOrder(root):
    if not root:
        return []
    result = []
    queue = [root]
    
    while queue:
        level_size = len(queue)
        current_level = []
        
        for _ in range(level_size):
            node = queue.pop(0)
            current_level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        
        result.append(current_level)
    
    return result"""
    },
    {
        "id" : "6",
        "title": "Course Schedule",
        "description": """
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`.  
You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.

For example, the pair `[0, 1]` indicates that to take course `0`, you have to first take course `1`.  
Return `true` if you can finish all courses. Otherwise, return `false`.

---

### Example
**Input:**  
`numCourses = 2, prerequisites = [[1,0]]`

**Output:**  
`true`

**Explanation:**  
There are a total of 2 courses to take. To take course `1`, you should have finished course `0`. So it is possible.

---

### Constraints
1. `1 <= numCourses <= 2000`
2. `0 <= prerequisites.length <= 5000`
3. `prerequisites[i].length == 2`
4. `0 <= ai, bi < numCourses`
5. All the pairs `prerequisites[i]` are unique.
""",
        "testCases": [
            {
                "input": json.dumps({"numCourses": 2, "prerequisites": [[1, 0]]}),
                "output": True
            },
            {
                "input": json.dumps({"numCourses": 2, "prerequisites": [[1, 0], [0, 1]]}),
                "output": False
            },
            {
                "input": json.dumps({"numCourses": 5, "prerequisites": [[0, 1], [0, 2], [1, 3], [1, 4], [3, 4]]}),
                "output": True
            }
        ],
        "solution": """def canFinish(numCourses, prerequisites):
    # Create adjacency list
    graph = [[] for _ in range(numCourses)]
    for course, prereq in prerequisites:
        graph[course].append(prereq)
    
    # Create visited array, -1: being visited, 0: not visited, 1: visited
    visited = [0] * numCourses
    
    def hasCycle(course):
        if visited[course] == -1:  # Being visited -> cycle detected
            return True
        if visited[course] == 1:   # Already visited -> no cycle
            return False
            
        visited[course] = -1  # Mark as being visited
        
        # Check all prerequisites
        for prereq in graph[course]:
            if hasCycle(prereq):
                return True
                
        visited[course] = 1   # Mark as visited
        return False
    
    # Check for cycles starting from each course
    for course in range(numCourses):
        if visited[course] == 0:  # Not visited
            if hasCycle(course):
                return False
    
    return True"""
    },
    {
        "id" : "7",
        "title": "Longest Consecutive Sequence",
        "description": """
Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.  
You must write an algorithm that runs in `O(n)` time.

---

### Example
**Input:**  
`nums = [100,4,200,1,3,2]`

**Output:**  
`4`

**Explanation:**  
The longest consecutive elements sequence is `[1, 2, 3, 4]`. Therefore, its length is `4`.

---

### Constraints
1. `0 <= nums.length <= 10^5`
2. `-10^9 <= nums[i] <= 10^9`
""",

        "testCases": [
            {
                "input": {
                    "nums": [100,4,200,1,3,2]
                },
                "output": 4
            },
            {
                "input": {
                    "nums": [0,3,7,2,5,8,4,6,0,1]
                },
                "output": 9
            },
            {
                "input": {
                    "nums": []
                },
                "output": 0
            }
        ],
        "solution": """def longestConsecutive(nums):
    if not nums:
        return 0
        
    num_set = set(nums)
    longest = 0
    
    for num in num_set:
        if num - 1 not in num_set:  # Start of a sequence
            current_num = num
            current_streak = 1
            
            while current_num + 1 in num_set:
                current_num += 1
                current_streak += 1
            
            longest = max(longest, current_streak)
    
    return longest"""
    }
]

def insert_questions():
    questions_ref = db.collection('questions')
    
    # First, check if questions already exist
    existing_docs = questions_ref.get()
    if len(existing_docs) > 0:
        print("Questions collection is not empty. Do you want to:")
        print("1. Skip existing questions")
        print("2. Update existing questions")
        print("3. Delete all and insert new")
        choice = input("Enter your choice (1/2/3): ")
        
        if choice == '1':
            print("Skipping operation...")
            return
        elif choice == '3':
            # Delete all existing documents
            for doc in existing_docs:
                doc.reference.delete()
                print(f"Deleted document {doc.id}")
    print(len(questions_data))
    # Insert or update questions
    for question in questions_data:
        try:
            # Check if question with same title exists
            existing_query = questions_ref.where('title', '==', question['title']).limit(1).get()
            
            if len(existing_query) > 0:
                # Update existing question
                doc = existing_query[0]
                doc.reference.update(question)
                print(f"Updated question: {question['title']} (ID: {doc.id})")
            else:
                # Add new question
                doc_ref = questions_ref.add(question)
                print(f"Added new question: {question['title']} (ID: {doc_ref[1].id})")
                
        except Exception as e:
            print(f"Error processing question '{question['title']}': {str(e)}")

if __name__ == "__main__":
    try:
        insert_questions()
        print("\nQuestions insertion completed successfully!")
    except Exception as e:
        print(f"An error occurred: {str(e)}")