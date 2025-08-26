<script lang="ts" setup>
const { open: openCal } = useCalButton()

const entries = [
  {
    question: 'What kind of contracts do you work with?',
    answer: `It's usually written and customized by the company I work for. I provide quotes and invoices.`,
  },

  {
    question: 'None of the slots work for me, what can I do?',
    answer:
      'Some time-zones can be challenging for me to cover 😅. Send me a message on 𝕏 or Discord.',
  },

  {
    question: 'Can I book a slot for a team?',
    answer:
      'Yes, you can book a slot for a team. You can be as many as you want in the call.',
  },
  {
    question: 'Can you issue invoices?',
    answer: 'Yes, I have a French company for my freelancing.',
  },

  {
    question: 'What is the timezone you work in?',
    answer: 'Paris, France (CET/CEST).',
  },

  {
    question: `Is it better to sponsor multiple people for less or a single person for more?`,
    answer: `It depends on your goal and the amount. For the long term, it's better to sponsor more people for less. In ther short term, it's better to sponsor a single person for more as that would allow them to dedicate more time to Open Source.`,
  },

  {
    question: `Why are tiers different between GitHub Sponsors and this page?`,
    answer: `With GitHub Sponsors I have different taxes than when I invoice you directly. For me, it's better if you sponsor through Freelancing (prices in this page).`,
  },

  {
    question: 'Can we talk about something else than Vue?',
    answer: `Yes, we can talk about anything you want, it doesn't have to be Vue. It could for example be about JavaScript, TypeScript, or even your career.`,
  },

  {
    question: 'What languages do you work in?',
    answer: 'I can work in English, French, and Spanish.',
  },

  {
    question: `If we don't book a slot in a month, do we lose it or do they accumulate for the next month?`,
    answer: `They accumulate for one month only. If you don't book a slot in a month, the next month you can book a slot that is twice as long but if you don't, the following month you will only be able to book a slot that is twice as long rather than three times as long.`,
  },

  {
    question: `Why don't you get a full-time job and work on Open Source on the side?`,
    answer: `I would if the libraries I created didn't require so much time to maintain. Going full-time on Open Source allows me to give them the attention they need.`,
  },

  {
    question: `What about other means of funding like a course, building a product, or ads?`,
    answer: `I have tried all of these, most have failed or haven't been as successful as I would have liked. I will likely build new things in the future again as it's still compatible with sponsorships.`,
  },
] satisfies Array<{ question: string; answer: string }>

const conversalionList = [
  {
    img: '/logos/vue.svg',
    title: 'Vue.js',
    preview: `Vue.js is a progressive framework for building user interfaces. Unlike other monolithic frameworks, Vue is designed from the ground up...`,
  },

  {
    img: '/logos/pinia.svg',
    title: 'Pinia',
    preview: `Pinia is the official state management solution for Vue. It's designed to be easy to use and understand while providing the necessary tools...`,
  },

  {
    img: '/logos/vuefire.svg',
    title: 'VueFire',
    preview: `VueFire is the official Firebase library for Vue.js. It also includes a Nuxt module that automatically...`,
  },

  {
    img: '/logos/vue-termui.svg',
    title: 'Vue TermUI',
    preview: `Vue TermUI is a Vue 3 custom renderer to build Terminal applications in Vue!`,
  },
] satisfies Array<{ img: string; title: string; preview: string }>

const isOpen = ref(true)

const searchText = ref('')
const { results: qaList } = useFuse(searchText, entries, {
  matchAllWhenSearchEmpty: true,
  fuseOptions: {
    keys: ['question', 'answer'],
    includeMatches: true,
    minMatchCharLength: 2,
    threshold: 0.5,
  },
})

const highlightedResults = computed(() => {
  if (searchText.value.length < 3) return entries

  return qaList.value.map(({ item, matches }) => {
    if (!matches?.length) return item

    const result = {
      question: '',
      answer: '',
    }

    for (const match of matches) {
      const { key, indices, value } = match as {
        key: 'answer' | 'question'
        indices: [start: number, end: number][]
        value: string
      }
      let currentIndex = 0
      // add the highlighted parts as <mark>
      for (const index of indices) {
        const [start, end] = index
        result[key] += value.slice(currentIndex, start)
        result[key] += `<mark>${value.slice(start, end + 1)}</mark>`
        currentIndex = end + 1
      }
      // add the rest of the string
      if (currentIndex < value.length) {
        result[key] += value.slice(currentIndex)
      }
    }

    return {
      question: result.question || item.question,
      answer: result.answer || item.answer,
    }
  })
})

const submitQuestionLink = ref<HTMLAnchorElement>()
const newQuestionLink = computed(
  () =>
    `https://github.com/posva/posva/discussions/new?category=q-a&labels=from-esm.dev&body=%3C!--%20add%20any%20extra%20information%20here%20--%3E&title=${encodeURIComponent(searchText.value)}`
)

function submitQuestion() {
  submitQuestionLink.value?.click()
}
</script>

