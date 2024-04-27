<script lang="ts" setup>
import FaqMessages from '~/components/content/FaqMessages.vue'

const { data } = await useAsyncData('oss-main', () =>
  queryContent('/open-source/_main').findOne()
)

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
      'I will dedicate a full day per month to help you with your projects.',
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
    description: 'Prioritize your issues and get help with your projects.',
  },

  {
    tier: 'Silver',
    height: 168,
    price: 250,
    icon: 'mdi:podium-silver',
    primary: '#838996',
    secondary: '#a2a9a9',
    text: '#000',
    description: 'Let me help you occasionally with your projects.',
  },

  {
    tier: 'Bronze',
    height: 168,
    price: 100,
    icon: 'mdi:podium-bronze',
    primary: '#CD7F32',
    secondary: '#A59264',
    text: '#fff',
    description:
      'As a Freelancer or Developer, you use Vue, you make decent money thanks to it and you want to give back.',
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
    description: 'Give back to the Open Source you use and love.',
  },
] satisfies Array<{
  height: number
  tier: string
  price: number
  icon: string
  primary?: string
  secondary?: string
  text: string
  shine?: 'lines' | 'spot' | 'crosses' | 'rainbow'
  description?: string
}>
</script>

<template>
  <main>
    <div
      class="w-full px-2 pt-16 mx-auto prose md:px-0 max-w-xxl lg:prose-xl dark:prose-invert"
    >
      <h1>Open Source Software</h1>

      <ContentQuery path="/open-source/_intro" find="one" v-slot="{ data }">
        <ContentRenderer :value="data" />
      </ContentQuery>

      <h2 id="for-companies">For Companies 🏢</h2>

      <ContentQuery
        path="/open-source/_for-companies"
        find="one"
        v-slot="{ data }"
      >
        <ContentRenderer :value="data" />
      </ContentQuery>

      <div class="grid w-full grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
        <PricingCard
          v-for="tier in tiers"
          :tier="tier.tier"
          :price="tier.price"
          :height="tier.height"
          :icon="tier.icon"
          :primary="tier.primary"
          :secondary="tier.secondary"
          :shine="tier.shine"
          :class="[
            tier.height > 200 && 'row-span-2 lg:col-span-2',
            tier.text === '#fff' ? 'text-slate-100' : 'text-slate-900',
          ]"
        >
          <template #back>
            <ul class="ml-2 leading-tight">
              <li>Perk 1</li>
              <li>Perk 2</li>
              <li>Perk 3</li>
            </ul>
          </template>
          <template #front>{{ tier.description }}</template>
        </PricingCard>
      </div>

      <h2 id="faq">F.A.Q.</h2>

      <FaqMessages />

      <h3>Thank you!</h3>

      <p>Thank you for getting til the very bottom of the page.</p>

      <div class="mx-auto max-w-full w-[400px]">
        <PlayableCard
          src="https://cdn.pastemagazine.com/www/articles/Gimme%20Five%20magic%20preview%20card.jpg"
        />
      </div>
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
