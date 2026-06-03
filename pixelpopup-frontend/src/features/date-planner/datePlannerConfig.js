/**
 * Date Planner — Sample Configuration
 *
 * All text, images, activities, time choices, and UI options
 * are driven by this config. Swap this object to create
 * a completely different date invitation experience.
 */

const datePlannerConfig = {
  theme: {
    title: "pixelDate",
    primaryColor: "#ff5c8a",
    secondaryColor: "#8b6fe8",
    background: "soft-pink",
    colorScheme: "pink",
  },

  /**
   * Steps define the flow order and progress bar labels.
   * Each step maps to a built-in step component by `id`.
   * You can reorder, remove, or add steps here.
   */
  steps: [
    { id: "invitation", label: "Invite", icon: "💌" },
    { id: "time", label: "Time", icon: "🕐" },
    { id: "activity", label: "Activity", icon: "🎯" },
    { id: "details", label: "Details", icon: "📝" },
    { id: "summary", label: "Summary", icon: "✨" },
  ],

  invitation: {
    dateLabel: "Saturday",
    question: "Go out with me\nthis Saturday?",
    subtitle: "I'd love to spend some time together. What do you say? 💕",
    yesText: "Yes",
    noText: "No",
    showHeartBetweenAvatars: false,
    noPopup: {
      emoji: "🥺",
      title: "Are you sure?",
      message: "Maybe think about it one more time?\nIt'll be really fun, I promise! 💕",
      buttonText: "Okay, let me reconsider 💗",
    },
  },

  users: [
    {
      id: "user1",
      name: "Mico Ang",
      avatar:
        "https://scontent.fcgy1-1.fna.fbcdn.net/v/t39.30808-6/582709706_25832332966368783_5057508273799410001_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHSr4eaomqk1FnK2kwpwNlAWkDnLlY28n9aQOcuVjbyf5FCqqLc3ttu5LtWDkohpIiMam7i6iWNIuskn0GnCzv8&_nc_ohc=SVn0ipcYpHQQ7kNvwGDsSmY&_nc_oc=Adpjak9v464wIIvGXw3LundnY0zbqv7mh0CnufDN3KkkrcTYIihPWETXlj9v3D57hBq4nLnA__avIPiO3YTaBASC&_nc_zt=23&_nc_ht=scontent.fcgy1-1.fna&_nc_gid=YK2karvD-gXxxs3Nv7G68g&_nc_ss=7b2a8&oh=00_Af8W5jznZoRHJBGUgkybeXSd7VFSQumJj-ho5XhoBF614Q&oe=6A262923",
    },
    {
      id: "user2",
      name: "Her Name",
      avatar:
        "https://scontent.fcgy1-3.fna.fbcdn.net/v/t51.82787-15/634798481_18362269393164618_1470202699984446643_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFDbKYeC7JQ5_dhAoNmxucNbuqxNNEwZBZu6rE00TBkFpsqrF7HFxF4yFxVrz6HVtuXVE8lki1b9UCZsDwyR5V5&_nc_ohc=Kn0Fkm0LBg4Q7kNvwH2uSw4&_nc_oc=Adp0N4cDa8070TmJHcMFV9X9iTx1zhqapJxWNnuUaXJlqqOtLCP45TBk8cKP4EOi6QtsLt0ZjLSEHh_VoepugIcx&_nc_zt=23&_nc_ht=scontent.fcgy1-3.fna&_nc_gid=ZD9s7X3w1SK008LM_X702Q&_nc_ss=7b2a8&oh=00_Af-tpgBZRMIcBMNpKjo0w3ab5MImwYJ73K9BuLzukYSLCg&oe=6A262672",
    },
  ],

  timeStep: {
    question: "What time are you available?",
    subtitle: "Choose a time that works for you.",
    options: [
      { id: "10am", label: "10:00 AM", icon: "☀️" },
      { id: "1pm", label: "1:00 PM", icon: "🌤️" },
      { id: "3pm", label: "3:00 PM", icon: "🌥️" },
      { id: "6pm", label: "6:00 PM", icon: "🌙" },
    ],
    allowCustom: true,
    customLabel: "Custom time",
    customIcon: "⏰",
    noteEnabled: true,
    noteLabel: "Add a note (optional)",
    notePlaceholder: "Anything you want to tell me?",
    saveButtonText: "Save Time",
    saveButtonIcon: "💗",
  },

  activityStep: {
    question: "What do you want to do?",
    subtitle: "Pick any that sound fun! (You can choose more than one) 🌟",
    nextButtonText: "Next",
    nextButtonIcon: "→",
  },

  activities: [
    {
      id: "movie",
      label: "Movie",
      description: "Cozy vibes &\ngood stories",
      image: "/images/date/movie.png",
      requiresDetails: true,
      detailType: "movie",
    },
    {
      id: "dinner",
      label: "Dinner",
      description: "Good food,\ngreat company",
      image: "/images/date/dinner.png",
      requiresDetails: true,
      detailType: "restaurant",
    },
    {
      id: "picnic",
      label: "Hangout &\nPicnic",
      description: "Relax outdoors\nand unwind",
      image: "/images/date/picnic.png",
      requiresDetails: false,
    },
    {
      id: "matcha",
      label: "Matcha",
      description: "Chill, sweet,\nand refreshing",
      image: "/images/date/matcha.png",
      requiresDetails: true,
      detailType: "matchaPlace",
    },
    {
      id: "pickleball",
      label: "Pickleball",
      description: "Fun rally,\nlight exercise",
      image: "/images/date/pickleball.png",
      requiresDetails: false,
    },
  ],

  detailOptions: {
    restaurant: {
      question: "Which Japanese restaurant in Davao do you want to try?",
      subtitle: "Here are some suggested Japanese spots. We can still change this later.",
      options: [
        {
          id: "yaki2gether",
          label: "Yaki2gether",
          description: "Japanese BBQ / yakiniku",
          image: "/images/date/restaurants/yaki2gether.png",
        },
        {
          id: "nonki",
          label: "Nonki Japanese Restaurant",
          description: "Classic Japanese food",
          image: "/images/date/restaurants/nonki.png",
        },
        {
          id: "tsuru",
          label: "Tsuru Restaurant and Sushi Bar",
          description: "Japanese and sushi",
          image: "/images/date/restaurants/tsuru.png",
        },
        {
          id: "yakimix",
          label: "Yakimix",
          description: "Japanese buffet option",
          image: "/images/date/restaurants/yakimix.png",
        },
        {
          id: "kaizen",
          label: "Kaizen Davao",
          description: "Japanese street dining",
          image: "/images/date/restaurants/kaizen.png",
        },
        {
          id: "yamashita",
          label: "Yamashita Diner",
          description: "Casual Japanese food",
          image: "/images/date/restaurants/yamashita.png",
        },
        {
          id: "marugame",
          label: "Marugame Udon",
          description: "Udon and Japanese meals",
          image: "/images/date/restaurants/marugame.png",
        },
        {
          id: "custom-restaurant",
          label: "Other Japanese Place",
          description: "Let her choose",
          image: "/images/date/restaurants/custom.png",
          allowCustom: true,
        },
      ],
    },

    movie: {
      question: "If movie, what do you want to watch at SM Lanang?",
      subtitle: "Movie schedules change often. Update this list before the date.",
      sourceNote: "Current options are based on SM Lanang Premier / SM Cinema listings.",
      options: [
        {
          id: "backrooms",
          label: "Backrooms",
          genre: "R-13",
          image: "/images/date/movies/backrooms.png",
        },
        {
          id: "love-ngo",
          label: "Love, Ngo",
          genre: "R-16",
          image: "/images/date/movies/love-ngo.png",
        },
        {
          id: "mobile-suit-gundam",
          label: "Mobile Suit Gundam",
          genre: "Anime / Action",
          image: "/images/date/movies/mobile-suit-gundam.png",
        },
        {
          id: "colony",
          label: "Colony",
          genre: "Now Showing",
          image: "/images/date/movies/colony.png",
        },
        {
          id: "star-wars-mandalorian-grogu",
          label: "Star Wars: The Mandalorian and Grogu",
          genre: "Sci-Fi / Adventure",
          image: "/images/date/movies/star-wars-mandalorian-grogu.png",
        },
        {
          id: "tayo-sa-wakas",
          label: "Tayo Sa Wakas",
          genre: "Now Showing",
          image: "/images/date/movies/tayo-sa-wakas.png",
        },
        {
          id: "slime-movie",
          label: "The Time I Got Reincarnated As A Slime the Movie",
          genre: "Anime",
          image: "/images/date/movies/slime-movie.png",
        },
        {
          id: "custom-movie",
          label: "Other Movie",
          genre: "Let her choose",
          image: "/images/date/movies/custom.png",
          allowCustom: true,
        },
      ],
    },

    matchaPlace: {
      question: "If matcha, where do you want to go in Davao?",
      subtitle: "Popular matcha spots around Davao.",
      options: [
        {
          id: "matcha-bar-marfori",
          label: "Matcha Bar at Marfori",
          description: "Recommended matcha spot",
          image: "/images/date/matcha/matcha-bar-marfori.png",
        },
        {
          id: "kisom-atelier",
          label: "Kisom Atelier",
          description: "Calm matcha cafe vibe",
          image: "/images/date/matcha/kisom-atelier.png",
        },
        {
          id: "kyoto-matcha",
          label: "Kyoto Matcha",
          description: "Japanese-style matcha",
          image: "/images/date/matcha/kyoto-matcha.png",
        },
        {
          id: "custom-matcha",
          label: "Other Matcha Place",
          description: "Let her choose",
          image: "/images/date/matcha/custom.png",
          allowCustom: true,
        },
      ],
    },
  },

  detailsStep: {
    meetLocationLabel: "Where do you want to meet?",
    meetLocationPlaceholder: "e.g., SM Lanang, Abreeza, or anywhere you prefer",
    meetLocationIcon: "📍",
    otherDetailsLabel: "Any other details?",
    otherDetailsPlaceholder: "Add notes, preferences, or anything else I should know...",
    otherDetailsMaxLength: 200,
    summaryLabel: "Date Plan Summary",
    sendButtonText: "Send Date Plan",
    sendButtonIcon: "💗",
  },

  finalStep: {
    title: "Date Plan Summary",
    subtitle: "Here's your final date plan ✨",
    saveImageText: "Save as Image",
    saveImageIcon: "🖼️",
    shareText: "Send to Me",
    shareIcon: "✈️",
    helperText: "Save the summary first, then send it. ✨",
    rows: {
      date: { icon: "📅", label: "Date" },
      time: { icon: "🕐", label: "Time" },
      activities: { icon: "💗", label: "Activities" },
      restaurant: { icon: "🍣", label: "Japanese Restaurant" },
      movie: { icon: "🎬", label: "Movie at SM Lanang" },
      matchaPlace: { icon: "🍵", label: "Matcha Place" },
      meetLocation: { icon: "📍", label: "Meet Location" },
      otherDetails: { icon: "📝", label: "Other Details" },
    },
  },

  footer: {
    text: "Made with love for memorable moments.",
    icon: "💗",
    sparkle: "✨",
  },
};

export default datePlannerConfig;