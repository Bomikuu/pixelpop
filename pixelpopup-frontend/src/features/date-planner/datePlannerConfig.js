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
      age: 27,
      avatar:
        "https://scontent.fcgy1-1.fna.fbcdn.net/v/t39.30808-6/582709706_25832332966368783_5057508273799410001_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHSr4eaomqk1FnK2kwpwNlAWkDnLlY28n9aQOcuVjbyf5FCqqLc3ttu5LtWDkohpIiMam7i6iWNIuskn0GnCzv8&_nc_ohc=SVn0ipcYpHQQ7kNvwGDsSmY&_nc_oc=Adpjak9v464wIIvGXw3LundnY0zbqv7mh0CnufDN3KkkrcTYIihPWETXlj9v3D57hBq4nLnA__avIPiO3YTaBASC&_nc_zt=23&_nc_ht=scontent.fcgy1-1.fna&_nc_gid=YK2karvD-gXxxs3Nv7G68g&_nc_ss=7b2a8&oh=00_Af8W5jznZoRHJBGUgkybeXSd7VFSQumJj-ho5XhoBF614Q&oe=6A262923",
      location: "Davao City 📍",
      occupation: "Frontend Developer 💻",
      vibe: "Soft vibes & good coffee ☕",
      tags: ["🎮 Gamer", "Cat Lover", "Fitness", "Anime"],
      disabled: false,
    },
    {
      id: "user2",
      name: "Blaize",
      avatar:
        "https://scontent.fcgy1-3.fna.fbcdn.net/v/t51.82787-15/634798481_18362269393164618_1470202699984446643_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFDbKYeC7JQ5_dhAoNmxucNbuqxNNEwZBZu6rE00TBkFpsqrF7HFxF4yFxVrz6HVtuXVE8lki1b9UCZsDwyR5V5&_nc_ohc=Kn0Fkm0LBg4Q7kNvwH2uSw4&_nc_oc=Adp0N4cDa8070TmJHcMFV9X9iTx1zhqapJxWNnuUaXJlqqOtLCP45TBk8cKP4EOi6QtsLt0ZjLSEHh_VoepugIcx&_nc_zt=23&_nc_ht=scontent.fcgy1-3.fna&_nc_gid=ZD9s7X3w1SK008LM_X702Q&_nc_ss=7b2a8&oh=00_Af-tpgBZRMIcBMNpKjo0w3ab5MImwYJ73K9BuLzukYSLCg&oe=6A262672",
      disabled: true,
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
      requiresDetails: true,
      detailType: "picnicPlace",
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
      requiresDetails: true,
      detailType: "pickleballCourt",
    },
  ],

  detailOptions: {
    restaurant: {
      question: "Which Japanese restaurant in Davao do you want to try?",
      subtitle: "Here are some suggested Japanese spots. We can still change this later.",
      options: [
        {
          id: "rammnikko",
          label: "Rammnikko Azuela Cove",
          description: "Japanese Food",
          image: "https://scontent.fcgy1-1.fna.fbcdn.net/v/t39.30808-6/298458727_438585314954188_4754181473320410334_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeG8HCX-7qYTTKvvuWo4WKY4LXzXNLiL10otfNc0uIvXSpTgFi8Y_AwuvSP_M1dIRt67Rzdh9Zku1owdmmqCdPW6&_nc_ohc=OzTEvHJqfNUQ7kNvwFdE5H_&_nc_oc=AdqOf9P29NTuc--9atAsX0TWExEC118XucL3cruvmBK39CSdW4dYaYt_DSi_Tuj2V9mu-XEH6mdP6THjAoeUOcwP&_nc_zt=23&_nc_ht=scontent.fcgy1-1.fna&_nc_gid=bvE2GPi_VP9xame7hHlubA&_nc_ss=7b2a8&oh=00_Af8HXjJtdk7npszzASzWktPT5JnhJH1KGW1Dnvp_0UdWig&oe=6A2771F7",
        },
        {
          id: "hime",
          label: "HIME Authentic Japanese Restaurant",
          description: "Tantanmen Ramen, Ebi tempura and Okonomiyaki",
          image:
            "https://scontent.fcgy1-1.fna.fbcdn.net/v/t39.30808-6/469908773_122109593012627637_6711661459780055759_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEH1jqpiPccb3_4mkbzo0ddBhgwTzb1Zi0GGDBPNvVmLV5TtwnHLA-2G9xPeNr5ZC52kbJJ-MSqAd4tvk-3fNQo&_nc_ohc=D9uFm0Q83vUQ7kNvwFGIkGz&_nc_oc=Adrttc2TfFawARf3W7Cg6gboCAvYc2dbPaKDHung049-yAhecj5VKGRCSVklIewYUzAorw9j9v5u1JBVBdARzyCe&_nc_zt=23&_nc_ht=scontent.fcgy1-1.fna&_nc_gid=WJbQA5aGu2cFYlVdiyFrPw&_nc_ss=7b2a8&oh=00_Af-kUXFflb9vRTdgbCHTcmuR8iHwPjCocB6AZXvd9clxuA&oe=6A277524",
          imageSource: "Stable public sushi/buffet image",
        },
        {
          id: "yaki2gether",
          label: "Yaki2gether",
          description: "Japanese BBQ / yakiniku",
          image:
            "https://yaki2gether.com/wp-content/uploads/2025/02/viber_image_2025-02-19_13-59-03-612.jpg",
          imageSource: "Yaki2gether official website",
        },
        {
          id: "nonki",
          label: "Nonki Japanese Restaurant",
          description: "Classic Japanese food",
          image:
            "https://nonki.ph/cdn/shop/products/maki-sushi-samp-tray-closeup.jpg?v=1638874549&width=480",
          imageSource: "Nonki official website",
        },
        {
          id: "tsuru",
          label: "Tsuru Restaurant and Sushi Bar",
          description: "Japanese and sushi",
          image:
            "https://m5.paperblog.com/i/60/600539/tsuru-japanese-restaurant-and-sushi-bar-davao-L-78B2et.jpeg",
          imageSource: "Paperblog / Tsuru Davao article",
        },
        {
          id: "kaizen",
          label: "Kaizen Davao",
          description: "Japanese street dining",
          image:
            "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public Japanese food image",
        },
        {
          id: "yamashita",
          label: "Yamashita Diner",
          description: "Casual Japanese ramen",
          image:
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public ramen image",
        },
        {
          id: "marugame",
          label: "Marugame Udon",
          description: "Udon and Japanese meals",
          image:
            "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public udon/noodle image",
        },
        {
          id: "custom-restaurant",
          label: "Other Japanese Place",
          description: "Let her choose",
          image:
            "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public sushi image",
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
          image: "https://smcine-digital-cdn.app.vista.co/media/entity/get/FilmPosterGraphic/HO00001519?width=200",
        },
        {
          id: "love-ngo",
          label: "Love, Ngo",
          genre: "R-16",
          image: "https://smcine-digital-cdn.app.vista.co/media/entity/get/FilmPosterGraphic/HO00001541?width=200",
        },
        {
          id: "colony",
          label: "Colony",
          genre: "Now Showing",
          image: "https://smcine-digital-cdn.app.vista.co/media/entity/get/FilmPosterGraphic/HO00001549?width=200",
        },
        {
          id: "star-wars-mandalorian-grogu",
          label: "Star Wars: The Mandalorian and Grogu",
          genre: "Sci-Fi / Adventure",
          image: "https://smcine-digital-cdn.app.vista.co/media/entity/get/FilmPosterGraphic/HO00001533?width=200",
        },
        {
          id: "tayo-sa-wakas",
          label: "Tayo Sa Wakas",
          genre: "Now Showing",
          image: "https://www.smcinema.com/films/Tayo-Sa-Wakas/HO00001518",
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
          image:
            "https://images.happycow.net/venues/1024/35/20/hcmp352013_2147035.jpeg",
          imageSource: "HappyCow Matcha Bar - Marfori photo",
        },
        {
          id: "kisom-atelier",
          label: "Kisom Atelier",
          description: "Calm matcha cafe vibe",
          image:
            "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public cafe image",
        },
        {
          id: "kyoto-matcha",
          label: "Kyoto Matcha",
          description: "Japanese-style matcha",
          image:
            "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public matcha/tea image",
        },
        {
          id: "custom-matcha",
          label: "Other Matcha Place",
          description: "Let her choose",
          image:
            "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public tea image",
          allowCustom: true,
        },
      ],
    },

    picnicPlace: {
      question: "Where do you want to have the picnic / hangout?",
      subtitle: "Beautiful outdoor spots around Davao City 🌿",
      options: [
        {
          id: "dgt",
          label: "Davao Global Township",
          description: "Scenic bay views & hangout spot",
          image:
            "https://sunday.ph/wp-content/uploads/dgt-banner@2x.jpg",
          imageSource: "Google place image",
        },
        {
          id: "croc-park",
          label: "Crocodile Park",
          description: "Nature & wildlife adventure",
          image:
            "https://lh5.googleusercontent.com/p/AF1QipOYCg3p9gMCbTcAE44OeF2Yj0V0P-YPQXsTX5N3=w600-h400-k-no",
          imageSource: "Google place image",
        },
        {
          id: "azuela-cove",
          label: "Azuela Cove",
          description: "Waterfront lifestyle destination",
          image:
            "https://i.pinimg.com/736x/4c/b6/fb/4cb6fbe221c457a369e758459eacb4bb.jpg",
          imageSource: "Google place image",
        },
        {
          id: "custom-picnic",
          label: "Other Place",
          description: "Let her choose",
          image:
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
          imageSource: "Stable public park/picnic image",
          allowCustom: true,
        },
      ],
    },

    // pickleballCourt: {
    //   question: "Where do you want to play pickleball in Davao?",
    //   subtitle: "Popular pickleball courts around Davao City 🏓",
    //   options: [
    //     {
    //       id: "abreeza-pickleball",
    //       label: "Abreeza Sports Hub",
    //       description: "Courts near Abreeza Mall",
    //       image:
    //         "https://lh5.googleusercontent.com/p/AF1QipOUxQlGS5P48lNn_r9HaSxLvuFEpXSrBvhLJjYt=w600-h400-k-no",
    //       imageSource: "Google place image",
    //     },
    //     {
    //       id: "davao-pickleball-club",
    //       label: "Davao Pickleball Club",
    //       description: "Dedicated pickleball facility",
    //       image:
    //         "https://lh5.googleusercontent.com/p/AF1QipNOjpxZP9EXKBI25aiFRvbhz3CVvBLyY8k7vSO-=w600-h400-k-no",
    //       imageSource: "Google place image",
    //     },
    //     {
    //       id: "jack-city-pickleball",
    //       label: "Jack City Sports Complex",
    //       description: "Multi-sport complex with courts",
    //       image:
    //         "https://lh5.googleusercontent.com/p/AF1QipMeKZ2Dl3jf6UCo_hNZ9gkV0S8dPiRxGhj0Q0S-=w600-h400-k-no",
    //       imageSource: "Google place image",
    //     },
    //     {
    //       id: "sm-lanang-courts",
    //       label: "SM Lanang Sports Area",
    //       description: "Convenient courts near SM Lanang",
    //       image:
    //         "https://lh5.googleusercontent.com/p/AF1QipNh2xGzCWNF9G7xnMrSHT1rWz0GVS9VE2bKPtEO=w600-h400-k-no",
    //       imageSource: "Google place image",
    //     },
    //     {
    //       id: "kadayawan-pickleball",
    //       label: "Kadayawan Sports Village",
    //       description: "Community courts in Davao",
    //       image:
    //         "https://lh5.googleusercontent.com/p/AF1QipOJ4q-cKgDT53rrWg0VdKLBUk0iZFG6tKzHBDj3=w600-h400-k-no",
    //       imageSource: "Google place image",
    //     },
    //     {
    //       id: "custom-pickleball",
    //       label: "Other Court",
    //       description: "Let her choose",
    //       image:
    //         "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80",
    //       imageSource: "Stable public sports court image",
    //       allowCustom: true,
    //     },
    //   ],
    // },
  },

  detailsStep: {
    meetLocationLabel: "Where do you want to meet?",
    meetLocationPlaceholder: "e.g., SM Lanang, Abreeza, or anywhere you prefer",
    meetLocationIcon: "📍",
    meetLocationOptions: [
      { id: "sm-lanang", label: "SM Lanang Premier", icon: "🏬" },
      { id: "abreeza", label: "Abreeza Mall", icon: "🏢" },
      { id: "gmall", label: "Gaisano Mall (GMall)", icon: "🏪" },
    ],
    meetLocationAllowCustom: true,
    meetLocationCustomLabel: "Somewhere else...",
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
      picnicPlace: { icon: "🌿", label: "Picnic Spot" },
      pickleballCourt: { icon: "🏓", label: "Pickleball Court" },
      meetLocation: { icon: "📍", label: "Meet Location" },
      otherDetails: { icon: "📝", label: "Other Details" },
    },
  },

  footer: {
    text: "Made with love by miku :>",
    icon: "💗",
    sparkle: "✨",
  },
};

export default datePlannerConfig;