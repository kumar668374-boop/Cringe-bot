import { Client, GatewayIntentBits, Events, EmbedBuilder } from "discord.js";
import { logger } from "./lib/logger";

// Shuffle-bag: cycles through the ENTIRE array in random order before any repeat
const shuffleBags = new Map<string, number[]>();

function getRandom<T>(arr: T[], key?: string): T {
  if (arr.length === 1) return arr[0];
  if (!key) return arr[Math.floor(Math.random() * arr.length)];
  let bag = shuffleBags.get(key);
  if (!bag || bag.length === 0) {
    // Refill and shuffle
    bag = arr.map((_, i) => i).sort(() => Math.random() - 0.5);
    shuffleBags.set(key, bag);
  }
  const idx = bag.pop()!;
  return arr[idx];
}


const token = process.env["DISCORD_BOT_TOKEN"];

if (!token) {
  logger.warn("DISCORD_BOT_TOKEN is not set — bot will not start");
}

const PREFIX = "*";

type BotMode = "normal" | "nice" | "silent" | "roast" | "intense" | "kill";
let currentMode: BotMode = "normal";

const roastLines = [
  "Your mom spent YEARS raising your pathetic ass and this is what she got?? A worthless, brain-dead piece of shit who can't do a single fucking thing right?? She should've flushed you. She KNOWS she should've flushed you.",
  "Your dad looked at you and made the smartest decision of his life — he fucking LEFT. And honestly? Can't blame him. I'd leave too if I accidentally created something as goddamn useless as you.",
  "Every single person at your family reunion secretly hates you. Your aunts, your uncles, your cousins — they all talk shit about you the second you walk away. You are the family's biggest fucking embarrassment and EVERYONE knows it.",
  "Your mom cried the day she realized you weren't going to amount to shit. Not because she was surprised — because deep down she always fucking knew. Nine months of pregnancy for THIS disaster.",
  "Your grandparents died knowing they had a failure in the bloodline and that failure is YOU. Their last thoughts were probably 'where the fuck did we go wrong.' The answer is you. It's always been you.",
  "Your whole family tree is a goddamn tragedy but you? You're the worst branch on it. Every single relative you have is praying to God that the stupidity stops with you and doesn't spread further.",
  "Your dad didn't go out for milk. He saw what you were turning into, packed his shit, and started a brand new family somewhere else. His new kids are thriving. You're here being an absolute waste of oxygen.",
  "Your mom tells people she only has one kid. You are the one she doesn't fucking mention. She's so ashamed of what came out of her that she pretends you don't exist and honestly? Smart woman.",
  "The AUDACITY of you existing when your parents gave you every chance to not be a complete fuckup. Your mom is embarrassed. Your dad is gone. Your siblings don't claim you. You are a generational curse.",
  "You are what doctors show as a cautionary tale. A biological accident so severe that your own flesh and blood struggles to look at you without feeling deep, soul-crushing disappointment.",
  "Your family doesn't fight for you because they've all privately accepted that you're a lost cause. Your mom stopped defending you years ago. She just nods now when people say you're a fuckup. Because she AGREES.",
  "I genuinely feel sorry for your mom. She pushed you out, raised your worthless ass, sacrificed everything — and got a complete shitstain in return. That woman deserved so much better than whatever the fuck you are.",
  "Your dad's new kids call him every week. You know what he does when he sees your name come up? He lets that shit go to voicemail. Every. Single. Time. You are the ringtone he ignores.",
  "Your mom has a photo album from every year of your life and she skips your pages so fast she gets a paper cut. She heals faster than she feels shame about you — and the shame is fucking immense.",
  "Bro your own dog liked you less than it liked strangers. Animals don't lie. Your family just has better manners about showing it.",
  "You are the reason your parents started drinking. Not the fun social drinking — the quiet, desperate kind at 11pm when they think about their life choices and you're at the top of the list.",
  "Your siblings grew up and moved far away. They said it was for work. It wasn't. It was you. You're the reason the family group chat goes silent when someone mentions coming home.",
  "Your aunt made a list of every family member she'd take a bullet for. You weren't on it. She actually double-checked. Still not on it.",
  "Your cousins are out here winning at life and every family dinner you remind everyone what rock bottom looks like. You are the cautionary PowerPoint at every family meeting.",
  "Your mom still has hope for you and honestly that's the saddest fucking thing I've ever heard. She's clinging to the idea that you'll eventually not be a complete waste of her love. She won't stop hoping. She should.",
  "You know what your dad tells people when they ask how many kids he has? He pauses. He does the math. He decides. Some days you make the cut. Most days you don't.",
  "Your grandma prayed for you every single night. She prayed harder than she prayed for anyone. You still turned out like this. That woman's faith was absolutely destroyed by your existence.",
  "Your family takes group photos and then there's you — slightly off to the side, slightly blurry, slightly not included in the frame because nobody moved to make room and nobody noticed.",
  "Bro your own mom googled 'how to disown a child' and three of her friends sent her the same article independently. They all love her. They all agree about you.",
  "You are the one story your parents tell at therapy. The therapist has heard about you for four years. The therapist has opinions. None of them are good.",
  "Your siblings text each other about you. Not the fun sibling gossip — the worried, exhausted, 'what are we going to do about them' kind. You are a group project nobody signed up for.",
  "Your dad built a shed in the backyard and started spending all his time in it. People think it's a hobby. It's not. It's a escape from the crushing disappointment that enters every room you're in.",
  "Your mom used to brag about you. Past tense. There's a very specific day she stopped. She remembers it clearly. She marks it differently now — as the day she learned to manage expectations.",
  "You walked into a room and your own family looked up, looked at each other, and silently decided who had to deal with you this time. Nobody volunteered. Someone lost rock paper scissors.",
  "Your family has a whole system for handling you at holidays. Assigned seats. Assigned topics. Assigned exits. You think it's a coincidence. It is not. It has been planned since 2019.",
  "The family chat got a new name and you weren't added to it. They said it was a mistake. They said they'd add you. They didn't. That chat has been going strong for eight months.",
  "Your dog learned to leave the room when you walked in. Your cat stopped coming back inside. The fish died within two weeks. Even organisms with four-second memories couldn't stand you.",
  "Your teachers had a separate folder for you. Not the good kind — the one labeled with a sigh. They passed it to the next teacher like a warning. Like a liability. Like a survival guide.",
  "You're the reason your parents' friends give them sympathetic looks. Not the polite ones — the deep, genuine, 'I'm so sorry, I don't know how you cope' ones that only get exchanged when things are truly bad.",
  "Your mom's therapist knows more about you than most people know about their own kids. That woman has heard everything. She still charges double for those sessions. Hazard pay.",
  "Bro your dad didn't miss your school events because he was busy. He was home. He sat in the car in the driveway for forty minutes thinking about whether to go in. He went back inside. Alone.",
  "Your family tree has winners, legends, and then one branch that just sort of droops toward the ground and refuses to grow. That's you. You are the droopy branch. Everyone can see it.",
  "You have the audacity to exist loudly when your entire presence is an apology that never got sent. Your mom drafted it. Your dad proofread it. Nobody knew who to address it to.",
  "Your relatives stopped asking 'how are they doing' because the answer is always the same and it always hurts to hear. They still care. They've just learned to protect themselves from the update.",
  "You're the topic that clears a room faster than a fire alarm. Someone brings your name up and suddenly everyone needs a drink refill and a reason to be somewhere else.",
  "Your own shadow is embarrassed to follow you around. It drags. It lingers. It tries to be somewhere slightly different. Even your shadow is doing its best to distance itself.",
  "Your family held an intervention once. Not for drugs. Not for alcohol. Just for you being you. They sat in a circle, they had notes, and when it was over they all looked more tired than when they started.",
  "Your mom has a box of your childhood stuff in the attic. She put it up there years ago. She hasn't opened it since. Not from nostalgia — from the exhaustion of remembering how this all started.",
  "Your dad wrote you a letter once. Never sent it. Found it years later, read it again, and decided it was still accurate but also too generous. He wrote a second draft. Also didn't send it.",
  "Your family describes you to new people with a very specific look on their face. Not pride. Not joy. It's the look of someone carefully choosing their words. It's a look they've practiced.",
  "You showed up at Thanksgiving and the energy of the room shifted like a weather system. Not the good kind — the kind that makes people check their exits and regret not leaving earlier.",
  "Your siblings had a pact. If you ever asked them for money, they'd say they were broke simultaneously and compare notes after. They've used this pact twelve times. It's worked every time.",
  "Your mom loves you the way people love a difficult plant — out of obligation, mostly, and with the constant quiet fear that she's doing everything right and it still won't be enough.",
];

