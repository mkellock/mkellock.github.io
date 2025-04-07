document.addEventListener('DOMContentLoaded', () => {
  // START OF DOMContentLoaded LISTENER
  console.log('DOM Content Loaded. Initializing script...');

  // --- Configuration & Constants ---
  const SESSION_DURATION_SECONDS = 30 * 60; // 30 minutes
  // const SESSION_DURATION_SECONDS = 30; // Use a short duration for testing
  const MOTIVATIONAL_MESSAGES = ["Keep pushing, you're doing great!", 'Every problem solved makes you stronger!', 'Focus and determination lead to success!', 'Believe in your ability to figure it out!', 'Mistakes are learning opportunities. Keep trying!', "You've got this, Hudson!", 'One question at a time.', 'Embrace the challenge!', 'Math power activated!', 'Stay sharp, stay focused!', 'Precision and practice make perfect.', 'Excellent effort!', 'Keep that brain working!'];
  const categories = {
    algebra: {
      name: 'Algebra',
      skills: [
        { name: 'Simple Linear Equations (ax + b = c)', generator: generateLinearEquation1, checker: checkNumericAnswer },
        { name: 'Linear Equations with x on both sides (ax + b = cx + d)', generator: generateLinearEquation2, checker: checkNumericAnswer },
        { name: 'Expanding Single Brackets a(bx + c)', generator: generateExpandSingleBracket, checker: checkExactStringAnswer },
      ],
    },
    number: {
      name: 'Number',
      skills: [
        { name: 'Percentage of a Quantity', generator: generatePercentageOfQuantity, checker: checkNumericAnswer },
        { name: 'Fraction Addition (Same Denominator)', generator: generateFractionAdditionSimple, checker: checkFractionAnswer },
        { name: 'Integer Multiplication', generator: generateIntegerMultiplication, checker: checkNumericAnswer },
      ],
    },
    measurement: {
      name: 'Measurement',
      skills: [
        // Simple Shapes
        { name: 'Area of Rectangle', generator: generateAreaRectangleSVG, checker: checkNumericAnswer },
        { name: 'Perimeter of Rectangle', generator: generatePerimeterRectangleSVG, checker: checkNumericAnswer },
        { name: 'Area of Circle (given radius)', generator: generateAreaCircleSVG, checker: checkNumericAnswerTolerance(0.1) },
        // Composite Shapes (NEW)
        { name: 'Area of L-Shape', generator: generateAreaLShapeSVG, checker: checkNumericAnswer },
        { name: 'Perimeter of L-Shape', generator: generatePerimeterLShapeSVG, checker: checkNumericAnswer },
        { name: 'Area of Rect+SemiCircle', generator: generateAreaRectSemiCircleSVG, checker: checkNumericAnswerTolerance(0.1) },
        { name: 'Perimeter of Rect+SemiCircle', generator: generatePerimeterRectSemiCircleSVG, checker: checkNumericAnswerTolerance(0.1) },
      ],
    },
    geometry: {
      name: 'Geometry',
      skills: [
        { name: 'Angles on a Straight Line', generator: generateAnglesStraightLineSVG, checker: checkNumericAnswer },
        { name: 'Pythagoras (Find Hypotenuse)', generator: generatePythagorasHypotSVG, checker: checkNumericAnswerTolerance(0.1) },
      ],
    },
    statistics: {
      name: 'Statistics & Probability',
      skills: [
        { name: 'Calculate Mean', generator: generateMean, checker: checkNumericAnswerTolerance(0.01) },
        { name: 'Simple Probability (Dice Roll)', generator: generateSimpleProbabilityDice, checker: checkFractionAnswer },
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
    // Get elements each time to ensure they are current
    const qAns = document.getElementById('user-answer');
    const qSub = document.getElementById('submit-answer');
    const qNext = document.getElementById('next-question');
    const qCount = document.getElementById('current-session-count');

    // Check if elements and state are valid before proceeding
    if (!currentQuestion || !isSessionActive || !qSub || !qNext || !qAns || !qCount) {
      console.error('handleSubmitAnswer aborted: Missing elements or inactive session.');
      return;
    }

    const uAns = qAns.value.trim();

    // *** THIS IS THE CORRECTED LINE ***
    // Prevent submitting empty answer unless the correct answer is actually 0 or '0'
    if (uAns === '' && currentQuestion.correctAnswer !== '0' && currentQuestion.correctAnswer !== 0) {
      console.log('Empty answer submitted when correct answer is not 0. Aborting.');
      // Optional: Provide feedback to the user that they need to enter an answer
      // showFeedback(false, "Please enter an answer.");
      return; // Stop processing if answer is empty and correct answer isn't 0
    }
    // *** END OF CORRECTED LINE ***

    try {
      // Check the answer using the specific checker for the current question
      const isCorrect = currentQuestion.checker(uAns, currentQuestion.correctAnswer);

      // Update overall progress stats
      updateOverallProgress(currentQuestion.categoryId, isCorrect);

      // Increment and display the session question counter
      currentSessionQuestionsCompleted++;
      qCount.textContent = currentSessionQuestionsCompleted;

      // Show visual feedback (Correct/Incorrect)
      showFeedback(isCorrect, currentQuestion.correctAnswer);

      // Update UI state: disable input, hide submit, show next button, focus next button
      qAns.disabled = true;
      qSub.classList.add('hidden');
      qNext.classList.remove('hidden');
      qNext.focus();
    } catch (checkerError) {
      console.error('Error during answer checking or UI update:', checkerError);
      // Show generic error feedback to the user
      showFeedback(false, `Error checking answer.`);
      // Still update UI to allow moving to the next question
      qAns.disabled = true;
      qSub.classList.add('hidden');
      qNext.classList.remove('hidden');
      try {
        qNext.focus();
      } catch (e) {} // Attempt to focus, ignore error if it fails
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

  // --- Local Storage ---
  function saveProgress() {
    try {
      localStorage.setItem('mathPracticeProgress_Hudson', JSON.stringify(progress));
      console.log('Progress saved.');
    } catch (e) {
      console.error('Save progress error:', e);
      alert('Error saving progress.');
    }
  }
  function loadProgress() {
    try {
      const s = localStorage.getItem('mathPracticeProgress_Hudson');
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
      localStorage.removeItem('mathPracticeProgress_Hudson');
      return {};
    }
  }
  function savePreviousSessionCount(c) {
    try {
      const cs = Number.isInteger(c) ? c : 0;
      localStorage.setItem('mathPracticeLastSessionCount_Hudson', cs.toString());
      console.log('Saved last session count:', cs);
    } catch (e) {
      console.error('Save session count error:', e);
    }
  }
  function loadPreviousSessionCount() {
    try {
      const s = localStorage.getItem('mathPracticeLastSessionCount_Hudson');
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

  // --- Question Generators ---
  // Algebra
  function generateLinearEquation1() {
    let a = getRandomInt(2, 9),
      b = getRandomInt(-10, 10),
      x = getRandomInt(-5, 5),
      c = a * x + b;
    return { question: `Solve for x: ${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}`, answer: x.toString() };
  }
  function generateLinearEquation2() {
    let a = getRandomInt(2, 9),
      c = getRandomInt(1, a - 1);
    if (a === c) c++;
    let x = getRandomInt(-5, 5),
      diff = (a - c) * x,
      b = getRandomInt(-10, 10),
      d = b + diff;
    return { question: `Solve for x: ${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}x ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)}`, answer: x.toString() };
  }
  function generateExpandSingleBracket() {
    let a = getRandomInt(2, 7),
      b = getRandomInt(1, 5),
      c = getRandomInt(-7, 7);
    if (c === 0) c = getRandomInt(1, 7) * (Math.random() < 0.5 ? 1 : -1);
    let cs = c >= 0 ? '+' : '-';
    let ac = Math.abs(c);
    const q = `Expand: ${a}(${b}x ${cs} ${ac})`;
    let t1 = a * b,
      t2 = a * c,
      t2s = t2 >= 0 ? '+' : '-',
      at2 = Math.abs(t2);
    const ans = `${t1}x${t2s}${at2}`;
    return { question: q, answer: ans };
  }
  // Number
  function generatePercentageOfQuantity() {
    let p = getRandomInt(1, 19) * 5,
      q = getRandomInt(2, 20) * 10,
      a = (p / 100) * q;
    return { question: `Calculate ${p}% of ${q}`, answer: parseFloat(a.toFixed(5)).toString() };
  }
  function generateFractionAdditionSimple() {
    let d = getRandomInt(3, 12),
      n1 = getRandomInt(1, d - 1),
      n2 = getRandomInt(1, d + 5),
      an = n1 + n2;
    const ans = simplifyFraction(an, d);
    return { question: `Calculate: <sup>${n1}</sup>⁄<sub>${d}</sub> + <sup>${n2}</sup>⁄<sub>${d}</sub> <br>(Give answer as a fraction e.g. a/b or a whole number)`, answer: ans };
  }
  function generateIntegerMultiplication() {
    let n1 = getRandomInt(-12, 12),
      n2 = getRandomInt(-12, 12);
    if (Math.random() < 0.7 && (n1 === 0 || n1 === 1 || n1 === -1)) n1 = getRandomInt(2, 12) * (Math.random() < 0.5 ? 1 : -1);
    if (Math.random() < 0.7 && (n2 === 0 || n2 === 1 || n2 === -1)) n2 = getRandomInt(2, 12) * (Math.random() < 0.5 ? 1 : -1);
    let a = n1 * n2;
    return { question: `Calculate: (${n1}) × (${n2})`, answer: a.toString() };
  }
  // Statistics & Probability
  function generateMean() {
    let c = getRandomInt(4, 7),
      v = [],
      s = 0;
    for (let i = 0; i < c; i++) {
      let val = getRandomInt(1, 50);
      v.push(val);
      s += val;
    }
    let a = s / c;
    return { question: `Calculate the mean (average) of the following numbers: ${v.join(', ')}. <br>(Round to 2 decimal places if necessary).`, answer: a };
  }
  function generateSimpleProbabilityDice() {
    const o = [
      { event: 'rolling an even number', num: 3, total: 6 },
      { event: 'rolling a number greater than 4', num: 2, total: 6 },
      { event: 'rolling a prime number (2, 3, 5)', num: 3, total: 6 },
      { event: 'rolling a multiple of 3 (3, 6)', num: 2, total: 6 },
      { event: 'rolling a 5', num: 1, total: 6 },
      { event: 'rolling a number less than 3', num: 2, total: 6 },
    ];
    const co = o[getRandomInt(0, o.length - 1)];
    const ans = simplifyFraction(co.num, co.total);
    return { question: `A standard fair six-sided die is rolled once. What is the probability of ${co.event}? <br>(Give answer as a fraction e.g. a/b or a whole number)`, answer: ans };
  }
  // --- SVG Diagram Generators ---
  function generateAnglesStraightLineSVG() {
    let a1 = getRandomInt(30, 150),
      ans = 180 - a1;
    const sw = 250,
      sh = 150,
      p = 40,
      cx = sw / 2,
      cy = sh - p,
      ll = sw / 2 - p;
    const ar = (a1 * Math.PI) / 180,
      lx2 = cx - ll * Math.cos(ar),
      ly2 = cy - ll * Math.sin(ar);
    const lo = 45,
      katx = cx - lo * Math.cos(ar / 2),
      katy = cy - lo * Math.sin(ar / 2);
    const uar = ((180 - a1) * Math.PI) / 180,
      uatx = cx + lo * Math.cos(uar / 2),
      uaty = cy - lo * Math.sin(uar / 2);
    const arad = 25;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><line x1="${cx - ll}" y1="${cy}" x2="${cx + ll}" y2="${cy}" stroke="currentColor"/><line x1="${cx}" y1="${cy}" x2="${lx2}" y2="${ly2}" stroke="currentColor"/><path d="M ${cx - arad} ${cy} A ${arad} ${arad} 0 0 1 ${cx + arad * Math.cos(Math.PI - ar)} ${cy - arad * Math.sin(ar)}" fill="none" stroke="currentColor" style="stroke-width:1;"/><path d="M ${cx + arad * Math.cos(Math.PI - ar)} ${cy - arad * Math.sin(ar)} A ${arad} ${arad} 0 0 1 ${cx + arad} ${cy}" fill="none" stroke="currentColor" style="stroke-width:1;stroke-dasharray:2,2;"/><text x="${katx}" y="${katy}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none">${a1}°</text><text x="${uatx}" y="${uaty}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none">x°</text></svg>`;
    return { question: `Find the value of angle x° in the diagram.`, answer: ans.toString(), diagram: dh };
  }
  function generatePythagorasHypotSVG() {
    let a, b, c;
    const t = [
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
      [8, 15, 17],
      [7, 24, 25],
    ];
    let base = t[getRandomInt(0, t.length - 1)];
    let m = getRandomInt(1, 2);
    a = base[0] * m;
    b = base[1] * m;
    c = base[2] * m;
    if (Math.random() < 0.5) [a, b] = [b, a];
    const p = 40,
      mvs = 120,
      maxS = Math.max(a, b),
      sf = mvs / maxS,
      sa_s = a * sf,
      sb_s = b * sf,
      sw = sa_s + p * 2,
      sh = sb_s + p * 2,
      ox = p,
      oy = sh - p,
      lo = 12;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:200px;height:auto;"><line x1="${ox}" y1="${oy}" x2="${ox + sa_s}" y2="${oy}" stroke="currentColor"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - sb_s}" stroke="currentColor"/><line x1="${ox + sa_s}" y1="${oy}" x2="${ox}" y2="${oy - sb_s}" stroke="currentColor"/><path d="M ${ox + 5} ${oy} L ${ox + 5} ${oy - 5} L ${ox} ${oy - 5}" fill="none" stroke="currentColor" style="stroke-width:1;"/><text x="${ox + sa_s / 2}" y="${oy + lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${a} cm</text><text x="${ox - lo}" y="${oy - sb_s / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${b} cm</text><text x="${ox + sa_s / 2 + 5}" y="${oy - sb_s / 2 - 5}" font-size="10" text-anchor="middle" dominant-baseline="middle" transform="rotate(${-((Math.atan(sb_s / sa_s) * 180) / Math.PI)} ${ox + sa_s / 2} ${oy - sb_s / 2})" fill="currentColor" stroke="none">x cm</text></svg>`;
    return { question: `Find the length of the hypotenuse (x) in this right-angled triangle.`, answer: c, diagram: dh };
  }
  function generateAreaRectangleSVG() {
    let l = getRandomInt(5, 20),
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
    let l = getRandomInt(5, 20),
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
  function generateAreaCircleSVG() {
    let r = getRandomInt(3, 15),
      ans = Math.PI * r * r;
    const ss = 200,
      p = 40,
      cx = ss / 2,
      cy = ss / 2,
      vr = ss / 2 - p,
      lo = 10;
    const dh = `<svg viewBox="0 0 ${ss} ${ss}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:180px;height:auto;"><circle cx="${cx}" cy="${cy}" r="${vr}" fill="rgba(40,167,69,0.1)" stroke="currentColor"/><line x1="${cx}" y1="${cy}" x2="${cx + vr}" y2="${cy}" stroke="currentColor" stroke-dasharray="3,3"/><circle cx="${cx}" cy="${cy}" r="2" fill="currentColor" stroke="none"/><text x="${cx + vr / 2}" y="${cy - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${r} mm</text></svg>`;
    return { question: `Calculate the area of the circle shown (in mm²). Use π ≈ 3.14159. <br>(Round final answer to 1 decimal place).`, answer: ans, diagram: dh };
  }
  function generateAreaLShapeSVG() {
    let W = getRandomInt(10, 20),
      H = getRandomInt(10, 20),
      w = getRandomInt(3, W - 3),
      h = getRandomInt(3, H - 3);
    let area = W * H - w * h;
    const p = 40,
      mvs = 150,
      mD = Math.max(W, H),
      sf = mvs / mD,
      Ws = W * sf,
      Hs = H * sf,
      ws = w * sf,
      hs = h * sf,
      sw = Ws + p * 2,
      sh = Hs + p * 2,
      ox = p,
      oy = p,
      lo = 12;
    const path = `M ${ox},${oy} H ${ox + Ws} V ${oy + Hs} H ${ox + ws} V ${oy + hs} H ${ox} Z`;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><path d="${path}" fill="rgba(253,126,20,0.1)" stroke="currentColor"/><text x="${ox + Ws / 2}" y="${oy - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text><text x="${ox + Ws + lo}" y="${oy + Hs / 2}" font-size="10" text-anchor="start" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text><text x="${ox + ws + (Ws - ws) / 2}" y="${oy + Hs + lo}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${W - w} u</text><text x="${ox - lo}" y="${oy + hs + (Hs - hs) / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H - h} u</text></svg>`;
    return { question: `Calculate the area of the L-shaped figure shown (in u²).`, answer: area.toString(), diagram: dh };
  }
  function generatePerimeterLShapeSVG() {
    let W = getRandomInt(10, 20),
      H = getRandomInt(10, 20),
      w = getRandomInt(3, W - 3),
      h = getRandomInt(3, H - 3);
    let perimeter = 2 * (W + H);
    const p = 40,
      mvs = 150,
      mD = Math.max(W, H),
      sf = mvs / mD,
      Ws = W * sf,
      Hs = H * sf,
      ws = w * sf,
      hs = h * sf,
      sw = Ws + p * 2,
      sh = Hs + p * 2,
      ox = p,
      oy = p,
      lo = 12;
    const path = `M ${ox},${oy} H ${ox + Ws} V ${oy + Hs} H ${ox + ws} V ${oy + hs} H ${ox} Z`;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><path d="${path}" fill="rgba(253,126,20,0.1)" stroke="currentColor"/><text x="${ox + Ws / 2}" y="${oy - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text><text x="${ox + Ws + lo}" y="${oy + Hs / 2}" font-size="10" text-anchor="start" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text><text x="${ox + ws + (Ws - ws) / 2}" y="${oy + Hs + lo}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${W - w} u</text><text x="${ox - lo}" y="${oy + hs + (Hs - hs) / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H - h} u</text></svg>`;
    return { question: `Calculate the perimeter of the L-shaped figure shown (in u).`, answer: perimeter.toString(), diagram: dh };
  }
  function generateAreaRectSemiCircleSVG() {
    let H = getRandomInt(6, 16);
    if (H % 2 !== 0) H++;
    let W = getRandomInt(H, 20),
      r = H / 2;
    let rectArea = W * H,
      semiCircleArea = 0.5 * Math.PI * r * r,
      totalArea = rectArea + semiCircleArea;
    const p = 35,
      mvs = 150,
      sf = mvs / (W + r),
      Ws = W * sf,
      Hs = H * sf,
      rs = r * sf,
      sw = Ws + rs + p * 2,
      sh = Hs + p * 2,
      ox = p,
      oy = p,
      arcSX = ox + Ws,
      arcSY = oy,
      arcEX = ox + Ws,
      arcEY = oy + Hs,
      lo = 10;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><rect x="${ox}" y="${oy}" width="${Ws}" height="${Hs}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/><path d="M ${arcSX},${arcSY} A ${rs},${rs} 0 0,1 ${arcEX},${arcEY}" fill="rgba(40,167,69,0.1)" stroke="currentColor"/><text x="${ox + Ws / 2}" y="${oy - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text><text x="${ox - lo}" y="${oy + Hs / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text></svg>`;
    return { question: `Calculate the total area (rectangle + semi-circle) shown (in u²). Use π≈3.14159. <br>(Round final answer to 1 decimal place).`, answer: totalArea, diagram: dh };
  }
  function generatePerimeterRectSemiCircleSVG() {
    let H = getRandomInt(6, 16);
    if (H % 2 !== 0) H++;
    let W = getRandomInt(H, 20),
      r = H / 2;
    let rectP = H + W + H,
      semiArc = Math.PI * r,
      totalP = rectP + semiArc;
    const p = 35,
      mvs = 150,
      sf = mvs / (W + r),
      Ws = W * sf,
      Hs = H * sf,
      rs = r * sf,
      sw = Ws + rs + p * 2,
      sh = Hs + p * 2,
      ox = p,
      oy = p,
      arcSX = ox + Ws,
      arcSY = oy,
      arcEX = ox + Ws,
      arcEY = oy + Hs,
      lo = 10;
    const dh = `<svg viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;"><line x1="${ox}" y1="${oy}" x2="${ox + Ws}" y2="${oy}" stroke="currentColor"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy + Hs}" stroke="currentColor"/><line x1="${ox}" y1="${oy + Hs}" x2="${ox + Ws}" y2="${oy + Hs}" stroke="currentColor"/><path d="M ${arcSX},${arcSY} A ${rs},${rs} 0 0,1 ${arcEX},${arcEY}" fill="none" stroke="currentColor"/><text x="${ox + Ws / 2}" y="${oy - lo}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text><text x="${ox - lo}" y="${oy + Hs / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text></svg>`;
    return { question: `Calculate the perimeter of the composite shape shown (in u). Use π≈3.14159. <br>(Round final answer to 1 decimal place).`, answer: totalP, diagram: dh };
  }
}); // END OF DOMContentLoaded LISTENER
