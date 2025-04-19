document.addEventListener('DOMContentLoaded', () => {
  // START OF DOMContentLoaded LISTENER
  console.log('DOM Content Loaded. Initializing script...');

  // --- Configuration & Constants ---
  const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes
  // const SESSION_DURATION_SECONDS = 60; // Use a short duration for testing
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
        const summaryCountEl = getElement('session-summary-count');
        if (summaryCountEl) summaryCountEl.textContent = currentSessionQuestionsCompleted;
        else console.warn('sessionSummaryCount not found.');

        // --- START: Display Incorrect Questions ---
        const incorrectListDiv = getElement('incorrect-list', false); // Non-essential for core function
        if (incorrectListDiv) {
          incorrectListDiv.innerHTML = ''; // Clear previous content or "Loading..."
          if (incorrectlyAnsweredQuestions.length === 0) {
            incorrectListDiv.innerHTML = '<p>No incorrect answers this session. Well done!</p>';
            console.log('No incorrect questions to display.');
          } else {
            console.log(`Displaying ${incorrectlyAnsweredQuestions.length} incorrect questions.`);
            const ul = document.createElement('ul');
            ul.className = 'incorrect-questions-list'; // Add class for styling
            incorrectlyAnsweredQuestions.forEach((item, index) => {
              const li = document.createElement('li');
              // Format the display answer (simple version, can be expanded)
              let displayAnswer = item.correctAnswer;
              if (typeof displayAnswer === 'number') {
                // Attempt to round reasonably like in feedback
                if (Math.abs(displayAnswer - Math.round(displayAnswer)) < 0.0001) {
                  displayAnswer = Math.round(displayAnswer);
                } else if (Math.abs(displayAnswer - displayAnswer.toFixed(1)) < 0.0001) {
                  displayAnswer = displayAnswer.toFixed(1);
                } else if (Math.abs(displayAnswer - displayAnswer.toFixed(2)) < 0.0001) {
                  displayAnswer = displayAnswer.toFixed(2);
                } else {
                  displayAnswer = displayAnswer.toFixed(4); // Fallback
                }
              }
              // Ensure fractions are displayed as strings
              else if (typeof displayAnswer === 'string' && displayAnswer.includes('/')) {
                // Already formatted as fraction string
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

            // Attempt to re-apply theme styles to SVGs in the review list
            // Use setTimeout to ensure elements are fully in the DOM and styles computed
            setTimeout(() => {
              const reviewSvgs = incorrectListDiv.querySelectorAll('.review-diagram svg');
              console.log(`Found ${reviewSvgs.length} SVGs in review list to style.`);
              if (reviewSvgs.length > 0) {
                const bs = getComputedStyle(document.body);
                const ct = bs.getPropertyValue('--text-color');
                reviewSvgs.forEach((svgEl) => {
                  svgEl.style.stroke = ct;
                  svgEl.querySelectorAll('text,tspan').forEach((t) => (t.style.fill = ct));
                  svgEl.querySelectorAll('line,path,rect,circle').forEach((s) => {
                    // Apply stroke only if it wasn't explicitly set to none or has no attribute
                    if (s.style.stroke !== 'none' && !s.getAttribute('stroke')) {
                      s.style.stroke = 'currentColor';
                    }
                    // Apply fill to basic shapes if needed (optional, might conflict with explicit fills)
                    // if (s.style.fill !== 'none' && !s.getAttribute('fill')) {
                    //     s.style.fill = 'currentColor';
                    // }
                  });
                });
                console.log('Applied theme styles to review SVGs.');
              }
            }, 150); // Delay slightly (150ms)
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
    savePreviousSessionCount(currentSessionQuestionsCompleted);
    saveProgress(); // Save progress before switching view
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
      if (!qData || typeof qData.question === 'undefined' || typeof qData.answer === 'undefined' || typeof skill.checker !== 'function') throw new Error(`Data/checker issue for '${skill.name}'.`);
      currentQuestion = { categoryId: catId, skillIndex: skillIdx, questionText: qData.question, questionDiagramHTML: qData.diagram || '', correctAnswer: qData.answer, checker: skill.checker };
      qText.innerHTML = currentQuestion.questionText; // Use innerHTML for potential HTML tags like <sup>
      qDiag.innerHTML = currentQuestion.questionDiagramHTML;
      const svgEl = qDiag.querySelector('svg');
      if (svgEl) {
        applyThemeToSVG(svgEl); // Apply theme colors to new SVG
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
    const qAns = getElement('user-answer');
    const qSub = getElement('submit-answer');
    const qNext = getElement('next-question');
    const qCount = getElement('current-session-count');

    // Check if elements and state are valid before proceeding
    if (!currentQuestion || !isSessionActive || !qSub || !qNext || !qAns || !qCount) {
      console.error('handleSubmitAnswer aborted: Missing elements or inactive session.');
      return;
    }

    const uAns = qAns.value.trim();

    // Allow empty answer submission if correct answer is empty string (shouldn't happen ideally)
    // Allow submission if answer is "0" even if correct answer is 0
    if (uAns === '' && String(currentQuestion.correctAnswer) !== '' && String(currentQuestion.correctAnswer) !== '0') {
      console.log('Empty answer submitted when correct answer is not empty or 0. Aborting.');
      showFeedback(false, 'Please enter an answer.'); // Give feedback
      return;
    }

    try {
      // Check the answer using the specific checker for the current question
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
      // Format answer for display (similar to what we'll need in review)
      if (typeof dA === 'number') {
        dA = parseFloat(dA.toFixed(4)); // Keep reasonable precision
      } else if (typeof dA === 'string' && dA.includes('/')) {
        // dA is already a simplified fraction string
      } else if (dA === null || typeof dA === 'undefined') {
        dA = '[Internal Error]';
      } else {
        dA = dA.toString(); // Convert others to string
      }
      // Ensure the user message doesn't show empty strings confusingly
      const displayUserAnswer = document.getElementById('user-answer')?.value.trim();
      if (displayUserAnswer === '') {
        fMsg = `Not quite! The answer was: ${dA}`;
      } else if (fMsg === 'Please enter an answer.') {
        // Don't override the specific message from handleSubmitAnswer
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
          // Ensure attempts and correct are numbers
          if (typeof p[k].attempted !== 'number') p[k].attempted = 0;
          if (typeof p[k].correct !== 'number') p[k].correct = 0;
          // Recalculate mastery just in case
          p[k].mastery = p[k].attempted > 0 ? p[k].correct / p[k].attempted : 0;
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
          const bs = getComputedStyle(document.body);
          const ct = bs.getPropertyValue('--text-color');
          reviewSvgs.forEach((svgEl) => {
            applyThemeToSVG(svgEl); // Use helper function
          });
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
        // Only override stroke if it's not explicitly set to 'none' or defined by an attribute
        if (s.style.stroke !== 'none' && !s.getAttribute('stroke')) {
          s.style.stroke = 'currentColor'; // Inherit from parent or SVG default
        }
        // Careful with fill - only override if appropriate (e.g., not for colored areas)
        // Example: If default fill is needed and not explicitly set
        // if (s.style.fill !== 'none' && !s.getAttribute('fill') && !s.style.fill) {
        //     s.style.fill = 'currentColor';
        // }
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
    return !isNaN(nu) && !isNaN(nc) && Math.abs(nu - nc) < 1e-9; // Use tolerance for float comparison
  }
  function checkNumericAnswerTolerance(tol) {
    return function (ua, ca) {
      const nu = parseFloat(ua),
        nc = parseFloat(ca);
      if (isNaN(nu) || isNaN(nc)) return !1; // Use false shorthand
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
    if (d === 0) return 'Undefined'; // Should not happen with generators
    if (n === 0) return '0';
    const commonDivisor = gcd(n, d);
    let num = n / commonDivisor;
    let den = d / commonDivisor;
    // Ensure denominator is positive
    if (den < 0) {
      num = -num;
      den = -den;
    }
    if (den === 1) return num.toString(); // Return as whole number string if denominator is 1
    return `${num}/${den}`; // Return as fraction string
  }

  // --- Question Generators ---
  // Algebra
  function generateLinearEquation1() {
    let a = getRandomInt(2, 9),
      b = getRandomInt(-10, 10),
      x = getRandomInt(-5, 5);
    // Ensure x is not 0 if b is 0 to avoid 3x = 0 type questions too often
    if (b === 0 && x === 0) x = getRandomInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
    let c = a * x + b;
    return { question: `Solve for x: ${a}x ${b > 0 ? '+ ' + b : b < 0 ? '- ' + Math.abs(b) : ''} = ${c}`, answer: x };
  }
  function generateLinearEquation2() {
    let a, c, x;
    // Ensure a is not equal to c
    do {
      a = getRandomInt(2, 9);
      c = getRandomInt(1, 9); // Allow c to be larger than a now
    } while (a === c);

    x = getRandomInt(-5, 5);
    let diff = (a - c) * x;
    let b = getRandomInt(-10, 10);
    let d = b + diff; // Calculate d based on b and the difference

    // Ensure equations are not trivial like 5x + 2 = 5x + 2 (handled by a !== c)
    // Ensure balance, e.g. avoid 5x + 10 = 2x + 10 if possible by adjusting b/d slightly
    if (b === d && Math.random() < 0.5) {
      b += getRandomInt(1, 3) * (Math.random() < 0.5 ? 1 : -1);
      d = b + diff; // Recalculate d
    }

    return { question: `Solve for x: ${a}x ${b > 0 ? '+ ' + b : b < 0 ? '- ' + Math.abs(b) : ''} = ${c}x ${d > 0 ? '+ ' + d : d < 0 ? '- ' + Math.abs(d) : ''}`, answer: x };
  }
  function generateExpandSingleBracket() {
    let a = getRandomInt(2, 7);
    let b = getRandomInt(1, 5) * (Math.random() < 0.3 ? -1 : 1); // Allow negative coefficient for x sometimes
    let c = getRandomInt(-7, 7);
    if (c === 0) c = getRandomInt(1, 7) * (Math.random() < 0.5 ? 1 : -1);

    let cs = c > 0 ? '+' : '-';
    let ac = Math.abs(c);
    const q = `Expand: ${a}(${b === 1 ? '' : b === -1 ? '-' : b}x ${cs} ${ac})`; // Handle coefficient 1 and -1 for x

    let t1 = a * b;
    let t2 = a * c;
    let t2s = t2 > 0 ? '+' : '-'; // Sign for the constant term
    let at2 = Math.abs(t2);

    // Format answer string carefully
    const term1Str = (t1 === 1 ? '' : t1 === -1 ? '-' : t1) + 'x';
    const ans = `${term1Str}${t2s}${at2}`; // Combine terms

    return { question: q, answer: ans };
  }
  // Number
  function generatePercentageOfQuantity() {
    let p = getRandomInt(1, 19) * 5; // Percentages like 5%, 10%, ..., 95%
    let q = getRandomInt(2, 20) * 10; // Quantities like 20, 30, ..., 200
    let a = (p / 100) * q;
    // Ensure answer is an integer or simple decimal for this level
    if (a !== Math.floor(a)) {
      q = getRandomInt(2, 20) * (p % 10 === 0 ? 10 : 20); // Adjust q for simpler answers
      a = (p / 100) * q;
    }
    return { question: `Calculate ${p}% of ${q}`, answer: parseFloat(a.toFixed(5)) }; // Return number
  }
  function generateFractionAdditionSimple() {
    let d = getRandomInt(3, 12);
    let n1 = getRandomInt(1, d - 1);
    // Allow the second numerator to potentially make the sum improper or negative sometimes
    let n2 = getRandomInt(1, d + 5) * (Math.random() < 0.1 ? -1 : 1); // Small chance of subtraction
    let an = n1 + n2;
    const ans = simplifyFraction(an, d); // Get simplified string "n/d" or "n"
    const n2Sign = n2 >= 0 ? '+' : '-';
    const n2Abs = Math.abs(n2);
    return { question: `Calculate: <sup>${n1}</sup>⁄<sub>${d}</sub> ${n2Sign} <sup>${n2Abs}</sup>⁄<sub>${d}</sub> <br>(Give answer as a simplified fraction e.g. a/b or a whole number)`, answer: ans };
  }
  function generateIntegerMultiplication() {
    let n1 = getRandomInt(-12, 12);
    let n2 = getRandomInt(-12, 12);
    // Reduce likelihood of 0, 1, -1 unless both are small
    if (Math.abs(n1) <= 1 && Math.random() < 0.7) n1 = getRandomInt(2, 12) * (n1 < 0 ? -1 : 1);
    if (Math.abs(n2) <= 1 && Math.random() < 0.7) n2 = getRandomInt(2, 12) * (n2 < 0 ? -1 : 1);
    // Avoid 0 * 0 too often
    if (n1 === 0 && n2 === 0) n2 = getRandomInt(1, 12) * (Math.random() < 0.5 ? 1 : -1);

    let a = n1 * n2;
    return { question: `Calculate: (${n1}) × (${n2})`, answer: a }; // Return number
  }
  // Statistics & Probability
  function generateMean() {
    let count = getRandomInt(4, 7);
    let values = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      let val = getRandomInt(1, 50);
      values.push(val);
      sum += val;
    }
    let answer = sum / count;
    // Round if necessary - check if significantly different from integer
    let roundedAnswer = parseFloat(answer.toFixed(2));

    return { question: `Calculate the mean (average) of the following numbers: ${values.join(', ')}. <br>(Round to 2 decimal places if necessary).`, answer: roundedAnswer }; // Return number
  }
  function generateSimpleProbabilityDice() {
    const outcomes = [
      { event: 'rolling an even number', num: 3, total: 6 }, // 1/2
      { event: 'rolling an odd number', num: 3, total: 6 }, // 1/2
      { event: 'rolling a number greater than 4', num: 2, total: 6 }, // 1/3
      { event: 'rolling a number less than 3', num: 2, total: 6 }, // 1/3
      { event: 'rolling a prime number (2, 3, 5)', num: 3, total: 6 }, // 1/2
      { event: 'rolling a composite number (4, 6)', num: 2, total: 6 }, // 1/3
      { event: 'rolling a multiple of 3 (3, 6)', num: 2, total: 6 }, // 1/3
      { event: 'rolling a factor of 6 (1, 2, 3, 6)', num: 4, total: 6 }, // 2/3
      { event: 'rolling a 5', num: 1, total: 6 }, // 1/6
      { event: 'rolling a number greater than 2', num: 4, total: 6 }, // 2/3
      { event: 'rolling a number not equal to 1', num: 5, total: 6 }, // 5/6
    ];
    const chosenOutcome = outcomes[getRandomInt(0, outcomes.length - 1)];
    const answer = simplifyFraction(chosenOutcome.num, chosenOutcome.total); // Get simplified string "n/d" or "n"
    return { question: `A standard fair six-sided die is rolled once. What is the probability of ${chosenOutcome.event}? <br>(Give answer as a simplified fraction e.g. a/b or a whole number)`, answer: answer };
  }
  // --- SVG Diagram Generators ---
  function generateAnglesStraightLineSVG() {
    let angle1 = getRandomInt(30, 150);
    let answer = 180 - angle1;

    const svgWidth = 250,
      svgHeight = 150,
      padding = 40;
    const centerX = svgWidth / 2,
      centerY = svgHeight - padding;
    const lineLength = svgWidth / 2 - padding; // Length from center to edge

    // Calculate end point of the dividing line
    const angleRad = (angle1 * Math.PI) / 180;
    const lineX2 = centerX - lineLength * Math.cos(angleRad); // X position based on angle from horizontal right
    const lineY2 = centerY - lineLength * Math.sin(angleRad); // Y position based on angle

    // Positions for labels
    const labelOffset = 45; // Distance from vertex for labels
    const knownAngleLabelX = centerX - labelOffset * Math.cos(angleRad / 2);
    const knownAngleLabelY = centerY - labelOffset * Math.sin(angleRad / 2);
    const unknownAngleRad = ((180 - angle1) * Math.PI) / 180;
    const unknownAngleLabelX = centerX + labelOffset * Math.cos(unknownAngleRad / 2); // Angle from horizontal left
    const unknownAngleLabelY = centerY - labelOffset * Math.sin(unknownAngleRad / 2);

    // Arc path parameters
    const arcRadius = 25;
    // Arc for known angle (starts horizontal left, sweeps towards dividing line)
    const knownArcEndX = centerX - arcRadius * Math.cos(angleRad);
    const knownArcEndY = centerY - arcRadius * Math.sin(angleRad);
    const knownArcPath = `M ${centerX - arcRadius} ${centerY} A ${arcRadius} ${arcRadius} 0 0 1 ${knownArcEndX} ${knownArcEndY}`;
    // Arc for unknown angle (starts dividing line, sweeps towards horizontal right)
    const unknownArcStartX = knownArcEndX;
    const unknownArcStartY = knownArcEndY;
    const unknownArcPath = `M ${unknownArcStartX} ${unknownArcStartY} A ${arcRadius} ${arcRadius} 0 0 1 ${centerX + arcRadius} ${centerY}`;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <line x1="${centerX - lineLength}" y1="${centerY}" x2="${centerX + lineLength}" y2="${centerY}" stroke="currentColor"/> <!-- Straight line -->
        <line x1="${centerX}" y1="${centerY}" x2="${lineX2}" y2="${lineY2}" stroke="currentColor"/> <!-- Dividing line -->
        <!-- Arcs for angles -->
        <path d="${knownArcPath}" fill="none" stroke="currentColor" style="stroke-width:1;"/>
        <path d="${unknownArcPath}" fill="none" stroke="currentColor" style="stroke-width:1; stroke-dasharray:2,2;"/>
        <!-- Labels -->
        <text x="${knownAngleLabelX}" y="${knownAngleLabelY}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none">${angle1}°</text>
        <text x="${unknownAngleLabelX}" y="${unknownAngleLabelY}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none">x°</text>
      </svg>`;
    return { question: `Find the value of angle x° in the diagram.`, answer: answer, diagram: diagramHTML };
  }
  function generatePythagorasHypotSVG() {
    const triples = [
      [3, 4, 5],
      [6, 8, 10],
      [9, 12, 15], // 3-4-5 family
      [5, 12, 13],
      [10, 24, 26], // 5-12-13 family
      [8, 15, 17], // 8-15-17 family
      [7, 24, 25], // 7-24-25 family
    ];
    let base = triples[getRandomInt(0, triples.length - 1)];
    let multiplier = getRandomInt(1, 2); // Keep numbers reasonable
    let a = base[0] * multiplier;
    let b = base[1] * multiplier;
    let c = base[2] * multiplier; // Hypotenuse is the answer

    // Randomly swap a and b
    if (Math.random() < 0.5) [a, b] = [b, a];

    const padding = 40,
      maxViewSize = 120; // Max size for the longest leg in the SVG viewbox
    const maxLeg = Math.max(a, b);
    const scaleFactor = maxViewSize / maxLeg;
    const scaledA = a * scaleFactor;
    const scaledB = b * scaleFactor;
    const svgWidth = scaledA + padding * 2;
    const svgHeight = scaledB + padding * 2;
    const originX = padding;
    const originY = svgHeight - padding; // Bottom-left corner
    const labelOffset = 12; // Space between line and label

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:200px;height:auto;">
        <!-- Triangle sides -->
        <line x1="${originX}" y1="${originY}" x2="${originX + scaledA}" y2="${originY}" stroke="currentColor"/> <!-- Base -->
        <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${originY - scaledB}" stroke="currentColor"/> <!-- Height -->
        <line x1="${originX + scaledA}" y1="${originY}" x2="${originX}" y2="${originY - scaledB}" stroke="currentColor"/> <!-- Hypotenuse -->
        <!-- Right angle marker -->
        <path d="M ${originX + 5} ${originY} L ${originX + 5} ${originY - 5} L ${originX} ${originY - 5}" fill="none" stroke="currentColor" style="stroke-width:1;"/>
        <!-- Labels -->
        <text x="${originX + scaledA / 2}" y="${originY + labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${a} cm</text>
        <text x="${originX - labelOffset}" y="${originY - scaledB / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${b} cm</text>
        <text x="${originX + scaledA / 2 + 5}" y="${originY - scaledB / 2 - 5}" font-size="10" text-anchor="middle" dominant-baseline="middle"
              transform="rotate(${(-Math.atan2(scaledB, scaledA) * 180) / Math.PI} ${originX + scaledA / 2} ${originY - scaledB / 2})" fill="currentColor" stroke="none">x cm</text>
      </svg>`;
    return { question: `Find the length of the hypotenuse (x) in this right-angled triangle.`, answer: c, diagram: diagramHTML };
  }
  function generateAreaRectangleSVG() {
    let length = getRandomInt(5, 20);
    let width = getRandomInt(3, Math.max(4, length - 1)); // Ensure width is usually smaller but not tiny
    let answer = length * width;

    const padding = 40,
      maxViewSize = 150;
    const maxDim = Math.max(length, width);
    const scaleFactor = maxViewSize / maxDim;
    const rectWidth = length * scaleFactor;
    const rectHeight = width * scaleFactor;
    const svgWidth = rectWidth + padding * 2;
    const svgHeight = rectHeight + padding * 2;
    const rectX = padding;
    const rectY = padding;
    const labelOffset = 12;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/>
        <!-- Labels -->
        <text x="${rectX + rectWidth / 2}" y="${rectY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${length} cm</text>
        <text x="${rectX - labelOffset}" y="${rectY + rectHeight / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${width} cm</text>
      </svg>`;
    return { question: `Calculate the area of the rectangle shown (in cm²).`, answer: answer, diagram: diagramHTML };
  }
  function generatePerimeterRectangleSVG() {
    let length = getRandomInt(5, 20);
    let width = getRandomInt(3, Math.max(4, length - 1));
    let answer = 2 * (length + width);

    const padding = 40,
      maxViewSize = 150;
    const maxDim = Math.max(length, width);
    const scaleFactor = maxViewSize / maxDim;
    const rectWidth = length * scaleFactor;
    const rectHeight = width * scaleFactor;
    const svgWidth = rectWidth + padding * 2;
    const svgHeight = rectHeight + padding * 2;
    const rectX = padding;
    const rectY = padding;
    const labelOffset = 12;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/>
        <!-- Labels -->
        <text x="${rectX + rectWidth / 2}" y="${rectY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${length} m</text>
        <text x="${rectX - labelOffset}" y="${rectY + rectHeight / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${width} m</text>
      </svg>`;
    return { question: `Calculate the perimeter of the rectangle shown (in m).`, answer: answer, diagram: diagramHTML };
  }
  function generateAreaCircleSVG() {
    let radius = getRandomInt(3, 15);
    let answer = Math.PI * radius * radius; // Area = pi * r^2

    const svgSize = 200,
      padding = 40;
    const centerX = svgSize / 2,
      centerY = svgSize / 2;
    const viewRadius = svgSize / 2 - padding; // Scaled radius for SVG view
    const labelOffset = 10;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:180px;height:auto;">
        <circle cx="${centerX}" cy="${centerY}" r="${viewRadius}" fill="rgba(40,167,69,0.1)" stroke="currentColor"/>
        <!-- Radius line -->
        <line x1="${centerX}" y1="${centerY}" x2="${centerX + viewRadius}" y2="${centerY}" stroke="currentColor" stroke-dasharray="3,3"/>
        <!-- Center dot -->
        <circle cx="${centerX}" cy="${centerY}" r="2" fill="currentColor" stroke="none"/>
        <!-- Label -->
        <text x="${centerX + viewRadius / 2}" y="${centerY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${radius} mm</text>
      </svg>`;
    return { question: `Calculate the area of the circle shown (in mm²). Use π ≈ 3.14159. <br>(Round final answer to 1 decimal place).`, answer: answer, diagram: diagramHTML };
  }
  function generateAreaLShapeSVG() {
    // Dimensions for the outer bounding box
    let W = getRandomInt(10, 20); // Outer width
    let H = getRandomInt(10, 20); // Outer height
    // Dimensions for the inner cut-out rectangle
    let w = getRandomInt(3, W - 3); // Inner width
    let h = getRandomInt(3, H - 3); // Inner height

    let area = W * H - w * h; // Area is outer rectangle minus inner cut-out

    const padding = 40,
      maxViewSize = 150;
    const maxDim = Math.max(W, H);
    const scaleFactor = maxViewSize / maxDim;
    const Ws = W * scaleFactor,
      Hs = H * scaleFactor; // Scaled outer dimensions
    const ws = w * scaleFactor,
      hs = h * scaleFactor; // Scaled inner dimensions
    const svgWidth = Ws + padding * 2;
    const svgHeight = Hs + padding * 2;
    const originX = padding,
      originY = padding; // Top-left corner of shape
    const labelOffset = 12;

    // Path for the L-shape (assuming cut-out is top-right)
    // M originX,originY -> H originX+Ws -> V originY+Hs -> H originX+ws -> V originY+hs -> H originX -> Z
    const pathData = `M ${originX},${originY} H ${originX + Ws} V ${originY + Hs} H ${originX + ws} V ${originY + hs} H ${originX} Z`;
    // Alternative: cut-out bottom-right
    // const pathData = `M ${originX},${originY} H ${originX+Ws} V ${originY+hs} H ${originX+ws} V ${originY+Hs} H ${originX} Z`;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <path d="${pathData}" fill="rgba(253,126,20,0.1)" stroke="currentColor"/>
        <!-- Dimension Labels (carefully placed) -->
        <text x="${originX + Ws / 2}" y="${originY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text> <!-- Top edge -->
        <text x="${originX + Ws + labelOffset}" y="${originY + Hs / 2}" font-size="10" text-anchor="start" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text> <!-- Right edge (full height) -->
        <text x="${originX + ws / 2}" y="${originY + hs - labelOffset / 2}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${w} u</text> <!-- Inner horizontal top edge -->
        <text x="${originX + ws - labelOffset / 2}" y="${originY + hs / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${h} u</text> <!-- Inner vertical left edge -->
        <text x="${originX + ws + (Ws - ws) / 2}" y="${originY + Hs + labelOffset}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${W - w} u</text> <!-- Bottom edge segment -->
        <text x="${originX - labelOffset}" y="${originY + hs + (Hs - hs) / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H - h} u</text> <!-- Left edge segment -->
      </svg>`;
    return { question: `Calculate the area of the L-shaped figure shown (in u²).`, answer: area, diagram: diagramHTML };
  }
  function generatePerimeterLShapeSVG() {
    let W = getRandomInt(10, 20);
    let H = getRandomInt(10, 20);
    let w = getRandomInt(3, W - 3); // Inner width (needed for diagram only)
    let h = getRandomInt(3, H - 3); // Inner height (needed for diagram only)

    // Perimeter of an L-shape is the same as the bounding rectangle
    let perimeter = 2 * (W + H);

    const padding = 40,
      maxViewSize = 150;
    const maxDim = Math.max(W, H);
    const scaleFactor = maxViewSize / maxDim;
    const Ws = W * scaleFactor,
      Hs = H * scaleFactor;
    const ws = w * scaleFactor,
      hs = h * scaleFactor;
    const svgWidth = Ws + padding * 2;
    const svgHeight = Hs + padding * 2;
    const originX = padding,
      originY = padding;
    const labelOffset = 12;

    // Path for the L-shape (same as area)
    const pathData = `M ${originX},${originY} H ${originX + Ws} V ${originY + Hs} H ${originX + ws} V ${originY + hs} H ${originX} Z`;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <path d="${pathData}" fill="rgba(253,126,20,0.1)" stroke="currentColor"/>
         <!-- Dimension Labels (only outer ones needed for perimeter usually) -->
        <text x="${originX + Ws / 2}" y="${originY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text> <!-- Top edge -->
        <text x="${originX + Ws + labelOffset}" y="${originY + Hs / 2}" font-size="10" text-anchor="start" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text> <!-- Right edge (full height) -->
        <!-- Optional inner labels for clarity -->
         <text x="${originX + ws + (Ws - ws) / 2}" y="${originY + Hs + labelOffset}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${W - w} u</text> <!-- Bottom edge segment -->
         <text x="${originX - labelOffset}" y="${originY + hs + (Hs - hs) / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H - h} u</text> <!-- Left edge segment -->
         <text x="${originX + ws / 2}" y="${originY + hs - labelOffset / 2}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${w} u</text> <!-- Inner horizontal top edge -->
         <text x="${originX + ws - labelOffset / 2}" y="${originY + hs / 2}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${h} u</text> <!-- Inner vertical left edge -->
      </svg>`;
    return { question: `Calculate the perimeter of the L-shaped figure shown (in u).`, answer: perimeter, diagram: diagramHTML };
  }
  function generateAreaRectSemiCircleSVG() {
    // Ensure height is even for integer radius
    let H = getRandomInt(3, 8) * 2; // Height of rectangle (6 to 16, even)
    let r = H / 2; // Radius of semi-circle
    let W = getRandomInt(r + 2, 20); // Width of rectangle, ensure W > r usually

    let rectArea = W * H;
    let semiCircleArea = 0.5 * Math.PI * r * r;
    let totalArea = rectArea + semiCircleArea;

    const padding = 35,
      maxViewSize = 150;
    // Scale based on total width (W + r)
    const scaleFactor = maxViewSize / (W + r);
    const Ws = W * scaleFactor; // Scaled width
    const Hs = H * scaleFactor; // Scaled height (and diameter)
    const rs = r * scaleFactor; // Scaled radius
    const svgWidth = Ws + rs + padding * 2; // SVG width includes rectangle and semi-circle radius
    const svgHeight = Hs + padding * 2;
    const originX = padding; // Left edge of rectangle
    const originY = padding; // Top edge of rectangle
    // Arc parameters (semi-circle attached to the right side of rectangle)
    const arcStartX = originX + Ws;
    const arcStartY = originY; // Top-right corner of rectangle
    const arcEndX = originX + Ws;
    const arcEndY = originY + Hs; // Bottom-right corner of rectangle
    const labelOffset = 10;

    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <!-- Rectangle -->
        <rect x="${originX}" y="${originY}" width="${Ws}" height="${Hs}" fill="rgba(0,123,255,0.1)" stroke="currentColor"/>
        <!-- Semi-circle path -->
        <path d="M ${arcStartX},${arcStartY} A ${rs},${rs} 0 0,1 ${arcEndX},${arcEndY}" fill="rgba(40,167,69,0.1)" stroke="currentColor"/>
        <!-- Labels -->
        <text x="${originX + Ws / 2}" y="${originY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text> <!-- Width label -->
        <text x="${originX - labelOffset}" y="${originY + Hs / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text> <!-- Height label -->
        <!-- Optional: Radius label -->
        <!-- <line x1="${originX + Ws}" y1="${originY + Hs / 2}" x2="${originX + Ws + rs}" y2="${originY + Hs / 2}" stroke="currentColor" stroke-dasharray="2,2"/> -->
        <!-- <text x="${originX + Ws + rs / 2}" y="${originY + Hs / 2 - labelOffset / 2}" font-size="9" text-anchor="middle" fill="currentColor" stroke="none">${r} u</text> -->
      </svg>`;
    return { question: `Calculate the total area (rectangle + semi-circle) shown (in u²). Use π≈3.14159. <br>(Round final answer to 1 decimal place).`, answer: totalArea, diagram: diagramHTML };
  }
  function generatePerimeterRectSemiCircleSVG() {
    let H = getRandomInt(3, 8) * 2; // Height (even)
    let r = H / 2;
    let W = getRandomInt(r + 2, 20); // Width

    // Perimeter includes: Top W, Left H, Bottom W, and curved semi-circle arc
    let straightSides = W + H + W; // Incorrect - it's Top W, Left H, Bottom W
    straightSides = H + W + H; // Actually Top W + Left H + Bottom W? No, diagram shows 3 sides of rectangle + arc
    straightSides = W + H + W; // Let's assume it's top, left, bottom edges of rectangle
    // Or maybe top(W), left(H), bottom(W)? Check diagram drawing logic
    // -> Drawing logic uses lines for top, left, bottom.
    let semiCircleArc = Math.PI * r; // Half the circumference (pi * diameter / 2 = pi * r)
    let totalPerimeter = straightSides + semiCircleArc;

    const padding = 35,
      maxViewSize = 150;
    const scaleFactor = maxViewSize / (W + r);
    const Ws = W * scaleFactor,
      Hs = H * scaleFactor,
      rs = r * scaleFactor;
    const svgWidth = Ws + rs + padding * 2;
    const svgHeight = Hs + padding * 2;
    const originX = padding,
      originY = padding;
    const arcStartX = originX + Ws,
      arcStartY = originY;
    const arcEndX = originX + Ws,
      arcEndY = originY + Hs;
    const labelOffset = 10;

    // Draw the perimeter lines explicitly
    const diagramHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="stroke-width:1.5;max-width:250px;height:auto;">
        <!-- Straight sides forming the perimeter -->
        <line x1="${originX}" y1="${originY}" x2="${originX + Ws}" y2="${originY}" stroke="currentColor"/> <!-- Top -->
        <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${originY + Hs}" stroke="currentColor"/> <!-- Left -->
        <line x1="${originX}" y1="${originY + Hs}" x2="${originX + Ws}" y2="${originY + Hs}" stroke="currentColor"/> <!-- Bottom -->
        <!-- Semi-circle arc -->
        <path d="M ${arcStartX},${arcStartY} A ${rs},${rs} 0 0,1 ${arcEndX},${arcEndY}" fill="none" stroke="currentColor"/>
        <!-- Fill hints (optional, very light) -->
         <rect x="${originX}" y="${originY}" width="${Ws}" height="${Hs}" fill="rgba(0,123,255,0.05)" stroke="none"/>
         <path d="M ${arcStartX},${arcStartY} A ${rs},${rs} 0 0,1 ${arcEndX},${arcEndY} L ${arcStartX},${originY + Hs / 2} Z" fill="rgba(40,167,69,0.05)" stroke="none" />
        <!-- Labels -->
        <text x="${originX + Ws / 2}" y="${originY - labelOffset}" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">${W} u</text> <!-- Width label -->
        <text x="${originX - labelOffset}" y="${originY + Hs / 2}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="currentColor" stroke="none">${H} u</text> <!-- Height label -->
      </svg>`;
    // Let's re-evaluate the perimeter: Top W, Left H, Bottom W, Arc (pi*r) -> W + H + W + pi*r
    // No, looking at the drawing, the right edge of the rectangle is *replaced* by the arc.
    // So it should be Top W + Left H + Bottom W + Arc = W + H + W + pi*r.
    // Let's recalculate:
    totalPerimeter = W + H + W + Math.PI * r; // Corrected perimeter calculation

    return { question: `Calculate the perimeter of the composite shape shown (in u). Use π≈3.14159. <br>(Round final answer to 1 decimal place).`, answer: totalPerimeter, diagram: diagramHTML };
  }
}); // END OF DOMContentLoaded LISTENER