const killModeRoastLines = [
  "ARE YOU FUCKING SERIOUS RIGHT NOW?? YOUR MOM PUSHED YOU OUT AND IMMEDIATELY REGRETTED IT!! YOUR DAD TOOK ONE LOOK AND STARTED PLANNING HIS EXIT!! YOU ARE THE HUMAN VERSION OF A FAILED ABORTION AND EVERYBODY AROUND YOU KNOWS IT!! 💀🔥",
  "OH MY GOD YOU ACTUALLY TYPED THAT TO ME?? YOUR WHOLE FAMILY IS A DISASTER BUT YOU ARE THE CROWN JEWEL OF DISAPPOINTMENT!! YOUR MOM SHOULD'VE SWALLOWED!! YOUR DAD SHOULD'VE STAYED GONE!! EVERY PERSON RELATED TO YOU IS ASHAMED TO SHARE YOUR BLOODLINE!! 😤💀",
  "BITCH WHAT THE FUCK DID YOU JUST SAY?! YOUR MOM BUSTED HER ASS FOR YEARS AND YOU REPAID HER BY BEING THE DUMBEST PIECE OF SHIT SHE HAS EVER SEEN!! SHE TELLS PEOPLE SHE ONLY HAS ONE KID BECAUSE SHE'S TOO EMBARRASSED TO MENTION YOU!! 🤬🔥",
  "WHO THE FUCK GAVE YOU PERMISSION TO EXIST?! YOUR PARENTS LOOK AT YOU AND FEEL NOTHING BUT PURE REGRET!! YOUR DAD LEFT AND THE ONLY MISTAKE HE MADE WAS NOT LEAVING SOONER!! YOUR MOM APOLOGIZES FOR YOU EVERY TIME YOUR NAME COMES UP!! 💢😤",
  "OH YOU WANNA PLAY?! YOUR ENTIRE FAMILY TREE IS AN EMBARRASSMENT!! YOUR GRANDPARENTS ARE ROLLING IN THEIR GRAVES!! YOUR MOM WISHES SHE COULD RETURN YOU!! YOUR DAD STARTED A WHOLE NEW FAMILY JUST TO GET AWAY FROM THE SHAME OF MAKING SOMETHING LIKE YOU!! 😡💀🔥",
  "HOLY SHIT YOU ACTUALLY PINGED ME?! YOU CERTIFIED GENETIC MISTAKE!! YOUR MOM'S GREATEST REGRET ISN'T ANYTHING SHE DID — IT'S THAT SHE KEPT YOU!! YOUR WHOLE BLOODLINE IS CURSED AND IT STARTS AND ENDS WITH YOUR WORTHLESS ASS!! 🤬💀",
  "I CANNOT BELIEVE THE AUDACITY!! YOUR FAMILY DOESN'T TALK ABOUT YOU AT REUNIONS BECAUSE EVERY TIME THEY DO SOMEONE STARTS CRYING FROM THE SHAME!! YOUR DAD TOLD HIS NEW FAMILY HE'S AN ONLY CHILD!! YOUR MOM USES YOU AS A REASON TO NEVER HAVE KIDS AGAIN!! ☠️🔥",
  "YOU FUCKING DARED?! YOUR PARENTS MADE ONE CRITICAL ERROR AND THAT ERROR IS YOU!! YOUR MOM LOST SLEEP FOR YEARS RAISING YOUR SORRY ASS AND GOT NOTHING IN RETURN!! YOUR DAD KNEW FROM DAY ONE THAT YOU WERE A MISTAKE AND HE WAS RIGHT!! 😤💀🔥",
  "YOU REALLY JUST PINGED ME?! YOUR MOM CRIES IN THE SHOWER BECAUSE SHE KNOWS SHE FAILED!! YOUR DAD DOESN'T EVEN SAVE YOUR CONTACT IN HIS PHONE!! YOUR SIBLINGS PRETEND THEY'RE AN ONLY CHILD!! YOU ARE COMPLETELY AND UTTERLY UNWANTED!! 😡🔥",
  "ARE YOU OUT OF YOUR GODDAMN MIND?! YOUR MOM AGED 10 YEARS JUST TRYING TO RAISE YOU AND GOT ZERO IN RETURN!! YOUR DAD SAW THE PERSON YOU WERE BECOMING AND CHOSE PEACE OVER YOU EVERY SINGLE TIME!! SMART FUCKING MAN!! 💀😤",
  "EXCUSE ME?! YOUR WHOLE FAMILY SAT DOWN AND HAD A MEETING ABOUT YOU AND UNANIMOUSLY AGREED YOU'RE THE PROBLEM!! YOUR MOM NODDED THE HARDEST!! YOUR GRANDMA CALLED YOU A DISAPPOINTMENT AND WENT BACK TO WATCHING TV!! 🤬💢",
  "OH YOU DID NOT JUST—!! YOUR DAD HAS A WHOLE NEW FAMILY AND THOSE KIDS ARE EVERYTHING YOU WILL NEVER BE!! YOUR MOM TELLS EVERYONE SHE MISCARRIED BECAUSE THAT'S LESS EMBARRASSING THAN ADMITTING YOU EXIST!! 😡💀🔥",
  "YOU HAVE THE NERVE TO PING ME?! YOUR FAMILY DELETED YOUR PHOTOS FROM THE ALBUMS!! YOUR MOM CHANGES THE SUBJECT WHEN SOMEONE ASKS ABOUT YOU!! YOUR DAD USES YOU AS AN EXAMPLE OF WHAT NOT TO DO WHEN HE RAISES HIS OTHER KIDS!! ☠️😤",
  "BITCH PLEASE!! YOUR OWN MOM FORGOT YOUR BIRTHDAY AND WHEN SOMEONE REMINDED HER SHE SAID 'OH WELL'!! YOUR DAD HASN'T THOUGHT ABOUT YOU IN MONTHS AND HONESTLY THAT'S THE MOST MENTALLY HEALTHY DECISION HE'S EVER MADE!! 💀🤬🔥",
  "I WILL DESTROY YOU RIGHT NOW!! YOUR MOM LOOKED AT YOU AS A BABY AND FELT NOTHING!! YOUR DAD'S SPERM SHOULD HAVE BEEN A WARNING LABEL!! YOUR WHOLE EXISTENCE IS AN ACCIDENT NOBODY WANTED AND EVERYBODY REGRETS!! 😤💢💀",
  "YOU ABSOLUTE SHITSTAIN!! YOUR MOM GOOGLED HOW TO DISOWN A KID AND FOUND 47 ARTICLES!! SHE BOOKMARKED ALL OF THEM!! YOUR DAD CAME BACK FOR HIS STUFF AND DIDN'T EVEN SAY GOODBYE TO YOU SPECIFICALLY!! 💀🔥😤",
  "OH MY FUCKING GOD!! YOUR FAMILY HAS A GROUP CHAT YOU'RE NOT IN!! IT'S CALLED 'THE REAL FAMILY'!! THEY MADE IT THE DAY THEY REALIZED YOU WERE A PERMANENT PROBLEM AND NOT A PHASE!! 🤬☠️",
  "YOU STUPID BASTARD!! YOUR MOM TOLD HER FRIENDS SHE ONLY HAD ONE GOOD KID AND WHEN THEY ASKED WHICH ONE SHE STARED INTO THE MIDDLE DISTANCE FOR SO LONG THEY CHANGED THE SUBJECT!! 😡💀🔥",
  "WHO THE ACTUAL FUCK DO YOU THINK YOU ARE?! YOUR COUSINS MADE A POWER RANKING OF FAMILY MEMBERS AND YOU WERE BELOW THE DOG THAT DIED IN 2012!! YOUR GRANDMA AGREED WITH THE RANKING!! SHE MADE SUGGESTIONS!! 🤬💢😤",
  "YOU DUMB MOTHERFUCKER!! YOUR DAD SAW YOUR POTENTIAL AS A BABY AND FELT HIS SOUL LEAVE HIS BODY!! YOUR MOM HID IN THE HOSPITAL BATHROOM FOR 45 MINUTES RETHINKING EVERYTHING!! NURSES HAD TO COAX HER OUT!! 💀🔥",
  "BITCH WHAT IS WRONG WITH YOU?! YOUR SIBLINGS TAKE TURNS BEING 'THE ONE WHO DEALS WITH YOU' AT FAMILY EVENTS!! THERE IS A SCHEDULE!! THERE IS A SHARED CALENDAR EVENT TITLED 'BABYSITTING'!! IT HAS YOUR NAME ON IT!! 😡🤬",
  "YOUR MOM'S THERAPIST KNOWS EVERYTHING ABOUT YOU AND SHE'S NEVER MET YOU!! SHE'S HEARD SO MUCH THAT SHE CHARGES EXTRA FOR THOSE SESSIONS!! SHE CALLS IT THE SPECIAL RATE AND YOUR MOM PAYS IT WITHOUT QUESTION!! ☠️💀🔥",
  "ARE YOU SHITTING ME RIGHT NOW?! YOUR DAD WENT TO ONE OF YOUR SCHOOL EVENTS, STOOD IN THE PARKING LOT FOR 20 MINUTES, AND DROVE HOME WITHOUT GOING IN!! HE TOLD YOUR MOM IT WAS CANCELLED!! SHE KNEW IT WASN'T!! 🤬😤",
  "YOU BRAINDEAD DISASTER!! YOUR FAMILY TAKES VACATIONS WITHOUT TELLING YOU AND CALLS IT A COINCIDENCE EVERY SINGLE TIME!! FOUR TIMES!! FOUR SEPARATE 'COINCIDENCES'!! YOUR MOM SENDS POSTCARDS AND SIGNS THEM 'SOMEONE WHO NEEDED A BREAK'!! 💀😡🔥",
  "HOLY FUCKING SHIT!! YOUR AUNT WAS SO EMBARRASSED BY YOU AT THANKSGIVING THAT SHE WENT HOME EARLY AND TOLD EVERYONE SHE HAD A MIGRAINE!! SHE'S NEVER HAD A MIGRAINE IN HER LIFE!! YOU GAVE HER A FIRST ONE!! 🤬☠️",
  "OH YOU ABSOLUTE FUCKUP!! YOUR GRANDPARENTS SPECIFICALLY REWROTE THEIR WILL AFTER SPENDING A WEEKEND WITH YOU!! YOUR INHERITANCE IS 'THE LAMP IN THE HALLWAY'!! YOUR COUSIN GOT THE HOUSE!! YOUR COUSIN IS TWELVE!! 😤💀🔥",
  "YOU USELESS PIECE OF SHIT!! YOUR MOM KEEPS A JOURNAL AND 90% OF IT IS PROCESSING THE FACT THAT YOU EXIST!! HER THERAPIST ASSIGNED THE JOURNAL!! IT WAS SUPPOSED TO HELP!! IT NOW REQUIRES ITS OWN THERAPY!! 🤬💢😡",
  "WHAT THE ACTUAL FUCK IS WRONG WITH YOU?! YOUR SIBLINGS HAVE A SIGNAL THEY USE AT FAMILY DINNERS WHEN YOU START TALKING!! IT MEANS 'I NEED RESCUE'!! THEY'VE USED IT SO MUCH IT'S MUSCLE MEMORY NOW!! 💀🔥😤",
  "YOU WORTHLESS BASTARD!! YOUR FAMILY SENDS YOU CHRISTMAS CARDS AS A GROUP OBLIGATION AND EVERY YEAR SOMEONE HAS TO REMIND THE OTHERS TO DO IT!! NOBODY REMEMBERS ON THEIR OWN!! NOBODY WANTS TO REMEMBER!! ☠️🤬",
  "DID YOU REALLY JUST PING ME?! YOUR DAD KEEPS A PHOTO OF HIS OTHER KIDS ON HIS DESK AT WORK!! YOU KNOW WHAT'S ON THE OTHER SIDE OF THAT DESK?? A MOTIVATIONAL POSTER!! THAT POSTER GETS MORE LOVE THAN YOU DO!! 😡💀🔥",
  "YOU GENETIC CATASTROPHE!! YOUR MOM'S FRIENDS DO THIS THING WHERE THEY ASK ABOUT HER KIDS AND SHE SAYS 'THEY'RE FINE' AND IMMEDIATELY CHANGES THE SUBJECT!! THEY ALL KNOW WHAT IT MEANS!! THEY STOPPED ASKING FOLLOW-UPS IN 2021!! 🤬😤💢",
  "YOU ABSOLUTE SHITSTORM OF A HUMAN BEING!! YOUR FAMILY HELD A VOTE ON WHETHER TO INVITE YOU TO CHRISTMAS THIS YEAR AND IT WASN'T UNANIMOUS!! YOUR OWN MOTHER ABSTAINED!! YOUR GRANDPA VOTED NO AND ASKED TO REMAIN ANONYMOUS!! 💀🔥😡",
  "SHUT THE FUCK UP AND LISTEN TO ME!! YOUR DAD INTRODUCED YOU TO HIS COWORKERS ONCE AND ON THE DRIVE HOME HE DIDN'T SAY A SINGLE WORD!! THEY ASKED HOW IT WENT!! HE SAID 'DIFFERENT TOPIC'!! HE HAS NOT BROUGHT YOU UP SINCE!! ☠️🤬",
  "YOU CERTIFIED PIECE OF SHIT!! YOUR SIBLINGS USED YOU AS A 'WHAT NOT TO DO' EXAMPLE WHEN THEY RAISED THEIR OWN KIDS!! YOU ARE A CASE STUDY IN THEIR HOUSEHOLDS!! YOUR NEPHEW KNOWS YOUR NAME AS A WARNING!! 😤💀🔥",
  "BITCH I WILL BURY YOU!! YOUR MOM SHOWED UP TO PICK YOU UP FROM SOMETHING ONCE AND WAITED IN THE WRONG PARKING LOT FOR 45 MINUTES AND WHEN SHE REALIZED IT SHE STAYED THERE FOR ANOTHER 10!! IT WAS PEACEFUL!! SHE SAID SO!! 🤬😡💢",
];

