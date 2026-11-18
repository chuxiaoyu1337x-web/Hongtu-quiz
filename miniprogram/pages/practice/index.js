const {
  lessons,
  readProgress,
  saveAnswer,
  hasAnswer,
  wrongQuestions,
  mixedQuestions,
} = require('../../utils/practice.js');

const letters = 'ABCD';

function buildOptions(question, selected, submitted) {
  return question.options.map((text, index) => {
    const key = letters[index];
    const checked = selected.includes(key);
    let state = checked ? 'selected' : '';
    let note = checked ? '已选' : '';
    if (submitted && question.answer.includes(key)) {
      state = 'correct';
      note = '正确选项';
    } else if (submitted && checked) {
      state = 'incorrect';
      note = '选错';
    }
    return { key, text, state, note };
  });
}

Page({
  data: {
    phase: 'loading',
    title: '',
    mode: '',
    position: 0,
    total: 0,
    percentage: 0,
    question: null,
    options: [],
    selected: [],
    submitted: false,
    correct: false,
    answerLabel: '',
    sessionCount: 0,
    correctCount: 0,
  },

  onLoad(query) {
    this.mode = query.mode;
    this.lesson = lessons.find((lesson) => lesson.id === query.lessonId);
    this.startPractice(false);
  },

  startPractice(restart) {
    let progress = {};
    if (this.mode === 'lesson' || this.mode === 'wrong') {
      try {
        progress = readProgress();
      } catch {
        wx.showToast({ title: '暂时无法读取练习进度', icon: 'none' });
      }
    }

    let questions = [];
    let title = '';
    let cursor = 0;
    if (this.mode === 'lesson' && this.lesson) {
      questions = this.lesson.questions;
      title = this.lesson.label;
      const next = questions.findIndex((question) => !hasAnswer(progress, question.id));
      if (!restart && next >= 0) {
        cursor = next;
      }
    } else if (this.mode === 'mixed') {
      questions = mixedQuestions();
      title = '随机练习';
    } else if (this.mode === 'wrong') {
      questions = wrongQuestions(progress);
      title = '错题重练';
    }

    if (questions.length === 0) {
      this.setData({ phase: 'empty', mode: this.mode || '' });
      return;
    }

    this.session = { questions, cursor, answered: 0, correct: 0 };
    this.setData({ title, mode: this.mode });
    this.showQuestion();
  },

  showQuestion() {
    const { questions, cursor } = this.session;
    const question = questions[cursor];
    const position = cursor + 1;
    const total = questions.length;
    this.setData({
      phase: 'question',
      position,
      total,
      percentage: Math.round(position * 100 / total),
      question: { stem: question.stem, type: question.type },
      options: buildOptions(question, [], false),
      selected: [],
      submitted: false,
      correct: false,
      answerLabel: '',
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  chooseOption(event) {
    if (this.data.phase !== 'question' || this.data.submitted) {
      return;
    }
    const { key } = event.currentTarget.dataset;
    const question = this.session.questions[this.session.cursor];
    const previous = this.data.selected;
    let selected = [key];
    if (question.type === 'multiple') {
      selected = previous.includes(key) ? previous.filter((letter) => letter !== key) : previous.concat(key);
    }
    this.setData({ selected, options: buildOptions(question, selected, false) });
  },

  submitAnswer() {
    const { phase, submitted, selected } = this.data;
    if (phase !== 'question' || submitted || selected.length === 0) {
      return;
    }
    const question = this.session.questions[this.session.cursor];
    const correct = selected.slice().sort().join('') === question.answer;
    this.session.answered += 1;
    if (correct) {
      this.session.correct += 1;
    }
    this.setData({
      submitted: true,
      correct,
      answerLabel: question.answer.split('').join('、'),
      options: buildOptions(question, selected, true),
    });

    try {
      saveAnswer(question.id, correct);
    } catch {
      wx.showToast({ title: '本题进度保存失败', icon: 'none' });
    }
  },

  nextQuestion() {
    if (this.data.phase !== 'question' || !this.data.submitted) {
      return;
    }
    this.session.cursor += 1;
    if (this.session.cursor < this.session.questions.length) {
      this.showQuestion();
      return;
    }
    this.setData({
      phase: 'result',
      sessionCount: this.session.answered,
      correctCount: this.session.correct,
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  restartPractice() {
    this.startPractice(true);
  },

  goHome() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/index' }),
    });
  },
});
