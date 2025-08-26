export interface ConferenceTalk {
  /**
   * Unique identifier for the talk. Can be repeated in the collection if the talk is given multiple times.
   */
  id: string
  title: string
  description: string
  /**
   * Duration of the talk in minutes.
   */
  duration?: number
  videoURL?: string | null
  slidesURL?: string
  /**
   * Date of the talk in ISO date string format.
   */
  date: string
  conference: string
  location?: string
  /**
   * Language of the talk in ISO 639-1 format. Defaults to English if not present.
   */
  language?: string
  tags: string[]
}

export const talks: ConferenceTalk[] = [
  // 2023
  {
    id: 'pinia-disasterclass',
    title: 'Pinia Disasterclass',
    description: `Pinia, the official state management solution for Vue 3, just reached 4 years old 🎉 which means we had enough time to see it in action, to see it succeed but also fail. In this example-driven talk, we will discuss some of the bad practices I've seen in Pinia as well as the good ones that should have been used instead.`,
    conference: 'Vue Toronto',
    date: '2023-11-09',
    tags: ['Vue', 'Pinia', 'Composition API'],
    duration: 30,
    location: 'Toronto, Canada',
    slidesURL: 'https://pinia-disasterclass.netlify.app',
    language: 'en',
    videoURL: null,
  },
]
