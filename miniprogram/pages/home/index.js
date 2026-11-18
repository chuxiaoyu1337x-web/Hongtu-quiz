const {
  lessons,
  questionCount,
  mixedCount,
  readProgress,
  hasAnswer,
  wrongQuestions,
} = require('../../utils/practice.js');

Page({
  data: {
    lessons: [],
    questionCount,
    mixedCount,
    practiced: 0,
    percentage: 0,
    wrongCount: 0,
  },

  onShow() {
    let progress = {};
    try {
      progress = readProgress();
    } catch {
      wx.showToast({ title: '暂时无法读取练习进度', icon: 'none' });
    }

    const rows = lessons.map((lesson) => ({
      id: lesson.id,
      label: lesson.label,
      total: lesson.questions.length,
      practiced: lesson.questions.filter((question) => hasAnswer(progress, question.id)).length,
    }));
    const practiced = rows.reduce((sum, lesson) => sum + lesson.practiced, 0);
    this.setData({
      lessons: rows,
      practiced,
      percentage: Math.round(practiced * 100 / questionCount),
      wrongCount: wrongQuestions(progress).length,
    });
  },

  openPractice(event) {
    const { mode, lessonId } = event.currentTarget.dataset;
    const lessonParam = lessonId ? `&lessonId=${lessonId}` : '';
    wx.navigateTo({ url: `/pages/practice/index?mode=${mode}${lessonParam}` });
  },
});
