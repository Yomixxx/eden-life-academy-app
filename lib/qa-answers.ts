// Curated Q&A for Eden Life Academy AI Study Assistant
// No API key needed — keyword matching with pastoral answers
// Voice: Senior Pastor Gbenga Ajibola, Eden Life Experience Centre, Lagos

export type QAEntry = {
  keywords: string[]
  question: string
  answer: string
}

export const QA_ENTRIES: QAEntry[] = [
  {
    keywords: ['pray', 'prayer', 'grow in prayer', 'how to pray'],
    question: 'How do I grow in prayer?',
    answer: `Prayer is a conversation, not a performance. You do not need the right words. You need to show up.\n\nStart small. Five minutes in the morning before your phone. Tell God exactly what is on your mind — not what you think you should say. He already knows.\n\nTwo things will build your prayer life faster than anything else: consistency and honesty. Consistent time beats occasional marathon sessions. And honest prayer, even when it is messy or frustrated or confused, connects more deeply than polished words.\n\nJesus taught His disciples to pray in Matthew 6:9-13. It is a short prayer. Read it slowly and let each line become a theme to pray through, not just words to recite.\n\nGrowth Steps covers prayer in more depth. Start there if you have not yet.`,
  },
  {
    keywords: ['bible', 'read bible', 'study bible', 'scripture', 'word of god', 'how to read'],
    question: 'How do I study the Bible?',
    answer: `The goal of Bible study is not information — it is transformation. Keep that in mind when you sit down with it.\n\nA simple method that works: Read. Reflect. Respond.\n\nRead a passage. Not a chapter at a time for the sake of coverage — a few verses at a time, slowly. Reflect: what does this say about God? What does it say about people? Is there something here for me today? Respond: write it down, pray through it, or share it with someone.\n\nIf you do not know where to start, begin with the Gospel of John. It is written so that you understand who Jesus is before anything else.\n\nThe Bible App (YouVersion) has reading plans that help if you struggle with consistency. But the best plan is the one you actually do.`,
  },
  {
    keywords: ['salvation', 'saved', 'born again', 'accept jesus', 'become christian'],
    question: 'How do I get saved?',
    answer: `Salvation is not complicated. That is by design.\n\nRomans 10:9 (NIV) says: "If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved."\n\nIt is a decision of the heart, not a ritual. Believe that Jesus died for your sins and rose again. Turn from living for yourself and turn toward Him. Tell Him.\n\nIf you want to pray right now: "Jesus, I believe You are the Son of God. I believe You died for my sins and rose again. I turn from my old life and I choose to follow You. Come into my life. Amen."\n\nThat prayer, prayed sincerely, is enough. What comes after that — reading Scripture, joining a church community, being baptised — those are how you grow. But they are not the condition for salvation.\n\nWe would love to walk this journey with you at Eden Life. Connect with us on Sunday.`,
  },
  {
    keywords: ['faith', 'doubt', 'struggling', 'difficult', 'hard time', 'crisis'],
    question: 'What do I do when my faith feels weak?',
    answer: `Doubt is not the opposite of faith. Acting despite doubt is one of the most honest expressions of faith there is.\n\nEvery person in Scripture who was used significantly went through seasons of uncertainty. Abraham. Moses. David. Even John the Baptist, from prison, sent messengers to ask Jesus: "Are you the one, or should we look for someone else?" (Matthew 11:3)\n\nWhen your faith feels weak, do not perform. Do not pretend. Go to God exactly as you are. Tell Him what you are feeling. Then do the next small thing: open your Bible to one Psalm, pray one sentence, call one person from your church.\n\nFaith is built in the valley, not the highlight reel. The valley is not a sign something went wrong. It is often where the deepest work happens.\n\nIf you are going through a difficult season, please reach out to our pastoral team. You do not have to carry this alone.`,
  },
  {
    keywords: ['tithe', 'giving', 'offering', 'money', 'finances', 'stewardship'],
    question: 'What does the Bible say about giving?',
    answer: `Giving is one of the clearest indicators of where your heart is. Jesus said in Matthew 6:21: "For where your treasure is, there your heart will be also."\n\nTithing — giving 10% of your income — is the biblical foundation (Malachi 3:10). But the New Testament frames giving beyond a percentage. In 2 Corinthians 9:7 (NIV): "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."\n\nThe principle is this: give first, give regularly, give willingly. It is not about the amount — it is about trust. Giving is an act of faith that says you believe God is your provider, not your salary.\n\nIf you are new to this or in a difficult financial season, start somewhere. Even 1% given consistently is a step of obedience that God honours. Grow from there.`,
  },
  {
    keywords: ['church', 'why church', 'fellowship', 'community', 'attend', 'sunday'],
    question: 'Why should I attend church?',
    answer: `Christianity was never designed to be a solo journey. Hebrews 10:25 (NIV) says: "Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another."\n\nChurch is not just a place you go to receive. It is a community you are part of — where you encourage others, serve, grow in accountability, and experience things you simply cannot access alone: communion, corporate worship, pastoral care, the diversity of the body of Christ.\n\nThe analogy in Scripture is a body. Every part matters. When you are absent from your local church consistently, you are not just missing out — the community is missing a part it needs.\n\nAt Eden Life Experience Centre, we have campuses on Mainland (Ogudu) and Island (Ajah), and an Online Church for those who cannot be physically present. There is a home for you here.`,
  },
  {
    keywords: ['holy spirit', 'spirit', 'baptism of the spirit', 'gifts', 'speaking in tongues'],
    question: 'Who is the Holy Spirit?',
    answer: `The Holy Spirit is not an experience or a feeling — He is a person. The third person of the Trinity.\n\nJesus described Him in John 14:26 (NIV) as "the Advocate, the Holy Spirit, whom the Father will send in my name, who will teach you all things."\n\nThe Holy Spirit lives inside every believer from the moment of salvation (Romans 8:9). His work includes: guiding you into truth, convicting you of sin, producing fruit in your character (Galatians 5:22-23), and empowering you to live for God.\n\nThe gifts of the Spirit — listed in 1 Corinthians 12 and Romans 12 — are given by the Spirit as He determines, for the benefit of the whole church. They are not status symbols. They are tools for serving others.\n\nIf you want to grow in understanding of the Holy Spirit, this is a topic we go deeper on in our courses. Check the course catalog.`,
  },
  {
    keywords: ['sin', 'forgiveness', 'confess', 'repent', 'guilty', 'shame'],
    question: 'How do I receive forgiveness for sin?',
    answer: `1 John 1:9 (NIV) is one of the most important verses for this: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."\n\nForgiveness is not earned. It is received. The work was done at the cross. Your part is confession — agreeing with God that what you did was wrong — and receiving what He already offers.\n\nShame tells you that you have to earn your way back. Grace says the door is already open. Walk through it.\n\nRepentance is more than feeling bad. It is a turning — a decision to go a different direction. You may need to make amends with someone. You may need to remove something from your life. Do not let the discomfort of repentance keep you from the freedom that comes after it.\n\nIf you are carrying something heavy, please speak to a pastor. Some things are heavier than they need to be because they were never brought into the light.`,
  },
  {
    keywords: ['purpose', 'calling', 'destiny', 'what am i called to', 'gifts', 'ministry'],
    question: 'How do I find my purpose?',
    answer: `Purpose is discovered in motion, not waiting.\n\nEphesians 2:10 (NIV) says: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do."\n\nYou were made for something specific. But purpose is rarely revealed all at once. It is usually uncovered step by step as you are faithful with what is in front of you.\n\nThree questions that help: What breaks your heart? What do you do well without much effort? Where have you seen God use you to affect others? The intersection of those three is often close to your calling.\n\nServing in your local church is one of the fastest ways to discover your gifts. You find out what you are built for by doing, not just thinking.\n\nGrowth Steps is designed partly to help you answer this question. If you have not started it yet, that is your next step.`,
  },
  {
    keywords: ['worship', 'how to worship', 'praise'],
    question: 'What is true worship?',
    answer: `Worship is not a music style. It is a posture of the heart.\n\nJesus said in John 4:24 (NIV): "God is spirit, and his worshipers must worship in the Spirit and in truth."\n\nTrue worship happens when your understanding of who God is produces a response from the inside out. That can happen in a church service with hundreds of people singing. It can also happen in silence at 6am, or in the middle of a difficult day when you choose to trust Him anyway.\n\nSunday worship services at Eden Life are designed to create a space for that encounter. But the goal is that what you experience on Sunday shapes how you live Monday through Saturday.\n\nDo not reduce worship to a feeling. On days when the feeling is not there, worship is a choice — and it is still real.`,
  },
  {
    keywords: ['growth steps', 'first course', 'where do i start', 'new here', 'just joined', 'beginner'],
    question: 'Where do I start on Eden Life Academy?',
    answer: `Start with Growth Steps. It is the first course every Eden Life member goes through, and it is already enrolled for you.\n\nGrowth Steps covers the foundations: who you are in Christ, how to read your Bible, how to pray, how to connect with your church community, and how to take your next step.\n\nIt does not assume you have been a Christian for years. It meets you where you are.\n\nAfter Growth Steps, explore the full course catalog. You will find deeper teaching on Scripture, leadership, family, faith, and more.\n\nThe best next step is the one you actually take. Open Growth Steps today.`,
  },
  {
    keywords: ['baptism', 'water baptism', 'should i be baptized', 'christening'],
    question: 'What is baptism and should I do it?',
    answer: `Baptism is an outward declaration of an inward decision. It does not save you — salvation is by faith (Ephesians 2:8-9). But it is an act of obedience that Jesus commanded (Matthew 28:19) and that every believer in the New Testament went through.\n\nGoing under the water represents dying to your old life. Coming up represents being raised to new life in Christ (Romans 6:4). It is a public statement: I belong to Jesus.\n\nIf you have genuinely given your life to Christ but have not been baptised, you should be. Not because you have to, but because it is the right next step.\n\nSpeak to our pastoral team at Eden Life and we will walk you through it. We hold baptism services regularly.`,
  },
]

export function findAnswer(query: string): QAEntry | null {
  const q = query.toLowerCase()
  let best: QAEntry | null = null
  let bestScore = 0

  for (const entry of QA_ENTRIES) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.split(' ').length // longer matches score higher
    }
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return bestScore > 0 ? best : null
}

export const FALLBACK_ANSWER = `That is a good question. I do not have a specific answer prepared for it yet, but here are a few things that will help:\n\n1. Bring it to God directly in prayer. He is not distant from your questions.\n2. Search for related passages in your Bible using a concordance or Bible app.\n3. Speak to a pastor or elder at Eden Life — no question is too small.\n\nYou can also explore our course catalog. Many questions about faith, Scripture, and Christian living are covered in depth there.\n\nWe will keep adding to this study assistant over time. Check back.`
