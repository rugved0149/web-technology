export const clubs = [
  {
    id: 1,
    name: "CodeCraft Club",
    category: "Technical",
    description:
      "A community for students interested in programming, software development and emerging technologies.",
    members: 86,
    events: 12,
    coordinator: "Student Technical Council",
    color: "primary"
  },
  {
    id: 2,
    name: "Aarambh Cultural Club",
    category: "Cultural",
    description:
      "A platform for students to explore music, dance, theatre and cultural activities.",
    members: 124,
    events: 18,
    coordinator: "Cultural Committee",
    color: "danger"
  },
  {
    id: 3,
    name: "FrameLab",
    category: "Photography",
    description:
      "A creative community focused on photography, visual storytelling and media.",
    members: 48,
    events: 9,
    coordinator: "Media Cell",
    color: "warning"
  },
  {
    id: 4,
    name: "InnovateX",
    category: "Entrepreneurship",
    description:
      "Students collaborate on ideas, startups, innovation challenges and entrepreneurial projects.",
    members: 63,
    events: 7,
    coordinator: "Innovation Cell",
    color: "success"
  },
  {
    id: 5,
    name: "Literary Circle",
    category: "Literary",
    description:
      "A space for writing, reading, debates, public speaking and literary discussions.",
    members: 57,
    events: 11,
    coordinator: "Literary Committee",
    color: "info"
  },
  {
    id: 6,
    name: "Athletica",
    category: "Sports",
    description:
      "A student sports community promoting fitness, competition and teamwork.",
    members: 142,
    events: 15,
    coordinator: "Sports Committee",
    color: "secondary"
  }
];

export const events = [
  {
    id: 1,
    title: "CodeSprint 2026",
    club: "CodeCraft Club",
    category: "Technical",
    date: "2026-10-04",
    time: "10:00 AM",
    venue: "Innovation Lab",
    capacity: 120,
    registered: 86,
    description:
      "A competitive programming challenge covering algorithms, data structures and problem solving."
  },
  {
    id: 2,
    title: "Campus Photography Walk",
    club: "FrameLab",
    category: "Photography",
    date: "2026-10-08",
    time: "4:00 PM",
    venue: "Main Campus",
    capacity: 40,
    registered: 27,
    description:
      "Explore the campus through photography and learn practical visual storytelling techniques."
  },
  {
    id: 3,
    title: "Startup Idea Challenge",
    club: "InnovateX",
    category: "Entrepreneurship",
    date: "2026-10-12",
    time: "11:00 AM",
    venue: "Seminar Hall",
    capacity: 80,
    registered: 54,
    description:
      "Present and refine innovative ideas with fellow students and faculty mentors."
  },
  {
    id: 4,
    title: "Open Mic Evening",
    club: "Aarambh Cultural Club",
    category: "Cultural",
    date: "2026-10-17",
    time: "5:30 PM",
    venue: "Auditorium",
    capacity: 250,
    registered: 173,
    description:
      "An evening featuring music, poetry, stand-up, theatre and student performances."
  }
];

export const announcements = [
  {
    id: 1,
    title: "Club recruitment week begins",
    club: "Student Activities Office",
    date: "2026-09-20"
  },
  {
    id: 2,
    title: "CodeSprint registrations are now open",
    club: "CodeCraft Club",
    date: "2026-09-19"
  },
  {
    id: 3,
    title: "Photography club orientation announced",
    club: "FrameLab",
    date: "2026-09-18"
  }
];

export const categories = [
  "All",
  "Technical",
  "Cultural",
  "Sports",
  "Photography",
  "Literary",
  "Entrepreneurship"
];