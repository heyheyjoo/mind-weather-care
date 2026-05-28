import { useState, useEffect } from 'react';

// Type definitions
export interface Issue {
  id: string;
  text: string;
  emoji: string;
  timestamp: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  timestamp: number;
}

export interface SessionLog {
  id: string;
  date: string;
  theory: string;
  issueCount: number;
  stickerCount: number;
  toolkitsUsed: string[];
  summary: string;
}

export type ToolkitType = 'tipp' | 'temperature' | 'stop';

const CHANNEL_NAME = 'group_counseling_channel';

// Helper functions for LocalStorage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const useSharedState = () => {
  // Initialize States from LocalStorage
  const [step, setStepState] = useState<number>(() => getStorageItem('gc_step', 1));
  const [issues, setIssuesState] = useState<Issue[]>(() => getStorageItem('gc_issues', []));
  const [theory, setTheoryState] = useState<string | null>(() => getStorageItem('gc_theory', null));
  const [stickers, setStickersState] = useState<Sticker[]>(() => getStorageItem('gc_stickers', []));
  const [sessionLogs, setSessionLogsState] = useState<SessionLog[]>(() => getStorageItem('gc_session_logs', []));
  const [activeToolkit, setActiveToolkitState] = useState<ToolkitType>(() => getStorageItem('gc_active_toolkit', 'tipp'));

  // BroadcastChannel Instance
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    const handleMessage = (event: MessageEvent) => {
      const { type, key, value } = event.data;
      if (type === 'UPDATE') {
        switch (key) {
          case 'gc_step':
            setStepState(value as number);
            break;
          case 'gc_issues':
            setIssuesState(value as Issue[]);
            break;
          case 'gc_theory':
            setTheoryState(value as string | null);
            break;
          case 'gc_stickers':
            setStickersState(value as Sticker[]);
            break;
          case 'gc_session_logs':
            setSessionLogsState(value as SessionLog[]);
            break;
          case 'gc_active_toolkit':
            setActiveToolkitState(value as ToolkitType);
            break;
          default:
            break;
        }
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Universal State Updater Helper
  const updateSharedState = <T>(key: string, value: T, stateSetter: React.Dispatch<React.SetStateAction<T>>) => {
    // 1. Local React State Update
    stateSetter(value);
    // 2. LocalStorage Persistence
    setStorageItem(key, value);
    // 3. Broadcast to other tabs
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'UPDATE', key, value });
    channel.close();
  };

  // --- API Action functions ---

  const setStep = (nextStep: number) => {
    updateSharedState('gc_step', nextStep, setStepState);
  };

  const addIssue = (text: string, emoji: string) => {
    const newIssue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      emoji,
      timestamp: Date.now()
    };
    const updated = [newIssue, ...issues];
    updateSharedState('gc_issues', updated, setIssuesState);
  };

  const fillDummyIssues = () => {
    const dummies: Issue[] = [
      {
        id: 'dummy1',
        text: '요즘 친구 관계 때문에 너무 고민이에요. 사소한 오해로 서먹해졌는데 먼저 사과하기가 어려워요.',
        emoji: '😭',
        timestamp: Date.now() - 5000
      },
      {
        id: 'dummy2',
        text: '시험 기간만 되면 가슴이 두근거리고 머리가 하얘져서 공부한 만큼 실력 발휘를 못 해요.',
        emoji: '😕',
        timestamp: Date.now() - 4000
      },
      {
        id: 'dummy3',
        text: '내 감정이 나도 모르게 불쑥 튀어나올 때가 있어요. 조절하는 방법을 배우고 싶습니다.',
        emoji: '😐',
        timestamp: Date.now() - 3000
      },
      {
        id: 'dummy4',
        text: '부모님이 제 이야기를 전혀 들어주지 않으시는 것 같아요. 대화만 하면 잔소리로 느껴져요.',
        emoji: '😕',
        timestamp: Date.now() - 2000
      },
      {
        id: 'dummy5',
        text: '화가 나면 나도 모르게 소리를 지르거나 물건을 던지게 되어서 후회할 때가 많아요.',
        emoji: '😭',
        timestamp: Date.now() - 1000
      }
    ];
    // Keep existing plus dummies, avoiding duplicate dummy ids
    const filteredIssues = issues.filter(issue => !issue.id.startsWith('dummy'));
    const updated = [...dummies, ...filteredIssues];
    updateSharedState('gc_issues', updated, setIssuesState);
  };

  const selectTheory = (selectedTheory: string | null) => {
    updateSharedState('gc_theory', selectedTheory, setTheoryState);
    if (selectedTheory) {
      // Auto move to step 3 when theory is selected
      setStep(3);
    }
  };

  const sendSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      timestamp: Date.now()
    };
    const updated = [...stickers, newSticker];
    updateSharedState('gc_stickers', updated, setStickersState);
  };

  const setActiveToolkit = (toolkit: ToolkitType) => {
    updateSharedState('gc_active_toolkit', toolkit, setActiveToolkitState);
  };

  const endSession = () => {
    // Save current session log
    const dateObj = new Date();
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    
    // Aggregate used toolkits
    const toolkitsUsed: string[] = ['TIPP 호흡 타이머', '감정 온도계', 'STOP 단계별 성찰'];

    const newLog: SessionLog = {
      id: `log-${Date.now()}`,
      date: formattedDate,
      theory: theory || '변증법적 행동치료 (DBT)',
      issueCount: issues.length,
      stickerCount: stickers.length,
      toolkitsUsed,
      summary: `고민 수집 및 ${theory || 'DBT'} 상담 매칭 후 라이브 세션(TIPP 호흡, 감정 온도계, STOP)을 활용해 정서 안정 및 집단원 간 타당화 응원 메시지 발송을 성공적으로 완료하였습니다.`
    };

    const updatedLogs = [newLog, ...sessionLogs];
    
    // Save session logs
    updateSharedState('gc_session_logs', updatedLogs, setSessionLogsState);
    
    // Clean up active session states for the next one
    updateSharedState<Issue[]>('gc_issues', [], setIssuesState);
    updateSharedState<string | null>('gc_theory', null, setTheoryState);
    updateSharedState<Sticker[]>('gc_stickers', [], setStickersState);
    updateSharedState<ToolkitType>('gc_active_toolkit', 'tipp', setActiveToolkitState);

    // Transition both to Step 4
    setStep(4);
  };

  const resetAll = () => {
    // Clear active session states
    updateSharedState<Issue[]>('gc_issues', [], setIssuesState);
    updateSharedState<string | null>('gc_theory', null, setTheoryState);
    updateSharedState<Sticker[]>('gc_stickers', [], setStickersState);
    updateSharedState<ToolkitType>('gc_active_toolkit', 'tipp', setActiveToolkitState);
    
    // Transition both to Step 1
    setStep(1);
  };

  return {
    step,
    issues,
    theory,
    stickers,
    sessionLogs,
    activeToolkit,
    setStep,
    addIssue,
    fillDummyIssues,
    selectTheory,
    sendSticker,
    setActiveToolkit,
    endSession,
    resetAll
  };
};
