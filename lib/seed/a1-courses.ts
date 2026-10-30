export type A1LessonSeed =
  | {
      kind: "youtube";
      titleEs: string;
      titleEn: string;
      titleFr: string;
      youtubeUrl: string;
    }
  | {
      kind: "pdf";
      titleEs: string;
      titleEn: string;
      titleFr: string;
      /** Used as uploaded filename stem */
      filename: string;
      /** Plain-text worksheet body rendered into a real PDF */
      worksheetLines: string[];
    };

export type A1CourseSeed = {
  slug: string;
  titleEs: string;
  titleEn: string;
  titleFr: string;
  descriptionEs: string;
  descriptionEn: string;
  descriptionFr: string;
  level: "A1";
  languageCode: "en";
  lessons: A1LessonSeed[];
};

/**
 * Production A1 catalog: topic-matched BBC / beginner YouTube lessons
 * plus printable PDF worksheets per course.
 */
export const A1_COURSE_SEEDS: A1CourseSeed[] = [
  {
    slug: "presentaciones-saludos",
    titleEs: "Inglés A1 – Presentaciones y Saludos",
    titleEn: "English A1 – Greetings and Introductions",
    titleFr: "Anglais A1 – Salutations et présentations",
    descriptionEs:
      "Domina saludos formales e informales y preséntate con confianza en situaciones cotidianas.",
    descriptionEn:
      "Master formal and informal greetings and introduce yourself confidently in everyday situations.",
    descriptionFr:
      "Maîtrisez les salutations formelles et informelles et présentez-vous avec confiance.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Cómo presentarte (BBC Learning English)",
        titleEn: "How to introduce yourself (BBC Learning English)",
        titleFr: "Comment se présenter (BBC Learning English)",
        youtubeUrl: "https://www.youtube.com/watch?v=I_tRSrPru94",
      },
      {
        kind: "youtube",
        titleEs: "Saludos formales (BBC Masterclass)",
        titleEn: "Formal greetings (BBC Masterclass)",
        titleFr: "Salutations formelles (BBC Masterclass)",
        youtubeUrl: "https://www.youtube.com/watch?v=o5ghhSAxopw",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: saludos y presentaciones",
        titleEn: "Practice worksheet: greetings and introductions",
        titleFr: "Fiche d'exercices : salutations et présentations",
        filename: "a1-greetings-worksheet.pdf",
        worksheetLines: [
          "English A1 – Greetings and Introductions",
          "",
          "1) Match the phrases:",
          "   Hello / Hi          Nice to meet you",
          "   Good morning        What's your name?",
          "   Goodbye / Bye       How are you?",
          "",
          "2) Complete:",
          "   A: Hello! What's your _____?",
          "   B: My name _____ Maria. Nice to _____ you.",
          "   A: _____ to meet you too. How _____ you?",
          "   B: I'm fine, _____. And you?",
          "",
          "3) Write 4 lines introducing yourself (name, city, job/study).",
        ],
      },
    ],
  },
  {
    slug: "numeros-fechas-tiempo",
    titleEs: "Inglés A1 – Números, Fechas y Tiempo",
    titleEn: "English A1 – Numbers, Dates and Time",
    titleFr: "Anglais A1 – Nombres, dates et heure",
    descriptionEs:
      "Aprende números, días, meses y a decir la hora para organizar tu día en inglés.",
    descriptionEn:
      "Learn numbers, days, months, and how to tell time to organize your day in English.",
    descriptionFr:
      "Apprenez les nombres, les jours, les mois et à dire l'heure en anglais.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Días, meses y estaciones (A1)",
        titleEn: "Days, months and seasons (A1)",
        titleFr: "Jours, mois et saisons (A1)",
        youtubeUrl: "https://www.youtube.com/watch?v=AKXDr2uoYfg",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: números, fechas y hora",
        titleEn: "Practice worksheet: numbers, dates and time",
        titleFr: "Fiche d'exercices : nombres, dates et heure",
        filename: "a1-numbers-dates-worksheet.pdf",
        worksheetLines: [
          "English A1 – Numbers, Dates and Time",
          "",
          "1) Write the numbers in words: 7, 12, 21, 30, 45.",
          "",
          "2) Days of the week (order them): Friday, Monday, Sunday, Wednesday.",
          "",
          "3) Months: What month is your birthday? Write the full sentence.",
          "",
          "4) Tell the time:",
          "   08:00 -> It's _____ o'clock.",
          "   15:30 -> It's half past _____.",
          "   19:15 -> It's a quarter _____ _____.",
        ],
      },
    ],
  },
  {
    slug: "mi-vida-diaria",
    titleEs: "Inglés A1 – Mi Vida Diaria",
    titleEn: "English A1 – My Daily Life",
    titleFr: "Anglais A1 – Ma vie quotidienne",
    descriptionEs:
      "Describe tu rutina diaria, actividades habituales y horarios con frases simples.",
    descriptionEn:
      "Describe your daily routine, habits, and schedules with simple phrases.",
    descriptionFr:
      "Décrivez votre routine quotidienne et vos habitudes avec des phrases simples.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Rutina diaria (BBC Easy English)",
        titleEn: "Daily routine (BBC Easy English)",
        titleFr: "Routine quotidienne (BBC Easy English)",
        youtubeUrl: "https://www.youtube.com/watch?v=bq6GBbh3uhU",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: mi rutina diaria",
        titleEn: "Practice worksheet: my daily routine",
        titleFr: "Fiche d'exercices : ma routine quotidienne",
        filename: "a1-daily-routine-worksheet.pdf",
        worksheetLines: [
          "English A1 – My Daily Life",
          "",
          "Useful verbs: wake up, have breakfast, go to work/school,",
          "have lunch, finish work, have dinner, go to bed.",
          "",
          "1) Put the day in order (write numbers 1-6).",
          "",
          "2) Complete with present simple:",
          "   I _____ up at 6:30.",
          "   She _____ breakfast at 7:00.",
          "   We _____ to school by bus.",
          "",
          "3) Write your real daily routine in 6 sentences.",
        ],
      },
    ],
  },
  {
    slug: "familia-hogar",
    titleEs: "Inglés A1 – Familia y Hogar",
    titleEn: "English A1 – Family and Home",
    titleFr: "Anglais A1 – Famille et maison",
    descriptionEs:
      "Habla de tu familia, personas cercanas y espacios de tu casa con vocabulario esencial.",
    descriptionEn:
      "Talk about your family, close people, and rooms in your home with essential vocabulary.",
    descriptionFr:
      "Parlez de votre famille et de votre maison avec un vocabulaire essentiel.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Describe tu familia (BBC Easy English)",
        titleEn: "Describe your family (BBC Easy English)",
        titleFr: "Décrire votre famille (BBC Easy English)",
        youtubeUrl: "https://www.youtube.com/watch?v=v9EU41cuhHY",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: familia y hogar",
        titleEn: "Practice worksheet: family and home",
        titleFr: "Fiche d'exercices : famille et maison",
        filename: "a1-family-home-worksheet.pdf",
        worksheetLines: [
          "English A1 – Family and Home",
          "",
          "Family words: mum, dad, brother, sister, grandmother,",
          "grandfather, aunt, uncle, cousin.",
          "",
          "Rooms: kitchen, bedroom, bathroom, living room, garden.",
          "",
          "1) Write who lives in your house.",
          "2) Complete: This is my _____. He/She is ____ years old.",
          "3) Describe your favourite room in 4 sentences.",
        ],
      },
    ],
  },
  {
    slug: "comida-compras",
    titleEs: "Inglés A1 – Comida y Compras",
    titleEn: "English A1 – Food and Shopping",
    titleFr: "Anglais A1 – Nourriture et achats",
    descriptionEs:
      "Practica vocabulario de comida y frases útiles para comprar en tiendas y mercados.",
    descriptionEn:
      "Practice food vocabulary and useful phrases for shopping in stores and markets.",
    descriptionFr:
      "Pratiquez le vocabulaire alimentaire et les phrases utiles pour faire des achats.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Lección A1: conversación inicial (comida y frases básicas)",
        titleEn: "A1 lesson: first conversation (food & basic phrases)",
        titleFr: "Leçon A1 : première conversation (nourriture et phrases)",
        youtubeUrl: "https://www.youtube.com/watch?v=uYEiKO--dAQ",
      },
      {
        kind: "youtube",
        titleEs: "Inglés para principiantes – práctica guiada",
        titleEn: "Beginner English – guided practice",
        titleFr: "Anglais débutant – pratique guidée",
        youtubeUrl: "https://www.youtube.com/watch?v=ig3irLa0eu0",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: comida y compras",
        titleEn: "Practice worksheet: food and shopping",
        titleFr: "Fiche d'exercices : nourriture et achats",
        filename: "a1-food-shopping-worksheet.pdf",
        worksheetLines: [
          "English A1 – Food and Shopping",
          "",
          "Food: apple, bread, milk, rice, chicken, water, coffee, eggs.",
          "Phrases: How much is it? I'd like... Have you got...?",
          "",
          "1) Make a shopping list of 8 items.",
          "2) Role-play dialogue at a shop (6 lines).",
          "3) Write what you eat for breakfast, lunch and dinner.",
        ],
      },
    ],
  },
  {
    slug: "direcciones-lugares",
    titleEs: "Inglés A1 – Direcciones y Lugares",
    titleEn: "English A1 – Directions and Places",
    titleFr: "Anglais A1 – Directions et lieux",
    descriptionEs:
      "Pide y da direcciones, describe lugares comunes y muévete con confianza en la ciudad.",
    descriptionEn:
      "Ask for and give directions, describe common places, and move confidently around town.",
    descriptionFr:
      "Demandez et donnez des directions et décrivez des lieux courants en ville.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Saludos y personas – base para pedir ayuda en la calle",
        titleEn: "Greetings & people – base for asking for help outside",
        titleFr: "Salutations et personnes – base pour demander de l'aide",
        youtubeUrl: "https://www.youtube.com/watch?v=6lE4O6fXpgs",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: direcciones y lugares",
        titleEn: "Practice worksheet: directions and places",
        titleFr: "Fiche d'exercices : directions et lieux",
        filename: "a1-directions-places-worksheet.pdf",
        worksheetLines: [
          "English A1 – Directions and Places",
          "",
          "Places: bank, school, hospital, supermarket, park, bus stop.",
          "Directions: go straight, turn left, turn right, next to,",
          "opposite, between, near.",
          "",
          "1) Draw a simple town map and label 6 places.",
          "2) Write directions from the school to the park (4 steps).",
          "3) Dialogue: Excuse me, where is the _____?",
        ],
      },
    ],
  },
  {
    slug: "colores-objetos",
    titleEs: "Inglés A1 – Colores y Objetos",
    titleEn: "English A1 – Colors and Objects",
    titleFr: "Anglais A1 – Couleurs et objets",
    descriptionEs:
      "Aprende colores, objetos cotidianos y descripciones básicas para tu entorno.",
    descriptionEn:
      "Learn colors, everyday objects, and basic descriptions for your surroundings.",
    descriptionFr:
      "Apprenez les couleurs, les objets du quotidien et les descriptions de base.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Vocabulario A1: calendario y entorno cotidiano",
        titleEn: "A1 vocabulary: calendar and everyday surroundings",
        titleFr: "Vocabulaire A1 : calendrier et environnement quotidien",
        youtubeUrl: "https://www.youtube.com/watch?v=AKXDr2uoYfg",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: colores y objetos",
        titleEn: "Practice worksheet: colors and objects",
        titleFr: "Fiche d'exercices : couleurs et objets",
        filename: "a1-colors-objects-worksheet.pdf",
        worksheetLines: [
          "English A1 – Colors and Objects",
          "",
          "Colors: red, blue, green, yellow, black, white, brown, pink.",
          "Objects: pen, book, phone, bag, chair, table, door, window.",
          "",
          "1) Write 8 sentences: The _____ is _____.",
          "2) Describe 3 objects on your desk (color + size).",
          "3) What colour is your favourite bag/shirt/phone?",
        ],
      },
    ],
  },
  {
    slug: "preguntas-respuestas",
    titleEs: "Inglés A1 – Preguntas y Respuestas",
    titleEn: "English A1 – Questions and Answers",
    titleFr: "Anglais A1 – Questions et réponses",
    descriptionEs:
      "Formula preguntas simples y responde con claridad en situaciones reales.",
    descriptionEn:
      "Ask simple questions and answer clearly in real-life situations.",
    descriptionFr:
      "Posez des questions simples et répondez clairement dans des situations réelles.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Conversación básica A1-A2: preguntas reales",
        titleEn: "Basic A1-A2 conversation: real questions",
        titleFr: "Conversation de base A1-A2 : vraies questions",
        youtubeUrl: "https://www.youtube.com/watch?v=f59Qen3NXJg",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: preguntas y respuestas",
        titleEn: "Practice worksheet: questions and answers",
        titleFr: "Fiche d'exercices : questions et réponses",
        filename: "a1-questions-answers-worksheet.pdf",
        worksheetLines: [
          "English A1 – Questions and Answers",
          "",
          "Question words: What / Where / When / Who / Why / How / How old.",
          "",
          "1) Make questions for these answers:",
          "   A: I'm from Colombia.",
          "   A: I wake up at 6.",
          "   A: My favourite colour is blue.",
          "",
          "2) Write 8 interview questions for a classmate.",
          "3) Answer your own interview in full sentences.",
        ],
      },
    ],
  },
  {
    slug: "clima-estaciones",
    titleEs: "Inglés A1 – Clima y Estaciones",
    titleEn: "English A1 – Weather and Seasons",
    titleFr: "Anglais A1 – Météo et saisons",
    descriptionEs:
      "Habla del clima, las estaciones y planes simples según el tiempo.",
    descriptionEn:
      "Talk about weather, seasons, and simple plans depending on the forecast.",
    descriptionFr:
      "Parlez de la météo, des saisons et de plans simples selon le temps.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Describe el clima (BBC Easy English)",
        titleEn: "Describing the weather (BBC Easy English)",
        titleFr: "Décrire la météo (BBC Easy English)",
        youtubeUrl: "https://www.youtube.com/watch?v=sMg4vj6ugSs",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: clima y estaciones",
        titleEn: "Practice worksheet: weather and seasons",
        titleFr: "Fiche d'exercices : météo et saisons",
        filename: "a1-weather-seasons-worksheet.pdf",
        worksheetLines: [
          "English A1 – Weather and Seasons",
          "",
          "Weather: sunny, rainy, cloudy, windy, snowy, hot, cold, warm.",
          "Seasons: spring, summer, autumn/fall, winter.",
          "",
          "1) What's the weather like today? Write 3 sentences.",
          "2) Match seasons with typical weather in your city.",
          "3) Dialogue: How's the weather? / It's _____ today.",
        ],
      },
    ],
  },
  {
    slug: "conversaciones-cotidianas",
    titleEs: "Inglés A1 – Conversaciones Cotidianas",
    titleEn: "English A1 – Everyday Conversations",
    titleFr: "Anglais A1 – Conversations du quotidien",
    descriptionEs:
      "Practica diálogos cortos para salir, estudiar y socializar en inglés desde cero.",
    descriptionEn:
      "Practice short dialogues for going out, studying, and socializing in English from scratch.",
    descriptionFr:
      "Pratiquez de courts dialogues pour sortir, étudier et socialiser en anglais.",
    level: "A1",
    languageCode: "en",
    lessons: [
      {
        kind: "youtube",
        titleEs: "Presentaciones en conversaciones reales (BBC)",
        titleEn: "Introductions in real conversations (BBC)",
        titleFr: "Présentations dans de vraies conversations (BBC)",
        youtubeUrl: "https://www.youtube.com/watch?v=I_tRSrPru94",
      },
      {
        kind: "youtube",
        titleEs: "Práctica de saludos y presentaciones (A1)",
        titleEn: "Greeting and introduction practice (A1)",
        titleFr: "Pratique des salutations et présentations (A1)",
        youtubeUrl: "https://www.youtube.com/watch?v=6lE4O6fXpgs",
      },
      {
        kind: "pdf",
        titleEs: "Hoja de práctica: conversaciones cotidianas",
        titleEn: "Practice worksheet: everyday conversations",
        titleFr: "Fiche d'exercices : conversations du quotidien",
        filename: "a1-everyday-conversations-worksheet.pdf",
        worksheetLines: [
          "English A1 – Everyday Conversations",
          "",
          "Situations: meeting someone, talking about your day,",
          "asking about weather, talking about family, buying food.",
          "",
          "1) Write a 8-line dialogue meeting a new classmate.",
          "2) Write a 6-line dialogue at a cafe.",
          "3) Record (or rehearse) your dialogue out loud twice.",
        ],
      },
    ],
  },
];
