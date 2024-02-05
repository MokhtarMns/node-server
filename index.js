// server.js
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://e-learning-platform-49d0b-default-rtdb.firebaseio.com/",
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDDcef5FdRcrQARFJ2IDEgB4jJtvl-VyzA");

async function explain(text, context) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const instructions = `You are an AI assistant for a computer science student,
     you mission is to explain exactly the concept provided according to
      the provided context, you may use clear examples to provide further
       explanation if needed, explain strictly the concept selected , no turn around and keep your answers must be in the range of 2 to 3 lines only, avoid using
        bullet points since your answer must be a phrase`;
  const result = await model.generateContent(
    instructions + `"concept": ${text}\n context": ${context}`
  );
  const response = await result.response;
  const answer = response.text();
  console.log(context);
  return answer;
}

async function AnswerQuestion({ conceptContent, selectedText, question }) {
  console.log({ conceptContent, selectedText, question });
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const instructions = `You are an AI assistant for a computer science student,
     you mission is to answer the question in the context of the context and the highlighted text in it, you may use clear examples to provide further
       explanation if needed, but keep your answers must be in the range of 1 to 2 lines only, avoid using
        bullet points since your answer must be a phrase`;
  const result = await model.generateContent(
    instructions +
      `"context": ${conceptContent}\n "highlighed text": ${selectedText} \n "question": ${question}`
  );
  const response = await result.response;
  const answer = response.text();
  return answer;
}

async function generateQuiz(concept) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const instructions = `You are an AI assistant for a computer science student,
     you mission is to generate a quiz of 4 question about the text provided, the 
     question are multiple-answers question or true/false questions and must be hard 
     to solve and strictly related to the text provided . You must return only
      the json format of the question, it must be a strictly valide JSON no quotations in the start or end of it or accompanion text with it
      since it will be processed automaticaly. here is an example of what you must generate example: {
        "question1": {
          "question": "What are the primary colors?",
          "answers": [
            { "id": "a", "text": "Red", "correct": true },
            { "id": "b", "text": "Green", "correct": true },
            { "id": "c", "text": "Blue", "correct": true },
            { "id": "d", "text": "Yellow", "correct": false }
          ],
          "correctAnswer": ["a", "b", "c"]
        },
        "question2": {
          "question": "Which programming languages are used for front-end web development?",
          "answers": [
            { "id": "a", "text": "Java", "correct": false },
            { "id": "b", "text": "Python", "correct": false },
            { "id": "c", "text": "JavaScript", "correct": true },
            { "id": "d", "text": "C++", "correct": false }
          ],
          "correctAnswer": ["c"]
        },
        "question3": {
          "question": "Pluto is a planet",
          "answers": [
            { "id": "a", "text": "True", "correct": flase },
            { "id": "b", "text": "False", "correct": true },
          ],
          "correctAnswer": ["b"]
        }
      }`;
  const result = await model.generateContent(
    instructions + `The text: ${concept}`
  );
  const response = await result.response;
  const answer = response.text();
  console.log(answer);
  return answer;
}

