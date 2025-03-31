document.addEventListener('DOMContentLoaded', () => {
  const quizContainer = document.getElementById('quiz-container');
  const resultsContainer = document.getElementById('results-container');
  const scoreElement = document.getElementById('score');
  const feedbackElement = document.getElementById('feedback');
  const quizForm = document.getElementById('quiz-form');
  const submitButton = document.getElementById('submit-btn');

  // --- Questions Array (Harder, More Nervous/Endocrine Focus) ---
  const questions = [
    // --- Nervous System Questions ---
    {
      // SC NS 1, 4 (Application)
      question: 'Imagine you step on a sharp object. Which sequence best describes the *reflex* pathway involved in quickly lifting your foot?',
      options: ['Foot receptor -> Brain -> Spinal Cord -> Leg Muscle', 'Foot receptor -> Sensory Neuron -> Spinal Cord (Interneuron) -> Motor Neuron -> Leg Muscle', 'Brain -> Motor Neuron -> Foot Receptor -> Leg Muscle', 'Foot receptor -> Sensory Neuron -> Brain -> Motor Neuron -> Leg Muscle'],
      answer: 'Foot receptor -> Sensory Neuron -> Spinal Cord (Interneuron) -> Motor Neuron -> Leg Muscle',
    },
    {
      // SC NS 4, 5 (Comparison)
      question: 'Why is a reflex action typically faster than a conscious decision to move?',
      options: ['Reflexes use chemical signals while conscious actions use electrical signals.', 'Conscious actions involve more neurons and processing time in the brain.', 'Reflex pathways bypass receptors and effectors.', 'Motor neurons are faster than sensory neurons only during reflexes.'],
      answer: 'Conscious actions involve more neurons and processing time in the brain.',
    },
    {
      // SC NS 2 (Distinction)
      question: 'Which statement accurately distinguishes the CNS and PNS?',
      options: ['The CNS processes information; the PNS only detects stimuli.', 'The PNS consists of the brain and spinal cord; the CNS consists of nerves.', 'The CNS is the central processing unit (brain/spinal cord); the PNS comprises nerves connecting the CNS to the rest of the body.', 'The CNS controls voluntary actions; the PNS controls involuntary actions.'],
      answer: 'The CNS is the central processing unit (brain/spinal cord); the PNS comprises nerves connecting the CNS to the rest of the body.',
    },
    {
      // SC NS Neuron Structure/Function
      question: 'The myelin sheath, which covers parts of some neurons, plays a crucial role in:',
      options: ['Detecting stimuli directly.', 'Releasing neurotransmitters into the synapse.', 'Increasing the speed of electrical signal transmission along the axon.', 'Connecting the neuron directly to muscles or glands.'],
      answer: 'Increasing the speed of electrical signal transmission along the axon.',
    },
    {
      // SC NS Neuron Types
      question: 'Which type of neuron is responsible for carrying signals *from* the CNS *to* muscles or glands, causing a response?',
      options: ['Sensory Neuron', 'Interneuron (Relay Neuron)', 'Motor Neuron', 'Receptor Neuron'],
      answer: 'Motor Neuron',
    },
    {
      // SC NS Synapse/Neurotransmitter
      question: 'Communication between two neurons at a synapse primarily involves:',
      options: ['Direct electrical connection through the myelin sheath.', 'The release of chemical messengers (neurotransmitters) across a small gap.', 'Hormones travelling through the bloodstream.', 'Physical contact and fusion of the axon and dendrite.'],
      answer: 'The release of chemical messengers (neurotransmitters) across a small gap.',
    },
    {
      // SC NS 3, 6 (Application/Pathway)
      question: 'When you consciously decide to write your name, the signal originates in the ______, travels through the CNS, and is sent via ______ neurons to your hand muscles.',
      options: ['Spinal cord, Sensory', 'Brain (Cerebrum), Motor', 'Cerebellum, Interneurons', 'Receptors in your eyes, Sensory'],
      answer: 'Brain (Cerebrum), Motor',
    },
    {
      // SC NS 7 (Function - Higher Level)
      question: 'While the brainstem controls basic survival functions, coordination and fine-tuning of complex movements like playing piano rely heavily on the:',
      options: ['Cerebrum', 'Hypothalamus', 'Cerebellum', 'Pituitary Gland'],
      answer: 'Cerebellum',
    },
    // --- Endocrine System Questions ---
    {
      // SC ES 1 (Specificity)
      question: 'Hormones travel throughout the bloodstream, but only affect specific target cells. Why?',
      options: ['Hormones are only released near their target cells.', 'Target cells have specific receptors that match the shape of the hormone.', 'Non-target cells actively destroy hormones.', 'The bloodstream only carries hormones to certain parts of the body.'],
      answer: 'Target cells have specific receptors that match the shape of the hormone.',
    },
    {
      // SC ES 1, Hormone Example
      question: "Which gland produces adrenaline, and what is a primary effect of this hormone during a 'fight or flight' response?",
      options: ['Pituitary gland; stimulates growth', 'Thyroid gland; increases metabolism', 'Adrenal gland; increases heart rate and blood flow to muscles', 'Pancreas; lowers blood sugar'],
      answer: 'Adrenal gland; increases heart rate and blood flow to muscles',
    },
    {
      // SC ES 1, Blood Glucose Regulation
      question: 'If blood glucose levels become too high (e.g., after a meal), the pancreas releases ______, which signals cells to ______ glucose.',
      options: ['Glucagon; release', 'Insulin; take up', 'Adrenaline; ignore', 'Thyroid hormone; store as fat'],
      answer: 'Insulin; take up',
    },
    {
      // SC ES 1, Gland Function
      question: "Which gland produces hormones that regulate the body's metabolism (rate of chemical reactions)?",
      options: ['Adrenal Glands', 'Pancreas', 'Thyroid Gland', 'Testes/Ovaries'],
      answer: 'Thyroid Gland',
    },
    {
      // SC ES 1 (Mechanism)
      question: 'How are hormones transported from the endocrine gland where they are produced to the cells they affect?',
      options: ['Through nerve fibres', 'Via the bloodstream', 'Through ducts directly onto a surface', 'By diffusion through adjacent tissues only'],
      answer: 'Via the bloodstream',
    },
    // --- Nervous & Endocrine System Comparison ---
    {
      // SC NS/ES Comparison
      question: 'Compared to the nervous system, messages sent by the endocrine system are generally:',
      options: ['Faster acting and shorter lasting', 'Slower acting and longer lasting', 'Transmitted electrically', 'Targeted only to adjacent cells'],
      answer: 'Slower acting and longer lasting',
    },
    {
      // SC ES 2 (Homeostasis Example)
      question: 'Maintaining a stable internal body temperature involves both nervous (e.g., shivering) and endocrine responses. This maintenance of a stable internal environment is called:',
      options: ['Reflex arc', 'Stimulus-response', 'Homeostasis', 'Synaptic transmission'],
      answer: 'Homeostasis',
    },
    {
      // SC ES 2 / NS Comparison (Control)
      question: 'Which scenario is primarily controlled by the nervous system rather than the endocrine system?',
      options: ['Regulating blood sugar levels over hours.', 'Coordinating muscle contractions for walking.', 'Managing long-term growth and development.', 'Responding to changes in blood calcium levels over days.'],
      answer: 'Coordinating muscle contractions for walking.',
    },
    // --- Immune System Questions (Similar difficulty as before) ---
    {
      // SC IS 1
      question: 'Which of the following causes infectious disease by replicating *inside* host cells, often destroying them in the process?',
      options: ['Bacteria', 'Fungi', 'Viruses', 'Allergens'],
      answer: 'Viruses',
    },
    {
      // SC IS 3
      question: 'Besides the skin, what is another example of a first-line defence barrier against pathogens?',
      options: ['Antibodies', 'Inflammation', 'Mucous membranes lining airways', 'Memory B cells'],
      answer: 'Mucous membranes lining airways',
    },
    {
      // SC IS 4
      question: 'The second line of defence, involving processes like inflammation and fever, is considered:',
      options: ['Specific immunity (targets particular pathogens)', 'Non-specific immunity (general response to infection)', 'A physical barrier', 'Dependent on memory cells'],
      answer: 'Non-specific immunity (general response to infection)',
    },
    {
      // SC IS 5
      question: 'What is the primary advantage of the third line of defence (specific/adaptive immunity)?',
      options: ['It acts faster than the first line of defence.', 'It creates memory, allowing for a faster and stronger response upon re-exposure to the same pathogen.', 'It uses physical barriers like skin.', 'It causes inflammation to trap pathogens.'],
      answer: 'It creates memory, allowing for a faster and stronger response upon re-exposure to the same pathogen.',
    },
    {
      // SC IS 9 (Application)
      question: 'Vaccines protect individuals and populations by:',
      options: ['Providing antibodies directly from another person.', 'Strengthening the skin barrier.', 'Killing all bacteria in the body.', 'Triggering the immune system to develop memory cells against a specific pathogen without causing significant illness.'],
      answer: 'Triggering the immune system to develop memory cells against a specific pathogen without causing significant illness.',
    },
    {
      // SC IS 7, 8 (Control Measures)
      question: 'Practices like handwashing, sanitation, and quarantine are crucial public health measures primarily because they:',
      options: ['Boost the third line of immune defence.', 'Reduce the transmission of pathogens between individuals.', 'Increase the effectiveness of antibiotics.', 'Directly stimulate hormone production.'],
      answer: 'Reduce the transmission of pathogens between individuals.',
    },
  ];

  // --- Function to Build the Quiz ---
  function buildQuiz() {
    // Clear previous questions if any
    quizContainer.innerHTML = '';
    questions.forEach((currentQuestion, questionNumber) => {
      // Create div for question block
      const questionBlock = document.createElement('div');
      questionBlock.classList.add('question-block');

      // Add the question text
      const questionText = document.createElement('p');
      questionText.textContent = `${questionNumber + 1}. ${currentQuestion.question}`;
      questionBlock.appendChild(questionText);

      // Create div for options
      const optionsDiv = document.createElement('div');
      optionsDiv.classList.add('options');

      // Add options
      currentQuestion.options.forEach((option) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question${questionNumber}`;
        radio.value = option;
        radio.required = true; // Make answering each question mandatory

        label.appendChild(radio);
        label.appendChild(document.createTextNode(option));
        optionsDiv.appendChild(label);
      });

      questionBlock.appendChild(optionsDiv);
      quizContainer.appendChild(questionBlock);
    });
    // Ensure submit button is visible when quiz is built
    submitButton.style.display = 'block';
    // Hide results container initially
    resultsContainer.style.display = 'none';
  }

  // --- Function to Show Results ---
  function showResults() {
    let score = 0;
    const questionBlocks = quizContainer.querySelectorAll('.question-block');

    questions.forEach((currentQuestion, questionNumber) => {
      const questionBlock = questionBlocks[questionNumber];
      const selector = `input[name="question${questionNumber}"]:checked`;
      const userAnswerInput = questionBlock.querySelector(selector);
      const optionsLabels = questionBlock.querySelectorAll('.options label');

      // Clear previous result styling/indicators
      optionsLabels.forEach((label) => {
        label.classList.remove('correct', 'incorrect');
        const revealSpan = label.querySelector('.correct-answer-reveal');
        if (revealSpan) {
          label.removeChild(revealSpan);
        }
      });

      if (userAnswerInput) {
        const userAnswer = userAnswerInput.value;
        const correctLabel = Array.from(optionsLabels).find((label) => {
          // Find the text node within the label, ignoring the radio button itself
          // This handles cases where formatting might add extra spaces
          const labelText = Array.from(label.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE)
            ?.nodeValue.trim();
          return labelText === currentQuestion.answer.trim();
        });
        const selectedLabel = userAnswerInput.parentElement;

        if (userAnswer.trim() === currentQuestion.answer.trim()) {
          score++;
          selectedLabel.classList.add('correct'); // Style selected correct answer
        } else {
          selectedLabel.classList.add('incorrect'); // Style selected incorrect answer
          if (correctLabel) {
            correctLabel.classList.add('correct'); // Highlight the actual correct answer
            // Add text indicating the correct answer
            const correctAnswerIndicator = document.createElement('span');
            correctAnswerIndicator.classList.add('correct-answer-reveal');
            correctAnswerIndicator.textContent = ' <-- Correct Answer';
            // Avoid adding multiple indicators if clicked multiple times
            if (!correctLabel.querySelector('.correct-answer-reveal')) {
              correctLabel.appendChild(correctAnswerIndicator);
            }
          }
        }
      } else {
        // Handle skipped question - highlight the correct answer
        const correctLabel = Array.from(optionsLabels).find((label) => {
          const labelText = Array.from(label.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE)
            ?.nodeValue.trim();
          return labelText === currentQuestion.answer.trim();
        });
        if (correctLabel) {
          correctLabel.classList.add('correct'); // Highlight the correct answer if skipped
        }
      }

      // Disable radio buttons after submission
      const radioButtons = questionBlock.querySelectorAll('input[type="radio"]');
      radioButtons.forEach((radio) => (radio.disabled = true));
    });

    // Display score and feedback
    const percentage = Math.round((score / questions.length) * 100);
    scoreElement.textContent = `You scored ${score} out of ${questions.length} (${percentage}%)`;

    // Provide feedback based on score
    resultsContainer.classList.remove('warning', 'error'); // Reset classes
    if (percentage >= 80) {
      feedbackElement.textContent = 'Excellent understanding!';
    } else if (percentage >= 60) {
      feedbackElement.textContent = 'Good effort! Review the highlighted answers to strengthen your knowledge.';
      resultsContainer.classList.add('warning');
    } else {
      feedbackElement.textContent = "There's room for improvement. Carefully review the concepts covered in the highlighted questions.";
      resultsContainer.classList.add('error');
    }

    resultsContainer.style.display = 'block';
    submitButton.style.display = 'none'; // Hide submit button after submission
    window.scrollTo(0, document.body.scrollHeight); // Scroll to results
  }

  // --- Event Listener for Form Submission ---
  quizForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission
    showResults();
  });

  // --- Initial Call to Build the Quiz ---
  buildQuiz();
});
