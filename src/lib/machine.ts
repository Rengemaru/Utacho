import { getSetting, setSetting } from '../db/settings';

export type Machine = 'DAM' | 'JOYSOUND';

export const MACHINES: readonly Machine[] = ['DAM', 'JOYSOUND'];

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const v = await getSetting('onboarding_completed');
  return v === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await setSetting('onboarding_completed', 'true');
}

export async function getDefaultMachine(): Promise<Machine> {
  const v = await getSetting('default_machine');
  // 不正値（復元時の異常データ等）は 'DAM' にフォールバック（#76）
  return v === 'JOYSOUND' ? 'JOYSOUND' : 'DAM';
}

export async function setDefaultMachine(m: Machine): Promise<void> {
  await setSetting('default_machine', m);
}

export async function getCurrentMachine(): Promise<Machine> {
  const sessionDate = await getSetting('session_date');
  const today = localDateString();
  if (sessionDate === today) {
    const sessionMachine = await getSetting('session_machine');
    if (sessionMachine === 'DAM' || sessionMachine === 'JOYSOUND') {
      return sessionMachine;
    }
  }
  return getDefaultMachine();
}

export async function setSessionMachine(m: Machine): Promise<void> {
  await setSetting('session_machine', m);
  await setSetting('session_date', localDateString());
}
