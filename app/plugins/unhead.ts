import { TemplateParamsPlugin } from '@unhead/vue/plugins'

export default defineNuxtPlugin({
  setup() {
    const unhead = injectHead()
    unhead.use(TemplateParamsPlugin)
  },
})