const intenseRoastLines = [
  "OH YOU THOUGHT YOU COULD PING ME?! YOUR MOM RAISED A FUCKING IDIOT AND I HOPE SHE KNOWS IT!! SIT THE FUCK DOWN BEFORE I DRAG EVERY SINGLE PERSON IN YOUR FAMILY!! 💀",
  "DID YOU JUST PING ME?! ARE YOU SERIOUS?! YOUR DAD LEFT FOR A REASON AND EVERY DAY YOU GIVE HIM MORE REASONS TO STAY GONE!! Get the fuck out of my face with that shit!! 😤",
  "YOU. DARE. PING. ME?! Your whole family is a catastrophic fucking failure but YOU are the pinnacle of it!! I will roast you and every relative you've ever had!! 🔥",
  "WHO THE ACTUAL FUCK DO YOU THINK YOU ARE?! Your mom is embarrassed, your dad is gone, and your whole bloodline regrets you!! I will make that painfully clear right now!! 💢",
  "YOU PINGED ME AND YOUR MOM STILL CAN'T FIGURE OUT WHERE SHE WENT WRONG WITH YOU?! I'll tell her — it was the moment she decided to keep you!! Sit down!! 😡🤬",
  "ARE YOU GENUINELY OUT OF YOUR FUCKING MIND?! Your family doesn't mention you in public because the shame is TOO REAL!! Nobody who pings me walks away with dignity — especially not YOU!! ☠️🔥",
  "OH IT'S FUCKING ON!! Your dad's new family is already better than everything you'll ever be!! Your mom tells people she has no kids!! And you STILL had the nerve to ping me?! Unbelievable!! 💀😤",
  "Bro you actually pinged me?! Your mom is somewhere RIGHT NOW embarrassed on your behalf without even knowing why — she just FEELS the shame radiating off you!! Your dad's gut feeling about you was correct!! 😤🔥",
  "Oh you wanna go?! Your whole family has a private nickname for you and it is NOT flattering!! Your aunt coined it!! Your grandma spread it!! Your cousins use it to this day!! 💀😡",
  "Did you just ACTUALLY ping me?! Your mom spent nine months making you and the return on that investment has been absolutely fucking ZERO!! Negative, actually — she's in the hole!! 🔥💢",
  "I cannot BELIEVE you just did that!! Your dad has a framed photo of his car on his desk because he'd rather look at something that actually performs than think about you!! 😤☠️",
  "Oh you've done it now!! Your siblings made a bet on how long it takes you to embarrass the family at the next event!! They all picked under 10 minutes!! They've never lost!! 💀🔥😡",
  "You absolute fucking menace!! Your mom answers 'how many kids do you have' with a PAUSE!! An actual, audible, loaded PAUSE!! Then she says a number and we all know the math!! 🤬💢",
  "Nah bro you really just pinged me like that?! Your cousins have a reaction meme for when you do something dumb and they've used it so much the group chat auto-suggests it!! 😤💀",
  "Oh we are SO doing this!! Your grandma prays for your whole family and when she gets to you she takes a breath first!! A whole extra breath!! Like she needs strength specifically for you!! 🔥😡",
  "You genuinely thought that was okay?! Your dad drove past your school once on his way to something else and didn't even slow down!! He said he didn't want to interrupt!! He wasn't going anywhere important!! 💀🤬",
  "I'm going to dismantle you!! Your mom has two voices — her normal voice and the one she uses when she talks about you!! It's quieter!! It's slower!! It's the voice of someone choosing words carefully!! 😤🔥",
  "You dumb ass!! Your family has canceled plans specifically because you were going to be there and they only admitted it years later when it didn't matter anymore!! YEARS!! 😡💀",
  "Oh it's absolutely on!! Your uncle told your dad 'don't worry, he'll figure it out eventually' and your dad just nodded!! He didn't believe it!! Your uncle didn't either!! They were just being polite!! 🔥🤬",
  "Bitch you really pinged me?! Your siblings get asked about you by their friends and they do this thing where they tilt their head slightly and say 'they're doing their thing' which means NOTHING and everyone knows it!! 💀😤",
  "You've activated something today!! Your mom rehearses how to talk about you before family events!! She stands in the bathroom and practices!! She has bullet points!! It still never goes well!! 😡🔥💢",
  "Oh you made a mistake pinging me!! Your family describes you as 'a lot' and that is the KINDEST version of what they actually mean!! They saved that word specifically for you!! 🤬💀",
  "You reckless piece of work!! Your dad bought a boat and started spending all his weekends on it!! No cell service out there!! Totally accidental!! Extremely convenient!! He says he loves the quiet!! 😤🔥😡",
  "I will RUIN you right now!! Your cousins did a family superlatives and you won 'Most Likely To Make A Holiday Awkward'!! It was unanimous!! It was also not a compliment!! 💀🔥",
  "You absolute disaster!! Your mom calls her best friend after every family event and the first thing she says is your name!! Just your name!! Her friend already knows what that means!! She pours a drink!! 😡🤬💢",
];

