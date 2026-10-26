// Choose a value in the app's custom Select (src/components/ui.jsx): open the
// trigger, click the option with that data-value, wait for the list to close.
// Usage: await pick(page, 'button[aria-label="Project"]', dealId)
export async function pick(page, triggerSelector, value) {
  const trigger = typeof triggerSelector === 'string' ? await page.waitForSelector(triggerSelector, { timeout: 8000 }) : triggerSelector
  const want = String(value)
  if ((await trigger.evaluate(b => b.dataset.value)) === want) return
  await trigger.click()
  const option = await page.waitForSelector(`.cselect-list [role=option][data-value="${want.replace(/["\\]/g, '\\$&')}"]`, { timeout: 5000 })
  await option.click()
  await page.waitForFunction(() => !document.querySelector('.cselect-list'), { timeout: 5000 })
}