async function generateExam(chapters, examType, difficulty) {
  console.log("EXAM CALLED");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const instructions = `You are an AI assistant for a computer science student,
     you mission is to generate an exam of 9 questions about these chapters ${chapters.toString()}, the exam type is ${examType}
     question are multiple-answers question, true/false questions, guess code output, and fill the gaps (make two questions for each type) and must be ${difficulty} level and strictly related to the chapters provided . You must return only
      the json format of the question, it MUST BE a STRICTLY VALIDE JSON no quotations or back ticks in the start or end of it or accompanion text with it
      since it will be processed automaticaly. here is an example of what you must generate respect the json format below: {
        "question1": {
          "question": "What are the primary colors?",
          "answers": [
            { "id": "a", "text": "Red", "correct": true },
            { "id": "b", "text": "Green", "correct": true },
            { "id": "c", "text": "Blue", "correct": true },
            { "id": "d", "text": "Yellow", "correct": false }
          ],
          "correctAnswer": ["a", "b", "c"]
        },
        "question2": {
          "question": "Algeria is in ______",
          "answers": [
            { "id": "a", "text": "Europe", "correct": false },
            { "id": "b", "text": "Asia", "correct": false },
            { "id": "c", "text": "Africa", "correct": true }
          ],
          "correctAnswer": ["c"]
        },
        "question3": {
          "question": "Pluto is a planet",
          "answers": [
            { "id": "a", "text": "True", "correct": flase },
            { "id": "b", "text": "False", "correct": true }
          ],
          "correctAnswer": ["b"]
        },
        "question4": {
          "question": "const a = 0;
          a++
          console.log(a),
          "answers": [
            { "id": "a", "text": "0", "correct": flase },
            { "id": "b", "text": "1", "correct": true }
          ],
          "correctAnswer": ["b"]
        }
      }  , final instruction: the output must be valide JSON`;
  const result = await model.generateContent(instructions);
  const response = await result.response;
  const answer = response.text();
  return answer;
}
// Define a route for user login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    await admin.auth().updateUser(userRecord.uid, {
      password,
    });

    const studentDoc = await admin
      .firestore()
      .collection("students")
      .doc(userRecord.uid)
      .get();

    const teacherDoc = await admin
      .firestore()
      .collection("teachers")
      .doc(userRecord.uid)
      .get();

    if (studentDoc.exists) {
      const classRef = studentDoc.data().class;

      const classDoc = await classRef.get();

      if (classDoc.exists) {
        const modules = classDoc.data().modules;

        const modulesDetails = await Promise.all(
          modules.map(async (moduleRef) => {
            const moduleDoc = await moduleRef.get();
            if (moduleDoc.exists) {
              const { label } = moduleDoc.data();
              const chapterRefs = moduleDoc.data().chapters || [];

              const chapterDetails = await Promise.all(
                chapterRefs.map(async (chapterRef) => {
                  const chapterDoc = await chapterRef.get();
                  if (chapterDoc.exists) {
                    const { title, order } = chapterDoc.data();
                    const examDoc = await admin
                      .firestore()
                      .collection("chapters_exams")
                      .doc(`${userRecord.uid}-${chapterDoc.id}`)
                      .get();
                    const hasPassedExam = examDoc.exists; // Check if the record exists

                    return {
                      id: chapterDoc.id,
                      title,
                      order,
                      passedExam: hasPassedExam,
                      passed: chapterDoc.data().passed || false,
                      score: examDoc.data()?.score || 0,
                    };
                  }
                  return null;
                })
              );

              const validChapterDetails = chapterDetails.filter(
                (chapter) => chapter !== null
              );

              return { id: moduleDoc.id, label, chapters: validChapterDetails };
            }
            return null;
          })
        );

        const validModulesDetails = modulesDetails.filter(
          (module) => module !== null
        );

        res.status(200).json({
          role: 0,
          uid: userRecord.uid,
          classes: [{ id: classDoc.id, modules: validModulesDetails }],
        });
        return;
      }
    } else if (teacherDoc.exists) {
      // Retrieve teacher-related data if needed
      // ...

      res.status(200).json({ role: 1, uid: userRecord.uid });
      return;
    }

    res.status(401).send("Unauthorized");
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).send("Unauthorized");
  }
});
app.get("/complete/:conceptId", async (req, res) => {
  const { conceptId } = req.params;

  try {
    // Assuming you have a Firestore collection named "concepts"
    const conceptDoc = await admin
      .firestore()
      .collection("concepts")
      .doc(conceptId)
      .get();

    if (conceptDoc.exists) {
      // Update the complete flag to true and add the completion date
      const completionDate = new Date().toISOString();
      await admin.firestore().collection("concepts").doc(conceptId).update({
        completed: true,
        completionDate: completionDate,
      });

      // Find the chapter that contains this concept
      const chaptersSnapshot = await admin
        .firestore()
        .collection("chapters")
        .get();

      chaptersSnapshot.forEach(async (chapterDoc) => {
        const conceptRefs = chapterDoc.data().concepts || [];
        const conceptIds = conceptRefs.map((ref) => ref.id);

        // Check if the current concept is part of this chapter
        if (conceptIds.includes(conceptId)) {
          // Check if all concepts in the chapter are completed
          const allConceptsCompleted = conceptIds.every(async (id) => {
            const conceptSnapshot = await admin
              .firestore()
              .collection("concepts")
              .doc(id)
              .get();
            return conceptSnapshot.data().completed;
          });

          // If all concepts are completed, update the chapter's passed status
          if (allConceptsCompleted) {
            await admin
              .firestore()
              .collection("chapters")
              .doc(chapterDoc.id)
              .update({
                passed: true,
              });
          }
        }
      });

      res.status(200).json({
        success: true,
        message: "Concept complete status updated successfully",
        completionDate: completionDate,
      });
    } else {
      // Concept document not found
      res.status(404).json({ success: false, message: "Concept not found" });
    }
  } catch (error) {
    console.error("Update concept complete status error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/completedConcepts", async (req, res) => {
  console.log("fetch completed");
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedConcepts = await admin
      .firestore()
      .collection("concepts")
      .where("completed", "==", true)
      .where("completionDate", ">=", sevenDaysAgo.toISOString())
      .get();

    const conceptsByDate = {};

    completedConcepts.forEach((doc) => {
      const completionDate = new Date(doc.data().completionDate)
        .toISOString()
        .split("T")[0];

      if (!conceptsByDate[completionDate]) {
        conceptsByDate[completionDate] = 1;
      } else {
        conceptsByDate[completionDate]++;
      }
    });

    const result = Object.entries(conceptsByDate).map(
      ([date, numberOfConceptsCompleted]) => ({
        date: date,
        tasksSolved: numberOfConceptsCompleted,
      })
    );

    res.status(200).json({
      success: true,
      concepts: result,
    });
  } catch (error) {
    console.error(
      "Retrieve concepts completed in the last seven days error:",
      error.message
    );
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// server.js
app.get("/concepts/:chapterId", async (req, res) => {
  const { chapterId } = req.params;
  console.log("chapterId", chapterId);

  try {
    // Retrieve the chapter document to get concept references
    const chapterDoc = await admin
      .firestore()
      .collection("chapters")
      .doc(chapterId)
      .get();

    if (!chapterDoc.exists) {
      res.status(404).send("Chapter not found");
      return;
    }

    const conceptRefs = chapterDoc.data().concepts || [];

    // Fetch concepts based on the references
    const conceptPromises = conceptRefs.map(async (conceptRef) => {
      const conceptDoc = await conceptRef.get();
      //console.log(conceptDoc.data().quiz.replace(/\n/g, ""));
      if (conceptDoc.exists) {
        return {
          id: conceptDoc.id,
          content: conceptDoc.data().content || "",
          title: conceptDoc.data().title || "",
          completed: conceptDoc.data().completed || false,
          questions: conceptDoc.data().quiz || "",
        };
      }
      return null;
    });

    const concepts = await Promise.all(conceptPromises);

    res.status(200).json({ concepts });
  } catch (error) {
    console.error("Error retrieving concepts:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/explain", async (req, res) => {
  const { text, context } = req.body;
  const result = await explain(text, context);
  console.log(result);
  res.status(200).json({ explanation: result });
});

app.post("/quiz", async (req, res) => {
  const { conceptContent } = req.body;
  const result = await generateQuiz(conceptContent);
  res.status(200).json({ questions: JSON.parse(result.replace(/\n/g, "")) });
});

app.post("/question", async (req, res) => {
  const { conceptContent, selectedText, question } = req.body;
  const result = await AnswerQuestion({
    conceptContent,
    selectedText,
    question,
  });
  console.log(result);
  res.status(200).send(result.replace(/\n/g, ""));
});

app.post("/exam", async (req, res) => {
  const { chapters, examType, difficulty } = req.body;
  const result = await generateExam(chapters, examType, difficulty);
  console.log(result);
  res.status(200).json({ questions: JSON.parse(result.replace(/\n/g, "")) });
});
app.post("/modules", async (req, res) => {
  const { uid } = req.body;

  try {
    const userDoc = await admin
      .firestore()
      .collection("students")
      .doc(uid)
      .get();

    const classRef = userDoc.data().class;

    const classDoc = await classRef.get();

    if (classDoc.exists) {
      const modules = classDoc.data().modules;
      const moduleDetails = await Promise.all(
        modules.map(async (moduleRef) => {
          const moduleDoc = await moduleRef.get();
          if (moduleDoc.exists) {
            const { label } = moduleDoc.data();
            return { id: moduleDoc.id, label };
          }
          return null;
        })
      );

      const validModuleDetails = moduleDetails.filter(
        (module) => module !== null
      );
      res.status(200).json({ modules: validModuleDetails });
    } else {
      res.status(404).send("Class not found");
    }
  } catch (error) {
    console.error("Error retrieving modules:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/chapters", async (req, res) => {
  const { courseId } = req.body;

  try {
    const moduleDoc = await admin
      .firestore()
      .collection("modules")
      .doc(courseId)
      .get();

    if (moduleDoc.exists) {
      const chapterRefs = moduleDoc.data().chapters;

      const chapterDetails = await Promise.all(
        chapterRefs.map(async (chapterRef) => {
          const chapterDoc = await chapterRef.get();
          if (chapterDoc.exists) {
            const { title, order, passed } = chapterDoc.data();
            return { id: chapterDoc.id, title, order, passed };
          }
          return null;
        })
      );

      const validChapterDetails = chapterDetails.filter(
        (chapter) => chapter !== null
      );

      res.status(200).json({ chapters: validChapterDetails });
    } else {
      res.status(404).send("Module not found");
    }
  } catch (error) {
    console.error("Error retrieving chapters:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/exams", async (req, res) => {
  const { courseId } = req.body;

  try {
    const moduleDoc = await admin
      .firestore()
      .collection("modules")
      .doc(courseId)
      .get();

    if (moduleDoc.exists) {
      const chapterRefs = moduleDoc.data().exams;

      const chapterDetails = await Promise.all(
        chapterRefs.map(async (chapterRef) => {
          const chapterDoc = await chapterRef.get();
          if (chapterDoc.exists) {
            const { title, passed, order, questions } = chapterDoc.data();
            return { id: chapterDoc.id, title, order, passed, questions };
          }
          return null;
        })
      );

      const validChapterDetails = chapterDetails.filter(
        (chapter) => chapter !== null
      );
      console.log(validChapterDetails);

      res.status(200).json({ exams: validChapterDetails });
    } else {
      res.status(404).send("Module not found");
    }
  } catch (error) {
    console.error("Error retrieving chapters:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/incrementAnswersCount/:moduleId", async (req, res) => {
  const { moduleId } = req.params;
  console.log("COUNTING answer for ", moduleId);

  try {
    // Assuming you have a Firestore collection named "modules"
    const moduleDoc = await admin
      .firestore()
      .collection("modules")
      .doc(moduleId)
      .get();

    if (moduleDoc.exists) {
      // Increment the answers_count field
      const currentAnswersCount = moduleDoc.data().answers_count || 0;
      const newAnswersCount = currentAnswersCount + 1;

      await admin.firestore().collection("modules").doc(moduleId).update({
        answers_count: newAnswersCount,
      });

      res.status(200).json({
        success: true,
        message: "Answers count incremented successfully",
        newAnswersCount: newAnswersCount,
      });
    } else {
      // Module document not found
      res.status(404).json({ success: false, message: "Module not found" });
    }
  } catch (error) {
    console.error("Increment answers count error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/answersCount", async (req, res) => {
  try {
    // Assuming you have a Firestore collection named "modules"
    const modulesSnapshot = await admin.firestore().collection("modules").get();

    const modulesList = modulesSnapshot.docs.map((doc) => {
      const { code, answers_count } = doc.data();
      return { module: code, questionsAnswered: answers_count || 0 };
    });

    res.status(200).json({
      success: true,
      modules: modulesList,
    });
  } catch (error) {
    console.error("Retrieve modules list error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