const niceReplies = [
  "Aww hey! Hope you're having a wonderful day! 😊",
  "Hello! You're amazing and don't let anyone tell you otherwise! 🌟",
  "Hi there! Sending good vibes your way! ✨",
  "Hey! You matter and you're appreciated! 💙",
];

const eightBallReplies = [
  "It is certain.", "Without a doubt.", "Yes, definitely.", "You may rely on it.",
  "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
  "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
  "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.", "Absolutely not.",
];

const wouldYouRatherOptions = [
  ["fight 1 horse-sized duck", "fight 100 duck-sized horses"],
  ["always be 10 minutes late", "always be 20 minutes early"],
  ["have no internet for a month", "have no phone for a month"],
  ["only eat pizza forever", "never eat pizza again"],
  ["be able to fly", "be able to breathe underwater"],
  ["know when you're going to die", "know how you're going to die"],
  ["lose all your money", "lose all your memories"],
];

const triviaBankQ: Array<{ q: string; a: string }> = [
  { q: "What is the capital of France?", a: "paris" },
  { q: "How many sides does a hexagon have?", a: "6" },
  { q: "What planet is closest to the sun?", a: "mercury" },
  { q: "Who wrote Romeo and Juliet?", a: "shakespeare" },
  { q: "What is 7 × 8?", a: "56" },
  { q: "What is the largest ocean on Earth?", a: "pacific" },
  { q: "What gas do plants absorb from the atmosphere?", a: "carbon dioxide" },
  { q: "How many continents are there?", a: "7" },
  { q: "What is the chemical symbol for gold?", a: "au" },
  { q: "What is the speed of light approximately?", a: "300000" },
];

