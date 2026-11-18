const lessons = require('../data/question-bank.js');

const progressKey = 'examPractice.v1.answers';
const mixedCount = 10;
const questions = [];
lessons.forEach((lesson) => questions.push(...lesson.questions));

function readProgress() {
  const stored = wx.getStorageSync(progressKey);
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveAnswer(id, correct) {
  const progress = readProgress();
  progress[id] = correct;
  wx.setStorageSync(progressKey, progress);
}

function hasAnswer(progress, id) {
  return progress[id] === true || progress[id] === false;
}

function wrongQuestions(progress) {
  return questions.filter((question) => progress[question.id] === false);
}

function mixedQuestions() {
  const sample = questions.slice();
  const count = Math.min(mixedCount, sample.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (sample.length - i));
    [sample[i], sample[j]] = [sample[j], sample[i]];
  }
  return sample.slice(0, count);
}

module.exports = {
  lessons,
  questionCount: questions.length,
  mixedCount,
  readProgress,
  saveAnswer,
  hasAnswer,
  wrongQuestions,
  mixedQuestions,
};
