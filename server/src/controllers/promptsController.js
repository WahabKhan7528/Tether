'use strict';

const PromptAnswer = require('../models/PromptAnswer');
const { getPromptForDate } = require('../utils/prompts');
const { createError } = require('../middleware/errorHandler');

// Get today's prompt and answers
async function getTodayPrompt(req, res, next) {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const { id, text } = getPromptForDate(today);

    const coupleId = req.user.coupleId?._id || req.user.coupleId;

    let promptRecord = await PromptAnswer.findOne({ coupleId, dateString });

    let answers = [];
    if (promptRecord) {
      answers = promptRecord.answers;
    }

    const myAnswer = answers.find(a => a.user.toString() === req.user._id.toString());
    const partnerAnswer = answers.find(a => a.user.toString() !== req.user._id.toString());
    
    let formattedPartnerAnswer = null;
    if (partnerAnswer) {
      if (myAnswer) {
        // Both answered, can see it
        formattedPartnerAnswer = { text: partnerAnswer.text, createdAt: partnerAnswer.createdAt, hidden: false };
      } else {
        // I haven't answered yet, hidden
        formattedPartnerAnswer = { text: 'Hidden until you answer', hidden: true };
      }
    }

    return res.json({
      success: true,
      data: {
        prompt: { id, text, dateString },
        myAnswer: myAnswer ? { text: myAnswer.text, createdAt: myAnswer.createdAt } : null,
        partnerAnswer: formattedPartnerAnswer,
      }
    });
  } catch (err) {
    next(err);
  }
}

async function answerPrompt(req, res, next) {
  try {
    const { answerText } = req.body;
    if (!answerText || !answerText.trim()) {
      return next(createError('Answer cannot be empty', 400));
    }

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const { id, text } = getPromptForDate(today);

    const coupleId = req.user.coupleId?._id || req.user.coupleId;

    let promptRecord = await PromptAnswer.findOne({ coupleId, dateString });
    
    if (!promptRecord) {
      promptRecord = await PromptAnswer.create({
        coupleId,
        dateString,
        promptId: id,
        answers: [{ user: req.user._id, text: answerText.trim() }]
      });
    } else {
      // Check if already answered
      const alreadyAnswered = promptRecord.answers.some(a => a.user.toString() === req.user._id.toString());
      if (alreadyAnswered) {
        return next(createError("You have already answered today's prompt", 400));
      }
      promptRecord.answers.push({ user: req.user._id, text: answerText.trim() });
      await promptRecord.save();
    }

    return res.json({ success: true, data: promptRecord });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTodayPrompt,
  answerPrompt,
};