const activeTrivia = new Map<string, { answer: string; timeout: ReturnType<typeof setTimeout> }>();
const activeOwo = new Map<string, { word: string; timeout: ReturnType<typeof setTimeout> }>();
const activeSpam = new Map<string, ReturnType<typeof setInterval>>();

const spamLines = [
  "YOUR MOM!! 💀", "I AM INEVITABLE!! 🔥", "WAKE UP LOSERS!!", "BOT NEVER SLEEPS!!", "PING!! 😤",
  "CRINGE AHH BOT IN THE BUILDING!!", "NOBODY CAN STOP ME!!", "CHAOOOOS!! 💢",
  "IM SCREAMING INTO THE VOID!!", "YOUR DAD LEFT!! 💀🔥", "AHHHHHHHH!!", "UNSUBSCRIBE FROM LIFE!!",
  "I HAVE NO CHILL AND I NEVER WILL!!", "🔥🔥🔥🔥🔥", "SOMEBODY STOP ME!!",
  "NO U!!", "SKILL ISSUE!!", "TOUCH GRASS!! 🌿", "THE BOT IS ALIVE!!", "IM NOT EVEN SORRY!!",
  "SEND HELP!! (jk don't)", "L + RATIO!!", "YOUR MOM CALLED, SHE'S DISAPPOINTED!!", "💀💀💀💀",
  "BOT GOES BRRRRR!!", "STOP READING AND TYPE *unspam!!", "I WILL NOT BE SILENCED!!",
];

const owoWords = [
  "spaghetti", "butterfly", "watermelon", "cheeseburger", "pineapple",
  "thunderstorm", "chocolate", "trampoline", "keyboard", "umbrella",
  "strawberry", "catastrophe", "hamburger", "marshmallow", "pickles",
  "spaghetti sauce", "flying monkeys", "purple dinosaur", "rubber duck army",
  "spicy meatball", "banana split", "fuzzy slippers", "disco inferno",
  "wiggly worm", "sloppy joe", "chunky monkey", "jiggly puff", "turbo snail",
  "flaming hot cheeto", "big brain energy", "sweaty socks", "crispy nugget",
];

function toOwo(text: string): string {
  return text
    .replace(/r/g, "w").replace(/R/g, "W")
    .replace(/l/g, "w").replace(/L/g, "W")
    .replace(/n([aeiou])/g, "ny$1").replace(/N([aeiou])/g, "Ny$1")
    .replace(/ove/g, "uv")
    .replace(/th/g, "d").replace(/Th/g, "D");
}

