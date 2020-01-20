const PercyScript = require('@percy/script')

PercyScript.run(async (page, percySnapshot) => {
  await page.goto('http://localhost:5000')
  // ensure the page has loaded before capturing a snapshot
  await page.waitFor('#main')
  await percySnapshot('homepage')
})
