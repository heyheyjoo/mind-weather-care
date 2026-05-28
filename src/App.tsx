import { useState, useEffect } from 'react';
import { useSharedState } from './hooks/useSharedState';

export default function App() {
  const {
    step,
    issues,
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
  } = useSharedState();

  // Tab-specific role state ('teacher' | 'student' | null)
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);

  // Local state for Step 1 Student input
  const [studentIssueText, setStudentIssueText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😐');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Local state for Step 2 AI matching animation
  const [matchingStep, setMatchingStep] = useState(0); // 0: loading, 1: matching
  const [revealedKeywords, setRevealedKeywords] = useState<string[]>([]);
  const keywords = ['대인관계 갈등', '학업 스트레스', '정서적 취약성', '가족 불통', '충동적 대처'];

  // Local state for Step 3 Student components
  const [studentTemp, setStudentTemp] = useState(50);
  const [isTempSubmitted, setIsTempSubmitted] = useState(false);
  const [breathSeconds, setBreathSeconds] = useState(60);
  const [breathingActive, setBreathingActive] = useState(false);
  const [currentBreathCycle, setCurrentBreathCycle] = useState(1); // 1-10s cycle
  const [stopCardStep, setStopCardStep] = useState<'S' | 'T' | 'O' | 'P' | 'COMPLETE'>('S');
  const [localFloatingStickers, setLocalFloatingStickers] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Trigger keywords sequentially during AI loading
  useEffect(() => {
    if (step === 2 && role === 'teacher') {
      setMatchingStep(0);
      setRevealedKeywords([]);
      
      const keywordTimers = keywords.map((kw, index) => 
        setTimeout(() => {
          setRevealedKeywords(prev => [...prev, kw]);
        }, (index + 1) * 500)
      );

      const finalTimer = setTimeout(() => {
        setMatchingStep(1); // show recommendation cards
      }, 3000);

      return () => {
        keywordTimers.forEach(clearTimeout);
        clearTimeout(finalTimer);
      };
    }
  }, [step, role]);

  // Breathing timer ticks
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeToolkit === 'tipp' && breathingActive && breathSeconds > 0 && step === 3) {
      interval = setInterval(() => {
        setBreathSeconds(prev => prev - 1);
        setCurrentBreathCycle(prev => {
          if (prev >= 10) return 1;
          return prev + 1;
        });
      }, 1000);
    } else if (breathSeconds === 0) {
      setBreathingActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breathingActive, breathSeconds, activeToolkit, step]);

  // Sync state resets on step updates
  useEffect(() => {
    if (step === 1) {
      setStudentIssueText('');
      setSubmitSuccess(false);
      setIsTempSubmitted(false);
      setBreathSeconds(60);
      setBreathingActive(false);
      setCurrentBreathCycle(1);
      setStopCardStep('S');
    }
  }, [step]);

  // Launch local floating stickers
  const triggerLocalStickerAnimation = (emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const left = Math.floor(Math.random() * 80) + 10;
    setLocalFloatingStickers(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setLocalFloatingStickers(prev => prev.filter(s => s.id !== id));
    }, 2500);
  };

  // Student sticker submit handler
  const handleStickerClick = (emoji: string) => {
    sendSticker(emoji);
    triggerLocalStickerAnimation(emoji);
  };

  // Export session logs to JSON
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessionLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'gc_session_logs.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Thermometer Average (Shared state + local input)
  const getAverageTemp = () => {
    const baseTemps = [45, 75, 60, 30]; // Mock student inputs
    const allTemps = [...baseTemps, studentTemp];
    return Math.round(allTemps.reduce((a, b) => a + b, 0) / allTemps.length);
  };

  // Intro Page View
  if (!role) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          maxWidth: '550px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.5s ease'
        }}>
          {/* Logo & Intro */}
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--point-color)', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🌿</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-color)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            group-counseling-hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
            오프라인 현장 연계형 디지털 집단상담 플랫폼
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setRole('teacher')}
              style={{ padding: '1.2rem', fontSize: '1.1rem', width: '100%', borderRadius: '16px' }}
            >
              <span>선생님(상담자) 모드로 시작하기</span>
            </button>
            <button 
              className="btn btn-peach" 
              onClick={() => setRole('student')}
              style={{ padding: '1.2rem', fontSize: '1.1rem', width: '100%', borderRadius: '16px' }}
            >
              <span>학생(집단원) 모드로 참여하기</span>
            </button>
          </div>

          <div style={{ marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            시연 방법: 브라우저 탭을 2개 열어 각각 선생님 모드와 학생 모드로 접속해 보세요.
          </div>
        </div>
      </div>
    );
  }

  // --- StepBar Component (Common Header) ---
  const stepsList = ['고민 수집', 'AI 이론 추천', '라이브 세션', '기록실'];
  const StepBar = () => (
    <div className="step-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem' }}>🌿</span>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>group-counseling-hub</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
        {stepsList.map((stepName, index) => {
          const stepNum = index + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-dot">
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span>{stepName}</span>
              </div>
              {index < stepsList.length - 1 && <span className="step-arrow">→</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          padding: '0.25rem 0.6rem', 
          borderRadius: '6px', 
          backgroundColor: role === 'teacher' ? 'var(--point-color)' : 'var(--highlight-color)'
        }}>
          {role === 'teacher' ? '선생님 탭' : '학생 탭'}
        </span>
        <button 
          onClick={() => setRole(null)}
          style={{
            border: 'none', background: 'none', textDecoration: 'underline', 
            fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer'
          }}
        >
          역할 전환
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Header step tracker */}
      <StepBar />

      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
        
        {/* ====================================================
            STEP 1: 고민 수집 벽 (Step1IssueWall)
           ==================================================== */}
        {step === 1 && (
          <div style={{ width: '100%' }}>
            {role === 'teacher' ? (
              /* TEACHER STEP 1 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', margin: 0 }}>실시간 고민 수집 현황판</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                      학생들이 작성한 익명의 고민 카드가 실시간으로 공유됩니다.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={fillDummyIssues}>
                      <span>시연용 더미 데이터 5개 채우기</span>
                    </button>
                    <button 
                      className="btn btn-primary" 
                      disabled={issues.length < 5} 
                      onClick={() => setStep(2)}
                      style={issues.length >= 5 ? { backgroundColor: 'var(--point-color)' } : {}}
                    >
                      <span>AI 분석 및 상담 이론 추천 {issues.length >= 5 ? '→' : '(5개 필요)'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{ 
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                  borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.95rem'
                }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: issues.length >= 5 ? 'var(--point-color)' : 'var(--highlight-color)', animation: 'pulseWait 1.5s infinite' }} />
                  <span>수집된 고민 수: <b>{issues.length}</b>개</span>
                </div>

                {/* Grid display of post-its */}
                {issues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '24px', border: '1.5px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💭</span>
                    <h3>아직 접수된 고민이 없습니다.</h3>
                    <p>학생 화면에서 고민을 제출하거나 더미 데이터를 채워 보세요.</p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                    gap: '1.25rem' 
                  }}>
                    {issues.map((issue) => (
                      <div key={issue.id} className="postit-card animate-pop-up">
                        <div>
                          <span className="postit-tag">익명 집단원 {issue.emoji}</span>
                          <p style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>{issue.text}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* STUDENT STEP 1 */
              <div style={{ maxWidth: '550px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                  borderRadius: '24px', padding: '2rem 1.5rem', boxShadow: 'var(--shadow-md)'
                }}>
                  <h2 style={{ fontSize: '1.4rem', textAlign: 'center', marginBottom: '1.5rem' }}>나의 고민 익명으로 등록하기</h2>
                  
                  {submitSuccess && (
                    <div style={{
                      backgroundColor: 'rgba(168, 213, 194, 0.2)', color: 'var(--text-color)',
                      border: '1px solid var(--point-color)', padding: '0.75rem 1rem', borderRadius: '12px',
                      fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 700
                    }}>
                      고민이 상담 선생님 보드로 실시간 전송되었습니다!
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        내 감정 날씨 선택하기
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        {['😭', '😕', '😐', '🙂', '😊'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setSelectedEmoji(emoji)}
                            style={{
                              flex: 1, padding: '0.6rem 0.25rem', fontSize: '1.5rem', borderRadius: '12px',
                              border: selectedEmoji === emoji ? '2px solid var(--point-color)' : '2px solid transparent',
                              backgroundColor: selectedEmoji === emoji ? 'rgba(168, 213, 194, 0.15)' : 'var(--bg-color)',
                              cursor: 'pointer', transition: 'var(--transition)'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        고민 내용
                      </label>
                      <textarea
                        value={studentIssueText}
                        onChange={(e) => {
                          setStudentIssueText(e.target.value);
                          setSubmitSuccess(false);
                        }}
                        placeholder="요즘 나를 가장 힘들게 하는 대인관계, 학업, 혹은 감정 조절의 어려움이 무엇인가요? 솔직하게 작성해 주세요."
                        style={{
                          width: '100%', height: '150px', padding: '1rem', borderRadius: '12px',
                          border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)',
                          fontFamily: 'var(--font-family)', fontSize: '0.95rem', resize: 'none', outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      disabled={!studentIssueText.trim()}
                      onClick={() => {
                        addIssue(studentIssueText.trim(), selectedEmoji);
                        setStudentIssueText('');
                        setSubmitSuccess(true);
                      }}
                      style={{ width: '100%', padding: '1rem' }}
                    >
                      <span>익명으로 고민 올리기</span>
                    </button>
                  </div>
                </div>

                <div style={{
                  textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)'
                }}>
                  집단원들이 고민을 다 올릴 때까지 대기해 주세요. 5개 이상의 고민이 쌓이면 선생님이 다음 단계로 이동합니다.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            STEP 2: AI 상담 이론 추천 (Step2AiMatcher)
           ==================================================== */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
            {role === 'teacher' ? (
              /* TEACHER STEP 2 */
              <div style={{
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)'
              }}>
                {matchingStep === 0 ? (
                  /* LOADING PHASE (3 SECONDS) */
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{
                      display: 'inline-block', width: '50px', height: '50px', 
                      borderRadius: '50%', border: '4px solid var(--border-color)',
                      borderTopColor: 'var(--point-color)', animation: 'rotateDashed 1s linear infinite',
                      marginBottom: '1.5rem'
                    }} />
                    <h3 style={{ fontSize: '1.4rem' }}>고민 키워드를 분석하는 중입니다...</h3>
                    <p style={{ color: 'var(--text-muted)' }}>집단원들이 업로드한 고민들 속 정서 유형과 대처방식을 분석하고 있습니다.</p>

                    {/* Sequential keyword reveal */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                      {keywords.map((kw, i) => {
                        const isRevealed = revealedKeywords.includes(kw);
                        return (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.85rem', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '20px',
                              backgroundColor: isRevealed ? 'rgba(168, 213, 194, 0.15)' : 'rgba(74,74,74,0.05)',
                              color: isRevealed ? 'var(--text-color)' : 'transparent',
                              border: '1px solid',
                              borderColor: isRevealed ? 'var(--point-color)' : 'transparent',
                              transition: 'all 0.4s ease'
                            }}
                          >
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* RECOMMENDATION CARDS */
                  <div className="animate-fade-in">
                    <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                      AI 추천 상담 이론 & 솔루션 매칭
                    </h2>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                      분석 결과 집단원들의 <b>감정 취약성 및 대인관계 갈등</b> 비율이 높습니다. 아래 기법을 추천합니다.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* OPTION 1: DBT (HIGHLIGHTED & SELECTED TRIGGER) */}
                      <div 
                        onClick={() => selectTheory('변증법적 행동치료 (DBT)')}
                        style={{
                          backgroundColor: 'var(--card-bg)', border: '2.5px solid var(--point-color)',
                          borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
                          position: 'relative', transition: 'var(--transition)',
                          boxShadow: '0 4px 15px rgba(168, 213, 194, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 213, 194, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 213, 194, 0.2)';
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '-12px', left: '1.5rem',
                          backgroundColor: 'var(--point-color)', fontSize: '0.75rem', fontWeight: 700,
                          padding: '0.2rem 0.8rem', borderRadius: '20px'
                        }}>
                          추천도 94% • 최적 맞춤 솔루션
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>변증법적 행동치료 (DBT)</h3>
                          <span style={{ fontSize: '0.9rem', color: 'var(--point-dark)', fontWeight: 700 }}>이 기법 선택하기 →</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                          정서 조절이 미숙하거나 심한 인지적 왜곡, 관계 갈등에 대처하기 위해 <b>TIPP 호흡법, 감정온도 조절, STOP 자각 성찰</b>을 결합한 통합적 중재 프로그램입니다.
                        </p>
                      </div>

                      {/* OPTION 2: CBT */}
                      <div style={{
                        backgroundColor: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
                        borderRadius: '16px', padding: '1.5rem', opacity: 0.85
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-muted)' }}>인지행동치료 (CBT)</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>매칭률 65%</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                          생각(인지)의 오류를 찾아 행동의 긍정적인 변화를 유도하는 전형적인 방법입니다. 감정 조절이 급박한 현장 집단원에게는 비교적 인지 작업의 시간이 더 많이 소요됩니다.
                        </p>
                      </div>

                      {/* OPTION 3: SFBT */}
                      <div style={{
                        backgroundColor: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
                        borderRadius: '16px', padding: '1.5rem', opacity: 0.85
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-muted)' }}>해결중심 단기치료 (SFBT)</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>매칭률 58%</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                          예외 질문과 기적 질문을 통해 원인이 아닌 해결방안에 단기적으로 집중하는 치료 기법입니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STUDENT STEP 2 */
              <div style={{
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: '24px', padding: '3rem 2rem', boxShadow: 'var(--shadow-md)',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', 
                  backgroundColor: 'rgba(244, 194, 161, 0.15)', marginBottom: '1.5rem',
                  animation: 'pulseWait 2s infinite ease-in-out'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>⏳</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>선생님이 집단상담 방법을 매칭하고 있어요</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                  집단원들의 고민 데이터 분석 결과를 기반으로 한 최적의 DBT 툴킷 세션을 준비 중입니다. 잠시만 기다리시면 자동으로 동기화됩니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            STEP 3: 라이브 세션 (Step3LiveSession)
           ==================================================== */}
        {step === 3 && (
          <div style={{ width: '100%' }}>
            {role === 'teacher' ? (
              /* TEACHER STEP 3 */
              <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '1.5rem' }}>
                
                {/* Left Panel - Control panel */}
                <div style={{
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                  gap: '1.2rem', minHeight: '520px', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', margin: 0 }}>DBT 툴킷 대시보드</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(168, 213, 194, 0.2)' }}>
                        실시간 제어반
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                      아래 기법 탭을 클릭하여 학생 화면의 레이아웃을 즉시 실시간 원격 제어합니다.
                    </p>

                    {/* Tabs layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <button
                        className="btn"
                        onClick={() => setActiveToolkit('tipp')}
                        style={{
                          justifyContent: 'flex-start', padding: '0.9rem 1rem', borderRadius: '12px',
                          border: activeToolkit === 'tipp' ? '2.5px solid var(--point-color)' : '1px solid var(--border-color)',
                          backgroundColor: activeToolkit === 'tipp' ? 'rgba(168, 213, 194, 0.15)' : 'var(--bg-color)',
                          color: 'var(--text-color)'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🕒</span>
                        <div style={{ textAlign: 'left', marginLeft: '0.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>1. TIPP 호흡 타이머</div>
                        </div>
                      </button>

                      <button
                        className="btn"
                        onClick={() => setActiveToolkit('temperature')}
                        style={{
                          justifyContent: 'flex-start', padding: '0.9rem 1rem', borderRadius: '12px',
                          border: activeToolkit === 'temperature' ? '2.5px solid var(--point-color)' : '1px solid var(--border-color)',
                          backgroundColor: activeToolkit === 'temperature' ? 'rgba(168, 213, 194, 0.15)' : 'var(--bg-color)',
                          color: 'var(--text-color)'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🌡️</span>
                        <div style={{ textAlign: 'left', marginLeft: '0.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>2. 감정 온도계</div>
                        </div>
                      </button>

                      <button
                        className="btn"
                        onClick={() => setActiveToolkit('stop')}
                        style={{
                          justifyContent: 'flex-start', padding: '0.9rem 1rem', borderRadius: '12px',
                          border: activeToolkit === 'stop' ? '2.5px solid var(--point-color)' : '1px solid var(--border-color)',
                          backgroundColor: activeToolkit === 'stop' ? 'rgba(168, 213, 194, 0.15)' : 'var(--bg-color)',
                          color: 'var(--text-color)'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>🧭</span>
                        <div style={{ textAlign: 'left', marginLeft: '0.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>3. STOP 성찰 카드</div>
                        </div>
                      </button>
                    </div>

                    {/* Guideline description card */}
                    <div style={{
                      backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                      borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', lineHeight: '1.45'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-color)' }}>💡 가이드라인</div>
                      {activeToolkit === 'tipp' && (
                        <span>
                          학생들이 긴장 상태에서 벗어날 수 있게 4초 들이쉬고 6초 내쉬는 호흡 가이드(60초)를 제공합니다. 학생들이 타이머에 맞추어 깊은 복식호흡을 할 수 있도록 현장에서 직접 지도해 주세요.
                        </span>
                      )}
                      {activeToolkit === 'temperature' && (
                        <span>
                          집단원들 스스로 주관적인 감정의 열기를 1~100 사이의 슬라이더를 밀어 제출하도록 안내합니다. 우측에 표시되는 <b>실시간 학급 평균 온도</b>를 바탕으로 감정 환기 필요성을 확인해 보세요.
                        </span>
                      )}
                      {activeToolkit === 'stop' && (
                        <span>
                          S(멈춤)-T(물러서기)-O(관찰)-P(현명한대처) 4개 가이드라인 카드를 차례대로 넘기면서 집단원 개개인이 충동적인 생각을 객관화하도록 이끌어 줍니다.
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    className="btn btn-peach" 
                    onClick={endSession}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                  >
                    <span>세션 종료하고 기록 저장 →</span>
                  </button>
                </div>

                {/* Right Panel - Realtime interaction feed */}
                <div style={{
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                  gap: '1rem', minHeight: '520px'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>집단원 실시간 응원 보드</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '20px', backgroundColor: 'var(--highlight-color)' }}>
                        실시간 피드백
                      </span>
                    </h3>
                  </div>

                  {/* Realtime Thermometer calculations in teacher board */}
                  {activeToolkit === 'temperature' && (
                    <div style={{
                      padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '12px',
                      border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', animation: 'fadeIn 0.3s ease'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>현재 학급 평균 감정 온도</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>{getAverageTemp()}°C</div>
                      </div>
                      <div style={{ flexGrow: 1, marginLeft: '2rem', height: '12px', backgroundColor: 'rgba(74,74,74,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${getAverageTemp()}%`, height: '100%', background: 'linear-gradient(90deg, #A8D5C2, #F4C2A1)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Sticker feed grid */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stickers.length === 0 ? (
                      <div style={{
                        flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem'
                      }}>
                        <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</span>
                        <p style={{ fontSize: '0.85rem' }}>집단원이 전송한 응원 스티커(타당화 메시지)가<br />이곳에 실시간 팝업 애니메이션과 함께 누적됩니다.</p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '0.75rem', contentVisibility: 'auto'
                      }}>
                        {stickers.map((sticker) => (
                          <div
                            key={sticker.id}
                            className="animate-pop-up"
                            style={{
                              backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                              borderRadius: '12px', padding: '0.8rem 0.5rem', display: 'flex',
                              flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <span style={{ fontSize: '2rem' }}>{sticker.emoji}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {sticker.emoji === '💚' && '타당해'}
                              {sticker.emoji === '🌿' && '함께할게'}
                              {sticker.emoji === '✨' && '토닥토닥'}
                              {sticker.emoji === '🌸' && '다잘될거야'}
                              {sticker.emoji === '☁️' && '맑음응원'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* STUDENT STEP 3 */
              <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', position: 'relative' }}>
                <div style={{
                  backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '24px', padding: '2rem 1.5rem', boxShadow: 'var(--shadow-md)',
                  minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  
                  {/* DYNAMIC TOOLKIT RENDERING */}
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    
                    {/* TOOL 1: TippTimer */}
                    {activeToolkit === 'tipp' && (
                      <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>TIPP 호흡법 훈련</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                          들이마실 때 서서히 늘어나고, 내쉴 때 줄어드는 원을 바라보며 깊게 호흡합니다.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', position: 'relative' }}>
                          {/* Pulsing Breathing Circle */}
                          <div style={{
                            width: (breathSeconds > 0 && breathingActive) ? (currentBreathCycle <= 4 ? `${120 + ((currentBreathCycle - 1) * 20)}px` : `${200 - ((currentBreathCycle - 5) * 16)}px`) : '150px',
                            height: (breathSeconds > 0 && breathingActive) ? (currentBreathCycle <= 4 ? `${120 + ((currentBreathCycle - 1) * 20)}px` : `${200 - ((currentBreathCycle - 5) * 16)}px`) : '150px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--point-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'width 1s ease, height 1s ease, background-color 0.3s',
                            boxShadow: '0 8px 30px rgba(168, 213, 194, 0.4)',
                            color: 'var(--text-color)',
                            fontWeight: 700
                          }}>
                            {breathingActive && breathSeconds > 0 ? (
                              <>
                                <span style={{ fontSize: '1.25rem' }}>
                                  {currentBreathCycle <= 4 ? '들이쉬어요 (흡)' : '내쉬어요 (호)'}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'normal', marginTop: '4px' }}>
                                  {currentBreathCycle <= 4 ? `${5 - currentBreathCycle}초` : `${11 - currentBreathCycle}초`}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '1.1rem' }}>
                                {breathSeconds === 0 ? '훈련 완료!' : '호흡 대기 중'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-color)' }}>
                            남은 시간: {breathSeconds}초
                          </div>
                          {breathSeconds > 0 && (
                            <button
                              className="btn btn-outline"
                              onClick={() => setBreathingActive(!breathingActive)}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            >
                              {breathingActive ? '정지' : '시작'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TOOL 2: EmotionSlider */}
                    {activeToolkit === 'temperature' && (
                      <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>감정 온도계 자가측정</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                          현재 본인이 느끼는 불쾌감이나 스트레스 수치의 온도를 조절하여 제출해 보세요.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                          {/* Animated expression */}
                          <div style={{ height: '70px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: '3rem', animation: 'bounceEmoji 1.5s infinite ease-in-out', display: 'inline-block' }}>
                              {studentTemp >= 80 && '😭'}
                              {studentTemp >= 55 && studentTemp < 80 && '😕'}
                              {studentTemp >= 35 && studentTemp < 55 && '😐'}
                              {studentTemp < 35 && '😴'}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color)', marginTop: '0.5rem' }}>
                              감정 상태: {studentTemp}°C (
                              {studentTemp >= 80 && '매우 고조됨'}
                              {studentTemp >= 55 && studentTemp < 80 && '불안하고 답답함'}
                              {studentTemp >= 35 && studentTemp < 55 && '비교적 평온함'}
                              {studentTemp < 35 && '무기력하거나 가라앉음'}
                              )
                            </span>
                          </div>

                          {/* HTML Slider input */}
                          <div style={{ width: '100%', padding: '1rem 0' }}>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={studentTemp}
                              onChange={(e) => {
                                setStudentTemp(Number(e.target.value));
                                setIsTempSubmitted(false);
                              }}
                              style={{
                                width: '100%', height: '12px', borderRadius: '10px',
                                background: 'linear-gradient(to right, #A8D5C2, #F4C2A1, #ef4444)',
                                outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none'
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 700 }}>
                              <span>0°C (차분함/무기력)</span>
                              <span>50°C (보통)</span>
                              <span>100°C (과열/격분)</span>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setIsTempSubmitted(true);
                              // Emit sticker to let teacher see interaction
                              sendSticker('🌡️');
                            }}
                            disabled={isTempSubmitted}
                            style={{ padding: '0.8rem 1.5rem', borderRadius: '10px' }}
                          >
                            <span>{isTempSubmitted ? '제출 완료 (평균에 반영됨)' : '내 감정 온도 제출하기'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TOOL 3: StopCards */}
                    {activeToolkit === 'stop' && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>STOP 단계별 충동 조절 훈련</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {/* S Card */}
                          {stopCardStep === 'S' && (
                            <div className="animate-pop-up" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 700 }}>S</span>
                                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Stop (잠시 멈춤)</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.5', margin: 0 }}>
                                  감정에 휘둘려 즉각 말하거나 행동하기 전에 가만히 동작을 멈춥니다. 일촉즉발의 고조 국면을 강제로 보류합니다.
                                </p>
                              </div>
                              <button className="btn btn-peach" onClick={() => setStopCardStep('T')} style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                                <span>다음 단계로 →</span>
                              </button>
                            </div>
                          )}

                          {/* T Card */}
                          {stopCardStep === 'T' && (
                            <div className="animate-pop-up" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 700 }}>T</span>
                                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Take a step back (물러서기)</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.5', margin: 0 }}>
                                  상황으로부터 한 걸음 물리적으로, 혹은 정서적으로 거리를 둡니다. 심호흡을 깊게 하거나 차가운 물 한 모금을 마셔 봅니다.
                                </p>
                              </div>
                              <button className="btn btn-peach" onClick={() => setStopCardStep('O')} style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                                <span>다음 단계로 →</span>
                              </button>
                            </div>
                          )}

                          {/* O Card */}
                          {stopCardStep === 'O' && (
                            <div className="animate-pop-up" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 700 }}>O</span>
                                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Observe (관찰하기)</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.5', margin: 0 }}>
                                  내 어깨의 긴장, 가쁜 숨소리, 머릿속에서 도는 분노 어린 생각 등 내면과 외부의 사실들을 있는 그대로 차분히 바라봅니다.
                                </p>
                              </div>
                              <button className="btn btn-peach" onClick={() => setStopCardStep('P')} style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                                <span>다음 단계로 →</span>
                              </button>
                            </div>
                          )}

                          {/* P Card */}
                          {stopCardStep === 'P' && (
                            <div className="animate-pop-up" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 700 }}>P</span>
                                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Proceed mindfully (마음챙김 행동)</h4>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: '1.5', margin: 0 }}>
                                  감정에 기댄 자동적인 반응이 아닌, 나에게 장기적으로 도움이 되는 가장 현명하고 평화적인 해결 행동을 취합니다.
                                </p>
                              </div>
                              <button className="btn btn-primary" onClick={() => setStopCardStep('COMPLETE')} style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                                <span>전체 과정 완수! ✓</span>
                              </button>
                            </div>
                          )}

                          {/* COMPLETE CARD */}
                          {stopCardStep === 'COMPLETE' && (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                              <span style={{ fontSize: '3rem' }}>🎉</span>
                              <h4 style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>STOP 단계적 성찰을 완수했습니다!</h4>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>차분해진 내 감정을 느끼고 아래 스티커를 발송해 격려해 보세요.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STICKER TRIGGER AREA (AFTER COMPLETION / STATE ENABLED) */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                      <button className="btn" onClick={() => handleStickerClick('💚')} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '1.4rem' }}>💚</button>
                      <button className="btn" onClick={() => handleStickerClick('🌿')} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '1.4rem' }}>🌿</button>
                      <button className="btn" onClick={() => handleStickerClick('✨')} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '1.4rem' }}>✨</button>
                      <button className="btn" onClick={() => handleStickerClick('🌸')} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '1.4rem' }}>🌸</button>
                      <button className="btn" onClick={() => handleStickerClick('☁️')} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', fontSize: '1.4rem' }}>☁️</button>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--point-dark)', marginTop: '0.5rem', fontWeight: 700 }}>
                      스티커를 눌러 선생님 보드로 응원 메시지를 발송하세요!
                    </div>
                  </div>
                  
                </div>

                {/* Floating Emojis on Student Screen */}
                {localFloatingStickers.map(s => (
                  <span
                    key={s.id}
                    className="floating-sticker"
                    style={{ left: `${s.left}%` }}
                  >
                    {s.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            STEP 4: 기록실 (Step4Archiving)
           ==================================================== */}
        {step === 4 && (
          <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', margin: 0 }}>집단상담 기록실</h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  이전 및 최근 완수된 라이브 집단상담 기록들을 조회하고 데이터베이스 파일로 내보냅니다.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleExportLogs} disabled={sessionLogs.length === 0}>
                  <span>기록 내보내기 (JSON)</span>
                </button>
                <button className="btn btn-peach" onClick={resetAll}>
                  <span>새 세션 시작하기 (1단계로)</span>
                </button>
              </div>
            </div>

            {/* List logs */}
            {sessionLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '24px', border: '1.5px dashed var(--border-color)' }}>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>📂</span>
                <h3>상담 기록실이 비어 있습니다.</h3>
                <p>활동을 진행하고 종료를 누르면 완성된 세션 기록 리스트가 여기에 차곡차곡 보존됩니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                      borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)',
                      display: 'flex', flexDirection: 'column', gap: '0.75rem',
                      animation: 'fadeIn 0.4s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ID: {log.id}</span>
                        <h3 style={{ fontSize: '1.15rem', margin: '0.1rem 0 0 0' }}>{log.theory}</h3>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        📅 {log.date}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>익명 수집 고민 수:</span> <b>{log.issueCount}개</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>받은 응원 스티커 수:</span> <b>{log.stickerCount}개</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>사용된 핵심 툴킷:</span>{' '}
                        {log.toolkitsUsed.map((t, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                            backgroundColor: 'rgba(168, 213, 194, 0.25)', marginLeft: '0.25rem',
                            fontWeight: 700
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', margin: '0.25rem 0 0 0', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      📝 <b>요약:</b> {log.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
