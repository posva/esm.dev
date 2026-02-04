<script lang="ts" setup>
import FaqMessages from '~/components/content/FaqMessages.vue'

useHead({
  title: '🌐 Open Source',
})

const tiers = [
  {
    tier: 'Diamond',
    height: 326,
    price: 2_000,
    icon: 'streamline:shopping-jewelry-diamond-2-diamond-money-payment-finance-wealth',
    primary: '#b9f2ff',
    secondary: '#B9CFFF',
    text: '#000',
    shine: 'crosses',
    description:
      'You are all-in on Vue and its ecosystem! You want to get a lot exposure in Vue Router and Pinia docs. I will dedicate a full day per month to assist you with in your projects.',
    spots: 'Limited spots!',
    perks: [
      'Prioritized issues',
      '2 hours of dedicated consultancy work per month',
      'Big logo placement on Vue Router and Pinia docs (>3M impressions)',
      'Access to a private Discord',
      'My eternal appreciation for your support ❤',
    ],
  },

  {
    tier: 'Gold',
    height: 168,
    price: 500,
    icon: 'mdi:podium-gold',
    primary: '#d4af37',
    secondary: '#AE9B3C',
    // secondary: '#c5b358',
    text: '#000',
    description:
      'You really bet on Vue ecosystem and you could use some expert help in your projects. Prioritize your issues and get help with your projects.',
    spots: 'Limited spots!',
    perks: [
      'Prioritized issues',
      '1 hour of dedicated consultancy work per month',
      'Medium logo placement on Vue Router and Pinia docs (>3M impressions)',
      'Access to a private Discord',
      'My eternal appreciation for your support ❤',
    ],
  },

  {
    tier: 'Silver',
    height: 168,
    price: 250,
    icon: 'mdi:podium-silver',
    primary: '#838996',
    secondary: '#a2a9a9',
    text: '#000',
    description:
      'You run a business using Vue and other open-source software I contribute to. Let me help you occasionally with your projects.',
    spots: 'Limited spots!',
    perks: [
      'Prioritized issues',
      'Logo placement on Vue Router and Pinia docs (>3M impressions)',
      'Access to a private Discord',
      'My eternal appreciation for your support ❤',
    ],
  },

  {
    tier: 'Bronze',
    height: 168,
    price: 100,
    icon: 'mdi:podium-bronze',
    primary: '#CD7F32',
    secondary: '#A59264',
    text: '#fff',
    description: 'You use Vue, you make decent money thanks to it and you want to give back.',
    perks: [
      'Logo placement on the readmes of my projects (Includes Vue Router and Pinia)',
      'Access to a private Discord',
      'My eternal appreciation for your support ❤',
    ],
  },

  {
    tier: 'Supporter',
    price: 50,
    height: 168,
    icon: 'material-symbols:family-star',
    primary: '#76ff7a',
    secondary: '#76FFBF',
    // primary: '#9333ea',
    // secondary: '#3b82f6',
    text: '#000',
    shine: 'spot',
    description:
      'Give back to the Open Source you use and love. Simple and accessible, yet effective.',
    perks: ['Access to a private Discord', 'My eternal appreciation for your support ❤'],
  },
] satisfies Array<{
  height: number
  tier: string
  price: number
  icon: string
  spots?: string | null
  perks?: string[]
  primary?: string
  secondary?: string
  text: string
  shine?: 'lines' | 'spot' | 'crosses' | 'rainbow'
  description?: string
}>

const { data: contentIntro } = await useAsyncData('intro', () => {
  return queryCollection('content').path('/open-source/_intro').first()
})

const { data: contentForCompanies } = await useAsyncData('for-companies', () => {
  return queryCollection('content').path('/open-source/_for-companies').first()
})

const { data: contentForCompaniesAfter } = await useAsyncData('for-companies-after', () => {
  return queryCollection('content').path('/open-source/_for-companies-after').first()
})

const { data: contentForIndividuals } = await useAsyncData('for-individuals', () => {
  return queryCollection('content').path('/open-source/_for-individuals').first()
})

const { data: contentWorkingNow } = await useAsyncData('working-now', () => {
  return queryCollection('content').path('/open-source/_working-now').first()
})
</script>

<template>
  <main>
    <div class="w-full px-2 pt-16 mx-auto prose md:px-0 max-w-xxl lg:prose-xl dark:prose-invert">
      <h1>Open Source Software</h1>

      <ContentRenderer v-if="contentIntro" :value="contentIntro" />

      <h2 id="for-companies">For Companies 🏢</h2>

      <ContentRenderer v-if="contentForCompanies" :value="contentForCompanies" />

      <div class="grid w-full grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
        <PricingCard
          v-for="tier in tiers"
          :tier="tier.tier"
          :price="tier.price"
          :height="tier.height"
          :icon="tier.icon"
          :spots="tier.spots"
          :primary="tier.primary"
          :secondary="tier.secondary"
          :shine="tier.shine"
          :class="[
            tier.height > 200 && 'row-span-2 lg:col-span-2',
            tier.text === '#fff' ? 'text-slate-100' : 'text-slate-900',
          ]"
        >
          <template #back>
            <div class="not-prose">
              <ul class="ml-6 leading-tight list-disc" v-if="tier.perks">
                <li v-for="perk in tier.perks">{{ perk }}</li>
              </ul>
            </div>
          </template>
          <template #front>{{ tier.description }}</template>
        </PricingCard>
      </div>

      <ContentRenderer v-if="contentForCompaniesAfter" :value="contentForCompaniesAfter" />

      <h3 id="faq">F.A.Q.</h3>

      <FaqMessages />

      <h2 id="for-individuals">For individuals 🧑‍💻</h2>

      <ContentRenderer v-if="contentForIndividuals" :value="contentForIndividuals" />

      <h2 id="working-now">What are you working on right now?</h2>

      <ContentRenderer v-if="contentWorkingNow" :value="contentWorkingNow" />

      <h3>Thank you!</h3>

      <section class="text-center">
        <!-- TODO: make it interactive
      -->

        <!-- <SponsorsCircles />
      -->

        <a href="https://cdn.jsdelivr.net/gh/posva/sponsorkit-static@main/sk/circles.svg">
          <img
            src="https://cdn.jsdelivr.net/gh/posva/sponsorkit-static@main/sk/circles.svg"
            alt="posva's sponsors"
          />
        </a>

        <p>Thanks to all my sponsors and to <b>you</b> for getting til the bottom of the page!</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
:deep(.scrolling-list ul) {
  margin-top: 0;
  margin-bottom: 0;
}
:deep(.scrolling-list ul:nth-child(1) li:last-child) {
  margin-bottom: 0;
}
:deep(.scrolling-list ul:nth-child(2) li:first-child) {
  margin-top: 0;
}

ul,
li {
  margin-top: 0;
  margin-bottom: 0;
  padding: 0;
}
</style>
