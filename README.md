# 📚 AI YouTube Course Recommender

### (AI-Powered Learning Platform)

An AI-powered system that generates **structured courses using YouTube videos**. The platform uses **AI to create learning chapters and automatically recommend the most relevant YouTube videos** for each chapter.

The goal is to convert scattered YouTube tutorials into **structured courses similar to Udemy or Coursera**.

Platforms referenced:

* Udemy
* Coursera

---

# 🚀 Project Overview

Most learners face these problems:

* YouTube tutorials are **unstructured**
* Hard to find **proper learning order**
* Videos often **don’t match the topic**

This system solves the problem by using AI to:

1. Generate a **structured course syllabus**
2. Convert each chapter into **optimized search queries**
3. Fetch **relevant YouTube videos**
4. Rank and filter videos using **AI relevance checks**

---

# 🧠 System Architecture

```
User Input
   ↓
Gemini AI generates course chapters
   ↓
AI generates optimized YouTube search queries
   ↓
YouTube Data API fetches videos
   ↓
Video ranking + filtering
   ↓
AI relevance verification
   ↓
Final structured course
```

---

# ⚙️ Technologies Used

### AI Model

Course generation and relevance checking:

* Google Gemini API

### Video Data

Video search and metadata:

* YouTube Data API 

# 📊 Workflow

## Step 1 — User Input

User enters a topic:

```
Learn Machine Learning
```

---

## Step 2 — AI Course Generation

Gemini generates course chapters.

Example output:

```json
{
 "course": "Machine Learning",
 "chapters": [
  "Introduction to Machine Learning",
  "Linear Regression",
  "Gradient Descent",
  "Model Evaluation"
 ]
}
```

---

## Step 3 — AI Query Optimization

Each chapter is converted into a **better YouTube search query**.

Example:

```
Chapter:
Gradient Descent

AI Generated Query:
"gradient descent machine learning explained for beginners"
```

---

## Step 4 — YouTube Video Retrieval

The system searches videos using the YouTube API.

Example request:

```
GET https://www.googleapis.com/youtube/v3/search
```

Parameters:

```
part=snippet
type=video
videoDuration=medium
maxResults=10
```

---

## Step 5 — Video Ranking

Videos are ranked based on:

```
views
likes
duration
relevance
```

Example scoring formula:

```
score =
views * 0.5
+ likes * 0.3
+ duration * 0.2
```

---

## Step 6 — AI Relevance Verification

AI checks if the video matches the chapter.

Example prompt:

```
Chapter: Gradient Descent

Video title:
"Machine Learning Full Course"

Is this video relevant for learning Gradient Descent?
Answer YES or NO.
```

Irrelevant videos are removed.

---

# 📚 Final Course Output

Example generated course:

```
Course: Machine Learning

Module 1: Introduction to Machine Learning
▶ Video 1
▶ Video 2

Module 2: Linear Regression
▶ Video 1
▶ Video 2

Module 3: Gradient Descent
▶ Video 1
▶ Video 2
```

---

# 🔥 Key Features

### AI Course Generation

Creates structured syllabus automatically.

### Smart Video Matching

AI ensures videos match chapters.

### AI Query Optimization

Improves YouTube search accuracy.

### Video Ranking

Filters low-quality content.

### Modular Learning Structure

Courses divided into chapters.

---

# 🌟 Future Improvements

### AI Video Summaries

Generate short summaries for each video.

### Quiz Generator

Create quizzes after each module.

### Progress Tracking

Track completed modules.

### Personalized Learning Paths

Generate courses based on:

```
Skill level
Learning goal
Available time
```

### Transcript Analysis

Use video transcripts to verify relevance.

---

# 🧩 Example API Usage

Example video search request:

```javascript
const url = `https://www.googleapis.com/youtube/v3/search
?q=machine+learning+for+beginners
&type=video
&maxResults=5
&key=API_KEY`;
```

---

# 🎯 Benefits

* Converts YouTube into **structured courses**
* Saves time searching for tutorials
* Improves learning efficiency
* AI automatically selects relevant videos

---

# 📌 Conclusion

This project demonstrates how AI can transform **unstructured video content into organized educational courses**. By combining **Gemini AI with YouTube APIs**, the system creates an intelligent learning platform capable of recommending high-quality educational content.