<template>
  <div
    class="relative mx-auto max-w-full w-[576px] h-[800px] rounded-lg chat-container bg-slate-300/20 dark:bg-slate-700/20 not-prose overflow-hidden"
  >
    <Transition name="message-list">
      <div
        v-if="isOpen"
        class="w-full conversation h-[800px] overflow-y-auto relative border border-transparent"
      >
        <header
          class="flex items-start w-full py-2 align-middle border-b-2 rounded-t-lg bg-slate-300/30 border-b-slate-400/20 dark:bg-slate-800/30 dark:border-b-slate-600/30 backdrop-blur-lg z-10 mb-[-86px] h-[86px] sticky top-0"
        >
          <div class="mx-4 mt-2">
            <button @click="isOpen = false">
              <Icon
                name="material-symbols:arrow-back-ios"
                size="1.5em"
                class="action"
              />
            </button>
          </div>

          <div class="flex justify-center flex-grow align-middle">
            <div class="flex flex-col items-center space-y-1">
              <img src="/avatar.jpg" class="w-12 rounded-full" alt="Eduardo" />
              <span class="text-xs">Eduardo</span>
            </div>
          </div>

          <div class="mx-4 mt-2">
            <button @click="openCal('posva/sponsor')">
              <Icon name="ion:videocam-outline" size="1.5em" class="icon" />
            </button>
          </div>
        </header>

        <main
          class="px-2 pt-[86px] pb-[68px] flex flex-col-reverse justify-start min-h-[800px]"
        >
          <FaqEntry v-for="{ question, answer } in highlightedResults">
            <p v-html="question"></p>

            <template #answer>
              <p v-html="answer"></p>
            </template>
          </FaqEntry>
        </main>

        <footer
          class="flex items-center w-full py-2 align-middle rounded-b-lg bg-slate-200/70 backdrop-blur-lg border-b-slate-800/20 dark:bg-slate-800/30 dark:border-b-slate-800/20 mt-[-68px] h-[68px] sticky bottom-0"
        >
          <div
            class="flex items-center justify-center mx-2 rounded-full select-none w-9 h-9 bg-neutral-200/20"
          >
            <Icon name="iconamoon:sign-plus-fill" size="1.3em" class="" />
          </div>
          <div class="flex-grow py-1 pr-2">
            <div
              class="flex w-full py-[5px] pl-5 pr-[5px] bg-transparent border rounded-full border-neutral-400/20 dark:border-neutral-300/20 focus-visible:ring"
            >
              <input
                type="text"
                v-model="searchText"
                placeholder="Ask a question"
                @keypress.enter.exact="submitQuestion"
                class="flex-grow block bg-transparent border-none focus-visible:outline-none"
              />
              <a
                class="block w-8 h-8 ml-1 text-3xl rounded-full send"
                :href="newQuestionLink"
                ref="submitQuestionLink"
                target="_blank"
                rel="noopener"
              >
                <Icon name="material-symbols:arrow-upward-alt-rounded" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      <div v-else class="flex flex-col pt-6 list">
        <header class="mx-auto mb-6">
          <h2 class="block">F.A.Q.</h2>
        </header>

        <main class="flex flex-col">
          <div class="flex justify-center flex-grow align-middle">
            <button
              class="flex flex-col items-center space-y-1 select-none"
              @click="isOpen = true"
            >
              <img
                src="/avatar.jpg"
                class="block w-16 rounded-full shadow-md shadow-slate-950/40"
                alt="Eduardo"
              />
              <span class="text-xs">Eduardo</span>
            </button>
          </div>

          <div
            class="flex flex-col pl-6 mt-4 space-y-2 overflow-hidden message-list"
          >
            <div
              class="grid grid-flow-row h-[62px]"
              v-for="conversation in conversalionList"
            >
              <div class="w-16 h-16 py-2">
                <img
                  :src="conversation.img"
                  class="block w-full h-full"
                  :alt="conversation.title"
                />
              </div>

              <div class="flex-grow ml-2 select-none">
                <h3 class="font-bold message-number">
                  {{ conversation.title }}
                </h3>
                <p
                  class="pb-2 pr-6 text-sm leading-tight border-b text-neutral-700 dark:text-neutral-400 border-b-slate-500/30 dark:border-b-slate-300/30 text-ellipsis"
                >
                  {{ conversation.preview }}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.message-list-enter-active,
.message-list-leave-active {
  --duration: 300ms;
  transition:
    transform var(--duration) ease-out,
    opacity var(--duration) ease-out;
}

.message-list-leave-active {
  position: absolute;
}

.conversation {
  --translate-pos: 30%;
}
.list {
  --translate-pos: -25%;
}

.message-list-enter-from,
.message-list-leave-to {
  opacity: 0;
  transform: translateX(var(--translate-pos));
}

.message-number {
  font-size: 1rem;
}

.message-list > div {
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
}

.chat-container {
  --c-blue: rgb(25 139 254);
  font-family:
    'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', 'Helvetica', 'Arial',
    sans-serif;
  font-size: 18px;
  line-height: 1.43;
  font-weight: 400;
}

.send {
  background-color: var(--c-blue);
}

.send svg {
  width: 36px;
  height: 36px;
  transform: translate(-1.5px, -4px);
  color: white;
}

.chat-container input {
  font-size: 19px;
}

header .icon {
  color: var(--c-blue);
}
</style>