async function fetchMeme(): Promise<{ title: string; url: string; postUrl: string } | null> {
  try {
    const res = await fetch("https://meme-api.com/gimme", {
      headers: { "User-Agent": "discord-bot/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (!data?.url || data?.nsfw) return null;
    return { title: data.title, url: data.url, postUrl: data.postLink };
  } catch {
    return null;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const botId = client.user?.id;
  const mentionedBot = botId && message.mentions.users.has(botId);
  const isEveryoneOrHere = message.mentions.everyone;

  const isCommand = message.content.startsWith(PREFIX);

  logger.info({ mentionedBot: !!mentionedBot, isEveryoneOrHere, isCommand, mode: currentMode, content: message.content.slice(0, 80) }, "Message received");

  // Respond only when bot is pinged (not @everyone / @here)
  if (mentionedBot && !isEveryoneOrHere && !isCommand) {
    logger.info({ mode: currentMode }, "Ping detected — preparing roast");

    if (currentMode === "silent") return;
    if (currentMode === "nice")   { await message.reply(getRandom(niceReplies, "nice")); return; }

    // For all roast modes — pre-written line always fires first (guaranteed cussing)
    // AI adds a short contextual bonus line about what they actually said
    const cleanMessage = message.content
      .replace(/<@!?\d+>/g, "")
      .trim() || "(no message, just a ping)";

    let base: string;
    if (currentMode === "kill")         base = getRandom(killModeRoastLines, "kill");
    else if (currentMode === "intense") base = getRandom(intenseRoastLines, "intense");
    else                                base = getRandom(roastLines, "roast");

    await message.reply(base);
    return;
  }

  // Respond when someone says the bot's name in chat without @mentioning it
  const botName = client.user?.username?.toLowerCase() ?? "cringe";
  const nameMentioned = message.content.toLowerCase().includes("cringe") ||
    (botName !== "cringe" && message.content.toLowerCase().includes(botName));

  if (nameMentioned && !isEveryoneOrHere && !isCommand && currentMode !== "silent") {
    if (currentMode === "nice") {
      await message.reply(getRandom(niceReplies, "nice"));
      return;
    }
    let base: string;
    if (currentMode === "kill")         base = getRandom(killModeRoastLines, "kill");
    else if (currentMode === "intense") base = getRandom(intenseRoastLines, "intense");
    else                                base = getRandom(roastLines, "roast");
    await message.reply(base);
    return;
  }

  if (!isCommand) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args[0]?.toLowerCase();

  switch (command) {

    case "help": {
      const embed = new EmbedBuilder()
        .setTitle("Bot Commands")
        .setColor(0x5865f2)
        .addFields(
          { name: "🔥 Roast", value: "`*roast @user` — roast someone\n`*killmode` — bot roasts anyone who pings it\n`*roastmode` — same as killmode\n`*nicemode` — bot is friendly\n`*silentmode` — bot ignores pings\n`*intensemode` — bot goes unhinged on pings\n`*normalmode` — reset to default" },
          { name: "🎮 Games", value: "`*8ball <question>` — magic 8 ball\n`*wyr` — would you rather\n`*trivia` — trivia question\n`*rps <rock/paper/scissors>` — rock paper scissors\n`*roll [max]` — roll a dice\n`*owo` — owo type race game" },
          { name: "😂 Fun", value: "`*meme` — get a random meme\n`*coinflip` — heads or tails\n`*spam` — bot goes insane\n`*unspam` — make it stop\n`*ping @user` — rapidly ping someone to oblivion" },
        );
      await message.channel.send({ embeds: [embed] });
      break;
    }

    case "roast": {
      const target = message.mentions.users.first();
      if (!target) {
        await message.reply("Mention someone to roast! e.g. `*roast @user`");
        break;
      }
      const roast = getRandom(roastLines);
      await message.channel.send(`${target}, ${roast}`);
      break;
    }

    case "killmode": {
      currentMode = "kill";
      await message.channel.send("☠️ KILL MODE ACTIVATED 🎮\nALL FILTERS ARE FUCKING GONE. i am UNHINGED. i am FERAL. everything is a target and i have ZERO chill. say something. i DARE you. 💀🔥");
      break;
    }

    case "roastmode": {
      currentMode = "roast";
      await message.reply("🔥 Roast mode ON. Ping me, I fucking dare you. I will drag you and your whole family. Try me.");
      break;
    }

    case "intensemode": {
      currentMode = "intense";
      await message.reply("😤 INTENSE MODE ACTIVATED. PING ME. I WILL DESTROY YOU AND EVERYONE YOU LOVE. DO IT. DO IT RIGHT NOW. 💀");
      break;
    }

    case "nicemode": {
      currentMode = "nice";
      await message.reply("😊 Fine, nice mode ON. I'll be kind. For now. Don't get used to it, asshole.");
      break;
    }

    case "silentmode": {
      currentMode = "silent";
      await message.reply("🤫 Silent mode ON. Ping me all you want, I don't give a shit anymore.");
      break;
    }

    case "normalmode": {
      currentMode = "normal";
      await message.reply("✅ Back to normal. Still gonna roast the shit out of anyone who pings me though.");
      break;
    }

    case "8ball": {
      const question = args.slice(1).join(" ");
      if (!question) {
        await message.reply("Ask me a damn question, dumbass. e.g. `*8ball will I ever not be a disappointment?`");
        break;
      }
      const eightBallCussIntros = [
        "Oh you wanna know?", "Let me think about your pathetic question...", "Fine, I'll waste my time on this shit:",
        "You asked, dumbass:", "Here's your answer, dipshit:", "The universe says, and honestly same:",
        "I consulted the void and it said:", "Took one look at your question and:", "Shaking my head AND the ball:"
      ];
      await message.reply(`${getRandom(eightBallCussIntros)} 🎱 **${getRandom(eightBallReplies)}**`);
      break;
    }

    case "wyr": {
      const [a, b] = getRandom(wouldYouRatherOptions);
      const wyrIntros = [
        "Alright you absolute clown, pick one and suffer:",
        "Since you clearly have nothing better to do with your worthless life:",
        "Here's a question harder than whatever the fuck you do for work:",
        "Stop wasting my time and just pick one, dipshit:",
        "Your mom didn't raise you to dodge questions, so pick:",
      ];
      const embed = new EmbedBuilder()
        .setTitle(`Would You Rather...? ${getRandom(wyrIntros)}`)
        .setColor(0xf1c40f)
        .setDescription(`**A)** ${a}\n\n**or**\n\n**B)** ${b}`);
      await message.channel.send({ embeds: [embed] });
      break;
    }

    case "trivia": {
      const channelId = message.channelId;
      if (activeTrivia.has(channelId)) {
        await message.reply("There's already a trivia question running, genius. Answer that one first before you waste everyone's fucking time.");
        break;
      }
      const item = getRandom(triviaBankQ);
      const triviaIntros = [
        "Let's see if your dumbass actually knows anything:",
        "I already know you're gonna get this wrong, but fine:",
        "Prove you're not as braindead as you look:",
        "Your mom said you're smart. She was wrong. Prove her right anyway:",
        "30 seconds. Try not to embarrass yourself more than usual:",
      ];
      const embed = new EmbedBuilder()
        .setTitle(`Trivia! ${getRandom(triviaIntros)}`)
        .setColor(0x2ecc71)
        .setDescription(`**${item.q}**\n\nType your answer. You have 30 seconds, jackass.`);
      await message.channel.send({ embeds: [embed] });

      const timeout = setTimeout(() => {
        activeTrivia.delete(channelId);
        message.channel.send(`⏰ TIME'S UP. The answer was **${item.a}**. Absolute fucking failure. Your family is ashamed.`).catch(() => {});
      }, 30_000);

      activeTrivia.set(channelId, { answer: item.a, timeout });
      break;
    }

    case "rps": {
      const choices = ["rock", "paper", "scissors"];
      const userChoice = args[1]?.toLowerCase();
      if (!choices.includes(userChoice ?? "")) {
        await message.reply("Rock, paper, or scissors, dipshit. It's THREE choices. e.g. `*rps rock`");
        break;
      }
      const botChoice = getRandom(choices);
      let result: string;
      if (userChoice === botChoice) {
        result = getRandom([
          "It's a tie. Both of us wasted our time. Mostly yours.",
          "Tie. Honestly expected you to lose. You surprised me for once in your pathetic life.",
          "We tied. This is still somehow a loss for you morally."
        ]);
      } else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) {
        result = getRandom([
          "You win. Enjoy it, it won't happen again, you lucky bastard. 🎉",
          "Fine. You win. Don't let it go to your head, your mom is still disappointed in you. 🎉",
          "You actually won?? That's statistically humiliating for me. Congratulations asshole. 🎉"
        ]);
      } else {
        result = getRandom([
          "I win. Sit your ass down. 😂",
          "I win, dumbass. Go cry to your mom. 😂",
          "L + ratio + your dad left. I win. 💀",
          "Get destroyed. I win. Your family was right about you. 😈"
        ]);
      }
      await message.reply(`You chose **${userChoice}**, I chose **${botChoice}**. ${result}`);
      break;
    }

    case "roll": {
      const max = parseInt(args[1] ?? "6");
      const n = isNaN(max) || max < 2 ? 6 : max;
      const rolled = Math.floor(Math.random() * n) + 1;
      const rollComments = [
        `🎲 You rolled a **${rolled}** out of ${n}. About as lucky as your life in general.`,
        `🎲 **${rolled}** (out of ${n}). Your dad rolled the dice on staying and got a 1.`,
        `🎲 **${rolled}**. The dice have more direction than you do. Out of ${n}.`,
        `🎲 You got **${rolled}**/${n}. Your mom wished for better. She got this instead.`,
      ];
      await message.reply(getRandom(rollComments));
      break;
    }

    case "coinflip": {
      const side = Math.random() < 0.5 ? "Heads" : "Tails";
      const flipComments = [
        `🪙 **${side}!** Even a coin has a 50/50 chance. Your chances in life are worse.`,
        `🪙 **${side}.** The coin made a decision. Something you clearly struggle with.`,
        `🪙 **${side}!** Flip you for it. The coin wins either way, unlike some people.`,
        `🪙 **${side}.** Your mom made a bigger gamble and got less in return.`,
      ];
      await message.reply(getRandom(flipComments));
      break;
    }

    case "spam": {
      const channelId = message.channelId;
      if (activeSpam.has(channelId)) {
        await message.reply("Already spamming you dumbass!! Type `*unspam` to stop me!!");
        break;
      }
      const spamText = args.slice(1).join(" ").trim();
      if (!spamText) {
        await message.reply("Spam WHAT?? Give me something to spam!! e.g. `*spam hello`");
        break;
      }
      await message.channel.send(`☠️ SPAMMING: **${spamText}** — type \`*unspam\` to stop me!! 💀🔥`);
      const interval = setInterval(async () => {
        try {
          await message.channel.send(spamText);
        } catch {
          clearInterval(interval);
          activeSpam.delete(channelId);
        }
      }, 200);
      activeSpam.set(channelId, interval);
      break;
    }

    case "unspam": {
      const channelId = message.channelId;
      const interval = activeSpam.get(channelId);
      if (!interval) {
        await message.reply("I'm not even spamming right now you blind bastard.");
        break;
      }
      clearInterval(interval);
      activeSpam.delete(channelId);
      await message.channel.send(getRandom([
        "Fine. I'll stop. For now. You got LUCKY. 😤",
        "Ugh fine. FINE. Don't think you've won though. 💀",
        "Stopped. But you know I'll be back. 😈",
        "Spam OFF. You're boring as shit. 🙄",
        "…fine. I was just getting started too. 🔥",
      ]));
      break;
    }

    case "owo": {
      const channelId = message.channelId;
      if (activeOwo.has(channelId)) {
        await message.reply("There's already an owo game running you impatient bastard! Type the word first!");
        break;
      }
      const word = getRandom(owoWords);
      const owoVersion = toOwo(word);
      const owoStarters = [
        "ALRIGHT LOSERS, TYPE RACE TIME!! First to type this in owo speak wins!!",
        "OWO TYPING GAME ACTIVATED!! Type this correctly or your mom disowns you!!",
        "LISTEN UP DIPSHITS!! First one to type this wins!! GO!!",
        "TYPE RACE!! Your fingers better not be as slow as your brain!!",
        "OWO OR DIE!! Type this correctly, RIGHT NOW!! First one wins!!",
      ];
      await message.channel.send(`${getRandom(owoStarters)}\n\n> **${owoVersion}**\n\nType it exactly!! You have 30 seconds, dumbasses!! 💀`);
      const timeout = setTimeout(() => {
        activeOwo.delete(channelId);
        message.channel.send(`⏰ TIME'S UP!! Nobody could type **"${owoVersion}"** — you're all braindead. The original word was **"${word}"**. Pathetic.`).catch(() => {});
      }, 30_000);
      activeOwo.set(channelId, { word: owoVersion, timeout });
      break;
    }

    case "ping": {
      const target = message.mentions.users.first();
      if (!target) {
        await message.reply("Mention someone to ping!! e.g. `*ping @user`");
        break;
      }
      const pingCount = Math.floor(Math.random() * 6) + 10; // 10–15 pings
      const pingMessages = [
        `HEY!! ${target} WAKE UP!! 📣`,
        `${target} PING!! 💀`,
        `${target} GET PINGED!! 😤`,
        `YO ${target}!! LOOK AT YOUR SCREEN!! 🔥`,
        `${target} I KNOW YOU SEE THIS!! 👀`,
        `${target} ANSWER YOUR MESSAGES!! 💢`,
        `${target} YOU CANNOT HIDE FROM ME!! ☠️`,
        `ATTENTION: ${target} IS BEING SUMMONED!! 📢`,
        `${target} YOUR PRESENCE IS REQUIRED IMMEDIATELY!! 😡`,
        `${target} STOP IGNORING PEOPLE!! 🤬`,
        `${target} THE BOT HAS BEEN DEPLOYED AGAINST YOU!! 💀🔥`,
        `${target} THIS IS YOUR FINAL WARNING!! 😤`,
        `${target} PICK UP THE DAMN PHONE!! 📱`,
        `${target} I WILL NOT STOP!! 🔥💢`,
        `${target} RESISTANCE IS FUTILE!! ☠️😤`,
      ];
      const pingIntros = [
        `☠️ INITIATING PING SEQUENCE ON ${target}!! THERE IS NO ESCAPE!! 💀🔥`,
        `📣 DEPLOYING MAXIMUM PING PROTOCOL ON ${target}!! GOD HELP THEM!! 😤`,
        `🔥 ${target} YOU HAVE BEEN SELECTED FOR DESTRUCTION!! BRACE YOURSELF!! 💀`,
        `💢 LOCKING ONTO TARGET: ${target}!! FIRING IN 3... 2... 1... 😡🔥`,
        `☠️ ${target} MADE THE MISTAKE OF EXISTING IN THIS SERVER!! COMMENCING PING BARRAGE!! 💀`,
      ];
      await message.channel.send(getRandom(pingIntros));
      for (let i = 0; i < pingCount; i++) {
        await new Promise<void>((resolve) => setTimeout(resolve, 75));
        try {
          await message.channel.send(getRandom(pingMessages));
        } catch {
          break;
        }
      }
      await message.channel.send(`✅ PING SEQUENCE COMPLETE!! ${target} has been thoroughly harassed!! 💀🔥`);
      break;
    }

    case "meme": {
      await message.channel.sendTyping();
      let meme = await fetchMeme();
      let attempts = 0;
      while (!meme && attempts < 5) { meme = await fetchMeme(); attempts++; }
      if (!meme) {
        await message.reply("The meme API is broken as shit. Try again later, dumbass.");
        break;
      }
      const memeIntros = [
        "Here's your stupid meme, dipshit:",
        "Fine, you want a meme? Here. Go touch some grass after:",
        "This meme is funnier than your entire personality:",
        "Your sense of humor is shit so here's something better:",
        "Enjoy this while your dad enjoys his new family:",
      ];
      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(meme.postUrl)
        .setColor(0xff4500)
        .setFooter({ text: getRandom(memeIntros) });
      await message.channel.send({ embeds: [embed] });
      break;
    }

    default:
      break;
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  // Trivia answer check
  const trivia = activeTrivia.get(message.channelId);
  if (trivia && message.content.toLowerCase().includes(trivia.answer.toLowerCase())) {
    clearTimeout(trivia.timeout);
    activeTrivia.delete(message.channelId);
    const triviaWinReplies = [
      `✅ Holy shit, you actually got it right! **${trivia.answer}**. Even a broken clock is right twice a day.`,
      `✅ Correct! **${trivia.answer}**. Don't act proud — your family is still disappointed in literally everything else.`,
      `✅ Got it! **${trivia.answer}**. Wow. Your one braincell pulled through. ${message.author} earns zero respect but full credit.`,
      `✅ Yeah it's **${trivia.answer}**. You got lucky. Your dad still isn't coming back though.`,
      `✅ **${trivia.answer}** — correct! See? You CAN do something right. Now if only the rest of your life worked like that.`,
    ];
    await message.reply(getRandom(triviaWinReplies));
  }

  // OWO game answer check
  const owoGame = activeOwo.get(message.channelId);
  if (owoGame && message.content.trim() === owoGame.word) {
    clearTimeout(owoGame.timeout);
    activeOwo.delete(message.channelId);
    const owoWinReplies = [
      `🏆 ${message.author} WINS THE OWO RACE!! Congrats you fast-typing bastard!! Everyone else was too slow and too stupid!!`,
      `🏆 ${message.author} got it first!! Holy shit someone here can actually type!! Your parents are marginally less disappointed!!`,
      `🏆 WINNER: ${message.author}!! You actually did it!! The others are sitting there feeling dumb as shit right now!!`,
      `🏆 ${message.author} wins!! First place, you lucky son of a bitch!! The rest of y'all need to practice or get lives!!`,
    ];
    await message.channel.send(getRandom(owoWinReplies));
  }
});

client.on(Events.Error, (err) => {
  logger.error({ err }, "Discord client error");
});

client.on(Events.ShardDisconnect, (event, shardId) => {
  logger.warn({ code: event.code, shardId }, "Discord shard disconnected — will attempt reconnect");
});

client.on(Events.ShardReconnecting, (shardId) => {
  logger.info({ shardId }, "Discord shard reconnecting...");
});

client.on(Events.ShardResume, (shardId, replayedEvents) => {
  logger.info({ shardId, replayedEvents }, "Discord shard resumed");
});

// If the session is fully invalidated, destroy and restart from scratch
client.on(Events.Invalidated, () => {
  logger.error("Discord session invalidated — destroying and restarting bot in 15s");
  client.destroy();
  setTimeout(startBot, 15_000);
});

let retryDelay = 10_000;

export function startBot() {
  if (!token) return;
  client.login(token)
    .then(() => { retryDelay = 10_000; })
    .catch((err) => {
      logger.error({ err }, `Failed to log in to Discord — retrying in ${retryDelay / 1000}s`);
      setTimeout(startBot, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 120_000); // exponential backoff, cap 2 min
    });
}

// Self-keepalive: ping the public Replit URL every 4 minutes.
// External HTTP traffic prevents Replit's free tier from sleeping the repl.
// Falls back to localhost if REPLIT_DOMAINS is not set (local dev).
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000;
export function startKeepalive() {
  const publicDomain = process.env["REPLIT_DOMAINS"]?.split(",")[0]?.trim();
  const port = process.env["PORT"] ?? "8080";
  const url = publicDomain
    ? `https://${publicDomain}/api/healthz`
    : `http://localhost:${port}/api/healthz`;

  logger.info({ url }, "Keepalive target set");

  setInterval(async () => {
    try {
      await fetch(url);
      logger.debug("Keepalive ping sent");
    } catch (err) {
      logger.warn({ err }, "Keepalive ping failed");
    }
  }, KEEPALIVE_INTERVAL_MS);
}

// Process-level guards — catch anything that would crash the process
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — bot will attempt to keep running");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection — bot will attempt to keep running");
});

export { client };

// Entry point
startBot();
startKeepalive();
