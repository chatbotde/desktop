import type { Spec } from '@json-render/core'

export const sampleBuddyJsonUiSpec: Spec = {
  root: 'main',
  elements: {
    main: {
      type: 'Stack',
      props: { direction: 'vertical', gap: 'lg', align: 'stretch' },
      children: ['intro-card', 'sep-1', 'ratio-heading', 'ratio-grid', 'button-row'],
    },
    'intro-card': {
      type: 'Card',
      props: {
        title: 'SonicThinking + json-render',
        description: 'Small catalog, predictable UI, generated from JSON.',
        maxWidth: 'full',
      },
      children: ['intro-text'],
    },
    'intro-text': {
      type: 'Text',
      props: {
        text: 'The model only sees SonicThinking primitives. The renderer handles composition, repeat, and bindings.',
        variant: 'muted',
      },
    },
    'sep-1': { type: 'Separator', props: { orientation: 'horizontal' } },
    'ratio-heading': {
      type: 'Heading',
      props: { text: 'Button image ratios', level: 'h3' },
    },
    'ratio-grid': {
      type: 'Grid',
      props: { columns: 3, gap: 'md' },
      children: ['ratio-card-a', 'ratio-card-b', 'ratio-card-c'],
    },
    'ratio-card-a': {
      type: 'Card',
      props: { title: '1:1', description: 'Icons, avatars, compact thumbnails' },
      children: ['ratio-text-a'],
    },
    'ratio-text-a': {
      type: 'Text',
      props: { text: 'Best when the image needs to scan quickly in a tight button.', variant: 'muted' },
    },
    'ratio-card-b': {
      type: 'Card',
      props: { title: '4:3', description: 'Screenshots, previews, product views' },
      children: ['ratio-text-b'],
    },
    'ratio-text-b': {
      type: 'Text',
      props: { text: 'A balanced choice when detail matters more than density.', variant: 'muted' },
    },
    'ratio-card-c': {
      type: 'Card',
      props: { title: '16:9', description: 'Video, tutorials, wide media' },
      children: ['ratio-text-c'],
    },
    'ratio-text-c': {
      type: 'Text',
      props: { text: 'Use for recognizable scenes and media-first actions.', variant: 'muted' },
    },
    'button-row': {
      type: 'Stack',
      props: { direction: 'horizontal', gap: 'md', align: 'center' },
      children: ['btn-primary', 'btn-secondary'],
    },
    'btn-primary': { type: 'Button', props: { label: 'Use compact', variant: 'default' } },
    'btn-secondary': { type: 'Button', props: { label: 'Compare all', variant: 'secondary' } },
  },
}
