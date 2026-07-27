// Curated verse + reflection pairs for the daily devotion email. Rotates by
// day count rather than calling a paid AI API on every send — free, and
// deterministic so the same day never repeats until the whole bank cycles.
// Scripture text is quoted from the public-domain World English Bible.
export interface DevotionBankEntry {
  scripture_reference: string;
  scripture_text: string;
  body: string;
}

export const DEVOTION_BANK: DevotionBankEntry[] = [
  {
    scripture_reference: 'Psalm 46:1',
    scripture_text: 'God is our refuge and strength, a very present help in trouble.',
    body: 'Beloved, whatever trouble met you at the door this morning, you do not face it alone. God is not a distant help arriving after the storm — He is present in the middle of it. Father, be our refuge today; let our strength rise from Your nearness, not our circumstances.',
  },
  {
    scripture_reference: 'Isaiah 41:10',
    scripture_text: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.',
    body: 'Beloved, fear loses its grip the moment we remember whose hand is holding us. God does not merely stand beside you today — He upholds you. Father, we release every anxious thought and receive Your strength as our own.',
  },
  {
    scripture_reference: 'Jeremiah 29:11',
    scripture_text: '“For I know the thoughts that I think toward you,” says Yahweh, “thoughts of peace, and not of evil, to give you hope and a future.”',
    body: 'Beloved, before this day held any plans of its own, God had already thought of you in peace. Nothing you’re walking through today is outside that intention. Father, let today be one more brick in the future You already have hope written into.',
  },
  {
    scripture_reference: 'Psalm 23:1',
    scripture_text: 'Yahweh is my shepherd: I shall lack nothing.',
    body: 'Beloved, a shepherd does not merely lead from a distance — he walks the same ground his sheep walk. Wherever today takes you, God has already gone ahead. Father, teach us to trust Your provision instead of striving for our own.',
  },
  {
    scripture_reference: 'Philippians 4:6-7',
    scripture_text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts.',
    body: 'Beloved, anxiety asks you to carry tomorrow today; prayer hands it back to the One who already holds it. Bring your list to Him this morning, out loud if you have to. Father, guard our hearts with a peace our circumstances cannot explain.',
  },
  {
    scripture_reference: 'Joshua 1:9',
    scripture_text: 'Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.',
    body: 'Beloved, courage was never meant to come from confidence in yourself — it comes from certainty about who goes with you. Wherever today sends you, He is already there. Father, let Your presence be the reason we move forward unafraid.',
  },
  {
    scripture_reference: 'Romans 8:28',
    scripture_text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.',
    body: 'Beloved, this promise doesn’t say every single thing feels good — it says God is weaving all of it toward good. Trust the Weaver even when you can’t yet see the pattern. Father, let us rest today in Your purpose rather than our own explanations.',
  },
  {
    scripture_reference: 'Proverbs 3:5-6',
    scripture_text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight.',
    body: 'Beloved, some of today’s decisions will be too big for your own understanding to carry alone — that’s by design. Bring them to Him before you lean on yourself. Father, straighten the path we cannot yet see the end of.',
  },
  {
    scripture_reference: 'Lamentations 3:22-23',
    scripture_text: 'It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning: great is your faithfulness.',
    body: 'Beloved, whatever yesterday cost you, this morning is not a continuation of it — it’s a fresh mercy. God’s faithfulness didn’t run out overnight. Father, thank You for a compassion that renews before we even ask for it.',
  },
  {
    scripture_reference: 'Matthew 11:28',
    scripture_text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.',
    body: 'Beloved, rest is not a reward you earn after the burden is gone — it’s an invitation to bring the burden to Him as it is. He is not waiting for you to figure it out first. Father, we come to You tired and unfinished; give us rest today.',
  },
  {
    scripture_reference: 'Deuteronomy 31:8',
    scripture_text: 'Yahweh himself who goes before you will be with you. He will not fail you nor forsake you. Don’t be afraid. Don’t be discouraged.',
    body: 'Beloved, discouragement often comes from feeling like you’re walking into today first, alone. You’re not — He’s already ahead of you. Father, let the assurance of Your presence dissolve today’s discouragement before it takes root.',
  },
  {
    scripture_reference: '2 Corinthians 12:9',
    scripture_text: 'He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.”',
    body: 'Beloved, the parts of you that feel too weak for today are exactly where God’s power intends to show up. You don’t need to hide your weakness from Him — bring it to Him. Father, let Your strength be seen most clearly where we feel least capable.',
  },
  {
    scripture_reference: 'Psalm 34:18',
    scripture_text: 'Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit.',
    body: 'Beloved, if your heart feels heavy this morning, you are not further from God’s reach — you are near the place He draws closest. He does not wait for the wound to heal before showing up. Father, meet us in the broken places today.',
  },
  {
    scripture_reference: 'Isaiah 40:31',
    scripture_text: 'But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.',
    body: 'Beloved, waiting on God is not wasted time — it’s where strength is renewed for what’s ahead. If today calls for endurance more than speed, that’s still His strength at work. Father, renew us today, however the day requires it.',
  },
  {
    scripture_reference: 'John 14:27',
    scripture_text: '“Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don’t let your heart be troubled, neither let it be fearful.”',
    body: 'Beloved, the peace being offered to you today isn’t the world’s version — circumstantial and fragile. It’s a peace given to hold even when circumstances don’t cooperate. Father, let this peace guard our hearts against today’s troubles.',
  },
  {
    scripture_reference: 'Zephaniah 3:17',
    scripture_text: 'Yahweh, your God, is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.',
    body: 'Beloved, before you’ve done anything today to earn it, God is already rejoicing over you. Let that truth settle before the day’s demands do. Father, calm us in Your love the way only You can.',
  },
  {
    scripture_reference: 'Habakkuk 3:19',
    scripture_text: 'Yahweh, the Lord, is my strength. He makes my feet like deer’s feet, and enables me to go in high places.',
    body: 'Beloved, the ground today may be uneven, but your footing doesn’t depend on the terrain — it depends on the One steadying your steps. Father, give us sure footing over whatever high or uncertain places this day holds.',
  },
  {
    scripture_reference: 'Psalm 121:1-2',
    scripture_text: 'I will lift up my eyes to the hills. Where does my help come from? My help comes from Yahweh, who made heaven and earth.',
    body: 'Beloved, when the day’s demands feel bigger than you, lift your eyes higher than the problem. Help was never meant to come from your own resourcefulness alone. Father, remind us today where our help actually comes from.',
  },
  {
    scripture_reference: 'Ephesians 2:10',
    scripture_text: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.',
    body: 'Beloved, you are not improvising your way through life — there is good work today that was prepared for you before you woke up. Father, let us walk in what You’ve already set before us, with confidence instead of striving.',
  },
  {
    scripture_reference: 'Colossians 3:23',
    scripture_text: 'And whatever you do, work heartily, as for the Lord, and not for men.',
    body: 'Beloved, whatever today’s tasks look like — ordinary or overlooked — they are seen by God even when no one else notices. Let that be enough motivation. Father, let our work today be an offering to You, not a performance for anyone else.',
  },
  {
    scripture_reference: 'James 1:5',
    scripture_text: 'But if any of you lacks wisdom, let him ask God, who gives to all liberally and without reproach; and it will be given to him.',
    body: 'Beloved, if today’s decisions feel beyond you, wisdom is not something you have to manufacture on your own — it’s something you’re invited to ask for. Father, give us wisdom today, freely as You’ve promised, for whatever we don’t yet know how to handle.',
  },
  {
    scripture_reference: '1 Peter 5:7',
    scripture_text: 'Casting all your worries on him, because he cares for you.',
    body: 'Beloved, the weight you’ve been carrying alone was never meant to stay on your shoulders. He is not indifferent to what worries you. Father, we hand over today’s anxieties, trusting that You care enough to hold them.',
  },
  {
    scripture_reference: 'Psalm 90:14',
    scripture_text: 'Satisfy us in the morning with your loving kindness, that we may rejoice and be glad all our days.',
    body: 'Beloved, joy for the rest of the day is often decided in the first few quiet minutes of it. Let this morning be satisfied in Him before anything else competes for your attention. Father, let Your loving kindness set the tone for everything that follows today.',
  },
  {
    scripture_reference: 'Isaiah 26:3',
    scripture_text: 'You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you.',
    body: 'Beloved, a steady mind isn’t the absence of a busy day — it’s the presence of fixed trust in the middle of it. Wherever your thoughts wander today, bring them back to Him. Father, keep our minds steadfast, anchored in trust rather than circumstance.',
  },
  {
    scripture_reference: 'Nehemiah 8:10',
    scripture_text: 'Then he said to them, “...for the joy of Yahweh is your strength.”',
    body: 'Beloved, joy is not a reward for a good day — it is the strength that carries you through a hard one. Don’t wait for today’s circumstances to earn your joy. Father, let Your joy be the strength we draw from before the day gives us any reason to.',
  },
  {
    scripture_reference: 'Romans 12:2',
    scripture_text: 'Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God.',
    body: 'Beloved, the world will hand you its patterns for how to think about today before you’ve even had coffee. Let your mind be renewed before it’s shaped by everything else. Father, transform how we think today, so we see this day the way You do.',
  },
  {
    scripture_reference: 'Psalm 143:8',
    scripture_text: 'Cause me to hear your loving kindness in the morning, for I trust in you. Cause me to know the way in which I should walk, for I lift up my soul to you.',
    body: 'Beloved, before you know the shape of today’s path, you can know the voice leading you down it. Ask Him to speak before you assume you’re walking alone. Father, let us hear Your loving kindness clearly this morning, and show us the way as we lift our souls to You.',
  },
  {
    scripture_reference: '2 Timothy 1:7',
    scripture_text: 'For God didn’t give us a spirit of fear, but of power, love, and self-control.',
    body: 'Beloved, if fear showed up before your feet even hit the floor this morning, it did not come from Him. What He gave you is power, love, and a steady mind. Father, remind us which spirit is actually ours today.',
  },
  {
    scripture_reference: 'Psalm 16:11',
    scripture_text: 'You will show me the path of life. In your presence is fullness of joy. In your right hand there are pleasures forever more.',
    body: 'Beloved, fullness of joy isn’t found further down the road — it’s found in His presence right now, today, wherever you are. Father, let us recognize Your presence in the middle of this ordinary day, not just in the extraordinary ones.',
  },
  {
    scripture_reference: 'Galatians 6:9',
    scripture_text: 'Let us not be weary in doing good, for we will reap in due season, if we don’t give up.',
    body: 'Beloved, if today feels like the same faithful work with no visible harvest yet, the season hasn’t ended — it’s still growing. Don’t let today be the day you give up right before it turns. Father, renew our strength to keep doing good, trusting Your timing over our own.',
  },
];
