document.addEventListener('DOMContentLoaded', () => {
  // START OF DOMContentLoaded LISTENER
  console.log("DOM Content Loaded. Initializing Baxter's Year 6 script...");

  // --- Configuration & Constants ---
  const SESSION_DURATION_SECONDS = 30 * 60; // 30 minutes
  // const SESSION_DURATION_SECONDS = 30; // Use a short duration for testing
  const MOTIVATIONAL_MESSAGES = [
    // Same messages can be used
    "Keep pushing, you're doing great!",
    'Every problem solved makes you stronger!',
    'Focus and determination lead to success!',
    'Believe in your ability to figure it out!',
    'Mistakes are learning opportunities. Keep trying!',
    "You've got this, Baxter!",
    'One question at a time.',
    'Embrace the challenge!',
    'Math power activated!',
    'Stay sharp, stay focused!',
    'Precision and practice make perfect.',
    'Excellent effort!',
    'Keep that brain working!',
  ];
  // --- YEAR 6 CURRICULUM CATEGORIES ---
  const categories = {
    number: {
      name: 'Number & Place Value',
      skills: [
        { name: 'Identify Place Value (Large Numbers)', generator: generatePlaceValueLarge, checker: checkNumericAnswer },
        { name: 'Multiply/Divide by Powers of 10', generator: generateMultDivPowers10, checker: checkNumericAnswer },
        { name: 'Addition/Subtraction (Large Numbers)', generator: generateAddSubLarge, checker: checkNumericAnswer }, // Subtraction IS included here
        { name: 'Multiplication (e.g., 3-digit x 2-digit)', generator: generateMultiplicationMultiDigit, checker: checkNumericAnswer },
        { name: 'Division (e.g., 3-digit by 1-digit)', generator: generateDivisionSimple, checker: checkNumericAnswer }, // Division IS included here
        { name: 'Prime/Composite Numbers', generator: generatePrimeComposite, checker: checkExactStringAnswer }, // Answer 'prime' or 'composite'
      ],
    },
    fractions_decimals: {
      name: 'Fractions & Decimals',
      skills: [
        { name: 'Compare Fractions (Related Denominators)', generator: generateCompareFractionsRelated, checker: checkExactStringAnswer }, // Answer '>', '<', or '='
        { name: 'Add/Sub Fractions (Related Denominators)', generator: generateAddSubFractionsRelated, checker: checkFractionAnswer },
        { name: 'Multiply Decimals by Whole Number', generator: generateDecimalMultWhole, checker: checkNumericAnswerTolerance(0.001) },
        { name: 'Fraction/Decimal Conversion (Simple)', generator: generateFracDecConversionSimple, checker: checkNumericAnswerTolerance(0.001) }, // e.g., 1/2=0.5, 1/4=0.25
        { name: 'Percentage of Quantity (Simple %)', generator: generatePercentageOfQuantitySimple, checker: checkNumericAnswer }, // e.g., 10%, 25%, 50%
      ],
    },
    patterns_algebra: {
      name: 'Patterns & Algebra',
      skills: [
        { name: 'Continue Number Pattern (Addition/Subtraction)', generator: generatePatternAddSub, checker: checkNumericAnswer },
        { name: 'Find Rule for Pattern (Simple)', generator: generateFindRuleSimple, checker: checkExactStringAnswer }, // e.g. 'add 3', 'multiply by 2'
        { name: 'Order of Operations (BODMAS/PEMDAS)', generator: generateOrderOfOpsSimple, checker: checkNumericAnswer },
      ],
    },
    measurement: {
      name: 'Measurement',
      skills: [
        { name: 'Convert Length Units (m, cm, mm)', generator: generateConvertLength, checker: checkNumericAnswer },
        { name: 'Convert Mass Units (kg, g)', generator: generateConvertMass, checker: checkNumericAnswer },
        { name: 'Calculate Perimeter (Rectangle)', generator: generatePerimeterRectangleSVG, checker: checkNumericAnswer },
        { name: 'Calculate Area (Rectangle)', generator: generateAreaRectangleSVG, checker: checkNumericAnswer },
        { name: 'Calculate Area (Triangle - SVG)', generator: generateAreaTriangleSVG, checker: checkNumericAnswerTolerance(0.1) }, // Corrected function included below
        { name: 'Elapsed Time (Hours/Minutes)', generator: generateElapsedTime, checker: checkExactStringAnswer }, // Corrected function included below
        { name: 'Read 24-Hour Time', generator: generateRead24HourTime, checker: checkExactStringAnswer },
      ],
    },
    geometry: {
      name: 'Geometry',
      skills: [
        { name: 'Identify Angle Type (SVG)', generator: generateAngleTypeSVG, checker: checkExactStringAnswer }, // Corrected function included below
        { name: 'Angles on a Point/Line (Simple)', generator: generateAnglesPointLineSimpleSVG, checker: checkNumericAnswer },
        { name: 'Coordinates (First Quadrant)', generator: generateCoordinatesFirstQuadrant, checker: checkExactStringAnswer }, // Corrected function included below
        { name: 'Describe Transformation (Simple)', generator: generateDescribeTransformationSimple, checker: checkExactStringAnswer }, // Corrected function included below
      ],
    },
    statistics_probability: {
      name: 'Statistics & Probability',
      skills: [
        { name: 'Interpret Column Graph (Simple)', generator: generateInterpretColumnGraph, checker: checkNumericAnswer }, // Corrected function included below
        { name: 'Calculate Simple Probability (Fraction)', generator: generateSimpleProbabilityFraction, checker: checkFractionAnswer },
        { name: 'List Outcomes', generator: generateListOutcomes, checker: checkExactStringAnswer }, // Corrected function included below
      ],
    },
  };

  // --- DOM Elements (Check existence immediately) ---
  let essentialElementsAvailable = true;
  const getElement = (id, isEssential = true) => {
    const element = document.getElementById(id);
    if (!element && isEssential) {
      console.error(`CRITICAL ERROR: Essential DOM element with ID "${id}" not found!`);
      essentialElementsAvailable = false;
    } else if (!element) {
      console.warn(`Warning: Non-essential DOM element with ID "${id}" not found.`);
    }
    return element;
  };
  const homeViewCheck = getElement('home-view');
  const quizViewCheck = getElement('quiz-view');
  const sessionEndViewCheck = getElement('session-end-view');
  const startSessionBtnCheck = getElement('start-session-btn');
  const canvasElementCheck = getElement('progressChartCanvas');
  const progressChartCanvas = canvasElementCheck ? canvasElementCheck.getContext('2d') : null;
  const themeToggle = getElement('checkbox');

  // --- State Variables ---
  let currentQuestion = null;
  let progress = {};
  let progressChart = null;
  let currentView = 'home-view';
  let sessionTimerInterval = null;
  let sessionTimeRemaining = SESSION_DURATION_SECONDS;
  let currentSessionQuestionsCompleted = 0;
  let previousSessionQuestionsCompleted = 0;
  let isSessionActive = false;

  // --- Halt initialization if essential elements are missing ---
  if (!essentialElementsAvailable) {
    displayInitializationError(new Error('Essential HTML structure is missing.'));
    return;
  }
  console.log('Essential structural DOM elements verified.');

  // --- Initialization ---
  try {
    progress = loadProgress();
    previousSessionQuestionsCompleted = loadPreviousSessionCount();
    console.log('Loaded Progress:', JSON.parse(JSON.stringify(progress)));
    console.log('Loaded Previous Session Count:', previousSessionQuestionsCompleted);
    initializeTheme();
    setActiveView('home-view');
    console.log('Initialization sequence complete.');
  } catch (error) {
    console.error('Error during initialization sequence:', error);
    displayInitializationError(error);
  }

  // --- Event Listeners ---
  if (startSessionBtnCheck) {
    startSessionBtnCheck.addEventListener('click', startSession);
    console.log('Attached listener to startSessionBtn.');
  } else {
    console.error('Start Session Button not found.');
  }
  const submitBtn = document.getElementById('submit-answer');
  if (submitBtn) submitBtn.addEventListener('click', handleSubmitAnswer);
  const answerInput = document.getElementById('user-answer');
  if (answerInput) answerInput.addEventListener('keypress', handleEnterKey);
  const nextBtn = document.getElementById('next-question');
  if (nextBtn) nextBtn.addEventListener('click', () => displayNextQuestion(true));
  if (themeToggle) themeToggle.addEventListener('change', handleThemeToggle);
  const backBtn = document.getElementById('back-to-home-btn');
  if (backBtn) backBtn.addEventListener('click', () => setActiveView('home-view'));
  const endEarlyBtn = document.getElementById('end-session-early-btn');
  if (endEarlyBtn) {
    endEarlyBtn.addEventListener('click', () => {
      if (isSessionActive && confirm('Finish session now?')) {
        endSession();
      }
    });
  }

  // --- Utility Functions ---
  function displayInitializationError(error) {
    console.error('Displaying initialization error:', error);
    const body = document.querySelector('body');
    if (body) {
      body.innerHTML = `<div style="padding:20px;text-align:center;color:red;"><h1>Error Initializing</h1><p>${error.message}</p></div>`;
    }
  }

  // --- View Management ---
  function setActiveView(viewId) {
    console.log(`\n--- setActiveView called with viewId: "${viewId}" (Type: ${typeof viewId}) ---`);
    const views = document.querySelectorAll('.view');
    let viewFound = false;
    if (!views || views.length === 0) {
      console.error("CRITICAL: No '.view' elements found.");
      displayInitializationError(new Error('App views missing.'));
      return;
    }
    console.log(`Found ${views.length} elements with class 'view'. Iterating...`);
    views.forEach((view, index) => {
      const currentViewId = view.id;
      console.log(`[Iteration ${index}] Checking view ID: "${currentViewId}"`);
      const areIdsEqual = currentViewId === viewId;
      console.log(`[Iteration ${index}] Comparing "${currentViewId}" === "${viewId}" : Result = ${areIdsEqual}`);
      if (areIdsEqual) {
        console.log(`%c[Iteration ${index}] MATCH FOUND for "${viewId}". Adding active-view.`, 'color: green; font-weight: bold;');
        view.classList.add('active-view');
        viewFound = true;
      } else {
        view.classList.remove('active-view');
      }
    });
    if (viewFound) {
      currentView = viewId;
      console.log(`%cSuccessfully set currentView to: "${currentView}"`, 'color: blue;');
      if (viewId === 'home-view') {
        console.log('Rendering progress report.');
        renderProgressReport();
        document.body.style.overflow = 'hidden';
      } else if (viewId === 'quiz-view') {
        console.log('Quiz view activated.');
        document.body.style.overflow = 'hidden';
      } else if (viewId === 'session-end-view') {
        console.log('Session end view activated.');
        const summaryCountEl = document.getElementById('session-summary-count');
        if (summaryCountEl) summaryCountEl.textContent = currentSessionQuestionsCompleted;
        else console.warn('sessionSummaryCount not found.');
        document.body.style.overflow = 'hidden';
      }
    } else {
      console.error(`View element NOT found for ID: "${viewId}". Fallback.`);
      const homeViewFallback = document.getElementById('home-view');
      if (homeViewFallback) {
        console.warn("Executing fallback: Forcing 'home-view'.");
        views.forEach((v) => v.classList.remove('active-view'));
        homeViewFallback.classList.add('active-view');
        currentView = 'home-view';
        renderProgressReport();
      } else {
        console.error('CRITICAL: Fallback failed.');
        displayInitializationError(new Error('Cannot find views.'));
      }
    }
    console.log(`--- setActiveView finished for ID: ${viewId} ---\n`);
  }

  // --- Session Management ---
  function startSession() {
    const prevCountDisplay = document.getElementById('previous-session-count');
    const currentCountDisplay = document.getElementById('current-session-count');
    try {
      console.log('Start Session clicked!');
      isSessionActive = true;
      currentSessionQuestionsCompleted = 0;
      sessionTimeRemaining = SESSION_DURATION_SECONDS;
      if (prevCountDisplay) prevCountDisplay.textContent = previousSessionQuestionsCompleted;
      else console.warn('prevCountDisplay not found.');
      console.log('Session vars reset.');
      updateTimerDisplay();
      if (currentCountDisplay) currentCountDisplay.textContent = '0';
      else console.warn('currentCountDisplay not found.');
      displayMotivationalMessage();
      console.log('Session displays updated.');
      clearInterval(sessionTimerInterval);
      sessionTimerInterval = setInterval(updateTimer, 1000);
      console.log('Timer started.');
      setActiveView('quiz-view');
      displayNextQuestion(false);
      console.log('Attempted switch to quiz.');
    } catch (error) {
      console.error('Error starting session:', error);
      alert(`Error starting: ${error.message}.`);
      setActiveView('home-view');
      isSessionActive = false;
      clearInterval(sessionTimerInterval);
    }
  }
  function endSession() {
    if (!isSessionActive) return;
    console.log('Ending session...');
    isSessionActive = false;
    clearInterval(sessionTimerInterval);
    savePreviousSessionCount(currentSessionQuestionsCompleted);
    saveProgress();
    setActiveView('session-end-view');
  }
  function updateTimer() {
    if (!isSessionActive) {
      clearInterval(sessionTimerInterval);
      return;
    }
    sessionTimeRemaining--;
    updateTimerDisplay();
    if (sessionTimeRemaining <= 0) {
      console.log('Timer zero.');
      endSession();
    }
    if (sessionTimeRemaining > 0 && sessionTimeRemaining % 45 === 0) {
      displayMotivationalMessage();
    }
  }
  function updateTimerDisplay() {
    const timerDisp = document.getElementById('timer-display');
    if (!timerDisp) return;
    const minutes = Math.floor(sessionTimeRemaining / 60);
    const seconds = sessionTimeRemaining % 60;
    timerDisp.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  function displayMotivationalMessage() {
    const motivationEl = document.getElementById('motivational-message');
    if (!motivationEl) return;
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    motivationEl.textContent = MOTIVATIONAL_MESSAGES[randomIndex];
  }

  // --- Quiz Logic ---
  function getAdaptiveCategoryOrder() {
    const cIds = Object.keys(categories);
    return cIds.sort((a, b) => {
      const mA = progress[a]?.mastery ?? 0;
      const mB = progress[b]?.mastery ?? 0;
      const aA = progress[a]?.attempted ?? 0;
      const aB = progress[b]?.attempted ?? 0;
      if (aA < 5 && aB >= 5) return -1;
      if (aB < 5 && aA >= 5) return 1;
      if (aA < 5 && aB < 5) {
        if (mA !== mB) return mA - mB;
        return aA - aB;
      }
      return mA - mB + (Math.random() - 0.5) * 0.01;
    });
  }
  function displayNextQuestion(isUserInitiatedNext) {
    const qTitle = document.getElementById('quiz-category-title'),
      qText = document.getElementById('question-text'),
      qDiag = document.getElementById('question-diagram'),
      qAns = document.getElementById('user-answer'),
      qSub = document.getElementById('submit-answer'),
      qNext = document.getElementById('next-question');
    if (!isSessionActive || !qTitle || !qText || !qDiag || !qAns || !qSub || !qNext) {
      console.error('DNQ: Missing DOM/inactive.');
      if (isSessionActive) endSession();
      return;
    }
    if (isUserInitiatedNext) displayMotivationalMessage();
    clearFeedback();
    qAns.value = '';
    qAns.disabled = false;
    qSub.classList.remove('hidden');
    qNext.classList.add('hidden');
    qDiag.innerHTML = '';
    const sortedCats = getAdaptiveCategoryOrder();
    if (Object.keys(categories).length === 0 || sortedCats.length === 0) {
      qTitle.textContent = 'Setup Needed';
      qText.textContent = 'Add skills.';
      return;
    }
    let catId = sortedCats[0],
      cat = categories[catId],
      att = 0;
    while ((!cat || !cat.skills || cat.skills.length === 0) && att < sortedCats.length) {
      console.warn(`Cat ${catId} invalid. Next.`);
      att++;
      if (att >= sortedCats.length) {
        qTitle.textContent = 'Error';
        qText.textContent = 'No questions.';
        return;
      }
      catId = sortedCats[att];
      cat = categories[catId];
    }
    if (!cat || !cat.skills || cat.skills.length === 0) {
      qTitle.textContent = 'Error';
      qText.textContent = 'No questions found.';
      return;
    }
    qTitle.textContent = `${cat.name} Practice`;
    const skillIdx = Math.floor(Math.random() * cat.skills.length);
    const skill = cat.skills[skillIdx];
    try {
      if (typeof skill.generator !== 'function') throw new Error(`Gen not fn for '${skill.name}'.`);
      const qData = skill.generator();
      if (qData === null) throw new Error(`Generator for '${skill.name}' returned null (intended skip).`);
      if (!qData || typeof qData.question === 'undefined' || typeof qData.answer === 'undefined' || typeof skill.checker !== 'function') throw new Error(`Data/checker issue for '${skill.name}'.`);
      currentQuestion = { categoryId: catId, skillIndex: skillIdx, questionText: qData.question, questionDiagramHTML: qData.diagram || '', correctAnswer: qData.answer, checker: skill.checker };
      qText.innerHTML = currentQuestion.questionText;
      qDiag.innerHTML = currentQuestion.questionDiagramHTML;
      const svgEl = qDiag.querySelector('svg');
      if (svgEl) {
        const bs = getComputedStyle(document.body);
        const ct = bs.getPropertyValue('--text-color');
        svgEl.style.stroke = ct;
        svgEl.querySelectorAll('text,tspan').forEach((t) => (t.style.fill = ct));
        svgEl.querySelectorAll('line,path,rect,circle').forEach((s) => {
          if (s.style.stroke !== 'none' && !s.getAttribute('stroke')) {
            s.style.stroke = 'currentColor';
          }
        });
      }
    } catch (error) {
      if (error.message.includes('returned null')) {
        console.log(`Skipping question: ${error.message}`);
        setTimeout(() => displayNextQuestion(false), 50);
        /* Get next question slightly delayed */ return;
      }
      console.error(`Error gen question ${catId}-${skill?.name || 'Unknown'}:`, error);
      qText.textContent = 'Oops! Error loading. Click Next.';
      qDiag.innerHTML = '';
      currentQuestion = null;
      qSub.classList.add('hidden');
      qNext.classList.remove('hidden');
    }
    try {
      qAns.focus();
    } catch (focusError) {
      console.warn('Focus failed:', focusError);
    }
  }
  function handleSubmitAnswer() {
    // *** CORRECTED VERSION ***
    const qAns = document.getElementById('user-answer');
    const qSub = document.getElementById('submit-answer');
    const qNext = document.getElementById('next-question');
    const qCount = document.getElementById('current-session-count');
    if (!currentQuestion || !isSessionActive || !qSub || !qNext || !qAns || !qCount) {
      console.error('Submit aborted: Missing elements/inactive.');
      return;
    }
    const uAns = qAns.value.trim();
    // Corrected Check for empty answers (allow 0)
    if (uAns === '' && currentQuestion.correctAnswer !== '0' && currentQuestion.correctAnswer !== 0) {
      console.log('Empty answer rejected.');
      return;
    }
    try {
      const isCorrect = currentQuestion.checker(uAns, currentQuestion.correctAnswer);
      updateOverallProgress(currentQuestion.categoryId, isCorrect);
      currentSessionQuestionsCompleted++;
      qCount.textContent = currentSessionQuestionsCompleted;
      showFeedback(isCorrect, currentQuestion.correctAnswer);
      qAns.disabled = true;
      qSub.classList.add('hidden');
      qNext.classList.remove('hidden');
      qNext.focus();
    } catch (checkerError) {
      console.error('Checker error:', checkerError);
      showFeedback(false, `Error checking answer.`);
      qAns.disabled = true;
      qSub.classList.add('hidden');
      qNext.classList.remove('hidden');
      try {
        qNext.focus();
      } catch (e) {}
    }
  }
  function handleEnterKey(e) {
    const qSub = document.getElementById('submit-answer'),
      qNext = document.getElementById('next-question');
    if (currentView !== 'quiz-view' || !isSessionActive) return;
    if (e.key === 'Enter') {
      if (qSub && !qSub.classList.contains('hidden')) {
        e.preventDefault();
        handleSubmitAnswer();
      } else if (qNext && !qNext.classList.contains('hidden')) {
        e.preventDefault();
        displayNextQuestion(true);
      }
    }
  }
  function showFeedback(isCorrect, correctAnswer) {
    const fText = document.getElementById('feedback-text'),
      fAnim = document.getElementById('correct-animation');
    if (!fText || !fAnim) return;
    let fMsg = '';
    if (isCorrect) {
      fMsg = 'Correct!';
    } else {
      let dA = correctAnswer;
      if (typeof dA === 'number') {
        dA = parseFloat(dA.toFixed(4));
      } else if (typeof dA === 'string' && dA.includes('/')) {
        dA = dA;
      } else if (dA === null || typeof dA === 'undefined') {
        dA = '[No Answer]';
      } else {
        dA = dA.toString();
      }
      fMsg = `Not quite! The answer was: ${dA}`;
    }
    fText.textContent = fMsg;
    fText.className = isCorrect ? 'correct' : 'incorrect';
    fAnim.classList.remove('hidden');
    fAnim.style.animation = 'none';
    requestAnimationFrame(() => {
      if (isCorrect) {
        fAnim.style.animation = 'pop-fade 0.8s ease-out forwards';
      } else {
        fAnim.classList.add('hidden');
      }
    });
  }
  function clearFeedback() {
    const fText = document.getElementById('feedback-text'),
      fAnim = document.getElementById('correct-animation');
    if (fText) {
      fText.textContent = '';
      fText.className = '';
    }
    if (fAnim) {
      fAnim.classList.add('hidden');
      fAnim.style.animation = 'none';
    }
  }

  // --- Progress Management ---
  function updateOverallProgress(categoryId, isCorrect) {
    if (!progress[categoryId]) {
      const n = categories[categoryId]?.name || categoryId;
      progress[categoryId] = { name: n, correct: 0, attempted: 0, mastery: 0.0 };
    }
    if (!progress[categoryId].name || (categories[categoryId] && progress[categoryId].name !== categories[categoryId].name)) {
      progress[categoryId].name = categories[categoryId]?.name || categoryId;
    }
    const p = progress[categoryId];
    p.attempted++;
    if (isCorrect) p.correct++;
    p.mastery = p.attempted > 0 ? p.correct / p.attempted : 0;
  }
  function renderProgressReport() {
    console.log('Rendering progress report...');
    const detailsDiv = document.getElementById('report-details');
    const canvasCtx = progressChartCanvas;
    if (!detailsDiv) {
      console.warn("Cannot render text: Missing 'report-details'.");
    } else {
      detailsDiv.innerHTML = '';
      const ul = document.createElement('ul');
      const categoryIds = Object.keys(progress);
      if (categoryIds.length === 0) {
        detailsDiv.innerHTML = '<p>No progress tracked yet.</p>';
        console.log('No text data.');
      } else {
        categoryIds.sort((a, b) => (progress[a]?.name || a).localeCompare(progress[b]?.name || b));
        console.log('Sorted IDs for text:', categoryIds);
        categoryIds.forEach((id) => {
          const d = progress[id];
          if (!d) return;
          const n = d.name || id;
          const li = document.createElement('li');
          const m = (d.mastery * 100).toFixed(1);
          li.classList.remove('mastery-low', 'mastery-mid', 'mastery-high');
          if (d.mastery < 0.4) li.classList.add('mastery-low');
          else if (d.mastery < 0.75) li.classList.add('mastery-mid');
          else li.classList.add('mastery-high');
          li.innerHTML = `<span><strong>${n}:</strong></span> <span>${d.correct}/${d.attempted}</span> <span class="mastery">${m}%</span>`;
          ul.appendChild(li);
        });
        detailsDiv.appendChild(ul);
        console.log('Text details rendered.');
      }
    }
    const chartContainer = document.querySelector('.chart-container');
    if (!canvasCtx) {
      console.warn('Cannot render chart: Missing canvas context.');
      if (progressChart) {
        progressChart.destroy();
        progressChart = null;
      }
      if (chartContainer && !chartContainer.querySelector('p')) {
        chartContainer.innerHTML = `<p style="color: var(--secondary-color); text-align: center;">Chart unavailable.</p>`;
      }
      return;
    }
    const categoryIdsForChart = Object.keys(progress);
    const chartLabels = categoryIdsForChart.map((id) => progress[id]?.name || id);
    const chartData = categoryIdsForChart.map((id) => ((progress[id]?.mastery ?? 0) * 100).toFixed(1));
    console.log('Chart Labels:', chartLabels);
    console.log('Chart Data:', chartData);
    if (progressChart) {
      progressChart.destroy();
      console.log('Previous chart destroyed.');
      progressChart = null;
    }
    if (!chartContainer) {
      console.error('Chart container not found.');
      return;
    }
    if (categoryIdsForChart.length === 0) {
      chartContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding-top:50px;">Complete a session for chart.</p>';
      console.log('No data for chart.');
      return;
    } else if (!chartContainer.querySelector('canvas')) {
      chartContainer.innerHTML = '';
      chartContainer.appendChild(canvasElementCheck);
      console.log('Re-added canvas.');
    }
    const bodyStyles = getComputedStyle(document.body);
    const textColor = bodyStyles.getPropertyValue('--text-color');
    const borderColor = bodyStyles.getPropertyValue('--border-color');
    try {
      console.log('Creating chart...');
      const currentCtx = canvasElementCheck.getContext('2d');
      if (!currentCtx) throw new Error('Canvas context invalid.');
      progressChart = new Chart(currentCtx, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: 'Mastery (%)',
              data: chartData,
              backgroundColor: categoryIdsForChart.map((id) => {
                const m = progress[id]?.mastery ?? 0;
                if (m < 0.4) return 'rgba(220,53,69,0.7)';
                else if (m < 0.75) return 'rgba(253,126,20,0.7)';
                else return 'rgba(40,167,69,0.7)';
              }),
              borderColor: categoryIdsForChart.map((id) => {
                const m = progress[id]?.mastery ?? 0;
                if (m < 0.4) return 'rgb(220,53,69)';
                else if (m < 0.75) return 'rgb(253,126,20)';
                else return 'rgb(40,167,69)';
              }),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: { y: { ticks: { color: textColor }, grid: { display: false } }, x: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: borderColor } } },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  const id = categoryIdsForChart[ctx.dataIndex];
                  const d = progress[id];
                  return d ? `Mastery: ${ctx.raw}% (${d.correct}/${d.attempted})` : 'N/A';
                },
              },
            },
          },
        },
      });
      console.log('Chart created.');
    } catch (e) {
      console.error('Chart creation error:', e);
      if (chartContainer) chartContainer.innerHTML = `<p style="color:var(--incorrect-color);text-align:center;">Chart error: ${e.message}</p>`;
      progressChart = null;
    }
  }

  // --- Local Storage (Using Baxter keys) ---
  function saveProgress() {
    try {
      localStorage.setItem('mathPracticeProgress_Baxter', JSON.stringify(progress));
      console.log('Progress saved for Baxter.');
    } catch (e) {
      console.error('Save progress error:', e);
      alert("Error saving Baxter's progress.");
    }
  }
  function loadProgress() {
    try {
      const s = localStorage.getItem('mathPracticeProgress_Baxter');
      const p = s ? JSON.parse(s) : {};
      if (typeof p === 'object' && p !== null) {
        Object.keys(p).forEach((k) => {
          if (!p[k].name && categories[k]) p[k].name = categories[k].name;
        });
        return p;
      }
      return {};
    } catch (e) {
      console.error('Load progress error:', e);
      localStorage.removeItem('mathPracticeProgress_Baxter');
      return {};
    }
  }
  function savePreviousSessionCount(c) {
    try {
      const cs = Number.isInteger(c) ? c : 0;
      localStorage.setItem('mathPracticeLastSessionCount_Baxter', cs.toString());
      console.log('Saved last session count for Baxter:', cs);
    } catch (e) {
      console.error('Save session count error:', e);
    }
  }
  function loadPreviousSessionCount() {
    try {
      const s = localStorage.getItem('mathPracticeLastSessionCount_Baxter');
      const c = s ? parseInt(s, 10) : 0;
      return Number.isInteger(c) && c >= 0 ? c : 0;
    } catch (e) {
      console.error('Load session count error:', e);
      return 0;
    }
  }

  // --- Theme Handling ---
  function initializeTheme() {
    try {
      const pD = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const sT = localStorage.getItem('theme');
      if (sT === 'dark' || (!sT && pD)) {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
      } else {
        document.body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.checked = false;
      }
    } catch (e) {
      console.error('Theme init error:', e);
    }
  }
  function handleThemeToggle() {
    try {
      if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
      if (currentView === 'home-view') {
        renderProgressReport();
      }
    } catch (e) {
      console.error('Theme toggle error:', e);
    }
  }

  // --- Answer Checkers ---
  function checkNumericAnswer(ua, ca) {
    const nu = parseFloat(ua),
      nc = parseFloat(ca);
    return !isNaN(nu) && !isNaN(nc) && nu === nc;
  }
  function checkNumericAnswerTolerance(tol) {
    return function (ua, ca) {
      const nu = parseFloat(ua),
        nc = parseFloat(ca);
      if (isNaN(nu) || isNaN(nc)) return !1;
      return Math.abs(nu - nc) < tol;
    };
  }
  function checkExactStringAnswer(ua, ca) {
    const cu = ua.replace(/\s+/g, '').toLowerCase();
    const cc = (ca || '').toString().replace(/\s+/g, '').toLowerCase();
    return cu === cc;
  }
  function checkFractionAnswer(ua, ca) {
    try {
      const cs = (ca || '').toString();
      const cp = cs.split('/').map(Number);
      let cv;
      if (cp.length === 2) {
        if (cp[1] === 0 || isNaN(cp[0]) || isNaN(cp[1])) return !1;
        cv = cp[0] / cp[1];
      } else if (cp.length === 1) {
        if (isNaN(cp[0])) return !1;
        cv = cp[0];
      } else {
        return !1;
      }
      if (!ua.includes('/')) {
        const un = parseFloat(ua);
        if (isNaN(un)) return !1;
        return Math.abs(un - cv) < 1e-4;
      }
      const up = ua.split('/').map(Number);
      if (up.length !== 2 || isNaN(up[0]) || isNaN(up[1]) || up[1] === 0) return !1;
      const uv = up[0] / up[1];
      return Math.abs(uv - cv) < 1e-4;
    } catch (e) {
      console.error('Fraction check error:', e);
      return !1;
    }
  }

  // --- Utility Functions ---
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    return b === 0 ? a : gcd(b, a % b);
  }
  function simplifyFraction(n, d) {
    if (d === 0) return 'Undefined';
    if (n === 0) return '0';
    const cd = gcd(n, d);
    let num = n / cd;
    let den = d / cd;
    if (den < 0) {
      num = -num;
      den = -den;
    }
    if (den === 1) return num.toString();
    return `${num}/${den}`;
  }

  // --- Question Generators (Year 6 - Includes all corrected functions) ---
  // Number & Place Value
  function generatePlaceValueLarge() {
    const p = [1000, 10000, 100000, 1000000];
    const pv = p[getRandomInt(0, p.length - 1)];
    const num = getRandomInt(1, 9) * pv + getRandomInt(0, pv - 1);
    const digit = Math.floor(num / pv) % 10;
    const pn = pv.toLocaleString();
    let q = `In ${num.toLocaleString()}, what is the value of the digit ${digit}?`;
    if (pv === 1000) q = `In ${num.toLocaleString()}, what digit is in the thousands place?`;
    else if (pv === 10000) q = `In ${num.toLocaleString()}, what digit is in the ten thousands place?`;
    let ans = pv === 1000 || pv === 10000 ? digit.toString() : (digit * pv).toString();
    if (q.includes('value of the digit')) {
      ans = (digit * pv).toString();
    } else {
      ans = digit.toString();
    }
    return { question: q, answer: ans };
  }
  function generateMultDivPowers10() {
    const num = getRandomInt(1, 500) / (getRandomInt(0, 1) === 0 ? 1 : 10);
    const power = 10 ** getRandomInt(1, 3);
    const op = getRandomInt(0, 1);
    let q = '',
      ans = 0;
    if (op === 0) {
      q = `Calculate: ${num} × ${power}`;
      ans = num * power;
    } else {
      q = `Calculate: ${num} ÷ ${power}`;
      ans = num / power;
    }
    return { question: q, answer: parseFloat(ans.toFixed(5)).toString() };
  }
  function generateAddSubLarge() {
    const num1 = getRandomInt(1000, 99999);
    const num2 = getRandomInt(1000, num1);
    const op = getRandomInt(0, 1);
    let q = '',
      ans = 0;
    if (op === 0) {
      q = `Calculate: ${num1.toLocaleString()} + ${num2.toLocaleString()}`;
      ans = num1 + num2;
    } else {
      q = `Calculate: ${num1.toLocaleString()} - ${num2.toLocaleString()}`;
      ans = num1 - num2;
    }
    return { question: q, answer: ans.toString() };
  }
  function generateMultiplicationMultiDigit() {
    const num1 = getRandomInt(100, 999);
    const num2 = getRandomInt(10, 99);
    const q = `Calculate: ${num1} × ${num2}`;
    const ans = num1 * num2;
    return { question: q, answer: ans.toString() };
  }
  function generateDivisionSimple() {
    const divisor = getRandomInt(2, 9);
    const quotient = getRandomInt(20, 200);
    const dividend = divisor * quotient;
    const q = `Calculate: ${dividend} ÷ ${divisor}`;
    const ans = quotient;
    return { question: q, answer: ans.toString() };
  }
  function generatePrimeComposite() {
    const num = getRandomInt(2, 100);
    let isPrime = true;
    if (num <= 1) isPrime = false;
    else {
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) {
          isPrime = false;
          break;
        }
      }
    }
    const ans = isPrime ? 'prime' : 'composite';
    const q = `Is the number ${num} prime or composite?`;
    return { question: q, answer: ans };
  }
  // Fractions & Decimals
  function generateCompareFractionsRelated() {
    const factor = getRandomInt(2, 4);
    const d1 = getRandomInt(2, 6);
    const d2 = d1 * factor;
    let n1 = getRandomInt(1, d1 - 1);
    let n2 = getRandomInt(1, d2 - 1);
    let val1 = n1 / d1;
    let val2 = n2 / d2;
    if (Math.random() < 0.7 && Math.abs(val1 - val2) < 0.001) {
      n2 = getRandomInt(1, d2 - 1);
      val2 = n2 / d2;
    }
    const ans = Math.abs(val1 - val2) < 0.001 ? '=' : val1 > val2 ? '>' : '<';
    const q = `Compare the fractions: <sup>${n1}</sup>⁄<sub>${d1}</sub> and <sup>${n2}</sup>⁄<sub>${d2}</sub>. Enter >, <, or =.`;
    return { question: q, answer: ans };
  }
  function generateAddSubFractionsRelated() {
    const factor = getRandomInt(2, 3);
    const d1 = getRandomInt(2, 5);
    const d2 = d1 * factor;
    let n1 = getRandomInt(1, d1 - 1);
    let n2 = getRandomInt(1, d2 - 1);
    const op = getRandomInt(0, 1);
    let commonDenom = d2;
    let num1Converted = n1 * factor;
    let resultNum, q;
    if (op === 0) {
      resultNum = num1Converted + n2;
      q = `Calculate: <sup>${n1}</sup>⁄<sub>${d1}</sub> + <sup>${n2}</sup>⁄<sub>${d2}</sub>`;
    } else {
      if (num1Converted < n2) {
        [n1, n2] = [n2, n1];
        [d1, d2] = [d2, d1];
        num1Converted = n1;
        n2 = n2 * factor;
      } else {
        /* n2 remains n2 */
      }
      resultNum = num1Converted - n2;
      q = `Calculate: <sup>${num1Converted / factor}</sup>⁄<sub>${d1}</sub> - <sup>${n2}</sup>⁄<sub>${d2}</sub>`;
      if (d1 > d2) {
        q = `Calculate: <sup>${n1}</sup>⁄<sub>${d1}</sub> - <sup>${n2 / factor}</sup>⁄<sub>${d2 / factor}</sub>`;
      }
    }
    const ans = simplifyFraction(resultNum, commonDenom);
    q += ` <br>(Give answer as a fraction e.g. a/b or a whole number)`;
    return { question: q, answer: ans };
  }
  function generateDecimalMultWhole() {
    const decimal = getRandomInt(1, 99) / 10;
    const whole = getRandomInt(2, 12);
    const ans = decimal * whole;
    const q = `Calculate: ${decimal} × ${whole}`;
    return { question: q, answer: ans };
  }
  function generateFracDecConversionSimple() {
    const f = [
      { f: '1/2', d: 0.5 },
      { f: '1/4', d: 0.25 },
      { f: '3/4', d: 0.75 },
      { f: '1/5', d: 0.2 },
      { f: '2/5', d: 0.4 },
      { f: '3/5', d: 0.6 },
      { f: '4/5', d: 0.8 },
      { f: '1/10', d: 0.1 },
      { f: '3/10', d: 0.3 },
    ];
    const c = f[getRandomInt(0, f.length - 1)];
    const to = getRandomInt(0, 1);
    let q,
      ans,
      chk = checkNumericAnswerTolerance(0.001);
    if (to === 0) {
      q = `Convert <sup>${c.f.split('/')[0]}</sup>⁄<sub>${c.f.split('/')[1]}</sub> to a decimal.`;
      ans = c.d;
    } else {
      q = `Convert ${c.d} to a simple fraction (e.g., a/b).`;
      ans = c.f;
      chk = checkFractionAnswer;
    }
    return { question: q, answer: ans, checker: chk };
  }
  function generatePercentageOfQuantitySimple() {
    const p = [10, 20, 25, 50, 75];
    const pc = p[getRandomInt(0, p.length - 1)];
    let q;
    if (pc === 10 || pc === 20) q = getRandomInt(2, 15) * 10;
    else if (pc === 25 || pc === 75) q = getRandomInt(2, 10) * 4;
    else q = getRandomInt(2, 20) * 2;
    const ans = (pc / 100) * q;
    return { question: `Calculate ${pc}% of ${q}`, answer: ans.toString() };
  }
  // Patterns & Algebra
  function generatePatternAddSub() {
    const start = getRandomInt(1, 50);
    const diff = getRandomInt(2, 15) * (getRandomInt(0, 1) === 0 ? 1 : -1);
    const terms = [start];
    for (let i = 1; i < 4; i++) {
      terms.push(terms[i - 1] + diff);
    }
    const ans = terms[3] + diff;
    const q = `What is the next number in the pattern: ${terms.join(', ')}, ...?`;
    return { question: q, answer: ans.toString() };
  }
  function generateFindRuleSimple() {
    const type = getRandomInt(0, 2);
    let ruleDesc = '',
      seq = [],
      start,
      diff,
      mult;
    if (type === 0) {
      start = getRandomInt(1, 20);
      diff = getRandomInt(2, 9);
      for (let i = 0; i < 4; i++) seq.push(start + i * diff);
      ruleDesc = `add ${diff}`;
    } else if (type === 1) {
      start = getRandomInt(30, 60);
      diff = getRandomInt(2, 9);
      for (let i = 0; i < 4; i++) seq.push(start - i * diff);
      ruleDesc = `subtract ${diff}`;
    } else {
      start = getRandomInt(2, 5);
      mult = getRandomInt(2, 3);
      seq.push(start);
      for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * mult);
      ruleDesc = `multiply by ${mult}`;
    }
    const q = `What is the rule for this pattern: ${seq.join(', ')}, ...? (e.g., 'add 5')`;
    return { question: q, answer: ruleDesc };
  }
  function generateOrderOfOpsSimple() {
    let a = getRandomInt(2, 10),
      b = getRandomInt(2, 10),
      c = getRandomInt(2, 10),
      d = getRandomInt(1, 5);
    let q = '',
      ans = 0;
    const type = getRandomInt(0, 3);
    if (type === 0) {
      q = `${a} + ${b} × ${c}`;
      ans = a + b * c;
    } else if (type === 1) {
      q = `(${a} + ${b}) × ${c}`;
      ans = (a + b) * c;
    } else if (type === 2) {
      a = getRandomInt(5, 12);
      b = getRandomInt(5, 12);
      c = getRandomInt(2, a * b - 1);
      q = `${a} × ${b} - ${c}`;
      ans = a * b - c;
    } else {
      a = getRandomInt(1, 10);
      b = getRandomInt(2, 8);
      c = getRandomInt(2, 8);
      d = getRandomInt(1, a + b * c);
      q = `${a} + ${b} × ${c} - ${d}`;
      ans = a + b * c - d;
    }
    return { question: `Calculate: ${q}`, answer: ans.toString() };
  }
  // Measurement
  function generateConvertLength() {
    const val = getRandomInt(1, 5000);
    const u = [
      { f: 'm', t: 'cm', fact: 100 },
      { f: 'cm', t: 'm', fact: 0.01 },
      { f: 'cm', t: 'mm', fact: 10 },
      { f: 'mm', t: 'cm', fact: 0.1 },
      { f: 'm', t: 'mm', fact: 1000 },
      { f: 'mm', t: 'm', fact: 0.001 },
    ];
    const conv = u[getRandomInt(0, u.length - 1)];
    let sv = val;
    if (conv.f === 'm' && conv.t === 'mm') sv = getRandomInt(1, 5);
    if (conv.f === 'mm' && conv.t === 'm') sv = getRandomInt(1000, 9000);
    if (conv.f === 'mm' && conv.t === 'cm') sv = getRandomInt(10, 500);
    if (conv.f === 'cm' && conv.t === 'm') sv = getRandomInt(100, 9000);
    const ans = sv * conv.fact;
    const q = `Convert ${sv}${conv.f} to ${conv.t}.`;
    return { question: q, answer: parseFloat(ans.toFixed(5)).toString() };
  }
  function generateConvertMass() {
    const u = [
      { f: 'kg', t: 'g', fact: 1000 },
      { f: 'g', t: 'kg', fact: 0.001 },
    ];
    const conv = u[getRandomInt(0, u.length - 1)];
    let sv = 0;
    if (conv.f === 'kg') sv = getRandomInt(1, 25) + (getRandomInt(0, 1) === 0 ? 0 : 0.5);
    else sv = getRandomInt(500, 9500);
    const ans = sv * conv.fact;
    const q = `Convert ${sv}${conv.f} to ${conv.t}.`;
    return { question: q, answer: parseFloat(ans.toFixed(5)).toString() };
  }
  function generateAreaTriangleSVG() {
    // *** CORRECTED AND ENSURED PRESENCE ***
    let base = getRandomInt(4, 16);
    let height = getRandomInt(3, 12);
    let ans = 0.5 * base * height;
    const p = 35,
      mvs = 150,
      mD = Math.max(base, height),
      sf = mvs / mD,
      bs = base * sf,
      hs = height * sf,
      sw = bs + p * 2,
      sh = hs + p * 2,
      ox = p,
      oy = sh - p;
    const path = `M ${ox},${oy} H ${ox + bs} L ${ox},${oy - hs} Z`; // Simple right-angled triangle path
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:200px;height:auto;"><path d="${path}" fill="rgba(0,180,90,0.1)" stroke="currentColor"/><path d="M ${ox + 5} ${oy} L ${ox + 5} ${oy - 5} L ${ox} ${oy - 5}" fill="none" stroke="currentColor" style="stroke-width:1;"/><text x="${ox + bs / 2}" y="${oy + 12}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${base} cm</text><text x="${ox - 10}" y="${oy - hs / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${height} cm</text></svg>`;
    const q = `Calculate the area of the triangle shown (in cm²). <br><i>(Area = 1/2 × base × height)</i>`;
    return { question: q, answer: ans, checker: checkNumericAnswerTolerance(0.1) };
  }
  function generateElapsedTime() {
    // *** CORRECTED ***
    let startHour = getRandomInt(7, 20);
    let startMin = getRandomInt(0, 59);
    let durationHour = getRandomInt(0, 3);
    let durationMin = getRandomInt(5, 55);
    if (durationHour === 0 && durationMin === 0) durationMin = 1;
    let totalDurationMinutes = durationHour * 60 + durationMin;
    let totalStartMinutes = startHour * 60 + startMin;
    let totalEndMinutes = totalStartMinutes + totalDurationMinutes;
    let endHour = Math.floor(totalEndMinutes / 60) % 24;
    let endMin = totalEndMinutes % 60;
    let startHour12 = startHour % 12;
    if (startHour12 === 0) startHour12 = 12;
    const startAmpm = startHour < 12 ? 'am' : 'pm';
    const startTimeStr = `${startHour12}:${startMin < 10 ? '0' : ''}${startMin} ${startAmpm}`;
    let endHour12 = endHour % 12;
    if (endHour12 === 0) endHour12 = 12;
    const endAmpm = endHour < 12 ? 'am' : 'pm';
    const endTimeStr = `${endHour12}:${endMin < 10 ? '0' : ''}${endMin} ${endAmpm}`;
    const answerHours = Math.floor(totalDurationMinutes / 60);
    const answerMins = totalDurationMinutes % 60;
    const answer = `${answerHours} hours ${answerMins} minutes`;
    const question = `A movie starts at ${startTimeStr} and finishes at ${endTimeStr}. How long was the movie? (Format: X hours Y minutes)`;
    return { question: question, answer: answer };
  }
  function generateRead24HourTime() {
    const h24 = getRandomInt(0, 23),
      min = getRandomInt(0, 59);
    const t24s = `${h24 < 10 ? '0' : ''}${h24}:${min < 10 ? '0' : ''}${min}`;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const ampm = h24 < 12 ? 'am' : 'pm';
    const ans = `${h12}:${min < 10 ? '0' : ''}${min} ${ampm}`;
    const q = `Convert the 24-hour time ${t24s} to 12-hour time (e.g., 3:45 pm).`;
    return { question: q, answer: ans };
  }
  // Geometry
  function generateAngleTypeSVG() {
    // *** CORRECTED ***
    const types = ['acute', 'right', 'obtuse', 'straight', 'reflex'];
    const type = types[getRandomInt(0, types.length - 1)];
    let angleDeg;
    const sw = 150,
      sh = 100,
      cx = sw / 2,
      cy = sh * 0.8,
      r = 50;
    switch (type) {
      case 'acute':
        angleDeg = getRandomInt(10, 89);
        break;
      case 'right':
        angleDeg = 90;
        break;
      case 'obtuse':
        angleDeg = getRandomInt(91, 179);
        break;
      case 'straight':
        angleDeg = 180;
        break;
      case 'reflex':
        angleDeg = getRandomInt(181, 350);
        break;
      default:
        angleDeg = 45;
    }
    const angleRad = (angleDeg * Math.PI) / 180;
    const x1 = cx - r;
    const y1 = cy;
    const x2 = cx + r * Math.cos(Math.PI - angleRad);
    const y2 = cy - r * Math.sin(Math.PI - angleRad);
    // Removed the confusing arc path
    const diagramHTML = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 1.5; max-width: 150px; height: auto;"><circle cx="${cx}" cy="${cy}" r="1.5" fill="currentColor" stroke="none"/><line x1="${x1}" y1="${y1}" x2="${cx}" y2="${cy}" stroke="currentColor"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="currentColor"/>${type === 'right' ? `<path d="M ${cx + 5} ${cy} L ${cx + 5} ${cy - 5} L ${cx} ${cy - 5}" fill="none" stroke="currentColor" stroke-width="1"/>` : ''}</svg>`;
    const question = `What type of angle is shown? (acute, right, obtuse, straight, reflex)`;
    return { question: question, answer: type, diagram: diagramHTML };
  }
  function generateAnglesPointLineSimpleSVG() {
    const type = getRandomInt(0, 1);
    let totalAngle = type === 0 ? 360 : 180;
    let known1 = getRandomInt(40, Math.floor(totalAngle * 0.4));
    let known2 = getRandomInt(40, Math.floor(totalAngle * 0.4));
    let ans = totalAngle - known1 - known2;
    if (ans < 30) {
      known1 = Math.max(20, known1 - 20);
      known2 = Math.max(20, known2 - 20);
      ans = totalAngle - known1 - known2;
    }
    const sw = 200,
      sh = type === 0 ? 150 : 100,
      cx = sw / 2,
      cy = type === 0 ? sh / 2 + 10 : sh * 0.8,
      r = 60;
    let dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:200px;height:auto;">`;
    const r1 = (known1 * Math.PI) / 180,
      r2 = (known2 * Math.PI) / 180,
      r3 = (ans * Math.PI) / 180;
    const x1 = cx + r * Math.cos(Math.PI),
      y1 = cy + r * Math.sin(Math.PI);
    const x2 = cx + r * Math.cos(Math.PI + r1),
      y2 = cy + r * Math.sin(Math.PI + r1);
    const x3 = cx + r * Math.cos(Math.PI + r1 + r2),
      y3 = cy + r * Math.sin(Math.PI + r1 + r2);
    const x4 = cx + r * Math.cos(Math.PI + r1 + r2 + r3),
      y4 = cy + r * Math.sin(Math.PI + r1 + r2 + r3);
    dh += `<line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="currentColor"/>`;
    dh += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="currentColor"/>`;
    dh += `<line x1="${cx}" y1="${cy}" x2="${x3}" y2="${y3}" stroke="currentColor"/>`;
    if (type === 1) {
      dh += `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="currentColor"/>`;
    } else {
      dh += `<line x1="${cx}" y1="${cy}" x2="${x4}" y2="${y4}" stroke="currentColor"/>`;
    }
    dh += `<text x="${cx - 15}" y="${cy - 10}" font-size="10" fill="currentColor">${known1}°</text>`;
    dh += `<text x="${cx + 5}" y="${cy - 15}" font-size="10" fill="currentColor">${known2}°</text>`;
    dh += `<text x="${cx + 15}" y="${cy + 5}" font-size="10" fill="currentColor">x°</text>`;
    dh += `</svg>`;
    const q = `Find the value of angle x°.`;
    return { question: q, answer: ans.toString(), diagram: dh };
  }
  function generateCoordinatesFirstQuadrant() {
    // *** CORRECTED ***
    const x = getRandomInt(1, 10);
    const y = getRandomInt(1, 10);
    const answer = `(${x}, ${y})`;
    const gridSize = 10;
    const cellSize = 20;
    const padding = 35; // Increased padding
    const axisLabelOffset = 18;
    const gridLabelOffset = 6;
    const svgWidth = gridSize * cellSize + padding * 2;
    const svgHeight = gridSize * cellSize + padding * 2;
    const originX = padding;
    const originY = svgHeight - padding;
    let diagramHTML = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 0.5; max-width: 300px; height: auto;">`; // Increased max-width
    // Draw manual grid lines for better alignment
    diagramHTML += `<g stroke="var(--secondary-color)" stroke-width="0.5" opacity="0.7">`; // Slightly darker grid
    for (let i = 1; i <= gridSize; i++) {
      diagramHTML += `<line x1="${originX + i * cellSize}" y1="${padding}" x2="${originX + i * cellSize}" y2="${originY}" />`;
      diagramHTML += `<line x1="${originX}" y1="${originY - i * cellSize}" x2="${originX + gridSize * cellSize}" y2="${originY - i * cellSize}" />`;
    }
    diagramHTML += `</g>`;
    // Axes (thicker)
    diagramHTML += `<line x1="${originX}" y1="${padding - 5}" x2="${originX}" y2="${originY + 5}" stroke="currentColor" stroke-width="1.5"/>`; // Y axis slightly extended
    diagramHTML += `<line x1="${originX - 5}" y1="${originY}" x2="${originX + gridSize * cellSize + 5}" y2="${originY}" stroke="currentColor" stroke-width="1.5"/>`; // X axis slightly extended
    // Axis Labels
    diagramHTML += `<text x="${originX + gridSize * cellSize + axisLabelOffset}" y="${originY + gridLabelOffset}" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">x</text>`;
    diagramHTML += `<text x="${originX - axisLabelOffset}" y="${padding - gridLabelOffset}" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">y</text>`;
    // Grid Numbers
    for (let i = 1; i <= gridSize; i++) {
      if (i % 2 === 0) {
        // Label every 2nd tick for less clutter
        diagramHTML += `<text x="${originX + i * cellSize}" y="${originY + axisLabelOffset}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${i}</text>`;
        diagramHTML += `<text x="${originX - axisLabelOffset + 8}" y="${originY - i * cellSize + 3}" font-size="9" text-anchor="end" fill="currentColor" stroke="none">${i}</text>`;
      }
      // Draw subtle tick marks
      diagramHTML += `<line x1="${originX + i * cellSize}" y1="${originY}" x2="${originX + i * cellSize}" y2="${originY + 3}" stroke="currentColor" stroke-width="1"/>`;
      diagramHTML += `<line x1="${originX}" y1="${originY - i * cellSize}" x2="${originX - 3}" y2="${originY - i * cellSize}" stroke="currentColor" stroke-width="1"/>`;
    }
    // Point
    const pointX = originX + x * cellSize;
    const pointY = originY - y * cellSize;
    diagramHTML += `<circle cx="${pointX}" cy="${pointY}" r="4" fill="var(--primary-color)" stroke="var(--card-bg)" stroke-width="1"/>`;
    diagramHTML += `<text x="${pointX + 7}" y="${pointY - 7}" font-size="10" font-weight="bold" fill="currentColor" stroke="none">P</text>`;
    diagramHTML += `</svg>`;
    const question = `What are the coordinates of point P? (Format: (x, y))`;
    return { question: question, answer: answer, diagram: diagramHTML };
  }
  function generateDescribeTransformationSimple() {
    // *** CORRECTED PADDING ***
    const types = ['translation', 'reflection', 'rotation'];
    const ans = types[getRandomInt(0, types.length - 1)];
    const ptsA = '20,70 40,30 60,70';
    let ptsB = '',
      tDesc = '';
    const sw = 220,
      sh = 140; // Increased viewbox size
    switch (ans) {
      case 'translation':
        const tx = getRandomInt(50, 90),
          ty = getRandomInt(-10, 10);
        ptsB = `${20 + tx},${70 + ty} ${40 + tx},${30 + ty} ${60 + tx},${70 + ty}`;
        tDesc = `moved`;
        break;
      case 'reflection':
        const axis = getRandomInt(80, 120);
        ptsB = `${axis + (axis - 20)},70 ${axis + (axis - 40)},30 ${axis + (axis - 60)},70`;
        tDesc = `flipped`;
        break;
      case 'rotation':
        const cx = 40,
          cy = 50;
        ptsB = '60,70 20,50 60,30';
        tDesc = `turned`;
        break;
    }
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:220px;height:auto;"><polygon points="${ptsA}" fill="rgba(0,123,255,0.3)" stroke="currentColor"/><text x="40" y="80" font-size="10" text-anchor="middle">A</text><polygon points="${ptsB}" fill="rgba(40,167,69,0.3)" stroke="currentColor"/><text x="${ptsB.split(' ')[1].split(',')[0]}" y="${parseInt(ptsB.split(' ')[1].split(',')[1]) + 15}" font-size="10" text-anchor="middle">B</text></svg>`;
    const q = `Shape A has been ${tDesc} to position B. What type of transformation is this? (translation, reflection, or rotation)`;
    return { question: q, answer: ans, diagram: dh };
  }
  // Statistics & Probability
  function generateInterpretColumnGraph() {
    // *** CORRECTED WITH TICKS ***
    const categories = ['Cats', 'Dogs', 'Birds', 'Fish'];
    const catCount = getRandomInt(3, categories.length);
    const chosenCategories = categories.slice(0, catCount);
    const values = chosenCategories.map(() => getRandomInt(1, 12));
    const targetCatIndex = getRandomInt(0, chosenCategories.length - 1);
    const answer = values[targetCatIndex];
    const question = `The graph shows favourite pets. How many people chose ${chosenCategories[targetCatIndex]}?`;
    const svgPadding = 35;
    const barWidth = 25;
    const barGap = 15;
    const maxValue = Math.ceil(Math.max(...values, 5) / 2) * 2;
    const scaleY = 100 / maxValue;
    const svgWidth = catCount * (barWidth + barGap) - barGap + svgPadding * 2;
    const svgHeight = 100 + svgPadding * 2;
    const originX = svgPadding;
    const originY = svgHeight - svgPadding;
    const tickLength = 5;
    let diagramHTML = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 1; max-width: 250px; height: auto;">`;
    diagramHTML += `<line x1="${originX}" y1="${svgPadding - tickLength}" x2="${originX}" y2="${originY}" stroke="currentColor" stroke-width="1"/>`; // Y Axis line
    for (let i = 0; i <= maxValue; i += 2) {
      const tickY = originY - i * scaleY;
      diagramHTML += `<line x1="${originX - tickLength}" y1="${tickY}" x2="${originX}" y2="${tickY}" stroke="currentColor" stroke-width="0.7"/>`;
      diagramHTML += `<text x="${originX - tickLength - 4}" y="${tickY + 3}" font-size="8" text-anchor="end" fill="currentColor">${i}</text>`;
    }
    diagramHTML += `<line x1="${originX - tickLength}" y1="${originY}" x2="${originX + catCount * (barWidth + barGap)}" y2="${originY}" stroke="currentColor" stroke-width="1"/>`; // X Axis line
    values.forEach((value, index) => {
      const barHeight = value * scaleY;
      const barX = originX + index * (barWidth + barGap);
      diagramHTML += `<rect x="${barX}" y="${originY - barHeight}" width="${barWidth}" height="${barHeight}" fill="var(--primary-color)" opacity="0.7"/>`;
      diagramHTML += `<text x="${barX + barWidth / 2}" y="${originY + 15}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${chosenCategories[index]}</text>`;
    });
    diagramHTML += `</svg>`;
    return { question: question, answer: answer.toString(), diagram: diagramHTML };
  }
  function generateSimpleProbabilityFraction() {
    const total = getRandomInt(8, 20);
    const fav = getRandomInt(1, total - 1);
    const col = ['red', 'blue', 'green', 'yellow'][getRandomInt(0, 3)];
    const ans = simplifyFraction(fav, total);
    const q = `A bag contains ${total} marbles. ${fav} are ${col}. What is the probability of picking a ${col} marble? <br>(Give answer as a fraction e.g. a/b)`;
    return { question: q, answer: ans };
  }
  function generateListOutcomes() {
    // *** CORRECTED QUESTION TEXT ***
    const items1 = ['Head', 'Tail'];
    const items2 = ['Red', 'Blue', 'Green'];
    let outcomes = [];
    for (let i1 of items1) {
      for (let i2 of items2) {
        outcomes.push(`${i1}-${i2}`);
      }
    }
    const answer = outcomes.join(', ');
    const question = `A coin is flipped and a 3-colour spinner (Red, Blue, Green) is spun. List all possible outcomes, separating each with a comma and space (e.g., Head-Red, Head-Blue, ...).`;
    return { question: question, answer: answer, checker: checkExactStringAnswer };
  }
  // --- SVG Generators kept/modified ---
  function generateAreaRectangleSVG() {
    let l = getRandomInt(5, 15),
      w = getRandomInt(3, Math.max(4, l - 1)),
      ans = l * w;
    const p = 40,
      mvs = 150,
      mD = Math.max(l, w),
      sf = mvs / mD,
      rw = l * sf,
      rh = w * sf,
      sw = rw + p * 2,
      sh = rh + p * 2,
      rx = p,
      ry = p,
      lo = 12;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/><text x="${rx + rw / 2}" y="${ry - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${l} cm</text><text x="${rx - lo}" y="${ry + rh / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${w} cm</text></svg>`;
    return { question: `Calculate the area of the rectangle shown (in cm²).`, answer: ans.toString(), diagram: dh };
  }
  function generatePerimeterRectangleSVG() {
    let l = getRandomInt(5, 15),
      w = getRandomInt(3, Math.max(4, l - 1)),
      ans = 2 * (l + w);
    const p = 40,
      mvs = 150,
      mD = Math.max(l, w),
      sf = mvs / mD,
      rw = l * sf,
      rh = w * sf,
      sw = rw + p * 2,
      sh = rh + p * 2,
      rx = p,
      ry = p,
      lo = 12;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/><text x="${rx + rw / 2}" y="${ry - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${l} m</text><text x="${rx - lo}" y="${ry + rh / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${w} m</text></svg>`;
    return { question: `Calculate the perimeter of the rectangle shown (in m).`, answer: ans.toString(), diagram: dh };
  }
  // Remove complex shapes/advanced geometry for Year 6 focus
  function generateAreaCircleSVG() {
    return null;
  }
  function generateAreaLShapeSVG() {
    return null;
  }
  function generatePerimeterLShapeSVG() {
    return null;
  }
  function generateAreaRectSemiCircleSVG() {
    return null;
  }
  function generatePerimeterRectSemiCircleSVG() {
    return null;
  }
  function generatePythagorasHypotSVG() {
    return null;
  }
  function generateExpandSingleBracket() {
    return null;
  }
  function generateLinearEquation1() {
    return null;
  }
  function generateLinearEquation2() {
    return null;
  }
}); // END OF DOMContentLoaded LISTENER
