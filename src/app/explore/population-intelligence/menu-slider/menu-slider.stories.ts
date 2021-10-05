import { moduleMetadata } from '@storybook/angular'
import { Story, Meta } from '@storybook/angular/types-6-0'
import { MenuSliderComponent } from './menu-slider.component'
import { MenuModuleTesting } from '../../menu.module.testing'

export default {
  title: 'menu/slider',
  component: MenuSliderComponent,
  decorators: [moduleMetadata(MenuModuleTesting)]
} as Meta

const Template: Story<MenuSliderComponent> = (args: MenuSliderComponent) => ({
  component: MenuSliderComponent,
  props: {
    wrapperClass: args.wrapperClass,
    sliderclass: args.sliderclass,
    label: args.label,
    labelClass: args.labelClass,
    minValue: args.minValue,
    maxValue: args.maxValue,
    value: args.value,
    hideValueLabel: args.hideValueLabel,
    steps: args.steps,
    animated: args.animated,
    animating: args.animating,
    animationDelay: args.animationDelay,
    ranged: args.ranged,
    minDistance: args.minDistance,
    maxDistance: args.maxDistance,
    disabled: args.disabled,
    valueChange: args.valueChange || function(d) { this.value = d },
    animatingChange: args.animatingChange || function(d) { this.animating = d },
    onResize: args.onResize,
    onClick: args.onClick,
    onValueChange: args.onValueChange,
    onAnimationStart: args.onAnimationStart,
    onAnimationEnd: args.onAnimationEnd
  }
})

const makeArgs = (args = null) => {
  return Object.assign({
    wrapperClass: 'storybook-slider',
    minValue: 0,
    maxValue: 10,
    value: 0
  }, args)
}

export const InitialState = Template.bind({})
InitialState.args = makeArgs()

export const WithLabels = Template.bind({})
WithLabels.args = makeArgs({label: 'Favorite number 1-10'})


export const HideValueLabels = Template.bind({})
HideValueLabels.args = makeArgs({hideValueLabel: true})

export const CustomRange = Template.bind({})
CustomRange.args = makeArgs({ minValue: 12, maxValue: 54, value: 22 })

export const Animated = Template.bind({})
Animated.args = makeArgs({ animated: true })

export const Animating = Template.bind({})
Animating.args = makeArgs({ animated: true, animating: true })

export const SlowAnimating = Template.bind({})
SlowAnimating.args = makeArgs({ animated: true, animating: true, animationDelay: 1000 })

export const Ranged = Template.bind({})
Ranged.args = makeArgs({ ranged: true })

export const MinDistanceRanged = Template.bind({})
MinDistanceRanged.args = makeArgs({ ranged: true, minDistance: 3})

export const RangedAnimated = Template.bind({})
RangedAnimated.args = makeArgs({ ranged: true, animated: true, animating: true })

export const MinDistanceRangedAnimated = Template.bind({})
MinDistanceRangedAnimated.args = makeArgs({ ranged: true, minDistance: 3, animated: true, animating: true })

const people = [
  {text: 'Gina', value: 'gina'},
  {text: 'Bob', value: 'bob'},
  {text: 'Rich', value: 'rich'},
  {text: 'Gary', value: 'gary'}
]
export const Steps = Template.bind({})
Steps.args = makeArgs({ steps: people, value: people[0].value, maxValue: people.length - 1 })

export const RangedSteps = Template.bind({})
RangedSteps.args = makeArgs({ ranged: true, steps: people, minDistance: 1, value: {min: 'gina', max: 'bob' }, maxValue: people.length - 1 })
