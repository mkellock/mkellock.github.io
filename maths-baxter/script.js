document.addEventListener('DOMContentLoaded', () => {
  // START OF DOMContentLoaded LISTENER
  console.log("DOM Content Loaded. Initializing Baxter's Year 6 script...");

  // --- Configuration & Constants ---
  const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes
  // const SESSION_DURATION_SECONDS = 60; // Use a short duration for testing
  const MOTIVATIONAL_MESSAGES = ["Keep pushing, you're doing great!", 'Every problem solved makes you stronger!', 'Focus and determination lead to success!', 'Believe in your ability to figure it out!', 'Mistakes are learning opportunities. Keep trying!', "You've got this, Baxter!", 'One question at a time.', 'Embrace the challenge!', 'Math power activated!', 'Stay sharp, stay focused!', 'Precision and practice make perfect.', 'Excellent effort!', 'Keep that brain working!'];
  // --- YEAR 6 CURRICULUM CATEGORIES ---
  const categories = {
    number: {
      name: 'Number & Place Value',
      skills: [
        { name: 'Identify Place Value (Large Numbers)', generator: generatePlaceValueLarge, checker: checkNumericAnswer },
        { name: 'Multiply/Divide by Powers of 10', generator: generateMultDivPowers10, checker: checkNumericAnswer },
        { name: 'Addition/Subtraction (Large Numbers)', generator: generateAddSubLarge, checker: checkNumericAnswer },
        { name: 'Multiplication (e.g., 3-digit x 2-digit)', generator: generateMultiplicationMultiDigit, checker: checkNumericAnswer },
        { name: 'Division (e.g., 3-digit by 1-digit)', generator: generateDivisionSimple, checker: checkNumericAnswer },
        { name: 'Prime/Composite Numbers', generator: generatePrimeComposite, checker: checkExactStringAnswer },
      ],
    },
    fractions_decimals: {
      name: 'Fractions & Decimals',
      skills: [
        { name: 'Compare Fractions (Related Denominators)', generator: generateCompareFractionsRelated, checker: checkExactStringAnswer },
        { name: 'Add/Sub Fractions (Related Denominators)', generator: generateAddSubFractionsRelated, checker: checkFractionAnswer },
        { name: 'Multiply Decimals by Whole Number', generator: generateDecimalMultWhole, checker: checkNumericAnswerTolerance(0.001) },
        { name: 'Fraction/Decimal Conversion (Simple)', generator: generateFracDecConversionSimple, checker: checkNumericAnswerTolerance(0.001) },
        { name: 'Percentage of Quantity (Simple %)', generator: generatePercentageOfQuantitySimple, checker: checkNumericAnswer },
      ],
    },
    patterns_algebra: {
      name: 'Patterns & Algebra',
      skills: [
        { name: 'Continue Number Pattern (Addition/Subtraction)', generator: generatePatternAddSub, checker: checkNumericAnswer },
        { name: 'Find Rule for Pattern (Simple)', generator: generateFindRuleSimple, checker: checkExactStringAnswer },
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
        { name: 'Calculate Area (Triangle - SVG)', generator: generateAreaTriangleSVG, checker: checkNumericAnswerTolerance(0.1) },
        { name: 'Elapsed Time (Hours/Minutes)', generator: generateElapsedTime, checker: checkExactStringAnswer },
        { name: 'Read 24-Hour Time', generator: generateRead24HourTime, checker: checkExactStringAnswer },
      ],
    },
    geometry: {
      name: 'Geometry',
      skills: [
        { name: 'Identify Angle Type (SVG)', generator: generateAngleTypeSVG, checker: checkExactStringAnswer },
        { name: 'Angles on a Point/Line (Simple)', generator: generateAnglesPointLineSimpleSVG, checker: checkNumericAnswer },
        { name: 'Coordinates (First Quadrant)', generator: generateCoordinatesFirstQuadrant, checker: checkExactStringAnswer },
        { name: 'Describe Transformation (Simple)', generator: generateDescribeTransformationSimple, checker: checkExactStringAnswer },
      ],
    },
    statistics_probability: {
      name: 'Statistics & Probability',
      skills: [
        { name: 'Interpret Column Graph (Simple)', generator: generateInterpretColumnGraph, checker: checkNumericAnswer },
        { name: 'Calculate Simple Probability (Fraction)', generator: generateSimpleProbabilityFraction, checker: checkFractionAnswer },
        { name: 'List Outcomes', generator: generateListOutcomes, checker: checkExactStringAnswer },
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
    } else if (!element && !isEssential) {
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
  let incorrectlyAnsweredQuestions = []; // <<< ADDED: Array to store incorrect questions

  // --- Halt initialization if essential elements are missing ---
  if (!essentialElementsAvailable) {
    displayInitializationError(new Error('Essential HTML structure is missing.'));
    return;
  }
  console.log('Essential structural DOM elements verified.');

  // --- Initialization ---
  try {
    progress = loadProgress(); // Uses _Baxter key
    previousSessionQuestionsCompleted = loadPreviousSessionCount(); // Uses _Baxter key
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
  const submitBtn = getElement('submit-answer');
  if (submitBtn) submitBtn.addEventListener('click', handleSubmitAnswer);
  const answerInput = getElement('user-answer');
  if (answerInput) answerInput.addEventListener('keypress', handleEnterKey);
  const nextBtn = getElement('next-question');
  if (nextBtn) nextBtn.addEventListener('click', () => displayNextQuestion(true));
  if (themeToggle) themeToggle.addEventListener('change', handleThemeToggle);
  const backBtn = getElement('back-to-home-btn');
  if (backBtn) backBtn.addEventListener('click', () => setActiveView('home-view'));
  const endEarlyBtn = getElement('end-session-early-btn');
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
        const summaryCountEl = getElement('session-summary-count');
        if (summaryCountEl) summaryCountEl.textContent = currentSessionQuestionsCompleted;
        else console.warn('sessionSummaryCount not found.');

        // --- START: Display Incorrect Questions ---
        const incorrectListDiv = getElement('incorrect-list', false); // Non-essential
        if (incorrectListDiv) {
          incorrectListDiv.innerHTML = ''; // Clear previous content
          if (incorrectlyAnsweredQuestions.length === 0) {
            incorrectListDiv.innerHTML = '<p>No incorrect answers this session. Well done!</p>';
            console.log('No incorrect questions to display.');
          } else {
            console.log(`Displaying ${incorrectlyAnsweredQuestions.length} incorrect questions.`);
            const ul = document.createElement('ul');
            ul.className = 'incorrect-questions-list'; // Add class for styling
            incorrectlyAnsweredQuestions.forEach((item, index) => {
              const li = document.createElement('li');
              let displayAnswer = item.correctAnswer;
              // Format answer for display
              if (typeof displayAnswer === 'number') {
                if (Math.abs(displayAnswer - Math.round(displayAnswer)) < 0.0001) {
                  displayAnswer = Math.round(displayAnswer);
                } else if (Math.abs(displayAnswer - displayAnswer.toFixed(1)) < 0.0001) {
                  displayAnswer = displayAnswer.toFixed(1);
                } else if (Math.abs(displayAnswer - displayAnswer.toFixed(2)) < 0.0001) {
                  displayAnswer = displayAnswer.toFixed(2);
                } else {
                  displayAnswer = displayAnswer.toFixed(4); // Fallback precision
                }
              } else if (typeof displayAnswer === 'string' && displayAnswer.includes('/')) {
                // Keep fraction string as is
              } else {
                displayAnswer = String(displayAnswer); // Convert others to string
              }

              li.innerHTML = `
                <p><strong>Question ${index + 1}:</strong> ${item.questionText}</p>
                ${item.questionDiagramHTML ? `<div class="review-diagram">${item.questionDiagramHTML}</div>` : ''}
                <p><em>Your answer: ${item.userAnswer || '(No answer entered)'}</em></p>
                <p><strong>Correct answer: ${displayAnswer}</strong></p>
              `;
              ul.appendChild(li);
            });
            incorrectListDiv.appendChild(ul);

            // Re-apply theme styles to SVGs in the review list
            setTimeout(() => {
              const reviewSvgs = incorrectListDiv.querySelectorAll('.review-diagram svg');
              console.log(`Found ${reviewSvgs.length} SVGs in review list to style.`);
              if (reviewSvgs.length > 0) {
                reviewSvgs.forEach((svgEl) => applyThemeToSVG(svgEl)); // Use helper
                console.log('Applied theme styles to review SVGs.');
              }
            }, 150); // Delay slightly
          }
        } else {
          console.warn('Element with ID "incorrect-list" not found.');
        }
        // --- END: Display Incorrect Questions ---

        document.body.style.overflow = 'hidden'; // Keep overflow hidden
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
    const prevCountDisplay = getElement('previous-session-count');
    const currentCountDisplay = getElement('current-session-count');
    try {
      console.log('Start Session clicked!');
      isSessionActive = true;
      currentSessionQuestionsCompleted = 0;
      incorrectlyAnsweredQuestions = []; // <<< ADDED: Clear list for new session
      console.log('Cleared incorrectly answered questions list.');
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
    savePreviousSessionCount(currentSessionQuestionsCompleted); // Uses _Baxter key
    saveProgress(); // Uses _Baxter key, save before view switch
    setActiveView('session-end-view'); // Switch view *after* saving
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
    const timerDisp = getElement('timer-display');
    if (!timerDisp) return;
    const minutes = Math.floor(sessionTimeRemaining / 60);
    const seconds = sessionTimeRemaining % 60;
    timerDisp.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  function displayMotivationalMessage() {
    const motivationEl = getElement('motivational-message');
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
    const qTitle = getElement('quiz-category-title'),
      qText = getElement('question-text'),
      qDiag = getElement('question-diagram'),
      qAns = getElement('user-answer'),
      qSub = getElement('submit-answer'),
      qNext = getElement('next-question');
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
      if (qData === null) throw new Error(`Generator for '${skill.name}' returned null (intended skip).`); // Handle null return for skipping
      if (!qData || typeof qData.question === 'undefined' || typeof qData.answer === 'undefined' || typeof skill.checker !== 'function') throw new Error(`Data/checker issue for '${skill.name}'.`);
      currentQuestion = { categoryId: catId, skillIndex: skillIdx, questionText: qData.question, questionDiagramHTML: qData.diagram || '', correctAnswer: qData.answer, checker: skill.checker };
      qText.innerHTML = currentQuestion.questionText; // Use innerHTML for potential HTML tags
      qDiag.innerHTML = currentQuestion.questionDiagramHTML;
      const svgEl = qDiag.querySelector('svg');
      if (svgEl) {
        applyThemeToSVG(svgEl); // Apply theme colors to new SVG
      }
    } catch (error) {
      if (error.message.includes('returned null')) {
        // Check if it was an intended skip
        console.log(`Skipping question type: ${skill?.name || 'Unknown'}`);
        setTimeout(() => displayNextQuestion(false), 50); // Try next question immediately
        return;
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
    const qAns = getElement('user-answer');
    const qSub = getElement('submit-answer');
    const qNext = getElement('next-question');
    const qCount = getElement('current-session-count');
    if (!currentQuestion || !isSessionActive || !qSub || !qNext || !qAns || !qCount) {
      console.error('Submit aborted: Missing elements/inactive.');
      return;
    }
    const uAns = qAns.value.trim();
    if (uAns === '' && String(currentQuestion.correctAnswer) !== '' && String(currentQuestion.correctAnswer) !== '0') {
      console.log('Empty answer submitted when correct answer is not empty or 0. Aborting.');
      showFeedback(false, 'Please enter an answer.'); // Give feedback
      return;
    }
    try {
      const isCorrect = currentQuestion.checker(uAns, currentQuestion.correctAnswer);

      // --- START: ADDED --- Store incorrect question details
      if (!isCorrect) {
        incorrectlyAnsweredQuestions.push({
          questionText: currentQuestion.questionText, // Store raw question text/HTML
          questionDiagramHTML: currentQuestion.questionDiagramHTML, // Store diagram HTML
          correctAnswer: currentQuestion.correctAnswer, // Store the raw correct answer
          userAnswer: uAns, // Store user's answer
        });
        console.log('Added incorrect question to list. Count:', incorrectlyAnsweredQuestions.length);
      }
      // --- END: ADDED ---

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
    const qSub = getElement('submit-answer'),
      qNext = getElement('next-question');
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
    const fText = getElement('feedback-text'),
      fAnim = getElement('correct-animation');
    if (!fText || !fAnim) return;
    let fMsg = '';
    if (isCorrect) {
      fMsg = 'Correct!';
    } else {
      let dA = correctAnswer;
      // Format answer for display (similar to review list formatting)
      if (typeof dA === 'number') {
        dA = parseFloat(dA.toFixed(4)); // Keep reasonable precision
      } else if (typeof dA === 'string' && dA.includes('/')) {
        // dA is already a simplified fraction string
      } else if (dA === null || typeof dA === 'undefined') {
        dA = '[Internal Error]';
      } else {
        dA = dA.toString(); // Convert others to string
      }
      const displayUserAnswer = document.getElementById('user-answer')?.value.trim();
      if (fMsg === 'Please enter an answer.') {
        // Don't override specific message
      } else if (displayUserAnswer === '' && fMsg !== 'Please enter an answer.') {
        fMsg = `Not quite! The answer was: ${dA}`;
      } else {
        fMsg = `Not quite! The answer was: ${dA}`;
      }
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
    const fText = getElement('feedback-text'),
      fAnim = getElement('correct-animation');
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
    const detailsDiv = getElement('report-details');
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
      // Check if canvas exists before replacing innerHTML
      if (chartContainer.querySelector('canvas')) {
        chartContainer.querySelector('canvas').style.display = 'none'; // Hide canvas
      }
      if (!chartContainer.querySelector('p.no-chart-data')) {
        // Add check for existing message
        const noDataMsg = document.createElement('p');
        noDataMsg.textContent = 'Complete a session for chart.';
        noDataMsg.style.textAlign = 'center';
        noDataMsg.style.color = 'var(--text-muted)';
        noDataMsg.style.paddingTop = '50px';
        noDataMsg.className = 'no-chart-data'; // Add class to identify
        chartContainer.appendChild(noDataMsg);
      }
      console.log('No data for chart.');
      return;
    } else {
      // Remove 'no data' message if it exists
      const noDataMsg = chartContainer.querySelector('p.no-chart-data');
      if (noDataMsg) noDataMsg.remove();

      // Ensure canvas exists and is visible
      if (!chartContainer.querySelector('canvas')) {
        chartContainer.innerHTML = ''; // Clear potentially wrong content
        chartContainer.appendChild(canvasElementCheck); // Re-add canvas
        console.log('Re-added canvas.');
      } else {
        chartContainer.querySelector('canvas').style.display = 'block'; // Make sure it's visible
      }
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
        // Ensure progress structure is valid
        Object.keys(p).forEach((k) => {
          if (!p[k].name && categories[k]) p[k].name = categories[k].name;
          if (typeof p[k].attempted !== 'number') p[k].attempted = 0;
          if (typeof p[k].correct !== 'number') p[k].correct = 0;
          p[k].mastery = p[k].attempted > 0 ? p[k].correct / p[k].attempted : 0;
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
      const sT = localStorage.getItem('theme'); // Use generic theme key
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
      // Update chart colors if visible
      if (currentView === 'home-view' && progressChart) {
        renderProgressReport(); // Re-render chart with new theme colors
      }
      // Update current SVG colors if in quiz view
      if (currentView === 'quiz-view') {
        const currentSVG = getElement('question-diagram', false)?.querySelector('svg');
        if (currentSVG) applyThemeToSVG(currentSVG);
      }
      // Update SVG colors in review list if visible
      if (currentView === 'session-end-view') {
        const reviewSvgs = getElement('incorrect-list', false)?.querySelectorAll('.review-diagram svg');
        if (reviewSvgs && reviewSvgs.length > 0) {
          reviewSvgs.forEach((svgEl) => applyThemeToSVG(svgEl)); // Use helper
        }
      }
    } catch (e) {
      console.error('Theme toggle error:', e);
    }
  }
  // Helper function to apply theme colors to an SVG element
  function applyThemeToSVG(svgEl) {
    if (!svgEl) return;
    try {
      const bs = getComputedStyle(document.body);
      const ct = bs.getPropertyValue('--text-color');
      svgEl.style.stroke = ct; // Set default stroke for the SVG container
      svgEl.querySelectorAll('text, tspan').forEach((t) => (t.style.fill = ct));
      svgEl.querySelectorAll('line, path, rect, circle').forEach((s) => {
        if (s.style.stroke !== 'none' && !s.getAttribute('stroke')) {
          s.style.stroke = 'currentColor';
        }
      });
      console.log('Applied theme styles to SVG.');
    } catch (e) {
      console.error('Error applying theme to SVG:', e);
    }
  }

  // --- Answer Checkers ---
  function checkNumericAnswer(ua, ca) {
    const nu = parseFloat(ua),
      nc = parseFloat(ca);
    return !isNaN(nu) && !isNaN(nc) && Math.abs(nu - nc) < 1e-9; // Use tolerance
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
    // Trim extra spaces and ignore case for robustness
    const cu = ua.replace(/\s+/g, '').toLowerCase();
    const cc = (ca || '').toString().replace(/\s+/g, '').toLowerCase();
    return cu === cc;
  }
  function checkFractionAnswer(ua, ca) {
    try {
      // Correct Answer Processing
      const cs = (ca || '').toString().trim();
      const cp = cs
        .split('/')
        .map((s) => s.trim())
        .map(Number);
      let cv; // Correct value (decimal)
      if (cp.length === 2) {
        if (cp[1] === 0 || isNaN(cp[0]) || isNaN(cp[1])) return false; // Invalid fraction
        cv = cp[0] / cp[1];
      } else if (cp.length === 1) {
        if (isNaN(cp[0])) return false; // Invalid number
        cv = cp[0];
      } else {
        return false; // Not a valid number or fraction string
      }

      // User Answer Processing
      const us = ua.trim();
      if (us === '') return false; // Empty answer is incorrect

      if (!us.includes('/')) {
        // User entered a decimal or whole number
        const un = parseFloat(us);
        if (isNaN(un)) return false; // Not a number
        return Math.abs(un - cv) < 1e-6; // Compare decimal values with tolerance
      } else {
        // User entered a fraction
        const up = us
          .split('/')
          .map((s) => s.trim())
          .map(Number);
        if (up.length !== 2 || isNaN(up[0]) || isNaN(up[1]) || up[1] === 0) return false; // Invalid fraction format
        const uv = up[0] / up[1]; // User value (decimal)
        return Math.abs(uv - cv) < 1e-6; // Compare decimal values with tolerance
      }
    } catch (e) {
      console.error('Fraction check error:', e);
      return false;
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
    const commonDivisor = gcd(n, d);
    let num = n / commonDivisor;
    let den = d / commonDivisor;
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
    const places = [
      { power: 1000, name: 'thousands' },
      { power: 10000, name: 'ten thousands' },
      { power: 100000, name: 'hundred thousands' },
      { power: 1000000, name: 'millions' },
    ];
    const chosenPlace = places[getRandomInt(0, places.length - 1)];
    const pv = chosenPlace.power;
    const num = getRandomInt(1, 9) * pv + getRandomInt(0, pv - 1);
    const digit = Math.floor(num / pv) % 10;

    const questionType = getRandomInt(0, 1); // 0: ask for digit, 1: ask for value
    let questionText = '';
    let answer = '';

    if (questionType === 0) {
      questionText = `In the number ${num.toLocaleString()}, what digit is in the ${chosenPlace.name} place?`;
      answer = digit.toString();
    } else {
      // Ensure the digit isn't 0 when asking for value
      let valueDigit = digit;
      let valueNum = num;
      if (valueDigit === 0) {
        // Find a non-zero digit's place value to ask about instead
        let tempNumStr = String(num);
        let nonZeroIndex = -1;
        for (let i = 0; i < tempNumStr.length; i++) {
          if (tempNumStr[i] !== '0') {
            nonZeroIndex = i;
            break;
          }
        }
        if (nonZeroIndex !== -1) {
          let newPower = 10 ** (tempNumStr.length - 1 - nonZeroIndex);
          valueDigit = parseInt(tempNumStr[nonZeroIndex]);
          questionText = `In the number ${num.toLocaleString()}, what is the value of the digit ${valueDigit}?`;
          answer = (valueDigit * newPower).toLocaleString();
        } else {
          // Should not happen if num > 0
          questionText = `In the number ${num.toLocaleString()}, what is the value of the digit 0?`;
          answer = '0';
        }
      } else {
        questionText = `In the number ${num.toLocaleString()}, what is the value of the digit ${digit}?`;
        answer = (digit * pv).toLocaleString();
      }
    }

    return { question: questionText, answer: answer.replace(/,/g, '') }; // Return value without commas for checking
  }
  function generateMultDivPowers10() {
    const num = getRandomInt(1, 5000) / (getRandomInt(0, 1) === 0 ? 1 : 10); // Allow decimals
    const power = 10 ** getRandomInt(1, 3); // 10, 100, 1000
    const operation = getRandomInt(0, 1); // 0 for multiply, 1 for divide

    let questionText = '';
    let answer = 0;

    if (operation === 0) {
      // Multiply
      questionText = `Calculate: ${num} × ${power}`;
      answer = num * power;
    } else {
      // Divide
      questionText = `Calculate: ${num} ÷ ${power}`;
      answer = num / power;
    }

    // Format answer to avoid floating point issues for simple cases
    let formattedAnswer;
    if (answer === Math.floor(answer)) {
      formattedAnswer = answer.toString();
    } else {
      formattedAnswer = parseFloat(answer.toFixed(5)).toString(); // Keep some precision for division results
    }

    return { question: questionText, answer: formattedAnswer, checker: checkNumericAnswerTolerance(1e-6) };
  }
  function generateAddSubLarge() {
    const num1 = getRandomInt(1000, 99999);
    const num2 = getRandomInt(1000, num1 - 1); // Ensure num2 is smaller for subtraction
    const operation = getRandomInt(0, 1); // 0 for addition, 1 for subtraction

    let questionText = '';
    let answer = 0;

    if (operation === 0) {
      // Addition
      questionText = `Calculate: ${num1.toLocaleString()} + ${num2.toLocaleString()}`;
      answer = num1 + num2;
    } else {
      // Subtraction
      questionText = `Calculate: ${num1.toLocaleString()} - ${num2.toLocaleString()}`;
      answer = num1 - num2;
    }

    return { question: questionText, answer: answer.toString() };
  }
  function generateMultiplicationMultiDigit() {
    const num1 = getRandomInt(100, 999); // 3-digit
    const num2 = getRandomInt(10, 99); // 2-digit
    const questionText = `Calculate: ${num1} × ${num2}`;
    const answer = num1 * num2;
    return { question: questionText, answer: answer.toString() };
  }
  function generateDivisionSimple() {
    // Ensure dividend is perfectly divisible by divisor for Year 6 level
    const divisor = getRandomInt(2, 9); // 1-digit divisor
    const quotient = getRandomInt(20, 200); // Result (quotient)
    const dividend = divisor * quotient; // Calculate dividend based on desired result
    const questionText = `Calculate: ${dividend} ÷ ${divisor}`;
    const answer = quotient;
    return { question: questionText, answer: answer.toString() };
  }
  function generatePrimeComposite() {
    const num = getRandomInt(2, 100);
    let isPrime = true;

    if (num <= 1) {
      isPrime = false; // 1 and numbers less than 1 are not prime
    } else {
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) {
          isPrime = false; // Found a factor, so it's composite
          break;
        }
      }
    }

    const answer = isPrime ? 'prime' : 'composite';
    const questionText = `Is the number ${num} prime or composite?`;
    return { question: questionText, answer: answer };
  }
  // Fractions & Decimals
  function generateCompareFractionsRelated() {
    const factor = getRandomInt(2, 4); // Multiplier for denominator
    const d1 = getRandomInt(2, 6); // First denominator
    const d2 = d1 * factor; // Second denominator (related)
    let n1 = getRandomInt(1, d1 - 1); // Numerator 1 (less than d1)
    let n2 = getRandomInt(1, d2 - 1); // Numerator 2 (less than d2)

    const val1 = n1 / d1;
    const val2 = n2 / d2;

    // Avoid making them equal too often unless intended
    if (Math.random() < 0.7 && Math.abs(val1 - val2) < 0.001) {
      // If they accidentally became equal, try changing n2
      let originalN2 = n2;
      do {
        n2 = getRandomInt(1, d2 - 1);
      } while (n2 === originalN2 && d2 > 1); // Prevent infinite loop if d2 is 1 (shouldn't happen here)
    }

    const finalVal1 = n1 / d1;
    const finalVal2 = n2 / d2;

    const answer = Math.abs(finalVal1 - finalVal2) < 0.001 ? '=' : finalVal1 > finalVal2 ? '>' : '<';
    const questionText = `Compare the fractions: <sup>${n1}</sup>⁄<sub>${d1}</sub> and <sup>${n2}</sup>⁄<sub>${d2}</sub>. <br>Enter >, <, or =.`;
    return { question: questionText, answer: answer };
  }
  function generateAddSubFractionsRelated() {
    const factor = getRandomInt(2, 3); // Factor between denominators
    const d1 = getRandomInt(2, 5); // Smaller denominator
    const d2 = d1 * factor; // Larger denominator
    let n1 = getRandomInt(1, d1 - 1); // Numerator for smaller denominator
    let n2 = getRandomInt(1, d2 - 1); // Numerator for larger denominator

    const operation = getRandomInt(0, 1); // 0 for addition, 1 for subtraction

    let commonDenom = d2;
    let num1Converted = n1 * factor; // Convert n1 to have the common denominator d2
    let resultNum;
    let questionText;

    if (operation === 0) {
      // Addition
      resultNum = num1Converted + n2;
      questionText = `Calculate: <sup>${n1}</sup>⁄<sub>${d1}</sub> + <sup>${n2}</sup>⁄<sub>${d2}</sub>`;
    } else {
      // Subtraction
      // Ensure the result is not negative for this level
      if (num1Converted < n2) {
        // Swap fractions if n1/d1 is smaller than n2/d2
        [n1, n2] = [n2, n1]; // Swap numerators
        [d1, d2] = [d2, d1]; // Swap denominators (d1 is now larger)
        let tempFactor = d1 / d2; // Calculate the new factor
        num1Converted = n1; // n1 already has the common denominator d1
        let num2Converted = n2 * tempFactor; // Convert n2 to common denominator d1
        resultNum = num1Converted - num2Converted;
        commonDenom = d1; // Common denominator is now the original d2
        questionText = `Calculate: <sup>${n1}</sup>⁄<sub>${d1}</sub> - <sup>${n2}</sup>⁄<sub>${d2}</sub>`;
      } else {
        // n1/d1 is >= n2/d2, proceed normally
        resultNum = num1Converted - n2;
        questionText = `Calculate: <sup>${n1}</sup>⁄<sub>${d1}</sub> - <sup>${n2}</sup>⁄<sub>${d2}</sub>`;
      }
    }

    const answer = simplifyFraction(resultNum, commonDenom);
    questionText += ` <br>(Give answer as a simplified fraction e.g. a/b or a whole number)`;
    return { question: questionText, answer: answer };
  }
  function generateDecimalMultWhole() {
    const decimal = getRandomInt(1, 99) / 10; // e.g., 0.1 to 9.9
    const whole = getRandomInt(2, 12);
    const answer = decimal * whole;
    const questionText = `Calculate: ${decimal} × ${whole}`;
    // Use tolerance checker for potential floating point results
    return { question: questionText, answer: parseFloat(answer.toFixed(5)), checker: checkNumericAnswerTolerance(1e-6) };
  }
  function generateFracDecConversionSimple() {
    const fractions = [
      { f: '1/2', d: 0.5 },
      { f: '1/4', d: 0.25 },
      { f: '3/4', d: 0.75 },
      { f: '1/5', d: 0.2 },
      { f: '2/5', d: 0.4 },
      { f: '3/5', d: 0.6 },
      { f: '4/5', d: 0.8 },
      { f: '1/10', d: 0.1 },
      { f: '3/10', d: 0.3 },
      { f: '7/10', d: 0.7 },
      { f: '9/10', d: 0.9 },
      // Maybe add 1/8 = 0.125? Let's stick to simpler ones for now.
      // { f: '1/8', d: 0.125 }, { f: '3/8', d: 0.375 }, { f: '5/8', d: 0.625 }, { f: '7/8', d: 0.875 }
    ];
    const chosen = fractions[getRandomInt(0, fractions.length - 1)];
    const convertTo = getRandomInt(0, 1); // 0: fraction to decimal, 1: decimal to fraction

    let questionText, answer, checker;

    if (convertTo === 0) {
      // Fraction to Decimal
      const parts = chosen.f.split('/');
      questionText = `Convert <sup>${parts[0]}</sup>⁄<sub>${parts[1]}</sub> to a decimal.`;
      answer = chosen.d;
      checker = checkNumericAnswerTolerance(0.001);
    } else {
      // Decimal to Fraction
      questionText = `Convert ${chosen.d} to a simple fraction (e.g., a/b).`;
      answer = chosen.f;
      checker = checkFractionAnswer; // Use fraction checker
    }

    return { question: questionText, answer: answer, checker: checker };
  }
  function generatePercentageOfQuantitySimple() {
    const percentages = [10, 20, 25, 50, 75]; // Common simple percentages
    const chosenPercent = percentages[getRandomInt(0, percentages.length - 1)];
    let quantity;

    // Choose quantity such that the answer is likely an integer
    if (chosenPercent === 10 || chosenPercent === 20) {
      // Divisible by 10 or 5
      quantity = getRandomInt(2, 15) * 10;
    } else if (chosenPercent === 25 || chosenPercent === 75) {
      // Divisible by 4
      quantity = getRandomInt(2, 12) * 4;
    } else {
      // 50%, divisible by 2
      quantity = getRandomInt(2, 20) * 2;
    }

    const answer = (chosenPercent / 100) * quantity;
    const questionText = `Calculate ${chosenPercent}% of ${quantity}`;
    return { question: questionText, answer: answer.toString() };
  }
  // Patterns & Algebra
  function generatePatternAddSub() {
    const start = getRandomInt(1, 50);
    const diff = getRandomInt(2, 15) * (getRandomInt(0, 1) === 0 ? 1 : -1); // Can be add or subtract
    const terms = [start];
    for (let i = 1; i < 4; i++) {
      // Generate first 4 terms
      terms.push(terms[i - 1] + diff);
    }
    const answer = terms[3] + diff; // Calculate the 5th term
    const questionText = `What is the next number in the pattern: ${terms.join(', ')}, ...?`;
    return { question: questionText, answer: answer.toString() };
  }
  function generateFindRuleSimple() {
    const type = getRandomInt(0, 2); // 0: Add, 1: Subtract, 2: Multiply
    let ruleDescription = '';
    let sequence = [];
    let start, difference, multiplier;

    if (type === 0) {
      // Addition
      start = getRandomInt(1, 20);
      difference = getRandomInt(2, 9);
      for (let i = 0; i < 4; i++) sequence.push(start + i * difference);
      ruleDescription = `add ${difference}`;
    } else if (type === 1) {
      // Subtraction
      start = getRandomInt(30, 60);
      difference = getRandomInt(2, 9);
      for (let i = 0; i < 4; i++) sequence.push(start - i * difference);
      ruleDescription = `subtract ${difference}`;
    } else {
      // Multiplication (simple)
      start = getRandomInt(2, 5);
      multiplier = getRandomInt(2, 3); // Keep multiplier small
      sequence.push(start);
      for (let i = 1; i < 4; i++) sequence.push(sequence[i - 1] * multiplier);
      ruleDescription = `multiply by ${multiplier}`;
    }

    const questionText = `What is the rule for this pattern: ${sequence.join(', ')}, ...? <br>(e.g., 'add 5', 'subtract 3', 'multiply by 2')`;
    return { question: questionText, answer: ruleDescription };
  }
  function generateOrderOfOpsSimple() {
    let a = getRandomInt(2, 10),
      b = getRandomInt(2, 10),
      c = getRandomInt(2, 10);
    let questionText = '',
      answer = 0;
    const type = getRandomInt(0, 3); // Different structures

    switch (type) {
      case 0: // a + b * c
        questionText = `${a} + ${b} × ${c}`;
        answer = a + b * c;
        break;
      case 1: // (a + b) * c
        // Ensure a+b is reasonable
        a = getRandomInt(1, 5);
        b = getRandomInt(1, 5);
        c = getRandomInt(2, 5);
        questionText = `(${a} + ${b}) × ${c}`;
        answer = (a + b) * c;
        break;
      case 2: // a * b - c
        a = getRandomInt(5, 12);
        b = getRandomInt(2, 10);
        c = getRandomInt(1, a * b - 1); // Ensure positive result
        questionText = `${a} × ${b} - ${c}`;
        answer = a * b - c;
        break;
      case 3: // a + b ÷ c (ensure division is whole)
        c = getRandomInt(2, 5);
        b = getRandomInt(1, 10) * c; // b is a multiple of c
        a = getRandomInt(1, 20);
        questionText = `${a} + ${b} ÷ ${c}`;
        answer = a + b / c;
        break;
      // Could add cases like a - b * c, (a - b) * c, a * (b + c) etc.
    }

    return { question: `Calculate: ${questionText}`, answer: answer.toString() };
  }
  // Measurement
  function generateConvertLength() {
    const units = [
      { from: 'm', to: 'cm', factor: 100 },
      { from: 'cm', to: 'm', factor: 0.01 },
      { from: 'cm', to: 'mm', factor: 10 },
      { from: 'mm', to: 'cm', factor: 0.1 },
      { from: 'm', to: 'mm', factor: 1000 },
      { from: 'mm', to: 'm', factor: 0.001 },
      // Adding km
      { from: 'km', to: 'm', factor: 1000 },
      { from: 'm', to: 'km', factor: 0.001 },
    ];
    const conversion = units[getRandomInt(0, units.length - 1)];
    let startValue;

    // Adjust start value ranges for sensibility
    if (conversion.from === 'km') startValue = getRandomInt(1, 15);
    else if (conversion.from === 'm' && conversion.to === 'mm') startValue = getRandomInt(1, 5);
    else if (conversion.from === 'm' && conversion.to === 'km') startValue = getRandomInt(500, 9500);
    else if (conversion.from === 'mm' && conversion.to === 'm') startValue = getRandomInt(1000, 9000);
    else if (conversion.from === 'cm' && conversion.to === 'm') startValue = getRandomInt(100, 9000);
    else startValue = getRandomInt(1, 500); // Default range

    // Add occasional decimal start values
    if (Math.random() < 0.3 && conversion.factor > 1) {
      // More likely for m->cm, cm->mm etc.
      startValue = getRandomInt(10, 500) / 10;
    }

    const answer = startValue * conversion.factor;
    const questionText = `Convert ${startValue}${conversion.from} to ${conversion.to}.`;

    // Use tolerance checker due to potential floating point results from division/decimals
    return { question: questionText, answer: parseFloat(answer.toFixed(5)), checker: checkNumericAnswerTolerance(1e-6) };
  }
  function generateConvertMass() {
    const units = [
      { from: 'kg', to: 'g', factor: 1000 },
      { from: 'g', to: 'kg', factor: 0.001 },
      // Could add tonnes if appropriate for Year 6 curriculum
      // { from: 't', to: 'kg', factor: 1000 },
      // { from: 'kg', to: 't', factor: 0.001 },
    ];
    const conversion = units[getRandomInt(0, units.length - 1)];
    let startValue;

    if (conversion.from === 'kg') {
      // Include some decimal kgs like 1.5kg, 2.2kg
      startValue = getRandomInt(0, 1) === 0 ? getRandomInt(1, 25) : getRandomInt(10, 250) / 10;
    } else {
      // g to kg
      startValue = getRandomInt(100, 9500); // Use grams like 500g, 1250g, etc.
    }

    const answer = startValue * conversion.factor;
    const questionText = `Convert ${startValue}${conversion.from} to ${conversion.to}.`;

    return { question: questionText, answer: parseFloat(answer.toFixed(5)), checker: checkNumericAnswerTolerance(1e-6) };
  }
  function generateAreaTriangleSVG() {
    let base = getRandomInt(4, 16);
    let height = getRandomInt(3, 12);
    let answer = 0.5 * base * height;

    const padding = 35;
    const maxViewSize = 150;
    const maxDim = Math.max(base, height);
    const scaleFactor = maxViewSize / maxDim;
    const baseScaled = base * scaleFactor;
    const heightScaled = height * scaleFactor;
    const svgWidth = baseScaled + padding * 2;
    const svgHeight = heightScaled + padding * 2;
    const originX = padding;
    const originY = svgHeight - padding; // Bottom-left corner

    // Path for a standard right-angled triangle
    const pathData = `M ${originX},${originY} L ${originX + baseScaled},${originY} L ${originX},${originY - heightScaled} Z`;

    const diagramHTML = `
          <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:200px;height:auto;">
              <path d="${pathData}" fill="rgba(40,167,69,0.1)" stroke="currentColor"/>
              <!-- Right angle marker -->
              <path d="M ${originX + 5} ${originY} L ${originX + 5} ${originY - 5} L ${originX} ${originY - 5}" fill="none" stroke="currentColor" style="stroke-width:1;"/>
              <!-- Labels -->
              <text x="${originX + baseScaled / 2}" y="${originY + 12}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${base} cm</text> <!-- Base label -->
              <text x="${originX - 10}" y="${originY - heightScaled / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${height} cm</text> <!-- Height label -->
          </svg>`;

    const questionText = `Calculate the area of the triangle shown (in cm²). <br><i>(Area = 1/2 × base × height)</i>`;
    // Answer might be a decimal (e.g., 0.5 * 5 * 3 = 7.5), so use tolerance checker
    return { question: questionText, answer: answer, diagram: diagramHTML, checker: checkNumericAnswerTolerance(0.01) };
  }
  function generateElapsedTime() {
    let startHour = getRandomInt(7, 20); // Sensible start times (7am to 8pm)
    let startMin = getRandomInt(0, 11) * 5; // Start on 5-min intervals (0, 5, ..., 55)

    let durationHour = getRandomInt(0, 3);
    let durationMin = getRandomInt(1, 11) * 5; // Duration also 5-min intervals (5, ..., 55)

    // Ensure duration is at least 5 minutes
    if (durationHour === 0 && durationMin === 0) durationMin = 5;

    let totalDurationMinutes = durationHour * 60 + durationMin;
    let totalStartMinutes = startHour * 60 + startMin;
    let totalEndMinutes = totalStartMinutes + totalDurationMinutes;

    let endHour = Math.floor(totalEndMinutes / 60) % 24; // Handle crossing midnight if needed (though unlikely with ranges)
    let endMin = totalEndMinutes % 60;

    // Format start time (12-hour am/pm)
    let startHour12 = startHour % 12;
    if (startHour12 === 0) startHour12 = 12; // Handle 12 am/pm
    const startAmpm = startHour < 12 ? 'am' : 'pm';
    const startTimeStr = `${startHour12}:${startMin < 10 ? '0' : ''}${startMin}${startAmpm}`; // Removed space

    // Format end time (12-hour am/pm)
    let endHour12 = endHour % 12;
    if (endHour12 === 0) endHour12 = 12;
    const endAmpm = endHour < 12 ? 'am' : 'pm';
    const endTimeStr = `${endHour12}:${endMin < 10 ? '0' : ''}${endMin}${endAmpm}`; // Removed space

    // Format answer (X hours Y minutes)
    const answerHours = Math.floor(totalDurationMinutes / 60);
    const answerMins = totalDurationMinutes % 60;
    let answer = '';
    if (answerHours > 0) {
      answer += `${answerHours} hour${answerHours > 1 ? 's' : ''}`;
    }
    if (answerMins > 0) {
      if (answerHours > 0) answer += ' '; // Add space if hours were present
      answer += `${answerMins} minute${answerMins > 1 ? 's' : ''}`;
    }
    if (answer === '') answer = '0 minutes'; // Should not happen with current logic

    const questionText = `A journey starts at ${startTimeStr} and finishes at ${endTimeStr}. How long did the journey take? <br>(Format: e.g., '2 hours 15 minutes', '45 minutes')`;

    // Use exact string checker, requires user to format correctly
    return { question: questionText, answer: answer, checker: checkExactStringAnswer };
  }
  function generateRead24HourTime() {
    const hour24 = getRandomInt(0, 23);
    const minute = getRandomInt(0, 59);

    const time24Str = `${hour24 < 10 ? '0' : ''}${hour24}:${minute < 10 ? '0' : ''}${minute}`;

    let hour12 = hour24 % 12;
    if (hour12 === 0) {
      hour12 = 12; // 00 becomes 12am, 12 stays 12pm
    }
    const ampm = hour24 < 12 ? 'am' : 'pm';

    const answer = `${hour12}:${minute < 10 ? '0' : ''}${minute}${ampm}`; // No space before am/pm is common

    const questionText = `Convert the 24-hour time ${time24Str} to 12-hour time (e.g., 3:45pm, 11:05am).`;
    return { question: questionText, answer: answer }; // Uses default exact string checker
  }
  // Geometry
  function generateAngleTypeSVG() {
    const types = ['acute', 'right', 'obtuse', 'straight', 'reflex'];
    const chosenType = types[getRandomInt(0, types.length - 1)];
    let angleDegrees;

    const svgWidth = 150,
      svgHeight = 120; // Adjusted height for reflex
    const centerX = svgWidth / 2,
      centerY = svgHeight * 0.7; // Center lower down
    const lineRadius = 50; // Length of the angle lines
    const arcRadius = 20; // Radius for the angle arc marker

    // Define angle ranges
    switch (chosenType) {
      case 'acute':
        angleDegrees = getRandomInt(10, 89);
        break;
      case 'right':
        angleDegrees = 90;
        break;
      case 'obtuse':
        angleDegrees = getRandomInt(91, 179);
        break;
      case 'straight':
        angleDegrees = 180;
        break;
      case 'reflex':
        angleDegrees = getRandomInt(181, 350);
        break;
      default:
        angleDegrees = 45; // Fallback
    }

    const angleRadians = (angleDegrees * Math.PI) / 180;

    // Calculate line endpoints
    const x1 = centerX + lineRadius * Math.cos(Math.PI); // Start line pointing left
    const y1 = centerY + lineRadius * Math.sin(Math.PI);
    const x2 = centerX + lineRadius * Math.cos(Math.PI - angleRadians); // End line based on angle
    const y2 = centerY + lineRadius * Math.sin(Math.PI - angleRadians);

    // Arc path calculation
    const largeArcFlag = angleDegrees <= 180 ? 0 : 1; // Use large arc for reflex angles
    const arcEndX = centerX + arcRadius * Math.cos(Math.PI - angleRadians);
    const arcEndY = centerY + arcRadius * Math.sin(Math.PI - angleRadians);
    // Start arc from the horizontal line
    const arcPath = `M ${centerX - arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${arcEndX} ${arcEndY}`;

    let diagramHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 1.5; max-width: 150px; height: auto;">
            <!-- Vertex point -->
            <circle cx="${centerX}" cy="${centerY}" r="1.5" fill="currentColor" stroke="none"/>
            <!-- Angle lines -->
            <line x1="${centerX}" y1="${centerY}" x2="${x1}" y2="${y1}" stroke="currentColor"/>
            <line x1="${centerX}" y1="${centerY}" x2="${x2}" y2="${y2}" stroke="currentColor"/>
            <!-- Angle arc -->
            <path d="${arcPath}" fill="none" stroke="var(--secondary-color)" style="stroke-width:1;"/>
            <!-- Right angle box -->
            ${chosenType === 'right' ? `<path d="M ${centerX + 5} ${centerY} L ${centerX + 5} ${centerY - 5} L ${centerX} ${centerY - 5}" fill="none" stroke="currentColor" style="stroke-width:1;"/>` : ''}
        </svg>`;

    const questionText = `What type of angle is shown? (Enter: acute, right, obtuse, straight, or reflex)`;
    return { question: questionText, answer: chosenType, diagram: diagramHTML };
  }
  function generateAnglesPointLineSimpleSVG() {
    const type = getRandomInt(0, 1); // 0 for point (360), 1 for line (180)
    const totalAngle = type === 0 ? 360 : 180;
    let angle1, angle2, answer;

    // Generate angles ensuring they add up correctly and are reasonably sized
    if (type === 0) {
      // Angles around a point
      angle1 = getRandomInt(80, 150);
      angle2 = getRandomInt(80, 150);
      answer = 360 - angle1 - angle2;
      // Adjust if answer is too small or one angle dominates
      if (answer < 30 || answer > 170) {
        angle1 = getRandomInt(100, 130);
        angle2 = getRandomInt(100, 130);
        answer = 360 - angle1 - angle2;
      }
    } else {
      // Angles on a straight line
      angle1 = getRandomInt(30, 150);
      answer = 180 - angle1;
      angle2 = 0; // No second known angle for simple straight line problem
    }

    const svgWidth = 200,
      svgHeight = 150;
    const centerX = svgWidth / 2,
      centerY = svgHeight / 2 + 20; // Center lower down
    const radius = 60; // Radius for drawing lines
    const labelRadius = radius * 0.5; // Radius for placing labels
    const arcRadius = radius * 0.35; // Radius for drawing arcs

    let diagramHTML = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 1.5; max-width: 200px; height: auto;">`;

    // Draw lines radiating from the center
    let currentRad = Math.PI; // Start from left horizontal
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    const radAns = (answer * Math.PI) / 180;

    const p1 = { x: centerX + radius * Math.cos(currentRad), y: centerY + radius * Math.sin(currentRad) };
    const p2 = { x: centerX + radius * Math.cos(currentRad - rad1), y: centerY + radius * Math.sin(currentRad - rad1) };
    const p3 = type === 0 ? { x: centerX + radius * Math.cos(currentRad - rad1 - rad2), y: centerY + radius * Math.sin(currentRad - rad1 - rad2) } : null;
    const pEnd = { x: centerX + radius * Math.cos(currentRad - rad1 - rad2 - radAns), y: centerY + radius * Math.sin(currentRad - rad1 - rad2 - radAns) }; // Should be horizontal right if correct

    // Draw the lines
    diagramHTML += `<line x1="${centerX}" y1="${centerY}" x2="${p1.x}" y2="${p1.y}" stroke="currentColor"/>`; // First line (left)
    diagramHTML += `<line x1="${centerX}" y1="${centerY}" x2="${p2.x}" y2="${p2.y}" stroke="currentColor"/>`; // Second line
    if (type === 0) {
      diagramHTML += `<line x1="${centerX}" y1="${centerY}" x2="${p3.x}" y2="${p3.y}" stroke="currentColor"/>`; // Third line (only for point)
    }
    diagramHTML += `<line x1="${centerX}" y1="${centerY}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="currentColor"/>`; // Final line (right)

    // Add labels and arcs
    const addAngleLabel = (angleDeg, startRad, angleRad, labelText) => {
      const midRad = startRad - angleRad / 2;
      const labelX = centerX + labelRadius * Math.cos(midRad);
      const labelY = centerY + labelRadius * Math.sin(midRad);
      const arcStartX = centerX + arcRadius * Math.cos(startRad);
      const arcStartY = centerY + arcRadius * Math.sin(startRad);
      const arcEndX = centerX + arcRadius * Math.cos(startRad - angleRad);
      const arcEndY = centerY + arcRadius * Math.sin(startRad - angleRad);
      const largeArcFlag = angleRad > Math.PI ? 1 : 0;

      diagramHTML += `<path d="M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEndX} ${arcEndY}" fill="none" stroke="var(--secondary-color)" stroke-width="0.8"/>`;
      diagramHTML += `<text x="${labelX}" y="${labelY}" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none">${labelText}</text>`;
    };

    addAngleLabel(angle1, currentRad, rad1, `${angle1}°`);
    currentRad -= rad1;
    if (type === 0) {
      addAngleLabel(angle2, currentRad, rad2, `${angle2}°`);
      currentRad -= rad2;
    }
    addAngleLabel(answer, currentRad, radAns, 'x°');

    diagramHTML += `</svg>`;

    const questionText = `Find the value of angle x°.`;
    return { question: questionText, answer: answer.toString(), diagram: diagramHTML };
  }
  function generateCoordinatesFirstQuadrant() {
    const x = getRandomInt(1, 10);
    const y = getRandomInt(1, 10);
    const answer = `(${x}, ${y})`; // Format expected: (x, y) including brackets and comma+space

    const gridSize = 10;
    const cellSize = 22; // Slightly larger cells
    const padding = 40; // Increased padding for labels
    const axisLabelOffset = 20; // Distance for axis labels (x, y)
    const gridLabelOffset = 5; // Nudge for number labels
    const svgWidth = gridSize * cellSize + padding * 2;
    const svgHeight = gridSize * cellSize + padding * 2;
    const originX = padding;
    const originY = svgHeight - padding; // Bottom-left origin

    let diagramHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 0.5; max-width: 320px; height: auto; font-family: var(--font-main);">
        <!-- Grid lines -->
        <g stroke="var(--border-color)" stroke-width="0.5">`; // Lighter grid lines
    for (let i = 1; i <= gridSize; i++) {
      // Vertical lines
      diagramHTML += `<line x1="${originX + i * cellSize}" y1="${padding}" x2="${originX + i * cellSize}" y2="${originY}" />`;
      // Horizontal lines
      diagramHTML += `<line x1="${originX}" y1="${originY - i * cellSize}" x2="${originX + gridSize * cellSize}" y2="${originY - i * cellSize}" />`;
    }
    diagramHTML += `</g>`;

    // Axes (slightly thicker)
    diagramHTML += `<line x1="${originX}" y1="${padding - 10}" x2="${originX}" y2="${originY + 5}" stroke="currentColor" stroke-width="1"/>`; // Y axis
    diagramHTML += `<line x1="${originX - 5}" y1="${originY}" x2="${originX + gridSize * cellSize + 10}" y2="${originY}" stroke="currentColor" stroke-width="1"/>`; // X axis

    // Axis Labels (x and y)
    diagramHTML += `<text x="${originX + gridSize * cellSize + axisLabelOffset}" y="${originY + gridLabelOffset}" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">x</text>`;
    diagramHTML += `<text x="${originX - axisLabelOffset}" y="${padding - gridLabelOffset}" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">y</text>`;

    // Grid Numbers & Tick Marks
    diagramHTML += `<g font-size="10" fill="currentColor" text-anchor="middle">`;
    for (let i = 1; i <= gridSize; i++) {
      // X-axis numbers and ticks
      diagramHTML += `<text x="${originX + i * cellSize}" y="${originY + axisLabelOffset - 5}" stroke="none">${i}</text>`;
      diagramHTML += `<line x1="${originX + i * cellSize}" y1="${originY}" x2="${originX + i * cellSize}" y2="${originY + 4}" stroke="currentColor" stroke-width="0.8"/>`;

      // Y-axis numbers and ticks
      diagramHTML += `<text x="${originX - axisLabelOffset + 10}" y="${originY - i * cellSize + gridLabelOffset}" stroke="none">${i}</text>`;
      diagramHTML += `<line x1="${originX}" y1="${originY - i * cellSize}" x2="${originX - 4}" y2="${originY - i * cellSize}" stroke="currentColor" stroke-width="0.8"/>`;
    }
    diagramHTML += `<text x="${originX - axisLabelOffset + 10}" y="${originY + gridLabelOffset}" stroke="none">0</text>`; // Origin Label
    diagramHTML += `</g>`;

    // The Point 'P'
    const pointX = originX + x * cellSize;
    const pointY = originY - y * cellSize;
    diagramHTML += `<circle cx="${pointX}" cy="${pointY}" r="4" fill="var(--primary-color)" stroke="var(--card-bg)" stroke-width="1"/>`; // Point circle
    diagramHTML += `<text x="${pointX + 8}" y="${pointY - 8}" font-size="11" font-weight="bold" fill="currentColor" stroke="none">P</text>`; // Point label

    diagramHTML += `</svg>`;

    const questionText = `What are the coordinates of point P? <br>(Format: (x, y) including brackets and comma+space)`;
    return { question: questionText, answer: answer, diagram: diagramHTML };
  }
  function generateDescribeTransformationSimple() {
    const types = ['translation', 'reflection', 'rotation'];
    const chosenType = types[getRandomInt(0, types.length - 1)];

    // Original shape (simple triangle) points relative to origin (0,0)
    const originalPoints = [
      { x: 20, y: 70 },
      { x: 40, y: 30 },
      { x: 60, y: 70 },
    ];
    let transformedPoints = [];
    let descriptionVerb = '';
    let axisLine = ''; // For reflection

    const svgWidth = 240; // Increased width
    const svgHeight = 150; // Increased height

    switch (chosenType) {
      case 'translation':
        const tx = getRandomInt(70, 120); // Translate further right
        const ty = getRandomInt(-15, 15); // Small vertical shift
        transformedPoints = originalPoints.map((p) => ({ x: p.x + tx, y: p.y + ty }));
        descriptionVerb = 'slid';
        break;
      case 'reflection':
        const axisX = getRandomInt(80, 100); // Reflection line X-coordinate
        axisLine = `<line x1="${axisX}" y1="10" x2="${axisX}" y2="${svgHeight - 10}" stroke="var(--secondary-color)" stroke-dasharray="3,3" stroke-width="1"/>`;
        transformedPoints = originalPoints.map((p) => ({ x: axisX + (axisX - p.x), y: p.y })); // Reflect horizontally
        descriptionVerb = 'flipped';
        break;
      case 'rotation':
        // Simple 90 degree clockwise rotation around a point (e.g., 40, 70)
        const pivot = { x: 40, y: 70 }; // Rotate around one vertex
        transformedPoints = originalPoints.map((p) => {
          let dx = p.x - pivot.x;
          let dy = p.y - pivot.y;
          // Clockwise 90 deg rotation: (x', y') = (y, -x) relative to pivot
          return { x: pivot.x + dy, y: pivot.y - dx };
        });
        descriptionVerb = 'turned';
        break;
    }

    const formatPoints = (points) => points.map((p) => `${p.x},${p.y}`).join(' ');

    const diagramHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:${svgWidth}px;height:auto;">
            <!-- Original Shape A -->
            <polygon points="${formatPoints(originalPoints)}" fill="rgba(0,123,255,0.3)" stroke="currentColor"/>
            <text x="${originalPoints[1].x}" y="${originalPoints[1].y - 8}" font-size="10" text-anchor="middle">A</text>

            <!-- Transformed Shape B -->
            <polygon points="${formatPoints(transformedPoints)}" fill="rgba(40,167,69,0.3)" stroke="currentColor"/>
             <text x="${transformedPoints[1].x}" y="${transformedPoints[1].y - 8}" font-size="10" text-anchor="middle">B</text>

             <!-- Reflection Axis (if applicable) -->
            ${axisLine}
        </svg>`;

    const questionText = `Shape A has been ${descriptionVerb} to position B. What type of transformation is this? <br>(Enter: translation, reflection, or rotation)`;
    return { question: questionText, answer: chosenType, diagram: diagramHTML };
  }
  // Statistics & Probability
  function generateInterpretColumnGraph() {
    const petCategories = ['Cats', 'Dogs', 'Birds', 'Fish', 'Rabbits', 'Hamsters'];
    const numCategories = getRandomInt(3, 5); // Choose 3 to 5 categories
    const chosenCategories = petCategories.slice(0, numCategories);
    const values = chosenCategories.map(() => getRandomInt(1, 12)); // Values for each category

    const targetCatIndex = getRandomInt(0, chosenCategories.length - 1); // Which category to ask about
    const answer = values[targetCatIndex];
    const questionText = `The graph shows the number of pets owned by students in a class. How many ${chosenCategories[targetCatIndex].toLowerCase()} were owned?`;

    const svgPadding = 40; // Increased padding
    const barWidth = 30; // Wider bars
    const barGap = 20; // Increased gap
    const maxValue = Math.ceil(Math.max(...values, 5) / 2) * 2; // Determine max Y-axis value (even number)
    const chartHeight = 150; // Fixed height for the chart area
    const scaleY = chartHeight / maxValue; // Pixels per unit on Y-axis
    const svgWidth = numCategories * (barWidth + barGap) - barGap + svgPadding * 2;
    const svgHeight = chartHeight + svgPadding * 2;
    const originX = svgPadding;
    const originY = svgHeight - svgPadding; // Bottom-left origin of chart area
    const tickLength = 5;

    let diagramHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width: 1; max-width: 350px; height: auto; font-family: var(--font-main);">
        <!-- Y Axis and Ticks -->
        <line x1="${originX}" y1="${originY - chartHeight - 10}" x2="${originX}" y2="${originY}" stroke="currentColor" stroke-width="1"/>`; // Y Axis line
    for (let i = 0; i <= maxValue; i += 2) {
      // Y-axis ticks every 2 units
      const tickY = originY - i * scaleY;
      diagramHTML += `<line x1="${originX - tickLength}" y1="${tickY}" x2="${originX}" y2="${tickY}" stroke="currentColor" stroke-width="0.7"/>`;
      diagramHTML += `<text x="${originX - tickLength - 5}" y="${tickY + 3}" font-size="9" text-anchor="end" fill="currentColor" stroke="none">${i}</text>`;
    }
    // X Axis
    diagramHTML += `<line x1="${originX - tickLength}" y1="${originY}" x2="${originX + numCategories * (barWidth + barGap)}" y2="${originY}" stroke="currentColor" stroke-width="1"/>`; // X Axis line

    // Bars and X Labels
    values.forEach((value, index) => {
      const barHeight = value * scaleY;
      const barX = originX + index * (barWidth + barGap);
      diagramHTML += `<rect x="${barX}" y="${originY - barHeight}" width="${barWidth}" height="${barHeight}" fill="var(--primary-color)" opacity="0.7"/>`;
      // Rotate labels if too many categories? For 3-5, horizontal should be fine.
      diagramHTML += `<text x="${barX + barWidth / 2}" y="${originY + 18}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${chosenCategories[index]}</text>`;
    });

    diagramHTML += `</svg>`;
    return { question: questionText, answer: answer.toString(), diagram: diagramHTML };
  }
  function generateSimpleProbabilityFraction() {
    const itemTypes = ['marbles', 'counters', 'beads', 'buttons'];
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    const item = itemTypes[getRandomInt(0, itemTypes.length - 1)];
    const color = colors[getRandomInt(0, colors.length - 1)];

    const totalItems = getRandomInt(8, 24);
    // Ensure favourable outcomes is less than total
    const favourableItems = getRandomInt(1, Math.max(1, totalItems - 2));

    const answer = simplifyFraction(favourableItems, totalItems);

    const questionText = `A bag contains ${totalItems} ${item}. ${favourableItems} of the ${item} are ${color}. What is the probability of picking a ${color} ${item}? <br>(Give your answer as a simplified fraction, e.g., 3/4 or 1/2)`;
    return { question: questionText, answer: answer }; // Uses fraction checker
  }
  function generateListOutcomes() {
    const experiment1 = [
      { name: 'coin', items: ['Head', 'Tail'] },
      { name: 'die', items: ['1', '2', '3', '4', '5', '6'] },
      { name: 'spinner', items: ['Red', 'Blue', 'Green'] },
    ];
    const experiment2 = [
      { name: 'coin', items: ['H', 'T'] }, // Use shorter names if combining with die
      { name: 'die', items: ['1', '2', '3', '4'] }, // 4-sided die?
      { name: 'spinner', items: ['A', 'B', 'C', 'D'] },
      { name: 'card suit', items: ['Heart', 'Diamond', 'Club', 'Spade'] },
    ];

    // Pick two different experiments
    let idx1 = getRandomInt(0, experiment1.length - 1);
    let idx2 = getRandomInt(0, experiment2.length - 1);
    // Ensure they are somewhat different activities if possible (e.g., not coin and coin)
    if (experiment1[idx1].name === experiment2[idx2].name && experiment1.length > 1 && experiment2.length > 1) {
      idx2 = (idx2 + 1) % experiment2.length;
    }

    const e1 = experiment1[idx1];
    const e2 = experiment2[idx2];

    let outcomes = [];
    for (let item1 of e1.items) {
      for (let item2 of e2.items) {
        outcomes.push(`${item1}-${item2}`); // Combine with a hyphen
      }
    }

    const answer = outcomes.join(', '); // Expected format: A-1, A-2, ..., B-1, B-2, ...

    // Construct the question text dynamically
    let questionText = `An experiment involves first using a ${e1.name} (outcomes: ${e1.items.join('/')}) and then using a ${e2.name} (outcomes: ${e2.items.join('/')}). List all possible combined outcomes.`;
    questionText += `<br>(Separate each outcome with a comma and space. Format like: ${e1.items[0]}-${e2.items[0]}, ${e1.items[0]}-${e2.items[1]}, ...)`;

    // Checker needs exact string match, case-insensitive, ignoring spaces
    return { question: questionText, answer: answer, checker: checkExactStringAnswer };
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
  // Remove complex/advanced generators not relevant to Year 6 focus
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
