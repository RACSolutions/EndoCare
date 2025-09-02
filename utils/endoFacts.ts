export interface EndoFact {
  text: string;
  category: 'awareness' | 'symptoms' | 'treatment' | 'statistics' | 'lifestyle';
  icon: string;
}

export const endoFacts: EndoFact[] = [
  // Awareness & General
  {
    text: "Endometriosis affects 1 in 10 women of reproductive age worldwide - that's 176 million women globally.",
    category: 'awareness',
    icon: '🌍'
  },
  {
    text: "It takes an average of 7-12 years to get an endometriosis diagnosis, highlighting the need for better awareness.",
    category: 'awareness',
    icon: '⏰'
  },
  {
    text: "Endometriosis occurs when tissue similar to the uterine lining grows outside the uterus, causing inflammation.",
    category: 'awareness',
    icon: '🔬'
  },
  {
    text: "March is Endometriosis Awareness Month, dedicated to raising global awareness about this condition.",
    category: 'awareness',
    icon: '🎗️'
  },
  
  // Symptoms
  {
    text: "Painful periods aren't normal - severe menstrual pain that interferes with daily life may indicate endometriosis.",
    category: 'symptoms',
    icon: '🩸'
  },
  {
    text: "Endometriosis can cause pain during intercourse, bowel movements, and urination, not just during periods.",
    category: 'symptoms',
    icon: '😣'
  },
  {
    text: "Chronic fatigue is a common but often overlooked symptom of endometriosis affecting daily quality of life.",
    category: 'symptoms',
    icon: '😴'
  },
  {
    text: "Digestive symptoms like bloating, nausea, and IBS-like symptoms are frequently experienced with endometriosis.",
    category: 'symptoms',
    icon: '🤢'
  },
  
  // Statistics
  {
    text: "30-50% of women with endometriosis experience fertility challenges, but many can still conceive with treatment.",
    category: 'statistics',
    icon: '📊'
  },
  {
    text: "Endometriosis costs the US economy $78 billion annually in healthcare and productivity losses.",
    category: 'statistics',
    icon: '💰'
  },
  {
    text: "Women with endometriosis have a 7x higher risk of developing ovarian cancer, though the overall risk remains low.",
    category: 'statistics',
    icon: '📈'
  },
  {
    text: "40% of women with chronic pelvic pain have endometriosis as the underlying cause.",
    category: 'statistics',
    icon: '📋'
  },
  
  // Treatment
  {
    text: "Early diagnosis and treatment can significantly improve quality of life and potentially slow disease progression.",
    category: 'treatment',
    icon: '🏥'
  },
  {
    text: "Laparoscopic surgery by specialized surgeons can provide significant pain relief and fertility improvement.",
    category: 'treatment',
    icon: '⚕️'
  },
  {
    text: "Hormonal therapies can help manage symptoms by suppressing estrogen production and menstruation.",
    category: 'treatment',
    icon: '💊'
  },
  {
    text: "Multidisciplinary care including gynecologists, pain specialists, and physiotherapists often provides best outcomes.",
    category: 'treatment',
    icon: '👩‍⚕️'
  },
  
  // Lifestyle
  {
    text: "Regular exercise can help reduce endometriosis pain by releasing natural endorphins and reducing inflammation.",
    category: 'lifestyle',
    icon: '🏃‍♀️'
  },
  {
    text: "Anti-inflammatory diets rich in omega-3s and low in processed foods may help manage endometriosis symptoms.",
    category: 'lifestyle',
    icon: '🥗'
  },
  {
    text: "Stress management through meditation, yoga, or counseling can help cope with chronic pain and improve wellbeing.",
    category: 'lifestyle',
    icon: '🧘‍♀️'
  },
  {
    text: "Heat therapy, warm baths, and heating pads can provide natural pain relief during symptom flares.",
    category: 'lifestyle',
    icon: '🛁'
  },
  {
    text: "Tracking symptoms with apps like EndoCare helps identify patterns and improves communication with healthcare providers.",
    category: 'lifestyle',
    icon: '📱'
  },
  
  // More awareness facts
  {
    text: "Endometriosis can occur in teens - severe period pain that started early shouldn't be dismissed as 'normal'.",
    category: 'awareness',
    icon: '👩‍🎓'
  },
  {
    text: "The condition affects people of all ethnicities, but diagnosis rates vary due to healthcare access and cultural factors.",
    category: 'awareness',
    icon: '🤝'
  },
  {
    text: "Endometriosis can continue after menopause in some cases, especially if estrogen replacement therapy is used.",
    category: 'awareness',
    icon: '👵'
  }
];

// Utility function to get a random fact
export const getRandomEndoFact = (): EndoFact => {
  const randomIndex = Math.floor(Math.random() * endoFacts.length);
  return endoFacts[randomIndex];
};

// Utility function to get facts by category
export const getFactsByCategory = (category: EndoFact['category']): EndoFact[] => {
  return endoFacts.filter(fact => fact.category === category);
};

// Utility function to get a random fact from a specific category
export const getRandomFactByCategory = (category: EndoFact['category']): EndoFact | null => {
  const categoryFacts = getFactsByCategory(category);
  if (categoryFacts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * categoryFacts.length);
  return categoryFacts[randomIndex];
};