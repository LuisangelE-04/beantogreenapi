import { Router, Request, Response } from "express";
import { query } from "../db/pool";

const surveys = Router();

// List active surveys
surveys.get("/", async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT s.id, s.name, s.description, s.active, s.created_at, s.updated_at, COUNT(sr.id) as responses 
       FROM surveys s 
       LEFT JOIN survey_responses sr ON s.id = sr.survey_id 
       WHERE s.active = true 
       GROUP BY s.id, s.name, s.description, s.active, s.created_at, s.updated_at
       ORDER BY s.created_at DESC`,
      []
    );

    res.json({ surveys: result.rows });
  } catch (error: any) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({ error: "Failed to fetch surveys" });
  }
});

// Get survey with questions
surveys.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const surveyRes = await query(`SELECT id, name, description, active FROM surveys WHERE id = $1`, [id]);
    if (surveyRes.rows.length === 0) return res.status(404).json({ error: "Survey not found" });

    const survey = surveyRes.rows[0];
    const qRes = await query(
      `SELECT id, question_order, question_text, question_type, options, is_optional FROM survey_questions WHERE survey_id = $1 ORDER BY question_order ASC`,
      [id]
    );

    res.json({ id: survey.id, name: survey.name, description: survey.description, questions: qRes.rows });
  } catch (error: any) {
    console.error("Error fetching survey:", error);
    res.status(500).json({ error: "Failed to fetch survey" });
  }
});

// Submit survey response
surveys.post("/:id/responses", async (req: Request, res: Response) => {
  try {
    const surveyId = req.params.id;
    const { userId, answers, metadata } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers array is required" });
    }

    // load questions
    const qRes = await query(
      `SELECT id, question_order, question_text, question_type, options, is_optional FROM survey_questions WHERE survey_id = $1 ORDER BY question_order ASC`,
      [surveyId]
    );
    const questions = qRes.rows;

    // validate required questions
    for (const q of questions) {
      if (!q.is_optional) {
        const found = answers.find((a: any) => a.questionId === q.id || a.questionId === q.id);
        if (!found) {
          return res.status(400).json({ error: `Missing required answer for question ${q.id}` });
        }
      }
    }

    // validate multiple-choice options
    for (const ans of answers) {
      const question = questions.find((q: any) => q.id === ans.questionId || q.id === ans.questionId);
      if (!question) return res.status(400).json({ error: `Invalid questionId ${ans.questionId}` });
      if (question.question_type === 'multiple-choice') {
        const opts = question.options || [];
        if (opts && !opts.includes(ans.answerText)) {
          return res.status(400).json({ error: `Invalid option for question ${question.id}` });
        }
      }
    }

    // insert response
    const insertResp = await query(`INSERT INTO survey_responses (survey_id, user_id, metadata) VALUES ($1, $2, $3) RETURNING id, submitted_at`, [surveyId, userId || null, metadata || {}]);
    const responseId = insertResp.rows[0].id;

    // insert answers
    const insertPromises = answers.map((ans: any) => {
      return query(`INSERT INTO survey_answers (response_id, question_id, answer_text, answer_json) VALUES ($1, $2, $3, $4)`, [responseId, ans.questionId, ans.answerText || null, ans.answerJson || null]);
    });
    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Response recorded', responseId, submittedAt: insertResp.rows[0].submitted_at });
  } catch (error: any) {
    console.error('Error submitting survey response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get survey stats (aggregate)
surveys.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const surveyId = req.params.id;

    // total responses
    const totalRes = await query(`SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = $1`, [surveyId]);
    const totalResponses = parseInt(totalRes.rows[0].count, 10);

    // get questions
    const qRes = await query(`SELECT id, question_text, question_type FROM survey_questions WHERE survey_id = $1 ORDER BY question_order ASC`, [surveyId]);
    const questions = qRes.rows;

    const questionsStats = [] as any[];
    for (const q of questions) {
      if (q.question_type === 'multiple-choice') {
        const statRes = await query(`SELECT answer_text, COUNT(*) as count FROM survey_answers WHERE question_id = $1 GROUP BY answer_text ORDER BY count DESC`, [q.id]);
        const stats: Record<string, number> = {};
        for (const row of statRes.rows) {
          stats[row.answer_text || ''] = parseInt(row.count, 10);
        }
        questionsStats.push({ questionId: q.id, question: q.question_text, type: q.question_type, stats });
      } else {
        const sampleRes = await query(`SELECT answer_text FROM survey_answers WHERE question_id = $1 AND answer_text IS NOT NULL ORDER BY created_at DESC LIMIT 10`, [q.id]);
        const samples = sampleRes.rows.map((r: any) => r.answer_text);
        questionsStats.push({ questionId: q.id, question: q.question_text, type: q.question_type, samples });
      }
    }

    res.json({ surveyId, totalResponses, questions: questionsStats });
  } catch (error: any) {
    console.error('Error fetching survey stats:', error);
    res.status(500).json({ error: 'Failed to fetch survey stats' });
  }
});

export default surveys;
