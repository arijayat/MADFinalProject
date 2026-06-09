import {
  dominantFasterMatches,
  formatTracePrediction,
  reactionTimeMatches,
  traceMetricMatches,
  traceRowMatches,
} from '@/utils/reaction-dashboard';

describe('reaction dashboard helpers', () => {
  it('formats trace predictions from split fields or legacy field', () => {
    expect(formatTracePrediction({ trace1_accuracy_pred: '80', trace1_delay_pred: '150' }, 1)).toBe('80% · 150 ms');
    expect(formatTracePrediction({ trace2_pred: '70% · 200 ms' }, 2)).toBe('70% · 200 ms');
    expect(formatTracePrediction({}, 3)).toBe('\u2014');
  });

  it('matches tap reaction predictions within tolerance', () => {
    expect(reactionTimeMatches('300', 374)).toBe('Yes');
    expect(reactionTimeMatches('300', 376)).toBe('No');
    expect(reactionTimeMatches(undefined, 300)).toBe('\u2014');
    expect(reactionTimeMatches('300', null)).toBe('\u2014');
  });

  it('checks whether dominant hand was faster', () => {
    expect(dominantFasterMatches('Yes', 300, 450)).toBe('Yes');
    expect(dominantFasterMatches('No', 500, 350)).toBe('Yes');
    expect(dominantFasterMatches('About the same', 300, 350)).toBe('Yes');
    expect(dominantFasterMatches('Yes', 500, 350)).toBe('No');
    expect(dominantFasterMatches('', 300, 350)).toBe('\u2014');
  });

  it('matches individual and combined trace metrics', () => {
    expect(traceMetricMatches('80', 94, 15)).toBe('Yes');
    expect(traceMetricMatches('80', 96, 15)).toBe('No');
    expect(traceMetricMatches('bad', 80, 15)).toBe('\u2014');

    expect(traceRowMatches({ trace1_accuracy_pred: '80', trace1_delay_pred: '150' }, 1, 90, 200)).toBe('Yes');
    expect(traceRowMatches({ trace1_accuracy_pred: '80', trace1_delay_pred: '150' }, 1, 99, 200)).toBe('No');
    expect(traceRowMatches({ trace1_accuracy_pred: '80' }, 1, 90, 200)).toBe('\u2014');
  });
});
