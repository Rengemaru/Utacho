const mockStore = new Map<string, string>();

jest.mock('../db/settings', () => ({
  getSettingSync: (key: string) => mockStore.get(key) ?? null,
  setSettingSync: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

import {
  getIntroState,
  isHomeTutorialReplayPending,
  markDetailTutorialDone,
  markHomeTutorialDone,
  requestTutorialReplay,
  shouldShowDetailTutorial,
  shouldShowHomeTutorial,
} from './tutorial';

describe('tutorial replay controls', () => {
  beforeEach(() => {
    mockStore.clear();
    mockStore.set('onboarding_completed', 'true');
  });

  it('intro の個別再再生を予約すると pending になる', () => {
    mockStore.set('tutorial_intro', 'done');
    expect(getIntroState()).toBe('done');

    requestTutorialReplay('intro');
    expect(getIntroState()).toBe('pending');
  });

  it('home の個別再再生を予約すると既存ユーザーでも表示対象になる', () => {
    mockStore.set('coach_mark_shown', 'true');
    mockStore.set('tutorial_home', 'done');
    expect(shouldShowHomeTutorial()).toBe(false);
    expect(isHomeTutorialReplayPending()).toBe(false);

    requestTutorialReplay('home');
    expect(getIntroState()).toBe('done');
    expect(shouldShowHomeTutorial()).toBe(true);
    expect(isHomeTutorialReplayPending()).toBe(true);

    markHomeTutorialDone();
    expect(shouldShowHomeTutorial()).toBe(false);
    expect(isHomeTutorialReplayPending()).toBe(false);
  });

  it('detail の個別再再生を予約すると完了後でも再表示対象になる', () => {
    markDetailTutorialDone();
    expect(shouldShowDetailTutorial()).toBe(false);

    requestTutorialReplay('detail');
    expect(shouldShowDetailTutorial()).toBe(true);

    markDetailTutorialDone();
    expect(shouldShowDetailTutorial()).toBe(false);
  });
});
