'use strict';

const DAILY_PROMPTS = [
  "What is your favorite memory of us from this past year?",
  "What is a small thing I do that makes you smile?",
  "When did you first know you were falling in love with me?",
  "What's a dream or goal you want us to achieve together?",
  "What do you admire most about my personality?",
  "If we could teleport anywhere for a weekend, where would we go?",
  "What's your favorite physical trait of mine?",
  "What was your first impression of me?",
  "What is something we haven't tried in bed that you'd like to?",
  "What song always reminds you of us?",
  "How do I make you feel safe?",
  "What's one thing you want to do more often together?",
  "What's the funniest moment we've shared?",
  "How have you changed since we've been together?",
  "What's your favorite way I show you love?",
  "What's a movie or show that reminds you of our relationship?",
  "What's the best gift I've ever given you?",
  "When do you feel most connected to me?",
  "What's a quirk of mine that you secretly love?",
  "If we had a whole day with no responsibilities, what would we do?",
];

function getPromptForDate(dateObj) {
  const year = dateObj.getFullYear();
  const start = new Date(year, 0, 0);
  const diff = (dateObj - start) + ((start.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % DAILY_PROMPTS.length;
  return { id: index, text: DAILY_PROMPTS[index] };
}

module.exports = {
  DAILY_PROMPTS,
  getPromptForDate,
};
