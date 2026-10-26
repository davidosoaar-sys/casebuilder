// Copy appearance only: preserve the new page's content, IDs and template layout.
export function inheritSlideStyle(slide, reference) {
  if (!reference) return slide
  const copy = value => value ? JSON.parse(JSON.stringify(value)) : {}
  return { ...slide, design: { ...copy(reference.design), ...slide.design },
    blocks: slide.blocks.map(block => {
      const match = reference.blocks.find(b => b.type === block.type && (b.type !== 'text' || b.style === block.style))
      return match?.design ? { ...block, design: { ...copy(match.design), ...block.design } } : block
    }) }
}
