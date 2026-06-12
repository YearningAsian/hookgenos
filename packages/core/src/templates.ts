import type { HookType, Platform, Tone, Template } from './types';

export const TEMPLATES: Template[] = [
  // ── CURIOSITY (12) ────────────────────────────────────────────────────────
  { id: 'c1', type: 'curiosity', template: 'The one thing nobody tells you about {topic}', score: 88, platforms: ['tiktok','instagram','youtube','general'], tones: ['casual','curious'], example: 'The one thing nobody tells you about building a personal brand' },
  { id: 'c2', type: 'curiosity', template: 'I wish I knew this about {topic} before I started', score: 85, platforms: ['tiktok','instagram','youtube','general'], tones: ['casual','curious'], example: 'I wish I knew this about freelancing before I started' },
  { id: 'c3', type: 'curiosity', template: "The secret {topic} experts don't want you to know", score: 82, platforms: ['tiktok','instagram','general'], tones: ['bold','curious'], example: "The secret real estate investors don't want you to know" },
  { id: 'c4', type: 'curiosity', template: 'What happens when you try {topic} every day for {number} days', score: 90, platforms: ['tiktok','youtube','instagram'], tones: ['casual','curious'], example: 'What happens when you try cold showers every day for 30 days' },
  { id: 'c5', type: 'curiosity', template: 'POV: You just discovered the {topic} hack that changes everything', score: 87, platforms: ['tiktok','instagram'], tones: ['casual','bold'], example: 'POV: You just discovered the productivity hack that changes everything' },
  { id: 'c6', type: 'curiosity', template: "The reason your {topic} isn't working (and it's not what you think)", score: 89, platforms: ['tiktok','instagram','youtube','linkedin'], tones: ['curious','bold'], example: "The reason your content isn't getting views (and it's not what you think)" },
  { id: 'c7', type: 'curiosity', template: 'Wait until you see what {topic} actually looks like from the inside', score: 84, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: 'Wait until you see what a $10M business actually looks like from the inside' },
  { id: 'c8', type: 'curiosity', template: 'This {topic} trick took me {number} years to figure out', score: 83, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: 'This investing trick took me 3 years to figure out' },
  { id: 'c9', type: 'curiosity', template: 'Nobody talks about this part of {topic}', score: 86, platforms: ['tiktok','instagram','linkedin','twitter'], tones: ['bold','curious'], example: 'Nobody talks about this part of entrepreneurship' },
  { id: 'c10', type: 'curiosity', template: 'Things I noticed about {topic} that most people miss', score: 81, platforms: ['twitter','linkedin','instagram'], tones: ['curious','professional'], example: 'Things I noticed about top performers that most people miss' },
  { id: 'c11', type: 'curiosity', template: "Here's what {number} hours studying {topic} taught me", score: 79, platforms: ['linkedin','twitter','youtube'], tones: ['professional','curious'], example: "Here's what 1000 hours studying sales taught me" },
  { id: 'c12', type: 'curiosity', template: "The {topic} strategy they don't teach in school", score: 85, platforms: ['linkedin','twitter','tiktok'], tones: ['bold','professional'], example: "The money strategy they don't teach in school" },

  // ── FEAR / FOMO (10) ──────────────────────────────────────────────────────
  { id: 'f1', type: 'fear_fomo', template: "Stop scrolling if you're struggling with {topic}", score: 91, platforms: ['tiktok','instagram'], tones: ['urgent','bold'], example: "Stop scrolling if you're struggling with getting clients" },
  { id: 'f2', type: 'fear_fomo', template: "You're losing money every day you don't know about {topic}", score: 88, platforms: ['tiktok','instagram','linkedin'], tones: ['urgent','bold'], example: "You're losing money every day you don't know about compound interest" },
  { id: 'f3', type: 'fear_fomo', template: 'Everyone doing {topic} in 2025 knows this one thing', score: 86, platforms: ['tiktok','instagram','youtube'], tones: ['urgent','casual'], example: "Everyone building a side hustle in 2025 knows this one thing" },
  { id: 'f4', type: 'fear_fomo', template: "If you're not doing {topic} yet, you're already behind", score: 84, platforms: ['linkedin','twitter','tiktok'], tones: ['urgent','bold'], example: "If you're not using AI tools yet, you're already behind" },
  { id: 'f5', type: 'fear_fomo', template: "This {topic} opportunity won't exist in 6 months", score: 90, platforms: ['tiktok','instagram','twitter'], tones: ['urgent','bold'], example: "This crypto opportunity won't exist in 6 months" },
  { id: 'f6', type: 'fear_fomo', template: "The {topic} trend everyone will be talking about next year", score: 87, platforms: ['tiktok','instagram','linkedin'], tones: ['urgent','casual'], example: "The AI trend everyone will be talking about next year" },
  { id: 'f7', type: 'fear_fomo', template: "Warning: If you're still doing {topic} the old way, watch this", score: 89, platforms: ['youtube','tiktok','instagram'], tones: ['urgent','bold'], example: "Warning: If you're still doing SEO the old way, watch this" },
  { id: 'f8', type: 'fear_fomo', template: 'Most {niche} are sleeping on {topic} right now', score: 85, platforms: ['linkedin','twitter','tiktok'], tones: ['bold','casual'], example: 'Most founders are sleeping on email marketing right now' },
  { id: 'f9', type: 'fear_fomo', template: 'I almost quit {topic} before discovering this', score: 83, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: 'I almost quit YouTube before discovering this' },
  { id: 'f10', type: 'fear_fomo', template: "What nobody warned me about when starting {topic}", score: 82, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: "What nobody warned me about when starting a business" },

  // ── CONTRARIAN (8) ────────────────────────────────────────────────────────
  { id: 'ct1', type: 'contrarian', template: "{topic} is actually terrible. Here's why I still do it", score: 93, platforms: ['tiktok','instagram','youtube'], tones: ['bold','casual'], example: "Waking up at 5am is actually terrible. Here's why I still do it" },
  { id: 'ct2', type: 'contrarian', template: 'Unpopular opinion: {topic} is overrated', score: 91, platforms: ['twitter','linkedin','tiktok'], tones: ['bold','casual'], example: 'Unpopular opinion: productivity culture is overrated' },
  { id: 'ct3', type: 'contrarian', template: "Everything you've been told about {topic} is wrong", score: 90, platforms: ['tiktok','instagram','youtube'], tones: ['bold','urgent'], example: "Everything you've been told about building muscle is wrong" },
  { id: 'ct4', type: 'contrarian', template: "I tried following the {topic} advice. Here's what actually happened", score: 88, platforms: ['tiktok','youtube','instagram'], tones: ['casual','curious'], example: "I tried following the diet advice. Here's what actually happened" },
  { id: 'ct5', type: 'contrarian', template: "Hot take: You don't actually need {topic} to succeed", score: 87, platforms: ['twitter','linkedin','tiktok'], tones: ['bold','casual'], example: "Hot take: You don't actually need a college degree to succeed" },
  { id: 'ct6', type: 'contrarian', template: 'I used to believe in {topic}. I was wrong.', score: 86, platforms: ['linkedin','twitter','instagram'], tones: ['casual','professional'], example: 'I used to believe in working 80-hour weeks. I was wrong.' },
  { id: 'ct7', type: 'contrarian', template: 'Why I quit {topic} after {number} years (and what I do instead)', score: 89, platforms: ['youtube','tiktok','instagram'], tones: ['casual','bold'], example: 'Why I quit Instagram after 5 years (and what I do instead)' },
  { id: 'ct8', type: 'contrarian', template: 'The {topic} advice that almost ruined me', score: 88, platforms: ['tiktok','instagram','youtube'], tones: ['casual','bold'], example: 'The business advice that almost ruined me' },

  // ── PAIN POINT (8) ────────────────────────────────────────────────────────
  { id: 'pp1', type: 'pain_point', template: 'Tired of {topic} not working? Do this instead', score: 88, platforms: ['tiktok','instagram','youtube'], tones: ['casual','urgent'], example: "Tired of your content not getting views? Do this instead" },
  { id: 'pp2', type: 'pain_point', template: 'If {topic} feels impossible right now, you need to hear this', score: 86, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: "If losing weight feels impossible right now, you need to hear this" },
  { id: 'pp3', type: 'pain_point', template: "Why you keep failing at {topic} (it's not your fault)", score: 90, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: "Why you keep failing at saving money (it's not your fault)" },
  { id: 'pp4', type: 'pain_point', template: "Struggling with {topic}? You're probably making this mistake", score: 87, platforms: ['linkedin','twitter','tiktok'], tones: ['professional','casual'], example: "Struggling with cold outreach? You're probably making this mistake" },
  { id: 'pp5', type: 'pain_point', template: 'This fixed my {topic} problem in 24 hours', score: 89, platforms: ['tiktok','instagram','youtube'], tones: ['casual','urgent'], example: 'This fixed my burnout problem in 24 hours' },
  { id: 'pp6', type: 'pain_point', template: 'The real reason {topic} is so hard (and the fix)', score: 85, platforms: ['youtube','linkedin','tiktok'], tones: ['curious','professional'], example: 'The real reason building an audience is so hard (and the fix)' },
  { id: 'pp7', type: 'pain_point', template: 'I spent ${number} on {topic} so you don\'t have to', score: 88, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: "I spent $5000 on courses so you don't have to" },
  { id: 'pp8', type: 'pain_point', template: 'What to do when {topic} feels overwhelming', score: 84, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: 'What to do when entrepreneurship feels overwhelming' },

  // ── HOW-TO (8) ────────────────────────────────────────────────────────────
  { id: 'h1', type: 'how_to', template: 'How I went from 0 to {number} with {topic} in {number} months', score: 91, platforms: ['youtube','tiktok','instagram'], tones: ['casual','bold'], example: 'How I went from 0 to 100k followers with short-form video in 6 months' },
  { id: 'h2', type: 'how_to', template: 'The exact {number}-step process I use for {topic}', score: 88, platforms: ['linkedin','youtube','twitter'], tones: ['professional','casual'], example: 'The exact 5-step process I use for client acquisition' },
  { id: 'h3', type: 'how_to', template: 'How to {topic} without spending a single dollar', score: 87, platforms: ['youtube','tiktok','instagram'], tones: ['casual','bold'], example: 'How to build an audience without spending a single dollar' },
  { id: 'h4', type: 'how_to', template: 'I learned {topic} in {number} days. Here\'s how', score: 89, platforms: ['tiktok','youtube','instagram'], tones: ['casual','bold'], example: "I learned video editing in 30 days. Here's how" },
  { id: 'h5', type: 'how_to', template: 'The fastest way to get results with {topic}', score: 86, platforms: ['tiktok','instagram','youtube'], tones: ['bold','urgent'], example: 'The fastest way to get results with cold email' },
  { id: 'h6', type: 'how_to', template: 'How to do {topic} for free (no experience required)', score: 87, platforms: ['tiktok','instagram','youtube'], tones: ['casual','bold'], example: 'How to start a business for free (no experience required)' },
  { id: 'h7', type: 'how_to', template: '{number} steps to {topic} that actually work', score: 84, platforms: ['linkedin','twitter','youtube'], tones: ['professional','casual'], example: '7 steps to building passive income that actually work' },
  { id: 'h8', type: 'how_to', template: "A beginner's guide to {topic} (everything I wish I knew)", score: 82, platforms: ['youtube','linkedin','twitter'], tones: ['casual','curious'], example: "A beginner's guide to investing (everything I wish I knew)" },

  // ── LIST (6) ──────────────────────────────────────────────────────────────
  { id: 'l1', type: 'list', template: '{number} {topic} secrets that changed my life', score: 87, platforms: ['tiktok','instagram','twitter'], tones: ['bold','casual'], example: '5 money secrets that changed my life' },
  { id: 'l2', type: 'list', template: '{number} things successful {niche} do differently', score: 88, platforms: ['linkedin','twitter','tiktok'], tones: ['professional','curious'], example: '7 things successful founders do differently' },
  { id: 'l3', type: 'list', template: '{number} signs you\'re actually good at {topic}', score: 85, platforms: ['tiktok','instagram','twitter'], tones: ['casual','curious'], example: "10 signs you're actually good at sales" },
  { id: 'l4', type: 'list', template: '{number} {topic} tools I use every single day', score: 84, platforms: ['linkedin','youtube','twitter'], tones: ['professional','casual'], example: '8 productivity tools I use every single day' },
  { id: 'l5', type: 'list', template: 'My {number} biggest {topic} mistakes (so you don\'t repeat them)', score: 86, platforms: ['linkedin','youtube','tiktok'], tones: ['casual','professional'], example: "My 5 biggest business mistakes (so you don't repeat them)" },
  { id: 'l6', type: 'list', template: '{number} habits of people who excel at {topic}', score: 83, platforms: ['linkedin','twitter','instagram'], tones: ['professional','curious'], example: '6 habits of people who excel at content creation' },

  // ── SHOCKING STAT (4) ─────────────────────────────────────────────────────
  { id: 'ss1', type: 'shocking_stat', template: "{number}% of people trying {topic} fail. Here's why", score: 90, platforms: ['tiktok','instagram','youtube'], tones: ['bold','urgent'], example: "95% of people trying to build a YouTube channel fail. Here's why" },
  { id: 'ss2', type: 'shocking_stat', template: 'The average {niche} wastes ${number} on {topic} with zero results', score: 87, platforms: ['linkedin','twitter','tiktok'], tones: ['bold','urgent'], example: 'The average entrepreneur wastes $3000 on ads with zero results' },
  { id: 'ss3', type: 'shocking_stat', template: 'In {number} years, {topic} will look completely different', score: 85, platforms: ['linkedin','youtube','twitter'], tones: ['professional','curious'], example: 'In 5 years, traditional marketing will look completely different' },
  { id: 'ss4', type: 'shocking_stat', template: 'I analyzed {number} viral {topic} posts. Here\'s what I found', score: 91, platforms: ['linkedin','twitter','youtube'], tones: ['professional','curious'], example: "I analyzed 500 viral TikTok posts. Here's what I found" },

  // ── STORY (4) ─────────────────────────────────────────────────────────────
  { id: 'st1', type: 'story', template: '{number} months ago I had nothing. Today {topic} changed everything', score: 89, platforms: ['tiktok','instagram','youtube'], tones: ['casual','bold'], example: '6 months ago I had nothing. Today my content business changed everything' },
  { id: 'st2', type: 'story', template: 'The day I almost gave up on {topic} (and what kept me going)', score: 87, platforms: ['youtube','instagram','tiktok'], tones: ['casual','curious'], example: 'The day I almost gave up on building my audience (and what kept me going)' },
  { id: 'st3', type: 'story', template: 'My honest {topic} journey: the good, bad, and ugly', score: 85, platforms: ['youtube','instagram','linkedin'], tones: ['casual','curious'], example: 'My honest entrepreneurship journey: the good, bad, and ugly' },
  { id: 'st4', type: 'story', template: 'Story time: how {topic} went from my biggest fear to my superpower', score: 86, platforms: ['tiktok','instagram','youtube'], tones: ['casual','curious'], example: 'Story time: how public speaking went from my biggest fear to my superpower' },

  // ── QUESTION (4) ──────────────────────────────────────────────────────────
  { id: 'q1', type: 'question', template: 'Be honest: are you making this {topic} mistake?', score: 88, platforms: ['tiktok','instagram','twitter'], tones: ['casual','bold'], example: 'Be honest: are you making this content mistake?' },
  { id: 'q2', type: 'question', template: 'What would your life look like if {topic} finally worked for you?', score: 85, platforms: ['instagram','youtube','tiktok'], tones: ['casual','curious'], example: 'What would your life look like if your business finally took off?' },
  { id: 'q3', type: 'question', template: 'Can you really make money with {topic} in 2025?', score: 87, platforms: ['youtube','tiktok','instagram'], tones: ['curious','casual'], example: 'Can you really make money with TikTok in 2025?' },
  { id: 'q4', type: 'question', template: "What's actually stopping you from succeeding at {topic}?", score: 84, platforms: ['instagram','linkedin','twitter'], tones: ['casual','professional'], example: "What's actually stopping you from succeeding at fitness?" },

  // ── CHALLENGE (2) ─────────────────────────────────────────────────────────
  { id: 'ch1', type: 'challenge', template: 'Try this {topic} challenge for {number} days and see what happens', score: 86, platforms: ['tiktok','instagram','youtube'], tones: ['casual','urgent'], example: 'Try this social media challenge for 30 days and see what happens' },
  { id: 'ch2', type: 'challenge', template: 'I challenge you to do {topic} for just {number} minutes a day', score: 83, platforms: ['tiktok','instagram'], tones: ['casual','bold'], example: 'I challenge you to do cold outreach for just 20 minutes a day' },
];

export function getTemplates(filters: {
  type?: HookType;
  platform?: Platform;
  tone?: Tone;
}): Template[] {
  return TEMPLATES.filter((t) => {
    if (filters.type && t.type !== filters.type) return false;
    if (filters.platform && filters.platform !== 'general' && !t.platforms.includes(filters.platform)) return false;
    if (filters.tone && !t.tones.includes(filters.tone)) return false;
    return true;
  });
}
