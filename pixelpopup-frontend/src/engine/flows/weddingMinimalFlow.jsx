// src/engine/flows/weddingMinimalFlow.js
export const weddingMinimalFlow = {
  id: "wedding-minimal",
  start: "hero",

  nodes: {
    // -----------------------------------------
    // HERO
    // -----------------------------------------
    hero: {
      scene: "WeddingHeroScene",
      mutations: [
        { type: "set", path: "vars.theme", value: "minimal-elegant" },
        { type: "set", path: "vars.rsvp", value: null },
        { type: "set", path: "vars.lastTimelineId", value: null },
        { type: "set", path: "vars.lastPlaceId", value: null },
      ],
      props: {
        layout: "cover+circles",
        title: "WEDDING",
        subtitle: "You’re Invited",
        names: { bride: "Andrea", groom: "Mico" },
        dateLine: "Saturday • June 15, 2026 • 3:00 PM",
        locationLine: "Davao City • Philippines",
        photos: {
          coverUrl:
            "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1400&q=80",
          brideUrl:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
          groomUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
        },

        primaryText: "View Details",
        secondaryText: "RSVP",
      },
      on: {
        primary: "details",
        secondary: "rsvp",
        openSchedule: "schedule",
      },
    },

    // -----------------------------------------
    // DETAILS
    // -----------------------------------------
    details: {
      scene: "WeddingDetailsScene",
      props: {
        title: "Wedding Details",
        names: { bride: "Andrea", groom: "Mico" },
        details: {
          date: "Saturday, June 15, 2026",
          time: "3:00 PM",
          ceremony: "Ceremony at 3:00 PM",
          reception: "Reception to follow",
          venue: "Venue Name",
          address: "Davao City, Philippines",
          dressCode: "Formal / Semi-formal",
          theme: "Minimal Elegant",
        },
        primaryText: "RSVP",
        secondaryText: "Back",
      },
      on: {
        primary: "rsvp",
        secondary: "hero",

        openMap: "venueMap",
        openSchedule: "schedule",
        openGallery: "gallery",
        openMessages: "messages",
        openPersonalize: "personalize",
      },
    },

    // -----------------------------------------
    // SCHEDULE (Modern)
    // -----------------------------------------
    schedule: {
      scene: "WeddingScheduleScene",
      props: {
        title: "Ceremony Schedule",
        primaryText: "Back to Details",
        secondaryText: "RSVP",
        items: [
          {
            id: "arrival",
            time: "2:30 PM",
            title: "Guest Arrival",
            subtitle: "Registration + Seating",
            description:
              "Please arrive early for smoother seating. Ushers will guide you.",
          },
          {
            id: "ceremony",
            time: "3:00 PM",
            title: "Ceremony Proper",
            subtitle: "Vows + Rings",
            description:
              "Unplugged moment: please keep phones on silent during vows.",
          },
          {
            id: "photos",
            time: "4:00 PM",
            title: "Photo Time",
            subtitle: "Family + Friends",
            description:
              "Group photos right after ceremony. Stay nearby if you’re part of the list.",
          },
          {
            id: "reception",
            time: "5:30 PM",
            title: "Reception",
            subtitle: "Dinner + Program",
            description:
              "Dinner, speeches, games, and the first dance. Enjoy the night!",
          },
        ],
      },
      on: {
        primary: "details",
        secondary: "rsvp",
      },
    },

    // -----------------------------------------
    // GALLERY (Carousel)
    // -----------------------------------------
    gallery: {
      scene: "WeddingGalleryScene",
      props: {
        title: "Gallery",
        subtitle: "A few moments we love",
        images: [
          {
            id: "g1",
            url: "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1400&q=80",
            caption: "A quiet moment before the ceremony.",
          },
          {
            id: "g2",
            url: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=80",
            caption: "Golden light, golden day.",
          },
          {
            id: "g3",
            url: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=80",
            caption: "Celebration starts here.",
          },
        ],
        primaryText: "Back",
        secondaryText: "RSVP",
      },
      on: {
        primary: "details",
        secondary: "rsvp",
        back: "details",
        rsvp: "rsvp",
        default: "details",
      },
    },

    // -----------------------------------------
    // VENUE MAP (keep user inside map)
    // -----------------------------------------
    venueMap: {
      scene: "MapPanel",
      props: {
        showSidebar: true,
        title: "VENUE_MAP",
        popupTitle: "VENUE",
        defaultSelectedId: "venue",
        initialZoom: 14,
        showPopup: true,
        showPopupOnInit: true,
        places: [
          {
            id: "venue",
            title: "Wedding Venue",
            subtitle: "Ceremony + Reception",
            badge: "VENUE",
            description:
              "Tap Focus for center. Use sidebar to re-open popup. Click map to close popup.",
            lng: 125.6128,
            lat: 7.0731,
            mediaUrl:
              "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
          },
          {
            id: "parking",
            title: "Parking Area",
            subtitle: "Guest parking",
            badge: "PARK",
            description: "Suggested parking spot.",
            lng: 125.6109,
            lat: 7.0742,
            mediaUrl:
              "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
            mediaType: "image",
          },
        ],
        routes: [
          {
            id: "walk",
            points: [
              [125.6109, 7.0742],
              [125.6128, 7.0731],
            ],
            color: "rgba(255,255,255,0.85)",
            width: 3,
            dash: [1, 2],
          },
        ],
      },
      on: {
        "select:venue": {
          to: "venueMap",
          mutations: [{ type: "set", path: "vars.lastPlaceId", value: "venue" }],
        },
        "select:parking": {
          to: "venueMap",
          mutations: [{ type: "set", path: "vars.lastPlaceId", value: "parking" }],
        },
      },
    },

    // -----------------------------------------
    // GUEST MESSAGES (MAP-BASED)
    // -----------------------------------------
    messages: {
      scene: "WeddingGuestMessagesScene",
      props: {
        title: "Guest Messages",
        subtitle: "Video greetings from friends abroad",
        primaryText: "Back to Details",
        secondaryText: "RSVP",
        messages: [
          {
            id: "a1",
            from: "Kyla",
            country: "Canada 🇨🇦",
            note: "Miss you both!",
            videoUrl: "/guest/kyla.mp4",
            posterUrl: "/guest/kyla.jpg",
            // avatarUrl optional (otherwise posterUrl or initials)
            // avatarUrl: "/guest/kyla-avatar.jpg",
            lng: -79.3832,
            lat: 43.6532,
          },
          {
            id: "a2",
            from: "Jin",
            country: "Japan 🇯🇵",
            note: "Congrats!!",
            videoUrl: "/guest/jin.mp4",
            posterUrl: "/guest/jin.jpg",
            lng: 139.6917,
            lat: 35.6895,
          },
        ],
      },
      on: {
        primary: "details",
        secondary: "rsvp",
        back: "details",
        default: "details",
      },
    },

    // -----------------------------------------
    // PERSONALIZE (placeholder route for now)
    // -----------------------------------------
    personalize: {
      scene: "TypewriterPanel",
      props: {
        title: "PERSONALIZE (COMING SOON)",
        text:
          "Next we’ll add:\n- Couple photos upload (faces)\n- Names/date editing\n- Theme switch minimal/retro\n\nBack to details?",
        primaryText: "Back",
      },
      on: { primary: "details" },
    },

    // -----------------------------------------
    // RSVP
    // -----------------------------------------
    rsvp: {
      scene: "WeddingRSVPScene",
      props: {
        title: "RSVP",
        subtitle: "Please confirm your attendance",
        names: { bride: "Andrea", groom: "Mico" },
        primaryText: "Submit",
        secondaryText: "Back",
      },
      on: {
        done: "thankyou",
        cancel: "hero",
        default: "thankyou",
      },
    },

    // -----------------------------------------
    // THANK YOU
    // -----------------------------------------
    thankyou: {
      scene: "WeddingThankYouScene",
      props: {
        title: "Thank You",
        subtitle: "RSVP received",
        primaryText: "Back to Start",
      },
      on: {
        primary: "hero",
      },
    },
  },
};
