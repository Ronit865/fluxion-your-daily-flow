// Content filter for inappropriate words in multiple languages
// English, Hindi, and Gujarati abusive words and their variations

const inappropriateWords = [
  // English profanity and slurs (only severe/explicit words to avoid false positives)
  'fuck', 'fucking', 'fucker', 'fucked', 'fucks', 'motherfucker', 'motherfuckers',
  'shit', 'shitting', 'shitty', 'shits', 'bullshit',
  'bitch', 'bitching', 'bitches', 'asshole', 'assholes',
  'bastard', 'bastards', 'whore', 'whores',
  'slut', 'sluts', 'slutty', 'cunt', 'cunts',
  'faggot', 'nigger', 'nigga', 'niggas',
  'mofo', 'mfer', 'dumbass', 'jackass', 'dipshit', 'asshat',
  'rape', 'raping', 'rapist', 'molest', 'pedophile', 'pedo',
  'porn', 'pornography', 'xxx',
  'cumshot', 'masturbate',
  
  // Common shortforms (only explicit ones)
  'wtf', 'stfu', 'gtfo', 'omfg',
  
  // Hindi abusive words (romanized) - only explicit offensive terms
  'chutiya', 'chutiye', 'chutiyapa', 'chut', 'choot', 'chod', 'chodu', 'chodna',
  'madarchod', 'maderchod', 'mkc', 'maa ki chut',
  'bhenchod', 'bahenchod', 'behnchod', 'bkl', 'bhosad', 'bhosada',
  'bhosdike', 'bhosdi', 'bsdk', 'bsdke', 'betichod', 'betichodd',
  'gandu', 'gaand', 'gaandu',
  'lodu', 'lode', 'loda', 'lavde', 'laude', 'lavda', 'lawde', 'lund',
  'randi', 'raand', 'randwa', 'randibaaz',
  'harami', 'haramzada', 'haramzadi', 'haraamkhor', 'haramkhor',
  'kutiya', 'kuttiya',
  'kamina', 'kamine', 'kaminey',
  'bhadwa', 'bhadwe', 'bhadva', 'bhadve', 'bhadvaa',
  'dalla', 'dallal',
  'chinal',
  'teri maa', 'teri behen', 'maa chod',
  
  // Gujarati abusive words (romanized) - only explicit offensive terms
  'gando', 'gandi', 'ganda', 'gande',
  'bhadvo', 'bhadvi', 'bhadva',
  'bhosdo', 'bhosdi', 'bhosda', 'bhosde',
  'lavdo', 'lavdi', 'lavda', 'lavde', 'lodo', 'lodi',
  'chodiyu', 'chodu', 'chodvi',
  'randio', 'randi', 'rando',
  
  // Variations with numbers/symbols (only for major profanity)
  'f*ck', 'f**k', 'fck', 'fuk', 'phuck', 'phuk',
  'sh*t', 'sh!t', 'shyt', 'shet',
  'b*tch', 'b!tch', 'biatch',
  'a**hole', '@sshole',
  'n1gger', 'n1gga',
  
  // Offensive harmful terms
  'kill yourself', 'kys',
];

// Create regex patterns for variations
const createRegexPatterns = (): RegExp[] => {
  const patterns: RegExp[] = [];
  
  // Helper function to escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  inappropriateWords.forEach(word => {
    // Skip words that are too short (< 4 chars) to avoid false positives
    if (word.length < 4) {
      // Only add short words if they're explicit variations
      if (word.includes('*') || word.includes('@') || word.includes('!')) {
        const escapedWord = escapeRegex(word);
        patterns.push(new RegExp(`\\b${escapedWord}\\b`, 'gi'));
      }
      return;
    }
    
    // Exact match with word boundaries - most reliable
    const escapedWord = escapeRegex(word);
    patterns.push(new RegExp(`\\b${escapedWord}\\b`, 'gi'));
    
    // Only apply variations to longer explicit profanity (6+ chars) to avoid false positives
    if (word.length >= 6 && !/[^a-z0-9]/i.test(word)) {
      // Match with leetspeak/numbers for major words only
      const withNumbers = word
        .replace(/i/g, '[i1]')
        .replace(/e/g, '[e3]')
        .replace(/a/g, '[a4@]')
        .replace(/s/g, '[s5$]')
        .replace(/o/g, '[o0]');
      patterns.push(new RegExp(`\\b${withNumbers}\\b`, 'gi'));
    }
  });
  
  return patterns;
};

const regexPatterns = createRegexPatterns();

/**
 * Check if text contains inappropriate content
 * @param text - Text to check
 * @returns True if inappropriate content found
 */
export const containsInappropriateContent = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Check against all patterns
  for (const pattern of regexPatterns) {
    if (pattern.test(normalizedText)) {
      return true;
    }
  }
  

  return false;
};

/**
 * Get list of inappropriate words found in text
 * @param text - Text to check
 * @returns Array of inappropriate words found
 */
export const getInappropriateWords = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase().trim();
  const foundWords: string[] = [];
  
  inappropriateWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(normalizedText)) {
      foundWords.push(word);
    }
  });
  
  return [...new Set(foundWords)]; // Remove duplicates
};

/**
 * Censor inappropriate content in text
 * @param text - Text to censor
 * @returns Censored text
 */
export const censorContent = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  let censoredText = text;
  
  regexPatterns.forEach(pattern => {
    censoredText = censoredText.replace(pattern, (match) => {
      return '*'.repeat(match.length);
    });
  });
  
  return censoredText;
};
