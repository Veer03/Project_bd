// ============================================================
// EVERYTHING PERSONAL LIVES HERE. Edit this file only.
// Replace placeholder photo paths in /assets and the song path
// once you have them — nothing else in the codebase needs to change.
// ============================================================

window.CONFIG = {
  herName: "Aurora24:)",

  // Plays continuously through the whole experience, starting the moment she enters her name.
  mainSong: "/assets/theAudio.mp3", // e.g. "assets/song.mp3" — leave "" to skip audio

  // --- Door 1: Photo room ---
  door1: {
    label: "the collage",
    photos: [
      // paths relative to index.html, e.g. "assets/photo1.jpg". 3 is the sweet spot for the scattered layout.
      "/assets/photo1.jpeg",
      "/assets/photo2.jpeg",
      "/assets/photo3.jpeg",
      "/assets/photo4.jpeg",
      "/assets/photo5.jpeg",
      "/assets/photo6.jpeg",
    ],
    questions: [
      "would y like to be the pam to this jim? :)",
      "you liking it so far?",
      "i hope y like tha pics, couldnt find a better ones",
    ],
    outro: "just dont let that heart of urs forget me, ",
  },

  // --- Door 2: Memories + puzzle room ---
  door2: {
    label: "the memory lane",
    memories: [
      "IDK if you remember but,..'do y have a name ?, or should i call you mine...'",
      "Do you remember i sent a letter to y in your book when i was on leave? i was such a weird guy...",
      "The annual function, we taking care of tha kids (y were doing a good job, depite the fact that they were calling y an auntie lol) also, i ditched my work to be there lol",
      "remember the last day? when we all were scribling, i can picture everything clearly, we shoke hands the last time that day",
      "nah we dont have enough memories together but i hope in the future we can change that:)",
      "ahh and the farewell, the saddest day of my life!!",
      "ahhhhaha i remember once i came to lakshya (told my dad that i wanna give their jee prep test), cuz i wanned to see y, but i wass to shy to come upstairs lol",
    ],
    // Simple word-guess puzzle. Letters only, no spaces, uppercase auto-handled.
    puzzleWord: "kyoro",
    puzzleHint: "A name that sounds similar to kyoto",
    puzzleSolvedLine:
      "say HI to em from me!. Do they even know me? i hope you've introduced me to em",
  },

  // --- Door 3: Birthday party room ---
  door3: {
    label: "the party",
    cakeMessage:
      "Happy Birthday Sachi, just dont let that ol heart of urs forget me, GOODLUCK!!",
  },

  // --- Final path: closing letter ---
  finalLetter:
    "I didn't got much time to make this better. At first i was confused about making this, but idk i just wanted to do somthing....i could have done better. I hope you know y are not just a normal girl to me :) and ill always feel the same about that. I hope you like this, and i hope you have a great birthday. I wish y the bEst. I just wanted to say that i care/adore y and ill always do. I hope we can meet soon, and i hope we can make crazy good memories together instead of barely even talking. , Happy Birthday Sachi!!",
  giftReveal:
    "le me know what y think, its fine if y cant resiprocate much things i typed here, just know that imma be here forever no matter how bad y fck up, dumbass:)(also i cannot see the things y type in here, so just voice rec on whatsapp or call and give some reviews:), cuz i wanna hear ur voice , its been a while... )",
};
