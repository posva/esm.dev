<script lang="ts" setup>
const { open: openCal } = useCalButton()

const entries = [
  {
    question: 'What is the timezone you work in?',
    answer: 'Paris, France (CET/CEST).',
  },
  {
    question: 'Can you issue invoices?',
    answer: 'Yes, I have a French company for my freelancing.',
  },

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
    question: 'What languages do you work in?',
    answer: 'I can work in English, French, and Spanish.',
  },
] satisfies Array<{ question: string; answer: string }>

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
  return (
    qaList.value
      .map(({ item, matches }) => {
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
      // to have the best matches in the end
      .reverse()
  )
})
</script>

<template>
  <div
    class="relative mx-auto max-w-full w-[576px] h-[800px] overflow-hidden rounded-lg chat-container bg-slate-300/20 dark:bg-slate-700/20"
  >
    <Transition name="message-list">
      <div v-if="isOpen" class="w-full conversation">
        <header
          class="flex items-start w-full py-2 align-middle border-b-2 rounded-t-lg bg-slate-300/30 border-b-slate-400/20 dark:bg-slate-800/30 dark:border-b-slate-600/30 backdrop-blur-lg z-10 mb-[-86px] h-[86px] relative"
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
          class="px-2 py-5 overflow-y-scroll pt-[86px] pb-[68px] h-[800px] flex flex-col justify-end"
        >
          <FaqEntry v-for="{ question, answer } in highlightedResults">
            <p v-html="question"></p>

            <template #answer>
              <p v-html="answer"></p>
            </template>
          </FaqEntry>
        </main>

        <footer
          class="flex items-center w-full py-2 align-middle rounded-b-lg bg-slate-200/70 backdrop-blur-lg border-b-slate-800/20 dark:bg-slate-800/30 dark:border-b-slate-800/20 mt-[-68px] h-[68px]"
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
                class="flex-grow block bg-transparent border-none focus-visible:outline-none"
              />
              <button class="block w-8 h-8 ml-1 text-3xl rounded-full send">
                <Icon name="material-symbols:arrow-upward-alt-rounded" />
              </button>
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

          <div class="flex flex-col pl-6 mt-4 space-y-2 message-list">
            <div class="flex items-center" v-for="i in 4">
              <div class="w-16">
                <img
                  src="/logos/vuefire.svg"
                  class="object-contain rounded-full"
                />
              </div>

              <div class="flex-grow ml-2 select-none">
                <h3 class="font-bold message-number">+33 7 44 89 00 77</h3>
                <p
                  class="pb-2 pr-6 text-sm leading-tight border-b text-neutral-700 dark:text-neutral-400 border-b-slate-500/30 dark:border-b-slate-300/30 text-ellipsis"
                >
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Deserunt cupiditate quidem exercitationem omnis natus alias
                  quo delectus dolorem repellat, deleniti, ...
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
/* resets */
:deep(img),
h2,
h3,
p {
  margin: 0;
}

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

.message-list {
  height: 200px;
  overflow: hidden;
  mask: linear-gradient(180deg, #0000, #000 0% 80%, #0000);
}

.chat-container {
  --c-blue: rgb(25 139 254);
  font-family: 'SF Pro Display', 'SF Pro Icons', 'Helvetica Neue', 'Helvetica',
    'Arial', sans-serif;
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
